---
title: The booking succeeded, but the reply was lost
short: The booking succeeded, but the reply was lost
summary: Retry one tap without creating a second booking.
takeaway: Create one request ID for one tap. Reuse that ID when the reply is lost, so the service can return the first booking instead of creating another one.
---

## The problem

In the previous lesson, a transaction stopped two drivers from taking the same last space. A different failure is still possible.

Ada taps **Reserve** once. The service saves booking 301, but the success reply never reaches her phone. The phone waits and then gives up; this is a timeout. It cannot tell whether the service saved the booking.

If the phone sends a completely new request, the service may create booking 302 as well. We need a way to say, “This is the same tap again.”

A **request ID** is a value the phone creates before it sends a request. One tap gets one request ID. If the reply is lost, every retry of that tap carries the same ID.

## See it

```diagram retry-identity
```

## The building block

For Ada's tap, the request is:

```text
owner = Ada
request ID = 17
lot = west
```

The service stores those values beside booking 301. On a retry, it first looks for Ada's request ID 17. A saved row below means one stored request record.

This table describes requests that arrive one after another. The simultaneous case appears in the code below.

| What arrives | What the service does | Reply |
| --- | --- | --- |
| ID 17, west; no saved row | Create booking 301 and save the row | Created: booking 301 |
| ID 17, west; row already exists | Do not create another booking | Existing: booking 301 |
| ID 17, east; row says west | Do not guess which request is correct | Conflict: the request changed |
| ID 18, west | Treat it as a new tap | It may create a new booking |

This makes the reserve operation **idempotent** for one request ID: sending the same request more than once has the same booking effect as sending it once.

The important boundary is “one user action”, not “one network attempt”. A timeout may cause three network attempts, but all three belong to Ada's one tap and use ID 17. If Ada deliberately taps again to buy another space, that new action needs a new ID.

### Predict the failure before the fix

Assume the west lot has two free spaces.

1. Ada taps once. Her phone sends ID 17.
2. The service creates booking 301. The reply is lost.
3. The phone invents ID 18 and retries.

Predict the final count before opening the answer.

<details>
<summary>Reveal the result</summary>

The service sees two different IDs, so it can create two bookings. One tap consumed two spaces. Retrying with ID 17 would have returned booking 301 and left the count at one.

</details>

## Read the request function from top to bottom

The request function is the code that processes one reserve request. `savedRequests` is durable storage: its records remain after the service restarts. In the code, `return@transaction` returns an answer from the transaction function.

```kotlin
fun reserve(owner: String, requestId: String, lot: String): Reply {
    try {
        return database.transaction {
            val saved = savedRequests.getById(owner, requestId)
            if (saved != null) {
                if (saved.lot != lot) return@transaction Conflict
                return@transaction Ok(saved.bookingId)
            }

            val bookingId = bookings.allocateId()
            savedRequests.insert(owner, requestId, lot, bookingId)
            bookings.createWithId(bookingId, owner, lot)
            Created(bookingId)
        }
    } catch (duplicate: RequestIdAlreadyExists) {
        // The failed transaction rolled back its tentative booking.
        return database.transaction {
            val winner = requireNotNull(savedRequests.getById(owner, requestId))
            if (winner.lot != lot) Conflict else Ok(winner.bookingId)
        }
    }
}
```

First follow a retry that arrives after booking 301 has committed:

1. `getById` returns the saved request record.
2. The saved lot is west, which matches the retry.
3. The function returns booking 301 before a new booking ID can be allocated.

There is one more race: two running instances of the service act at nearly the same time. Both may run `getById` before either has saved a row. A **unique constraint** is a database rule that allows only one row for the same owner and request ID.

Follow the simultaneous case:

1. Both transactions miss the first lookup and allocate a possible booking ID. Allocation alone does not consume a space.
2. Both try to save Ada's ID 17 before creating a booking. One transaction saves the unique request row.
3. That winner creates the booking in the same transaction and commits both rows.
4. In PostgreSQL, the competing save waits for the winner's outcome. After the winner commits, the database rejects the other save. `RequestIdAlreadyExists` identifies this specific rule, not an unrelated database error. If the first transaction had rolled back, the waiting save could proceed instead.
5. The losing transaction rolls back. Its catch block starts a new transaction, reads the now-committed winner and returns it. If the lot differs, it returns a conflict instead.

Claiming the request ID before taking the space is essential. If both requests tried to take the last space first, the loser could report “full” before it discovered that this same request already won.

