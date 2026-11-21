---
title: Where does the next page of history begin?
short: Where does the next page of history begin?
summary: Order records and handle ties before choosing an index.
takeaway: Put the unique tie-breaker in both the sort order and the cursor.
---

## The problem

Use the durable reservation rows from the write path to build the driver’s history. The service stores millions of records across many drivers. Ada's phone shows her own records, two at a time. Several of her sessions began in the same second. What should the phone send when she taps Next?

## See it

```diagram history
```

## The building block

Sort one owner's rows by start time descending, then by unique session number descending. A cursor records the last position shown. If sessions 9, 8 and 7 have the same time and a page ends at 8, the next page should include 7. A time alone cannot identify that boundary.

Read the pair from left to right. For a cursor at (10:00, 8), every earlier time qualifies. At exactly 10:00 only numbers below 8 qualify. A newer time cannot qualify, even if its number is small. In a production page of twenty rows, select one owner, apply that rule, sort the qualifying pairs in the same order and take the first twenty. An index ordered by owner, time and number gives the database a path into that range. The index takes storage and adds work to writes. If ordering fields change between requests, a cursor alone does not freeze history.

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

### Change what happens between page requests

In the diagram choose **Move session 7 to a newer time**. Which session now lies below the saved pair? Test your prediction in the SQL above. Replace only the line that inserts Ada’s session 10 with this line:

```sql
UPDATE history SET started = 101 WHERE id = 7;
```

Page one was already delivered. Session 7 now sorts above both records on that page. The offset query repeats 8 and the pair query returns no rows. The driver never saw 7. A stable cursor works for a moving list when its ordering keys stay fixed. An export that must include every record at a specific instant needs a fixed view of the data.

## Go deeper: Can the database find the right page with less work?

You already know that Ada’s second page should contain session 7. Keep the rows and the question fixed. Change only the index and predict two things separately. Will the page change? Will the database still need a separate sort?

An index is a second ordered structure maintained alongside the table. Imagine cards filed first by driver, then by time, then by session number. Ada’s cards sit together and ties already have an order. The database can look up the relevant part of that structure. A query plan describes how it intends to find the rows.

The view below gives the page query a name. Both halves run exactly the same query. Read the detail column of each plan and compare the two actual pages.

```sql run
CREATE TABLE history (
  id INTEGER PRIMARY KEY, owner TEXT NOT NULL, started INTEGER NOT NULL
);
INSERT INTO history VALUES
  (9, 'Ada', 100), (8, 'Ada', 100), (7, 'Ada', 100),
  (99, 'Ben', 100), (10, 'Ada', 101);
CREATE TEMP VIEW next_page AS
  SELECT id FROM history
  WHERE owner = 'Ada' AND (started, id) < (100, 8)
  ORDER BY started DESC, id DESC LIMIT 2;

EXPLAIN QUERY PLAN SELECT * FROM next_page;
SELECT * FROM next_page;

CREATE INDEX by_driver_time_id ON history(owner, started DESC, id DESC);
EXPLAIN QUERY PLAN SELECT * FROM next_page;
SELECT * FROM next_page;
```

Both pages return 7. In the first plan, find the scan and the temporary B-tree for ordering. SQLite reads the table and arranges the qualifying rows. In the second, find the search and the index name. The index supplies the order and contains every column this query needs. The plan describes the strategy. It provides no elapsed time or exact count of visited rows.

Now edit only the index definition so it ends with (owner). Predict which work comes back. The service can still locate Ada’s rows, but those entries lack the required order by start time. Look for the sorting step again and verify that the returned ID stays 7. This tiny fixture makes the plan readable. To say how much faster it runs, you would need representative data and measurements.

### Count the work of the read and the next hundred writes

The browser showed which strategy the database chose. How much work did it do? Save [the history measurement](https://pachulski.dev/labs/parking-design/history.py) and run it with Python 3. It creates 20,000 synthetic records in a fresh database for each index choice. Three quarters belong to Ada. Every ten consecutive IDs starting at a multiple of ten share a timestamp.

```sh
python3 history.py
```

First check that all three runs returned the same five IDs. Read ops counts SQLite virtual machine instructions for that one page. The next column counts instructions to insert and commit the same 100 new records. The last column gives allocated database bytes after the inserts. The script verifies the page against a separately sorted list.

On SQLite 3.53.1 the full index took 128 instructions to read the page and 2,206 for the writes. With no secondary index those counts were 210,029 and 1,406. An instruction count is neither elapsed time nor a count of rows. Your version can report different numbers. If this endpoint rarely reads history but writes on every trip, which measurements would you collect on its real traffic before keeping the index?

## Try it

Create five rows across two owners, including a time tie. Fetch two at a time and insert a newer session between page requests. Trace the next page. On a larger fixture, compare execution plans with and without the matching index. Record rows visited as well as elapsed time.

## Check yourself

- Why include a unique number in the cursor?::To encrypt the timestamp >> The number completes the ordering. >> the-building-block||*To break time ties::The number completes the ordering.
- Does a cursor grant access to another owner's rows?::*Keep the owner check||Yes, if the cursor looks random >> A position does not establish permission. >> the-building-block::A position does not establish permission.
- What exposes the cost of the index?::Measure only the fastest read >> The database maintains an additional structure. >> the-building-block||*Measure writes and storage::The database maintains an additional structure.

## Sources

- [PostgreSQL · Multicolumn Indexes](https://www.postgresql.org/docs/17/indexes-multicolumn.html) — “the index is most efficient when there are constraints on the leading (leftmost) columns”

- [PostgreSQL · LIMIT and OFFSET](https://www.postgresql.org/docs/17/queries-limit.html)
- [Python · Counting SQLite instructions](https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.set_progress_handler)
- [SQLite · Reading a query plan](https://www.sqlite.org/eqp.html)
- [SQLite · Scrolling window queries](https://www.sqlite.org/rowvalue.html)
