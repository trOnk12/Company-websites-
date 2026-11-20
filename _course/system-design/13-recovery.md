---
title: Can you recover the right history after a bad release?
short: Can you recover the right history after a bad release?
summary: Test restoration with real reads and writes.
takeaway: A recovered process earns traffic after the restored history and a new write pass verification.
---

## The problem

A faulty process deletes reservations and the change reaches every replica. What separates successful replication from recovery of the right data?

## See it

```diagram recovery
```

## The building block

Define the acceptable amount of data loss in time, the recovery point objective, and the acceptable restoration time, the recovery time objective. A deletion at 10:07 and a usable base copy from 10:00 leave seven minutes of intervening work to account for. A base backup and archived change log can allow recovery to a point immediately before the mistake.

Restore synthetic reservations into a separate database. Count confirmations, compare identities and make a new reservation. If valid requests arrived after the deletion, rewinding the entire database can also remove them. Reconcile those requests and external payments. Healthy replicas may have copied the original mistake perfectly.

## Try it

Record detection, decision, restore, validation and reopening times. A fifteen-minute interruption budget covers that entire path. For a schema change, first add a compatible field, switch writers and readers, and remove the old field after the compatibility window. Run the old application against the upgraded schema before relying on rollback.

## Check yourself

- What can damage all current replicas logically?::Reading a backup file >> Replication propagates unwanted changes too. >> the-building-block||*A replicated deletion::Replication propagates unwanted changes too.
- What does restoring only the 10:00 copy omit?::*Seven minutes before the error||No valid writes at all >> Drivers may have completed reservations in that period. >> the-building-block::Drivers may have completed reservations in that period.
- What finishes a recovery drill?::The database process starting >> A running process does not establish a correct history. >> the-building-block||*Verified data and a successful write::A running process does not establish a correct history.

## Sources

- [PostgreSQL · Continuous Archiving](https://www.postgresql.org/docs/17/continuous-archiving.html) — “restore the database to a previous point in time”
