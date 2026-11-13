'use strict';

// Every test page gets GoatCounter answered locally, so test runs never count as visits.
const base = require('@playwright/test');

const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');

exports.test = base.test.extend({
  page: async ({ page }, use) => {
    await page.route(/goatcounter\.com/, r => r.fulfill({ status: 200, contentType: 'image/gif', body: GIF }));
    await use(page);
  },
});
exports.expect = base.expect;
