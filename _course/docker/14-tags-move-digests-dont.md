---
title: Tags move, digests don't
short: Repositories, tags and image references
summary: Puzzle 13 named every image by its content. People don't type 64 characters, so images also get short names like 3.20 and latest. Here's what those names really are, why the same name can give you a different image tomorrow, and how to ask for exactly one image.
takeaway: An image tag is a movable pointer from a short name to one image in a repository; a digest is the image's fixed name. Anyone allowed to push can move a tag, and latest is only the default tag, not the newest image. Pulling by tag gives whatever the tag points at today; pulling by name@sha256:… always gives the same image.
---

## The problem

You write `docker run alpine:3.20` in a script, and it works. Months later the same script, on a new machine, behaves differently, although nobody changed it. Or a teammate says "I'm on latest too", and your images differ. If puzzle 13's digest is the image's name, what is "3.20"? And how do you make sure two machines run exactly the same image?

## See it

```diagram tags
```

## The building block

Images of one program are kept together in a **repository**: alpine on Docker Hub is the repository library/alpine; on the run behind this page, notes is a repository on a **registry**, a server that stores images and hands them out: here a small one running on the same machine (puzzle 15 shows how it works). Inside a repository, each image is identified by its digest. An **image tag** is a short name pointing at one of them: 3.20, v1, stable, latest. A full image reference puts it together: host, repository, then either :tag or @digest, as in localhost:5000/notes:stable or localhost:5000/notes@sha256:6b8731de….

`docker tag` adds a name to an image; `docker push` sends it to the server under that name. On the run behind this page:

```
$ docker push --all-tags localhost:5000/notes
…
stable: digest: sha256:6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663 size: 744
v1: digest: sha256:6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663 size: 744
latest: digest: sha256:640e63e0bdab9bafed6cb68f4cad860c49e3521a3e35b3fe2a48e563bffb6d01 size: 959
v2: digest: sha256:640e63e0bdab9bafed6cb68f4cad860c49e3521a3e35b3fe2a48e563bffb6d01 size: 959
```

Four tags, two images. Then stable was moved:

```
$ docker tag localhost:5000/notes:v2 localhost:5000/notes:stable
$ docker push localhost:5000/notes:stable
stable: digest: sha256:640e63e0bdab9bafed6cb68f4cad860c49e3521a3e35b3fe2a48e563bffb6d01 size: 959
$ docker run --rm localhost:5000/notes@sha256:6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663 cat /notes.txt
hello
$ docker run --rm localhost:5000/notes:stable cat /notes.txt
hello
world
```

What that shows:

- A tag is a pointer, and pointers move. Whoever may push to the repository can point stable, 3.20 or latest at a different image at any time. Official images do it on purpose: alpine:3.20 is moved to each new 3.20.x release, so the same script can get a newer image next month.
- latest is no promise. It is the tag Docker uses when you write none (`docker pull alpine` means alpine:latest), and it points wherever the last push put it, which need not be the newest image.
- A digest never moves. An image reference with @sha256:… can only ever mean those exact bytes (puzzle 13), so it is how you pin an image: in production, on build servers, in anything that must be the same on every machine. The price is that you don't get fixes until you change the digest yourself, so pinned images need a deliberate way to update (Module 9, coming soon).
- Moving a tag deletes nothing. 6b8731de… was still there, pullable by digest, after stable left it.

A tag also has a twin on your own machine: `docker image ls` lists local names, and a local name can point at a different image from the same name on the server until you pull again.

## The analogy

Every delivery in the building gets its fingerprint label (the digest) and can also get name cards: "the usual chair", "this year's chair". The office can move a name card to a different box at any time; the fingerprint label never changes. Ask for "the usual chair" and you get whichever box the card sits on today. Ask for the fingerprint, and you get that box, always.

## Run it yourself

With puzzle 9's notes:v1 and a local registry (start it first: `docker run -d --name reg -p 5000:5000 registry:2`; puzzle 15 explains it). Predict the two cat outputs before you run them.

```sh
docker tag notes:v1 localhost:5000/notes:stable && docker push localhost:5000/notes:stable
docker run --name e2 notes:v1 sh -c "echo world >> /notes.txt" && docker commit e2 localhost:5000/notes:v2 && docker rm e2
docker tag localhost:5000/notes:v2 localhost:5000/notes:stable && docker push localhost:5000/notes:stable
docker run --rm localhost:5000/notes:stable cat /notes.txt
docker image inspect -f '{{.Id}}' notes:v1
docker run --rm localhost:5000/notes@sha256:PASTE_THE_ID_HERE cat /notes.txt
```

The second push prints the new digest for stable. The image inspect line prints notes:v1's ID, which with the containerd image store is its manifest's digest (puzzle 13): paste its hex part into the last command. On the run behind this page, the two cats printed "hello" and "world" on two lines, then "hello".

## Check yourself

- A Dockerfile in your project starts from alpine:3.20, and a build server built it last month. Today's build, with no change to your code, pulls again. Can it start from a different image?::*Yes: someone may have moved the tag||No: a tag always means the same image >> Tags are pointers that pushers can move; only a digest is fixed. >> s5||No: 3.20 is part of the image's own digest >> The digest is made from the content; a tag is a separate, movable name. >> s1::A tag can move between builds.
- You need every server to run exactly the image you tested. Which reference do you deploy?::*name@sha256:… with the tested image's digest||name:latest, so every server gets the newest >> latest is a movable tag, and not even necessarily the newest. >> s3||name:stable, after checking that stable points at it >> Someone can move stable after your check; a digest can't move. >> s5::Pin by digest.
- After stable moves to 640e63e0…, a colleague pulls localhost:5000/notes@sha256:6b8731de…. What happens?::*It works and gives hello: the image is still there||It fails: no tag points at that image any more >> Moving a tag deletes nothing; the image is still there under its digest. >> s5||It gives hello, world, because stable moved >> A digest names one image; the tag's move doesn't touch it. >> s6::Digests outlive tag moves.

## Sources

- [Docker docs: docker image tag](https://docs.docker.com/reference/cli/docker/image/tag/) ("Create a tag TARGET_IMAGE that refers to SOURCE_IMAGE"; "A Docker image reference consists of several components that describe where the image is stored and its identity."; "Tag: latest (default)")
- [Docker docs: docker image pull](https://docs.docker.com/reference/cli/docker/image/pull/) ("When using tags, you can docker pull an image again to make sure you have the most up-to-date version of that image."; "Docker enables you to pull an image by its digest. When pulling an image by digest, you specify exactly which version of an image to pull. Doing so, allows you to \"pin\" an image to that version, and guarantee that the image you're using is always the same."; "A digest takes the place of the tag when pulling an image")
- [OCI distribution spec v1.1.1: Pulling manifests](https://github.com/opencontainers/distribution-spec/blob/v1.1.1/spec.md#pulling-manifests) ("<reference> MUST be either (a) the digest of the manifest or (b) a tag.")
- The push, tag and run output was produced in this session against a local registry:2 container, with Docker Engine 29.9.2 (containerd image store) on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1). That official images such as alpine:3.20 are moved to each new 3.20.x release is inferred from the image's own annotation (org.opencontainers.image.version: 3.20.10 under the tag 3.20), not from a quoted policy.
