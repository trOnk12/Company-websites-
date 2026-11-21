'use strict';

const { test, expect } = require('@playwright/test');

test('run, change, repair and restore the reservation contract in its lesson', async ({ page }) => {
  await page.goto('/course/system-design/00-promise.html');
  await page.getByRole('link', { name: 'Run SQL', exact: true }).click();
  const exercise = page.locator('[data-sql-exercise]');
  const run = exercise.getByRole('button', { name: 'Run SQL' });
  const status = exercise.getByRole('status');
  await run.click();
  await expect(exercise.getByRole('cell', { name: 'evening' })).toBeVisible();
  await exercise.getByRole('button', { name: 'Edit SQL' }).click();
  const editor = exercise.getByRole('textbox', { name: 'SQL to run' });
  const original = await editor.inputValue();
  await editor.fill(original.replace("'Ben', 'B12', 1", "'Ben', 'B12', 0"));
  await run.click();
  await expect(exercise.getByText('No rows matched.')).toBeVisible();
  await editor.fill('SELECT FROM');
  await run.click();
  await expect(status).toContainText('SQLite:');
  await exercise.getByRole('button', { name: 'Restore original SQL' }).click();
  await expect(editor).toHaveValue(original);
  await run.click();
  await expect(exercise.getByRole('cell', { name: 'evening' })).toBeVisible();
});

test('duplicate delivery leaves one effect and rollback leaves zero', async ({ page }) => {
  await page.goto('/course/system-design/07-outbox.html');
  const exercise = page.locator('[data-sql-exercise]').nth(1);
  await exercise.getByRole('button', { name: 'Run SQL' }).click();
  await expect(exercise.getByRole('table')).toHaveCount(2);
  await expect(exercise.getByRole('cell')).toHaveText(['0', '1', '1']);
});

