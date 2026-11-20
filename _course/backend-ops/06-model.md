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

## Try it

Run the owner constraint and count fixtures. Change the left join to an inner join and predict which owner disappears.

[Open the local exercise](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service#core-workbench)

## Check yourself

- Ben has no bookmarks. What should his count be?::*Zero matching bookmark names||One because his account row exists >> The account exists but has no matching bookmark. >> the-building-block::A foreign key enforces a relationship; a left join can include owners with zero bookmarks.

## Sources

- [Technical reference](https://www.sqlite.org/foreignkeys.html)
