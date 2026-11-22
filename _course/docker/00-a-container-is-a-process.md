---
title: A container is a process
short: Your program, in the host's process list
summary: Docker starts a program for you. Find that program on the machine, and see the one thing that makes it different from every other program running there.
takeaway: A container is an ordinary process, started from an image's files, that the kernel runs like any other one; the host's ps lists it with its own PID. What makes it a container is a fence the kernel puts around it, limiting what it can see and how much it can use.
---

## The problem

On your phone, every app you open runs as a **process**: a running program, with its own memory. You have used Docker at work, typed `docker run`, and heard that your program now runs "in Docker". Is it inside a small computer inside yours? A special kind of program? Something Docker runs by itself?

The answer decides how you debug it. When your program won’t start under Docker, or gets killed, you need to know whose rules apply and where to look. This module answers the question from the bottom up, with real output from a real machine.

## See it

```diagram process
```

## The building block

Every program on a Linux machine, from your shell to a database server, is run by the **kernel**: the core of the operating system. It is the one program that runs all the others: it gives each one its turns on the processor, its memory and its files. On servers, and on Android phones, that kernel is Linux.

When the kernel starts a process, it gives it a number, its **PID** (process ID). `ps` is a small program that prints the processes the kernel is running, one line each, with their PIDs.

Now `docker run alpine:3.20 sleep 1000`. `sleep 1000` is a tiny program that waits 1000 seconds and exits. `alpine:3.20` is a **container image**, an image for short: a package of the files a program needs to start, here the files of Alpine, a small Linux distribution, and the program `sleep` among them. Docker unpacks the image's files and asks the kernel to start `sleep` from them.

On the host, the machine Docker runs on, `ps` then shows one more line: `sleep 1000`, with PID 3393. It sits in the same list as bash and ps, numbered by the same kernel. No second operating system started; nothing sits between sleep and the kernel. Docker set the process up and then stepped aside.

So what is different? Run `ps` again, but inside the container, with `docker exec box ps` (`docker exec` runs one more program in a container that is already running, here the one named box). It lists two processes: sleep and itself. The kernel hides every other process from it. A **container** is exactly that: an ordinary process, or a few of them, that the kernel runs inside a fence. The fence limits what the process can see (other processes, the host's files, the network) and how much it can use (memory, processor time). The next puzzles take the fence apart, one piece at a time.

Two things a container is not:

- It is not a copy of Docker running your program. Docker asked the kernel to start the process; the kernel runs it.
- It is not the image. The image is files; nothing runs until a process starts from them. Ten containers from one image are ten processes.

## The analogy

An apartment block. The caretaker, the kernel, runs the whole building: water, power, keys, for everyone. Each household is a process. A container is a household in a flat with frosted windows and its own meter: it can't see the neighbours, it can draw only so much power, but it lives in the same building and calls the same caretaker as everyone else.

## Run it yourself

On a Linux machine with Docker installed. Before you run the third command, write down how many lines it will print, and whether the second command will find sleep at all.

```sh
docker run -d --name box alpine:3.20 sleep 1000
ps -eo pid,ppid,cmd | grep "[s]leep 1000"
docker exec box ps -o pid,args
docker rm -f box
```

`-d` starts the container in the background, and `--name` names it box. `ps -eo pid,ppid,cmd` prints every process with its PID, its parent's PID (the process that started it) and its command; the brackets in [s]leep stop grep from finding its own line. This is the output from the run behind this page (your PIDs will differ):

```
7cd6333d62bd685fb0432cc58d8b24f77fdd707db35f9573b85d9de4723ce1bb
 3393  3367 sleep 1000
PID   COMMAND
    1 sleep 1000
    7 ps -o pid,args
```

The first line is the new container's ID. Inside, the numbers are different: sleep is 1 there, not 3393. Puzzle 2 shows why one process has two numbers. On a Mac or a Windows laptop with Docker Desktop, the second command finds nothing: puzzle 1 shows where the process really runs.

## Check yourself

- You start two containers from the same image, each running `sleep 1000`. How many sleep processes does the host's `ps` list?::*Two, each with its own PID||One, which both containers share >> Each docker run starts its own process; the image is only files, and nothing in it runs by itself. >> the-building-block||None, because containers run outside the host's process list >> The kernel runs a container's program like any other process, and ps lists it. >> s3::Two processes: one per container, both on the host's list.
- Why doesn't `ps` inside the container list bash?::*The kernel hides other processes from the container's process||bash stops while a container is running >> bash keeps running: the host's ps still lists it. >> s4||The container has its own kernel, which never started bash >> There is one kernel; sleep stands on it next to bash. >> s3::The fence is the kernel's: it limits what the process can see.
- The kernel ends the process with PID 3393, for example to free memory. What is left of the container's program?::*Nothing: that process was the program||It goes on inside Docker, which runs it >> Docker asked the kernel to start the process and stepped aside; the kernel runs it. >> the-building-block||It goes on inside the image, which still holds it >> An image is files; nothing runs from it until a process starts. >> s3::The container's program is that one process.

## Sources

- [Docker docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) ("A container is an ordinary process on your computer, such as a Node.js server, that runs in isolation."; "its own kernel, the core of the operating system that talks to the hardware"; "An image is a package of everything a container needs to start: the operating system files, the language runtime, the app’s dependencies and code, and settings such as which command to run.")
- [Docker docs: Docker Engine security](https://docs.docker.com/engine/security/) ("When you start a container with docker run , behind the scenes Docker creates a set of namespaces and control groups for the container."; "Processes running within a container cannot see, and even less affect, processes running in another container, or in the host system.")
- [Linux manual: credentials(7)](https://man7.org/linux/man-pages/man7/credentials.7.html) ("Each process has a unique nonnegative integer identifier that is assigned when the process is created using fork(2).")
- [Linux manual: getpid(2)](https://man7.org/linux/man-pages/man2/getpid.2.html) ("getpid() returns the process ID (PID) of the calling process.")
- The output under Run it yourself, and the PIDs in the diagram (bash 3633, ps 3635, sleep 3393), were produced in this session with Docker Engine 29.9.2 on Linux 6.18.44 (Ubuntu 24.04 host), image `alpine:3.20`.
