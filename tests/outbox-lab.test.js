'use strict';
const { test, expect } = require('./fixtures');

test('replaying an interrupted receipt exposes both lost and repeated effects', async ({page}) => {
  await page.goto('/labs/parking-design/#delivery');
  for (const [protocol, cut, count] of [
    ['atomic','mid',1], ['atomic','ack',1], ['first','mid',0],
    ['first','ack',1], ['none','mid',1], ['none','ack',2]
  ]) {
    await page.getByLabel('Consumer writes').selectOption(protocol);
    await page.getByLabel('First interruption').selectOption(cut);
    await page.getByRole('button', {name:'Interrupt and redeliver'}).click();
    await expect(page.locator('#dispatch button')).toBeEnabled();
    await expect(page.locator('#delivery-output')).toContainText('Grants: 1 · Pending: 0');
    await expect(page.locator('#delivery-output')).toContainText('Receipts: ' + count);
  }
});
