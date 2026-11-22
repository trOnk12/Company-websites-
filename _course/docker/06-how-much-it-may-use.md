---
title: How much memory may it use?
short: cgroups and the memory limit
summary: The namespaces of puzzles 2 to 5 decide what a container can see. Nothing so far stops it from taking all of the machine's memory. Here's the other half of the fence, what happens at its edge, and why the program inside never sees it.
takeaway: Namespaces limit what a process sees; a cgroup limits how much it uses. With --memory, Docker sets the container's cgroup a memory limit, and past it the kernel kills a process in the group; if that process is the container's PID 1, the container stops and Docker reports exit code 137 and OOMKilled true. No namespace hides the host's size, so free inside a limited container still reports the whole machine.
---

## The problem

Every fence so far changes what a container can see: other processes, the host's files, its name, its network, who it is. None of them limits how much it takes. A container with a memory leak competes for the same memory as everything else on the host, on the one kernel puzzle 1 found. On a server running twenty containers, one bad one could starve the other nineteen. What stops it?

## See it

```diagram memory-limit
```

## The building block

A **cgroup**, short for control group, is a group of processes whose use of resources the kernel counts and limits: memory, processor time, the number of processes and more. A process starts in its parent's group, so everything a container's first process starts stays in the container's group. Docker (puzzle 8 shows which of its programs) creates a group for each container and puts the container's first process in it. The groups are folders under /sys/fs/cgroup, and the limits are files in them, which you can read like any other file.

A **memory limit** is the most memory the group's processes may use together. `docker run --memory 64m` writes it. The file it lands in depends on the cgroup version of the machine. Most machines today use cgroup version 2: Docker's documentation lists Ubuntu since 21.10, Debian since 11 and Fedora since 31 (`docker info` shows Cgroup Version). There the limit is the file memory.max. The test machine behind this page is an exception: it uses the older version 1, which Docker 29 deprecates, so its file is called memory.limit_in_bytes. The values mean the same:

| What | Version 2 file | Version 1 file (read on the test machine) | Value |
| --- | --- | --- | --- |
| the limit | memory.max | memory.limit_in_bytes | 67108864: 64 MB as the kernel counts it (64 × 1024 × 1024 bytes) |
| in use now | memory.current | memory.usage_in_bytes | 700416: about 0.7 MB, used by sleep |
| the limit, for box (no `--memory`) | memory.max says max | memory.limit_in_bytes | 9223372036854771712: a value so large it means no limit |

From inside the container, one command reads whichever file exists:

```
$ docker exec lim sh -c 'cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes'
67108864
```

When the group's usage reaches the limit, the kernel first tries to take memory back from the group (it counts file data it keeps cached for the group, too). If it can't bring usage down, it kills a process in the group. On the run behind this page, tail (made to keep taking memory) reached 64 MB and the kernel's log said:

```
Memory cgroup out of memory: Killed process 11840 (tail) total-vm:66640kB, anon-rss:65024kB, ...
```

tail was the container's first process (sh, given one command, handed its PID 1 to tail), so the container stopped: Docker reported exit code 137, which is 128 + 9, the number of the kill signal, and marked it OOMKilled (out of memory). Had the kernel killed a child instead, PID 1 would carry on: the container keeps running, or exits with PID 1's own code, and OOMKilled is still true. The run behind this page did exactly that, with sh as PID 1 running tail, then printing tail's exit code, then sleeping a second: sh printed "sh saw 137", the container exited 0, and docker inspect said OOMKilled true. How to read exit codes in general is Module 4 (coming soon).

The trap is what the program sees from inside. `free -m` printed 16088 MB in the 64 MB container: free reads /proc's memory figures, and those describe the machine. No namespace hides them and the cgroup doesn't change them. A program that looks at the machine's memory to decide how much to use plans for 16 GB, and is killed at 64 MB. How a Java runtime finds its real limit is in Module 6 (coming soon).

Namespaces and cgroups are separate settings: a container can share the host's PID namespace and still have a memory limit, or have every namespace and no limit at all, as box did.

## The analogy

Each flat in the building has its own electricity meter and fuse, fitted by the caretaker. The meter counts what the flat draws; at the fuse's rating, the caretaker switches off one appliance in that flat, and the rest of the building keeps its lights on. If the appliance was the flat's main one, the household is out. The building's notice board, which the household can read, still says the building has 16 GB of power: nothing on the wall tells them about the fuse.

## Run it yourself

On a Linux machine with Docker, as the administrator. Predict the free total, and the two exit codes, before you run.

