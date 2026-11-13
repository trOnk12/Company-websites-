'use strict';

const { test, expect } = require('@playwright/test');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COURSE = JSON.parse(fs.readFileSync(path.join(ROOT, '_course/android/course.json'), 'utf8'));
const PUZZLES = COURSE.modules.flatMap(m => m.puzzles).map(f => f.replace(/\.md$/, ''));

test.describe('Course', () => {
  test('generated pages match the sources', () => {
    execFileSync('node', ['scripts/build-course.js', '--check'], { cwd: ROOT, stdio: 'pipe' });
  });

  test('home page links to the course from both navs', async ({ page }) => {
    await page.goto('/');
    for (const nav of ['nav[aria-label="Sections"]', 'nav[aria-label="Footer"]']) {
      await expect(page.locator(`${nav} a[href="course/"]`)).toBeAttached();
    }
  });

  test('overview starts at the first puzzle and lists every puzzle', async ({ page }) => {
    await page.goto('/course/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('a.button.primary')).toHaveAttribute('href', `android/${PUZZLES[0]}.html`);
    for (const p of PUZZLES) await expect(page.locator(`.modules a[href="android/${p}.html"]`)).toHaveCount(1);
  });

  test('puzzles chain in order with next and back links', async ({ page }) => {
    for (let i = 0; i < PUZZLES.length; i++) {
      await page.goto(`/course/android/${PUZZLES[i]}.html`);
      await expect(page.locator('.progress a[aria-current="page"]')).toHaveText(String(i));
      if (i < PUZZLES.length - 1) await expect(page.locator('.pager a.primary')).toHaveAttribute('href', `${PUZZLES[i + 1]}.html`);
      if (i > 0) await expect(page.locator('.pager a').first()).toHaveAttribute('href', `${PUZZLES[i - 1]}.html`);
    }
  });

  for (const slug of PUZZLES) {
    test(`puzzle "${slug}" steps through its diagram without JavaScript`, async ({ page }) => {
      await page.goto(`/course/android/${slug}.html`);
      expect(await page.locator('script').count()).toBe(0);
      const stepper = page.locator('.stepper');
      await expect(stepper).toHaveCount(1);
      const steps = await stepper.locator('> input').count();
      expect(steps).toBeGreaterThan(1);
      const caps = stepper.locator('.caps > li');
      await expect(caps.nth(0)).toBeVisible();
      await expect(caps.nth(1)).toBeHidden();
      for (let k = 1; k < steps; k++) {
        await caps.nth(k - 1).locator('label.next').click();
        await expect(caps.nth(k)).toBeVisible();
        await expect(caps.nth(k - 1)).toBeHidden();
      }
      // Every check is a question that opens to its answer.
      expect(await page.locator('details.recall').count()).toBeGreaterThan(0);
      for (const a of await page.locator('#sources ~ ul a').evaluateAll(as => as.map(a => a.href))) expect(a).toMatch(/^https:\/\//);
    });
  }

  test('course pages fit a phone screen', async ({ page }) => {
    for (const p of ['/course/', ...PUZZLES.map(s => `/course/android/${s}.html`)]) {
      await page.goto(p);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, p).toBeLessThanOrEqual(client);
    }
  });
});
