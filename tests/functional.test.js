'use strict';

const { test, expect } = require('@playwright/test');

// ─── Site Structure ────────────────────────────────────────────────────────

test.describe('Site Structure', () => {
  test('page title contains full name, not "MP Tech"', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title, 'title should not contain "MP Tech"').not.toContain('MP Tech');
    expect(title, 'title should include full name').toContain('Mateusz Pachulski');
  });

  test('favicon uses SVG data URI with MP initials', async ({ page }) => {
    await page.goto('/');
    const href = await page.$eval('link[rel="icon"]', el => el.getAttribute('href'));
    expect(href, 'favicon href should be SVG').toContain('svg');
    expect(href, 'favicon should contain "MP" initials').toContain('MP');
  });

  test('all 7 sections are present in the DOM', async ({ page }) => {
    await page.goto('/');
    const ids = ['hero', 'case-studies', 'services', 'how-i-work', 'stack', 'timeline', 'contact'];
    for (const id of ids) {
      await expect(page.locator(`#${id}`), `#${id} should be in the DOM`).toBeAttached();
    }
  });

  test('section labels are correctly numbered 01–07', async ({ page }) => {
    await page.goto('/');
    const labels = await page.locator('.section-label').allTextContents();
    // Services = 03, Process = 04, Stack = 05, Experience = 06, Contact = 07
    expect(labels.some(l => l.includes('03'))).toBe(true);
    expect(labels.some(l => l.includes('04'))).toBe(true);
    expect(labels.some(l => l.includes('05'))).toBe(true);
    expect(labels.some(l => l.includes('06'))).toBe(true);
    expect(labels.some(l => l.includes('07'))).toBe(true);
  });
});

// ─── Hero ──────────────────────────────────────────────────────────────────

test.describe('Hero Section', () => {
  test('renders full name', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('#hero-name');
    await expect(heading).toContainText('Mateusz');
    await expect(heading).toContainText('Pachulski');
  });

  test('"Book a discovery call" CTA links to #contact', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('.hero-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '#contact');
  });

  test('availability badge is shown', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.avail-hero')).toBeVisible();
  });
});

// ─── Services ──────────────────────────────────────────────────────────────

test.describe('Services Section', () => {
  test('lists at least 9 services', async ({ page }) => {
    await page.goto('/');
    const count = await page.locator('#services .service-item').count();
    expect(count).toBeGreaterThanOrEqual(9);
  });

  test('includes MVP & Speed-to-Market service', async ({ page }) => {
    await page.goto('/');
    const names = await page.locator('#services .svc-name').allTextContents();
    expect(names.some(t => t.includes('MVP'))).toBe(true);
  });
});

// ─── How I Work ────────────────────────────────────────────────────────────

test.describe('How I Work Section', () => {
  test('section heading is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#hiw-heading')).toContainText('How I Work');
  });

  test('contains exactly 5 process steps', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#how-i-work .process-step')).toHaveCount(5);
  });

  test('step names cover the full process', async ({ page }) => {
    await page.goto('/');
    const names = await page.locator('#how-i-work .step-name').allTextContents();
    expect(names.some(n => n.includes('Discovery'))).toBe(true);
    expect(names.some(n => n.includes('Proposal'))).toBe(true);
    expect(names.some(n => n.includes('Delivery'))).toBe(true);
    expect(names.some(n => n.includes('Handover'))).toBe(true);
    expect(names.some(n => n.includes('Support'))).toBe(true);
  });
});

// ─── Contact ───────────────────────────────────────────────────────────────

test.describe('Contact Section', () => {
  test('form has all required fields', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#firstName')).toBeAttached();
    await expect(page.locator('#email')).toBeAttached();
    await expect(page.locator('#message')).toBeAttached();
  });

  test('email field is required', async ({ page }) => {
    await page.goto('/');
    const attr = await page.locator('#email').getAttribute('required');
    expect(attr).not.toBeNull();
  });
});

// ─── LinkedIn / Open Graph Meta Tags ──────────────────────────────────────

