---
title: How do you send an event after a crash?
short: How do you send an event after a crash?
summary: Follow one booking and one event through both crash windows.
takeaway: Commit the event with the booking, then make a repeated delivery produce one consumer effect.
---

## The problem

Ada receives booking 301. The dashboard service must add that booking to its confirmed count.

The booking process saves booking 301 and is about to publish event 41. It stops between those two actions. After restart, the booking still exists, but nothing in the database says that event 41 was still owed. The dashboard stays at zero.

Publishing first is not a repair. The dashboard could count event 41 and then the booking transaction could roll back. Now the dashboard announces a booking that does not exist.

The two unsafe orders are therefore:

```text
save booking → crash → event missing
publish event → rollback booking → false event
```

We need durable evidence that either contains both the booking and the work it created, or contains neither.

A **relay** is a worker that publishes saved events. If it stops, a replacement relay must be able to discover unfinished work.

## See it

```diagram outbox
```

Stop at step three. The dashboard has committed event 41, but the relay stopped before marking the outbox row sent. Predict what the replacement relay must be allowed to do.

## The building block

The **transactional outbox** is a table of messages waiting to be published. The booking service writes booking 301 and outbox event 41 inside one database transaction:

```text
BEGIN
  save booking 301
  save outbox event 41
COMMIT
```

If the transaction rolls back, neither row exists. If it commits, both rows exist. The relay reads committed outbox rows and publishes their messages.

The relay creates a second crash window:

1. publish event 41;
2. the dashboard commits its change;
3. the relay stops before recording that event 41 was sent.

After restart, the outbox row still looks pending. The only safe recovery is to publish event 41 again. Delivery can therefore repeat even though the original booking was created once.

This is a lost acknowledgement: the relay does not know whether the dashboard committed before the connection disappeared. The outcome is unknown, so recovery must tolerate either answer.

The receiving service needs the event ID as part of its own stored result. A **consumer effect** is the durable change made after receiving an event. Here it is one dashboard row for booking 301. The row stores event ID 41 as its primary key, a database rule that allows only one row with that key. The first delivery inserts it; another delivery of 41 changes zero rows.

This is not a claim that the network delivers exactly once. It is a narrower, testable claim: repeated delivery of event 41 produces one dashboard row.

The runnable path below models direct acknowledged delivery: the dashboard replies only after committing its row. With Kafka, the relay marks an outbox row published after the broker acknowledges storing the record, not after the dashboard changes. A Kafka consumer separately stores its effect and its deduplication identity or position; if it stops before saving that progress, the broker may deliver the record again.

## Run event 41 through both crash windows

Before running the SQL, predict the four results:

1. How many bookings and pending outbox rows exist after the sender commits?
2. How many rows does the first delivery add to the dashboard?
3. How many rows does the replacement delivery add?
4. What remains after the relay finally records success?

```sql run
CREATE TABLE booking_record (
  id INTEGER PRIMARY KEY,
  owner TEXT NOT NULL
);
CREATE TABLE outbox (
  event_id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES booking_record(id),
  published INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE dashboard_booking (
  event_id INTEGER PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE
);

-- One sender transaction: both rows or neither row.
BEGIN;
INSERT INTO booking_record VALUES (301, 'Ada');
INSERT INTO outbox(event_id, booking_id) VALUES (41, 301);
COMMIT;

-- Result 1: a replacement relay can discover the owed event.
SELECT (SELECT COUNT(*) FROM booking_record) AS bookings,
       (SELECT COUNT(*) FROM outbox WHERE published = 0) AS pending_events;

-- Result 2: the first delivery creates one consumer effect.
INSERT INTO dashboard_booking VALUES (41, 301)
ON CONFLICT(event_id) DO NOTHING;
SELECT changes() AS rows_added,
       (SELECT COUNT(*) FROM dashboard_booking) AS dashboard_rows;

-- The relay stops here, before it marks event 41 published.

-- Result 3: the replacement relay delivers event 41 again.
INSERT INTO dashboard_booking VALUES (41, 301)
ON CONFLICT(event_id) DO NOTHING;
SELECT changes() AS rows_added,
       (SELECT COUNT(*) FROM dashboard_booking) AS dashboard_rows;

-- Result 4: only after success does the relay mark its local work done.
UPDATE outbox SET published = 1 WHERE event_id = 41;
SELECT (SELECT published FROM outbox WHERE event_id = 41) AS published,
       (SELECT COUNT(*) FROM dashboard_booking) AS dashboard_rows;
```

