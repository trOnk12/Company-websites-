---
title: Who can confirm a write when regions cannot talk?
short: Who can confirm a write when regions cannot talk?
summary: Understand majority agreement and the cost of losing contact.
takeaway: During a split, the minority cannot safely keep accepting globally ordered grants on its own.
---

## The problem

Each replica can have a different view while messages are delayed. Three nodes maintain a shared decision history. One is cut off but still receives requests. Can both sides independently grant the same last space?

## See it

```diagram consensus
```

## The building block

In a replicated log, a leader proposes entries for an agreed order. A majority of three is two. Any two majorities intersect. Raft combines this property with election rules, numbered leadership terms and rules for committing entries. Counting two arbitrary replies does not implement consensus. A leader also needs evidence that its decisions belong to the correct history.

In a two-plus-one split, the pair can continue committing under a valid leader. The solitary node cannot independently confirm a new grant in that protocol. It can refuse or serve a read whose contract permits stale data. Continuing one global order costs write availability on the isolated side. An ordinary asynchronous database copy does not become a consensus protocol by adding another replica.

The CAP theorem describes a choice during a network partition. An isolated node cannot always complete every valid operation successfully while maintaining the behavior of one current copy. Here the desired consistency is linearizability: completed operations fit one order that respects real-time precedence. Choose a contract per operation. Map reads and last-space writes can have different contracts.

### Reason from the driver's timeline

A, B and C are voting nodes. Ada receives a successful grant after the current leader A commits it with B. A becomes isolated. B and C can elect a valid new leader under Raft's election rules. A may still think it leads, but it cannot commit another shared grant on its own. A driver reaching only A might therefore time out even though another driver can use B.

In a fresh run, isolate C before Ada makes her reservation. Move Ben's read until after Ada receives confirmation from A. If Ben asks C for the latest committed inventory and sees the original free space, that history violates the real-time ordering promise in this one-space example. A map read explicitly allowed to be stale can return the very same value within its age limit. Check the operation's contract before calling either result correct.

## Why two copies can still be insufficient

In Raft a term is a numbered election period. A term can end without a leader being elected. A log entry has a position and the term in which it was created. Consider an elected leader in term 4 with voters A, B and C. Its log positions 1 through 8 match on A and B. Position 8 was written in term 3. May the new leader mark position 8 committed just by counting those copies?

```python
def can_advance(index, entry_term, leader_term, matched_through):
    majority = len(matched_through) // 2 + 1
    copies = sum(position >= index for position in matched_through)
    return entry_term == leader_term and copies >= majority

print(can_advance(8, 3, 4, [8, 8, 6]))
print(can_advance(9, 4, 4, [9, 8, 6]))
print(can_advance(9, 4, 4, [9, 9, 6]))
```

Each list entry gives the last log position known to match on one voter. Run with Python 3. The lines read False, False, True. In the last case the current-term entry at 9 can advance the commit position. The preceding entries in the leader's log, including 8, become committed with it. Counting replicas of the older entry directly would discard a condition on which Raft's safety argument depends.

Change only the final list to five positions: 9, 9, 8, 8, 6. Two copies at 9 no longer suffice. This function isolates one rule for an established leader with a fixed voting group and a candidate position beyond the current commit position. A deployable protocol also needs leader election, durable logs, matching prefixes and recovery. See sections 5.3 and 5.4.2 of the Raft paper.

## Try it

[Compare two write acknowledgements across a real PostgreSQL promotion](https://pachulski.dev/labs/parking-design/#failover)

Trace what a driver sees on each side. Compare refusal with the preallocated local rights from the previous lesson. Repeat with five nodes: three mutually reachable survivors can form a majority. After reconnection, inspect the entire history of confirmations, not only the final counter.

## Check yourself

- How many form a majority of five?::*Three||Two >> Two groups of two need not intersect. >> the-building-block::Two groups of two need not intersect.
- What can the isolated node safely do here?::Confirm a new shared grant alone >> One node does not form a majority of three. >> the-building-block||*Refuse a new grant::One node does not form a majority of three.
- What else protects the history besides voting counts?::*Election and commit rules||The fastest phone clock >> Client time does not establish a valid log. >> the-building-block::Client time does not establish a valid log.

## Sources

- [Ongaro and Ousterhout · Raft](https://raft.github.io/raft.pdf) — “A candidate must contact a majority of the cluster in order to be elected”
