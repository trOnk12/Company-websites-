// @ts-check
const { test, expect } = require('./fixtures');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALL = fs.readdirSync(path.join(ROOT, '_music')).filter(f => f.endsWith('.md') && !f.startsWith('_'));
const kind = f => ((fs.readFileSync(path.join(ROOT, '_music', f), 'utf8').split(/^---\s*$/m)[1] || '').match(/^kind:\s*(\w+)\s*$/m) || [])[1] || 'recipe';
const slugs = k => ALL.filter(f => kind(f) === k).map(f => f.replace(/\.md$/, ''));
const RECIPES = slugs('recipe');
const LESSONS = slugs('lesson');
const BREAKDOWNS = slugs('breakdown');

test.describe('Music', () => {
  test('generated pages match the recipes', () => {
    execFileSync('node', ['scripts/build-music.js', '--check'], { cwd: ROOT, stdio: 'pipe' });
  });

  test('home page links to the music section from both navs', async ({ page }) => {
    await page.goto('/');
    for (const nav of ['nav[aria-label="Sections"]', 'nav[aria-label="Footer"]']) {
      await expect(page.locator(`${nav} a[href="music/"]`)).toBeAttached();
    }
  });

  test('the index lists every recipe', async ({ page }) => {
    await page.goto('/music/');
    await expect(page.locator('h1')).toHaveCount(1);
    for (const r of [...RECIPES, ...LESSONS, ...BREAKDOWNS]) await expect(page.locator(`.cassette a[href="${r}.html"]`)).toHaveCount(1);
  });

  test('every recipe draws its knobs, links its manuals and fits a phone', async ({ page }) => {
    for (const r of RECIPES) {
      await page.goto(`/music/${r}.html`);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('svg.knob').count(), r).toBeGreaterThan(5);
      expect(await page.locator('figure.dev-sketch.has-set').count(), r).toBeGreaterThan(1);
      await expect(page.locator('#sources a[href*="grand-canyon-manual"]'), r).toHaveCount(1);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, r).toBeLessThanOrEqual(client);
    }
  });
  test('every lesson draws the Digitone screen, plays FM in the browser and fits a phone', async ({ page }) => {
    for (const r of LESSONS) {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`/music/${r}.html`);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('.dn-screen').count(), r).toBeGreaterThan(3);
      expect(await page.locator('.fm-toy .fm-spec').count(), r).toBeGreaterThan(3);
      await expect(page.locator('.fm-controls').first()).toBeVisible();
      await expect(page.locator('#sources a[href*="Digitone-2-User-Manual"]'), r).toHaveCount(1);
      // Changing the depth redraws the spikes.
      const toy = page.locator('.fm-toy', { has: page.locator('input[type=range]') }).first();
      const before = await toy.locator('.fm-read').textContent();
      await toy.locator('input[type=range]').last().fill('3');
      await expect(toy.locator('.fm-read')).not.toHaveText(before || '');
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, r).toBeLessThanOrEqual(client);
      expect(errors, r).toEqual([]);
    }
  });

  test('every breakdown links official audio, sources every gear claim and fits a phone', async ({ page }) => {
    expect(BREAKDOWNS.length).toBeGreaterThan(0);
    for (const r of BREAKDOWNS) {
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`/music/${r}.html`);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.getByText('source needed'), r).toHaveCount(0);
      expect(await page.locator('#sources a[href^="http"]').count(), r).toBeGreaterThan(2);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, r).toBeLessThanOrEqual(client);
      expect(errors, r).toEqual([]);
    }
  });

  test('settings can be ticked off, remembered, and the whys hidden for a cheat card', async ({ page }) => {
    await page.goto(`/music/${RECIPES[0]}.html`);
    const row = page.locator('.setting').first();
    await row.click();
    await expect(row).toHaveClass(/ticked/);
    await page.reload();
    await expect(page.locator('.setting').first()).toHaveClass(/ticked/);
    await page.locator('[data-compact]').click();
    await expect(page.locator('.setting .why').first()).toBeHidden();
    await page.locator('[data-untick]').click();
    await expect(page.locator('.setting').first()).not.toHaveClass(/ticked/);
  });
});
