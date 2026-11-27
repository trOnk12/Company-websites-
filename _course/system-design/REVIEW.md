# Distributed system design review

## 22 November 2026 · Course entry

Mateusz reported that the opening puzzles used vague language, introduced unfamiliar words before explaining them and left the first SQL example unclear.

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 00 | The first practice combined the booking rule, grouping, counts and SQL setup. The separate race also switched from B12 to interchangeable spaces. | Read two bookings by hand, then open an optional query with one filter. Change one space to isolate the result. Explain how the race counts accepted bookings. |
| 01 | The text switched between map reads and map requests. The storage extension assumed terms the main path had not covered. | Keep one name for the phone’s request, calculate the busy interval explicitly and use a hand tally before the optional code. |
| 02 | The title promised a winner, while the lesson demonstrated finding the saved result. The old code heading suggested a process restart. | Put reference 17 in the first request, follow the saved row across a lost reply, and describe the Python fixture as two connections. |
| 03 | The diagram assumed transaction vocabulary before it appeared in the text. | Explain transactions, the lock and both endings before the diagram. Ask the learner to distinguish a row containing zero from an update returning no rows. |

The fresh learner could answer all checks from the main path and identified the gaps above. The technical reviewer ran both inputs for each of the four code examples. The review covers puzzles 00–03. Later puzzles still need the same pass.

## 23 November 2026 · Lost reply and retry identity

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 04 | The lesson began with “stable identity”, “intention”, “arbitrates” and a large SQL block. It did not first show why one tap can become two bookings, and it used the word “idempotent” only indirectly. | Follow one tap and ID 17 through a lost reply. Compare four inputs in a table, show the duplicate-booking failure before the fix, name idempotency only after the behavior is visible, explain the handler line by line and move the minimal SQL proof into optional depth. |

Course lint passed. The targeted fresh learner scored the revision 8/10, answered all three checks with high confidence and found the simultaneous path causally complete. The four-frame diagram scored 8/10 in the visual pass: each frame changes visibly, the lost reply and same-ID retry remain readable, and no label is clipped. The correctness review first caught two real defects—the losing transaction was not implemented and the request ID was claimed after taking inventory. After the request row moved before booking creation, the reviewer passed the race, rollback, crash-recovery, retention, SQL and quiz claims with no blocker or major finding. The browser SQL check passed on desktop, iPhone-sized and Android-sized Chromium. Lessons 05 onward still require the same plain-language pass.

## 23 November 2026 · One exact position in history

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 05 | Cursor correctness, tuple comparison, indexing and query plans arrived in one dense block. The reader met database vocabulary before seeing the single page boundary it was meant to preserve. | Start with page one `9, 8`, insert session 10, and require page two to contain 7 without a repeat. Define a cursor before SQL, expand the two-field comparison into plain rules, explain the query line by line, and move index and plan work into optional depth. Keep the mutable-sort-field failure and add an explicit pass criterion. |

The fresh learner scored the final main path 9/10 and correctly predicted all three pages without reading the SQL result first. The visual review found no blocker or major issue on desktop or a 390 px phone; its wording correction now says the cursor value stays fixed while its record shifts on screen. The two SQL variants passed on all three Chromium profiles. The wider course and lesson-SQL run passed all 738 cases on desktop, iPhone-sized and Android-sized Chromium. Course clarity lint, both builds, 333-page/135-topic link verification and the 20,000-row Python measurement also passed. Lesson 06 onward still requires the same plain-language pass.

## 25 November 2026 · Read your confirmed write

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 06 | The old lesson mixed replica delay and cache age before showing how one confirmed booking could disappear. Its SQL measured cache age but did not let the learner reproduce a dependent read. The first revision also compared the required position with a row version instead of the replica's applied position. | Follow booking 301 from a primary at position 41 to a replica at 40. Carry `readAfter: 41`, choose primary, caught-up replica or bounded wait plus fallback, and keep failover durability separate. The runnable SQL now has a separate replica applied-position state; moving both apply statements repairs the read. Cache age remains optional depth and keeps the original observation time. |

The fresh-learner review passed after definitions moved before the diagram, the dependent-read term was explained, the ownership task became explicit and only the first of two diagrams received the lesson prediction. The correctness review passed the final primary/replica model, position gate, PostgreSQL version notes, routing choices and cache boundary. Course clarity lint, repeatable course/learning builds and the 333-page/135-topic link check passed. The two SQL programs were also executed directly with the vendored SQLite engine: the dependent read returned empty before replay, booking 301 after replay, and empty again when the required position was 42; the cache policies returned `show` versus `unknown` at age 33. After deployment, the public desktop render showed all four diagram states without the old overlap, and its browser SQL returned 1/0/1/1 rows by default and 1/0/1/0 when Result 4 required position 42. A fresh mobile screenshot remains unclaimed because the local Chromium payload was missing and the permitted browser download returned HTTP 403. Lesson 07 onward still requires the same plain-language pass.

