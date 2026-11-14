# Review log — Android from the foundation

Every course-clarity run adds a row: what changed, the lint result, and the fresh-learner scores
("a beginner can follow this without outside help", 1–10). Newest last. Pass bar: lint clean and every
puzzle ≥ 8.

| Date | Version | Lint | Fresh-learner scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-13 | v1: 7 puzzles, boxes-and-text diagrams | (lint didn't exist) | not scored | "process", "kernel", "page", "fork" never defined; puzzle 0 contradicted puzzle 5 (letter straight to the main thread vs Binder thread); 7 clashing analogies; strawman questions. → One world (house, town hall, post office, clerk), moving diagrams, misconception questions. |
| 2026-11-13 | v2: 7 puzzles rewritten | 65 → 0 (structure rules only) | 6 · 6 · 5 · 5 · 6 · 6 · 7 | Every subtitle used words explained later; "framework", "lifecycle", "permission", "driver", "the system" never taught; puzzles taught 7–8 concepts; answers copied from captions. → Glossary + vocabulary lint (36 problems found); course-author skill; module 1 rebuilt. |
| 2026-11-14 | v3: rebuilt, 16 puzzles in 3 modules | clean | 9 · 8 · 8 · 7 · 8 · 7 · 7 · 7 · 8 · 7 · 7 · 8 · 8 · 6 · 7 · 8 | "Linux", "service", "view" undefined; captions used terms the section below defined; P5 said "four characters" for five and hid its simplification; P11 seemed to contradict P0. → Linux taught in P1; captions define inline; P5 flags the simplification; P11 resolves sharing vs privacy. |
| 2026-11-14 | v4 | clean | 9 · 9 · 9 · 8 · 9 · 9 · 7 · 9 · 9 · 9 · 8 · 9 · 8 · 7.5 · 8 · 8 | "Linux user" read as the phone's user (clashes with P7); "buffer" undefined; "the system" as a vague actor. → Accounts vs people; buffer defined; system_server named everywhere. |
| 2026-11-14 | v5 (targeted re-review of P6, P13) | clean | P6: 9 · P13: 8 | All puzzles ≥ 8. → Avoid-list added to the lint ("the system", "views", "simply"…); shots:course for visual checks. |

## Known limits

- The fresh learner is an AI reading text; it doesn't see motion or timing. Real learners are the next
  check: GoatCounter events show which puzzles people finish and where they skip ahead.
- Wrong answers aren't counted per option yet, so we don't know which misconceptions real people hold.
