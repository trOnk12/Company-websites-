---
title: How much processor time?
short: The CPU quota
summary: Puzzle 6's cgroup held memory to a limit. Processor time is the other thing a busy container takes from its neighbours. Here's how the same group limits it, and why a limited container can wait while the processors sit idle.
takeaway: --cpus sets a CPU quota on the container's cgroup: so many microseconds of processor time in every 100 ms period, for all its threads together. When the group has used its quota, the kernel makes it wait for the next period, even if processors are idle; nothing is killed. Several busy threads use the quota up faster, so each gets less.
---

## The problem

Puzzle 6 capped how much memory a container may hold. But a container stuck in a busy loop doesn't need more memory: it keeps a processor busy all the time, and on a machine shared by twenty containers that is a twentieth of the machine's work gone to one bad program. Killing it, as at the memory line, would be too harsh: running long is not a fault. How does the kernel hold a group to a share of the processors?

## See it

```diagram cpu-quota
```

## The building block

The same cgroup that held the memory limit can hold a **CPU quota**: how much processor time the group's processes may use, together, in each period. `docker run --cpus 0.5` writes a period of 100000 microseconds (100 ms) and a quota of 50000 (50 ms). On cgroup version 2 they are one file, cpu.max, reading "50000 100000"; on the version 1 test machine they are two files, cpu.cfs_quota_us and cpu.cfs_period_us, as puzzle 6's portable command showed.

In every period, the group may run for its quota; once the threads have used it, the kernel stops scheduling them until the next period begins. Nothing is killed, and nothing is borrowed from an idle processor: the group waits even if every processor is free. The kernel counts each wait. On the run behind this page, a container with `--cpus 0.5` ran a busy loop for about 10 seconds:

```
$ cat /sys/fs/cgroup/cpu/docker/ID/cpu.stat
nr_periods 102
nr_throttled 101
throttled_time 5013446097
```

102 periods, 101 of which ended with the group waiting (throttled), about 5.0 seconds of waiting in all (the time is in nanoseconds). `docker stats`, which shows each container's use, read 48.72%: half of one processor. On version 2, the same counters are in cpu.stat as nr_periods, nr_throttled and throttled_usec.

The quota belongs to the whole group, not to each thread. A second container ran two busy threads under the same `--cpus 0.5`: docker stats read 48.59%, the same half processor in total, and its throttled time was 14959076733 nanoseconds, about three times the one-thread container's. That fits each thread running about 25 ms of every 100 ms and waiting 75: two waiting threads, 75 ms each, per period. A program with many threads, a server or a Gradle build, can spend most of each period waiting even though it was "given half a processor".

Docker has a second, different processor option, `--cpu-shares`: a relative weight between groups, which only counts when the processors are busy. It never makes a group wait while a processor is idle; the quota does.

## The analogy

The flat shares the building's washing machines, and its meter allows 30 minutes of washing in every hour. After 30 minutes the caretaker locks the flat out until the next hour starts, even if every machine stands empty. Two people from the flat washing at once use up the 30 minutes in 15. A share, by contrast, is only a place in the queue when the machines are all busy.

## Run it yourself

On a Linux machine with Docker, as the administrator. Before reading the counters, predict how many periods were throttled, and whether two threads change docker stats.

```sh
docker run -d --name cpu1 --cpus 0.5 alpine:3.20 sh -c 'while :; do :; done'
docker run -d --name cpu2 --cpus 0.5 alpine:3.20 sh -c '(while :; do :; done) & while :; do :; done'
sleep 10
docker stats --no-stream --format '{{.Name}} {{.CPUPerc}}' cpu1 cpu2
docker exec cpu1 sh -c 'cat /sys/fs/cgroup/cpu.stat 2>/dev/null || cat /sys/fs/cgroup/cpu/cpu.stat'
docker rm -f cpu1 cpu2
```

The loop while :; do :; done is a shell loop that never stops and does nothing, so it keeps one processor busy. Output from the run behind this page (version 1; the counters were read from the host's copy of the same file, at about 10 seconds):

```
cpu1 48.72%
cpu2 48.59%
nr_periods 102
nr_throttled 101
throttled_time 5013446097
nr_bursts 0
burst_time 0
```

## Check yourself

- A Gradle build runs four busy threads in a container started with a quota of one processor (--cpus 1) on a machine with 8 free processors. Roughly how long can each thread run in each 100 ms period?::*About 25 ms||About 100 ms, on a processor each >> The quota is counted for the group together: 100 ms per period, shared by four threads. >> s4||About 12.5 ms, a share of all 8 processors >> The free processors don't matter; only the group's 100 ms quota does. >> s2::Four threads share one quota.
- A container with `--cpus 0.5` runs a busy loop, alone on an idle machine. Why does it get only half of one processor's time?::*Its quota is used up and it waits, idle processors or not||The other processors are kept for the host's own programs >> Nothing is reserved; the cap is this group's quota. >> s2||The kernel slows every container when the machine is busy >> The machine is idle; only this group's quota applies. >> s2::A quota is a cap, not a share.
- A program in a container with `--cpus 0.5` and `--memory 64m` briefly needs far more processor time than its quota. What happens to it?::*It runs slower: it waits at the end of each period||The kernel kills it, as at the memory limit >> Only memory past the limit is taken back by killing; processor time is held back by waiting. >> s2||It borrows time from idle processors and runs at full speed >> A quota never borrows: the group waits even when processors are free. >> s2::Over the quota means waiting, not dying.

## Sources

- [Linux manual: cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html) ("within each scheduling period (defined via a file in the cgroup directory), it is possible to define an upper limit on the CPU time allocated to the processes in a cgroup.")
- [Linux kernel docs: Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html) (cpu.max: "The default is “max 100000”."; "which indicates that the group may consume up to $MAX in each $PERIOD duration.")
- [Docker docs: Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/) ("if the host machine has two CPUs and you set --cpus=\"1.5\" , the container is guaranteed at most one and a half of the CPUs. This is the equivalent of setting --cpu-period=\"100000\" and --cpu-quota=\"150000\" ."; "The number of microseconds per --cpu-period that the container is limited to before being throttled."; --cpu-shares: "This is only enforced when CPU cycles are constrained.")
- [OCI runtime spec v1.3.0: config-linux.md](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/config-linux.md) (cpu `quota`: "specifies the total amount of time in microseconds for which all tasks in a cgroup can run during one period")
- The cpu.stat counters and docker stats figures were read in this session on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1, Docker Engine 29.9.2). The 25 ms per thread is a model that fits the measured waiting time; it was not measured per thread. The version 2 counter names come from the kernel documentation.
