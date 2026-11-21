---
title: How does the database choose a winner?
short: How does the database choose a winner?
summary: Keep the claim and the inventory change together.
takeaway: A zero-row conditional decrement lets the transaction roll back a claim on a full lot.
---

## The problem

Both processes read one, calculate zero and write their own reservation. The final counter looks right. How could the lot have sold twice? To read the diagram, follow one rule: while a writer holds the inventory row, the other writer must wait. A commit keeps the first change. A rollback undoes it.

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

## Run the same condition twice

Start after the two requests reach the database. Each attempt inserts a provisional grant, then tries to take a space. Read the output from top to bottom. `RETURNING` asks the database to show the row that the update changed. Before pressing Run SQL, predict what Ben's update returns and whose name survives his rollback.

```sql run
CREATE TABLE lot (name TEXT PRIMARY KEY, free INTEGER);
CREATE TABLE grant_log (driver TEXT PRIMARY KEY);
INSERT INTO lot VALUES ('west', 1);

BEGIN;
INSERT INTO grant_log VALUES ('Ada');
UPDATE lot SET free = free - 1 WHERE name = 'west' AND free > 0
RETURNING free AS after_ada;
COMMIT;

BEGIN;
INSERT INTO grant_log VALUES ('Ben');
UPDATE lot SET free = free - 1 WHERE name = 'west' AND free > 0
RETURNING free AS after_ben;
ROLLBACK;

SELECT driver, free FROM grant_log CROSS JOIN lot;
```

The first result contains a row whose value is zero. That is a successful write: Ada took the last space. The second result contains **no row**. Ben's condition failed. The last result contains Ada and zero free spaces. Ben's rollback removed his provisional grant.

Run a deliberate mistake: change only Ben’s rollback to a commit. Will the free count show that anything went wrong? It still says zero, but the final query now lists both drivers. This is why the service checks the affected-row count before choosing either branch. The SQL above spells out the application’s two decisions for this exact one-space schedule.

In the reservation service the condition requires a positive free count and a provisional grant already exists in the same transaction. This is the branch that turns the database result into a reply. The variable named take holds the prepared conditional update. Executing it returns its affected-row count.

```java
take.setString(1, lot);
if (take.executeUpdate() == 0) {
    db.rollback();
    return new Reply(409, "full");
}
db.commit();
return new Reply(201, lot);
```

A count of zero does not automatically undo the provisional grant. The explicit rollback does that. The browser example runs statements in a chosen order on SQLite. The PostgreSQL exercise below uses two live connections to measure the wait that can precede the same decision.

## Go deeper: Why would an old edit also change zero rows?

Suppose an operator opens a lot record at version 7. A second operator edits it and saves version 8. The first tries to save a new capacity only where the stored version still equals 7. Zero rows change. Here zero means the original version condition failed for an existing record. The service can return a conflict and ask the operator to review the current values.

This is optimistic concurrency control: the reader starts work without reserving exclusive access and validates its earlier observation at write time. The inventory statement above checks a different condition. If three spaces remain, two increments of demand can both succeed in sequence. Requiring the exact old version in that case could reject an otherwise valid reservation.

Two operators both opened version 7. Ada saves first. Predict the result of Ben's save and the capacity that the driver will read afterward.

```sql run
CREATE TABLE lot (
  name TEXT PRIMARY KEY, capacity INTEGER, version INTEGER
);
INSERT INTO lot VALUES ('west', 10, 7);

UPDATE lot SET capacity = 12, version = version + 1
WHERE name = 'west' AND version = 7
RETURNING capacity, version;

UPDATE lot SET capacity = 8, version = version + 1
WHERE name = 'west' AND version = 7
RETURNING capacity, version;

SELECT name, capacity, version FROM lot;
```

The first update returns capacity 12 at version 8. The second returns no rows. The final read still shows capacity 12 at version 8. Remove only the version condition from Ben’s update. Now both saves report success and Ben silently overwrites Ada. Try a missing lot name too. The same empty result can mean a missing record or a stale version. The service needs more context before telling the client why the save failed.

- What should an editor reread after a version conflict?::The current values and their version, before deciding whether its intended change still makes sense.

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
- [SQLite · RETURNING](https://www.sqlite.org/lang_returning.html)
