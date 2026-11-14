'use strict';

const { test, expect } = require('./fixtures');
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
      // Only the course's own player script, from this site.
      for (const src of await page.locator('script').evaluateAll(ss => ss.map(s => s.getAttribute('src')))) expect(src).toBe('../course.js');
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
      // Every check is a question with exactly one right answer.
      const quizzes = page.locator('fieldset.quiz');
      expect(await quizzes.count()).toBeGreaterThan(0);
      for (const q of await quizzes.all()) expect(await q.locator('input[data-ok]').count()).toBe(1);
      for (const a of await page.locator('#sources ~ ul a').evaluateAll(as => as.map(a => a.href))) expect(a).toMatch(/^https:\/\//);
    });
  }

  test('every page counts visits with GoatCounter and nothing else external', async ({ page }) => {
    const pages = ['/', '/learning/', '/course/', ...PUZZLES.map(s => `/course/android/${s}.html`)];
    for (const p of pages) {
      const hosts = new Set();
      page.on('request', req => { const u = new URL(req.url()); if (!['localhost', '127.0.0.1'].includes(u.hostname)) hosts.add(u.hostname); });
      await page.goto(p);
      const html = await page.content();
      expect(html, p).toContain('pachulski.goatcounter.com/count?p=');
      for (const h of hosts) expect(h, p).toBe('pachulski.goatcounter.com');
      page.removeAllListeners('request');
    }
  });

  test('a puzzle unlocks the next one only when every answer is right', async ({ page }) => {
    await page.goto(`/course/android/${PUZZLES[0]}.html`);
    const next = page.locator('.pager a.primary');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    const quizzes = page.locator('fieldset.quiz');
    const n = await quizzes.count();
    // A wrong answer shows its own "Not quite" explanation (only that one) and keeps the lock.
    await quizzes.nth(0).locator('input:not([data-ok]) + label').first().click();
    await expect(quizzes.nth(0).locator('.fb.no:visible')).toHaveCount(1);
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    for (let i = 0; i < n; i++) await quizzes.nth(i).locator('input[data-ok] + label').click();
    await expect(quizzes.nth(0).locator('.fb.ok')).toBeVisible();
    await expect(next).toHaveAttribute('aria-disabled', 'false');
    // Progress is remembered: the overview now shows puzzle 0 done and offers to continue.
    await page.goto('/course/');
    await expect(page.locator(`.modules li[data-n="0"]`)).toHaveAttribute('data-state', 'done');
    await expect(page.locator('[data-resume]')).toContainText('Continue: puzzle 1');
  });

  test('the clarity lint is clean', () => {
    execFileSync('node', ['scripts/lint-course.js'], { cwd: ROOT, stdio: 'pipe' });
  });

  test('a wrong answer names the mismatch and "Show me" jumps to the step that fixes it', async ({ page }) => {
    await page.goto(`/course/android/${PUZZLES[0]}.html`);
    const q = page.locator('fieldset.quiz').first();
    const wrong = q.locator('input:not([data-ok])').first();
    await page.locator(`label[for="${await wrong.getAttribute('id')}"]`).click();
    const fb = q.locator('.fb.no:visible');
    await expect(fb).toContainText('Not quite.');
    const show = fb.locator('.show-me');
    const target = await show.getAttribute('for');
    await show.click();
    await expect(page.locator(`#${target}`)).toBeChecked();
    const step = Number(target.split('-').pop());
    await expect(page.locator('.stepper .caps > li').nth(step - 1)).toBeVisible();
  });

  test('opening a puzzle early points back to the one it builds on', async ({ page }) => {
    await page.goto(`/course/android/${PUZZLES[3]}.html`);
    await expect(page.locator('.gate')).toContainText('builds on the previous one');
    await expect(page.locator('.gate a')).toHaveAttribute('href', `${PUZZLES[2]}.html`);
  });

  test('the diagram player plays on its own and can be paused', async ({ page }) => {
    await page.goto(`/course/android/${PUZZLES[0]}.html`);
    const play = page.locator('.player .play');
    await play.scrollIntoViewIfNeeded();
    await expect(play).toHaveAttribute('aria-pressed', 'true', { timeout: 5000 });
    await expect(page.locator('.stepper .caps > li').nth(1)).toBeVisible({ timeout: 12000 });
    await play.click();
    await expect(play).toHaveAttribute('aria-pressed', 'false');
  });

  test('code names open the real source, pinned to a commit', async ({ page }) => {
    await page.goto(`/course/android/14-the-main-threads-queue.html`);
    const ref = page.locator('.ref', { has: page.locator(':scope > code', { hasText: /^Looper\.loop\(\)$/ }) }).first();
    await expect(ref.locator('.pop')).toBeHidden();
    await ref.hover();
    await expect(ref.locator('.pop')).toBeVisible();
    await expect(ref.locator('.pop-code')).toContainText('for (;;)');
    expect(await ref.locator('.pop a').getAttribute('href')).toMatch(/github\.com\/aosp-mirror\/platform_frameworks_base\/blob\/[0-9a-f]{40}\/.+#L\d+$/);
  });

  test('course pages fit a phone screen', async ({ page }) => {
    for (const p of ['/course/', ...PUZZLES.map(s => `/course/android/${s}.html`)]) {
      await page.goto(p);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, p).toBeLessThanOrEqual(client);
    }
  });
});
