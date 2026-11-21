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

## Review the learning path

Check the published experience independently of the text:

- From the catalog, can someone choose a topic and begin with one clear action? After completing a puzzle, can they resume at the named next puzzle?
- At phone width, start from the lesson title. Check that the mechanism, diagram, quiz and optional depth can be reached without scanning the whole lesson. Follow a shared depth link and return to the main example.
- For each claim ask “what would make that happen?” and follow the chain of prerequisites. Opening an optional explanation should answer that question with the same example. A source link supports the claim, while a depth section explains the mechanism.
- Solve the main quiz with every optional panel closed. Then try the depth example with one input changed. A reader can pass each check by reasoning from the lesson, and the quiz must not require material from a closed panel.

## Pass 1 — the lint (mechanical, must be clean)

`npm run lint:course`. Vocabulary rules (from `_course/<course>/glossary.json`):

- a glossary term used before the puzzle that teaches it (title excepted; subtitle, diagram labels,
  captions, code and every question option count);
- a term taught in a puzzle whose first mention isn't its **bold** definition (in the body or that
  step's caption), or that first appears in the subtitle or a question;
- more than 6 new concepts in one puzzle (split it);
- any code name, acronym, CamelCase or snake_case word that is neither in the glossary nor in `baseline`.

When the fresh learner (pass 2) finds an undefined plain word ("framework", "lifecycle"), add it to the
glossary with the puzzle that should teach it: from then on the lint enforces it. That's how the lint
learns.

Structure and quality rules:

- a question without exactly one right answer, or with fewer than 2 / more than 4 options;
- a wrong option without its own **mismatch** feedback and a **pointer** (`s3` = diagram step 3, or a section id)
  that exists on the page;
- a caption over 45 words, or a diagram step that adds more than 12 words of SVG text
  (the picture must show, not tell);
- a diagram with no moving part (`data-move`) in at least one step;
- a word from the glossary's avoid list ("the system", "views", "simply"…): name the actor or say it plainly;
- an inline code name in a question that appears nowhere earlier in the course
  (a question may only use what was taught: "pre-check the check");
- more than 6 new **bold** terms in one puzzle (one new term per step).

## Pass 2 — the fresh learner (judgement, done by someone with no context)

