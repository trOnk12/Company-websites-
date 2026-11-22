---
title: A file tree of its own
short: The mount namespace and the root filesystem
summary: Puzzle 1's Alpine container read a different /etc/os-release from the host's, on the same kernel. Here's the second fence: how a process gets its own file tree, and where a container's tree comes from.
takeaway: A mount attaches a set of files to a folder in the one tree that starts at /. A mount namespace gives its processes their own list of mounts, so a mount made inside is invisible outside. Docker uses one to mount the image's files at /, the container's root filesystem: the container sees the image's files, and the host's only if you mount them in.
---

## The problem

Puzzle 1 ran the same command on the same kernel and got two answers: /etc/os-release said Ubuntu on the host and Alpine in the container. A file is a file; the kernel finds it by its path. So how can one path lead to two different files? And if the container can't see the host's files, can the host see the container's?

## See it

```diagram mount-ns
```

## The building block

On Linux, every file sits in one tree that starts at /. The files themselves can live in many places: a disk, a second disk, a memory stick, memory itself. A **mount** attaches one such set of files to a folder in the tree; from then on, paths under that folder lead into it. On the host, / comes from its disk.

The kernel keeps the list of mounts per **mount namespace**. A process in a new mount namespace starts with a copy of its parent's list, so at first it sees the same files. But from then on the two lists are separate: a mount added or removed inside changes only the inside list. In the diagram, `unshare --mount` gives a shell a new mount namespace, the shell mounts a tmpfs (a filesystem kept in memory) on /tmp/demo and creates a file there. Inside, ls /tmp/demo lists it; on the host, the same command prints nothing. Same path, same kernel, two lists of mounts, two different folders.

Docker does more than copy the list. In the container's mount namespace, Docker's runtime (puzzle 8 names it) makes the image's files the mount at /. That set of files is the container's **root filesystem**: the top of its tree, and everything below it. From then on every path the container opens, /etc/os-release, /bin/sh, /home, is looked up in Alpine's files. The host's files are not in the tree at all: ls /home on the host listed three folders on the run behind this page; in the container it printed nothing. That's the answer to puzzle 1's two os-release files.

It does this with a system call, pivot_root: it makes the image's files the root mount of the namespace and then unmounts the host's old root, so the host's tree is gone from the container's list of mounts, not just out of reach. The older chroot only changes where one process's paths start; the host's mounts stay in its list.

The mount at / is a little more than the image's files. The first line of the container's mount list reads "overlay / overlay rw,…": Docker stacks the image's files with a thin layer of its own where the container's writes go, so the image itself never changes. How that stack works is Module 2 (coming soon).

Two edges that follow:

- The host can look in. Seeing works inward here too: the kernel exposes each process's root filesystem under /proc, so on the host /proc/3393/root/etc/os-release reads Alpine's file. The container can't look out.
- Nothing of the host gets in unless you put it there. A host folder appears in a container only if you mount it in with an option of docker run (volumes and bind mounts, Module 5, coming soon). That is also how a host file can be damaged from a container, which matters in puzzle 5.

## The analogy

The flat came furnished. The caretaker keeps, for each flat, a plan of which room is which; when Docker sets up a flat, it hands the caretaker a plan whose every room is filled with Alpine's furniture. The household finds its kitchen where the plan says, and never sees the rest of the building's rooms. The caretaker, holding every plan, can walk into any flat.

## Run it yourself

On a Linux machine with Docker, as the administrator (prefix with sudo if you aren't). Predict each output first.

```sh
mkdir -p /tmp/demo
unshare --mount sh -c 'mount -t tmpfs none /tmp/demo; touch /tmp/demo/inside; ls /tmp/demo'
ls /tmp/demo
docker run -d --name box alpine:3.20 sleep 1000
docker exec box head -1 /proc/mounts | cut -c1-40
grep PRETTY /proc/$(pgrep -x sleep)/root/etc/os-release
docker rm -f box
```

Output from the run behind this page:

```
inside
overlay / overlay rw,relatime,lowerdir=/
PRETTY_NAME="Alpine Linux v3.20"
```

The second command printed inside; the third printed nothing, because the host's /tmp/demo is the empty folder on its disk. (The mount stayed inside because unshare makes the new namespace's mounts private: since util-linux 2.27 it "automatically sets propagation to private in a new mount namespace", so mounts made on one side are not copied to the other.) The last line is the host reading the container's own os-release through /proc.

## Check yourself

- Inside a container you create /tmp/notes.txt. On the host, does ls /tmp list notes.txt?::*No: the container's /tmp is in its own root filesystem||Yes: there is one /tmp, as there is one kernel >> One kernel, but two lists of mounts: the container's / is the image's files. >> s5||Yes, but only after the container stops >> Stopping changes nothing: the host's /tmp was never the container's /tmp. >> s4::The container writes into its own tree.
- On one kernel, /etc/os-release says Alpine inside the container and Ubuntu on the host. Why?::*Each process looks the path up in its own root filesystem||The kernel gives each container a different answer for that file >> The kernel only follows the path; the mounts differ, so the file differs. >> s5||Docker writes Alpine's file over the host's while the container runs >> The host's file is untouched: the host still reads Ubuntu. >> s4::Same path, different mount at /.
- In the unshare example, the shell in the new mount namespace reads /etc/os-release. Which distribution does it name?::*Ubuntu: its mount list started as a copy of the host's||Alpine, because a new mount namespace starts from an image >> Only Docker mounts an image at /; unshare kept the copied list. >> s2||None: a new mount namespace starts with no files >> It starts with a copy of the host's mounts, files included. >> s2::A new mount namespace starts as a copy.

## Sources

- [Linux manual: mount(8)](https://man7.org/linux/man-pages/man8/mount.8.html) ("All files accessible in a Unix system are arranged in one big tree, the file hierarchy, rooted at /. These files can be spread out over several devices. The mount command serves to attach the filesystem found on some device to the big file tree.")
- [Linux manual: unshare(1)](https://man7.org/linux/man-pages/man1/unshare.1.html) ("unshare since util-linux version 2.27 automatically sets propagation to private in a new mount namespace to make sure that the new namespace is really unshared.")
- [Linux manual: mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html) ("Mount namespaces provide isolation of the list of mounts seen by the processes in each namespace instance. Thus, the processes in each of the mount namespace instances will see distinct single-directory hierarchies.")
- [Linux manual: pivot_root(2)](https://man7.org/linux/man-pages/man2/pivot_root.2.html) ("pivot_root() changes the root mount in the mount namespace of the calling process."; "pivot_root() allows the caller to switch to a new root filesystem while at the same time placing the old root mount at a location under new_root from where it can subsequently be unmounted.")
- [Linux manual: chroot(2)](https://man7.org/linux/man-pages/man2/chroot.2.html) ("chroot() changes the root directory of the calling process to that specified in path.")
- [runc v1.5.2: runc-run(8)](https://github.com/opencontainers/runc/blob/v1.5.2/man/runc-run.8.md) ("--no-pivot: Do not use pivot root to jail process inside rootfs. This should not be used except in exceptional circumstances")
- [OCI runtime spec v1.3.0: config.md, Root](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/config.md#root) ("root (object, OPTIONAL) specifies the container's root filesystem."; "On all other platforms, this field is REQUIRED.")
- [Docker docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) ("When a container starts, it uses the image’s layers as they are and adds one thin writable layer of its own on top.")
- The output under Run it yourself, the ls /home comparison and the `/proc/3393/root` read were produced in this session with Docker Engine 29.9.2 and util-linux 2.39.3 on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1).