The database manages both the booking table and request table in one transaction. A durable commit keeps both. If the transaction rolls back, or the database crashes before that commit becomes durable, recovery keeps neither. After a durable commit, recovery keeps both. A payment call or message goes to another system, outside this database transaction; lesson 07 handles that separate problem.

`requireNotNull` makes an assumption visible: a committed request row is not deleted between the rejected insert and the next lookup. The retention rule below must leave enough time for that handoff.

## Go deeper: prove the rule with four rows

The main idea does not require SQL, the database language introduced in lesson 00. This optional exercise shows the database rule that detects the two-service race.

Read the table definition first:

1. The first column says whose action this was.
2. The second column is the number created for the tap.
3. The third column records what that tap requested.
4. The fourth column records the answer.
5. The last line of the table definition applies the unique constraint to the first two columns.

Now predict the two result rows. Will the second insert replace west with east?

```sql run
CREATE TABLE receipt (
  owner TEXT NOT NULL,
  request_id TEXT NOT NULL,
  lot TEXT NOT NULL,
  booking_id INTEGER NOT NULL,
  PRIMARY KEY (owner, request_id)
);

INSERT INTO receipt VALUES ('Ada', '17', 'west', 301);

-- Same owner and request ID: keep the first answer.
INSERT INTO receipt VALUES ('Ada', '17', 'east', 302)
ON CONFLICT (owner, request_id) DO NOTHING;

SELECT owner, request_id, lot, booking_id FROM receipt;

-- A new tap has a new request ID, so it can add a row.
INSERT INTO receipt VALUES ('Ada', '18', 'west', 302);
SELECT owner, request_id, lot, booking_id FROM receipt ORDER BY request_id;
```

The first result contains only Ada, 17, west and 301. The conflicting insert does nothing; it does not overwrite the original request. The second result adds ID 18 as a separate action.

Ignoring the conflicting insert is not the whole request function. After it saves no row, the service must read the saved row and compare its lot with the incoming lot. Matching values mean “return the first answer”. Different values mean “return a conflict”. The Kotlin-like code claims the request ID before creating the booking, then uses a rollback and a new transaction for the losing path.

- Question::If both service copies try to insert Ada's ID 17, what decides which request row can exist?::The unique constraint allows only one saved row for Ada's ID 17.

## Limits you must choose

The service must document how long it remembers request IDs. If it deletes the row after 24 hours, an automatic retry after 24 hours is no longer safe. The phone should then look up the known booking or ask the user what to do; it should not silently create a new request ID.

The service must also state which answers it remembers. This lesson stores successful bookings. A service may store failures too, but that is a separate contract and changes which retries can be attempted again.

## Try it

Run the SQL once unchanged. Then make these changes one at a time and predict the rows before each run:

1. Change the second request from east to west. The stored row should still remain booking 301.
2. Remove the last line inside the table definition, remove the comma after the fourth column and remove the two-line conflict instruction after the second insert. The two rows for ID 17 can now coexist; the service no longer has one answer for one tap.
3. Keep the constraint but change Ada to Ben in the second insert. Ben's ID 17 is a different user's action, so both rows can exist.

For the real failure path, use the [drop-the-reply lab](https://pachulski.dev/labs/parking-design/#retry). Create one booking, lose its reply, retry with the same ID and verify that the durable booking count remains one.

## Check yourself

- Ada's phone times out after sending ID 17. Which ID should its retry send?::*17||18 >> A new ID describes a new tap and can create another booking. >> the-building-block::The retry belongs to the same tap, so it reuses 17.
- ID 17 originally requested west. A retry carries ID 17 and east. What should happen?::Create an east booking >> The same ID may not silently change the action it names. >> the-building-block||*Return a conflict::The values disagree, so the service cannot treat this as the original request.
- Two service copies receive Ada's ID 17 together. What prevents two request rows?::*The database's unique constraint||The phone's network timeout >> A timeout says only that the phone did not receive a reply. >> the-building-block::The constraint allows only one request row. The losing transaction must also roll back its tentative booking before reading the winner.

## Sources

- [Amazon Builders' Library · Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) — describes a client request identifier, returning a result for a repeated request and rejecting changed parameters under the same identifier.
- [PostgreSQL · Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — a unique constraint requires the listed values to be unique together.
- [PostgreSQL · INSERT](https://www.postgresql.org/docs/current/sql-insert.html) — `ON CONFLICT` can choose an alternative to a unique-constraint error.
- [PostgreSQL · Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — describes how a unique insert can be affected by another transaction whose changes were not visible when the statement began.
