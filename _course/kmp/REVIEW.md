# Review log: Kotlin Multiplatform, from the compiler up

Every course-clarity run adds a row. Pass bar: lint clean, every puzzle and diagram at least 8.

| Date | Version | Lint | Scores | What the review found → what changed |
|---|---|---|---|---|
| 2026-11-16 | v1: module 1 (5 puzzles) | clean | text: 7 · 7 · 8 · 7 · 6 — pictures: 7 · 7 · 6 · 7 · 6 | "Target" used before defined; Android vs JVM unclear; no Gradle anchor; Xcode, await/async and "checked" never explained; the working @Throws path never shown. → Target defined in the step; ART as the JVM's cousin; source sets tied to Gradle folders; Xcode, async/await (Swift converts completion handlers itself) and checked errors explained; a "with @Throws" row in the diagram; java.io.File leaves common code in the fix step. Not re-scored after these fixes. |
| 2026-11-16 | v2: module 2 (puzzles 5–9) | clean | correctness/clarity: 9/9 · 7/8 · 8/8 · 8/9 · 6/7 (one combined expert + learner reviewer); pictures checked from the contact sheet | Text input promised but never explained; "a native text field can't be drawn" (Compose's TextField works); UIKitView placement overstated; `scope.close()` doesn't exist; Swift doesn't drop the result, it keeps waiting; `internal` confused with export; `remember` listed in the wrong layer; no `[weak self]`. → All fixed; diagrams re-laid out (labels overflowing boxes, the dot covering text, the red link still drawn after the weak fix). Not re-scored after these fixes. |
