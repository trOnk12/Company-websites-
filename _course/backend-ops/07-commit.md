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

## Try it

Run the data drills. Move the pending insert to a second transaction in a disposable copy. Stop between commits and inspect both tables.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- The worker loses the acknowledgement. Which value should a second delivery reuse?::*The original event identity||A fresh identity for each delivery attempt >> The consumer needs a stable identity to recognize redelivery. >> the-building-block::A transaction can commit both the bookmark and a pending event, or roll back both.

## Sources

- [Technical reference](https://www.sqlite.org/lang_transaction.html)
