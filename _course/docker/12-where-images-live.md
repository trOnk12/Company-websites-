---
title: Where images live on disk
short: The containerd image store, snapshotters and overlay2
summary: Puzzles 9 to 11 followed layers from a tar archive to an overlay mount. Here's where Docker keeps them in between, why an image takes more disk than its download, and how to tell which of Docker's two ways of storing images your machine uses.
takeaway: Docker 29 keeps images in the containerd image store by default on new installations: each layer is kept compressed, as downloaded, in containerd's content store, and a snapshotter (overlayfs) unpacks it into a directory that becomes a lower directory. So an image takes its download size plus its unpacked size. Installations upgraded from older Docker keep the overlay2 storage driver, which stores only the unpacked layers; docker info tells you which one you have.
---

## The problem

Puzzle 9's alpine:3.20 downloaded 3.6 MB, and its layer unpacks to 8.1 MB of files. On the run behind this page, `docker image ls` said it takes 12.2 MB. That's neither number: more than both. And puzzle 10's mount line listed directories with long containerd names, while older guides point to a different folder altogether. Which is right, and where do your images really live?

## See it

```diagram image-store
```

## The building block

Docker has two ways to keep images, and a machine uses one of them.

The **containerd image store** is the default for Docker Engine 29 and later on new installations. It hands image storage to containerd (the program from puzzle 8), which keeps each layer twice:

1. Compressed, exactly as it was downloaded, in its content store: on the test machine, Alpine's layer is the file …/io.containerd.content.v1.content/blobs/sha256/25f1d6b1951a…, 3,630,321 bytes.
2. Unpacked, as a directory of plain files, prepared by a **snapshotter**: the containerd component that turns layers into directories (snapshots) and stacks them for a container. The default snapshotter is overlayfs; Alpine's layer became …/snapshots/1/fs, 8.1 MB, the directory you saw as a lowerdir in puzzle 10.

That's why `docker image ls` shows two sizes:

```
$ docker image ls alpine:3.20
IMAGE         ID             DISK USAGE   CONTENT SIZE   EXTRA
alpine:3.20   d9e853e87e55       12.2MB         3.71MB
```

Content size is what was downloaded (the compressed layer plus a few small JSON files); disk usage counts the compressed copy and the unpacked one. Docker's documentation says it plainly: the containerd image store uses more disk space because it stores images in both compressed and uncompressed formats. In return, it can keep images for several kinds of processor and the extra files some images carry (puzzle 16), and push or save an image without packing its layers again.

The older way is a **storage driver**. Installations upgraded from before Docker 29 keep using one until someone switches, and on Linux it is almost always overlay2. It stores only the unpacked layers, under /var/lib/docker/overlay2, and builds the same kind of overlay mount for each container. The mechanism of puzzles 10 and 11 is the same with either: read-only lower directories, one writable upper directory per container.

Which one does your machine use? `docker info` says:

```
$ docker info --format '{{.Driver}} {{.DriverStatus}}'
overlayfs [[driver-type io.containerd.snapshotter.v1]]
```

"overlayfs" with driver-type io.containerd.snapshotter.v1 is the containerd image store with its overlayfs snapshotter. "overlay2" would be the storage driver. On the test machine dockerd started its own containerd, so the store sits under /var/lib/docker/containerd/daemon/; where it sits on yours depends on how containerd runs there, which is one more reason to trust `docker image ls` and `docker system df` rather than walking the folders. Docker's documentation also warns against changing anything under /var/lib/docker by hand.

Two edges. The containerd image store doesn't work with puzzle 5's userns-remap setting, so a daemon using that keeps the storage driver. And switching between the two doesn't move images: Docker's documentation says the other backend's images and containers stay on disk but become hidden until you switch back.

## The analogy

The building keeps two copies of every delivery: the sealed box exactly as the courier brought it, on a shelf in the post room, and the unpacked furniture laid out in a storeroom, ready to show through any flat's floor. The old building kept only the unpacked furniture: less room, but nothing to hand straight back to a courier.

## Run it yourself

On a Linux machine with Docker. Predict, before running, whether your disk usage is bigger than your content size, and which storage your daemon reports.

```sh
docker info --format '{{.Driver}} {{.DriverStatus}}'
docker pull alpine:3.20
docker image ls alpine:3.20
docker system df
```

With the containerd image store, expect disk usage well above content size, as above. With overlay2, docker info prints overlay2 and its own details instead.

## Check yourself

- A machine with the containerd image store pulls an image whose layers are 200 MB compressed and 600 MB unpacked. Roughly how much disk does it take?::*About 800 MB: compressed and unpacked copies||About 600 MB: only the unpacked files are kept >> That's the older storage driver; the containerd store keeps both. >> s5||About 200 MB: layers stay compressed until a container starts >> The snapshotter unpacks them when the image is pulled. >> s3::Both copies stay.
- A teammate's `docker info` shows Storage Driver: overlay2; yours shows overlayfs with driver-type io.containerd.snapshotter.v1. What differs?::*Yours keeps compressed layers too, theirs only unpacked ones||Theirs can't run containers on an overlay mount >> Both build the same overlay mount: lower directories and one upper. >> s6||Yours unpacks layers into one merged directory per image >> Each layer is still its own directory, stacked for each container. >> s3::Same overlay mounts, different storage of layers.
- Which directory becomes a lower directory of a container from alpine:3.20 on the containerd image store?::*The snapshot directory with the unpacked files||The compressed blob in the content store >> A compressed tar can't be mounted; the snapshotter's unpacked directory is. >> s3||The container's writable layer >> That's the upper directory, one per container. >> s3::The snapshotter's directory is what gets mounted.

## Sources

- [Docker docs: containerd image store](https://docs.docker.com/engine/storage/containerd/) ("The containerd image store is the default storage backend for Docker Engine 29.0 and later on fresh installations. If you upgraded from an earlier version, your daemon continues using the legacy graph drivers (overlay2) until you enable the containerd image store."; "containerd stores images in both compressed and uncompressed formats, while the legacy drivers stored only the uncompressed layers. When you pull an image, containerd keeps the compressed layers (as received from the registry) and also extracts them to disk."; "Building and storing multi-platform images locally."; "The containerd image store is not available when using user namespace remapping ( userns-remap )."; "Switching storage backends temporarily hides images and containers created with the other backend. Your data remains on disk.")
- [Docker docs: OverlayFS storage driver](https://docs.docker.com/engine/storage/drivers/overlayfs-driver/) ("After downloading a five-layer image using docker pull ubuntu , you can see six directories under /var/lib/docker/overlay2 ."; "Don't directly manipulate any files or directories within /var/lib/docker/ .")
- [Docker docs: Engine 29 release notes](https://docs.docker.com/engine/release-notes/29/) ("containerd image store is now the default for fresh installs .")
- The docker info line, the docker image ls line (taken right after pulling alpine:3.20, before puzzle 16 pulled a second platform), the blob size and the snapshot size were read in this session with Docker Engine 29.9.2 on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1).
