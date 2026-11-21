---
title: Where does the data live during a release?
short: Where does the data live during a release?
summary: Replace the running service while keeping its bookmark file.
takeaway: A named volume gives replacement containers access to the same stored data.
---

## The problem

Your integration test already showed that a fresh process can reopen the same file. Think of installing a new app version. Which part of the server should change with the release and which part should you be able to attach again?

## See it

```diagram release
```

## The building block

A **named volume** is a storage location Docker can attach to successive containers. Build the first image from the supplied Dockerfile. An image packages the program and its runtime. A container is a running instance with its own writable layer. The lab mounts a named volume at /data and points the database file there. Stop version one, then start version two on the same port with the same volume. Test the ready response and list river. A fresh volume gives a healthy but empty service. Readiness by itself cannot tell you which data you mounted.

### Separate the program version from its data

Version one writes river into volume A and is removed. Version two has the new code, an empty writable layer and volume A mounted at the database path. Reading river now tests continuity across replacement. Repeat with a new volume B. Version two can create an empty database there, start successfully and report an empty list. Compare the running version, the mount name and the actual file path. Each answers a different question. A named volume makes replacement possible; a separate, tested backup answers how to recover if that volume is lost.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#03-release)

### Optional local lab

Follow the two-version release in the lab. Save the test output, image names and the list before and after replacement.

[Open the local service source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- The new service is ready but lists no bookmarks. What do you compare first?::*The volume names and database paths||The screen layout on the phone >> The service itself returned an empty list. >> the-building-block::A named volume gives replacement containers access to the same stored data.

- Version two starts with volume B. Where should you first look for river?::Inside the new image by default >> The original write targeted the mounted storage. >> the-building-block||*In the original volume A::The original write targeted the mounted storage.
- What would demonstrate recovery from a lost volume?::*Restore an independent copy and read the expected row||Start the same image on a fresh empty volume >> The image supplies code, while the restored data must contain the row. >> the-building-block::The image supplies code, while the restored data must contain the row.

## Sources

- [Technical reference](https://docs.docker.com/engine/storage/volumes/)