## 25 November 2026 · One event through both crash windows

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 07 | The old lesson split the sender and consumer into “first puzzle” and “second puzzle”, introduced relay/consumer/trigger vocabulary before one complete trace and did not show the relay's unknown outcome. Its first revision also treated a dashboard commit as the acknowledgement behind a generic Kafka-style `published` marker. | Follow booking 301 and event 41 through one sender transaction, a direct dashboard acknowledgement lost before the sent mark, and a replacement delivery that adds zero rows. Define relay and consumer effect before use. Keep the two-commit failure and out-of-order state as optional depth. Explicitly separate direct receiver acknowledgement from Kafka broker acknowledgement and the consumer's own effect/position boundary. |

The fresh learner passed the final render and could predict every stored state, explain why delivery repeats and distinguish one consumer effect from exactly-once network delivery. The correctness review passed after the direct/Kafka acknowledgement distinction, authoritative per-booking version rule and two missing failure tests were added. The vendored SQLite engine produced `(1,1)`, `(1,1)`, `(0,1)`, `(1,1)` for the main trace; without conflict handling it raised a uniqueness error; the sender variants produced zero/zero after rollback, one/one after commit and one/zero for the broken boundary. Course clarity lint, repeatable builds and the 333-page/135-topic link check passed. The public browser reproduced the default trace, the premature-published state with one published marker and zero dashboard rows, and the uniqueness error without conflict handling. Its visual pass found and fixed a clipped Dashboard heading. Lesson 08 onward still requires the same plain-language pass.

## 25 November 2026 · One queue through overload and recovery

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 08 | The old lesson mixed an unlimited queue, a bounded queue, rate limiting and deadline admission without one continuous trace. Its first rewrite also said no capacity served old work, hid repeated assumptions inside recursive SQL and showed second 15 without proving it was the first full second. | Follow one 300-place queue from 120 arrivals/s through refusal and recovery. Count retries as arrivals, distinguish ongoing completions from zero net backlog drain, keep every model assumption in one parameters row, explain one repeated simulation step and query the earliest full second. Keep deadline admission as optional depth. |

The fresh-learner and technical reviews passed after the corrections. The vendored SQLite engine reproduced 300 queued and 900 refused at second 60, drainage to zero at second 75 without retries and a queue still at 300 at second 120 with 20 retries/s. Ending retries at second 70 produced 200 queued at second 75 and zero at second 120. Raising retries to 21/s added one refusal per recovery second; shortening the queue to 100 increased total refusals while reducing its drain time. Course clarity lint, repeatable builds and the 333-page/135-topic link check passed. Browser execution is recorded separately after deployment. Lesson 09 onward still requires the same plain-language pass.

## 26 November 2026 · One hot lot across sixteen owners

| Lesson | What the review found | Revision |
| --- | --- | --- |
| 09 | The old lesson mixed table partitioning, distributed storage, hot keys, rights transfer, live movement and rendezvous hashing. The first rewrite also asked for a routing prediction before stating the rule and implied that request routing alone created duplicate state. | Follow one fixed workload: 1,000 equal-cost writes, including 700 for west, across sixteen owners of capacity 100. State the same-lot routing rule before prediction, calculate the hot owner's 600/s queue growth, and separately demonstrate the extra independent-copy assumption that makes balanced request routing unsafe. Keep PostgreSQL table pieces and local rights as explicit optional depth. |

The fresh learner scored the final lesson 9/10 and answered all three main checks with high confidence. The expert review first caught an assertion that blocked the repair mutation and incomplete transfer accounting; both were corrected, and the final review passed. The visual review first found stale hot-owner bars and a moving marker covering the duplicate state; the final four-state diagram scored 9/10 after isolating the final state and moving a stable west marker beside the bars. The Python fixture and nine automated runs reproduce 700/600, 63 and two unsafe grants by default; 32 owners leave west at 700; 100 west writes remove its overload; routing both last-space requests to the lot owner yields one grant. Clarity lint, repeatable builds and the 333-page/135-topic link check passed. Public verification after `dd034ca` confirmed the rewritten lesson and runnable output at the existing URL, all four mutually replacing diagram states and no desktop document or SVG-label overflow. Lesson 10 onward still requires the same plain-language pass.
