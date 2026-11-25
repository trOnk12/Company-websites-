---
title: Why does a confirmed booking still look missing?
short: Why does a confirmed booking still look missing?
summary: Make Ada's next read include the booking the service just confirmed.
takeaway: A successful write and an immediate read need an explicit route when copies can lag.
---

## The problem

The previous puzzle kept Ada’s place while she paged through a moving list. Now she creates booking 301 for B12 and immediately opens its details.

The booking service replies “confirmed”. The next request says “booking not found”. Both replies came from the same service. How can both be true?

The **primary store** is the database copy that accepts the booking write. A **replica** is a second copy that applies the primary store’s changes, sometimes later. The diagram calls them the write copy and read copy so you can follow the request before learning the routing rule.

## See it

```diagram read-your-writes
```

Stop after step two. The write copy has booking 301 at position 41, while the read copy has applied only through 40. Predict its answer.

## The building block

The primary store commits booking 301 and records the change at position 41. The replica receives the same changes, but applying them later lets the write return without waiting for every copy. That creates a period in which the copies disagree.

Ada’s confirmation contains two facts:

```json
{
  "bookingId": 301,
  "readAfter": 41
}
```

The booking ID identifies the result. The **write position** identifies how far a database copy must have applied changes before it can include that result.

When Ada immediately asks for booking 301, her phone sends the position back:

```text
GET /bookings/301?after=41
```

The service may now choose one of three honest actions:

1. read from the primary, which has already applied 41;
2. use a replica only after it has applied at least 41;
3. wait for that replica up to a deadline, then fall back to the primary or report that the read cannot yet be satisfied.

Sending the request to a random replica is not an honest fourth action. A copy at position 40 can correctly report that booking 301 is absent from *its current state*, even though the write succeeded on the primary.

This promise is called **read-your-writes**: after the service confirms Ada’s write, Ada’s later reads do not go backwards past that write. It does not promise that every user sees every latest write. It also does not prove that booking 301 survives loss of the primary; durability during failover is a separate promise tested later in the course.

## The analogy

Ada hands form 301 to the main clerk. The clerk stamps it and gives her a receipt marked 41. A second clerk’s folder is updated by courier and still ends at 40. When Ada shows receipt 41, the desk must use the main folder or wait until the second folder reaches 41. Asking the second clerk without showing the receipt can produce an old but locally truthful answer.

## Run the stale read and both repairs

Two booking tables model the two database copies. A third table records the replica’s applied position. The browser does not run a replication engine; the explicit insert and state update together represent the replica applying position 41.

Before running, predict the four result tables:

1. What does the successful write return?
2. What does the replica return before applying 41?
3. What does the primary return for Ada’s read?
4. What does the replica return after applying 41?

```sql run
CREATE TABLE primary_bookings (
  id INTEGER PRIMARY KEY, owner TEXT, space TEXT, write_position INTEGER
);
CREATE TABLE replica_bookings (
  id INTEGER PRIMARY KEY, owner TEXT, space TEXT, write_position INTEGER
);
CREATE TABLE replica_state (applied_position INTEGER NOT NULL);
INSERT INTO replica_state VALUES (40);

INSERT INTO primary_bookings VALUES (301, 'Ada', 'B12', 41);

-- Result 1: the committed result returned to Ada
SELECT id, write_position FROM primary_bookings WHERE id = 301;

-- Result 2: a replica still applied only through position 40
WITH request(required_position) AS (VALUES (41))
SELECT b.id
FROM replica_bookings b, replica_state s, request r
WHERE b.id = 301 AND s.applied_position >= r.required_position;

-- Result 3: route read-after-41 to the primary
SELECT id FROM primary_bookings
WHERE id = 301;

-- The replica now applies the change at position 41.
INSERT INTO replica_bookings
SELECT * FROM primary_bookings WHERE write_position = 41;
UPDATE replica_state SET applied_position = 41;

-- Result 4: the caught-up replica may answer
WITH request(required_position) AS (VALUES (41))
SELECT b.id
FROM replica_bookings b, replica_state s, request r
WHERE b.id = 301 AND s.applied_position >= r.required_position;
```

The results are booking 301 with position 41, no row, booking 301, and booking 301. The empty second result is the failure Ada observed. The third and fourth results demonstrate the two repair routes.

### Failure: wait forever for one replica

Waiting for position 41 without a deadline can turn one slow or disconnected replica into a request that never finishes.

Use a deadline. When it expires, either route to an eligible source such as the primary or return a deliberate retryable response. Record how often reads wait, fall back or fail. A position is evidence that one copy is far enough along; it is not permission to show another owner’s booking, so the normal ownership check remains required.

## Go deeper: How old is a three-second-old saved map answer?

A dependent read is a read whose acceptable answer depends on an earlier write in the same user journey. Ada’s dependent read must include her confirmed booking. A public map can make a different promise: its information may be old, but never by more than thirty seconds.

