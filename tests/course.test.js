'use strict';

const { test, expect } = require('./fixtures');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COURSE = JSON.parse(fs.readFileSync(path.join(ROOT, '_course/android/course.json'), 'utf8'));
const PUZZLES = COURSE.modules.flatMap(m => m.puzzles).map(f => f.replace(/\.md$/, ''));
// Every live course, for the tests that every puzzle must pass.
const COURSES = fs.readdirSync(path.join(ROOT, '_course')).filter(d => fs.existsSync(path.join(ROOT, '_course', d, 'course.json')))
  .map(id => ({ id, puzzles: JSON.parse(fs.readFileSync(path.join(ROOT, '_course', id, 'course.json'), 'utf8')).modules.flatMap(m => m.puzzles).map(f => f.replace(/\.md$/, '')) }));

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

  test('the catalog links every live course', async ({ page }) => {
    await page.goto('/course/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.course-card a[href="android/"]').first()).toBeVisible();
  });

  test('overview starts at the first puzzle and lists every puzzle', async ({ page }) => {
    await page.goto('/course/android/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('[data-resume="android"]')).toHaveAttribute('href', `${PUZZLES[0]}.html`);
    for (const p of PUZZLES) await expect(page.locator(`.modules a[href="${p}.html"]`)).toHaveCount(1);
  });

  for (const c of COURSES) test(`${c.id}: puzzles chain in order with next and back links`, async ({ page }) => {
    const P = c.puzzles;
    for (let i = 0; i < P.length; i++) {
      await page.goto(`/course/${c.id}/${P[i]}.html`);
      await expect(page.locator('.progress a[aria-current="page"]')).toHaveText(String(i));
      if (i < P.length - 1) await expect(page.locator('.pager a.primary')).toHaveAttribute('href', `${P[i + 1]}.html`);
      if (i > 0) await expect(page.locator('.pager a').first()).toHaveAttribute('href', `${P[i - 1]}.html`);
    }
  });

  for (const { id, slug } of COURSES.flatMap(c => c.puzzles.map(slug => ({ id: c.id, slug })))) {
    test(`${id}: puzzle "${slug}" steps through its diagram without JavaScript`, async ({ page }) => {
      await page.goto(`/course/${id}/${slug}.html`);
      // Only the course's own player script, from this site.
      for (const src of await page.locator('script').evaluateAll(ss => ss.map(s => s.getAttribute('src')))) expect(['../progress-index.js', '../course.js']).toContain(src);
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
      for (const a of await page.locator('#sources ul a').evaluateAll(as => as.map(a => a.href))) expect(a).toMatch(/^https:\/\//);
    });
  }

  test('every page counts visits with GoatCounter and nothing else external', async ({ page }) => {
    const pages = ['/', '/learning/', '/course/', '/course/android/', ...PUZZLES.map(s => `/course/android/${s}.html`)];
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
    await page.goto('/course/android/');
    await expect(page.locator(`.modules li[data-n="0"]`)).toHaveAttribute('data-state', 'done');
    await expect(page.locator('[data-resume]')).toContainText('Continue: The kernel is in charge');
  });

  test('every puzzle after the first shows its building blocks, and they link to earlier puzzles', async ({ page }) => {
    for (const c of COURSES) for (const slug of c.puzzles.slice(1)) {
      await page.goto(`/course/${c.id}/${slug}.html`);
      await expect(page.locator('.builds-on:not(.from-other)')).toHaveCount(1);
      const links = page.locator('.builds-on li a');
      for (const href of await links.evaluateAll(as => as.map(a => a.getAttribute('href')))) expect(c.puzzles.indexOf(href.replace(/\.html$/, ''))).toBeLessThan(c.puzzles.indexOf(slug));
    }
  });

  test('a module check marks the puzzles you answered right, and points to the first one you missed', async ({ page }) => {
    await page.goto('/course/ble/check-1.html');
    const qs = page.locator('fieldset.quiz');
    const n = await qs.count();
    for (let i = 0; i < n; i++) await qs.nth(i).locator(i === 1 ? 'input:not([data-ok]) + label' : 'input[data-ok] + label').first().click();
    await expect(page.locator('.check-result')).toContainText('Start with puzzle 1');
    await page.goto('/course/ble/');
    await expect(page.locator('.modules li[data-n="0"]')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('.modules li[data-n="1"]')).toHaveAttribute('data-state', 'next');
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
    await expect(page.locator('.gate')).toContainText('Building blocks to review');
    await expect(page.locator('.gate a')).toHaveAttribute('href', new RegExp(`${PUZZLES[2]}\\.html$`));
  });

  test('every course offers an Obsidian vault that is a real zip with a note per puzzle', async ({ page, request }) => {
    for (const c of COURSES) {
      await page.goto(`/course/${c.id}/`);
      const link = page.locator(`a[href="${c.id}-obsidian.zip"][download]`);
      await expect(link).toBeVisible();
      const res = await request.get(`/course/${c.id}/${c.id}-obsidian.zip`);
      expect(res.status()).toBe(200);
      const body = await res.body();
      expect(body.subarray(0, 2).toString()).toBe('PK');
      // The zip's central directory lists one "NN Title.md" note per puzzle.
      const names = [];
      for (let i = body.indexOf('PK\x01\x02', 0, 'latin1'); i !== -1; i = body.indexOf('PK\x01\x02', i + 4, 'latin1')) names.push(body.toString('utf8', i + 46, i + 46 + body.readUInt16LE(i + 28)));
      expect(names.filter(n => /\/\d\d [^/]+\.md$/.test(n)).length, c.id).toBe(c.puzzles.length);
    }
  });

  test('Continue with Claude writes a tutor prompt from your progress and weak spots', async ({ page }) => {
    await page.goto(`/course/kmp/`);
    await page.evaluate(() => {
      localStorage.setItem('course:kmp:done', JSON.stringify(['one-kotlin-many-machines', 'what-every-target-has']));
      localStorage.setItem('course:kmp:missed', JSON.stringify([{ s: 'what-every-target-has', q: 'A weak spot question?' }]));
    });
    await page.reload();
    await page.locator('[data-tutor="kmp"]').click();
    const prompt = page.locator('.tutor-prompt');
    await expect(prompt).toBeVisible();
    const text = await prompt.inputValue();
    expect(text).toContain('Kotlin Multiplatform');
    expect(text).toMatch(/✓ 0\. /);
    expect(text).toMatch(/· 2\. /);
    expect(text).toContain('Puzzle 1: A weak spot question?');
    expect(text).toContain('next is puzzle 2');
    await expect(page.locator('.tutor-status')).not.toBeEmpty();
  });

  test('KMP can resume from the catalog and optional depth has its own reveal', async ({ page }) => {
    const [first, next] = COURSES.find(c => c.id === 'kmp').puzzles;
    await page.goto(`/course/kmp/${first}.html#go-deeper-how-does-a-processor-add-two-numbers`);
    const depth = page.locator('.depth-puzzle').first();
    await expect(depth).toHaveAttribute('open', '');
    await expect(depth.locator('.recall p')).toBeHidden();
    await depth.locator('.recall summary').click();
    await expect(depth.locator('.recall p')).toContainText('the second gets 5');
    await expect(depth.getByRole('link', { name: 'Back to the main puzzle' })).toHaveAttribute('href', '#the-building-block');

    await page.evaluate(() => localStorage.setItem('course:kmp:done', JSON.stringify(['one-kotlin-many-machines'])));
    await page.goto('/course/');
    const card = page.locator('.course-card[data-progress="kmp"]');
    await expect(card.locator('progress')).toHaveAttribute('value', '1');
    await expect(card.getByRole('link', { name: 'Continue learning' })).toHaveAttribute('href', `kmp/${next}.html`);
  });

  test('a wrong answer is remembered as a weak spot', async ({ page }) => {
    await page.goto(`/course/kmp/${COURSES.find(c => c.id === 'kmp').puzzles[0]}.html`);
    await page.locator('fieldset.quiz').first().locator('input:not([data-ok]) + label').first().click();
    const missed = await page.evaluate(() => JSON.parse(localStorage.getItem('course:kmp:missed') || '[]'));
    expect(missed.length).toBe(1);
    expect(missed[0].s).toBe('one-kotlin-many-machines');
  });

  test('Your learning shows progress, what to learn next, and weak spots', async ({ page }) => {
    await page.goto('/course/me.html');
    await expect(page.locator('.me-next li')).not.toHaveCount(0);
    await page.evaluate(() => {
      localStorage.setItem('course:kmp:done', JSON.stringify(['one-kotlin-many-machines', 'what-every-target-has']));
      localStorage.setItem('course:kmp:missed', JSON.stringify([{ s: 'what-every-target-has', q: 'A weak spot?' }]));
    });
    await page.reload();
    await expect(page.locator('.me-next li').first()).toContainText(/./);
    await expect(page.locator('.me-next a').first()).toHaveAttribute('href', /^kmp\/02-/);
    await expect(page.locator('.me-weak')).toContainText('A weak spot?');
    await expect(page.locator('.me-courses progress').first()).toBeAttached();
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
    await page.goto(`/course/android/16-the-main-threads-queue.html`);
    const ref = page.locator('.ref', { has: page.locator(':scope > code', { hasText: /^Looper\.loop\(\)$/ }) }).first();
    await expect(ref.locator('.pop')).toBeHidden();
    await ref.hover();
    await expect(ref.locator('.pop')).toBeVisible();
    await expect(ref.locator('.pop-code')).toContainText('for (;;)');
    expect(await ref.locator('.pop a').getAttribute('href')).toMatch(/github\.com\/aosp-mirror\/platform_frameworks_base\/blob\/[0-9a-f]{40}\/.+#L\d+$/);
  });

  test('course pages fit a phone screen', async ({ page }) => {
    for (const p of ['/course/', '/course/android/', ...PUZZLES.map(s => `/course/android/${s}.html`)]) {
      await page.goto(p);
      const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scroll, p).toBeLessThanOrEqual(client);
    }
  });

  test('progress is saved by puzzle name and survives renumbering (old saves migrate)', async ({ page }) => {
    await page.goto('/course/perf/');
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('course:perf:mastered', '[0,1]'); });
    await page.reload();
    // Before the perf course grew, puzzles 0 and 1 were "A photo or a diary" and "Reading the flames".
    await expect(page.locator('.modules li[data-n="2"]')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('.modules li[data-n="3"]')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('.modules li[data-n="0"]')).toHaveAttribute('data-state', 'next');
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem('course:perf:done')))).toEqual(['a-photo-or-a-diary', 'reading-the-flames']);
  });
});
