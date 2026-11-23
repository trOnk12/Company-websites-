---
title: Pulling from a registry
short: Manifests, blobs and the registry's HTTP API
summary: Puzzle 14 pushed images to a registry and pulled them by tag and by digest. Here's what a pull really sends over the network: which questions, in which order, and why a second image built on the same base downloads almost nothing.
takeaway: A registry stores images as blobs, each fetched by digest, and image manifests, fetched by tag or digest. A pull asks which manifest the tag points at, fetches that manifest, then fetches only the blobs the machine doesn't already have, each checked against its digest. A push works the same way in reverse and skips blobs the registry already holds.
---

## The problem

Puzzle 14 pushed two images that share two layers. Puzzle 13 explained why layers can be shared: same bytes, same digest. But how does the pulling machine find out which digests an image needs, before it has the image? And what exactly crosses the network?

## See it

```diagram pull-sequence
```

## The building block

A registry speaks ordinary HTTP (over HTTPS on the internet). GET asks for something; HEAD asks only for the answer's **HTTP headers**, the named lines of information that come before its body. The paths it answers follow a form the Open Container Initiative's distribution specification fixes. It stores two kinds of thing for each repository:

- blobs (puzzle 9): layers and configs, each fetched at /v2/<repository>/blobs/<digest>;
- the **image manifest**: a small JSON file naming one image config and its layers, each by digest and size, fetched at /v2/<repository>/manifests/<tag or digest>.

Because the API is plain HTTP, `curl` (a command that makes one HTTP request) can ask the same questions Docker asks. On the run behind this page, against the local registry from puzzle 14:

```
$ curl -s localhost:5000/v2/notes/tags/list
{"name":"notes","tags":["v1"]}
$ curl -sI -H "Accept: application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json" localhost:5000/v2/notes/manifests/v1
HTTP/1.1 200 OK
Content-Length: 744
Content-Type: application/vnd.oci.image.manifest.v1+json
Docker-Content-Digest: sha256:6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663
```

(Some headers left out.) The Accept line lists the kinds of manifest the client understands; the answer's Docker-Content-Digest header says which image the tag points at, by digest. Without -I, the same request returns the manifest itself:

```json
{
    "mediaType": "application/vnd.oci.image.manifest.v1+json",
    "schemaVersion": 2,
    "config": { "mediaType": "application/vnd.oci.image.config.v1+json",
                "digest": "sha256:1ba455ab667d527ef8d6ef9f3b7662afcee09510bb3a6d3832cdcc323cf6604b", "size": 840 },
    "layers": [
        { "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
          "digest": "sha256:25f1d6b1951ac8eb3740558fe94cb83d377bdadf95fd9f98b50d2e1b96130471", "size": 3630321 },
        { "mediaType": "application/vnd.oci.image.layer.v1.tar+gzip",
          "digest": "sha256:e6e50a1c310f711246955e7d5420539694b21b07a17d13690371a3d50657930c", "size": 165 }
    ]
}
```

Hashing those 744 bytes gives 6b8731de…: the manifest's own digest is notes:v1's ID (puzzle 13), and hashing the config blob fetched from /v2/notes/blobs/sha256:1ba455ab… gives 1ba455ab…. A digest the registry doesn't have gets 404 Not Found.

A pull, then, is a short conversation. The registry's own log for `docker pull localhost:5000/notes:stable`, on a machine that already had notes:v1:

```
HEAD /v2/notes/manifests/stable                       200
GET  /v2/notes/manifests/sha256:640e63e0bdab9baf…     200
GET  /v2/notes/blobs/sha256:8bce577cfdd9a025…         200
GET  /v2/notes/blobs/sha256:476c479cf4d4fd3e…         200
```

