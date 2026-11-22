'use strict';

const { test, expect } = require('./fixtures');

test('a learner makes a prediction, gets a hint, then reveals the next event', async ({ page }) => {
  await page.goto('/course/system-design/00-promise.html');
  const figure = page.locator('.stepper');
  const caps = figure.locator('.caps > li');
  await caps.nth(0).locator('label.next').click();
  const prediction = caps.nth(1).locator('.diagram-prediction');
  await prediction.getByRole('button', { name: 'Two requests for B12', exact: true }).click();
  await expect(prediction.getByRole('status')).toContainText('A tap asks');
  await expect(caps.nth(2)).toBeHidden();
  await prediction.getByRole('button', { name: 'Two current bookings for B12', exact: true }).click();
  await caps.nth(1).getByRole('button', { name: 'Reveal next step' }).press('Enter');
  await expect(caps.nth(2)).toBeFocused();
  await expect(caps.nth(2)).toContainText('Ada');
  const reopened = await page.context().newPage();
  await reopened.goto('/course/system-design/00-promise.html');
  await expect(reopened.locator('.caps > li').nth(2)).toBeVisible();
  expect(await reopened.evaluate(() => JSON.parse(localStorage.getItem('course:system-design:done') || '[]'))).toEqual([]);
  await reopened.close();
});

for (const sample of [
  { slug: '15-routing', option: 'Fewest outstanding requests', row: ['3','B','10','10','20','0'] },
  { slug: '16-coalescing', option: 'Shared west read fails', row: ['burst','1','1','unavailable, unavailable, east map'] },
  { slug: '17-circuit-breaker', option: 'Recovery probe fails', row: ['116','next','open','refuse'] },
  { slug: '18-waiter-deadlines', option: 'One caller on each instance', row: ['storage replies','504 timeout','200 west','2'] }
]) {
  test(sample.slug + ' runs the selected implementation and reports the changed outcome', async ({ page }) => {
    await page.goto('/course/system-design/' + sample.slug + '.html');
    await page.getByRole('link', { name: 'Run code' }).click();
    const box = page.locator('[data-read-path]');
    await box.getByRole('combobox').selectOption({ label: sample.option });
    await box.getByRole('button', { name: 'Run scenario' }).click();
    await expect(box.getByRole('status')).toContainText(sample.option);
    expect(await box.locator('tbody tr').evaluateAll(rows =>
      rows.map(row => Array.from(row.cells, c => c.textContent)))).toContainEqual(sample.row);
  });
}

test('finishing the first puzzle resumes at demand after leaving the course', async ({ page }) => {
  await page.goto('/course/system-design/');
  await page.getByRole('link', { name: 'Start learning' }).click();
  await expect(page).toHaveURL(/00-promise\.html$/);
  for (const q of await page.locator('fieldset.quiz').all()) {
    const id = await q.locator('input[data-ok]').getAttribute('id');
    await q.locator('label[for="' + id + '"]').click();
  }
  const next = page.locator('.pager a.primary');
  await expect(next).not.toHaveClass(/locked/);
  await next.click();
  await expect(page).toHaveURL(/01-demand\.html$/);
  const freshTab = await page.context().newPage();
  await freshTab.goto('/course/system-design/');
  await freshTab.locator('[data-resume="system-design"]').click();
  await expect(freshTab).toHaveURL(/01-demand\.html$/);
  await freshTab.close();
});
