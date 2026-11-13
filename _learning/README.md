# Learning log — the playbook

Source for <https://pachulski.dev/learning/>. One Markdown file here is one card, built to
`learning/<file-name>.html` by `npm run build:learning`. Folders starting with `_` are not
served by GitHub Pages, so this folder is the source, not the site.

## The loop

1. **Learn** — a session on one topic (`/learn`, a chat, a docs deep-dive), puzzle-style:
   find the missing piece, fit it into what I already know.
2. **Card** — `/learning-card` turns that one piece into a card here, through the airlock below.
3. **Check** — I check it myself: run it, read the primary source. The card says how, in
   **How I checked it**. If I can't check it, it stays a `seedling` or isn't published.
4. **Publish** — `npm run build:learning && npm run og:learning && npm test`, commit, push.
   GitHub Pages serves the card, its link-preview image and the Atom feed (`learning/feed.xml`).
5. **Share** — a short LinkedIn post that links to the card. The site is the home; LinkedIn is
   where the readers are.
6. **Revisit** — the **Check yourself** questions are spaced-repetition cards. When I come back
   to one and it holds, the status goes `seedling` → `budding` → `evergreen`.

## The airlock: private vault → public card

My Obsidian vault is full of employer context. A public card is **written fresh from the
general lesson**, never copied or synced from the vault.

- No company, team, colleague or customer names, no ticket keys, no internal module, service
  or repository names, no URLs, credentials or data from work.
- Rename the example to something neutral (`pricing`, `checkout`), as the Gradle cards do.
- The build refuses ticket-like keys (`ABC-123`). Put any other word that must never appear,
  one per line, in `_learning/.private-terms`. That file is git-ignored, so the list stays
  private, and the build refuses any card containing one.
- When in doubt, leave it out. The lesson almost never needs the context.

## Card format

```markdown
---
title: A short claim, not a topic
date: 2026-11-13
status: seedling            # seedling | budding | evergreen
tags: [gradle, testing]
summary: One or two sentences: the lesson, for someone skimming the index.
---

## The gap
What I didn't understand, in one or two sentences.

## The pieces            (optional)
- Foundation one
- A related card: [[other-card-file-name]]

## The click
The analogy or insight that made it fit.

## How I checked it
What I ran or read, and what happened. Include what I did NOT check.

## Check yourself
- A question with a yes/no or one-line answer?::The answer.

## Sources
- [Primary source title](https://…)
```

- Required sections: The gap, The click, How I checked it, Check yourself, Sources (at least
  one https link). The build fails without them.
- `Question::Answer` is the inline-card syntax of the Obsidian **Spaced Repetition** plugin,
  so this folder can be opened as an Obsidian vault and reviewed there too. On the site, each
  one is a question that opens to show the answer, without JavaScript.
- `[[file-name]]` links another card; the target page lists it under "Linked from".
- Supported Markdown: `##`/`###` headings, paragraphs, flat lists, fenced code, `inline code`,
  **bold**, *italic*, `[text](https://…)`. Anything else stops the build, not the reader.

## Experiments

When a claim can be run, the experiment goes in `experiments/<name>/` with a script that reruns
it, and the card links to it. Readers can check the claim, like the Wire pull-request link on the
home page.
