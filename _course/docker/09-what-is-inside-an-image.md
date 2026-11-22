---
title: What is inside an image?
short: Layers, whiteouts and the image config
summary: Module 1 treated an image as "the files a container starts from". Here's what an image really is on disk, file by file, and how one small change becomes part of a new image without copying the rest.
takeaway: An image is an ordered stack of layers plus an image config. Each layer is a tar archive of file changes; a deletion is stored as an empty whiteout file, .wh.<name>, so the deleted bytes stay in the layer below. The config says how to run the image and lists its layers in order.
---

## The problem

Puzzle 3 showed Docker mounting an image's files at /, and puzzle 0 said ten containers from one image are ten processes. But an image isn't one folder of files. alpine:3.20 downloaded as 3.6 MB and takes 12.2 MB on disk; an image that adds one file to Alpine doesn't download Alpine again. And a container can delete a file, yet the image it came from never changes. So what is an image made of?

## See it

```diagram layers
```

## The building block

`docker save` writes an image into one tar archive, so you can open it and look. Inside, each piece of the image is a **blob**: one file under blobs/sha256/. For alpine:3.20 on the run behind this page:

```
$ docker save alpine:3.20 -o alpine.tar && mkdir img && tar -xf alpine.tar -C img && find img -type f | sort
img/blobs/sha256/25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471
img/blobs/sha256/3a030ca3f633…   (7 more small files under blobs/sha256)
img/index.json
img/manifest.json
img/oci-layout
```

(`tar` is the archive format and the program that packs and unpacks it.) Seven of the eight blobs are JSON files, from a few hundred bytes to 73 kB. One is 3,630,321 bytes of gzip-compressed data. Unpack it and it is itself a tar archive of 517 entries: bin/, bin/busybox, bin/cat and the rest of Alpine. That archive is a **layer**: a set of file changes, packed as a tar. Alpine's only layer adds every file, because it starts from nothing.

The next layer starts from something. On the run behind this page, a container from alpine:3.20, called edit, ran a shell that wrote /notes.txt and deleted /etc/motd, then exited. `docker diff` lists what it changed, and `docker commit` turns those changes into a new image, notes:v1:

```
$ docker diff edit
A /notes.txt
C /etc
D /etc/motd
$ docker commit edit notes:v1
sha256:6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663
$ docker history notes:v1
IMAGE          CREATED                  CREATED BY                                      SIZE      COMMENT
6b8731de370c   Less than a second ago   sh -c echo hello > /notes.txt; rm /etc/motd     12.3kB
d9e853e87e55   7 months ago             CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      7 months ago             ADD alpine-minirootfs-3.20.10-x86_64.tar.gz …   8.47MB    buildkit.dockerfile.v0
```

notes:v1 is Alpine's layer, unchanged, plus one new layer of 12.3 kB. (The middle line made no layer: it only changed a setting, as its 0B says.) Saved and unpacked, the new layer holds exactly three entries:

```
drwxr-xr-x 0/0               0 2026-11-22 22:15 etc/
---------- 0/0               0 1970-01-01 00:00 etc/.wh.motd
-rw-r--r-- 0/0               6 2026-11-22 22:15 notes.txt
```

notes.txt is the added file. The deletion is the interesting one: a tar archive can't contain "the absence of a file", so the layer holds an empty file named .wh.motd. That is a **whiteout**: a file whose name says "delete motd from the layers below". When the layers are stacked (puzzle 10), the whiteout hides /etc/motd. The bytes of motd are still in layer 1, so deleting a file in a later layer never makes an image smaller.

Last, the **image config**: one of the small JSON files. For alpine:3.20 it says, among other things:

```json
"config": { "Env": ["PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
            "Cmd": ["/bin/sh"], "WorkingDir": "/" },
"rootfs": { "type": "layers",
            "diff_ids": ["sha256:08bc4e534116aa76b16015484b82eac51f9a593416feae9296c8a2d4bb7aa4a2"] }
```

Cmd is the program a container runs when docker run names none: that's why `docker run alpine:3.20` gives you a shell. rootfs lists the layers, bottom first, each by a long name that puzzle 13 explains; notes:v1's config lists two. The remaining small files tie a config and its layers together for downloading; puzzles 15 and 16 open them.

