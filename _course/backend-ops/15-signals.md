---
title: Which users felt the slowdown?
short: Which users felt the slowdown?
summary: Compare request durations, failures and resource pressure.
takeaway: A percentile describes an ordered sample. Averages can hide a slow group.
---

## The problem

**Response time** is elapsed time from sending a request to receiving its response. A route usually answers in ten milliseconds. Six of a hundred requests now take two hundred. Which measurement exposes the slow group?

## See it

```diagram signals
```

## The building block

Sort the hundred timings. Using nearest rank, the ninety-fifth percentile is the value at position 95. Here it is 200 milliseconds even though the mean is only 21.4. Record request count and failures separately. A fast error can lower mean response time while availability worsens. A log gives details for one event, a metric aggregates events, and a trace connects steps of one request. Compare a database span with total request time before blaming the database.

## Try it

Run the response-time fixture. Reduce the slow group to five and predict the nearest-rank result. Write a service objective with a time window and an error threshold.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- All failed requests return quickly. Which signal is essential alongside response time?::*The fraction of failed requests||Only the fastest observed duration >> Fast failures still hurt availability. >> the-building-block::A percentile describes an ordered sample. Averages can hide a slow group.

## Sources

- [Technical reference](https://sre.google/sre-book/monitoring-distributed-systems/)
