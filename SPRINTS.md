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

## Sprint 2: Test out of a module (done 2026-11-16)

- [x] `check-N.html` per module: one question per puzzle; a right answer marks that puzzle passed, a wrong
  one names the puzzle to start with. Linked from each module on the overview ("Know this already?").
- [x] Test: the check marks passes and the overview shows the first missed puzzle as next.

## Sprint 3: Kotlin Multiplatform, module 1 (done 2026-11-16)

- [x] Course "Kotlin Multiplatform, from the compiler up": targets, source sets, expect/actual, the framework and its
  Objective-C header, what's lost in translation. Facts from kotlinlang.org, quoted.
- [x] Review round (text 6–8, pictures 6–7) and fixes. Re-score next sprint.

## Sprint 4: Encryption, module 1 (done 2026-11-16)

- [x] Course "Encryption, from the ground up": read/change/pretend, AES, key exchange, hashes, signatures and
  certificates, TLS. Facts from RFC 8446, NIST FIPS 197 and FIPS 180-4, quoted.
- [x] Review round (text 5–8, pictures 4–8): correctness fixes to TLS order, AEAD, signatures, AES modes. Re-review running.

## Sprint 5: iOS for Android developers, module 1 (done 2026-11-16)

- [x] Course "iOS for Android developers": suspended apps, the run loop, GCD, async/await and the main actor, ARC.
  Each puzzle starts from the Android block. Facts from Apple's documentation and the Swift book, quoted.
- [x] Cross-course building blocks: a puzzle that builds on another course says so, with a link.
- [ ] Review round (running) and fixes.

## Backlog, in order

2. **Sprint 6: KMP module 2 + Compose Multiplatform.** Kotlin/Native memory (GC meets ARC), coroutines on iOS,
   then what Compose Multiplatform shares and how it draws on iOS.
3. **Sprint 7: Encryption module 2.** Keys on the phone: Android Keystore, encrypted storage, pinning.
4. **BLE module 2, fast and reliable.** MTU and the 20-byte payload, Data Length Extension,
   2M PHY, throughput math; Android's one-GATT-operation-at-a-time rule and status 133.
5. **Android module 4, continued.** Context and why it leaks; tasks and the back stack.
6. **The map.** One page per course drawing the blocks as a graph (puzzles as nodes, "builds
   on" as edges), coloured by what you've passed.
7. **Quiz quality.** The right answer is still the longest option in 48 of 75 questions
   (chance would be ~30): rewrite until it's near chance, and add the lint threshold.
8. **Later:** courses from the catalog (system design, LLMs and agents, KMP/iOS), as the sessions
   behind them land in the notes repo.
