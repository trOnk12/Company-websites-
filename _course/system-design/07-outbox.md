---
title: How do you send an event after a crash?
short: How do you send an event after a crash?
summary: Save the business change and the work it creates together.
takeaway: Commit the event with the grant, then make repeated deliveries safe for each consumer effect.
---

## The problem

The reservation commits, then the process dies before sending a notification. Sending first could instead announce a reservation that later rolls back. Where should the obligation to send live?

## See it

```diagram outbox
```

## The building block

Store an **event**, a record saying that something happened, such as a space being granted, in the same transaction as the reservation. This is the **transactional outbox pattern**. Another process reads committed events and delivers them. After a restart, the service can distinguish pending work from a reservation that never happened.

A sender can deliver an event and crash before marking it complete. After recovery it can deliver again. A consumer can store the event identity and its own database effect in one transaction. That protects the database effect from repetition. An email provider forms another boundary. A local transaction alone cannot guarantee exactly one message in the driver's inbox.

### Follow event 41 through a crash

Ada's committed reservation and event 41 appear together. A worker publishes 41 and stops before recording the delivery. A replacement publishes 41 again. On the receiving side, insert 41 into a table of processed identities and update the local reservation view in one transaction. The first delivery commits both changes. A duplicate detects the existing identity and leaves the view alone.

Reverse the receiving order and commit the processed marker on its own first. A crash before the view update now loses the effect permanently: every retry finds a completed marker. To test the repaired version, stop the worker at each boundary, run the worker again, and count both distinct processed IDs and visible reservations.

## Go deeper: What if events arrive out of order?

Grant has version one and a later reversal version two. Applying two and then one blindly can resurrect a cancelled grant. Event identity detects a duplicate, but cannot order two different events. For complete state snapshots a consumer can retain the highest applied version per object. For incremental changes, a gap may require replay or rebuilding from an authoritative snapshot.

- May a balance consumer skip a missing event that only contains an amount to add?::Not without another recovery rule. The missing amount changes the total.

## Deliver event 41 twice to a real table

Focus on the receiving service. The publisher can deliver the same event again after a crash. This consumer owns both a table of accepted event IDs and a local count. A **trigger** is work the database runs as part of a statement. Here it updates the count only when a new ID is inserted.

```sql run
CREATE TABLE accepted (event_id INTEGER PRIMARY KEY);
CREATE TABLE dashboard (confirmed INTEGER NOT NULL);
INSERT INTO dashboard VALUES (0);
CREATE TRIGGER count_new_grant AFTER INSERT ON accepted
BEGIN
  UPDATE dashboard SET confirmed = confirmed + 1;
END;

BEGIN;
INSERT INTO accepted VALUES (41);
ROLLBACK;
SELECT confirmed AS after_crash FROM dashboard;

INSERT INTO accepted VALUES (41)
ON CONFLICT (event_id) DO NOTHING;
INSERT INTO accepted VALUES (41)
ON CONFLICT (event_id) DO NOTHING;
SELECT confirmed, (SELECT COUNT(*) FROM accepted) AS distinct_events
FROM dashboard;
```

The rollback removes both writes. The next delivery inserts 41 and increments the count. The last delivery inserts nothing, so the trigger never fires. The results are zero after the rollback and one confirmation for one distinct event after replay. Change only the final 41 to 42 and predict both counts.

The publishing side has a different transaction. It inserts the reservation and a row in its outbox, then commits both. A worker may publish that row more than once. The receiving transaction above protects one database projection. An email sent from outside that database would need its own delivery contract.

## Try it

[Crash the receipt worker and replay event 41 in the browser lab](https://pachulski.dev/labs/parking-design/#delivery)

Trace crashes before the reservation commits, after it commits, and after delivery but before acknowledgement. For each, count durable grants, pending events and possible deliveries. Give a permanently invalid event a bounded retry policy, an inspection queue and a way to replay it after repair.

## Check yourself

- Which two writes belong together?::Grant and any later log line >> An independent later write can disappear after a crash. >> the-building-block||*Grant and pending event::An independent later write can disappear after a crash.
- When can delivery repeat?::*After a lost receipt||Only before the grant exists >> The sender cannot tell that its first delivery succeeded. >> the-building-block::The sender cannot tell that its first delivery succeeded.
- What identifies a redelivery?::The time of this attempt >> A retry can arrive at a different time. >> the-building-block||*The original event identity::A retry can arrive at a different time.

## Sources

- [AWS · Transactional outbox](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) — “The events processing service might send out duplicate messages or events”
- [SQLite · CREATE TRIGGER](https://www.sqlite.org/lang_createtrigger.html)
