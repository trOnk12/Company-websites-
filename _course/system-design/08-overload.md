---
title: Why can retries prolong an outage?
short: Why can retries prolong an outage?
summary: Follow one queue until retries either stop or keep it full.
takeaway: Recovery begins only when total arrivals, including retries, fall below completion capacity.
---

## The problem

The booking service can finish 100 requests each second. After a concert, 120 new requests arrive each second. Its waiting queue can hold 300 requests.

During the first fifteen seconds, twenty more requests arrive than finish each second:

```text
queue growth = 120 arrivals - 100 completions = 20 requests/s
time to fill = 300 requests ÷ 20 requests/s = 15 seconds
```

The burst lasts sixty seconds. Once the queue is full, another twenty requests are refused each second:

```text
time at the full limit = 60 - 15 = 45 seconds
refused = 45 seconds × 20 requests/s = 900 requests
```

Then new traffic falls to 80 requests per second. That sounds like recovery: capacity is still 100. But clients now send 20 retry attempts per second. Total arrivals remain 100, so there is no net spare capacity to shrink the 300-request **backlog**, the accepted work not yet finished. Completed queued requests are replaced by 100 arriving attempts.

## See it

```diagram overload
```

Stop after step three. New traffic is 80 per second, retries add 20 and capacity is 100. Predict what happens to the full queue.

## The building block

Here the backlog is the queue of at most 300 requests.

Use total arrivals, not only new user actions:

```text
total arrivals = new requests + retry attempts
spare capacity = completion capacity - total arrivals
```

When new traffic drops to 80 and retries stop, spare capacity is twenty per second. The queue drains in fifteen seconds:

```text
300 waiting ÷ 20 spare completions/s = 15 seconds
```

When retries continue at twenty per second, total arrivals equal capacity. Spare capacity is zero. The service is no longer getting worse, but it is not recovering either. A retry intended to improve reliability has preserved the overloaded state.

A **retry budget** limits retry work by attempt count or elapsed time. The client also retries only failures that may be temporary, waits longer between attempts and adds random timing so many clients do not return together. One layer should own the retry for a dependency; otherwise retries at several layers multiply.

The queue limit is **admission control**: the service refuses new work when accepting it would exceed a chosen waiting bound. This protects memory and waiting time. It does not create more completion capacity. A refusal must tell the caller whether to stop, retry later or use a degraded result; otherwise immediate retries can replace every refused request.

## Run the same traffic with two retry policies

The SQL simulates one-second buckets. Both policies see sixty seconds at 120 new requests per second, then sixty seconds at 80. Capacity is 100 per second and the queue limit is 300.

The only difference is how long retry traffic continues:

- One policy stops retries when recovery traffic begins at second 60.
- The other continues twenty retry attempts per second through second 120.

Before running, predict the queue at seconds 15, 60, 75 and 120 for both policies.

The first named block holds every assumption in one row, so each Try it change has one edit. The opening words tell SQLite that the later simulation block may use its previous row to create its next row. One repeated step:

1. starts with the queue and refused count at the end of the previous second;
2. chooses peak or recovery traffic and adds retries when their policy is still active;
3. subtracts 100 completions;
4. keeps the queue between zero and its limit;
5. adds overflow above the limit to the refused count.

```sql run
WITH RECURSIVE
parameters(capacity, queue_limit, peak_rate, recovery_rate, retry_rate, peak_until, simulation_until) AS (
  VALUES (100, 300, 120, 80, 20, 60, 120)
),
policy(name, retry_until) AS (
  VALUES ('no_retries_after_peak', 60),
         ('unbounded_retries', 120)
),
traffic(name, retry_until, second, queued, dropped) AS (
  SELECT name, retry_until, 0, 0, 0
  FROM policy

  UNION ALL

  SELECT name,
         retry_until,
         second + 1,
         MIN(queue_limit, MAX(0,
           queued
           + CASE WHEN second < peak_until THEN peak_rate ELSE recovery_rate END
           + CASE WHEN second >= peak_until AND second < retry_until THEN retry_rate ELSE 0 END
           - capacity
         )),
         dropped + MAX(0,
           queued
           + CASE WHEN second < peak_until THEN peak_rate ELSE recovery_rate END
           + CASE WHEN second >= peak_until AND second < retry_until THEN retry_rate ELSE 0 END
           - capacity - queue_limit
         )
  FROM traffic, parameters
  WHERE second < simulation_until
)
SELECT name, second, queued, dropped
FROM traffic
WHERE second IN (15, 60, 75, 120)
ORDER BY name, second;
```

