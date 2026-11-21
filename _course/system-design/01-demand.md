---
title: How much traffic arrives after a concert?
short: How much traffic arrives after a concert?
summary: Estimate peak demand and concurrent work with units.
takeaway: Size for a measured burst and use throughput times mean duration to estimate concurrent work.
---

## The problem

There are 120,000 daily drivers. Each opens the map ten times and attempts one reservation. Which number belongs in a peak-load test?

## See it

```diagram demand
```

## The building block

There are 86,400 seconds in a day. The averages are about 13.9 map reads and 1.39 reservation attempts per second. Now suppose one fifth of all map reads arrive in the same ten minutes after a concert. That gives 240,000 / 600 = 400 reads per second. The traffic distribution is an assumption. Daily totals alone cannot tell you the peak.

At a stable 400 completed requests per second and a mean of 0.15 seconds from arrival to reply, an average of 60 requests are **in flight**, meaning they have arrived but their replies are still outstanding. This is Little’s law. Keep the rate and duration inside the same measurement boundary. If each request holds a database connection for only 0.010 seconds, that part of the workload occupies four connections on average. Short bursts can require more.

### Find the bottleneck hidden by the daily average

Suppose each map response carries 12,000 bytes. At the 400-per-second peak the service sends 4.8 million bytes each second, about 38.4 million bits per second before protocol overhead. Doubling response size doubles outgoing bandwidth even when the number of database reads stays fixed.

Now assume the backend completes only 350 reads per second for the ten-minute peak. Starting empty, with no abandoned or rejected work, 30,000 requests remain after those ten minutes: 50 unfinished requests per second for 600 seconds. Measuring only completions would understate offered demand. Once the queue keeps growing, stop using the steady-state estimate of 60 outstanding requests.

## Go deeper: What will storage cost in bytes?

At 120,000 accepted sessions per day and 800 bytes of row and index data per session, one day adds 96 million bytes. After 365 days one copy contains about 35.04 billion bytes. Three full copies total about 105.12 billion before backups, engine overhead and spare space. Test the 800-byte assumption by measuring both table and index growth in a representative fixture.

- What happens if accepted sessions double at the same retention and size?::One copy grows to about 70.08 billion bytes.

## Measure a burst that an average hides

A service records one timestamp for each arriving request. In this small trace a number is seconds since the experiment began. Divide the number by ten and keep the whole part to assign each request to a ten-second bucket. Which bucket should set the minimum load for the next test?

```sql run
CREATE TABLE arrival (second INTEGER);
INSERT INTO arrival VALUES
  (0), (10), (20), (20), (21), (22), (22), (29);

SELECT (second / 10) * 10 AS bucket_start,
       COUNT(*) AS arrivals,
       COUNT(*) / 10.0 AS requests_per_second
FROM arrival
GROUP BY bucket_start
ORDER BY bucket_start;
```

Eight requests in thirty seconds average about 0.27 per second. The last bucket alone gets six, or 0.6 per second. Change 29 to 30. The request moves to the next bucket because the interval includes its start and excludes its end. A bucket is a measurement choice. Two spikes on opposite sides of a boundary can hit the same database queue. A load test should replay the arrival times if that ordering matters.

## Try it

Shorten the peak to five minutes while keeping its total demand. Predict the arrival rate and work in flight before reading on. At the same mean duration the answers are 800 per second and 120 in flight. Measure arrivals, completions and backlog separately to check whether the duration actually holds.

## Check yourself

- Which interval belongs in the peak calculation?::86,400 seconds >> Use the duration of the burst. >> the-building-block||*600 seconds::Use the duration of the burst.
- At 400 per second and 0.15 seconds each, how many are in flight on average?::*60||2667 >> Multiply throughput by mean duration. >> the-building-block::Multiply throughput by mean duration.
- Does four occupied connections on average determine the pool limit?::Yes, choose exactly four >> Averages hide brief periods of saturation. >> the-building-block||*Measure waits and bursts::Averages hide brief periods of saturation.

## Sources

- [Google SRE · Handling Overload](https://sre.google/sre-book/handling-overload/)