Spawn one general-purpose agent per module (no conversation context). Give it ONLY the rendered text of
the puzzles in order (`node scripts/lint-course.js --text <course>` prints it: captions, sections,
questions with options, but not the answers' explanations). Ask it to read as a beginner Android developer
who knows Kotlin but nothing about Android internals, and to report, per puzzle:

1. **Undefined terms**: every term used before it was explained (quote it, say where), including subtitles,
   diagram labels and question options. Score each puzzle 1–10 for "a beginner can follow this alone".
2. **Leaps**: every diagram step where it couldn't predict the next one, or didn't see why it happened.
3. **Text vs picture**: steps where it had to read the caption to understand the picture (the picture alone
   should make the point; the caption names it).
4. **Questions**: answer each question from the page alone, and say which answer it picked and how sure it was.
   A question it gets wrong or guesses is a defect in the puzzle, not the learner.
5. **Look-alikes**: any two terms it could confuse (e.g. Binder thread vs main thread) that were never
   separated explicitly.
6. One sentence: what the puzzle's single core idea is, in its own words. If that sentence is wrong or vague,
   the puzzle has no clear core.

### The prompt (use it verbatim, so scores are comparable between rounds)

> You are a beginner reviewing an online course for clarity. Read ONLY this file, all of it, with the Read
> tool: `<path>`. Do not read other files, search the web, or use outside knowledge to fill gaps.
> Persona: you know basic Kotlin and have built a simple Android app (the words in the glossary's baseline),
> but you know NOTHING about operating systems or Android internals. Read the puzzles in order; you only
> know what earlier puzzles taught. Hard rule: no technical term may be used before it is explained. Be
> strict, including subtitles, diagram labels and question options. For EACH puzzle: score 1–10 ("a
> beginner can follow this without outside help"); terms used before being explained (quote + where) or
> "none"; the biggest remaining gap; any question whose right answer is NOT supported by the page. Then the
> fixes needed to bring every puzzle to at least 8/10, most important first. Under 1100 words.

Run it in the background while you do pass 3 and the visual check. After fixing, re-run it on the
puzzles that were under 8 only (targeted re-review), not the whole course.

## Pass 2b — the pictures (a second fresh reviewer who sees only the diagrams)

The text reviewer never sees motion. So: `npm run shots:course`, then spawn a second general-purpose agent,
in the background, and give it ONLY the folder `.shots/<course>/strips/` (one image per diagram, its steps
left to right) and the picture world (houses = apps, columned building = system_server, ground = kernel,
post office = Binder, little people = threads, clerk at a desk = main thread, envelopes = messages). It
scores each diagram 1–10 for "could a beginner understand what happens from the pictures alone", and
reports covered labels, leftovers from earlier steps, unclear movement, and labels doing a picture's job.
Tell it what the shapes mean (see course-author §3: town hall, post office in the ground, machines with a gear),
and which puzzle introduces the kernel and Binder, so it doesn't flag a deliberate absence.

Bar: every diagram ≥ 8. Look at `.shots/<course>/sheet.png` yourself too before shipping.

## Pass 3 — the playbook rubric (you, against Mateusz's rules)

For each puzzle, check and write down pass/fail:

- **Problem first**: the first section says what breaks without this mechanism.
- **One core principle** that the rest follows from, said once, plainly.
- **Analogy with named characters**, consistent with the course cast (house, town hall, post office, clerk).
- **One new term per step**; every code name explained the moment it appears (the source popovers don't count
  as explaining).
- **No bare facts**: every limit has its reason (why ~1 MB, why one thread).
- **Look-alikes separated up front** (proxy vs stub, Binder thread vs main thread, cold vs warm start).
- **Checks distinguish plausible outcomes.** At least one changes an input or condition and asks for a prediction. Each wrong option maps to a real misconception and links to the step that fixes it.
- **Ties back** to the previous puzzle in the first lines.

### The picture prompt (use it verbatim, filling in the world)

> You are reviewing the diagrams of a beginner course from the PICTURES ALONE. Look ONLY at the images in
> `<folder>` (one per diagram, its steps left to right; read them in filename order; you may crop/zoom copies).
> The picture world: `<one line per shape: what it means>`. Each diagram sits above a one-sentence caption per
> step; the pictures should carry the idea, the captions name it. For each diagram: score 1–10 for "could a
> beginner understand what happens from the pictures alone (with the short labels)"; one line on what changes
> between steps; the problems (labels covered, leftovers, unclear movement, steps where nothing visible changes,
> labels doing the picture's job, inconsistency with the picture world). Then the top fixes to get every diagram
> to ≥ 8. Be calibrated: 8 means "a beginner gets it, with small polish left", not "perfect". Under 1100 words.

Each round is a new reviewer that finds new nits, so scores move slowly: fix what two reviewers agree on
first, and don't chase single-reviewer taste.

## Pass 2c: across puzzles

After any new puzzle, ask the fresh learner one more thing: "list every place a later puzzle contradicts,
or quietly redefines, something an earlier puzzle said". Those cost the most trust and are cheap to fix.

## Pass 2d: the expert (correctness)

For any course outside Android internals, spawn one more fresh agent as a senior engineer in that field.
Give it the puzzle files and diagrams, ask it to flag every wrong, overstated or misleading claim, to check
that each right answer is right and each wrong answer wrong, and to return exact current text plus a
replacement. The learner passes find confusion; only this pass finds a confident, clear, wrong sentence.

## Pass 2e: the gap hunt (strict learner, whole course)

Run once per module and again for the whole course. Give a fresh agent the course's real learner profile, including
which other courses they have NOT taken, and ask for: every concept used before it's explained (with the exact phrase),
every leap, every missing puzzle between two puzzles (title + core idea + position), and overloaded puzzles. Missing
puzzles get written, not footnoted. Add any slipped word to `_course/jargon.json`.

## Pass 2f: complete enough that nobody comes back (Mateusz, 21 November 2026)

"Complete, so I never have to go back", and every puzzle "crystal clear". Before a module ships, check:
- **No return trips.** A learner who passed every puzzle can do the module's job without searching elsewhere: every
  term, step, number, command and failure case the job needs is taught in the course (or linked as a "Go deeper"
  floor). List what the job needs, tick each item against a puzzle; anything unticked becomes a puzzle.
- **Crystal clear.** One idea per puzzle; the takeaway says it in two sentences a learner could repeat from memory;
  the diagram shows that idea and nothing else; every sentence earns its place. If a fresh learner has to re-read a
  paragraph, rewrite it.
- **The edges are covered.** What usually goes wrong, the limits ("doesn't work when…"), and the version or platform
  differences that bite in practice are in the puzzle, not left for later.

## Pass bar

A puzzle ships only when the lint is clean, its diagram scores at least 8/10 in the picture review, **and** the fresh learner scores it at least 8/10 for
"a beginner can follow this without outside help", with no undefined terms and no question answerable
by copying a caption.

## Output

Add a row to `_course/<course>/REVIEW.md` (date, version, lint, the scores, what was found → what
changed): that file is how we know the course is getting better, not just different.

A table per puzzle: lint ✓/✗, each learner finding, each rubric line. Then fix every ✗ and every learner
finding (or say why not), rebuild (`npm run build:course`), and run passes 1–2 again. Report what changed.
Never weaken a lint rule to get a pass.
