---
title: One kernel, or many?
short: The shared kernel, and how a VM differs
summary: Puzzle 0's container is a process on the host's kernel. So which kernel does it really use, the host's or one that came with its image? And how is that different from a virtual computer?
takeaway: A container brings files, not a kernel: every system call its process makes goes to the host's one kernel, so uname -r prints the host's version. A virtual machine boots its own kernel on a hypervisor. On a Mac or Windows laptop, and with Docker Desktop even on Linux, a Linux VM runs your containers.
---

## The problem

Puzzle 0 found the container's sleep in the host's process list, standing on the host's kernel. But the image was Alpine, a different Linux from the host's Ubuntu. Did Alpine bring its own kernel along? If you have used an Android emulator, you've run a whole second phone on your laptop, with its own operating system. Is a container like that?

It matters the day something depends on the kernel: a feature your program needs, a bug report that names a kernel version, or a container that works on a Linux server but behaves differently on your Mac.

## See it

```diagram kernel-vm
```

## The building block

A process can compute on its own memory, but nothing more. To open a file, send a packet, or start another program, it must ask the kernel. That request is a **system call**: the program stops, the kernel does the work (or refuses), and the program carries on with the answer. Every process on a Linux machine, container or not, talks to the kernel only this way.

So the question "which kernel does a container use?" becomes "who answers its system calls?". `uname -r` answers it: it asks the kernel for its version with one system call and prints the answer. Next to it, read `/etc/os-release`, a file that names the Linux distribution whose files you're looking at. On the run behind this page:

| Where it ran | `uname -r` printed | `/etc/os-release` said |
| --- | --- | --- |
| On the host | 6.18.44-fc-v726 | Ubuntu 24.04.5 |
| Inside the Alpine container | 6.18.44-fc-v726 | Alpine Linux v3.20 |

The files differ: each side reads its own copy of `/etc/os-release` (puzzle 3 shows how). The kernel doesn't: there is only one. An image holds the files of a Linux distribution, its programs and libraries, but no kernel to run. This has consequences you will meet:

- Every container on a machine shares that machine's kernel, its version, its features and its bugs. A program that needs a newer kernel feature fails in a container on an older host, whatever image it came from.
- There's nothing to boot. Starting a container is starting a process, which is why it takes about a second.
- Linux containers need a Linux kernel to share. macOS and Windows don't have one.

A **virtual machine** (VM) is the other way to isolate a program: a whole pretend computer that boots its own operating system, kernel included. Its programs' system calls go to its own kernel. Under the VMs runs a **hypervisor**, the program that runs them and gives each its own pretend hardware: processors, memory, disks. The Android emulator runs as one: Android's documentation says a hypervisor manages it.

The two isolate at different places. Docker's documentation puts the trade-off plainly: a VM's isolation is stronger, because containers sharing a kernel are separated only by that kernel, while VMs are separated by the hardware boundary the hypervisor creates. The puzzles after this one show how that kernel draws its fences.

That's also what happens on your laptop. On a Mac or Windows laptop, and with Docker Desktop even on Linux, Docker Desktop runs a small Linux VM and puts your containers inside it, on its Linux kernel. So the Mac's own `ps` never lists your container's process: it's a process inside the VM. And `uname -r` in a container there prints the VM's kernel version, not anything about macOS.

## The analogy

Puzzle 0's apartment block has one caretaker for every flat: whatever a household needs, it rings the same caretaker, and a household that moved in with its own furniture (Alpine's files) still rings him. A VM is a separate house on the same street, with its own caretaker. Docker Desktop on a Mac builds one small house with a Linux caretaker, and puts all your flats inside it.

## Run it yourself

Before running, predict whether the two `uname -r` lines will match, and whether the two `/etc/os-release` lines will.

```sh
uname -r
docker run --rm alpine:3.20 uname -r
grep PRETTY /etc/os-release
docker run --rm alpine:3.20 grep PRETTY /etc/os-release
```

`--rm` removes the container when its program exits. Output from the run behind this page, on a Linux host:

```
6.18.44-fc-v726
6.18.44-fc-v726
PRETTY_NAME="Ubuntu 24.04.5 LTS"
PRETTY_NAME="Alpine Linux v3.20"
```

On a Mac, the first command reports the Mac's own kernel and the second reports the Linux kernel of Docker Desktop's VM, so they won't match. Try both, and you've seen the VM.

## Check yourself

- An image made from an older Linux distribution runs on a host whose kernel is 6.18.44. What does `uname -r` print inside the container?::*6.18.44, the host's kernel version||The version of the kernel that older distribution shipped with >> The image brought that distribution's files, not its kernel; the host's kernel answers. >> s3||Nothing, because a container has no kernel to ask >> uname -r makes a system call, and the shared kernel answers it. >> s1::One kernel answers every container's system calls.
- You start a container from a large image of a full Linux distribution, already downloaded, and a VM that boots the same distribution. Which one runs its first program sooner, and why?::*The container: its program starts on the running host kernel||The VM: a full distribution needs its own kernel booted first >> The image holds the distribution's files only; nothing in a container boots. >> s3||Both take as long: the same distribution starts either way >> Only the VM starts an operating system; the container starts one process. >> s4::A container starts a process; a VM boots a kernel.
- On your Mac, Docker Desktop runs a container with sleep 1000. Does the Mac's own `ps` list sleep?::*No: sleep is a process inside the Linux VM||Yes, with its own PID, as on a Linux host >> On a Mac the containers' host is the Linux VM, not macOS. >> s6||Yes, but under the image's name >> The Mac's ps lists only macOS processes; sleep runs inside the VM. >> s6::On a Mac, the containers live in Docker Desktop's VM.

## Sources

- [Docker docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) ("Every VM boots its own complete operating system, including its own kernel, the core of the operating system that talks to the hardware."; "It’s still a process, so every container on a machine shares that machine’s kernel. There is no operating system to boot, which is why a container starts in about a second"; "The trade-off is that a VM’s isolation is stronger: containers that share a kernel are separated by that kernel, while VMs are separated by the hardware boundary the hypervisor creates."; "on macOS and Windows, Docker Desktop runs your Linux containers inside a small Linux VM that it manages for you, because Linux containers need a Linux kernel to share.")
- [Android Developers: Configure hardware acceleration for the Android Emulator](https://developer.android.com/studio/run/emulator-acceleration) ("VM acceleration uses your computer's processor to significantly improve the execution speed of the emulator. A tool called a hypervisor manages this interaction")
- [Docker docs: Install Docker Desktop on Linux](https://docs.docker.com/desktop/setup/install/linux/) ("Docker Desktop on Linux runs a Virtual Machine (VM)")
- [Linux manual: syscalls(2)](https://man7.org/linux/man-pages/man2/syscalls.2.html) ("The system call is the fundamental interface between an application and the Linux kernel.")
- [Linux manual: uname(2)](https://man7.org/linux/man-pages/man2/uname.2.html) ("uname() returns system information"; the field `release` is the "Operating system release")
- The table and the output under Run it yourself were produced in this session with Docker Engine 29.9.2 on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1), image `alpine:3.20`. The Mac behaviour in the last paragraph was not run here; it follows from Docker's statement above.
