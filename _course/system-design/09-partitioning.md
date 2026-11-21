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

## Add a shard without moving every key

A shard is a storage owner responsible for some keys. The service routes each reservation to the current write owner. At cutover a service instance using an old owner list must refresh it and the former owner must refuse the stale write. Try two routing functions in Python 3. The first reduces a **hash**, a repeatable number derived from the key, to a list position. The second scores each pair of key and owner and chooses the highest score. This second technique is called rendezvous hashing.

```python
from hashlib import sha256

def score(text):
    return int.from_bytes(sha256(text.encode()).digest(), "big")

def modulo(key, owners):
    return owners[score(key) % len(owners)]

def rendezvous(key, owners):
    return max(owners, key=lambda owner: score(key + ":" + owner))

old = ["north", "south", "west"]
new = old + ["east"]
for route in (modulo, rendezvous):
    moves = [(route(str(k), old), route(str(k), new)) for k in range(1000)]
    changed = [(before, after) for before, after in moves if before != after]
    print(route.__name__, len(changed),
          sum(after != "east" for before, after in changed))
```

For these keys the output is 769 keys moved under modulo and 222 under rendezvous. Of those moves, 512 and zero respectively went between existing owners. The last column counts moves between two *existing* owners. Predict why it must be zero for rendezvous: adding east changes none of the old scores. If east wins, the key moves there. Otherwise the old winner stays ahead. The calculation scans every candidate and assumes agreed, stable owner names. Membership changes still require a protocol for copying state and switching the write owner.

Now route one thousand requests for the same key. Every request goes to the same winner. Reducing the number of keys you move during expansion solves a different problem from a hot lot receiving most of the traffic.

## Try it

Give two pools five spaces each. Seven drivers arrive at A and one at B. Without transfers, A grants five and refuses two even though B has spare capacity. Compare that cost with waiting for a shared counter. Propose a test showing that transferring a right does not copy it.

## Check yourself

- What can a month-based split help with?::Every last-space conflict >> One hot inventory row can still serialize writes. >> the-building-block||*Removing old periods::One hot inventory row can still serialize writes.
- Where do writes for one lot go when the key is the lot?::*To the same piece||Evenly across sixteen pieces >> Equal keys follow the same routing rule. >> the-building-block::Equal keys follow the same routing rule.
- How many rights may the pools own in total?::Ten per region >> Copying rights would allow double allocation. >> the-building-block||*At most ten::Copying rights would allow double allocation.

## Sources

- [PostgreSQL · Table Partitioning](https://www.postgresql.org/docs/17/ddl-partitioning.html) — “splitting what is logically one large table into smaller physical pieces”
- [Thaler and Ravishankar · Using name-based mappings to increase hit rates](https://www.cs.kent.edu/~javed/DL/web/p1-thaler.pdf)