test.describe('LinkedIn / Open Graph Meta Tags', () => {
  test('og:url is set to canonical domain', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:url"]', el => el.getAttribute('content'));
    expect(content).toBe('https://pachulski.dev');
  });

  test('og:image is set', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:image"]', el => el.getAttribute('content'));
    expect(content, 'og:image should be an absolute URL').toMatch(/^https?:\/\//);
  });

  test('og:image:width and og:image:height are present', async ({ page }) => {
    await page.goto('/');
    const width  = await page.$eval('meta[property="og:image:width"]',  el => el.getAttribute('content'));
    const height = await page.$eval('meta[property="og:image:height"]', el => el.getAttribute('content'));
    expect(Number(width),  'og:image:width should be >= 1200').toBeGreaterThanOrEqual(1200);
    expect(Number(height), 'og:image:height should be >= 630').toBeGreaterThanOrEqual(630);
  });

  test('og:image:alt is set', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:image:alt"]', el => el.getAttribute('content'));
    expect(content, 'og:image:alt should not be empty').toBeTruthy();
  });

  test('og:site_name is present', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:site_name"]', el => el.getAttribute('content'));
    expect(content, 'og:site_name should not be empty').toBeTruthy();
  });

  test('og:locale is set to en_US', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[property="og:locale"]', el => el.getAttribute('content'));
    expect(content).toBe('en_US');
  });
});

// ─── Security Meta Tags ────────────────────────────────────────────────────

test.describe('Security Meta Tags', () => {
  test('X-Content-Type-Options is nosniff', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[http-equiv="X-Content-Type-Options"]', el => el.getAttribute('content'));
    expect(content).toBe('nosniff');
  });

  test('referrer policy is strict-origin-when-cross-origin', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[name="referrer"]', el => el.getAttribute('content'));
    expect(content).toBe('strict-origin-when-cross-origin');
  });

  test('Content-Security-Policy meta tag is present', async ({ page }) => {
    await page.goto('/');
    const content = await page.$eval('meta[http-equiv="Content-Security-Policy"]', el => el.getAttribute('content'));
    expect(content, 'CSP should include default-src').toContain('default-src');
    expect(content, 'CSP should block object-src with none').toContain("object-src 'none'");
    expect(content, 'CSP should set frame-ancestors').toContain('frame-ancestors');
  });
});

// ─── Footer ────────────────────────────────────────────────────────────────

test.describe('Footer', () => {
  test('navigation includes a Process link to #how-i-work', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.footer-nav a[href="#how-i-work"]')).toBeAttached();
  });

  test('navigation includes Services, Stack and Contact links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('.footer-nav');
    await expect(nav.locator('a[href="#services"]')).toBeAttached();
    await expect(nav.locator('a[href="#stack"]')).toBeAttached();
    await expect(nav.locator('a[href="#contact"]')).toBeAttached();
  });
});

// ─── Mobile Layout ─────────────────────────────────────────────────────────

test.describe('Mobile Layout', () => {
  test('desktop-only widgets are hidden on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    await expect(page.locator('#cursor')).toBeHidden();
    await expect(page.locator('#terminal')).toBeHidden();
    await expect(page.locator('#term-trigger')).toBeHidden();
    await expect(page.locator('#tama')).toBeHidden();
    await expect(page.locator('#qb-trigger')).toBeHidden();
  });

  test('hero CTA is full-width on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    const cta = page.locator('.hero-cta');
    await expect(cta).toBeVisible();
    const box      = await cta.boundingBox();
    const viewport = page.viewportSize();
    expect(box.width).toBeGreaterThan(viewport.width * 0.7);
  });

  test('services grid is single-column on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    const gridColumns = await page.locator('.services-list').evaluate(el =>
      getComputedStyle(el).gridTemplateColumns
    );
    // single-column → only one track value
    expect(gridColumns.trim().split(/\s+/).length).toBe(1);
  });
});

// ─── Desktop Layout ────────────────────────────────────────────────────────

