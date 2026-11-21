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

## Try it

Draw a write at second 10, a stale fetch at 17 and replication at 18. When can the cached response outlive the map promise? Now let many clients refresh one popular entry at expiry. Coalescing them into one in-flight fetch reduces duplicate work.

## Check yourself

- What can hide a committed write?::*Replication delay||The presence of an index >> The copy may not have applied the change yet. >> the-building-block::The copy may not have applied the change yet.
- What measures the thirty-second promise?::Time since cache insertion alone >> The cached value may already have been old. >> the-building-block||*Age from source to screen::The cached value may already have been old.
- Where can the first confirmation view come from?::*The committed result||Any old map entry >> Confirmation requires knowledge of the completed grant. >> the-building-block::Confirmation requires knowledge of the completed grant.

## Sources

- [PostgreSQL · Standby Servers](https://www.postgresql.org/docs/17/warm-standby.html) — “PostgreSQL streaming replication is asynchronous by default.”
- [AWS · Caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/)
