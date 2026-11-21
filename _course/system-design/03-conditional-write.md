---
title: How does the database choose a winner?
short: How does the database choose a winner?
summary: Keep the claim and the inventory change together.
takeaway: A zero-row conditional decrement lets the transaction roll back a claim on a full lot.
---

## The problem

Both processes read one, calculate zero and write their own reservation. The final counter looks right. How could the lot have sold twice?

## See it

```diagram conditional-write
```

## The building block

Use a transaction, a group of changes committed or rolled back together. Insert the reservation, then decrement inventory only where the lot matches and the free count is positive. The affected-row count reports how many rows changed. A primary key identifies one lot, so this particular update can affect zero or one. An update across many lots can return a larger number.

PostgreSQL is a relational database. Under its default Read Committed isolation, a competing update can wait for the first writer. If the first writer commits, the database checks the condition again against the updated row. Zero matches means this existing lot has no available space. Roll back the inserted reservation. The phone sees the service's refusal. It never receives a low-level database lock notification.

In the JVM lab, both statements run inside one transaction. A zero update count causes a rollback.

```sql
INSERT INTO parking_session(id, lot) VALUES (?, ?);
UPDATE lot SET free = free - 1 WHERE name = ? AND free > 0;
```

### Distinguish an empty lot from an old edit

Suppose an operator opens a lot record at version 7. A second operator edits it and saves version 8. The first tries to save a new capacity only where the stored version still equals 7. Zero rows change. Here zero means the original version condition failed for an existing record. The service can return a conflict and ask the operator to review the current values.

This is optimistic concurrency control: the reader starts work without reserving exclusive access and validates its earlier observation at write time. The inventory statement above checks a different condition. If three spaces remain, two increments of demand can both succeed in sequence. Requiring the exact old version in that case could reject an otherwise valid reservation.

## Go deeper: What if the rule spans different rows?

Two attendants are on duty. Each may leave if another remains. Two transactions read the same initial picture, see two attendants, then update different rows. Locking just each writer’s own row leaves the shared rule unprotected. This anomaly is called write skew. Serialize the decision on a shared duty record, or use serializable isolation and retry an aborted transaction from the beginning, including its decision-making read.

- Does one changed row per writer prove that an attendant remains?::No. A per-write count does not prove the cross-row rule. Inspect the combined outcome.

## Try it

Run the browser lab. Start with one space, send both requests and inspect the surviving claims. Repeat with two spaces. Imagine committing the insert separately before decrementing the counter. Which row would survive a crash between the two commits?

[Run two competing reservations](https://pachulski.dev/labs/parking-design/#race)

### Predict the database result

Ada has changed the last free space to zero, but her transaction is still open. Ben tries the same update. A third connection reads the lot. Predict what each connection sees. Now change just one event: Ada rolls back. Which results change? Verify both the free count and the name on the surviving claim.

[Step through four PostgreSQL schedules](https://pachulski.dev/labs/parking-design/#isolation)

The final two experiments move the rule across rows. Compare the number of attendants left on call under Repeatable Read and Serializable. When PostgreSQL rejects a decision, identify the first read that must be repeated.

## Check yourself

- Why can a valid update affect zero rows?::The service never received the request >> A successfully executed statement can match nothing. >> the-building-block||*Its condition no longer matches::A successfully executed statement can match nothing.
- Does a final count of zero prove correctness?::*Count the active grants too||Yes, zero proves one sale >> Two grants could have written the same final count. >> the-building-block::Two grants could have written the same final count.
- What disappears when Ben rolls back?::Ada's committed grant >> Each attempt owns its own transaction. >> the-building-block||*Ben's uncommitted grant::Each attempt owns its own transaction.

## Sources

- [PostgreSQL · Transaction Isolation](https://www.postgresql.org/docs/17/transaction-iso.html) — “it will attempt to apply its operation to the updated version of the row”
