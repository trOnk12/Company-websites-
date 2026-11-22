---
title: How much may it use?
short: cgroups, memory limits and CPU quotas
summary: The namespaces of puzzles 2 to 5 decide what a container can see. Nothing so far stops it from taking all of the machine's memory or processor time. Here's the other half of the fence, and what happens at its edge.
takeaway: Namespaces limit what a process sees; a cgroup limits how much it uses. Docker puts each container in one: --memory sets a memory limit, and past it the kernel kills a process in the group (Docker reports exit code 137); --cpus sets a CPU quota per 100 ms period. No namespace hides the host's size, so free inside a limited container still reports the whole machine.
---

## The problem

Every fence so far changes what a container can see: other processes, the host's files, its name, its network, who it is. None of them limits how much it takes. A container with a memory leak, or a busy loop, competes for the same memory and processors as everything else on the host, on the one kernel puzzle 1 found. On a server running twenty containers, one bad one could starve the other nineteen. What stops it?

## See it

```diagram cgroup-limits
```

## The building block

A **cgroup**, short for control group, is a group of processes whose use of resources the kernel counts and limits: memory, processor time, the number of processes and more. A process starts in its parent's group, so everything a container's first process starts stays in the container's group. Docker creates a group for each container and puts the container's first process in it. You can see which, from the host:

```
$ grep memory /proc/1363/cgroup
4:memory:/docker/845b46b350620c1fe96abcd5719f6e66d90c565c0f06b7df7e79f1812c7496fd
```

The groups are folders under /sys/fs/cgroup, and the limits are files in them, which you can read like any file. (Here 1363 is the host PID of a container started with limits, named lim.)

A **memory limit** is the most memory the group's processes may use together. `docker run --memory 64m` wrote it:

| File in the container's group | Value | Meaning |
| --- | --- | --- |
| memory.limit_in_bytes | 67108864 | 64 MB as the kernel counts it (64 × 1024 × 1024 bytes): the limit |
| memory.usage_in_bytes | 700416 | about 0.7 MB in use by sleep |
| the same limit file, for box (no `--memory`) | 9223372036854771712 | no limit: the largest number the file holds |

When the group's usage reaches the limit, the kernel first tries to take memory back from the group (it counts file data it keeps cached for the group, too). If it can't bring usage down, it kills a process in the group. On the run behind this page, tail (made to keep taking memory) reached 64 MB and the kernel's log said:

```
Memory cgroup out of memory: Killed process 1731 (tail) total-vm:66648kB, anon-rss:65024kB, ...
```

Docker reported the container's exit code as 137 and marked it OOMKilled (out of memory). Which code means what, and how to size a program so it stays under its line, is Module 6 (coming soon).

The trap is what the program sees from inside. `free -m` printed 16088 MB in the 64 MB container: free reads /proc's memory figures, and those describe the machine. No namespace hides them and the cgroup doesn't change them. A program that looks at the machine's memory to decide how much to use will plan for 16 GB and be killed at 64 MB. How a Java runtime finds its real limit is in Module 6 (coming soon).