So an image is: an ordered stack of layers, and a config. Usually layers come from a Dockerfile (Module 3, coming soon), not from `docker commit`, but each step still records only what changed.

## The analogy

The flat's furniture arrives as a stack of delivery notes, oldest at the bottom. The first note lists everything for an empty flat. Each later note lists only changes: "add a desk", and for a removal, a slip that says "take away the old lamp". The lamp isn't collected; the slip just says nobody should see it. On top of the stack sits a card with the house rules: what the tenant does first on moving in, and which notes, in which order, make the flat.

## Run it yourself

On a Linux machine with Docker. Before the last command, predict how many entries the new layer has and what the deletion looks like.

```sh
docker run --name edit alpine:3.20 sh -c "echo hello > /notes.txt; rm /etc/motd"
docker diff edit
docker commit edit notes:v1
docker history notes:v1
mkdir n && docker save notes:v1 | tar -x -C n
for f in n/blobs/sha256/*; do tar -tzvf "$f" 2>/dev/null | grep -q notes.txt && tar -tzvf "$f"; done
docker rm edit
```

The loop looks inside every blob that is a gzip-compressed tar and prints the one that holds notes.txt. Output from the run behind this page, last command:

```
drwxr-xr-x 0/0               0 2026-11-22 22:15 etc/
---------- 0/0               0 1970-01-01 00:00 etc/.wh.motd
-rw-r--r-- 0/0               6 2026-11-22 22:15 notes.txt
```

Keep notes:v1: the next puzzles use it.

## Check yourself

- A container from notes:v1 deletes /notes.txt, and you commit it as notes:v3. How many layers does notes:v3 have, and how big is the new one?::*Three, and the new one is tiny: one whiteout||Two, because the change undoes layer 2 >> Layers only add on top; a deletion is a new layer with a whiteout. >> s4||Three, and the image shrinks by the size of notes.txt >> The bytes stay in layer 2; the whiteout only hides them. >> s4::Each commit adds a layer of changes; deleting hides, never removes.
- A 500 MB file is added in one layer and deleted in the next. Roughly how much does pulling the image download for it?::*About 500 MB: the lower layer still holds the file||Nothing: the whiteout cancels it out >> The whiteout hides the file in the merged view; layer 1's bytes still travel. >> s4||A few bytes: the two layers merge before download >> Layers are stored and moved separately, in order. >> s1::Deleting later doesn't take bytes out of earlier layers.
- You start a container from notes:v1 without naming a program. What does it run, and where does that choice come from?::*/bin/sh, from the image config's Cmd||Nothing, because docker commit drops the command >> The config was carried over; Cmd still says /bin/sh. >> s5||sh -c with the commit's command, from layer 2 >> Layers hold files only; how to run the image lives in the config. >> s5::Layers hold files; the config holds how to run.

## Sources

- [OCI image spec v1.1.1: Image Layer Filesystem Changeset](https://github.com/opencontainers/image-spec/blob/v1.1.1/layer.md) ("This document describes how to serialize a filesystem and filesystem changes like removed files into a blob called a layer. One or more layers are applied on top of each other to create a complete filesystem."; "A whiteout file is an empty file with a special filename that signifies a path should be deleted."; "A whiteout filename consists of the prefix .wh. plus the basename of the path to be deleted.")
- [OCI image spec v1.1.1: Image Configuration](https://github.com/opencontainers/image-spec/blob/v1.1.1/config.md) ("A layer DiffID is the digest over the layer's uncompressed tar archive")
- [Docker docs: docker container diff](https://docs.docker.com/reference/cli/docker/container/diff/) ("List the changed files and directories in a container᾿s filesystem since the container was created."; "A A file or directory was added D A file or directory was deleted C A file or directory was changed")
- [Docker docs: docker container commit](https://docs.docker.com/reference/cli/docker/container/commit/) ("Create a new image from a container's changes")
- [Docker docs: docker image save](https://docs.docker.com/reference/cli/docker/image/save/) ("Save one or more images to a tar archive (streamed to STDOUT by default)")
- [Docker docs: What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/) ("Images are made of layers. Each layer is a set of file changes: add these files, change those.")
- All output on this page was produced in this session with Docker Engine 29.9.2 (containerd image store) on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1).
