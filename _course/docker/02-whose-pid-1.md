---
title: Whose PID 1?
short: The PID namespace
summary: Inside puzzle 0's container, sleep was PID 1; on the host, the same process was 3393. Here's how one process gets two numbers, and why it can't see anything outside.
takeaway: A namespace gives the processes inside it their own copy of one kernel resource. In a new PID namespace, numbering starts again at 1, so the container's first process is PID 1 inside and keeps its host PID outside. A namespace sees only itself and the namespaces inside it, so the container can't find host processes while the host sees all of its processes. When its PID 1 exits, the kernel ends everything else in that namespace.
---

## The problem

Puzzle 0's ps, run inside the container, printed sleep with PID 1. The host's ps printed the same process as 3393. Puzzle 1 said there is only one kernel, and that kernel numbers every process. So how can one process have two numbers? And why did the inside ps list no other process, when bash was running a moment earlier on the same kernel?

## See it

```diagram pid-ns
```

## The building block

The kernel has global lists: one list of processes, one machine name, one set of network connections. A **namespace** wraps one of those resources so that the processes inside it get their own copy, invisible to processes outside. Linux has a kind of namespace for each resource; this puzzle is about the first one Docker needs.

A **PID namespace** is a namespace for process IDs. The first process in a new one gets PID 1, the next ones 2, 3 and so on, as on a freshly started machine. PID namespaces nest: every new one sits inside the one its creator was in, and the host's processes are in the first. A process has one PID in its own namespace and one in each namespace around it, out to the host's. The kernel shows both in the process's status file:

```
$ grep NSpid /proc/3393/status
NSpid:	3393	1
```

3393 to the host, 1 to itself: one process, two numbers.

