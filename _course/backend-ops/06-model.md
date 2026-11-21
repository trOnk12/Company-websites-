---
title: Can a bookmark point to a missing owner?
short: Can a bookmark point to a missing owner?
summary: Model relationships and query accounts that have no saved rows.
takeaway: A foreign key enforces a relationship; a left join can include owners with zero bookmarks.
---

## The problem

Checking that an owner exists in a route only protects that route. What happens when another writer inserts a row?

## See it

```diagram model
```

## The building block

A table stores rows with named columns. A primary key identifies one row. A foreign key asks the database to check that a referenced owner exists. The laboratory enables that check on its SQLite connection. A join combines rows by a matching key. A left join keeps accounts with no match. Counting the matched bookmark name yields zero for Ben. Counting every output row instead would count the empty match as one.

### Write the intermediate rows before counting

Start with accounts Ada and Ben and a single bookmark, river, owned by Ada. A left join from accounts produces two pairs: (Ada, river) and (Ben, missing). Counting the nonmissing bookmark names in each group gives one and zero. An inner join drops Ben's pair completely. Adding a second Ada bookmark changes only her count. The foreign key guards a different promise: inserting a bookmark for an account that does not exist should fail when the constraint is enabled.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#06-model)

### Optional local lab

Run the owner constraint and count fixtures. Change the left join to an inner join and predict which owner disappears.

[Open the local exercise files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- Ben has no bookmarks. What should his count be?::*Zero matching bookmark names||One because his account row exists >> The account exists but has no matching bookmark. >> the-building-block::A foreign key enforces a relationship; a left join can include owners with zero bookmarks.

- Which change makes Ben vanish from the result?::Count matched bookmark names after the left join >> An inner join emits matching pairs only. >> the-building-block||*Use an inner join::An inner join emits matching pairs only.
- What stops a stored bookmark from referring to an absent account?::*An enforced foreign key||A left join in a reporting query >> Reading a relationship cannot enforce writes to it. >> the-building-block::Reading a relationship cannot enforce writes to it.

## Sources

- [Technical reference](https://www.sqlite.org/foreignkeys.html)
