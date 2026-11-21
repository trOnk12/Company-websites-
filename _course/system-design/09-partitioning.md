---
title: When does splitting the data help?
short: When does splitting the data help?
summary: Choose a key by following the reads and writes.
takeaway: Choose the partition key for the operations that must stay together and test the hottest key.
---

## The problem

The last-space invariant must hold even if storage ownership changes. One database is busy after a concert. Most writes concern just one lot. A teammate proposes sixteen partitions. Which particular bottleneck would that remove?

## See it

```diagram partitioning
```

## The building block

Partitioning divides rows into pieces by a rule. A month-based split can make old history easier to remove. All pieces can still live on one machine. When pieces live in independent databases, the service must also find the owner of each key and move ownership while requests continue.

Splitting by lot keeps one reservation and its count together. A driver's history across lots may need reads from several pieces or a separate read model. If seventy percent of traffic goes to one lot, the hot key still goes to one owner. A different design allocates independent rights to regional pools. Transfers between pools must preserve the total number of rights.

### Test both balance and ownership

A thousand reservation attempts arrive per second. Seven hundred go to west. With sixteen equally fast storage owners, hashing by lot still sends at least 700 attempts per second to one owner. Dividing 1,000 by sixteen gives an average of 62.5 and hides west. Measure the busiest owner's rate when deciding whether the split helped.

To transfer two unused rights from west to east, subtract two at west and record a durable transfer identity before east can spend them. East credits that identity at most once. If delivery pauses, the two rights may be temporarily unspendable. Retry the same transfer twice and reconcile available, granted and in-transit rights against the original capacity.

## Go deeper: How do you move a lot while it is accepting reservations?

Moving the west lot from storage A to B takes time. Copying the current rows alone misses later writes. Record a starting position, copy the snapshot, replay subsequent changes, and compare results. At cutover, identify one active write owner and define what happens to requests sent using stale routing information. Otherwise both stores can grant the last space.

- Which test is stronger than comparing row counts after the move?::Keep reserving during migration. Record every confirmed identity and verify each grant and capacity after cutover.

## Try it

Give two pools five spaces each. Seven drivers arrive at A and one at B. Without transfers, A grants five and refuses two even though B has spare capacity. Compare that cost with waiting for a shared counter. Propose a test showing that transferring a right does not copy it.

## Check yourself

- What can a month-based split help with?::Every last-space conflict >> One hot inventory row can still serialize writes. >> the-building-block||*Removing old periods::One hot inventory row can still serialize writes.
- Where do writes for one lot go when the key is the lot?::*To the same piece||Evenly across sixteen pieces >> Equal keys follow the same routing rule. >> the-building-block::Equal keys follow the same routing rule.
- How many rights may the pools own in total?::Ten per region >> Copying rights would allow double allocation. >> the-building-block||*At most ten::Copying rights would allow double allocation.

## Sources

- [PostgreSQL · Table Partitioning](https://www.postgresql.org/docs/17/ddl-partitioning.html) — “splitting what is logically one large table into smaller physical pieces”
