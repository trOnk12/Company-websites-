---
title: Can two green maps promise the last space?
short: Can two green maps promise the last space?
summary: Define what success means before choosing storage.
takeaway: A map may be stale while the reservation contract still admits at most one winner.
---

## The problem

One space is free. Ada and Ben see a green pin and tap Reserve at the same time. May both screens say “reserved”?

## See it

```diagram promise
```

## The building block

A map helps someone choose a destination. A **reservation** gives someone a claim on a space. Suppose the map may show a reading up to 30 seconds old. For reservations we need an **invariant**, a rule that must hold after every completed change. For a lot with one space, at most one active reservation may be confirmed.

Write the contract from the driver's perspective. A confirmation names a durable reservation the driver can retrieve later. A refusal means no space was granted by that attempt. Silence means the phone stopped waiting. The service might already have saved the reservation. Later lessons turn each sentence into a test.

### Turn the promise into a failing test

At 09:00 the map shows one space. At 09:00:05 Ada reserves it. At 09:00:07 Ben still sees the green pin and tries to reserve. A refusal for Ben and a retrievable confirmation for Ada satisfy both promises. A second confirmation breaks the inventory rule immediately, even if the map turns red one millisecond later.

Try the same reasoning with a concert seat. Two customers may view seat B12 as available. What evidence would prove a violation? Two simultaneously valid tickets for B12 at the same event. A screenshot of the seating chart alone proves nothing about issued tickets.

## Run the contract against two histories

A reservation ledger is a list of grants. Each row below names a run, a driver, a space and whether the grant is still active. Both phones saw the same green pin in each run. Can you tell which run broke the promise using only the grants?

**SQL** is a language for asking a database questions. Press the Run SQL button on the course website. In the offline notes, open the lesson link or run the block in a fresh SQLite database. This script makes a temporary practice database on your device. You can edit it and run it again from the same starting point.

```sql run
CREATE TABLE grant_log (
  run TEXT, driver TEXT, space TEXT, active INTEGER
);
INSERT INTO grant_log VALUES
  ('morning', 'Ada', 'B12', 1),
  ('evening', 'Ada', 'B12', 1),
  ('evening', 'Ben', 'B12', 1);

SELECT run, space, COUNT(*) AS active_grants
FROM grant_log
WHERE active = 1
GROUP BY run, space
HAVING COUNT(*) > 1;
```

Start with one row: evening, Ben, B12, 1. Read across it as a sentence: “In the evening run, Ben holds an active grant for B12.” The table stores many such rows. The number 1 means active and 0 means ended.

Read the query from the middle. `FROM` chooses the ledger. `WHERE` keeps active grants. `GROUP BY` makes a pile for each run and space. `HAVING` keeps piles with more than one row. You should see one violation: two active grants for B12 in the evening. Getting a row is a failed design test.

Now change only Ben’s active flag from 1 to 0 because his grant ended. Predict the output, then run it. An empty result means there are no duplicate active grants in this snapshot. To detect overlap earlier in the evening you would need the times of grants and releases. Could this query detect a confirmation that the driver received but the service never recorded? To test that part of the promise, keep the replies independently and look up each confirmed identity after restart.

## Try it

Use two slips of paper for the phones and one for the space. List the possible pairs of replies if both attempts finish and no one cancels. Change the map's freshness promise to one second. Which read becomes harder to serve? Does the reservation rule change?

[Run the two-phone race](https://pachulski.dev/labs/parking-design/#race)

## Check yourself

- What can be 30 seconds old?::*The map reading||The right to a confirmed space >> The freshness allowance belongs to the map. >> the-building-block::The freshness allowance belongs to the map.
- Do two green pins violate the reservation rule?::Yes, each pin grants a space >> Reading availability does not allocate it. >> the-building-block||*Check the grants first::Reading availability does not allocate it.
- What does silence prove?::*The phone lacks a result||The database rejected the write >> The reply could have been lost after the write. >> the-building-block::The reply could have been lost after the write.

## Sources

- [Google SRE · Implementing SLOs](https://sre.google/workbook/implementing-slos/) — “specify a target level for the reliability of your service”
- [SQLite · SELECT and grouping](https://www.sqlite.org/lang_select.html)
