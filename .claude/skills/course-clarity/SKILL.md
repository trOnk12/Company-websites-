---
name: course-clarity
description: Verify that a course puzzle (or a whole module) on pachulski.dev/course is easy to understand for a beginner, and fix what isn't. Use after writing or changing any puzzle, diagram or question, or when Mateusz asks "is this clear?", "review the course", "check understanding".
---

# /course-clarity — is it easy to understand?

A puzzle is done when a newcomer who has only read the puzzles before it can follow every step,
predict what happens next, and answer every question from what's on the page. This skill checks
that in three passes. Run all three; fix; run again until all pass.

Sources of truth: the puzzles in `_course/<course>/`, their diagrams in `_course/<course>/diagrams/`,
and Mateusz's teaching playbook (the `foundation-first-teaching` skill). The rules below come from it.

## Pass 1 — the lint (mechanical, must be clean)

`npm run lint:course`. It fails on:

- a question without exactly one right answer, or with fewer than 2 / more than 4 options;
- a wrong option without its own **mismatch** feedback and a **pointer** (`s3` = diagram step 3, or a section id)
  that exists on the page;
- a caption over 45 words, or a diagram step that adds more than 12 words of SVG text
  (the picture must show, not tell);
- a diagram with no moving part (`data-move` / `moving`) in at least one step;
- an inline code name in a question that appears nowhere earlier in the course
  (a question may only use what was taught: "pre-check the check");
- more than 6 new **bold** terms in one puzzle (one new term per step).

## Pass 2 — the fresh learner (judgement, done by someone with no context)

Spawn one general-purpose agent per module (no conversation context). Give it ONLY the rendered text of
the puzzles in order (`node scripts/lint-course.js --text <course>` prints it: captions, sections,
questions with options, but not the answers' explanations). Ask it to read as a beginner Android developer
who knows Kotlin but nothing about Android internals, and to report, per puzzle:

1. **Undefined terms**: every term used before it was explained (quote it, say where).
2. **Leaps**: every diagram step where it couldn't predict the next one, or didn't see why it happened.
3. **Text vs picture**: steps where it had to read the caption to understand the picture (the picture alone
   should make the point; the caption names it).
4. **Questions**: answer each question from the page alone, and say which answer it picked and how sure it was.
   A question it gets wrong or guesses is a defect in the puzzle, not the learner.
5. **Look-alikes**: any two terms it could confuse (e.g. Binder thread vs main thread) that were never
   separated explicitly.
6. One sentence: what the puzzle's single core idea is, in its own words. If that sentence is wrong or vague,
   the puzzle has no clear core.

## Pass 3 — the playbook rubric (you, against Mateusz's rules)

For each puzzle, check and write down pass/fail:

- **Problem first**: the first section says what breaks without this mechanism.
- **One core principle** that the rest follows from, said once, plainly.
- **Analogy with named characters**, consistent with the course cast (house, town hall, post office, clerk).
- **One new term per step**; every code name explained the moment it appears (the source popovers don't count
  as explaining).
- **No bare facts**: every limit has its reason (why ~1 MB, why one thread).
- **Look-alikes separated up front** (proxy vs stub, Binder thread vs main thread, cold vs warm start).
- **Checks are binary or A/B**, test the *why* not only the *what*, and each wrong option maps to one real
  misconception with feedback that names it and a pointer to the step that fixes it.
- **Ties back** to the previous puzzle in the first lines.

## Output

A table per puzzle: lint ✓/✗, each learner finding, each rubric line. Then fix every ✗ and every learner
finding (or say why not), rebuild (`npm run build:course`), and run passes 1–2 again. Report what changed.
Never weaken a lint rule to get a pass.
