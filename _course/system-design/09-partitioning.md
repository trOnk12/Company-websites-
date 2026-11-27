---
title: Why can sixteen owners still leave one owner overloaded?
short: Why can sixteen owners still leave one owner overloaded?
summary: Follow one busy parking lot across sixteen places that store bookings.
takeaway: A partition key keeps related writes at one owner. Measure the busiest owner, not the average across all owners.
---

## The problem

The previous lesson measured overload for one service. Now the booking service has sixteen **storage owners**, independent database processes that each accept writes for an assigned part of the data. Each owner can finish 100 equal-cost reservation attempts per second. In this model, one attempt produces one storage write.

A concert sends 1,000 attempts per second: 700 concern the west lot and the other 300 are evenly spread across fifteen lots, twenty per lot. The current routing rule sends every attempt naming the same lot to the same owner.

The average is only 62.5 attempts per owner. Does that prove every owner has enough capacity?

## See it

```diagram partitioning
```

Stop after step two. Use the routing rule from the problem to predict the busiest owner's rate before revealing it.

## The building block

A **data partition** is one piece of the stored data. A **router** is code that sends a request to its current storage owner. A **partition key** is the value the router uses to choose which piece owns a record. In this design, the lot ID is the partition key, so all west reservations and west's remaining-space record meet at owner 0.

That preserves the last-space invariant: one owner can apply the conditional write from lesson 03 to the complete west count. But it creates a **hot key**, one key receiving much more work than the others.

```text
owner 0 arrivals = 700 attempts/s
owner 0 capacity = 100 attempts/s
owner 0 queue growth = 700 - 100 = 600 attempts/s

overall average = 1,000 ÷ 16 = 62.5 attempts/s
```

The average hides the failure. For a proposed key, measure at least the busiest owner's arrival rate, its completion capacity and how the distribution changes during a real peak.

## Run the routing decision

The program routes all requests for one lot to one owner. It then shows a deliberately broken alternative: routing by request ID and storing an independent remaining-space copy at each request owner. The first change separates two requests that compete for the same last space; the second lets both owners believe they can grant it.

```python
from collections import Counter

OWNER_COUNT = 16
attempts = ["west"] * 700
for lot in range(1, 16):
    attempts += [f"lot-{lot}"] * 20

def owner_for_lot(lot_id):
    if lot_id == "west":
        return 0
    return int(lot_id.split("-")[1])

safe_load = Counter(owner_for_lot(lot_id) for lot_id in attempts)
print("by_lot", max(safe_load.values()))

spread_load = Counter(request_id % OWNER_COUNT
                      for request_id in range(len(attempts)))
print("by_request", max(spread_load.values()))
```

The complete file also performs the last-space failure and prints:

```text
by_lot busiest_owner=0 requests=700 overload=600
by_request busiest_requests=63
unsafe_last_space_grants=2
```

One thousand successive numbers cannot divide equally among sixteen owners: eight receive 63 and eight receive 62. That is why the balanced result's maximum is 63. Real IDs require a measured distribution; the program uses successive numbers only to isolate the ownership failure.

The failure itself is this small broken model:

```python
free_by_owner = {0: 1, 1: 1}  # two independent copies of west's count
grants = 0
for owner in [0, 1]:
    if free_by_owner[owner] == 1:
        free_by_owner[owner] = 0
        grants += 1
print(grants)  # 2: the last space was granted twice
```

[Open the complete runnable program](../../labs/partitioning/hot_key.py)

The first result is correct but overloaded. Its queue-growth calculation assumes constant rates and equal-cost writes for this owner, just like lesson 08. The second distribution looks balanced, but request IDs do not identify the state that must change together. A balanced graph is not a repair if it breaks the invariant.

## The parking-desk analogy

Sixteen booking desks do not shorten west's line when every west driver must visit the one desk holding west's count. Sending successive west drivers to different desks shortens that line only if the desks do not hand out copies of the same final ticket. The routing rule and the ownership of the ticket must agree.

## Go deeper: Is a PostgreSQL table partition another machine?

