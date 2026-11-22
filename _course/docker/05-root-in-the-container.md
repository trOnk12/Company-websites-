---
title: Root in the container is root on the host
short: UIDs, root and the user namespace
summary: Puzzle 4's table showed one link that matched the host's, user. Here's what that one equal number means when a container's program touches a file on the host, and the namespace that would change it.
takeaway: The kernel decides what a process may do by its UID, and UID 0, root, passes its permission checks. Docker gives a container no user namespace by default, so its root is UID 0 on the host too, and could change a root-only host file through a mounted folder. A user namespace maps UID 0 inside to an ordinary UID outside; a non-root user inside the image avoids the problem without one.
---

## The problem

Puzzle 4 found every link of the container's process different from the host shell's, except one: user. Most images run their program as root, and inside the container that looks harmless: the root of a fenced-off box. But the kernel that checks every file access is the host's. When that program writes to a file, whose root does the kernel think it is?

## See it

```diagram user-ns
```

## The building block

Every process carries a UID, a user ID number, and every file records the UID of its owner and who may read or write it. On each access, the kernel compares the two. The **root user** is the user with UID 0: the kernel lets it past these permission checks, whatever the file says. On a Linux machine, root can change any file.

Look at the container's sleep from both sides:

```
$ docker exec box id -u
0
$ ps -eo user,uid,pid,cmd | grep "[s]leep 1000"
root         0  3393 sleep 1000
```

`id -u` prints the UID of the process that runs it. 0 inside, and 0 on the host: one number, because there's no second user namespace in between. The fences of puzzles 2 to 4 keep this root from seeing the host's processes, files and network, but they don't change who it is. The moment a host file gets into the container's tree, through a host folder mounted in with docker run's `-v` option (Module 5, coming soon), the kernel checks it against UID 0. On the run behind this page, a container changed a host file that only root may write: no error.

Docker does trim root inside a container: by default it removes many of root's special powers, such as loading code into the kernel (Module 7, coming soon). File permission checks are not among the powers it removes by default, as the run shows.

A **user namespace** is the fence for user IDs. A process can have UID 0 inside one and an ordinary UID outside it. Its **UID map** says which outside UID each inside UID really is, one range per line: inside start, outside start, how many. The run behind this page made one, as the ordinary user 1000, with `unshare --user --map-root-user`:

```
$ id -u
1000
$ unshare --user --map-root-user sh -c 'id -u; cat /proc/self/uid_map; echo changed > /tmp/secret/notes.txt'
0
         0       1000          1
sh: 1: cannot create /tmp/secret/notes.txt: Permission denied
```

Inside, the shell is UID 0; the map says that 0 is 1000 outside; the kernel checks the root-only file as 1000 and refuses. Inside the namespace it is root over what the namespace owns; to the host it is user 1000.

Docker can do the same for every container: its `userns-remap` setting maps each container's root to an unprivileged range of host UIDs. Docker's documentation calls it "available but not enabled by default", and warns that it adds "configuration complexity" when a container needs host resources such as mounted folders. The simpler fix, which works with or without it, is not to run as root inside at all: start the container with `--user 1000`, or set a non-root user in the image. On the run behind this page, the same write as UID 1000 got "Permission denied".

## The analogy

The building has one staff list, and the caretaker checks badges against it. A flat's head of household wears a badge reading "No. 0", the number on the building's master key. Frosted windows don't change the badge: if a door from the building opens into the flat, the caretaker sees badge No. 0 and lets him through. A user namespace is a flat with its own badge office: inside, he is No. 0 of the flat; at any building door, his badge is translated to No. 1000, which opens nothing special.

## Run it yourself

On a Linux machine with Docker, as the administrator. The first two lines make a host file that only root may write. Before each docker run, predict whether the write succeeds.

