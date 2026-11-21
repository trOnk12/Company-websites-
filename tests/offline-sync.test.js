const { test, expect } = require('@playwright/test');

test('queued offline edits survive reopen in either order and a lost reply is safe', async ({ page }) => {
  await page.goto('/labs/offline-sync/');
  for (const first of ['A', 'B']) {
    for (const reply of ['normal', 'lost']) {
      await page.locator('[name=first]').selectOption(first);
      await page.locator('[name=reply]').selectOption(reply);
      await page.getByRole('button', { name: 'Run sync' }).click();
      const trace = page.locator('#trace');
      const winner = first === 'A' ? 'Trail map' : 'Water stops';
      const other = first === 'A' ? 'B' : 'A';
      await expect(trace).toContainText('Server: ' + winner + ' | version 2 | receipt: ' + first + '-1');
      await expect(trace).toContainText('queue: ' + other + '-1 (conflict)');
      await expect(trace).toContainText('local base version 2 | queue: empty');
      if (reply === 'lost') await expect(trace).toContainText('reply lost after commit');
      else await expect(trace).not.toContainText('reply lost after commit');
    }
  }
});
