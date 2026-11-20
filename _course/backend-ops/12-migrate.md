---
title: Can two releases share one schema?
short: Can two releases share one schema?
summary: Change the shape of stored data while an older reader is still running.
takeaway: An additive migration gives old and new application versions a period of compatibility.
---

## The problem

The save route used to accept just a name. Version two wants a label on every bookmark. Some version-one clients still write only the name. When is it safe to require the label?

## See it

```diagram migrate
```

## The building block

Start with a nullable label column. Old readers selecting the name keep working. Backfill existing rows and deploy writers that populate the new field. While an old writer still runs it can create another missing label. Verify the backfill after old writers retire before enforcing the new rule. Test rollback of the application against the expanded database. Take a backup and read sample rows from an independent restored copy. A successful image rollback cannot reconstruct a dropped column.

## Try it

Run the migration and snapshot exercise. Add an old-style insert after the backfill. Demonstrate the missing label and restore a sample into a separate database.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- A backfill finished but an old writer still runs. What can happen?::*A new row can lack its label||All future rows inherit the earlier backfill >> The backfill touched only the rows present at the time. >> the-building-block::An additive migration gives old and new application versions a period of compatibility.

## Sources

- [Technical reference](https://www.sqlite.org/backup.html)
