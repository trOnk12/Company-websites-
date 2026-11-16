---
name: book-to-course
description: Turn a technical book Mateusz owns (e.g. Designing Data-Intensive Applications) into foundation-first puzzles for his own learning: one chapter at a time, concept map first, small puzzles with a moving diagram and mastery checks. Use when he says "make puzzles from this book", "turn chapter N into a course", "learn this book with me".
---

# /book-to-course: a book, rebuilt as puzzles that click

The way Mateusz learns best: one small idea per step, each built only on what came before, a picture
that moves, and a check that proves it clicked before moving on ("synapses connecting"). This skill
applies the course pipeline (`/course-author`, `/course-clarity`) to a book.

## 0. Copyright first: private by default

A book is someone else's work. Puzzles made from it are **study material for Mateusz only**:
- Put them in `_course/_private/<book-id>/` (not built, not published), or in his notes vault
  (`notes/learn/<book-id>/`). Never under `_course/<id>/` (that folder is published to pachulski.dev).
- Never copy the book's sentences, figures or examples into anything public. Short quotes in private
  notes are fine, with a page reference.
- To publish a topic the book covers, write it from **primary sources** (papers, specs, docs), in
  your own words and your own examples, and cite those sources. The book can be listed as "further
  reading", nothing more.

## 1. Read before writing (one chapter at a time)

Ask Mateusz for the chapter (a PDF, EPUB or his notes; never search for pirated copies). Then:
1. List every idea the chapter introduces, in the order it needs them. Mark which ideas the
   learner already has (his vault: `notes/learn/`, and the courses already done).
2. Find the chapter's **one core principle**: the sentence everything else follows from
   (for DDIA ch. 5: "a copy of data on another machine is always a little late").
3. Build the concept map in a glossary (`in`, `def`, `aliases`), **at most 4 new ideas per puzzle**.
   A chapter is usually 6–12 puzzles.

## 2. Each puzzle

Same shape as `/course-author` §2: the problem it solves, a diagram that moves (one new term per step,
predict-then-reveal), the building block (every limit with its reason), one analogy (one world for the
whole book, chosen in step 1: e.g. for DDIA, a chain of shops keeping ledgers), three checks
(prediction, why, look-alike) where every wrong answer names a real misconception.

Rewrite, don't summarize: the book's order is for reading straight through; the puzzle order is for
"never a term before it's explained". Move a definition earlier, or split a section, whenever the
concept map says so.

## 3. Check it clicked

Run `/course-clarity` on the private chapter (the lint and the fresh-learner prompt work on any folder).
Then Mateusz does the puzzles himself; every wrong answer he gives is a gap: fix the puzzle, not him.

## 4. Keep it

At the end of a chapter: a one-page cheat sheet in his vault (`notes/learn/<book-id>/chNN.md`), with
flashcards in the `Question::Answer` format his spaced-repetition plugin reads.

## Why this works (from his own playbook)

Foundation first, tiny steps, one analogy world, binary checks, visuals, and no gaps carried forward:
the same rules as his `foundation-first-teaching` skill, applied to someone else's book.
