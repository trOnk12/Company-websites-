---
title: Can two green maps promise the last space?
short: Can two green maps promise the last space?
summary: Define what success means before choosing storage.
takeaway: A map may be stale while the reservation contract still admits at most one winner.
---

## The problem

One space is free. Ada and Ben see a green pin and tap Reserve at the same time. May both screens say “reserved”?

## See it

```diagram promise
```

## The building block

A map helps someone choose a destination. A **reservation** gives someone a claim on a space. Suppose the map may show a reading up to 30 seconds old. For reservations we need an **invariant**, a rule that must hold after every completed change. For a lot with one space, at most one active reservation may be confirmed.

Write the contract from the driver's perspective. A confirmation names a durable reservation the driver can retrieve later. A refusal means no space was granted by that attempt. Silence means the phone stopped waiting. The service might already have saved the reservation. Later lessons turn each sentence into a test.

## Try it

Use two slips of paper for the phones and one for the space. List the possible pairs of replies if both attempts finish and no one cancels. Change the map's freshness promise to one second. Which read becomes harder to serve? Does the reservation rule change?

[Open the runnable lab and instructions](https://github.com/trOnk12/Company-websites-/tree/main/labs/parking-design)

## Check yourself

- What can be 30 seconds old?::*The map reading||The right to a confirmed space >> The freshness allowance belongs to the map. >> the-building-block::The freshness allowance belongs to the map.
- Do two green pins violate the reservation rule?::Yes, each pin grants a space >> Reading availability does not allocate it. >> the-building-block||*Check the grants first::Reading availability does not allocate it.
- What does silence prove?::*The phone lacks a result||The database rejected the write >> The reply could have been lost after the write. >> the-building-block::The reply could have been lost after the write.

## Sources

- [Google SRE · Implementing SLOs](https://sre.google/workbook/implementing-slos/) — “specify a target level for the reliability of your service”
