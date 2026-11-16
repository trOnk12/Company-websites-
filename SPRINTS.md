# Sprints: pachulski.dev courses

How we work: short sprints, each with one goal. Every sprint runs the same loop:

**plan → build → check (lint, tests) → review (fresh learner + picture reviewer) → fix → ship → log**

## Definition of done (every sprint)

- `npm run lint:course` clean; `npm test` green.
- Fresh-learner review: every new or changed puzzle ≥ 8/10, no unsupported answers, no contradictions across puzzles.
- Picture review: every new or changed diagram ≥ 8/10.
- Facts checked against a primary source, quoted under "Sources".
- Scores and findings logged in the course's `REVIEW.md`; this file updated (done / next).
- Deployed, and the live URL checked.

## The principle every sprint serves

Deep content, built from small blocks, like mathematics: no idea before the ideas it stands on.
Every puzzle shows its **building blocks** (computed from the glossary, so they can't go stale) and the
shortest path to it from zero. Beginners walk the chain; people who know the basics jump in and check
only the blocks they're missing.

## Sprint 1: Building blocks (done 2026-11-16)

- [x] Compute each puzzle's direct building blocks from the glossary (`blocks()` in `lint-course.js`).
- [x] "Builds on" panel on every puzzle: each block's takeaway, ✓ when passed, the path from zero.
- [x] Overview: "Builds on 4, 6" under every puzzle.
- [ ] Review round on the 47 rewritten quiz questions and the BLE fixes (running).

## Backlog, in order

1. **Sprint 2: Test out of a module.** A short check per module (one question per puzzle) that marks the
   puzzles you already know as passed, so experts jump in without walking the chain.
2. **Sprint 3: BLE module 2, fast and reliable.** MTU and the 20-byte payload, Data Length Extension,
   2M PHY, throughput math; Android's one-GATT-operation-at-a-time rule and status 133.
3. **Sprint 4: Android module 4, continued.** Context and why it leaks; tasks and the back stack.
4. **Sprint 5: The map.** One page per course drawing the blocks as a graph (puzzles as nodes, "builds
   on" as edges), coloured by what you've passed.
5. **Sprint 6: Quiz quality.** The right answer is still the longest option in 48 of 75 questions
   (chance would be ~30): rewrite until it's near chance, and add the lint threshold.
6. **Later:** courses from the catalog (system design, LLMs and agents, KMP/iOS), as the sessions
   behind them land in the notes repo.
