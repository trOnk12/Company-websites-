---
title: Where does the next page of history begin?
short: Where does the next page of history begin?
summary: Order records and handle ties before choosing an index.
takeaway: Put the unique tie-breaker in both the sort order and the cursor.
---

## The problem

Use the durable reservation rows from the write path to build the driver’s history. A driver's history contains millions of records across many owners. Several sessions began in the same second. How can the second page avoid skipping one?

## See it

```diagram history
```

## The building block

Sort one owner's rows by start time descending, then by unique session number descending. A cursor records the last position shown. If sessions 9, 8 and 7 have the same time and a page ends at 8, the next page should include 7. A time alone cannot identify that boundary.

Select one owner, take time-and-number pairs smaller than the cursor, sort by the same pair and return twenty. An index ordered by owner, time and number gives the database a path into that range. The index takes storage and adds work to writes. If ordering fields change between requests, a cursor alone does not freeze history.

In PostgreSQL the first page omits the cursor predicate. Subsequent pages supply the last displayed pair.

```sql
SELECT id, started_at FROM sessions
WHERE owner_id = $1 AND (started_at, id) < ($2, $3)
ORDER BY started_at DESC, id DESC LIMIT 20;

CREATE INDEX sessions_history ON sessions
    (owner_id, started_at DESC, id DESC);
```

### Walk a cursor by hand

Ada owns rows (10:00, 9), (10:00, 8) and (10:00, 7). Ben owns (10:00, 99). With a page size of two, Ada receives 9 and 8. The next request carries (10:00, 8). Insert Ada's new row (10:01, 10) before that request arrives. The next page still contains 7. Starting again from the first page would reveal 10.

Compare skipping the first two rows instead. The live list now begins 10, 9, 8, 7. Skipping two would return 8 again. Decide whether a product needs a stable position for browsing or a frozen set for an export. For the latter, design how the export records its input snapshot and when that snapshot can expire.

## Run both page boundaries on the same records

Ada has three records with the same timestamp. She has already read IDs 9 and 8. A newer record then arrives. Which second page repeats a record? Which loses one? Run the script. The first result is page one. Compare the three candidate second pages before changing their page size.

```sql run
CREATE TABLE history (owner TEXT, started INTEGER, id INTEGER PRIMARY KEY);
INSERT INTO history VALUES
  ('Ada', 100, 9), ('Ada', 100, 8), ('Ada', 100, 7),
  ('Ben', 100, 99);
SELECT id AS first_page FROM history WHERE owner = 'Ada'
ORDER BY started DESC, id DESC LIMIT 2;

INSERT INTO history VALUES ('Ada', 101, 10);
SELECT id AS offset_page FROM history WHERE owner = 'Ada'
ORDER BY started DESC, id DESC LIMIT 2 OFFSET 2;

SELECT id AS time_only_page FROM history
WHERE owner = 'Ada' AND started < 100
ORDER BY started DESC, id DESC LIMIT 2;

SELECT id AS pair_page FROM history
WHERE owner = 'Ada' AND (started, id) < (100, 8)
ORDER BY started DESC, id DESC LIMIT 2;
```

The offset page repeats 8. The time-only page skips 7. The pair page returns 7 exactly once. If you change the first page size to one, also take its last pair as the new cursor and use an offset of one for the comparison. An index can make a query faster; it cannot fix a boundary that selects the wrong rows.

## Try it

Create five rows across two owners, including a time tie. Fetch two at a time and insert a newer session between page requests. Trace the next page. On a larger fixture, compare execution plans with and without the matching index. Record rows visited as well as elapsed time.

## Check yourself

- Why include a unique number in the cursor?::To encrypt the timestamp >> The number completes the ordering. >> the-building-block||*To break time ties::The number completes the ordering.
- Does a cursor grant access to another owner's rows?::*Keep the owner check||Yes, if the cursor looks random >> A position does not establish permission. >> the-building-block::A position does not establish permission.
- What exposes the cost of the index?::Measure only the fastest read >> The database maintains an additional structure. >> the-building-block||*Measure writes and storage::The database maintains an additional structure.

## Sources

- [PostgreSQL · Multicolumn Indexes](https://www.postgresql.org/docs/17/indexes-multicolumn.html) — “the index is most efficient when there are constraints on the leading (leftmost) columns”

- [PostgreSQL · LIMIT and OFFSET](https://www.postgresql.org/docs/17/queries-limit.html)
- [SQLite · Scrolling window queries](https://www.sqlite.org/rowvalue.html)