```sh
docker run -d --name lim --memory 64m alpine:3.20 sleep 1000
docker exec lim sh -c 'cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes'
docker exec lim free -m
docker run --name oom --memory 64m --memory-swap 64m alpine:3.20 sh -c 'tail /dev/zero'; echo $?
docker inspect -f '{{.State.OOMKilled}} {{.State.ExitCode}}' oom
sudo dmesg | grep -i "killed process" | tail -1
docker rm -f lim oom
```

`docker inspect` prints a container's details; `--memory-swap 64m` makes the limit cover swap too (disk space the kernel can use as extra memory), so the test can't escape to the disk. `tail /dev/zero` reads an endless stream of zero bytes and keeps them all in memory. On the host, the same files are in the container's group folder: on version 2 with the usual systemd setup, /sys/fs/cgroup/system.slice/docker-ID.scope/, with the container's full ID. Output from the run behind this page (version 1, so the second command printed the version 1 file):

```
67108864
              total        used        free      shared  buff/cache   available
Mem:          16088         626       14427          13        1035       15237
Swap:             0           0           0
137
true 137
[ 2617.638083] Memory cgroup out of memory: Killed process 11840 (tail) total-vm:66640kB, anon-rss:65024kB, file-rss:732kB, shmem-rss:0kB, UID:0 pgtables:168kB oom_score_adj:0
```

## Check yourself

- A container started with a 256 MB memory limit on a 16 GB host runs a program that sizes its cache to a quarter of the total memory free reports. What happens as the cache fills?::*It aims for about 4 GB and is killed near 256 MB||It builds a 64 MB cache, a quarter of 256 MB >> free reports the host's total; the program never sees the limit. >> s4||It gets its 4 GB, since the host has memory to spare >> The cgroup's limit holds however much the host has free. >> s5::It plans from the host's figure and meets the group's limit.
- A container's PID 1 is a shell script that starts a worker. The worker reaches the memory limit and the kernel kills it; the script then exits normally with 0. What does `docker inspect` show?::*OOMKilled true, exit code 0||OOMKilled true, exit code 137 >> The exit code is PID 1's own; 137 appears only when PID 1 itself is killed. >> the-building-block||OOMKilled false, exit code 0 >> OOMKilled records the kill in the group, even when it hit a child. >> the-building-block::The kill is recorded; the exit code is PID 1's.
- A container runs with `--pid=host` and `--memory 64m`. Can it see the host's processes, and can it use 1 GB?::*It sees them, and is held to 64 MB||It sees only its own, and can use 1 GB >> --pid=host shares the PID namespace, and the memory limit is a separate cgroup setting. >> the-building-block||It sees them, and can use 1 GB, since it shares the host >> Sharing a namespace changes what it sees, never how much it may use. >> s2::Namespaces and cgroups are separate settings.

## Sources

- [Linux manual: cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html) ("A child process created via fork(2) inherits its parent's cgroup memberships."; "Control groups, usually referred to as cgroups, are a Linux kernel feature which allow processes to be organized into hierarchical groups whose usage of various types of resources can then be limited and monitored. The kernel's cgroup interface is provided through a pseudo-filesystem called cgroupfs.")
- [Linux kernel docs: Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) (memory.max: "Memory usage hard limit. This is the main mechanism to limit memory usage of a cgroup. If a cgroup's memory usage reaches this limit and can't be reduced, the OOM killer is invoked in the cgroup.")
- [Docker docs: Runtime metrics](https://docs.docker.com/engine/containers/runmetrics/) ("cgroup v2 is used by default on the following distributions: Fedora (since 31) Debian GNU/Linux (since 11) Ubuntu (since 21.10)"; "/sys/fs/cgroup/system.slice/docker-<longid>.scope/ on cgroup v2, systemd driver")
- [Docker docs: Engine 29 release notes](https://docs.docker.com/engine/release-notes/29/) ("cgroup v1 is deprecated. Support continues until at least May 2029, but migrate to cgroup v2 as soon as possible.")
- [Docker docs: Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/) ("By default, a container has no resource constraints and can use as much of a given resource as the host's kernel scheduler allows."; "By default, if an out-of-memory (OOM) error occurs, the kernel kills processes in a container.")
- [Docker docs: Docker Engine security](https://docs.docker.com/engine/security/) ("They implement resource accounting and limiting."; "a single container cannot bring the system down by exhausting one of those resources.")
- [OCI runtime spec v1.3.0: config-linux.md](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/config-linux.md) (memory `limit`: "sets limit of memory usage")
- All values and output on this page were read in this session with Docker Engine 29.9.2 on the test machine: an Ubuntu 24.04 userland in a Firecracker microVM (custom kernel 6.18.44, cgroup v1). The version 2 file names and the version 2 host path come from the documentation above and were not read on this machine.
