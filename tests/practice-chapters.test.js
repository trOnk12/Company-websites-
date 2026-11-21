'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('./fixtures');

test('a practice lesson can be found, attempted and followed to the final project', async ({ page }) => {
  const id = 'android';
  const root = '/course/' + id + '/';
  const chapters = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '_course', id, 'topics.json'), 'utf8'));
  const first = chapters[0];
  const lesson = first.lessons[0];
  await page.goto('/course/');
  await page.getByRole('searchbox').fill(lesson.title);
  const result = page.getByRole('link', { name: lesson.title, exact: true }).and(page.locator(`a[href^="${id}/chapter-"]`));
  await result.first().click();
  await expect(page).toHaveURL(/#lesson-1$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(first.title);
  const section = page.getByRole('region', { name: lesson.title, exact: true });
  const answer = section.locator('details');
  await expect(answer.locator('p').first()).toBeHidden();
  await section.getByText('Compare your answer', { exact: true }).click();
  await expect(answer.locator('p').first()).toBeVisible();
  await expect(section.getByRole('link', { name: lesson.sourceTitle })).toHaveAttribute('href', lesson.source);
  for (const next of chapters.slice(1)) {
    await page.getByRole('navigation', { name: 'Chapter navigation' }).getByRole('link', { name: next.title }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(next.title);
  }
  await page.getByRole('link', { name: 'Start the final project' }).click();
  await expect(page).toHaveURL(root + 'final-project.html');
  await page.goto(root);
  await expect(page.getByRole('link', { name: first.title, exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Copy my tutor prompt' }).click();
  await expect(page.locator('.tutor-prompt')).toHaveValue(new RegExp('Practice chapters with worked examples'));
});
