---
name: course-author
description: Create or restructure course content for pachulski.dev/course (a module, a puzzle, a diagram, questions) from Mateusz's learning material. Use whenever he asks to add a module, turn a topic or a learning session into puzzles, or rework existing puzzles. Always finish with the course-clarity skill.
---

# /course-author — how every puzzle gets made

The course is an education platform, not a blog: a beginner must be able to start at puzzle 0 and
reach the end without outside help. Every rule below exists because a fresh-learner review caught it.
Source material: Mateusz's learn/ vault (the notes repository), his foundation-first-teaching playbook,
and primary sources (AOSP, Android docs, kernel docs).

## Courses

Each course is a folder `_course/<id>/` (`course.json`, `glossary.json`, `refs.json`, `REVIEW.md`, puzzles,
`diagrams/`), built to `course/<id>/` with its own overview; `/course/` lists every course as a card.
Courses on the way go in `_course/catalog.json` (give the entry an `id` so it disappears once the course
is live). A book Mateusz owns goes through `/book-to-course` instead (private by default).

## 0. The learner

A Kotlin developer who has built a simple Android app. Knows: the words in `glossary.json → baseline`.
Knows nothing about operating systems or Android internals. Every other word must be taught.

## 1. Concept map first (before writing any puzzle)

The glossary is also the course's dependency graph: every puzzle's "Builds on" panel and the overview's
"Builds on 4, 6" are computed from which earlier terms it uses (`blocks()` in `lint-course.js`). So a
puzzle that builds on many blocks is a warning: it's probably two puzzles. Aim for one or two direct
blocks per puzzle; check the graph with
`node -e "console.log(require('./scripts/lint-course').blocks('<course>'))"`.


Write the module's concepts into `_course/<course>/glossary.json` **before** writing text:
- one entry per term: `in` (the puzzle that teaches it), `def` (one plain sentence), `aliases`,
  `kind: "code"` for code names (they don't count as concepts, but must still be introduced in the body);
- order them so each concept only needs earlier ones. If a definition needs a word that isn't taught yet,
  teach that word first (a new, smaller puzzle is fine);
- **at most 6 new concepts per puzzle; aim for 3–4.** A big topic becomes several puzzles.

## 2. The puzzle (`_course/<course>/NN-slug.md`)

Frontmatter: `title` (may name the new topic), `short`, `summary` (**only already-taught words**),
`takeaway`. Sections, in order:

1. **The problem**: first line ties back to the previous puzzle; then what breaks without this mechanism.
   Plain words only.
2. **See it**: the diagram (`diagram name` block). The picture is where new terms are met.
3. **The building block**: the mechanism, one new term at a time, each **bold where it's defined**.
   Every limit gets its reason (why 1 MB, why one thread).
4. **The analogy**: only the course world (house, town hall, post office, clerk, courier). No new worlds.
5. Optional **In practice** / source code names (they get popovers from `refs.json`).
6. **Check yourself**: 3 questions, see §4.
7. **Sources**: primary sources you actually read this session for every claim.

## 3. The diagram (`_course/<course>/diagrams/name.html`)

- One `<svg viewBox="0 0 640 380">` and `<ol class="caps">`, 3–6 steps.
- **Show, don't write**: things move (`data-move="step:x,y …"`), appear (`class="step sN"`) or pulse
  (`data-pulse`). At most 12 words of labels per step; the caption names what the picture shows.
- Each step introduces at most one new term, **bold in that step's caption**.
- At least one caption asks the reader to *Predict* the next step.
- **Draw with the shared shapes, never by hand** (`scripts/course-shapes.js`, expanded at build time):
  `<x-ground y label="kernel"/>`, `<x-house x y w h label/>`, `<x-townhall x y w h/>` (system_server),
  `<x-postoffice x y w h label="" flag="0"/>` (Binder, in the ground), `<x-person x y desk="1" label/>`
  (a thread; desk = the main thread), `<x-machine x y w label/>` (a program such as ART or dex2oat: never a
  person), `<x-letter x y label tone/>`, `<x-chip/>`, `<x-sheet/>`, `<x-arrow d tone="path|acc|red"/>`,
  `<x-sun/>`, `<x-moon/>`. The radio world (Bluetooth course): `<x-phone x y w h label/>`,
  `<x-sensor x y w h label/>`, `<x-waves x y dir/>`, `<x-battery x y level label/>`,
  `<x-cabinet x y w drawers label/>` (GATT). Any `class`/`data-*` passes through, so `class="step s2"`
  and `data-move` work. A new course picks one world and keeps it; add shapes to `course-shapes.js`
  rather than drawing by hand.
- **The world's rules** (each one cost a picture review): houses stand on the kernel ground (from puzzle 1 on;
  puzzle 0's ground has no label); every message after puzzle 4 travels **through the post office**, with a
  dotted arrow; people are threads and never leave their house; programs are machines; doors only where a
  door matters.
- **Every step changes something visible**; old arrows leave (`only-N`), parts that are done leave (`hide-N`:
  `class="step s2 hide-4"` = visible in steps 2–3). Show the change instead of labelling it (a pile that grows,
  a clock hand that moves, the clerk holding the letter).

## 4. Questions

`Question::*Right||Wrong >> the misconception behind it >> s3||…::Why the right one is right`
- One **prediction** about a situation the page didn't show, one **why**, one **look-alike** (two
  terms the learner could confuse). Never a sentence copied from a caption.
- Every wrong option is a misconception a real learner holds, named in its feedback, with a pointer
  (`sN` = diagram step, or a section id) to where it's fixed.
- Only taught words, in the question and in every option.

## 4b. Lessons the reviews taught (each one cost a review round)

