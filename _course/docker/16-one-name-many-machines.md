---
title: One name, many machines
short: The image index, platforms and the OCI image spec
summary: Puzzles 9 to 15 took apart one image for one kind of machine. But the same name, alpine:3.20, works on an Intel server and on an Apple-silicon Mac. Here's the file that makes that possible, and the standard that every piece of an image follows.
takeaway: A tag can point at an image index: a list of image manifests, one per platform, plus attestation manifests that describe them. The engine picks the manifest for its own platform; another platform's programs fail with exec format error unless something translates them. The OCI image spec defines all of it: index, manifest, config, layers and digests.
---

## The problem

Puzzle 1 said every container shares the host's kernel, and puzzle 9 showed that a layer is a tar of ready-made programs. A program is instructions for one kind of processor: the bin/busybox inside alpine:3.20's layer can't run on an ARM processor if it was built for Intel's. Yet `docker pull alpine:3.20` works on an x86 server, on a Raspberry Pi and on an Apple-silicon Mac. One tag, one digest (puzzle 13 said a digest names exact bytes), different programs. How?

## See it

```diagram index-tree
```

## The building block

The digest alpine:3.20 points at, sha256:d9e853e8…, doesn't name an image manifest. It names an **image index**: a small JSON file listing image manifests, each with the **platform** it is for, the operating system and processor its programs are built for. Asked from the registry:

```
$ docker buildx imagetools inspect alpine:3.20
Name:      docker.io/library/alpine:3.20
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc

Manifests:
  Name:        docker.io/library/alpine:3.20@sha256:c64c687cbea9300178b30c95835354e34c4e4febc4badfe27102879de0483b5e
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/amd64
  …
  Name:        docker.io/library/alpine:3.20@sha256:6243dec9286873e0392f0527f96c394684dc6fa12661f0bd19253dcd5561e70a
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    unknown/unknown
  Annotations:
    vnd.docker.reference.type:                attestation-manifest
    …
```

