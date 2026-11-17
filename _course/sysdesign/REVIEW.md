# Review log: Mobile system design, from a packet to an app

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-17 | v1: module 1 (6 puzzles) | clean | correctness/clarity: 6/8 · 9/9 · 7/8 · 9/9 · 8/9 · 8.5/9 (one combined interviewer + learner reviewer); pictures checked from the contact sheet | P0's scenario made every request depend on the last, so "send them together" couldn't help; a 3G tail figure presented as LTE; "same energy" overstated; last-write-wins without its caveat; idempotency keys without parameter checks and expiry; no retry rules (cap, which errors, Retry-After); no-cache vs no-store; newBuilder() sharing the pool. → All fixed with sources. Missing block for module 2: push vs polling (FCM, WebSocket/SSE), pagination. Not re-scored after these fixes. |
