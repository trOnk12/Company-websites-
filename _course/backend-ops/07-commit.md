---
title: What if the service stops between two writes?
short: What if the service stops between two writes?
summary: Save the bookmark and the work it creates together.
takeaway: A transaction can commit both the bookmark and a pending event, or roll back both.
---

## The problem

Your save route writes river. A second write records that a worker should announce it. The process stops between those writes. What should the next process find?

## See it

```diagram commit
```

## The building block

A transaction groups database changes behind one commit. Put the saved row and the pending event in the same database transaction. A failure before commit leaves neither change. A successful commit makes both available. A worker can deliver the pending event afterward. If it sends successfully but stops before recording completion, it may send again. Give the event a stable identity. The consumer can record that identity and a database effect together to avoid applying that effect twice. Sending an email introduces another system and needs its own delivery contract.

### Move the crash one statement at a time

Think of the event as a durable to-do note named E17. With separate commits, a crash after saving river can leave a bookmark and no E17. The worker can never discover the missing note by polling its event table. In one transaction, a crash before commit discards both writes; after commit, the worker can find E17 again after restart. This is the **transactional outbox** pattern. A later crash after sending but before marking E17 delivered creates a different problem: the worker knows it owes delivery, but cannot tell whether the receiver already acted.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#07-commit)

### Optional local lab

Run the data drills. Move the pending insert to a second transaction in a disposable copy. Stop between commits and inspect both tables.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- The worker loses the acknowledgement. Which value should a second delivery reuse?::*The original event identity||A fresh identity for each delivery attempt >> The consumer needs a stable identity to recognize redelivery. >> the-building-block::A transaction can commit both the bookmark and a pending event, or roll back both.

- Which database state contradicts the promise that every saved bookmark schedules delivery?::Both writes were discarded before commit >> A committed bookmark must have scheduled its event. >> the-building-block||*River exists but its pending event was never recorded::A committed bookmark must have scheduled its event.
- Where must a consumer record an event identity to guard a local balance update against repeats?::*In the same transaction as the balance update||Only in memory after acknowledging the message >> The deduplication decision and the protected effect must survive a crash together. >> the-building-block::The deduplication decision and the protected effect must survive a crash together.

## Sources

- [Technical reference](https://www.sqlite.org/lang_transaction.html)