The four results are: one booking and one pending event; one added dashboard row and one total row; zero added rows and one total row; then a published marker of one and one total row. The duplicate adds zero rows because event ID 41 already identifies the stored dashboard result. The relay can now mark its local outbox row published.

Do not mark the outbox row published before delivery. A crash after that mark but before publishing would hide work that no replacement relay could discover. Marking it later can cause a duplicate; the consumer-side identity makes that duplicate harmless for this database effect.

## Go deeper: Why not save the booking and event in two commits?

This smaller program stops the sender before its transaction commits. Run it, then follow the three changes below.

```sql run
CREATE TABLE grant_record (id INTEGER PRIMARY KEY);
CREATE TABLE pending_event (
  event_id INTEGER PRIMARY KEY,
  grant_id INTEGER NOT NULL REFERENCES grant_record(id)
);
CREATE TEMP VIEW evidence AS
  SELECT (SELECT COUNT(*) FROM grant_record) AS grants,
         (SELECT COUNT(*) FROM pending_event) AS events_to_send;

SELECT * FROM evidence;
BEGIN;
INSERT INTO grant_record VALUES (301);
INSERT INTO pending_event VALUES (41, 301);
ROLLBACK;
SELECT * FROM evidence;
```

1. When the transaction rolls back, both results contain zero grants and zero events: uncommitted work disappears together.
2. Change the rollback to a commit. The last result contains one grant and one event.
3. Keep the commit but remove the event insert. The last result contains one grant and zero events. That is the broken two-commit boundary: the booking survived, but a relay has no durable work to find.

The outbox does not make the booking database and the dashboard share one transaction. It removes the first gap by keeping the booking and its publishing obligation in one store. The receiving service separately makes its own event identity and effect atomic.

## Go deeper: What if events arrive out of order?

Event identity detects a repeated event. It does not order two different events.

Suppose event 41 says booking 301 is confirmed at version one, while event 42 says it is cancelled at version two. These versions must come from the authoritative booking service and increase for that booking. Applying 42 and then applying 41 blindly would resurrect the cancelled booking. A consumer of complete state can retain the highest applied version per booking and reject an older version. A consumer of incremental changes may instead need the missing event, a replay or a rebuild from an authoritative snapshot.

- A balance event adds £10. Version three arrives while version two is missing. May the consumer silently skip version two?::No. An incremental event contains part of the result, so the missing change needs an explicit recovery rule.

## Try it

1. Run the main SQL and confirm that Result 3 reports zero added rows while the dashboard still has one row.
2. Remove the conflict-handling clause from both dashboard inserts, but leave each insert's semicolon. Predict the uniqueness error on the replacement delivery and confirm it.
3. Move the update that marks the outbox row published above the first dashboard insert, then delete both dashboard inserts to model a crash. Explain why the database now says “published” while the dashboard has no row.
4. Change the replacement row to event 42 for booking 302. Explain why two rows are now correct: the IDs describe two different bookings.
5. Replace the dashboard row with an external email call. State what evidence the email provider must accept so a retry does not send two emails.

You have passed when you can place a crash before or after every boundary, predict the surviving rows and explain why one booking may require repeated delivery but only one consumer effect.

## Check yourself

- The sender transaction rolls back after inserting both rows. What can the relay find?::Booking 301 without event 41 >> Both writes were in the same transaction. >> the-building-block||*Neither booking 301 nor event 41::The rollback removes both rows.
- The dashboard committed event 41, but the relay stopped before marking it published. What should happen after restart?::Mark it published without another delivery >> The replacement cannot know the first delivery committed. >> the-building-block||*Deliver event 41 again::The consumer uses the original event identity to suppress another effect.
- Why does the dashboard row use event ID 41 as a key?::*A repeated 41 then changes zero rows||It proves the network delivered only once >> The network may redeliver; the key protects the local effect. >> the-building-block::The network may redeliver; the key protects the local effect.

## Sources

- [PostgreSQL 19 · Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) — a transaction bundles several steps into “a single, all-or-nothing operation”.
- [AWS Prescriptive Guidance · Transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) — an outbox addresses the dual-write gap; its guidance warns that processing may send duplicate events.
- [Apache Kafka 4.1 · Message delivery semantics](https://kafka.apache.org/41/design/design/#message-delivery-semantics) — after processing but before saving position, a replacement consumer may repeat already processed messages.
- [SQLite · UPSERT](https://www.sqlite.org/lang_upsert.html) — `DO NOTHING` skips an insert that violates the selected uniqueness constraint.

The booking, event and dashboard example is original. The separation between durable facts, repeated delivery and idempotent effects follows the failure reasoning in *Designing Data-Intensive Applications*.
