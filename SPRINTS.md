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
- [x] Review round (text 6–8, pictures 5–7): actor reentrancy, await, background sessions fixed with sources.

## Backlog, in order

1. **Sprint 6: KMP module 2 + Compose Multiplatform.** Kotlin/Native memory (a tracing GC meets ARC, from the iOS
   course), coroutines and threads on iOS, shipping one framework; then what Compose Multiplatform shares, how it
   draws on iOS (one canvas), touch and text input. Update the skills after.
2. **Sprint 7: Take it with you.**
   - Obsidian export per course: one note per puzzle, `[[links]]` for its building blocks (Obsidian's graph view
     becomes the course's knowledge map), flashcards in the Spaced Repetition plugin's `Question::Answer` format.
   - "Continue with Claude": a button that copies a prompt with the course glossary, the puzzles you passed,
     your weak spots (from your own wrong answers), and the foundation-first teaching rules, so Claude carries on
     as a tutor from exactly where you stopped.
3. **Sprint 8: Performance, under the hood.** "What the profiler is really showing you": a CPU sample vs a trace,
   main-thread slices in Perfetto, GC pauses and allocation cost, heap dumps and leaks, the frame timeline
   (Choreographer → RenderThread → SurfaceFlinger), Macrobenchmark and Baseline Profiles. Notes: AND02, AND06,
   AND08, H03, H09, L13. Builds on the Android course (frames, ART, Binder).
4. **Sprint 9: LLMs for mobile engineers.** What happens when your app calls a model: tokens, the context window,
   prefill vs decode (time to first token vs tokens per second), the KV cache, streaming and cancellation in the
   UI, cost, on-device models. Notes: the AI and AI-engineering tracks.
5. **Encryption module 2.** Keys on the phone: Android Keystore, encrypted storage, pinning.
6. **BLE module 2, fast and reliable.** MTU and the 20-byte payload, Data Length Extension, 2M PHY, throughput math;
   Android's one-GATT-operation-at-a-time rule and status 133.
7. **Android module 4, continued.** Context and why it leaks; tasks and the back stack.
8. **The map.** One page per course drawing the blocks as a graph, coloured by what you've passed.
9. **Quiz quality.** Done in part: two new lint rules (no "X; Y" shape only on the right answer, no "Because" only on the wrong ones; 64 questions fixed). Still: the right answer is the longest option too often.
10. **Later:** system design, data structures, as the sessions behind them land in the notes repo.

## Why these, for whom

Anthropic's own posts explain AI very well, once, for reading. What this site adds: a path with no gaps (building
blocks, mastery checks, test-out), the mobile engineer's angle across platforms (Android ↔ iOS ↔ KMP, block by
block), every fact proved from source code or a spec, and material you can take with you (Obsidian, flashcards, a
Claude tutor that knows what you've passed). And it improves from real learners: anonymous wrong-answer counts
show which puzzle is broken.
