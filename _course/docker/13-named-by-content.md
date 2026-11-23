---
title: Named by its content
short: Digests, DiffIDs and image IDs
summary: Puzzle 9's blobs had 64-character names, and the image config listed its layer under yet another one. Here's where those names come from, why no two different contents get the same one, and what that lets Docker skip and check.
takeaway: A digest is sha256: plus the SHA-256 fingerprint of the exact bytes, and any change to the bytes changes it completely. Docker names every piece of an image by its digest: a compressed layer's digest is its file name, the unpacked layer's is its DiffID in the config, and, with the containerd image store, the image ID is the digest of what the tag names: a manifest here, an index for most pulled images (puzzle 16). The older overlay2 store uses the config's digest instead. So identical layers are stored once, and every download can be checked against its name.
---

## The problem

Puzzle 9's saved image was a folder of files with names like 25f1d6b1951ac8eb…, and the config listed its one layer as sha256:08bc4e534116…, a different name again. Puzzle 11 said ten containers share one image's layers, and notes:v1 reused Alpine's layer instead of storing a second copy. How does Docker know two layers are the same layer, without comparing them byte by byte? And if a download is corrupted, or tampered with on the way, how would anyone notice?

## See it

```diagram digest
```

## The building block

SHA-256 is a **hash function**: it reads any number of bytes and returns a 256-bit number, 64 hexadecimal characters. It is built so that the same bytes always give the same number, and no one has found a way to make two different contents with the same one. Written with the algorithm in front, sha256:5891b5b5…, it is a **digest**: a name made from the content itself.

```
$ printf "hello\n" | sha256sum
5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03  -
$ printf "hellp\n" | sha256sum
bf8c83416f31143ee2fa5db7ebbbb54589626c4c2046a91d28545bc403e3cda6  -
```

(`sha256sum` prints the SHA-256 of its input.) One letter changed, and nothing of the digest stays the same.

An image names every piece this way. In puzzle 9's saved alpine:3.20, each blob's file name is the digest of its own bytes; `sha256sum` over the folder printed eight lines whose two columns matched. A layer has two digests, because it exists in two forms:

| What | Digest | Where it is used |
| --- | --- | --- |
| the compressed layer, 3,630,321 bytes | sha256:25f1d6b1951a… | its blob's file name; the manifest's list of layers |
| the same layer unpacked, 8,092,160 bytes | sha256:08bc4e534116… | the image config's list of layers |

The second is the layer's **DiffID**: the digest of its uncompressed tar. It names the files themselves, whatever compression carried them. The same thing one level up: the manifest (the small JSON file that names an image's config and layers, puzzle 15) has its own digest, and with the containerd image store that digest is the image ID that docker image ls shows: notes:v1's ID, 6b8731de…, is the digest of its manifest. (With the older overlay2 storage driver the ID is the config's digest; on a second daemon using overlay2, alpine:3.20's ID was bf8527eb…, its config. The manifest digest only appears when you push, and docker image inspect -f '{{.RepoDigests}}' shows it.)

(With the older overlay2 storage, docker save writes layers uncompressed, so the blob's name is the DiffID itself; the server that hands images out (puzzle 14) still stores and names the compressed form.)

Naming by content gives Docker three things for free:

- **Sharing.** notes:v1's first layer has the same digest as alpine:3.20's, so it is the same blob: stored once, downloaded once, and pushing it again only gets the answer "Layer already exists" (puzzle 15).
- **Checking.** A download can be hashed and compared with the name it was asked for. A changed byte gives a different digest, so corruption or tampering shows.
- **Fixed references.** A digest can never point at different content later. An image named by digest is exactly that image, forever (puzzle 14).

A digest only proves the bytes match the name. It doesn't say who made them or whether they're safe: that is the job of signing and scanning images (Module 7, coming soon).

## The analogy

The post room labels every box with a fingerprint of its contents, not with a delivery number. Two flats ordering the same chair get boxes with the same label, so one box is enough for both. A box whose contents don't match its label was swapped or damaged on the way, and the post room refuses it.

## Run it yourself

With alpine:3.20 pulled. Predict whether the two columns will match on every line, and what the last command prints.

```sh
mkdir a && docker save alpine:3.20 | tar -x -C a
cd a/blobs/sha256 && for f in *; do echo "$(sha256sum < "$f" | cut -c1-12) ${f:0:12}"; done
docker image inspect -f '{{json .RootFS.Layers}}' alpine:3.20
```

The loop prints, for each blob, the start of its SHA-256 and the start of its file name. Output from the run behind this page (one line per blob, every one matching; one shown), then the DiffID list:

```
25f1d6b1951a 25f1d6b1951a
["sha256:08bc4e534116aa76b16015484b82eac51f9a593416feae9296c8a2d4bb7aa4a2"]
```

To see where the DiffID comes from, unpack the layer and hash it: gunzip -c 25f1d6b1951a… | sha256sum printed 08bc4e534116… on the run behind this page.

## Check yourself

- You rebuild an image and only one file in its top layer changes, by one byte. Which digests change?::*The top layer's, the config's and the manifest's||Only the top layer's >> The config lists the layer's DiffID, and the manifest lists the config's digest, so both change too. >> s6||None: one byte is too small to change a digest >> Any change gives a completely different digest. >> s3::A change ripples up through every name that lists it.
- Two different images both start from the same Alpine layer. How many copies of that layer does your machine keep?::*One, because both name it by the same digest||Two, one per image >> Same bytes, same digest, same blob: it is stored once. >> s4||None until a container starts >> Pulling stores the layer; sharing is by digest. >> s4::Same digest, one copy.
- A layer's compressed blob is re-compressed with different settings, giving different bytes but the same files. What happens to its two digests?::*The blob's digest changes, its DiffID stays the same||Both stay the same, since the files are identical >> The blob's digest covers the compressed bytes, which changed. >> s4||Both change, since the layer changed >> The DiffID covers the unpacked tar, which is identical. >> s5::Two forms, two digests.

## Sources

- [OCI image spec v1.1.1: Descriptor, Digests](https://github.com/opencontainers/image-spec/blob/v1.1.1/descriptor.md#digests) ("The digest property of a Descriptor acts as a content identifier, enabling content addressability. It uniquely identifies content by taking a collision-resistant hash of the bytes. If the digest can be communicated in a secure manner, one can verify content from an insecure source by recalculating the digest independently, ensuring the content has not been modified.")
- [OCI image spec v1.1.1: Image Configuration, Layer DiffID](https://github.com/opencontainers/image-spec/blob/v1.1.1/config.md) ("A layer DiffID is the digest over the layer's uncompressed tar archive and serialized in the descriptor digest format"; "Do not confuse DiffIDs with layer digests, often referenced in the manifest, which are digests over compressed or uncompressed content.")
- [Docker docs: docker image pull](https://docs.docker.com/reference/cli/docker/image/pull/) ("Docker uses a content-addressable image store, and the image ID is a SHA256 digest covering the image's configuration and layers."; "Because they are the same image, their layers are stored only once and do not consume extra disk space.")
- All hashes on this page were computed in this session with sha256sum on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1), Docker Engine 29.9.2 with the containerd image store.
