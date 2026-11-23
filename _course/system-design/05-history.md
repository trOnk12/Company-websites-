---
title: Where does the next page of history begin?
short: Where does the next page of history begin?
summary: Keep a moving list continuous by saving the last record's complete position.
takeaway: A cursor must contain every field needed to identify one exact place in the sort order.
---

## The problem

Ada opens her parking history. The server returns two sessions at a time, newest first.

Three sessions started at 10:00:

| Position | Session |
|---|---:|
| first | 9 |
| second | 8 |
| third | 7 |

The first page is 9, 8. Before Ada asks for page two, a new session 10 arrives at 10:01. The live list is now 10, 9, 8, 7.

Predict page two. Your rule must neither repeat a session nor lose one.

A **cursor** is the saved position after the last record on the page. It is not a page number and it is not permission to read another driver's records.

## See it

```diagram history
```

Stop after step two and choose what page two should contain. Then reveal the new record. The saved pair stays (10:00, 8), even though session 8 shifts right.

## The building block

The server first gives every row one unambiguous position:

1. A later start time comes first.
2. When two times are equal, larger `id` comes first.

The first page ends at (10:00, 8), so the phone sends that pair back as its cursor. Read the pair from left to right:

- any time before 10:00 is after the cursor;
- at exactly 10:00, only an ID below 8 is after it;
- a time after 10:00 is before the cursor and does not belong on page two.

That rule selects session 7. The ID is essential because the time alone cannot distinguish sessions 9, 8 and 7.

Here is the same rule in PostgreSQL. The first request omits the cursor condition. Later requests supply the last displayed time and ID.

```sql
SELECT id, started_at
FROM sessions
WHERE owner_id = $1
  AND (started_at, id) < ($2, $3)
ORDER BY started_at DESC, id DESC
LIMIT 20;
```

Read the query line by line:

- The first placeholder is Ada's account. The cursor never replaces the ownership check.
- The second and third placeholders are 10:00 and 8 for this example.
- The pair comparison is the compact SQL form of the two bullet rules above.
- The sorting line uses the same two fields in the same order as the cursor.
- The final line returns at most twenty records.

The service response can make the contract explicit without exposing SQL to the phone:

```kotlin
data class HistoryCursor(val startedAt: Instant, val sessionId: Long)

data class HistoryPage(
    val sessions: List<Session>,
    val nextCursor: HistoryCursor?
)
```

The server builds the next cursor from the final returned session. If it returns no sessions, there is no next cursor.

## Break three approaches

Run the SQL and inspect the four result tables in order. Before running it, write these predictions:

1. Which approach repeats session 8?
2. Which approach loses session 7?
3. Which approach returns 7 exactly once?

```sql run
CREATE TABLE history (owner TEXT, started INTEGER, id INTEGER PRIMARY KEY);
INSERT INTO history VALUES
  ('Ada', 100, 9), ('Ada', 100, 8), ('Ada', 100, 7),
  ('Ben', 100, 99);

-- Result 1: page one
SELECT id AS first_page FROM history WHERE owner = 'Ada'
ORDER BY started DESC, id DESC LIMIT 2;

-- A newer row arrives after page one was delivered.
INSERT INTO history VALUES ('Ada', 101, 10);

-- Result 2: skip two rows in the current list
SELECT id AS offset_page FROM history WHERE owner = 'Ada'
ORDER BY started DESC, id DESC LIMIT 2 OFFSET 2;

-- Result 3: save only the time
SELECT id AS time_only_page FROM history
WHERE owner = 'Ada' AND started < 100
ORDER BY started DESC, id DESC LIMIT 2;

-- Result 4: save the complete position
SELECT id AS pair_cursor_page FROM history
WHERE owner = 'Ada' AND (started, id) < (100, 8)
ORDER BY started DESC, id DESC LIMIT 2;
```

The offset page is 8, 7: it repeats 8 because the new session shifted every old position by one. The time-only page is empty: it loses 7 because 7 has the same time as the last displayed record. The pair-cursor page is 7.

The cursor does not freeze the list. It only gives the next request a stable place from which to continue.

### Failure: change a field that defines the position

Choose “Move session 7 to a newer time” in the diagram. Then replace only the insert of session 10 in the SQL exercise with:

```sql
UPDATE history SET started = 101 WHERE id = 7;
```

Page one was already delivered. Session 7 now moves above its saved boundary. The cursor query returns no rows, so Ada misses 7 during this walk.

