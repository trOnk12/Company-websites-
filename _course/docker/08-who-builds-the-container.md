---
title: Who builds the container?
short: docker, dockerd, containerd, the shim and runc
summary: Puzzles 0 to 7 took the fence apart: namespaces and a cgroup around one process. Somebody asks the kernel for all of it when you type docker run. Here's the chain of programs that does, and the one file that describes the whole container.
takeaway: The docker command only sends a request to dockerd. dockerd hands the container to containerd, which starts a shim; the shim runs runc with config.json, the OCI runtime spec's description of the container. runc asks the kernel for the namespaces and the cgroup, starts the program and exits, leaving the shim as its parent. After that, the container is the process the kernel runs, and nothing else.
---

## The problem

Puzzle 0 said Docker set the process up and then stepped aside. Puzzles 2 to 7 showed what it set up: new PID, mount, UTS, network and ipc namespaces, no user namespace, a root filesystem from the image, a cgroup with limits. Something had to ask the kernel for each of those, in the right order. Which program does it? And when a container won't start, which of them is complaining?

## See it

```diagram run-sequence
```

## The building block

The `docker` command you type is only a client: it turns your command into a request and sends it to **dockerd**, the Docker daemon, a program that keeps running in the background. The request goes through a special file, `/var/run/docker.sock`. If dockerd isn't running, nothing answers, and every docker command fails at once. On the machine behind this course, the first docker version command printed:

```
failed to connect to the docker API at unix:///var/run/docker.sock; check if the path is correct and if the daemon is running: dial unix /var/run/docker.sock: connect: no such file or directory
```

