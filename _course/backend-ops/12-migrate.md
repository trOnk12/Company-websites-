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

### Practice a mixed-version rollout

At noon the new label field is optional. The backfill copies river into its label. At 12:01 an old writer inserts hill and supplies no label. Counting missing labels now returns one, even though the earlier job reported success. Let new writers fill the label while old readers still request only the existing fields. Once old writers are gone, run the catch-up pass, count missing labels again, and then enforce the rule. Keep the compatibility window open until rolling back to the previous application is no longer required.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#12-migrate)

### Optional local lab

Run the migration and snapshot exercise. Add an old-style insert after the backfill. Demonstrate the missing label and restore a sample into a separate database.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#data-drills)

## Check yourself

- A backfill finished but an old writer still runs. What can happen?::*A new row can lack its label||All future rows inherit the earlier backfill >> The backfill touched only the rows present at the time. >> the-building-block::An additive migration gives old and new application versions a period of compatibility.

- Which observation should precede requiring every label?::The first backfill succeeded while old writers were still active >> A still-active old writer can introduce new gaps. >> the-building-block||*Old writers retired and no missing labels remain::A still-active old writer can introduce new gaps.
- Which exercise tests recovery of previously stored values?::*Restore the backup separately and read representative rows||Start an older application against an empty database >> A program rollback alone does not restore data. >> the-building-block::A program rollback alone does not restore data.

## Sources

- [Technical reference](https://www.sqlite.org/backup.html)
