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

### Calculate the threshold by hand

For 94 requests at 10 ms and six at 200 ms, total time is 2,140 ms across 100 requests. The mean is 21.4 ms. In sorted order positions 1 through 94 are fast and position 95 is slow. Change one slow request into a fast one: the 95th position drops to 10 ms while five callers still wait 200 ms. Alongside the percentile record the sample size, time window and outcomes. To combine two groups, combine their timings or compatible counts per duration range. Averaging the groups' percentile numbers loses how many requests each supplied.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#15-signals)

### Optional local lab

Run the response-time fixture. Reduce the slow group to five and predict the nearest-rank result. Write a service objective with a time window and an error threshold.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- All failed requests return quickly. Which signal is essential alongside response time?::*The fraction of failed requests||Only the fastest observed duration >> Fast failures still hurt availability. >> the-building-block::A percentile describes an ordered sample. Averages can hide a slow group.

- Five of a hundred requests take 200 ms and the others take 10 ms. What is nearest-rank p95?::200 ms >> In this sample position 95 is still fast. >> the-building-block||*10 ms::In this sample position 95 is still fast.
- One slow request lasts 200 ms but its database span is 15 ms. What does that establish?::*Most elapsed time is outside that measured span||The database accounts for the whole delay >> A measured part must be compared with the complete request. >> the-building-block::A measured part must be compared with the complete request.

## Sources

- [Technical reference](https://sre.google/sre-book/monitoring-distributed-systems/)