(`docker buildx imagetools inspect` prints an image's index or manifest straight from its registry.) The full list on the run behind this page had 16 entries: 8 platforms, linux/amd64, linux/arm/v6, linux/arm/v7, linux/arm64/v8, linux/386, linux/ppc64le, linux/riscv64 and linux/s390x, each followed by an entry for unknown/unknown.

A pull follows one more pointer than puzzle 15 showed: tag → index → the manifest for this machine's platform → config and layers. On this linux/amd64 machine the engine picked c64c687c…, which names config bf8527eb… and layer 25f1d6b1…: the image puzzles 9 to 15 opened. The image ID that `docker image ls` shows for alpine:3.20 is the index's digest, d9e853e87e55, because that is what the tag names.

You can ask for another platform with `--platform`. On the same x86_64 machine:

```
$ docker run --rm --platform linux/arm64 alpine:3.20 uname -m
Unable to find image 'alpine:3.20' locally
3.20: Pulling from library/alpine
…
Digest: sha256:d9e853e87e55526f6b2917df91a2115c36dd7c696a35be12163d44e6e2a4b6bc
Status: Image is up to date for alpine:3.20
exec /bin/uname: exec format error
```

Same tag, same index digest, different manifest and layers, and the kernel refused to start an ARM program on an x86 processor. Running another platform's programs needs a translator in between, an emulator, which is how Docker Desktop on an Apple-silicon Mac can run linux/amd64 images (Module 8, coming soon). Without one, pull the platform that matches the machine, which Docker does by default. After that pull, `docker image ls alpine:3.20` showed 25.8 MB on disk instead of 12.2 MB: the containerd image store (puzzle 12) now kept two platforms under one name.

The unknown/unknown entries are attestations: manifests that aren't runnable images but records about one. Saved and opened, alpine:3.20's attestation for amd64 holds two layers of JSON: an SPDX bill of materials (predicateType https://spdx.dev/Document) and build provenance (https://slsa.dev/provenance/v0.2), each naming the amd64 manifest c64c687c… by digest. Checking those records is part of securing your supply of images (Module 7, coming soon).

All of this, the index, the manifest, the config, the layers with their whiteouts, and the digests that tie them, is one standard: the **OCI image spec**, from the Open Container Initiative, the same organisation as puzzle 8's runtime spec. Docker, containerd, registries and other tools all read and write images in this one format, which is why an image built with one tool runs with another.

## The analogy

The catalogue entry "the usual chair" doesn't point at one packing list but at a page of them: one for flats with high ceilings, one for low ceilings, one for each kind of building. The concierge reads the page and orders the list that fits this building. Order the wrong one, and the furniture arrives but doesn't fit through the door. Clipped to the page are certificates: what the chair is made of and which workshop built it.

## Run it yourself

On a Linux machine with Docker. Predict how many platforms are listed, and what the second command prints on your machine.

```sh
docker buildx imagetools inspect alpine:3.20 | grep Platform
docker run --rm --platform linux/arm64 alpine:3.20 uname -m
docker run --rm alpine:3.20 uname -m
docker image inspect -f '{{.Architecture}}' alpine:3.20
```

On the run behind this page (an x86_64 machine): 16 Platform lines, 8 of them unknown/unknown; then "exec /bin/uname: exec format error"; then x86_64; then amd64. On an arm64 machine, such as a Linux VM on an Apple-silicon Mac, the second command prints aarch64 instead, and you get the error by asking for linux/amd64.

## Check yourself

- A teammate on an Apple-silicon Mac and a build server on Intel both pull alpine:3.20 by the same index digest. Do they run the same layer bytes?::*No: each gets its own platform's manifest and layers||Yes: one digest means identical bytes >> The digest names the index; the index points at a different manifest per platform. >> s2||Yes, but the Mac converts them while unpacking >> Unpacking changes nothing; each machine pulls different layers. >> s3::One index, different manifests per platform.
- An image index lists only linux/amd64. You pull it on an arm64 Linux machine without an emulator. What happens when the container starts?::*It fails with exec format error, or no matching manifest is found||It runs slower, but runs >> Without an emulator, the kernel can't start another processor's programs. >> s5||The engine rebuilds the programs for arm64 >> Images carry ready-made programs; nothing is rebuilt on pull. >> s5::Platforms must match unless something translates.
- Where would you look to learn which packages are inside alpine:3.20 for amd64, without running it?::*Its attestation manifest's bill of materials||Its image config's history >> The history lists build steps, not the packages inside. >> s6||The index's list of platforms >> The index only lists manifests and their platforms. >> s2::Attestations describe the image.

## Sources

- [OCI image spec v1.1.1: Image Index](https://github.com/opencontainers/image-spec/blob/v1.1.1/image-index.md) ("The image index is a higher-level manifest which points to specific image manifests, ideal for one or more platforms.")
- [OCI image spec v1.1.1: Image Manifest](https://github.com/opencontainers/image-spec/blob/v1.1.1/manifest.md) ("Unlike the image index, which contains information about a set of images that can span a variety of architectures and operating systems, an image manifest provides a configuration and set of layers for a single container image for a specific architecture and operating system.")
- [OCI image spec v1.1.1: spec.md](https://github.com/opencontainers/image-spec/blob/v1.1.1/spec.md) ("This specification defines an OCI Image, consisting of an image manifest, an image index (optional), a set of filesystem layers, and a configuration."; "The goal of this specification is to enable the creation of interoperable tools for building, transporting, and preparing a container image to run.")
- [Docker docs: containerd image store](https://docs.docker.com/engine/storage/containerd/) ("Working with images that include attestations (provenance, SBOM). These use image indices that the classic store doesn't support.")
- The imagetools output (shortened with …), the exec format error, the architecture lines, the attestation contents and the 25.8 MB figure were produced in this session with Docker Engine 29.9.2 on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1). That Docker Desktop on Apple silicon runs amd64 images through emulation, and what an arm64 machine prints, were not run here.
