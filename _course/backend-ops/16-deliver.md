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

## Try it

Complete the final assessment. Deliver a project that a second person can run, test, diagnose and restore using only its instructions.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#graduation-project)

## Check yourself

- Which observation best closes the rollback drill?::*A real write and read on the recovered version||A successful command to start the old image >> Starting the image alone does not verify service behavior. >> the-building-block::A release gate connects a reproducible artifact to evidence that the service can serve real requests.

## Sources

- [Technical reference](https://sre.google/workbook/canarying-releases/)
