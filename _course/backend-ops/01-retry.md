---
title: Did the first write happen?
short: Did the first write happen?
summary: Make a lost reply safe to retry.
takeaway: A stable bookmark name and a unique database key let repeated writes converge on one row.
---

## The problem

The save route accepts a bookmark name. Your app times out after tapping Save. The phone cannot tell whether the server wrote the row just before the reply disappeared. What must stay the same on retry?

## See it

```diagram retry
```

## The building block

A **unique key** lets the database enforce one row per name, even when two callers write together. Use river as the identity of the desired bookmark. The database accepts at most one row for that name. The insert asks it to ignore a conflicting key. The handler waits for the transaction to commit before replying. The first insertion returns 201. Repeating the same write returns 200 and leaves one row. Checking for the row in application code and inserting later leaves a gap where two callers can both see it missing.

## Try it

Run both writes. Predict the list after a third write with a new name. Check it and explain which component enforces uniqueness.

[Open the runnable bookmark lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- What if the retry invents a fresh name?::*A second row can be created||The database detects the same tap automatically >> The key identifies the name supplied by the client. >> the-building-block::A stable bookmark name and a unique database key let repeated writes converge on one row.

## Sources

- [Technical reference](https://www.sqlite.org/lang_upsert.html)
