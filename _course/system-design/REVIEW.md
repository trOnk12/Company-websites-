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