Not necessarily. PostgreSQL can divide one logical table into stored pieces by range, list or the number left after division. Those pieces may still be ordinary tables in one database. This can make old monthly data cheap to detach and can let a query ignore pieces that cannot contain its answer. The database may process some work in parallel, but the table layout alone does not prove that sixteen independent servers now accept writes.

- A monthly table is divided into twelve pieces on one database server. How many independent server capacities has this created?::One. The table layout changed; the deployment did not.

## Go deeper: Can one owner divide the last-space decision safely?

This section is optional; the main partition-key lesson and its checks do not require it.

One option is to allocate **local rights**, saved permissions to grant a fixed number of spaces without contacting another owner. With ten spaces in the west lot, owner A may hold five rights and owner B five. Owner A can confirm five grants while disconnected, but must refuse its sixth even if owner B still holds unused rights.

The safety equation is:

```text
unused A rights + unused B rights + confirmed grants + rights moving = 10
```

A transfer of two rights starts at A=5 and B=5. In one database transaction, owner A saves A=3 and a unique transfer request ID marked as moving. Owner B processes that ID in its own transaction: it credits B=7 once and marks the transfer received. Repeating the same ID leaves B at seven, as in lesson 04. If the transfer stops between those transactions, the two moving rights cannot be spent. Copying them would be worse because two owners could spend them. This bounded-quantity pattern is called the escrow approach.

- Owner A has spent its five local rights while B still has five unused. Can A independently confirm a sixth grant?::No. It must refuse or complete a transfer that removes a right from B before A can spend it.

## Try it

Run these commands in the project folder:

```bash
python3 labs/partitioning/hot_key.py
python3 labs/partitioning/hot_key.py --owners 32
python3 labs/partitioning/hot_key.py --west 100
```

Only the owner count changes in the second run: the same 1,000 attempts and fifteen non-west lots remain. The overall average falls from 62.5 to 31.25, but west remains at 700 and its owner's capacity remains 100. Explain why adding owners did not change that key's route.

For the third run, check the busiest owner and state which assumption changed. Finally, change the two unsafe last-space requests so they use the lot key. The output must fall from two grants to one.

You have passed when you can name the state that must stay together, calculate the busiest owner's load and demonstrate the extra broken assumption that makes request-based spreading unsafe.

## Check yourself

- A thousand writes average 62.5 per owner, but one key receives 700. Which number tests the owner of that key?::62.5 >> An average can hide one overloaded owner. >> the-building-block||*700::Every write for the equal key follows the same owner rule.
- Why not route reservations for one lot by request ID?::*Two owners could independently grant the same last space||It makes every request slower by definition >> The failure is broken ownership, not a guaranteed timing change. >> run-the-routing-decision::The requests that change one count would no longer meet at its owner.
- The owner count doubles to 32, but all 700 west attempts still share one key. What is west's owner's arrival rate?::31.25 per second >> That is the new overall average, not the hot owner's rate. >> the-building-block||*700 per second::Adding owners does not divide requests that still share one routing key.

## Sources

- [PostgreSQL 17 · Table partitioning](https://www.postgresql.org/docs/17/ddl-partitioning.html) — defines range, list and hash table partitioning, partition pruning and the maintenance trade-offs; it also warns that more partitions are not automatically better.
- [MongoDB · Choose a shard key](https://www.mongodb.com/docs/manual/core/sharding-choose-a-shard-key/) — evaluates a key by both work distribution and whether common queries can target one owner instead of every owner.
- [Google Cloud Spanner · Schema design best practices](https://cloud.google.com/spanner/docs/schema-design) — documents hot spots caused when a key pattern directs a high write rate to one server.
- Patrick O'Neil, *The Escrow Transactional Method*, ACM TODS 11(4), 1986 — develops bounded quantity updates that avoid one shared hot record while preserving the aggregate constraint.
- Martin Kleppmann and Chris Riccomini, *Designing Data-Intensive Applications*, 2nd ed., O'Reilly, 2026, chapter 7 — inspiration for separating balanced key distribution from skewed workloads and cross-partition operations. The example and code here are original.