What a process can see follows the nesting. It can see the processes of its own namespace and of any namespace inside it, never those outside. So `kill -0 23807`, run inside the container (`kill -0` asks the kernel whether a PID exists, and sends nothing), gets "No such process", although bash is PID 23807 on the host at that moment (a new shell and a new capture from puzzle 0's, so new numbers). The other way round, the host sees every process of every container, each under its host PID: that's how puzzle 0 found sleep.

ps doesn't get its list from a special system call. It reads **/proc**: a folder that isn't on any disk, whose entries the kernel fills in as you read them, one per process and much more. Which processes appear there depends on the PID namespace of the /proc you read, so Docker gives each container a /proc of its own; that's why the inside ps listed only 1 and 71.

## Go deeper: Why does ps need its own /proc?

`unshare` runs a program in new namespaces; with `--pid --fork` the program becomes PID 1 of a new PID namespace, and `--mount-proc` gives it a fresh /proc. Leave that last option out and run ps.

- Without `--mount-proc`, which list does ps print?::The host's whole list, starting with the host's own PID 1. The PID namespace is new, but ps reads the old /proc, which the kernel fills for the host's namespace. Add `--mount-proc` and ps prints a single line: itself, as PID 1. The namespace alone isn't enough; the view of it (here, /proc) must match.

PID 1 matters for one more reason. The kernel treats the first process of a PID namespace as that namespace's caretaker: if it exits, the kernel ends every other process in the namespace at once, and no new process can start there. That's why a container stops the moment its main program exits, even if other processes inside were still busy. The kernel also protects PID 1: processes in its namespace, and even processes outside it, can deliver only the signals (short notices from the kernel, such as "please stop") that PID 1 has set up a handler for; only the outright kill from outside always gets through. That is why a program that never expected to be PID 1 may ignore docker stop. How PID 1 should handle being asked to stop comes in Module 4 (coming soon).

You can switch the fence off for one container: `docker run --pid=host` puts it in the host's PID namespace, so ps inside lists every process on the machine. Docker's documentation suggests it for debugging tools that need to see other processes.

## The analogy

The apartment block's caretaker keeps one register of everyone in the building, numbered in order of arrival. A flat with frosted windows gets its own small register: the first person who moves in is number 1 there, even though the building register lists them as 3393. People in the flat can only look up names in their own register. The caretaker's main register lists everyone, flats included. And when number 1 of a flat moves out, the caretaker clears the whole flat.

## Run it yourself

On a Linux machine with Docker, as the administrator (prefix each command with sudo if you aren't): unshare needs those rights. Before each command, predict its output.

```sh
docker run -d --name box alpine:3.20 sleep 1000
grep NSpid /proc/$(pgrep -x sleep)/status
docker exec box kill -0 $$
unshare --pid --fork --mount-proc ps -o pid,args
unshare --pid --fork ps -o pid,args | head -3
docker rm -f box
```

`pgrep -x sleep` prints the host PID of the process named sleep, and $$ stands for your shell's own PID. Output from the run behind this page (your numbers will differ; the last command's lines are cut to 60 characters):

```
NSpid:	3393	1
kill: can't kill pid 23807: No such process
    PID COMMAND
      1 ps -o pid,args
    PID COMMAND
      1 /process_api --firecracker-init --addr 0.0.0.0:2024
      2 [kthreadd]
```

The last two lines are the test machine's own first processes, so they will look different on yours.

## Check yourself

- A container runs a shell, sh, as its first process, and sh starts a program called worker. What PIDs does a ps inside the container show for them?::*sh is 1 and worker is a small number after it||Their host PIDs, such as 3393 and 3394 >> Inside, ps reads the container's own /proc, which numbers from 1 in the new PID namespace. >> s3||worker is 1, because it does the real work >> PID 1 goes to the first process in the namespace: here, sh. >> s2::Numbering starts again at 1 in the new namespace.
- From the host, you ask with `kill -0` whether PID 3393, the container's sleep, exists. What does the kernel answer?::*3393 exists: the host sees into the container's namespace||No such process: containers are invisible to the host >> Seeing works inward: the host's namespace contains the container's. >> s5||No such process: inside, it is PID 1, not 3393 >> 1 is its number inside; to the host it is still 3393. >> s2::The host's namespace contains every container's.
- A container's PID 1 is a small script that starts a server process and then exits. What happens to the server?::*The kernel ends it, because PID 1 of its namespace exited||It keeps running, because it is a separate process >> When a namespace's PID 1 exits, the kernel ends every other process in it. >> the-building-block||It becomes the new PID 1 and carries on >> Nothing takes over PID 1; the kernel clears the namespace instead. >> the-building-block::The namespace lives and dies with its PID 1.

## Sources

- [Linux manual: namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) ("A namespace wraps a global system resource in an abstraction that makes it appear to the processes within the namespace that they have their own isolated instance of the global resource. Changes to the global resource are visible to other processes that are members of the namespace, but are invisible to other processes. One use of namespaces is to implement containers.")
- [Linux manual: pid_namespaces(7)](https://man7.org/linux/man-pages/man7/pid_namespaces.7.html) ("PIDs in a new PID namespace start at 1, somewhat like a standalone system"; "If the \"init\" process of a PID namespace terminates, the kernel terminates all of the processes in the namespace via a SIGKILL signal."; "it is not possible to create a new process in a PID namespace whose \"init\" process has terminated"; "Only signals for which the \"init\" process has established a signal handler can be sent to the \"init\" process by other members of the PID namespace."; "send signals to the \"init\" process of a child PID namespace only if the \"init\" process has established a handler for that signal."; "a process can see (e.g., send signals with kill(2), set nice values with setpriority(2), etc.) only processes contained in its own PID namespace and in descendants of that namespace."; "A process has one process ID in each of the layers of the PID namespace hierarchy in which is visible")
- [Linux manual: proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html) ("The proc filesystem is a pseudo-filesystem which provides an interface to kernel data structures.")
- [Linux manual: kill(2)](https://man7.org/linux/man-pages/man2/kill.2.html) ("If sig is 0, then no signal is sent, but existence and permission checks are still performed")
- [Linux manual: unshare(1)](https://man7.org/linux/man-pages/man1/unshare.1.html) (`--mount-proc`: "Just before running the program, mount the proc filesystem at mountpoint (default is /proc). This is useful when creating a new PID namespace.")
- [Docker docs: docker container run](https://docs.docker.com/reference/cli/docker/container/run/) ("By default, all containers have the PID namespace enabled. PID namespace provides separation of processes. The PID Namespace removes the view of the system processes, and allows process ids to be reused including PID 1."; "'host': use the host's PID namespace inside the container")
- The NSpid line, the kill -0 result, the diagram's PIDs (bash 23807, ps 23809, sleep 3393 and 1, the inside ps 71) and the unshare output were produced in this session with Docker Engine 29.9.2 and util-linux's unshare on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1).
