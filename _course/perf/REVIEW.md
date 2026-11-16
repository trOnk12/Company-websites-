# Review log: Performance, under the hood

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-16 | v1: module 1 (6 puzzles) | clean | correctness/clarity: 7/8 · 6/8 · 9/8 · 9/8 · 7/8 · 9/9 (one combined expert + learner reviewer); pictures checked from the contact sheet | Android Studio's flame chart is drawn upside down (callers at the bottom); the sampling rate was off ~100× (about 4,000 samples per second of CPU, not every few thousand cycles); sampling only sees on-CPU time; the newer Concurrent Mark-Compact collector unmentioned; "TLAB full" vs heap full; one Actual slice per frame, not two; Buffer Stuffing wording; bitmap pixels are native memory. → All fixed; diagrams re-laid out. Not re-scored after these fixes. |
