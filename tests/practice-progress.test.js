'use strict';

const { test, expect } = require('./fixtures');
const fs = require('node:fs/promises');

test('exercise and project self-checks resume, survive reload and transfer independently of puzzle grades', async ({ page }) => {
  const course = '/course/android/';
  await page.goto(course);
  await page.locator('#practice-chapters + ol a').first().click();
  const chapter = new URL(page.url()).pathname.slice(course.length);
  const exercises = page.locator('input[data-practice-item]');
  await expect(exercises.first()).not.toBeChecked();
  await exercises.first().check();
  await page.reload();
  await expect(exercises.first()).toBeChecked();
  await expect(exercises.nth(1)).not.toBeChecked();
  await page.goto(course);
  const resume = page.locator('[data-resume]');
  await expect(resume).toHaveAttribute('href', chapter + '#lesson-2');
  await expect(page.locator('[data-chapter-status]').first()).toContainText('1/');
  await page.goto('/course/');
  const card = page.locator('[data-progress="android"]');
  await expect(card.getByRole('link', { name: 'Continue learning' })).toHaveAttribute('href', 'android/' + chapter + '#lesson-2');
  await page.goto('/course/me.html');
  await expect(page.locator('.me-next a').first()).toHaveAttribute('href', 'android/' + chapter + '#lesson-2');

  await page.goto(course + 'final-project.html');
  const project = page.locator('[data-practice-item="final-project"]');
  await expect(project).not.toBeChecked();
  await page.goto(course);
  await expect(resume).toHaveAttribute('href', 'final-project.html');
  await resume.click();
  await project.check();
  await page.reload();
  await expect(project).toBeChecked();
  await page.goto(course);
  await expect(page.locator('[data-project-status]')).toHaveText('Self-checked');
  await expect(page.locator('.mastery')).toContainText('0 of');

  await page.goto('/course/me.html');
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save my progress' }).click();
  const downloaded = await saved;
  const data = await fs.readFile(await downloaded.path());
  await page.goto(course);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset my progress' }).click();
  await expect(resume).toHaveText('Start learning');
  await expect(page.locator('[data-project-status]')).toHaveText('Pending self-check');

  await page.goto('/course/me.html');
  await page.locator('[data-import]').setInputFiles({ name: 'progress.json', mimeType: 'application/json', buffer: data });
  await expect(page.locator('.me-course').filter({ has: page.locator('a[href="android/"]') })).toContainText('project self-checked');
  await page.goto(course + chapter);
  await expect(exercises.first()).toBeChecked();
  await exercises.first().uncheck();
  await page.reload();
  await expect(exercises.first()).not.toBeChecked();
});

test('passing every foundation puzzle resumes at practice until all activities have been completed', async ({ page }) => {
  await page.goto('/course/jvm/');
  await page.evaluate(() => localStorage.setItem('course:jvm:done', JSON.stringify(window.COURSE_INDEX.cur.jvm)));
  await page.reload();
  const resume = page.locator('[data-resume]');
  await expect(resume).toHaveAttribute('href', /chapter-.+\.html#lesson-1$/);
  const chapters = await page.locator('#practice-chapters + ol a').evaluateAll(links => links.map(a => a.getAttribute('href')));
  for (const chapter of chapters) {
    await page.goto('/course/jvm/' + chapter);
    for (const item of await page.locator('input[data-practice-item]').all()) await item.check();
  }
  await page.goto('/course/jvm/');
  await expect(resume).toHaveAttribute('href', 'final-project.html');
  await resume.click();
  await page.locator('[data-practice-item="final-project"]').check();
  await page.goto('/course/jvm/');
  await expect(resume).toHaveText('Review from the start');
  await page.goto('/course/');
  await expect(page.locator('[data-progress="jvm"]').getByRole('link', { name: 'Review course' })).toBeVisible();
});
