'use strict';

const { test, expect } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');

test('each course leads from its outline and final lesson to its own worked project', async ({ page }) => {
  const source = path.join(__dirname, '..', '_course');
  for (const id of fs.readdirSync(source)) {
    const metadata = path.join(source, id, 'course.json');
    if (!fs.existsSync(metadata)) continue;
    const course = JSON.parse(fs.readFileSync(metadata, 'utf8'));
    const project = JSON.parse(fs.readFileSync(path.join(source, id, 'practicum.json'), 'utf8'));
    const lessons = course.modules.flatMap(module => module.puzzles);
    await page.goto('/course/' + id + '/');
    await page.getByRole('link', { name: project.title, exact: true }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
    await page.getByText('Compare with a worked review', { exact: true }).click();
    await expect(page.getByText(project.worked[0], { exact: true })).toBeVisible();
    await page.goto('/course/' + id + '/' + lessons.at(-1).replace('.md', '.html'));
    await expect(page.getByRole('link', { name: 'Start the final project' })).toHaveAttribute('href', 'final-project.html');
  }
});