test('changing the transaction outcome changes the lock diagram and its explanation', async ({ page }) => {
  await page.goto('/course/system-design/03-conditional-write.html');
  const figure = page.locator('.stepper').first();
  await figure.getByRole('combobox', { name: 'Ada’s transaction' }).selectOption('changed');
  await expect(figure.locator('.diagram-prediction')).toBeVisible();
  await figure.getByRole('button', { name: 'One row', exact: true }).click();
  await figure.getByRole('button', { name: 'Reveal next step' }).click();
  await expect(figure.locator('.caps .changed-outcome').filter({ hasText: 'Ada rolls back.' })).toBeVisible();
  await figure.locator('.dots label').last().click();
  await expect(figure.getByText('Grant: Ben', { exact: true })).toBeVisible();
  await figure.getByRole('combobox').selectOption('original');
  await figure.getByRole('button', { name: 'Zero rows', exact: true }).click();
  await figure.getByRole('button', { name: 'Reveal next step' }).click();
  await figure.locator('.dots label').last().click();
  await expect(figure.getByText('Grant: Ada', { exact: true })).toBeVisible();
  await expect(figure.getByText('Grant: Ben', { exact: true })).toBeHidden();
  expect(await figure.locator('.stage').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});

test('committing the losing reservation exposes two grants despite the same free count', async ({ page }) => {
  await page.goto('/course/system-design/03-conditional-write.html');
  const exercise = page.locator('[data-sql-exercise]').first();
  await exercise.getByRole('button', { name: 'Run SQL' }).click();
  const results = exercise.locator('[data-output] table');
  await expect(results).toHaveCount(3);
  await expect(results.nth(0)).toHaveAccessibleName('Result 1 · 1 row');
  await expect(results.nth(1)).toHaveAccessibleName('Result 2 · 0 rows');
  await expect(results.nth(0).getByRole('cell')).toHaveText(['0']);
  await expect(results.nth(1).getByRole('cell')).toHaveCount(0);
  await expect(results.nth(2).getByRole('cell')).toHaveText(['Ada', '0']);
  await exercise.getByRole('button', { name: 'Edit SQL' }).click();
  const editor = exercise.getByRole('textbox', { name: 'SQL to run' });
  await editor.fill((await editor.inputValue()).replace('ROLLBACK;', 'COMMIT;'));
  await exercise.getByRole('button', { name: 'Run SQL' }).click();
  await expect(results.nth(2).getByRole('cell')).toHaveText(['Ada', '0', 'Ben', '0']);
});

test('the same history page survives all three access plans', async ({ page }) => {
  await page.goto('/course/system-design/05-history.html');
  await page.locator('summary').filter({ hasText: 'Can the database find the right page with less work?' }).click();
  const exercise = page.locator('[data-sql-exercise]').nth(1);
  const run = exercise.getByRole('button', { name: 'Run SQL' });
  const tables = exercise.getByRole('table');
  await run.click();
  await expect(tables.nth(0)).toContainText('TEMP B-TREE');
  await expect(tables.nth(1).getByRole('cell')).toHaveText(['7']);
  await expect(tables.nth(2)).toContainText('COVERING INDEX');
  await expect(tables.nth(2)).not.toContainText('TEMP B-TREE');
  await expect(tables.nth(3).getByRole('cell')).toHaveText(['7']);
  await exercise.getByRole('button', { name: 'Edit SQL' }).click();
  const editor = exercise.getByRole('textbox', { name: 'SQL to run' });
  await editor.fill((await editor.inputValue()).replace('ON history(owner, started DESC, id DESC)', 'ON history(owner)'));
  await run.click();
  await expect(tables.nth(2)).toContainText('TEMP B-TREE');
  await expect(tables.nth(3).getByRole('cell')).toHaveText(['7']);
});

test('move the commit boundary and observe a reservation without an event', async ({ page }) => {
  await page.goto('/course/system-design/07-outbox.html');
  const exercise = page.locator('[data-sql-exercise]').first();
  const run = exercise.getByRole('button', { name: 'Run SQL' });
  const counts = exercise.getByRole('table').nth(1).getByRole('cell');
  await run.click();
  await expect(counts).toHaveText(['0', '0']);
  await exercise.getByRole('button', { name: 'Edit SQL' }).click();
  const editor = exercise.getByRole('textbox', { name: 'SQL to run' });
  const committed = (await editor.inputValue()).replace('ROLLBACK;', 'COMMIT;');
  await editor.fill(committed);
  await run.click();
  await expect(counts).toHaveText(['1', '1']);
  await editor.fill(committed.replace('INSERT INTO outbox VALUES (41, 301);', ''));
  await run.click();
  await expect(counts).toHaveText(['1', '0']);
});

test('moving an unseen session above the cursor changes the prediction and the SQL page', async ({ page }) => {
  await page.goto('/course/system-design/05-history.html');
  const figure = page.locator('.stepper').first();
  await figure.getByRole('combobox', { name: 'Between page requests' }).selectOption('changed');
  await figure.getByRole('button', { name: 'Session 7', exact: true }).click();
  await expect(figure.locator('.diagram-prediction [role="status"]')).toContainText('newer than the cursor');
  await figure.getByRole('button', { name: 'No session', exact: true }).click();
  await figure.getByRole('button', { name: 'Reveal next step' }).click();
  await expect(figure.getByText('Cursor: empty', { exact: true })).toBeVisible();
  const exercise = page.locator('[data-sql-exercise]').first();
  await exercise.getByRole('button', { name: 'Edit SQL' }).click();
  const editor = exercise.getByRole('textbox', { name: 'SQL to run' });
  await editor.fill((await editor.inputValue()).replace("INSERT INTO history VALUES ('Ada', 101, 10);", 'UPDATE history SET started = 101 WHERE id = 7;'));
  await exercise.getByRole('button', { name: 'Run SQL' }).click();
  await expect(exercise.getByRole('table').nth(1).getByRole('cell')).toHaveText(['8']);
  await expect(exercise.getByRole('table').nth(3)).toHaveAccessibleName('Result 4 · 0 rows');
});