Use ordering fields that do not change after creation. If the product requires an exact export of all rows that existed at one instant, a moving-list cursor is the wrong promise; create a fixed snapshot—a stored view of the rows as they existed at one moment—and define how long it lives.

## Go deeper: Can the database find the right page with less work?

Correctness comes first: the cursor query above must return session 7. Now keep that query unchanged and optimize how the database finds its answer.

An **index** is another ordered structure that the database maintains beside the table. For this query, imagine cards filed by owner, then time, then ID. An index may avoid reading and sorting many unrelated cards, but every write must also update it.

A **query plan** is the database's proposed route to the answer. It is not a timing result. In the output below, the first plan reports a table scan and a temporary sorting structure. The second reports a search through the named index and no separate sort.

Predict before running: both page results should be **7**, but only the first plan should contain a separate sort.

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

CREATE INDEX by_driver_time_id
  ON history(owner, started DESC, id DESC);
EXPLAIN QUERY PLAN SELECT * FROM next_page;
SELECT * FROM next_page;
```

Both pages return 7. The first plan scans and sorts. The second searches the index whose fields match the owner filter and required order.

Now edit only the index definition so it contains the owner field and nothing else. The page remains 7, but the separate sort returns: finding Ada's records is not the same as having them in the required order.

### Measure the trade-off, not just the faster read

Download [the history measurement](https://pachulski.dev/labs/parking-design/history.py) and run:

```sh
python3 history.py
```

It creates 20,000 records three times: without a secondary index, with an owner-only index and with the full owner/time/ID index. It verifies that every version returns the same five IDs. It then counts SQLite virtual-machine instructions for the read and for the next 100 writes, and reports allocated database bytes.

On SQLite 3.53.1, the full index reduced the page read from 210,029 to 128 instructions, while the 100 writes rose from 1,406 to 2,206. These are instructions, not milliseconds or rows visited, and another SQLite version can differ. Before keeping the index in production, measure representative page response time, write response time, storage and the real read-to-write ratio.

## Try it

1. Draw five records for Ada and two for Ben. Give three Ada records the same time.
2. Take a first page of two and write down its complete cursor.
3. Insert a newer Ada record. Predict the offset, time-only and pair-cursor pages.
4. Run the editable SQL and compare the output with your prediction.
5. Move one unseen record above the cursor. Explain why the cursor cannot recover it.
6. Only then compare the query plans and write down the cost you would measure before adding the index.

You have passed this puzzle when you can construct the cursor from a returned page, expand the pair comparison into plain words, reproduce both failure cases and separate a correctness decision from an index decision.

## Check yourself

- Why is start time alone an incomplete cursor?::It is encrypted and cannot be compared >> The time is readable. >> the-building-block||*Several sessions can share one time::The ID identifies a position inside the tie.
- What must remain beside the cursor condition?::*The owner check||Nothing; the cursor grants access >> A position is not authorization. >> the-building-block::A position is not authorization.
- Why can session 7 disappear after its time changes?::The index deletes the record during sorting >> Indexes do not define the product promise. >> break-three-approaches||*It jumps above the boundary already crossed::A moving row can jump over the saved position.
- What does an index change here?::Which records belong on the next page >> The cursor defines the page. >> go-deeper-can-the-database-find-the-right-page-with-less-work||*How the database finds the same page::Correctness stays unchanged.

## Sources

- [PostgreSQL · Sorting rows](https://www.postgresql.org/docs/current/queries-order.html) — later sort expressions break ties left by earlier expressions.
- [PostgreSQL · Row comparisons](https://www.postgresql.org/docs/current/functions-comparisons.html#ROW-WISE-COMPARISON) — row values are compared from left to right.
- [PostgreSQL · Multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html) — leading fields determine how effectively a B-tree index can narrow its search.
- [SQLite · Scrolling window queries](https://www.sqlite.org/rowvalue.html#scrolling_window_queries) — row values express a continuation boundary without increasing `OFFSET` work.
- [SQLite · EXPLAIN QUERY PLAN](https://www.sqlite.org/eqp.html) — explains `SCAN`, `SEARCH` and temporary sorting output.
- [Python · `set_progress_handler`](https://docs.python.org/3/library/sqlite3.html#sqlite3.Connection.set_progress_handler) — the measurement hook counts SQLite virtual-machine instructions.