The tag is resolved to a digest first, then everything is fetched by digest. Resolving first with HEAD is cheap: it moves only headers, Docker Hub doesn't count it as a pull, and if the digest is one the machine already has, nothing else is fetched. Everything after that works by digest, so a tag that moves mid-pull can't mix two images. Of the manifest's three layers, the two notes:v1 already brought were not requested at all; only the config and the one new layer travelled. A push runs the same way backwards: the client asks whether each blob exists and uploads only the missing ones, which is the "Layer already exists" of puzzle 14.

Edges you will meet:

- Docker Hub is a registry too, at docker.io; `alpine` is short for docker.io/library/alpine. Docker Hub limits pulls: unauthenticated users get 100 pulls per 6 hours per address, and logged-in personal accounts 200. A build server that pulls on every run without logging in can hit that. The numbers change; your own limit is in the ratelimit-limit header of any manifest request (w= is the window in seconds), and a HEAD doesn't count. On the run behind this page, an anonymous request got ratelimit-limit: 100;w=3600. Docker's page adds that pulling an image built for several kinds of processor (puzzle 16) counts once for each kind pulled.
- Docker Hub asks for an **access token** first: a short-lived string that proves the request is allowed. A request without one gets 401 and a `WWW-Authenticate` header naming a token server, auth.docker.io; the client gets a token there, anonymously or with your login, and repeats the request with Authorization: Bearer and the token. On the run behind this page: HTTP/2 401 with www-authenticate: Bearer realm="https://auth.docker.io/token",service="registry.docker.io",scope="repository:library/alpine:pull". The local registry here has no login, so its log shows none of this.
- Docker talks plain, unencrypted HTTP only to local registries such as this one; every other registry must use HTTPS, unless the daemon is told otherwise with its insecure-registry setting.

## The analogy

The building orders furniture from a warehouse that answers two questions only: "which packing list is called this year's chair?" and "send me the box with this fingerprint". The concierge asks for the packing list, compares its fingerprints with the boxes already in the post room, and orders only the missing ones, checking each arrival against its label.

## Run it yourself

After puzzle 14's block, with its registry and notes:v1 and the moved tag stable. (Module 5, coming soon, explains ports.) Predict the tags list (stable from puzzle 14, plus v1) and which blobs the pull at the end asks for.

```sh
docker start reg 2>/dev/null || docker run -d --name reg -p 5000:5000 registry:2
docker tag notes:v1 localhost:5000/notes:v1 && docker push localhost:5000/notes:v1
curl -s localhost:5000/v2/notes/tags/list
curl -sI -H "Accept: application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json" localhost:5000/v2/notes/manifests/v1
curl -s -H "Accept: application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.v2+json" localhost:5000/v2/notes/manifests/v1 | sha256sum
docker rmi localhost:5000/notes:stable localhost:5000/notes:v2 && docker pull localhost:5000/notes:stable
docker logs --since 1m reg 2>&1 | grep -oE '"(HEAD|GET) [^"]*"' | tail -4
```

The rmi removes both names of the moved image, so the pull has something to fetch. If your machine uses a proxy for HTTP, add localhost to NO_PROXY first, or curl will ask the proxy. Output from a fresh run of puzzles 14 and 15 on the containerd image store (some headers left out, pull output shortened, digests cut to 8 characters):

```
{"name":"notes","tags":["v1","stable"]}
HTTP/1.1 200 OK
Content-Type: application/vnd.oci.image.manifest.v1+json
Docker-Content-Digest: sha256:6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663
6b8731de370cb2444f1fa5df09bd9342f56c4d2d0a79ed346e0e603a7eca4663  -
"HEAD /v2/notes/manifests/stable HTTP/1.1"
"GET /v2/notes/manifests/sha256:403955e9… HTTP/1.1"
"GET /v2/notes/blobs/sha256:213d2f04… HTTP/1.1"
"GET /v2/notes/blobs/sha256:8bd859a3… HTTP/1.1"
```

