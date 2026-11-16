---
title: How these courses are made
summary: Where the material comes from, the rules every puzzle follows, how it's checked, and what isn't checked.
---

## Where it comes from

I learn in long sessions with an AI tutor that I've set up to teach me foundation first: the problem before the mechanism, one new term at a time, a physical analogy, and a yes-or-no check after every step. After each session the notes go into my own knowledge base, one note per idea, with flashcards I review every day.

The courses are those notes rebuilt for someone who wasn't in the session. The learning log on this site holds single ideas from the same sessions, one card each; a course strings ideas like that into a path you can walk from the start.

## The rules every puzzle follows

- **Problem first.** Each puzzle opens with what breaks without the mechanism.
- **No term before it's explained.** A glossary lists every term with the puzzle that teaches it, and a linter fails the checks if a page, a diagram label or a quiz option uses one too early.
- **One building block, shown moving.** At most a handful of new ideas per puzzle; the diagram plays step by step, and every step changes something you can see.
- **One world of pictures per course.** In the Android course: houses are apps, the town hall is system_server, the post office is Binder. In the Bluetooth course: a strap, a phone, a filing cabinet.
- **Checks that test the why.** Three questions per puzzle: a prediction, a reason, and two look-alike terms. Every wrong answer names the misunderstanding behind it and takes you back to the step that fixes it.

## How it's checked

- **Facts against primary sources.** Numbers and behavior come from the source itself: the Android Open Source Project and AndroidX code (pinned to a commit, with line numbers), the Bluetooth Core Specification, the Bluetooth SIG's assigned numbers, and Android's documentation. Each puzzle lists what it was checked against, with quotes.
- **A fresh learner, every round.** Before a puzzle ships, a separate AI reviewer with no context reads the whole course as a beginner and scores every puzzle for "could I follow this alone", lists every term it met too early, answers every question from the page alone, and lists every place a later puzzle contradicts an earlier one.
- **A picture reviewer.** Another reviewer sees only the diagrams, step by step, and scores whether they make sense without the text.
- **A log.** Every round's scores, what was found and what changed are kept with the course.

## What isn't checked

The reviewers are AI too, and I'm one person. A puzzle can still be wrong or unclear, especially where it simplifies (each one says where it does). Code in the puzzles is short and illustrative; it isn't a library you can drop into an app.

If something is wrong or didn't click, every puzzle has a "Tell me" link at the bottom. A puzzle that didn't click is a bug in the puzzle, not in you.

## Free, private, no sign-up

The courses are free. Your progress is saved only in your own browser. Visits are counted without cookies, and wrong answers are counted anonymously (which puzzle, which option, nothing about you) so I can see which puzzles need fixing.