test.describe('Desktop Layout', () => {
  test('terminal trigger button is visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.goto('/');
    await expect(page.locator('#term-trigger')).toBeVisible();
  });

  test('tamagotchi mascot is visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.goto('/');
    await expect(page.locator('#tama')).toBeVisible();
  });

  test('fixed CTA is visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.goto('/');
    await expect(page.locator('#fixed-cta')).toBeVisible();
  });
});

// ─── Click Tracker ─────────────────────────────────────────────────────────

test.describe('Click Tracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear any leftover stats between tests
    await page.evaluate(() => localStorage.removeItem('pachulski_click_stats'));
  });

  test('recordClick stores an entry in localStorage', async ({ page }) => {
    await page.evaluate(() => {
      recordClick('Test: click');
    });
    const stats = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pachulski_click_stats') || '{}')
    );
    expect(stats['Test: click']).toBeDefined();
    expect(stats['Test: click'].count).toBe(1);
  });

  test('recordClick increments count on repeated clicks', async ({ page }) => {
    await page.evaluate(() => {
      recordClick('Test: repeat');
      recordClick('Test: repeat');
      recordClick('Test: repeat');
    });
    const stats = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pachulski_click_stats') || '{}')
    );
    expect(stats['Test: repeat'].count).toBe(3);
  });

  test('getClickStats returns empty object when nothing recorded', async ({ page }) => {
    const stats = await page.evaluate(() => getClickStats());
    expect(stats).toEqual({});
  });

  test('CTA click records "CTA: Book a discovery call"', async ({ page }) => {
    // Click the hero CTA
    await page.locator('.hero-cta').click();
    const stats = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pachulski_click_stats') || '{}')
    );
    expect(stats['CTA: Book a discovery call']).toBeDefined();
    expect(stats['CTA: Book a discovery call'].count).toBeGreaterThanOrEqual(1);
  });

  test('email link click records "Contact: Email"', async ({ page }) => {
    // Intercept navigation to avoid leaving the page
    await page.route('**/*', route => route.continue());
    await page.evaluate(() => {
      document.querySelector('a[href^="mailto:"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const stats = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pachulski_click_stats') || '{}')
    );
    expect(stats['Contact: Email']).toBeDefined();
    expect(stats['Contact: Email'].count).toBeGreaterThanOrEqual(1);
  });

  test('case study stat click records correct label', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelector('.cs-stat').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    const stats = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('pachulski_click_stats') || '{}')
    );
    const keys = Object.keys(stats);
    expect(keys.some(k => k.startsWith('Stat:'))).toBe(true);
  });

  test('terminal stats command shows "No clicks recorded yet" when empty', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    // Open terminal
    await page.locator('#term-trigger').click();
    await page.locator('#term-input').fill('stats');
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.getElementById('term-output').textContent.includes('No clicks recorded'),
      { timeout: 5000 }
    );
    const output = await page.locator('#term-output').textContent();
    expect(output).toContain('No clicks recorded');
  });

  test('terminal stats command shows recorded clicks', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    // Pre-populate stats
    await page.evaluate(() => {
      recordClick('CTA: Book a discovery call');
      recordClick('CTA: Book a discovery call');
      recordClick('Contact: Email');
    });
    // Open terminal and run stats
    await page.locator('#term-trigger').click();
    await page.locator('#term-input').fill('stats');
    await page.keyboard.press('Enter');
    // Wait until the expected label is fully typed out
    await page.waitForFunction(
      () => document.getElementById('term-output').textContent.includes('CTA: Book a discovery call'),
      { timeout: 5000 }
    );
    const output = await page.locator('#term-output').textContent();
    expect(output).toContain('2x');
    expect(output).toContain('CTA: Book a discovery call');
  });

  test('terminal help lists the stats command', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.locator('#term-trigger').click();
    await page.locator('#term-input').fill('help');
    await page.keyboard.press('Enter');
    // Wait until "stats" line is typed out
    await page.waitForFunction(
      () => document.getElementById('term-output').textContent.includes('stats'),
      { timeout: 8000 }
    );
    const output = await page.locator('#term-output').textContent();
    expect(output).toContain('stats');
  });
});
