# Review log: iOS for Android developers

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-16 | v1: module 1 (5 puzzles) | clean | text: 6 · 8 · 7 · 6 · 8 — pictures: 6 · 6 · 7 · 5 · 6 | Correctness: actors are reentrant at await (the Swift book: "that code can be interrupted only in places where await marks a suspension point"); await frees the thread but moves no work; a background session keeps transfers going while suspended ("transfers continue even when the app itself is suspended or terminated"); beginBackgroundTask asks for more time; "every thread has a run loop" → can have one. → All fixed with sources; ARC scoped to class instances; closure cycles only with strong capture. |
| 2026-11-17 | gap hunt (strict learner) | clean | see SPRINTS.md sprint 12 | Fixed now: accuracy and quiz bugs (listed in the sprint log). Still open: the missing building-block puzzles and splits in sprint 12. |
