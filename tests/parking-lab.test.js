'use strict';

const { test, expect } = require('./fixtures');

test.beforeEach(async ({ page }) => {
  await page.goto('/labs/parking-design/');
});

test('the last-space race reports claims from the two database connections', async ({ page }) => {
  const run = page.getByRole('button', { name: 'Run both requests' });
  const output = page.locator('#race-output');
  await run.click();
  await expect(output).toHaveText('Ada: confirmed\nBen: lot full\nCommitted state: 0 free · Claims: Ada');
  await page.getByLabel('First request').selectOption('Ben');
  await run.click();
  await expect(output).toHaveText('Ben: confirmed\nAda: lot full\nCommitted state: 0 free · Claims: Ben');
  await page.getByLabel('Available spaces').selectOption('2');
  await run.click();
  await expect(output).toHaveText('Ben: confirmed\nAda: confirmed\nCommitted state: 0 free · Claims: Ada, Ben');
});

test('a lost reply, new identity and aborted first attempt produce distinct outcomes', async ({ page }) => {
  const run = page.getByRole('button', { name: 'Run retry' });
  const output = page.locator('#retry-output');
  await run.click();
  await expect(output).toContainText('Retry: replayed the existing claim\nCommitted state: 1 free · Claims: Ada-1');
  await page.getByLabel('Retry with').selectOption('new');
  await run.click();
  await expect(output).toContainText('Retry: confirmed\nCommitted state: 0 free · Claims: Ada-1, Ada-2');
  await page.getByLabel('Lose the reply').selectOption('before');
  await run.click();
  await expect(output).toContainText('First call: aborted before commit');
  await expect(output).toContainText('Retry: confirmed\nCommitted state: 1 free · Claims: Ada-2');
});

test('each isolation schedule finishes and can be restarted', async ({ page }) => {
  const next = page.getByRole('button', { name: 'Next event' });
  const trace = page.locator('#trace');
  for (const [schedule, verdict] of [
    ['commit', 'Ada owns the only claim'],
    ['rollback', 'Ben owns the only claim'],
    ['repeatable', 'zero on duty'],
    ['serial', 'one on duty'],
  ]) {
    await page.getByRole('combobox', { name: 'Experiment' }).selectOption(schedule);
    await expect(trace).toContainText('Event 1 of 5');
    for (let i = 0; i < 4; i++) await next.click();
    await expect(trace).toContainText(verdict);
    await expect(next).toBeDisabled();
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(trace).toContainText('Event 1 of 5');
  }
});

test('queue backlog, drops and the design review are available on site', async ({ page }) => {
  const simulate = page.getByRole('button', { name: 'Simulate two minutes' });
  const output = page.locator('#queue-output');
  await simulate.click();
  await expect(output).toHaveText('After peak: 1200 waiting, 0 dropped in total.\nAfter recovery: 0 waiting, 0 dropped in total.');
  await page.getByLabel('Queue limit').fill('300');
  await page.getByLabel('Recovery arrivals/s').fill('100');
  await simulate.click();
  await expect(output).toHaveText('After peak: 300 waiting, 900 dropped in total.\nAfter recovery: 300 waiting, 900 dropped in total.');
  await page.getByRole('link', { name: 'Design review', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Three system design reviews');
  await page.getByRole('link', { name: 'Reservation lab', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run both requests' })).toBeVisible();
});
