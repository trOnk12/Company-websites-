---
title: How does the database choose a winner?
short: How does the database choose a winner?
summary: Follow Ada and Ben as they try to take the last space from the same database.
takeaway: Check that a space is free at the moment you take it. Save the booking only when that change succeeds.
---

## The problem

In puzzle 2, two copies of the parking program shared one database. Ada’s request reaches one copy and Ben’s reaches the other. Each reads “1 free,” subtracts one and writes “0 free.” If each also saves a booking, both drivers get B12. The final count of zero hides the mistake.

To follow the diagram, picture Ada changing the count first. A transaction is a group of changes the database saves or undoes together. The database locks the row with the free-space count, which makes Ben’s update wait. A commit keeps Ada’s changes. A rollback undoes her unfinished changes. Decide what Ben should see after each outcome.

## See it

```diagram conditional-write
```

## The building block

For one attempt, start a transaction, add the booking and try to subtract one from the lot’s free-space count. Put the check “free > 0” in the update that subtracts one. Picture a clerk who writes down Ben’s name in pencil, then erases it if the last spot is already taken. The database’s transaction lets the program undo that booking.

In PostgreSQL’s default mode, called Read Committed, Ben’s update waits while Ada holds the lock. Once Ada commits, PostgreSQL checks Ben’s “free > 0” against the new value, zero. It changes zero rows. If Ada instead rolls back, Ben can take the space. The program reads the number of rows changed and uses it to decide whether to save Ben’s booking or undo it.

The two statements below do the work for one booking. Each question mark is a placeholder. The program supplies the booking’s reference and lot name to the first statement, then the same lot name to the update. Since the lot name identifies one row in this example, that update can change at most one row.

```sql
INSERT INTO parking_session(id, lot) VALUES (?, ?);
UPDATE lot SET free = free - 1 WHERE name = ? AND free > 0;
```

## Run the same condition twice

The first three lines set up one lot with one free space and an empty list of bookings. Each block starts a transaction, adds the driver’s booking, then subtracts one only if the count is still positive. `RETURNING` shows the new free count for each row the update changed. The last question pairs each saved driver’s name with the free count for the only lot in the example.

Before pressing Run SQL, write down three predictions: what Ada’s update shows, what Ben’s update shows and whose name appears at the end.

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


## Check yourself

- Why can a valid update affect zero rows?::The service never received the request >> A successfully executed statement can match nothing. >> the-building-block||*Its condition no longer matches::A successfully executed statement can match nothing.
- The final count says zero. Could both drivers still have a booking?::*Yes, if both saved a booking and wrote zero||No, zero proves that only one driver booked >> Two attempts could write the same count. Check the booking records. >> the-building-block::The count alone can hide two bookings.
- What disappears when Ben rolls back?::Ada's committed grant >> Each attempt owns its own transaction. >> the-building-block||*Ben's uncommitted grant::Each attempt owns its own transaction.

## Sources

- [PostgreSQL · Transaction Isolation](https://www.postgresql.org/docs/17/transaction-iso.html) — “it will attempt to apply its operation to the updated version of the row”
- [SQLite · RETURNING](https://www.sqlite.org/lang_returning.html)
