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

### Score a recovery by the clock

The deletion occurs at 10:07. A monitor detects it at 10:10, the operator finishes restoring at 10:18, and validation permits traffic again at 10:24. If interruption began at 10:07, recovery took 17 minutes and missed a 15-minute objective. Measuring only the eight minutes spent restoring would hide the miss.

Suppose the newest consistent state you can actually recover is 10:04. The gap at deletion time is three minutes. That fails a two-minute recovery point objective even if the database restarts instantly. Choose one known reservation from 10:03 and one from 10:06, look them up after restoration, then reconcile any later external charge independently.

## Try it

A receipt database starts with ID 10. The service commits ID 20, marks a recovery point, accidentally deletes 20, marks a second point, then commits ID 30. Before running the experiment, write down the exact IDs you expect at each point. Which valid receipt could you lose even if you restore perfectly?

On Linux or macOS, use Python 3 with psycopg 3 and the PostgreSQL 17 server tools on your command path. Save [the experiment](https://pachulski.dev/labs/postgres-isolation/restore.py) and [its helper](https://pachulski.dev/labs/postgres-isolation/failover.py) in one folder. From that folder run both commands as an ordinary user.

```sh
python3 restore.py before_delete
python3 restore.py after_delete
```

Each command creates disposable local clusters, takes a clean base copy, archives subsequent writes and restores to the named point in a separate directory.

Before deletion the restored IDs are 10 and 20. After deletion only 10 survives. The original database contains 10 and 30 at shutdown. Receipt 30 is a valid later commit after both named points. Before reopening service, decide how to reconcile it with an independent receipt record. The lab also writes ID 40 on the recovered timeline and checks it from a fresh connection. Compare its measured time with the full incident timeline below.

Record detection, decision, restore, validation and reopening times. A fifteen-minute interruption budget covers that entire path. For a schema change, first add a compatible field, switch writers and readers, and remove the old field after the compatibility window. Run the old application against the upgraded schema before relying on rollback.

## Check yourself

- What can damage all current replicas logically?::Reading a backup file >> Replication propagates unwanted changes too. >> the-building-block||*A replicated deletion::Replication propagates unwanted changes too.
- What does restoring only the 10:00 copy omit?::*Seven minutes before the error||No valid writes at all >> Drivers may have completed reservations in that period. >> the-building-block::Drivers may have completed reservations in that period.
- What finishes a recovery drill?::The database process starting >> A running process does not establish a correct history. >> the-building-block||*Verified data and a successful write::A running process does not establish a correct history.

## Sources

- [PostgreSQL · Continuous Archiving](https://www.postgresql.org/docs/17/continuous-archiving.html) — “restore the database to a previous point in time”
