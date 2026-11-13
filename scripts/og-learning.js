#!/usr/bin/env node
'use strict';

// Renders a 1200×630 link-preview image for each learning card into learning/og/<slug>.png,
// so a card shared on LinkedIn or elsewhere shows its title instead of a blank box.
// Uses the Playwright Chromium the tests already need. Only renders missing images, unless --all.
//
//   npm run og:learning          after adding a card
//   npm run og:learning -- --all after changing a title or this template

const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { SRC, ROOT, parseFrontmatter } = require('./build-learning');

const OUT = path.join(ROOT, 'learning', 'og');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Inlined: a page made with setContent() can't load file:// fonts.
const font = f => `url(data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'fonts', f)).toString('base64')})`;

function html({ title, summary, tags }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: Lit; src: ${font('literata-600.woff2')}; font-weight: 600; }
  @font-face { font-family: Atk; src: ${font('atkinson-hyperlegible-next-var.woff2')}; font-weight: 200 800; }
  @font-face { font-family: Mono; src: ${font('jetbrains-mono-400.woff2')}; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; background: #F6F3EC; color: #1B1F24; font-family: Atk, sans-serif;
         padding: 64px 80px; display: flex; flex-direction: column; border-left: 16px solid #1D5FA8; }
  .eyebrow { font-family: Mono, monospace; font-size: 26px; color: #565B63; }
  h1 { font-family: Lit, Georgia, serif; font-weight: 600; font-size: 64px; line-height: 1.12; margin-top: 36px; letter-spacing: -0.01em; }
  p { font-size: 28px; line-height: 1.45; color: #565B63; margin-top: 28px; max-width: 980px; }
  .foot { margin-top: auto; display: flex; justify-content: space-between; font-size: 26px; border-top: 2px solid #CFC7B6; padding-top: 22px; }
  .foot b { font-family: Lit, Georgia, serif; font-weight: 600; }
  .foot span { font-family: Mono, monospace; color: #565B63; }
</style></head><body>
  <div class="eyebrow">Learning log · ${esc(tags.join(', '))}</div>
  <h1>${esc(title)}</h1>
  <p>${esc(summary)}</p>
  <div class="foot"><b>Mateusz Pachulski</b><span>pachulski.dev/learning</span></div>
</body></html>`;
}

(async () => {
  const all = process.argv.includes('--all');
  fs.mkdirSync(OUT, { recursive: true });
  const cards = fs.readdirSync(SRC).filter(f => f.endsWith('.md') && f !== 'README.md');
  const todo = cards.filter(f => all || !fs.existsSync(path.join(OUT, f.replace(/\.md$/, '.png'))));
  if (!todo.length) { console.log('All learning cards have a preview image.'); return; }
  // CHROMIUM_PATH lets you point at an already-installed Chromium.
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const f of todo) {
    const { meta } = parseFrontmatter(fs.readFileSync(path.join(SRC, f), 'utf8'), f);
    await page.setContent(html(meta), { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    // Shrink long titles until the whole card fits.
    await page.evaluate(() => {
      const h = document.querySelector('h1');
      let size = 64;
      while (document.body.scrollHeight > 630 && size > 40) h.style.fontSize = `${(size -= 4)}px`;
    });
    const out = path.join(OUT, f.replace(/\.md$/, '.png'));
    await page.screenshot({ path: out });
    console.log(`Wrote ${path.relative(ROOT, out)}`);
  }
  await browser.close();
  // Remove images of cards that no longer exist.
  for (const png of fs.readdirSync(OUT)) {
    if (!cards.includes(png.replace(/\.png$/, '.md'))) fs.unlinkSync(path.join(OUT, png));
  }
})();
