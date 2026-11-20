---
title: What if a successful reply disappears?
short: What if a successful reply disappears?
summary: Recognize a retry after the database has committed.
takeaway: A stable identity ties a replay to the original intention and committed grant.
---

## The problem

The database commits Ada's reservation. The connection drops before her phone sees the reply. How can the service distinguish a retry from a second trip?

## See it

```diagram retry-identity
```

## The building block

The phone creates a request identity before the first attempt and retains it for retries of that intention. Bind it to the owner, the requested lot and the result. A unique constraint in the store arbitrates simultaneous first attempts. Recording the grant and its identity must survive a crash together.

Replaying the same successful request for the same lot returns its existing grant. Reusing the identity for a different lot is a conflict. The lab returns status 201 on creation and 200 on a successful replay. Both leave the same durable state. In this contract a full-lot refusal does not permanently consume the identity. State explicitly which results your own service retains and how long retries are supported.

Example calls against the local service:

```text
PUT /sessions/ada-17    west    → 201 west
PUT /sessions/ada-17    west    → 200 west
PUT /sessions/ada-17    east    → 409 id already used
GET /sessions/ada-17            → 200 west
```

## Try it

Compare a disconnect immediately before commit with one immediately after. Then compare retry identity with an edit version. One asks whether this intention was already carried out. The other asks whether the record is still the version the editor saw.

[Open the runnable lab and instructions](https://github.com/trOnk12/Company-websites-/tree/main/labs/parking-design)

## Check yourself

- What identity should the phone send on retry?::*The original identity||A freshly generated one >> A fresh value looks like another intention. >> the-building-block::A fresh value looks like another intention.
- The same identity arrives for another lot. What follows?::Reserve the second lot >> The request changed meaning. >> the-building-block||*Report a conflict::The request changed meaning.
- What detects an edit based on stale data?::*The version the editor saw||The number of network retries >> A fresh intention can still edit an old version. >> the-building-block::A fresh intention can still edit an old version.

## Sources

- [AWS · Making retries safe](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) — “the service first checks to see if it has seen this identifier before”
