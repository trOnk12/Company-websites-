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

### Design a test that catches a believable bug

Suppose deletion removes river from a process's working copy and replies 204. An immediate read sees an empty list. An implementation that forgot to change the database passes both checks. Restart the process against the same database and read again: river reappears. Now try the correct implementation and predict the second delete. The row remains absent and the fixture returns 404. Record responses and final rows separately. A test that recreates the database between the two processes also loses the evidence it meant to inspect.

## Try it

[Run the browser experiment](https://pachulski.dev/labs/backend-workbench/#02-test)

### Optional local lab

Complete the deletion assignment in the lab. Show that removing the row survives a restart and that a second delete follows your documented contract.

[Open the local service source files](https://github.com/trOnk12/Company-websites-/tree/main/labs/bookmark-service)

## Check yourself

- Both calls return a success status. What evidence is still missing?::*The saved rows after restart||The order in which the two workers began >> Start order cannot establish persistence. >> the-building-block::An integration test can check replies, stored state and persistence across a fresh process.

- Why reuse the database file across the restart?::It guarantees the next request returns a particular status >> The new process must reconstruct the earlier durable state. >> the-building-block||*It preserves the evidence from the first process::The new process must reconstruct the earlier durable state.
- Two racing inserts finish in a different order on another run. Which expectation stays valid?::*One creation and one existing result||The first worker always gets the creation response >> Their order may vary while the unique key still holds. >> the-building-block::Their order may vary while the unique key still holds.

## Sources

- [Technical reference](https://docs.python.org/3/library/sqlite3.html)
