---
title: Can two clients prove the rule?
short: Can two clients prove the rule?
summary: Test a retry through the running service and read what survived.
takeaway: An integration test can check replies, stored state and persistence across a fresh process.
---

## The problem

A test double standing in for the database can return success without writing anything. How would a reviewer know your server actually preserved the bookmark?

## See it

```diagram test
```

## The building block

An **integration test** checks several real components together. Here the client, server and database all run. Run the supplied test. It creates an empty database, starts the server and sends two writes with the same name from separate workers. It expects one creation and one existing result in either order. It stops the process, starts another against the same file and reads back the list. This distinguishes a durable write from a value held only in memory. Two workers exercise contention without proving correctness for every possible ordering. The unique key provides the underlying guarantee.

## Try it

Complete the deletion assignment in the lab. Show that removing the row survives a restart and that a second delete follows your documented contract.

[Open the runnable bookmark lab](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- Both calls return a success status. What evidence is still missing?::*The saved rows after restart||The order in which the two workers began >> Start order cannot establish persistence. >> the-building-block::An integration test can check replies, stored state and persistence across a fresh process.

## Sources

- [Technical reference](https://docs.python.org/3/library/sqlite3.html)
