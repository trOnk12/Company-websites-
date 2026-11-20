---
title: Why can retries prolong an outage?
short: Why can retries prolong an outage?
summary: Calculate backlog growth and recovery time.
takeaway: The backlog drains only when completion capacity exceeds new demand.
---

## The problem

After a concert, the service receives 120 reservations per second and completes 100. Drivers retry after a few seconds. How long until it catches up?

## See it

```diagram overload
```

## The building block

With constant rates, no rejections and no retries, the **backlog**, the number of requests still waiting, grows by twenty per second. After a minute, 1,200 requests are waiting. When arrivals drop to eighty per second, twenty completions per second are available to drain the backlog. Recovery takes another minute. If arrivals stay at one hundred, the old backlog stays.

Bound both work in flight and waiting work. Before admitting work, ask whether it can finish before the caller's deadline. Distinguish a per-client limit from whole-service overload. Give retries one owner, a maximum number of attempts, increasing delays and randomized timing. Three layers each making three total attempts can generate up to twenty-seven calls at the last dependency.

## Go deeper: How do you admit a short burst?

Imagine twenty permits in a bucket. Each accepted call consumes one. Five permits return per second, up to twenty. After a quiet period twenty calls may pass together. A second burst can use only replenished permits. Each permit is a **token**. This rate limiter is called a token bucket. If four instances each independently grant twenty permits to the same client, the effective initial allowance can reach eighty.

- An empty bucket sees two full seconds of silence. How many requests can pass immediately?::Ten under these assumptions.

## Try it

Give a request 500 milliseconds. Entry processing takes 60, the first dependency call takes 200, and the retry delay takes 100. Only 140 remain for all remaining work. Would you start a call that usually needs 180? Run the queue model and change only the arrival rate after the peak.

[Open the runnable lab and instructions](https://github.com/trOnk12/Company-websites-/tree/main/labs/parking-design)

## Check yourself

- What happens when arrivals equal capacity?::*The backlog stays level in this model||The old backlog disappears >> There is no spare capacity to clear old work. >> the-building-block::There is no spare capacity to clear old work.
- How much of the deadline remains?::240 milliseconds >> The delay between attempts consumes the deadline too. >> the-building-block||*140 milliseconds::The delay between attempts consumes the deadline too.
- What spreads simultaneous retries over time?::*Randomized delays||One fixed retry time >> A common retry time can recreate the burst. >> the-building-block::A common retry time can recreate the burst.

## Sources

- [Google SRE · Handling Overload](https://sre.google/sre-book/handling-overload/)
