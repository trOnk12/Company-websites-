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

## 5. Facts

Verify every claim against a primary source in this session (fetch it, quote it). Code names that
point at real source go into `refs.json` with a pinned commit and real line numbers.

## 6. Ship it

```
npm run build:course
npm run lint:course        # must be clean
/course-clarity            # fresh learner ≥ 8/10 on every puzzle, zero undefined terms
npm run gifs:course
npm test
```
Then commit and deploy. Note in the commit what the fresh learner found and what changed.
