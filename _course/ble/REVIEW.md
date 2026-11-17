# Review log: Bluetooth Low Energy, from the radio up

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-16 | v1: module 1 (5 puzzles) | clean | text: 8 · 7 · 7 · 7 · 7 — pictures: 6 · 6 · 6 · 7 · 6 | Text: the phone "answered" an advertisement although nothing said the strap listens; "planned moments" (P0) vs a random delay (P1); GATT/UUID/CCCD never spelled out; the code used `gatt` and `characteristic` from nowhere. Pictures: messages without a visible sender; data channels drawn in advertising yellow; the notification shown before the switch. → The strap listens after advertising (Core Spec: "possibly listening to and responding to responses"); empty packets keep a quiet meeting (Core Spec "Empty PDU"); names spelled out, service discovery added, code shows where everything comes from; notify reordered (switch, then notification, then the bug). Not re-scored after these fixes. |
| 2026-11-17 | gap hunt (strict learner) | clean | see SPRINTS.md sprint 12 | Fixed now: accuracy and quiz bugs (listed in the sprint log). Still open: the missing building-block puzzles and splits in sprint 12. |