The order of the tags list may vary. With overlay2, the Content-Type is application/vnd.docker.distribution.manifest.v2+json, Docker's older format of the same thing, and the digest is the one docker push printed, not the image ID: on a second daemon using overlay2 it was 6dcc7602…, while that daemon's notes:v1 had the ID abb46f55…, its config's digest.

## Check yourself

- You pull an image built on alpine:3.20 that adds two layers; alpine:3.20 is already on your machine. Which blobs are downloaded?::*The manifest, the config and the two new layers||Every layer, since this is a new image >> Layers are fetched by digest, and Alpine's layer digest is already on disk. >> s4||Only the two new layers, since the manifest is optional >> The engine needs the manifest first: it is how it learns which digests to fetch. >> s2::Only what's missing, found through the manifest.
- A registry answers a tag request with a manifest whose layers list a digest the registry doesn't have. What happens when the engine asks for that blob?::*404 Not Found, so the pull fails||The registry sends the closest matching layer >> Blobs are found by exact digest only; a missing one is 404. >> s4||The engine builds the layer from the config >> The config only lists DiffIDs; the files must come from the blob. >> s2::A blob exists by digest or not at all.
- Why does a pull ask for the tag's digest first and then fetch the manifest by digest?::*So the rest is pinned even if the tag moves||Tags can only be used with HEAD requests >> The spec allows a tag or a digest in either request. >> the-building-block||The manifest is too big to fetch by tag >> Manifests are small; 744 bytes here. >> the-building-block::Resolve the tag once, then work by digest.

## Sources

- [OCI distribution spec v1.1.1: Pull](https://github.com/opencontainers/distribution-spec/blob/v1.1.1/spec.md#pull) ("The process of pulling an object centers around retrieving two components: the manifest and one or more blobs."; "To pull a manifest, perform a GET request to a URL in the following form: /v2/<name>/manifests/<reference>"; "<reference> MUST be either (a) the digest of the manifest or (b) a tag."; "A successful response SHOULD contain the digest of the uploaded blob in the header Docker-Content-Digest."; "To pull a blob, perform a GET request to a URL in the following form: /v2/<name>/blobs/<digest>"; "Clients SHOULD verify that the response body matches the requested digest."; "If the blob is not found in the repository, the response code MUST be 404 Not Found.")
- [OCI image spec v1.1.1: Image Manifest](https://github.com/opencontainers/image-spec/blob/v1.1.1/manifest.md) ("an image manifest provides a configuration and set of layers for a single container image for a specific architecture and operating system.")
- [Docker docs: docker image tag](https://docs.docker.com/reference/cli/docker/image/tag/) ("Host: docker.io (default) Namespace: library (default) Repository: alpine Tag: latest (default)")
- [Docker docs: Docker Hub pull usage and limits](https://docs.docker.com/docker-hub/usage/pulls/) ("Version checks do not count towards pull rate limits."; "A pull for a multi-arch image will count as one pull for each different architecture."; "These headers are returned on both GET and HEAD requests. Using GET emulates a real pull and counts towards the limit. Using HEAD won't.")
- [Docker docs: dockerd, insecure registries](https://docs.docker.com/reference/cli/dockerd/) ("By default, Docker assumes all registries to be secure, except for local registries."; "An insecure registry is either not using TLS (i.e., listening on plain text HTTP)")
- [Docker docs: Docker Hub usage and limits](https://docs.docker.com/docker-hub/usage/) ("Personal (authenticated) 200"; "Unauthenticated users 100 per IPv4 address or IPv6 /64 subnet"; "Pull rate limit per 6 hours")
- All requests, headers and hashes (including the Docker Hub 401, token and ratelimit headers) were produced in this session, on the containerd image store and on a second dockerd using the overlay2 storage driver, with Docker Engine 29.9.2 and the registry:2 image on the test machine (Ubuntu 24.04 userland in a Firecracker microVM, custom kernel 6.18.44, cgroup v1). The registry log lines are shortened to method, path and status.