Both policies reach 300 queued at second 15 and 900 refused by second 60. With no recovery retries, the queue reaches zero at second 75. With twenty retries per second, it remains at 300 even at second 120.

The model deliberately keeps capacity and cost fixed. Production work is not uniform: overload can slow each request, reduce completion capacity and make this feedback loop worse. Measure new requests, retry attempts, queue age, refusals, completions and response time separately; a single total request rate hides the cause.

## Failure: every layer retries

Suppose the phone makes at most three attempts to the edge service. For every phone attempt, the edge service makes at most three attempts to the booking service. For every booking-service attempt, the database client makes at most three attempts.

One user action can now create as many as:

```text
3 phone attempts × 3 edge-service attempts × 3 database attempts = 27 database calls
```

The multiplication is a worst-case upper bound, not a prediction of normal traffic. Repair it by assigning retry ownership to the layer that understands the dependency failure, limiting attempts and elapsed time, and propagating a deadline so a lower layer does not start work after the caller has given up.

## Go deeper: Can this request finish before its deadline?

A queue length bounds memory. The caller experiences time.

One worker needs 100 milliseconds per request. Four requests arrive together with 250 milliseconds remaining. The first finishes at 100, the second at 200, and the third would finish at 300—after its deadline. Refusing the third and fourth requests avoids work whose answers would be discarded.

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

This estimate assumes known service time and arrival order. A real service must measure the distribution of completion times. Report accepted response time and refusals together: rejecting most requests can make the response time of the surviving requests look excellent.

- The worker becomes free at 200 ms. A new request arrives at 100 ms with 250 ms remaining. Can it finish?::Yes. It starts at 200 and finishes at 300, before its deadline at 350.

## Try it

### 1. Prove the first full second

Replace the final result query with the query below. It asks for the earliest row at the queue limit instead of merely showing that second 15 is full.

```sql
SELECT name, MIN(second) AS first_full_second
FROM traffic, parameters
WHERE queued = queue_limit
GROUP BY name;
```

### 2. End retries earlier

In the policy values, change the unbounded retry end from 120 to 70. Predict its queue at second 75, then run: ten seconds without spare capacity leave five seconds to drain 100 requests.

### 3. Add one retry per second

In the parameters row, change the one retry rate from 20 to 21. Explain why the full queue now refuses one additional request every second even after new traffic falls.

### 4. Shorten the queue

In the parameters row, change the one queue limit from 300 to 100. Compare time to fill, refused requests and recovery time. State which metric improved and which got worse.

### 5. Spend one deadline

Give one request a 500 ms deadline. Entry work uses 60 ms, the first dependency call 200 ms and retry delay 100 ms. Calculate the 140 ms left and refuse a second call that normally needs 180 ms.

[Run the existing overload controls with different rates](https://pachulski.dev/labs/parking-design/#queue)

You have passed when you can calculate queue growth, identify retries as arrivals, reproduce a queue that cannot drain and change one retry limit so recovery completes.

## Check yourself

- New traffic is 80/s, retries are 20/s and capacity is 100/s. What happens to 300 queued requests?::They drain at 20/s and reach zero after 15 seconds >> Retries consume the spare capacity. >> the-building-block||*They stay at 300 because no capacity is spare::Total arrivals equal completion capacity.
- Why can a queue limit fail to restore the service by itself?::*Refused clients may immediately replace the dropped work with retries||A queue limit silently doubles completion capacity >> The limit bounds waiting work; it does not add capacity. >> the-building-block::The limit bounds waiting work; it does not add capacity.
- Which retry plan gives a recovering dependency room?::Every layer retries immediately with the same fixed schedule >> Independent retries multiply and synchronize load. >> failure-every-layer-retries||*One layer retries with a bounded, randomized schedule::The retry load eventually stops and does not return as one burst.

## Sources

- [Google SRE · Handling overload](https://sre.google/sre-book/handling-overload/) — after repeated rejection, the immediate caller should return an overload/no-retry error or a degraded response instead of multiplying retries through the stack.
- [Google SRE · Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/) — limiting queue length is load shedding; synchronized retries can amplify a disturbance.
- [AWS SDK retry behavior](https://docs.aws.amazon.com/sdkref/latest/guide/feature-retry-behavior.html) — standard mode combines exponential backoff with jitter and a retry quota that can stop retries.
- [gRPC · Retry](https://grpc.io/docs/guides/retry/) — a retry policy includes retryable status codes, a maximum attempt count and backoff settings.

The queue trace and SQL fixture are original. The failure analysis follows the overload and retry guidance in the *Site Reliability Engineering* books.
