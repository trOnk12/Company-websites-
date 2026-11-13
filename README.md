# pachulski.dev

Personal site for Mateusz Pachulski — Senior Android & KMP engineer.

A static GitHub Pages site: `index.html` and `style.css`, with self-hosted
fonts in `fonts/` (Atkinson Hyperlegible Next, Literata, JetBrains Mono; all SIL OFL).
No JavaScript, no cookies, no third-party requests.

```bash
npm install
npx playwright install chromium
npm test
```

The functional tests also guard the claims on the page: consistent years of
experience, checkable Wire pull-request numbers, AI-assisted work labelled,
no placeholders, no phone number and no tracking.

## Learning log

`/learning/` is a set of short cards on things I learned. Cards are Markdown in `_learning/`,
built to plain HTML in `learning/` by a dependency-free script; the generated pages are
committed, so GitHub Pages needs no build step. `_learning/README.md` is the playbook, and
`.claude/skills/learning-card/` is the `/learning-card` skill that drafts a card with Claude.

```bash
npm run build:learning   # after adding or editing a card
npm run og:learning      # link-preview image for new cards (Playwright Chromium)
npm run check:learning   # fails if learning/ is out of date (also part of npm test)
```
