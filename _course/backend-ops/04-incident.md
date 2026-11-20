---
title: Alive, ready, or serving the wrong thing?
short: Alive, ready, or serving the wrong thing?
summary: Diagnose a storage failure and rehearse recovery.
takeaway: A process can answer a simple probe while its storage path fails.
---

## The problem

The process is running and the phone still gets errors. Should the operator restart the program, replace its image or investigate storage first?

## See it

```diagram incident
```

## The building block

A **readiness probe** asks whether an instance can currently serve its expected work. The live route only proves the handler can answer. The ready route reads from the bookmark table. In the disposable incident drill, rename the table while the process runs. Live still returns 200. Ready and bookmark writes return 503. The server log points to storage. Restore the table and retry a real write. A successful read probe alone cannot prove that a disk accepts writes. For a code regression with a compatible database, practice starting the previous image and checking the saved row.

## Try it

Run the incident drill. Write a short incident report and rehearse the rollback. Include one condition under which reverting the image would be insufficient.

[Open the runnable bookmark lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- The read probe succeeds after recovery. What should you verify next?::*A real write and its stored result||Only that the process has the same identifier >> A running process can still fail to write. >> the-building-block::A process can answer a simple probe while its storage path fails.

## Sources

- [Technical reference](https://docs.docker.com/engine/storage/volumes/)
