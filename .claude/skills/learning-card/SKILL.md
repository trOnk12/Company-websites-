---
name: learning-card
description: Turn one thing Mateusz just learned into a public learning card for pachulski.dev/learning. Use after a /learn or teaching session, or when he says "card this", "make a learning card" or "add this to my learning log".
---

# /learning-card

Turns ONE piece of knowledge from a learning session into a card in `_learning/` of the
pachulski.dev repository (trOnk12/Company-websites-). Read `_learning/README.md` first: it is the
playbook and the format, and it wins over this file if they disagree.

## Steps

1. **Pick one gap.** From the session, name the single thing he didn't understand and now does.
   If there are several, make one card each, or ask which one. A card is one lesson, readable
   in two minutes.
2. **Pass the airlock.** Rewrite the lesson in general terms. No employer, team, colleague or
   customer names, no ticket keys, no internal module or service names, no work URLs or data.
   Rename examples to neutral ones (`pricing`, `checkout`). If the lesson can't be told without
   the private context, stop and say so.
3. **Check it.** Every claim on the card needs one of:
   - an experiment you ran this session (prefer a small one under `_learning/experiments/<name>/`
     with a `run.sh`, linked from the card), or
   - a primary source you fetched this session (official docs, the spec, the source code).
   Write what you ran or read under **How I checked it**, and also what you did not check.
   Drop a claim you couldn't check, or mark the card `seedling` and say it's unchecked.
4. **Write the card** to `_learning/<short-claim-in-kebab-case>.md` in the README's format:
   - Title: a claim, not a topic ("A green build doesn't prove implementation() is right").
   - Write it in his voice: first person, plain, short sentences, no hype.
   - The click: the analogy from the session that made it fit.
   - Check yourself: 2–4 `Question::Answer` lines, each answer one sentence.
   - Link related existing cards with `[[file-name]]` (`ls _learning/*.md`).
   - `date`: today. `status`: `seedling`, or `budding` if the check was a real experiment.
5. **Build and test.** `npm run build:learning`, `npm run og:learning` (the link-preview image), then `npm test`. Fix whatever the build refuses.
   Don't weaken a check to get it through.
6. **Hand it to him.** Show the card text and the How I checked it section. His name is on the
   site, so he confirms it's true and safe to publish before you push. Then commit the card,
   the generated `learning/` pages, its `learning/og/` image and `sitemap.xml` together, and push.
7. **Draft the LinkedIn post.** Short: the gap as a hook, the click in two or three lines, one
   Check yourself question for people to answer in the comments, the card's URL last. Plain
   text, no hashtag walls, at most three tags. He posts it himself.

## Don't

- Don't copy or sync notes from his private vault (`~/Brain`, the trOnk12/notes repository).
  Write fresh from the general lesson.
- Don't publish anything you didn't check, or present AI-written content as checked.
- Don't add JavaScript, trackers or third-party requests: the site promises none.