- **Define a term where the learner meets it.** If a caption shows it before the building block explains
  it, the caption defines it inline ("a **driver**, a part of the kernel that does one job").
- **One word, one meaning.** A taught word never gets a second sense: "user" (Linux account vs the person),
  "hot" (hot code vs hot start), "Activity" (screen vs the class): say which one, or pick another word.
- **Name the actor.** Never "the system", "Android decides": say system_server, the kernel, or Binder.
  The avoid list in glossary.json enforces the worst offenders.
- **Count what you list.** "The four characters" followed by five broke trust in a whole puzzle.
- **Flag every simplification** where it's made, with the puzzle that gives the full picture.
- **Resolve apparent contradictions out loud** (shared pages vs "processes can't touch each other's
  memory"). A careful learner will notice; say why both are true.
- **Predict, then reveal in the next step.** A caption that asks "Predict…" and answers in the same
  breath gives the learner no time to think.
- **Every right answer has a sentence on the page behind it.** If the learner has to guess "why", the
  page is missing that sentence.
- **A word defined but never used again is noise** ("transaction"): use it, or cut it.
- **Split a step that packs several ideas** (accounts, then UIDs, then the key) into one step each.
- **A later puzzle must not quietly contradict an earlier one.** "A ViewModel lives as long as the screen"
  broke "a screen is an Activity" (P3); say how both are true, in the later puzzle, where it happens.
- **Don't point at a puzzle for something it never said** ("objects live in memory (puzzle 0)").
- **No promises to puzzles that don't exist** ("the next puzzle shows…"): say "coming soon" or cut it.
- **A question's scenario must be possible with what the page taught** (no tapping a screen that's still in
  `onCreate()`; no permission check on the wrong app). Check every right answer has a sentence behind it.
- **Tables are allowed** in the building block (`| a | b |`): use one when the lesson is a comparison
  ("what survives what").
- **Don't cite the source as a word** ("in the source…"): say what it is ("Android's code is public; in it…").

- **A summary may only promise what the body delivers.** "Why text input needs a bridge" with no sentence on
  text input cost a point; check every promise in `summary`/`takeaway` against the building block.
- **Name real APIs exactly.** `scope.close()` doesn't exist (`cancel()` does): a code label in a diagram is a
  claim like any other, so check it against the API docs.
- **Don't overstate the failure.** "Its result goes nowhere" was wrong: Swift kept waiting. Say exactly what
  happens, not the dramatic version.
- **Keep layers clean.** When a puzzle sorts things into layers, every example must sit in the right one
  (`remember` is runtime, not ui), and don't mix two mechanisms (Kotlin `internal` vs framework export).
- **Show the one line of syntax** a newcomer would need to apply the fix (`[weak self]`, `export(project(...))`).
- **Numbers need a source too.** "Every few thousand cycles" was off by ~100×: quote the default (simpleperf's
  4,000 samples per second) or don't give a number.
- **Draw the tool the way the tool draws it.** Android Studio's flame chart has callers at the bottom; a diagram
  that flips it teaches the learner to misread the real screen.
- **Check for a newer default.** Docs pages lag (ART's newer collector isn't on the GC page): say "the default since
  X, newer devices may run Y" rather than "today's".

## 4c. Vocabulary honesty (the KMP lesson)

The KMP course read as "skipping lots of details": puzzle 5 used heap, roots, strong reference, `deinit` and
"the iOS course, puzzle 4" as if known. They passed the lint because they'd been added to `baseline` to silence it.
So:

- **`baseline` is only for words a beginner of this course really knows** (Kotlin, app, screen, phone). Never add a
  word to it to make the lint pass. If the lint flags a word, either teach it (glossary `terms`, bold where first used),
  link it (glossary `from`: `{"ARC": {"course": "ios", "in": 4}}`, rendered as a "New to these?" link on the puzzle),
  or say it in plain words.
- **`_course/jargon.json`** lists words that always need teaching. The lint rejects them in any `baseline`, and flags
  them in text unless taught or linked. When a review finds a new slipped word, add it there.
- **A cross-course reference is not a definition.** "(the iOS course, puzzle 4)" helps only someone who took it. The
  puzzle must still say, in one sentence, what the idea is; the `from` link is for depth.
- **One big idea per puzzle.** If explaining a puzzle's idea needs another idea the course hasn't given (tracing GC needs
  "roots"; GC vs ARC needs both), that other idea is a puzzle of its own, before it. Add the puzzle; don't compress it
  into a clause.
- **Ask the reviewer the owner's question.** Every review round includes a strict learner pass with the course's real
  learner profile (what they know, what they've never touched, and which other courses they have NOT taken), asking
  for undefined concepts, leaps and missing puzzles, not only clarity scores.

## 5. Facts

Verify every claim against a primary source in this session (fetch it, quote it) before writing the
puzzle, not after: gather the quotes first into the scratchpad, then write only what they support. Code names that
point at real source go into `refs.json` with a pinned commit and real line numbers.

## 6. Ship it

```
npm run build:course
npm run lint:course        # must be clean
npm run shots:course       # look at .shots/<course>/sheet.png and strips/: nothing covered, nothing stranded
/course-clarity            # fresh learner ≥ 8/10 on every puzzle, zero undefined terms
npm run gifs:course
npm test
```
Then add a row to `_course/<course>/REVIEW.md`, commit and deploy. Note in the commit what the fresh
learner found and what changed.

Diagram gotchas: moving parts (`data-move`) must not carry the class `moving` (reduced-motion CSS hides
it); no inline `style` attributes (the CSP blocks them); a part that should vanish after its step uses
`only-N`, not `sN`.
