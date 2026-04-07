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
