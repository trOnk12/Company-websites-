'use strict';

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CARDS = fs.readdirSync(path.join(ROOT, '_learning'))
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .map(f => f.replace(/\.md$/, ''));

test.describe('Learning log', () => {
  test('generated pages match the Markdown cards', () => {
    // Throws, and fails the test, when someone edited _learning/ without rebuilding.
    execFileSync('node', ['scripts/build-learning.js', '--check'], { cwd: ROOT, stdio: 'pipe' });
  });

  test('home page links to the learning log from both navs', async ({ page }) => {
    await page.goto('/');
    for (const nav of ['nav[aria-label="Sections"]', 'nav[aria-label="Footer"]']) {
      await expect(page.locator(`${nav} a[href="learning/"]`)).toBeAttached();
    }
  });

  test('index lists every card and each link works', async ({ page, request }) => {
    await page.goto('/learning/');
    await expect(page.locator('h1')).toHaveCount(1);
    const hrefs = await page.locator('.log-entry h3 a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    expect(hrefs.sort()).toEqual(CARDS.map(c => `${c}.html`).sort());
    for (const h of hrefs) expect((await request.get(`/learning/${h}`)).ok()).toBeTruthy();
  });

  for (const slug of CARDS) {
    test(`card "${slug}" keeps the playbook's promises`, async ({ page }) => {
      await page.goto(`/learning/${slug}.html`);
      await expect(page.locator('h1')).toHaveCount(1);
      for (const h of ['The gap', 'The click', 'How I checked it', 'Check yourself', 'Sources']) {
        await expect(page.locator('h2', { hasText: h })).toHaveCount(1);
      }
      // Recall questions are hidden answers without JavaScript.
      const recall = page.locator('details.recall');
      expect(await recall.count()).toBeGreaterThan(0);
      await expect(recall.first().locator('p')).toBeHidden();
      await recall.first().locator('summary').click();
      await expect(recall.first().locator('p')).toBeVisible();
      // Sources are real external links.
      const sources = await page.locator('#sources ~ ul a, #sources + ul a').evaluateAll(as => as.map(a => a.href));
      expect(sources.length).toBeGreaterThan(0);
      sources.forEach(s => expect(s).toMatch(/^https:\/\//));
      // Honest about how it was made, and still no scripts.
      await expect(page.locator('footer')).toContainText('Drafted with AI');
      expect(await page.locator('script').count()).toBe(0);
      const csp = await page.$eval('meta[http-equiv="Content-Security-Policy"]', el => el.content);
      expect(csp).toContain("script-src 'none'");
    });
  }

  test('cards stay readable on phones without sideways scrolling', async ({ page }) => {
    for (const p of ['/learning/', ...CARDS.map(c => `/learning/${c}.html`)]) {
      await page.goto(p);
      const [scroll, client] = await page.evaluate(() =>
        [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, p).toBeLessThanOrEqual(client);
    }
  });

  test('every card has its own link-preview image', async ({ page, request }) => {
    for (const c of CARDS) {
      await page.goto(`/learning/${c}.html`);
      const img = await page.$eval('meta[property="og:image"]', el => el.content);
      expect(img).toBe(`https://pachulski.dev/learning/og/${c}.png`);
      const res = await request.get(`/learning/og/${c}.png`);
      expect(res.ok(), `learning/og/${c}.png is missing: run npm run og:learning`).toBeTruthy();
      expect(res.headers()['content-type']).toMatch(/image\/png/);
    }
  });

  test('Atom feed lists every card and is linked from the pages', async ({ page, request }) => {
    const xml = await (await request.get('/learning/feed.xml')).text();
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    for (const c of CARDS) expect(xml).toContain(`<id>https://pachulski.dev/learning/${c}</id>`);
    await page.goto('/learning/');
    await expect(page.locator('link[rel="alternate"][type="application/atom+xml"]')).toHaveAttribute('href', 'feed.xml');
  });

  test('sitemap lists the learning pages', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('https://pachulski.dev/learning/');
    for (const c of CARDS) expect(xml).toContain(`https://pachulski.dev/learning/${c}`);
  });
});
