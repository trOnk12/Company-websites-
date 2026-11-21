'use strict';

const { test, expect } = require('./fixtures');

for (const sample of [
  { course: 'backend-ops', slug: '00-request', first: '200', changed: '404' },
  { course: 'jvm', slug: '00-class-file', first: 'Printed: 8', changed: 'Printed: 9' }
]) {
  test(sample.course + ' lesson opens a working browser exercise and returns', async ({ page }) => {
    const path = '/course/' + sample.course + '/' + sample.slug + '.html';
    await page.goto(path);
    await page.getByRole('link', { name: 'Run the browser experiment' }).click();
    await expect(page.locator('#experiment')).toHaveValue(sample.slug);
    const run = page.getByRole('button', { name: 'Run experiment' });
    await run.click();
    await expect(page.locator('#result')).toContainText(sample.first);
    await page.locator('#variant').selectOption('1');
    await run.click();
    await expect(page.locator('#result')).toContainText(sample.changed);
    await page.locator('#lesson').click();
    await expect(page).toHaveURL(new RegExp(path.replaceAll('.', '\\.') + '$'));
  });
}