A **map cache** keeps a map answer so another request can reuse it without repeating the original work. A **freshness limit** is the greatest allowed age of that information when the driver receives it.

```diagram freshness
```

The source observed one free space at second 92. The map cache copied that reading at second 100 and served it at second 115:

```text
information age = 115 - 92 = 23 seconds
time in this cache = 115 - 100 = 15 seconds
```

Only the first number tests the product promise. Copying the same observation again cannot restart its age. At second 125, a reading observed at 92 is thirty-three seconds old even if the latest cache copied it at 122.

### Reproduce the reset-timer failure

Before running the SQL, predict which policy displays information older than the thirty-second limit.

```sql run
CREATE TABLE map_entry (observed_second INTEGER, copied_second INTEGER);
INSERT INTO map_entry VALUES (92, 122);

WITH clock(now) AS (VALUES (125))
SELECT now - observed_second AS information_age,
       now - copied_second AS time_in_this_cache,
       CASE WHEN now - copied_second <= 30 THEN 'show' ELSE 'unknown' END
         AS copy_time_policy,
       CASE WHEN now - observed_second <= 30 THEN 'show' ELSE 'unknown' END
         AS observation_time_policy
FROM map_entry, clock;
```

The information is thirty-three seconds old after only three seconds in this cache. The copy-time policy shows it; the observation-time policy marks it unknown. Change 125 to 122 and then 123 to test the exact boundary.

The example assumes comparable clocks and a trustworthy observation time. If the source reports only when the cache fetched its response, the service lacks evidence for a source-to-screen age promise. Carry the original observation time—or a correctly maintained HTTP response age—through every layer, and return unknown or validate the answer when its total age crosses the limit.

- A reading was observed at 40, copied at 55 and served at 60. How old is its information?::5 seconds >> That measures only time in the latest cache. >> go-deeper-how-old-is-a-three-second-old-map-cache-entry||*20 seconds::Age starts at the observation.

## In practice: PostgreSQL positions

PostgreSQL calls a write position a log sequence number. On PostgreSQL 17, an application can carry a primary position and compare it with the standby’s last replayed position. PostgreSQL 19 adds a direct wait statement for a log position. The portable design rule is unchanged: the required position must be at or after the relevant commit, and the standby must replay through it before serving the dependent read.

Do not compare wall-clock timestamps to prove this ordering. Clocks can disagree, and “five milliseconds later” does not prove which database changes a replica has applied.

## Try it

1. Run the SQL and confirm that Result 2 has zero rows.
2. Move both replica-apply statements—the insert and the state update—above Result 2. Predict which result changes.
3. In Result 4, change the required position to 42 while the replica’s applied position remains at 41. Confirm that no row is returned and explain why that replica is not eligible.
4. Add Ben’s booking at position 42. Then add an owner filter that limits Ada’s reads to Ada’s rows and prove that her request cannot return Ben’s row.
5. Write a routing rule with a 200 ms deadline and name the metric emitted for wait, fallback and failure.

You have passed when you can reproduce the stale read, repair it by routing or waiting, and explain why read-your-writes is narrower than “every read is current”.

## Check yourself

- Ada’s write committed at 41. A replica has applied through 40. Can it satisfy her read-after-41 request?::Yes, because any confirmed write exists on every copy >> The replica has not applied that write. >> the-building-block||*No, because position 41 is missing there::The request needs another copy or must wait.
- Why send the write position with Ada’s next read?::To authorize access to every booking >> Position is not authorization. >> the-building-block||*To state the minimum applied change her read requires::The route can reject copies that are behind it.
- Does read-your-writes make every reader see the latest global state?::Yes, every replica becomes current immediately >> Other copies can still lag. >> the-building-block||*No, it prevents this client from going behind its confirmed write::The promise is scoped to Ada’s earlier write.

## Sources

- [PostgreSQL 17 · Log-shipping standby servers](https://www.postgresql.org/docs/17/warm-standby.html) — streaming replication is asynchronous by default, so a standby can temporarily omit a committed primary transaction.
- [PostgreSQL 17 · Recovery information functions](https://www.postgresql.org/docs/17/functions-admin.html#FUNCTIONS-RECOVERY-INFO-TABLE) — the replay position reports the last log location applied during recovery.
- [PostgreSQL 19 · Read-your-writes consistency](https://www.postgresql.org/docs/current/warm-standby.html#READ-YOUR-WRITES) — current PostgreSQL documents carrying a primary position and waiting for standby replay; the lesson labels the new direct wait syntax by version.
- [RFC 9111 · HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html#section-4.2.3) — response age includes age received from an earlier cache plus time resident in the current cache.

The example and client-facing contract are original. The separation between a client’s session guarantee and globally current reads follows the consistency-model treatment in *Designing Data-Intensive Applications*.