After the test machine restarted, the special file was left behind with no dockerd behind it, and the message changed to "Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?". Neither message is about your container: start dockerd (on a Mac, start Docker Desktop) first. A third one, "permission denied while trying to connect to the docker API", means dockerd is running but your user may not use the special file (puzzle 0's Before you start).

dockerd looks after images, networks and volumes, and passes each container's life, create, start, stop, to **containerd**, a second long-running program. For every container, containerd starts a small helper process, a **shim**, called containerd-shim-runc-v2. The shim runs **runc**: the small program that actually asks the kernel for the container.

runc reads one file, config.json. Its format is the **OCI runtime spec**, a standard from the Open Container Initiative that says how to describe a container (which program, which root filesystem, which namespaces, which limits) and what a runtime must do with the description. Here is the part of the config.json Docker wrote for puzzle 6's container lim, on the run behind this page:

```json
{
  "ociVersion": "1.3.0",
  "process": { "args": ["sleep", "1000"], "user": { "uid": 0 } },
  "root": { "path": "/var/lib/docker/rootfs/overlayfs/845b46b3…" },
  "linux": {
    "namespaces": [ {"type": "mount"}, {"type": "network"}, {"type": "time"},
                    {"type": "uts"}, {"type": "pid"}, {"type": "ipc"} ],
    "resources": {
      "memory": { "limit": 67108864 },
      "cpu": { "quota": 50000, "period": 100000 }
    }
  }
}
```

Every earlier puzzle is in it: the program and its UID 0 (puzzles 0 and 5), the root filesystem (puzzle 3), the namespaces (puzzles 2 and 4) and the limits (puzzles 6 and 7). Careful with the two meanings of root: config.json's "root" is puzzle 3's root filesystem; the root user is "uid": 0. And one absence: there is no user namespace in the list. The spec says that a kind of namespace not listed is inherited from the runtime, runc, which runs in the host's: that's puzzle 5's equal link, written down.

The spec splits the work in two. Create: build everything in config.json (namespaces, cgroup, root filesystem) but don't run the program yet. Start: run the program. runc does both, then exits. On the host, `ps` afterwards shows dockerd (576), containerd (649), the shim (1337) and sleep (1363), whose parent is the shim. The shim's own parent is 1, not containerd: containerd started it detached. (Whether containers survive dockerd itself stopping is a separate setting, live restore: by default, Docker's documentation says, when the daemon terminates it shuts down running containers.) There is no runc process: it's gone, and no Docker program is "running the container". The kernel runs sleep, inside its fences, like puzzle 0 said.

Each link in the chain can be replaced: Docker's documentation lists other runtimes that plug in through their own shim instead of runc, such as gVisor and Kata Containers, while the docker commands stay the same.

## The analogy

You phone the building's management office (dockerd) to ask for a new flat. Management passes the order to its lettings department (containerd), which sends a concierge (the shim) to stay at the new flat's door. The concierge calls a fitter (runc) with the order form (config.json): which tenant, which furniture, which frosted windows, which meter. The fitter has the caretaker (the kernel) install all of it, lets the tenant in, and leaves. From then on, the tenant lives in the flat and the concierge waits at the door.

## Run it yourself

On a Linux machine with Docker, as the administrator. Before running, predict which of the five programs ps will list, and whose child sleep will be.

```sh
docker run -d --name lim --memory 64m --cpus 0.5 alpine:3.20 sleep 1000
ps -eo pid,ppid,comm | grep -E "dockerd|containerd|runc|sleep"
docker info | grep -E "Default Runtime|runc version"
ID=$(docker inspect -f '{{.Id}}' lim)
cat /run/containerd/io.containerd.runtime.v2.task/moby/$ID/config.json
docker rm -f lim
```

Output from the run behind this page (the config.json is long; the excerpt above is from it):

```
  576     1 dockerd
  649   576 containerd
 1337     1 containerd-shim
 1363  1337 sleep
 Default Runtime: runc
 runc version: v1.5.2-0-g29dd3dc2
```

ps cuts command names to 15 characters, so the shim shows as containerd-shim. Your containerd's parent may be 1 (systemd) rather than dockerd: then containerd runs as its own service, and config.json should be under /run/containerd as in the command. On the test machine dockerd started containerd itself, so the file was under /run/docker/containerd/daemon/io.containerd.runtime.v2.task/moby/ instead.

## Check yourself

- You start a container with `docker run -d`, then close the terminal the docker command ran in. Does the container keep running?::*Yes: the docker command only sent a request to dockerd||No: the container ran inside the docker command >> The docker command is a client; the container's process is the shim's child, not the command's. >> s1||No: when runc exits, its container ends too >> runc exits by design after starting the program; the shim stays as its parent. >> s6::The docker command isn't part of the container.
- On a laptop where Docker is installed, every docker command prints "failed to connect to the docker API at unix:///var/run/docker.sock". What is wrong?::*dockerd isn't running, so no one answers the request||The image the command needs hasn't been downloaded >> The request never reached dockerd, so no image was even looked for. >> the-building-block||runc is missing, so no container can start >> runc only matters when a container starts; this request never got past the special file. >> the-building-block::The client can't reach the daemon.
- On a machine where Docker's userns-remap setting is on, you read a new container's config.json. Which namespaces does it list?::*The same six, plus user||The same six, without user, as on the test machine >> A kind that isn't listed is inherited from runc, which is in the host's user namespace; to get a new one, it must be listed. >> the-building-block||Only user, because the image supplies the rest >> The image supplies files; every namespace the container gets is listed in config.json. >> the-building-block::To get a namespace of its own, the container must list it.

## Sources

- [Docker docs: dockerd](https://docs.docker.com/reference/cli/dockerd/) ("dockerd is the persistent process that manages containers. Docker uses different binaries for the daemon and client.")
- [Docker docs: Live restore](https://docs.docker.com/engine/daemon/live-restore/) ("By default, when the Docker daemon terminates, it shuts down running containers.")
- [Docker docs: Alternative container runtimes](https://docs.docker.com/engine/daemon/alternative-runtimes/) ("Docker Engine uses containerd for managing the container lifecycle, which includes creating, starting, and stopping containers. By default, containerd uses runc as its container runtime."; "Examples of runtimes that implement their own containerd shims include: Wasmtime gVisor Kata Containers")
- [runc v1.5.2: README](https://github.com/opencontainers/runc/blob/v1.5.2/README.md) ("runc is a CLI tool for spawning and running containers on Linux according to the OCI specification.")
- [OCI runtime spec v1.3.0: spec.md](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/spec.md) ("The Open Container Initiative Runtime Specification aims to specify the configuration, execution environment, and lifecycle of a container."; "A container's configuration is specified as the config.json for the supported platforms")
- [OCI runtime spec v1.3.0: runtime.md, Lifecycle](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/runtime.md#lifecycle) ("While the resources requested in the config.json MUST be created, the user-specified program (from process) MUST NOT be run at this time."; "The runtime MUST run the user-specified program, as specified by process.")
- [OCI runtime spec v1.3.0: config-linux.md, Namespaces](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/config-linux.md#namespaces) ("If a namespace type is not specified in the namespaces array, the container MUST inherit the runtime namespace of that type.")
- The ps listing, the docker info lines, the config.json excerpt (shortened, values unchanged) and the connection error were produced in this session with Docker Engine 29.9.2, containerd b7a25261 and runc 1.5.2 on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1). The /run/containerd path for a separately started containerd was not checked on this machine.
