---
title: Why does a confirmed space still look free?
short: Why does a confirmed space still look free?
summary: Give map reads and confirmation reads explicit freshness rules.
takeaway: A cache can extend the staleness it inherited from its source.
---

## The problem

Ada has her confirmation. The map still shows one free space. Did the database lose her reservation?

## See it

```diagram freshness
```

## The building block

The primary store has committed the write. A **replica** is another copy that replays changes. Asynchronous replication lets that copy lag. A cache holds a previously computed answer for repeated reads. It can also be stale. These are independent sources of delay.

Suppose a map answer is fetched from a copy already eight seconds behind and kept for another thirty seconds. Near expiry it can describe a state about 38 seconds old. A cache lifetime does not bound the age of its source. Return the committed result for the confirmation screen, or read from a source known to have observed that write. Measure end-to-end age to enforce the map's thirty-second promise.

### Spend the freshness budget

Assume the response reports the time of a trustworthy source observation and the clocks agree. At second 100, a cache stores a reading from second 92. At second 115 the reader receives a value 23 seconds old. Seven seconds of a 30-second allowance remain. Keeping the entry until second 130 would exceed that allowance by eight seconds.

What if refreshing it at second 122 returns the very same reading from second 92? Starting another 30-second timer hides the lag. Retain the source observation time. A map could mark availability unknown when the age limit is exceeded. The separate reservation path still checks the current inventory before granting a space.

## Make the cache prove the age of its answer

A reading has two times: the second the source observed the lot and the second the cache copied that reading. At second 125 both policies below see the same entry. Which one would let the driver see a reading older than the thirty-second promise?

```sql run
CREATE TABLE map_entry (source_second INTEGER, cached_second INTEGER);
INSERT INTO map_entry VALUES (92, 122);

WITH clock(now) AS (VALUES (125))
SELECT now - source_second AS true_age,
       now - cached_second AS time_in_cache,
       CASE WHEN now - cached_second <= 30 THEN 'show' ELSE 'unknown' END
         AS cache_timer,
       CASE WHEN now - source_second <= 30 THEN 'show' ELSE 'unknown' END
         AS source_timer
FROM map_entry, clock;
```

The reading is 33 seconds old after only three seconds in this cache. The cache timer shows it. The source timer marks it unknown. Change 125 to 122, then 123 to locate the exact boundary. This contract includes age 30. It assumes the two timestamps use comparable clocks and the source time describes the observation itself. If the source supplies only the time the cache fetched its response, the service lacks evidence to make this age promise.

## Try it

Draw a write at second 10, a stale fetch at 17 and replication at 18. When can the cached response outlive the map promise? Now let many clients refresh one popular entry at expiry. Coalescing them into one in-flight fetch reduces duplicate work.

## Check yourself

- What can hide a committed write?::*Replication delay||The presence of an index >> The copy may not have applied the change yet. >> the-building-block::The copy may not have applied the change yet.
- What measures the thirty-second promise?::Time since cache insertion alone >> The cached value may already have been old. >> the-building-block||*Age from source to screen::The cached value may already have been old.
- Where can the first confirmation view come from?::*The committed result||Any old map entry >> Confirmation requires knowledge of the completed grant. >> the-building-block::Confirmation requires knowledge of the completed grant.

## Sources

- [PostgreSQL · Standby Servers](https://www.postgresql.org/docs/17/warm-standby.html) — “PostgreSQL streaming replication is asynchronous by default.”
- [AWS · Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)
