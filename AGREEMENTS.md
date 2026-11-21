# Agreements with Mateusz (read this first in every new session)

Everything decided in conversation, so it isn't lost when a session ends. Sprint history and to-do lists live in
`SPRINTS.md`; how to write a puzzle lives in `.claude/skills/course-author` and `course-clarity`.

## Priorities (2026-11-18, in order)

1. **Kotlin Multiplatform, really deep.** Close every gap an Android engineer needs to ship KMP to iOS. New
   modules are appended after the existing ones (no renumbering). Plan: `SPRINTS.md` → Sprint 13.
2. **Compose Multiplatform**: a new course `_course/cmp/` that assumes the KMP course. Plan: Sprint 13.
3. iOS for Android developers (KMP needs it): five building blocks from the review, in Sprint 12/13.
4. **Bluetooth (BLE) is paused.** Its review findings stay in Sprint 12 for later.
5. Then **UX and UI designer reviews** of the course section, and the redesign. **Content first, UI after.**

## How we teach (non-negotiable)

- Write learner-facing tutorials, exercises, diagrams, quizzes and solutions in English.

- **Foundation first**, like mathematics: no concept is used before it's taught. Each puzzle has one core idea,
  a step-through diagram, an analogy, three checks, and sources with exact quotes that were fetched and verified.
- **The deeper the better**, through the **depth ladder**: the main path of a course must stand on its own; any
  block can open an optional, tracked, never-gating "Go deeper" floor (e.g. compiler → how compilers work,
  CPU → how a CPU runs instructions). Floors live in foundation courses ("Computers from the ground up",
  "How code becomes a program"). Design details: Sprint 13.
- **Strict-learner gap hunt** after every new module (fresh reviewer with the real learner profile): every word
  used before it's taught, every leap, missing puzzles, overloaded puzzles. Missing puzzles get written.
- **Lint must stay clean** (`node scripts/lint-course.js`); never weaken a rule to pass it. Words that slip through
  go into `_course/jargon.json`.
- Look at every new diagram (`node scripts/shoot-course.js <course>`, `.shots/<course>/strips/`): no overlaps.

## The learner's experience (goals for the UX/UI pass)

- "As easy as possible to follow", **track progress**, and a **better overview of the courses** (path across
  courses, what's next, how deep you've gone). Mateusz feels it's "not great yet" and "not beautiful yet".
- Progress is saved **by puzzle slug** in the browser (`course:<id>:done`), with export/import on
  "Your learning"; old numeric saves migrate through `_course/progress-legacy.json`. **Before renumbering any
  course, add its current order to that file** if it isn't there.

## Music section

- Mateusz's hobby; sketchbook / hand-drawn look with watercolour colours (he liked it; not AI-generic).
- Devices are drawn from real panels via `scripts/devices.js` (PERfourMER MKII, Grand Canyon, NightSky,
  OXI One MKII, Digitone II): reuse these models for any future tutorial and animation.
- Digitone/FM content follows the `synth-tutorial-builder` skill: every value checked against the manual,
  ≈ marks starting points, and a separate manual review before publishing.

## Working rules

- Work in sprints: plan → build → review → fix → ship → log (`SPRINTS.md`, each course's `REVIEW.md`).
- Deploy = push to the session branch and to `main` (Mateusz authorised merging without waiting).
- **Use tokens well:** at most two content agents at a time, each in its own course folder (never two in one
  course: renumbering collides); reviews are read-only and run after content. Agents don't commit; the main
  session integrates, runs the full tests, and deploys.
- No employer details on the public site (check `_learning/.private-terms`); no personal data in requests to
  outside services; LinkedIn posts are drafts only.
- Analytics: GoatCounter, cookie-free, counts only on pachulski.dev. **Mateusz still has to create the
  "pachulski" account.** Pending decision: Kotlin Playground for runnable snippets (sends code to kotlinlang.org).
