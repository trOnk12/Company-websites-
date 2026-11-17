// @ts-check
const { test, expect } = require('./fixtures');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RECIPES = fs.readdirSync(path.join(ROOT, '_music')).filter(f => f.endsWith('.md') && !f.startsWith('_')).map(f => f.replace(/\.md$/, ''));

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
    for (const r of RECIPES) await expect(page.locator(`.course-card a[href="${r}.html"]`)).toHaveCount(1);
  });

  test('every recipe draws its knobs, links its manuals and fits a phone', async ({ page }) => {
    for (const r of RECIPES) {
      await page.goto(`/music/${r}.html`);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.locator('svg.knob').count(), r).toBeGreaterThan(5);
      await expect(page.locator('#sources a[href*="grand-canyon-manual"]'), r).toHaveCount(1);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, r).toBeLessThanOrEqual(client);
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
