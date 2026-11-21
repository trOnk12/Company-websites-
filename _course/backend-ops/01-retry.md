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

The database stores information in a table. Think of each row as one bookmark and each column as one property. **SQL** is a language for reading and changing these tables. A **unique key** lets the database enforce one row per name, even when two callers write together. Use river as the identity of the desired bookmark. The database accepts at most one row for that name. The insert asks it to ignore a conflicting key. The handler waits for the transaction to commit before replying. The first insertion returns 201. Repeating the same write returns 200 and leaves one row. Checking for the row in application code and inserting later leaves a gap where two callers can both see it missing.

### Lose the reply after a successful save

Ada sends a write request for river. The database commits one row, but the connection closes before Ada sees the reply. Her phone knows only that the outcome is unknown. On the second attempt the database checks the same key and finds river already there. The reply changes from a lost 201 to a visible 200, yet the durable result is still one bookmark. This property is called **idempotence**: repeating the intended operation preserves its intended effect. Starting a new operation called hill is a different intention.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#01-retry)

### Optional local lab

Run both writes. Predict the list after a third write with a new name. Check it and explain which component enforces uniqueness.

[Open the local service source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- What if the retry invents a fresh name?::*A second row can be created||The database detects the same tap automatically >> The key identifies the name supplied by the client. >> the-building-block::A stable bookmark name and a unique database key let repeated writes converge on one row.

- Does a client timeout tell you whether the insert committed?::Yes, a timeout rolls the insert back >> Losing the reply and losing the write are different events. >> the-building-block||*No, either outcome is possible::Losing the reply and losing the write are different events.
- What evidence demonstrates a successful replay?::*One durable row for river after both calls||Identical status codes for every call >> The intended effect is the stored bookmark. >> the-building-block::The intended effect is the stored bookmark.

## Sources

- [Technical reference](https://www.sqlite.org/lang_upsert.html)
