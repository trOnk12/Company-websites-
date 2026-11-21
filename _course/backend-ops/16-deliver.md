---
title: What evidence earns a release?
short: What evidence earns a release?
summary: Ship a change with tests, a recovery path and a capacity argument.
takeaway: A release gate connects a reproducible artifact to evidence that the service can serve real requests.
---

## The problem

Your change passes on your laptop. What would another engineer need in order to release it and recover if it fails?

## See it

```diagram deliver
```

## The building block

Start from a clean checkout and run the contract and integration tests. Build the image once and record its identity. Promote the tested artifact with environment-specific configuration supplied at runtime. A readiness probe covers one dependency path. Add a real write and read to the smoke test. Estimate load using requests per second and measured time per request. At a steady ten requests per second and an average response time of half a second, about five requests are in flight on average. Use a load experiment to find when queueing, errors or response times increase. Keep the previous compatible version available for rollback.

### Rehearse the failure the release gate claims to cover

At noon the independent backup contains river. At 12:05 the service acknowledges hill. At 12:10 the data disk fails. Restoring only the noon snapshot recovers river and loses the acknowledged hill. Restoring that snapshot and an intact log containing the committed write can recover both. Run a read for both identities, make one new write and record the elapsed recovery time. A reviewer can now compare observed data loss and time offline with the promises made before release. A successful deployment test on an empty database covers a different failure.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#16-deliver)

### Optional local lab

Complete the final assessment. Deliver a project that a second person can run, test, diagnose and restore using only its instructions.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#graduation-project)

## Check yourself

- Which observation best closes the rollback drill?::*A real write and read on the recovered version||A successful command to start the old image >> Starting the image alone does not verify service behavior. >> the-building-block::A release gate connects a reproducible artifact to evidence that the service can serve real requests.

- Why keep the exact identity of the image tested in staging?::To guarantee that any later rebuild behaves identically >> The release evidence refers to the tested artifact. >> the-building-block||*To release the same artifact that passed the checks::The release evidence refers to the tested artifact.
- Which evidence exposes the limit of a noon-only backup?::*A missing acknowledged 12:05 write in the restored copy||A healthy readiness result after restart >> A healthy process can still be missing committed history. >> the-building-block::A healthy process can still be missing committed history.

## Sources

- [Technical reference](https://sre.google/workbook/canarying-releases/)
