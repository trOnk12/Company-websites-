---
title: The container's own layer
short: The writable layer and what survives
summary: Puzzle 10's overlay mount gives each container one writable directory on top of the image. Here's what that means for the files a program writes: who can see them, what keeps them, and the one command that throws them away.
takeaway: Every container gets its own writable layer, the upper directory of its overlay mount, over the image's shared read-only layers. Its writes are invisible to other containers, survive stopping and restarting, and are deleted with the container by docker rm. Data that must outlive the container doesn't belong there.
---

## The problem

Puzzle 10 showed that all of a container's writes land in one upper directory. In practice that raises the questions you hit first with a real service. Your container writes a cache file, or worse, a database. A second container from the same image starts beside it: does it see the file? The container is restarted after a crash: is the file still there? And when you replace the container with a new one from the same image, as every deployment does?

## See it

```diagram writable-layer
```

## The building block

The upper directory of a container's overlay mount is its **writable layer**. Docker makes a new, empty one for each container, over the same read-only image layers. On the run behind this page, two containers from notes:v1, box and w2:

```
$ docker exec box sh -c 'echo draft > /tmp/draft.txt'
$ docker exec w2 cat /tmp/draft.txt
cat: can't open '/tmp/draft.txt': No such file or directory
$ docker restart -t 1 box
$ docker exec box cat /tmp/draft.txt
draft
$ docker ps -s --format '{{.Names}} {{.Size}}'
w2 4.1kB (virtual 8.52MB)
box 12.3kB (virtual 8.53MB)
(one line for an unrelated container left out)
$ docker rm -f box
$ docker run --rm notes:v1 cat /tmp/draft.txt
cat: can't open '/tmp/draft.txt': No such file or directory
```

Line by line:

- w2 can't see box's file. Each container's tree is its own writable layer over the shared ones; another container's writable layer isn't in it.
- A restart keeps it. Stopping a container stops its processes; the writable layer stays on disk until the container is removed. (`docker restart -t 1` stops and starts it, waiting at most a second for the program to exit.)
- `docker ps -s` shows each container's writable layer (the first number) next to the image's size (virtual). box's writable layer takes 12.3 kB (a 6-byte file plus the /tmp directory it sits in, counted in disk blocks); both share the 8.5 MB.
- `docker rm` deletes the container and its writable layer. A new container from the same image starts with an empty one. Every deployment that replaces a container, and every `docker run --rm`, throws its writable layer away.

On the host, the writable layer is an ordinary directory, the upperdir of puzzle 10's mount line; for box it was …/snapshots/114/fs. Docker's documentation warns not to change anything under /var/lib/docker by hand: Docker owns that folder and removes the writable layer with the container.

So the writable layer is for scratch files only. Anything that must survive the container, a database, uploads, a cache you want to keep, goes into a volume or a bind mount, which live outside the container's layers (Module 5, coming soon). And since every write to an image file costs a copy-up (puzzle 10), heavy writes are faster there too.

## The analogy

Each flat gets its own sheet of tracing paper over the shared printed plan. A tenant's drawings are only on that flat's sheet; next door sees its own. Locking up for a holiday leaves the sheet on the plan. When the tenancy ends, the sheet goes in the bin, and the next tenant gets a fresh one. Anything worth keeping should have gone into the storage room in the basement.

## Run it yourself

With notes:v1 from puzzle 9. Predict each `cat` before you run it.

```sh
docker run -d --name box notes:v1 sleep 1000
docker run -d --name w2 notes:v1 sleep 1000
docker exec box sh -c 'echo draft > /tmp/draft.txt'
docker exec w2 cat /tmp/draft.txt
docker restart -t 1 box; docker exec box cat /tmp/draft.txt
docker ps -s --format '{{.Names}} {{.Size}}'
docker rm -f box w2
docker run --rm notes:v1 cat /tmp/draft.txt
```

The output from the run behind this page is the listing above; your sizes may differ slightly.

## Check yourself

- A service writes its SQLite database inside its container's tree. You deploy a new version by removing the old container and starting a new one from the new image. What happens to the data?::*It is gone: it was in the old container's writable layer||It moves to the new container, since both come from the same service >> Each container gets a new, empty writable layer; nothing is carried over. >> s6||It is kept in the new image's layers >> Writes never go into image layers; they stay in the container's own layer. >> s2::A container's writes die with docker rm.
- A container crashes and Docker restarts it (same container, not a new one). Are the files it wrote before the crash still there?::*Yes: the writable layer stays until removal||No: a restart starts again from the image's files >> A restart stops and starts the same container; its writable layer stays. >> s5||Only the files it wrote under /tmp >> The whole writable layer stays, not one folder. >> s5::Stopping isn't removing.
- Ten containers from one 500 MB image each write 1 MB. Roughly how much disk do they use together?::*About 510 MB: one shared image plus ten small layers||About 5 GB: each container has its own copy of the image >> The image's layers are shared read-only lower directories. >> s1||About 500 MB: writes go into the image >> Each container's writes take space in its own writable layer. >> s2::Layers are shared; writes are per container.

## Sources

- [Docker docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) ("When a container starts, it uses the image’s layers as they are and adds one thin writable layer of its own on top. Anything the running app writes, such as a new to-do in its database, goes into that writable layer, never into the image.")
- [Docker docs: Storage drivers](https://docs.docker.com/engine/storage/drivers/) ("All writes to the container that add new or modify existing data are stored in this writable layer. When the container is deleted, the writable layer is also deleted. The underlying image remains unchanged.")
- [Docker docs: OverlayFS storage driver](https://docs.docker.com/engine/storage/drivers/overlayfs-driver/) ("Don't directly manipulate any files or directories within /var/lib/docker/ ."; "As with other copy-on-write filesystems, OverlayFS performs copy-up operations whenever a container writes to a file for the first time. This can add latency into the write operation, especially for large files.")
- All output on this page was produced in this session with Docker Engine 29.9.2 (containerd image store) on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1).
