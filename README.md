# pachulski.dev

Personal site for Mateusz Pachulski — Senior Android & KMP engineer.

A static GitHub Pages site: `index.html` and `style.css`, with self-hosted
fonts in `fonts/` (Atkinson Hyperlegible Next, Literata, JetBrains Mono; all SIL OFL).
Course navigation and reading work as static HTML. Self-hosted JavaScript adds quiz progress and browser experiments. The live site uses a cookie-free GoatCounter visit counter.

```bash
npm ci
npx playwright install chromium
npm run verify
```

The functional tests also guard the claims on the page: consistent years of
experience, checkable Wire pull-request numbers, AI-assisted work labelled,
no placeholders, no public phone number and the expected network requests.

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

## Maintaining the courses

Edit numbered lessons, diagrams, topic chapters and project briefs under `_course/<course>/`. Run `npm run build:course` and then `npm run build:learning` to refresh the site, downloadable vaults and sitemap. If a diagram changed, regenerate its downloadable animation using `npm run gifs:course -- <course>` and review the frames. Commit the generated files with their sources.

Run `npm run verify` from a clean checkout with Node, Python 3 and Playwright Chromium installed. It checks the generated pages, internal navigation and offline exports, then exercises the browser flows. Follow the READMEs under `labs/` to confirm native behavior when a lesson changes a claim about a runtime or database. Browser models and native experiments have different evidence requirements. The [course-by-course coverage review](_course/COVERAGE.md) records open practical assessments.
