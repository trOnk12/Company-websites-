---
title: What goes in a Docker image?
short: What goes in a Docker image?
summary: Predict which files a replacement container can read and write.
takeaway: The image supplies the program. A writable mount supplies the database when the container filesystem is read-only.
---

## The problem

Your release used a named volume. What happens if the server can read its program but cannot create its database?

## See it

```diagram image
```

## The building block

Read the Dockerfile from top to bottom. The base supplies Python, the copy instruction adds the source file, the user instruction selects the runtime identity and the command starts the process. A build produces an image. Starting that image creates a container. In the drill the container filesystem is read-only and the volume mounted at /data is writable by the application user. SQLite also needs to create journal files beside its database. Granting write access only to the database file can still leave writes broken.

## Try it

Compare the two runs in the Docker filesystem drill. Explain the failing startup using the first error in the log.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#docker-filesystem-drill)

## Check yourself

- Which path needs write access in this lab?::*The mounted data directory||The entire application source directory >> The service only reads its code. >> the-building-block::The image supplies the program. A writable mount supplies the database when the container filesystem is read-only.

## Sources

- [Technical reference](https://docs.docker.com/engine/storage/volumes/)
