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

### Diagnose the first write

An image contains the service code. At startup the program tries to create /data/bookmarks.db. With a read-only container filesystem and no separate mount, creation fails. A read-only mount at that path also fails. With a writable mounted directory accessible to the process user, the database can be created and its first transaction can write its journal beside it. If a working setup fails after replacing the container, inspect the mounted path, its write setting and the identity of the running user before rebuilding the image.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#13-image)

### Optional local lab

Compare the two runs in the Docker filesystem drill. Explain the failing startup using the first error in the log.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#docker-filesystem-drill)

## Check yourself

- Which path needs write access in this lab?::*The mounted data directory||The entire application source directory >> The service only reads its code. >> the-building-block::The image supplies the program. A writable mount supplies the database when the container filesystem is read-only.

- Why can the service read its source while creating a database fails?::A running process can write wherever it can read >> Creating a file requires a writable directory. >> the-building-block||*The two operations require different filesystem permissions::Creating a file requires a writable directory.
- Which change makes later container replacement retain the database?::*Attach the existing data volume at the configured path||Rebuild identical program source in another image >> The durable file belongs to the mounted storage. >> the-building-block::The durable file belongs to the mounted storage.

## Sources

- [Technical reference](https://docs.docker.com/engine/storage/volumes/)
