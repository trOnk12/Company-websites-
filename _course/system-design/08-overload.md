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

### Decide what to do at the door

A service can finish 100 equal-cost requests per second. With 300 already waiting ahead of you, the approximate wait alone is three seconds. A caller with half a second left would time out before service even begins. Refusing that work early frees room for useful requests. This estimate assumes a fixed completion rate and arrival order.

Run the browser model with peak 120, recovery 80, capacity 100 and a waiting limit of 300. After one minute, 1,200 more requests have arrived than could be served: 300 wait and 900 have been dropped. With spare capacity of 20 per second the queue drains in 15 seconds. A shorter queue improves waiting time by rejecting some work; count those refusals in your result.

## Go deeper: How do you admit a short burst?

Imagine twenty permits in a bucket. Each accepted call consumes one. Five permits return per second, up to twenty. After a quiet period twenty calls may pass together. A second burst can use only replenished permits. Each permit is a **token**. This rate limiter is called a token bucket. If four instances each independently grant twenty permits to the same client, the effective initial allowance can reach eighty.

- An empty bucket sees two full seconds of silence. How many requests can pass immediately?::Ten under these assumptions.

## Admit a request only if it can still finish

A limit on queue length bounds memory. The caller cares about time. Model one worker that processes ten equally expensive requests per second, one at a time. Four requests arrive together at time zero with 250 milliseconds left. How many can receive a timely result?

```python
def admit(arrivals_ms, service_ms, budget_ms):
    free_at = 0
    for arrival in arrivals_ms:
        start = max(arrival, free_at)
        finish = start + service_ms
        if finish > arrival + budget_ms:
            print(arrival, "refused; worker free at", free_at)
        else:
            free_at = finish
            print(arrival, "accepted; finishes at", finish)

admit([0, 0, 0, 0], service_ms=100, budget_ms=250)
```

Run this file with Python 3. Only the first two are accepted. The third would finish at 300 milliseconds. A refusal leaves the scheduled work unchanged. Change the last arrival to 100. Its deadline moves to 350, so the worker can finish it at 300. That is admission control: make a decision before adding work.

The model assumes a known service time. A real dependency can suddenly take longer. Measure actual completion times and refused requests together. A policy can reduce the waiting time of accepted requests merely by rejecting most arrivals.

## Try it

Give a request 500 milliseconds. Entry processing takes 60, the first dependency call takes 200, and the retry delay takes 100. Only 140 remain for all remaining work. Would you start a call that usually needs 180? Run the queue model and change only the arrival rate after the peak.

[Run the overload experiment](https://pachulski.dev/labs/parking-design/#queue)

## Check yourself

- What happens when arrivals equal capacity?::*The backlog stays level in this model||The old backlog disappears >> There is no spare capacity to clear old work. >> the-building-block::There is no spare capacity to clear old work.
- How much of the deadline remains?::240 milliseconds >> The delay between attempts consumes the deadline too. >> the-building-block||*140 milliseconds::The delay between attempts consumes the deadline too.
- What spreads simultaneous retries over time?::*Randomized delays||One fixed retry time >> A common retry time can recreate the burst. >> the-building-block::A common retry time can recreate the burst.

## Sources

- [Google SRE · Handling Overload](https://sre.google/sre-book/handling-overload/)
