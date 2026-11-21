# Compose Multiplatform review

The independent first pass checked observable reads, phase tracking, interop direction and iOS accessibility against Android and JetBrains documentation. Follow-up changes explain pixel units, distinguish creation and updates, and make the dependencies between puzzles explicit. Device VoiceOver validation remains a learner exercise for an iOS device.

| Date | Version | Lint | Scores | Found → changed |
|---|---|---|---|---|
| 2026-11-21 | Module 1 "Compose underneath" (puzzles 0–5) inserted before the bookmark module (now 6–9); ROADMAP.md | clean for compose | Fresh-learner, picture and expert passes not yet run (no reviewer agents in this session) | New puzzles: compiler plugin and Composer, composition and slot table, snapshot state and restart groups, skipping and stability, one frame, four layers. Drafts from backup/kmp-cmp-drafts reused after every quote was re-fetched; corrected "only Compose UI is per platform" (foundation has iOS code too). Old 00 rewritten as "deferring a read" (its tracked-state-read idea now lives in puzzle 2); old 01 now builds on puzzle 4's phases and gets a new diagram; 08/09 got tie-backs and analogies. Diagrams looked at in .shots/compose/strips: fixed overlapping labels in frame, stack and state-reads-and-ui. |
