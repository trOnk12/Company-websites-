---
name: course-author
description: Create or restructure course content for pachulski.dev/course (a module, a puzzle, a diagram, questions) from Mateusz's learning material. Use whenever he asks to add a module, turn a topic or a learning session into puzzles, or rework existing puzzles. Always finish with the course-clarity skill.
---

# /course-author — how every puzzle gets made

The course is an education platform, not a blog: a beginner must be able to start at puzzle 0 and
reach the end without outside help. Every rule below exists because a fresh-learner review caught it.
Source material: Mateusz's learn/ vault (the notes repository), his foundation-first-teaching playbook,
and primary sources (AOSP, Android docs, kernel docs).

## 0. The learner

A Kotlin developer who has built a simple Android app. Knows: the words in `glossary.json → baseline`.
Knows nothing about operating systems or Android internals. Every other word must be taught.

## 1. Concept map first (before writing any puzzle)

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
- Reuse the world's shapes (house, town hall, post office, clerk, letter, courier) so pictures connect.

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
- **Don't cite the source as a word** ("in the source…"): say what it is ("Android's code is public; in it…").

## 5. Facts

Verify every claim against a primary source in this session (fetch it, quote it). Code names that
point at real source go into `refs.json` with a pinned commit and real line numbers.

## 6. Ship it

```
npm run build:course
npm run lint:course        # must be clean
npm run shots:course       # look at .shots/<course>/sheet.png: nothing covered, nothing stranded
/course-clarity            # fresh learner ≥ 8/10 on every puzzle, zero undefined terms
npm run gifs:course
npm test
```
Then add a row to `_course/<course>/REVIEW.md`, commit and deploy. Note in the commit what the fresh
learner found and what changed.

Diagram gotchas: moving parts (`data-move`) must not carry the class `moving` (reduced-motion CSS hides
it); no inline `style` attributes (the CSP blocks them); a part that should vanish after its step uses
`only-N`, not `sN`.