```sh
mkdir -p /tmp/secret && echo "only root may change this" > /tmp/secret/notes.txt
chmod 600 /tmp/secret/notes.txt
docker run --rm -v /tmp/secret:/data alpine:3.20 sh -c 'echo changed > /data/notes.txt'; cat /tmp/secret/notes.txt
docker run --rm --user 1000 -v /tmp/secret:/data alpine:3.20 sh -c 'echo changed > /data/notes.txt'
```

`chmod 600` lets only the file's owner (here root) read or write it, and `-v /tmp/secret:/data` mounts the host folder at /data inside. Output from the run behind this page:

```
changed
sh: can't create /data/notes.txt: Permission denied
```

The first container, root, changed the file; the second, UID 1000, was refused. To try the user namespace without Docker, run the unshare command above as an ordinary user, not as root.

## Check yourself

- A container runs as root by default, and you mount a host folder of root-owned configuration files into it. Its program has a bug that writes to every file it can. What happens to the host's files?::*They are changed: the kernel sees UID 0||They are safe: root inside a container has no rights on the host >> Without a user namespace, inside UID 0 is the host's UID 0, and the kernel checks files by UID. >> s3||They are safe: the mount namespace keeps host files out >> A folder mounted in with -v is in the container's tree on purpose. >> s2::Same UID, same rights over the mounted files.
- In a user namespace, a process is UID 0 inside and its map line reads 0 1000 1. It writes a host file only root may change. Why is it refused?::*The kernel checks host files as UID 1000, its outside UID||It isn't root inside: user namespaces turn root off >> Inside it is UID 0; the map only changes what that means outside. >> s4||Docker blocks every write to mounted folders >> No Docker setting is involved: the kernel refuses because of the UID map. >> s5::The map decides who it is to the host.
- Which change alone stops puzzle 5's first container from changing the root-only file?::*Running it with --user 1000||Giving it its own network namespace >> It already has one; the network fence doesn't change who checks a file. >> s3||Starting it from a different image of the same distribution >> The image's files don't change the UID the program runs as, unless the image sets a user. >> the-building-block::A non-root UID meets the file's permission check.

## Sources

- [Linux manual: capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html) ("traditional UNIX implementations distinguish two categories of processes: privileged processes (whose effective user ID is 0, referred to as superuser or root), and unprivileged processes (whose effective UID is nonzero). Privileged processes bypass all kernel permission checks")
- [Linux manual: user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html) ("a process can have a normal unprivileged user ID outside a user namespace while at the same time having a user ID of 0 inside the namespace; in other words, the process has full privileges for operations inside the user namespace, but is unprivileged for operations outside the namespace."; "Each line in the uid_map file specifies a 1-to-1 mapping of a range of contiguous user IDs between two user namespaces.")
- [OCI runtime spec v1.3.0: config-linux.md, Namespaces](https://github.com/opencontainers/runtime-spec/blob/v1.3.0/config-linux.md#namespaces) ("If a namespace type is not specified in the namespaces array, the container MUST inherit the runtime namespace of that type.")
- [Docker docs: Docker Engine security](https://docs.docker.com/engine/security/) ("As of Docker 1.10 User Namespaces are supported directly by the docker daemon. This feature allows for the root user in a container to be mapped to a non uid-0 user outside the container, which can help to mitigate the risks of container breakout. This facility is available but not enabled by default."; "By default, Docker starts containers with a restricted set of capabilities.")
- [Docker docs: Isolate containers with a user namespace](https://docs.docker.com/engine/security/userns-remap/) ("This re-mapping is transparent to the container, but introduces some configuration complexity in situations where the container needs access to resources on the Docker host, such as bind mounts"; "The best way to prevent privilege-escalation attacks from within a container is to configure your container's applications to run as unprivileged users. For containers whose processes must run as the root user within the container, you can re-map this user to a less-privileged user on the Docker host.")
- The id, ps, docker run and unshare outputs were produced in this session with Docker Engine 29.9.2 and util-linux 2.39.3 on Linux 6.18.44; the unshare command ran as UID 1000 (through setpriv). The container's runtime configuration listed the namespaces mount, network, time, uts, pid and ipc, and no user namespace.
