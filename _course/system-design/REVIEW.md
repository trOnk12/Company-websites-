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