A **CPU quota** limits processor time. `--cpus 0.5` wrote two numbers into the group's cpu files: a period of 100000 microseconds (100 ms) and a quota of 50000 (50 ms). In every 100 ms, the group's processes together may run for 50 ms; once they've used it, the kernel makes them wait for the next period, even if every processor is idle. The quota counts all of the group's processors together: two threads running side by side use it up twice as fast. (Docker's other CPU option, `--cpu-shares`, is different: a weight that only counts when processors are busy.)

On a machine that uses the newer cgroup version 2 (`docker info` shows Cgroup Version), the same limits live in files called memory.max and cpu.max ("50000 100000"); the test machine behind this page uses version 1.

Namespaces and cgroups are separate settings, which is why the puzzles split them: a container can share the host's PID namespace and still have a memory limit, or have every namespace and no limit at all, as box did.

## The analogy

Each flat in the building has its own electricity meter and fuse, fitted by the caretaker. The meter counts what the flat draws; at the fuse's rating, the power goes off in that flat only, and the rest of the building keeps its lights on. The household's own clock and the building's notice board still say the building has 16 GB of power: nothing on the wall tells them about the fuse. The processor is a shared washing machine with a timer: half of every hour, then wait, even if nobody else is using it.

## Run it yourself

On a Linux machine with Docker that uses cgroup version 1, as the administrator. (On version 2, read memory.max and cpu.max instead, in the folder that /proc/PID/cgroup names.) Predict the free total, and the last exit code, before you run.

```sh
docker run -d --name lim --memory 64m --cpus 0.5 alpine:3.20 sleep 1000
ID=$(docker inspect -f '{{.Id}}' lim)
cat /sys/fs/cgroup/memory/docker/$ID/memory.limit_in_bytes
cat /sys/fs/cgroup/cpu/docker/$ID/cpu.cfs_quota_us /sys/fs/cgroup/cpu/docker/$ID/cpu.cfs_period_us
docker exec lim free -m
docker run --name oom --memory 64m --memory-swap 64m alpine:3.20 sh -c 'tail /dev/zero'; echo $?
docker inspect -f '{{.State.OOMKilled}} {{.State.ExitCode}}' oom
docker rm -f lim oom
```

`docker inspect` prints a container's details; `--memory-swap 64m` makes the limit cover swap too (disk space the kernel can use as extra memory), so the test can't escape to the disk. `tail /dev/zero` reads an endless stream of zero bytes and keeps them all in memory. Output from the run behind this page:

```
67108864
50000
100000
              total        used        free      shared  buff/cache   available
Mem:          16088         435       14186          13        1467       15389
137
true 137
```

## Check yourself

- A container started with a 256 MB memory limit on a 16 GB host runs a program that sizes its cache to a quarter of the total memory free reports. What happens as the cache fills?::*It aims for about 4 GB and is killed near 256 MB||It builds a 64 MB cache, a quarter of 256 MB >> free reports the host's total; the program never sees the limit. >> s4||It gets its 4 GB, since the host has memory to spare >> The cgroup's limit holds however much the host has free. >> s5::It plans from the host's figure and meets the group's limit.
- A container with `--cpus 0.5` runs alone on an idle machine with 4 processors. Why does a busy loop inside get only half of one processor's time?::*Its quota is 50 ms per 100 ms, idle processors or not||The other processors are kept for the host's own programs >> Nothing is reserved; the cap is this group's quota. >> s6||The kernel slows every container when the machine is busy >> The machine is idle; only this group's quota applies. >> s6::A quota is a cap, not a share.
- Which fence stops a container from seeing the host's processes, and which stops it from using all the memory?::*The PID namespace, then the cgroup||The cgroup, then the PID namespace >> Namespaces fence what a process sees; cgroups limit how much it uses. >> s1||The PID namespace, for both >> A namespace hides processes but never limits memory: box had all its namespaces and no limit. >> s1::See with namespaces, use with cgroups.

## Sources

- [Linux manual: cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html) ("A child process created via fork(2) inherits its parent's cgroup memberships."; "Control groups, usually referred to as cgroups, are a Linux kernel feature which allow processes to be organized into hierarchical groups whose usage of various types of resources can then be limited and monitored. The kernel's cgroup interface is provided through a pseudo-filesystem called cgroupfs."; "within each scheduling period (defined via a file in the cgroup directory), it is possible to define an upper limit on the CPU time allocated to the processes in a cgroup.")
- [Linux kernel docs: Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) (memory.max: "Memory usage hard limit. This is the main mechanism to limit memory usage of a cgroup. If a cgroup's memory usage reaches this limit and can't be reduced, the OOM killer is invoked in the cgroup."; cpu.max: "The default is “max 100000”."; "which indicates that the group may consume up to $MAX in each $PERIOD duration.")
- [Docker docs: Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/) ("By default, a container has no resource constraints and can use as much of a given resource as the host's kernel scheduler allows."; "By default, if an out-of-memory (OOM) error occurs, the kernel kills processes in a container."; "if the host machine has two CPUs and you set --cpus=\"1.5\" , the container is guaranteed at most one and a half of the CPUs. This is the equivalent of setting --cpu-period=\"100000\" and --cpu-quota=\"150000\" ."; --cpu-shares: "This is only enforced when CPU cycles are constrained.")
- [Docker docs: Docker Engine security](https://docs.docker.com/engine/security/) ("They implement resource accounting and limiting."; "a single container cannot bring the system down by exhausting one of those resources.")
- [OCI runtime spec v1.3.0: config-linux.md](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/config-linux.md) (memory `limit`: "sets limit of memory usage"; cpu `quota`: "specifies the total amount of time in microseconds for which all tasks in a cgroup can run during one period")
- All values and output on this page were read in this session with Docker Engine 29.9.2 on Linux 6.18.44, with cgroup version 1 (docker info: "Cgroup Version: 1"). The cgroup version 2 file names come from the kernel documentation above and were not read on this machine.
