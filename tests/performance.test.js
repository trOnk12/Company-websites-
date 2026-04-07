'use strict';

const { test, expect } = require('@playwright/test');

/**
 * Collect Core Web Vitals via the browser's Performance API.
 * Called after waitForLoadState('load') + a short settle delay so
 * LCP and CLS observers have time to fire.
 */
async function collectVitals(page) {
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  return page.evaluate(() => {
    const vitals = { fcp: null, lcp: null, cls: 0, domContentLoaded: null, loadTime: null };

    // First Contentful Paint
    for (const e of performance.getEntriesByType('paint')) {
      if (e.name === 'first-contentful-paint') vitals.fcp = e.startTime;
    }

    // Navigation timing
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) {
      vitals.domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;
      vitals.loadTime         = nav.loadEventEnd - nav.fetchStart;
    }

    // Largest Contentful Paint (buffered, available after load)
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length) vitals.lcp = lcpEntries[lcpEntries.length - 1].startTime;
    } catch (_) { /* not supported in this browser */ }

    // Cumulative Layout Shift (buffered)
    try {
      vitals.cls = performance
        .getEntriesByType('layout-shift')
        .filter(e => !e.hadRecentInput)
        .reduce((sum, e) => sum + e.value, 0);
    } catch (_) { /* not supported */ }

    return vitals;
  });
}

test.describe('Performance', () => {
  test('page load completes within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('load');
    const elapsed = Date.now() - start;
    expect(elapsed, `Page load took ${elapsed}ms`).toBeLessThan(5000);
  });

  test('DOM Content Loaded within 3 seconds', async ({ page }) => {
    await page.goto('/');
    const vitals = await collectVitals(page);
    if (vitals.domContentLoaded !== null) {
      expect(
        vitals.domContentLoaded,
        `DOMContentLoaded: ${vitals.domContentLoaded.toFixed(0)}ms`
      ).toBeLessThan(3000);
    }
  });

  test('First Contentful Paint within 3 seconds', async ({ page }) => {
    await page.goto('/');
    const vitals = await collectVitals(page);
    if (vitals.fcp !== null) {
      expect(vitals.fcp, `FCP: ${vitals.fcp.toFixed(0)}ms`).toBeLessThan(3000);
    }
  });

  test('Largest Contentful Paint within 4 seconds', async ({ page }) => {
    await page.goto('/');
    const vitals = await collectVitals(page);
    if (vitals.lcp !== null) {
      expect(vitals.lcp, `LCP: ${vitals.lcp.toFixed(0)}ms`).toBeLessThan(4000);
    }
  });

  test('Cumulative Layout Shift below 0.1', async ({ page }) => {
    await page.goto('/');
    const vitals = await collectVitals(page);
    expect(vitals.cls, `CLS: ${vitals.cls.toFixed(4)}`).toBeLessThan(0.1);
  });

  test('no render-blocking scripts in <head>', async ({ page }) => {
    await page.goto('/');
    const blockingCount = await page.evaluate(() =>
      document.querySelectorAll('head script[src]:not([defer]):not([async])').length
    );
    expect(blockingCount, 'render-blocking <script> tags found in <head>').toBe(0);
  });

  test('no critical resource loading failures', async ({ page }) => {
    const failed = [];
    page.on('requestfailed', req => {
      const url = req.url();
      // External font CDNs may be unavailable in test environments – ignore them
      if (
        !url.includes('fonts.googleapis.com') &&
        !url.includes('fonts.gstatic.com')
      ) {
        failed.push(url);
      }
    });
    // networkidle can timeout on font requests; catch and still assert
    await page.goto('/', { waitUntil: 'load' });
    expect(failed, `Failed resources: ${failed.join(', ')}`).toHaveLength(0);
  });

  test('CSS and JS assets respond with 200', async ({ page }) => {
    const assetStatuses = {};
    page.on('response', res => {
      const url = res.url();
      if (url.endsWith('.css') || url.endsWith('.js')) {
        assetStatuses[url] = res.status();
      }
    });
    await page.goto('/');
    for (const [url, status] of Object.entries(assetStatuses)) {
      expect(status, `${url} returned ${status}`).toBe(200);
    }
  });
});
