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

  test('core sections are present in the DOM', async ({ page }) => {
    await page.goto('/');
    const ids = ['hero', 'work', 'bar', 'stack', 'timeline', 'signal', 'lab', 'contact'];
    for (const id of ids) {
      await expect(page.locator(`#${id}`), `#${id} should be in the DOM`).toBeAttached();
    }
  });

  test('consultant chrome is removed', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#avail-badge')).toHaveCount(0);
    await expect(page.locator('#fixed-cta')).toHaveCount(0);
    await expect(page.locator('#qb-trigger')).toHaveCount(0);
    await expect(page.locator('#qb-panel')).toHaveCount(0);
    await expect(page.locator('#tama')).toHaveCount(0);
    await expect(page.locator('#how-i-work')).toHaveCount(0);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/€\s*600/);
    expect(bodyText.toLowerCase()).not.toContain('book a call');
  });

  test('section labels cover the new IA', async ({ page }) => {
    await page.goto('/');
    const labels = await page.locator('.section-label').allTextContents();
    expect(labels.some(l => /selected work/i.test(l))).toBe(true);
    expect(labels.some(l => /on a team/i.test(l))).toBe(true);
    expect(labels.some(l => /stack/i.test(l))).toBe(true);
    expect(labels.some(l => /timeline/i.test(l))).toBe(true);
    expect(labels.some(l => /signal/i.test(l))).toBe(true);
    expect(labels.some(l => /lab/i.test(l))).toBe(true);
    expect(labels.some(l => /contact/i.test(l))).toBe(true);
  });
});

// ─── Hero ──────────────────────────────────────────────────────────────────

test.describe('Hero Section', () => {
  test('renders full name as brand', async ({ page }) => {
    await page.goto('/');
    const heading = page.locator('#hero-name');
    await expect(heading).toContainText('Mateusz');
    await expect(heading).toContainText('Pachulski');
  });

  test('"Get in touch" CTA links to #contact', async ({ page }) => {
    await page.goto('/');
    const cta = page.locator('.hero-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '#contact');
    await expect(cta).toContainText(/get in touch/i);
  });

  test('availability line mentions remote EU', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-avail')).toContainText(/remote EU/i);
  });

  test('LinkedIn link is present in hero', async ({ page }) => {
    await page.goto('/');
    const linkedin = page.locator('#hero a[href*="linkedin.com/in/mateusz-pachulski"]');
    await expect(linkedin.first()).toBeVisible();
  });
});

// ─── Selected Work ─────────────────────────────────────────────────────────

test.describe('Selected Work', () => {
  test('features Arrive/EasyPark, Santander, and Wire', async ({ page }) => {
    await page.goto('/');
    const names = await page.locator('#work .work-name').allTextContents();
    expect(names.some(n => /Arrive|EasyPark/i.test(n))).toBe(true);
    expect(names.some(n => /Santander/i.test(n))).toBe(true);
    expect(names.some(n => /Wire/i.test(n))).toBe(true);
  });

  test('does not feature FitCrony as a case study', async ({ page }) => {
    await page.goto('/');
    const names = await page.locator('#work .work-name').allTextContents();
    expect(names.some(n => /FitCrony/i.test(n))).toBe(false);
  });
});

// ─── Raise the bar ─────────────────────────────────────────────────────────

test.describe('Raise the bar', () => {
  test('section heading is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#bar-heading')).toContainText(/raise the bar/i);
  });

  test('lists four focus areas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#bar .bar-item')).toHaveCount(4);
  });
});

// ─── Signal & Lab ──────────────────────────────────────────────────────────

test.describe('Signal & Lab', () => {
  test('loads curated Signal links from signal.json', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#signal-list .signal-item').first()).toBeVisible({ timeout: 5000 });
    const count = await page.locator('#signal-list .signal-item').count();
    expect(count).toBeGreaterThanOrEqual(5);
    const firstHref = await page.locator('#signal-list .signal-link').first().getAttribute('href');
    expect(firstHref).toMatch(/^https?:\/\//);
  });

  test('Lab strip has experiment items', async ({ page }) => {
    await page.goto('/');
    const count = await page.locator('#lab .lab-item').count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

// ─── Contact ───────────────────────────────────────────────────────────────

test.describe('Contact Section', () => {
  test('exposes email, phone, and LinkedIn', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#contact a[href="mailto:mateusz@pachulski.dev"]')).toBeAttached();
    await expect(page.locator('#contact a[href="tel:+47789174023"]')).toBeAttached();
    await expect(page.locator('#contact a[href*="linkedin.com/in/mateusz-pachulski"]')).toBeAttached();
  });

  test('does not show a day rate', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('#contact').innerText();
    expect(text).not.toMatch(/€|\$\d|\/day/i);
  });
});

// ─── SEO assets ────────────────────────────────────────────────────────────

test.describe('SEO assets', () => {
  test('robots.txt and sitemap.xml are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain('Sitemap:');

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain('https://pachulski.dev/');
  });

  test('og-image.png is available', async ({ request }) => {
    const res = await request.get('/og-image.png');
    expect(res.ok()).toBeTruthy();
    expect(res.headers()['content-type'] || '').toMatch(/image\/png/);
  });

  test('meta description mentions 8+ years and key companies', async ({ page }) => {
    await page.goto('/');
    const desc = await page.$eval('meta[name="description"]', el => el.getAttribute('content'));
    expect(desc).toMatch(/8\+/);
    expect(desc).toMatch(/Santander/i);
    expect(desc).toMatch(/Wire/i);
    expect(desc).toMatch(/EasyPark/i);
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
  test('navigation includes Work, Stack, Signal, and Contact', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('.footer-nav');
    await expect(nav.locator('a[href="#work"]')).toBeAttached();
    await expect(nav.locator('a[href="#stack"]')).toBeAttached();
    await expect(nav.locator('a[href="#signal"]')).toBeAttached();
    await expect(nav.locator('a[href="#contact"]')).toBeAttached();
  });
});

// ─── Mobile Layout ─────────────────────────────────────────────────────────

test.describe('Mobile Layout', () => {
  test('desktop-only terminal widgets are hidden on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    await expect(page.locator('#terminal')).toBeHidden();
    await expect(page.locator('#term-trigger')).toBeHidden();
  });

  test('hero CTA is full-width on mobile', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    const cta = page.locator('.hero-cta');
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    const viewport = page.viewportSize();
    expect(box.width).toBeGreaterThan(viewport.width * 0.7);
  });
});

// ─── Desktop Layout ────────────────────────────────────────────────────────

test.describe('Desktop Layout', () => {
  test('terminal trigger button is visible', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.goto('/');
    await expect(page.locator('#term-trigger')).toBeVisible();
  });

  test('light craft theme is applied (not dark Inter/amber)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.goto('/');
    const styles = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return {
        bg: cs.backgroundColor,
        font: cs.fontFamily,
        accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
      };
    });
    expect(styles.font.toLowerCase()).not.toContain('inter');
    expect(styles.accent.toLowerCase()).not.toBe('#f59e0b');
    // light background: rgb channels should be high
    const m = styles.bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    expect(m).toBeTruthy();
    const [, r, g, b] = m.map(Number);
    expect((r + g + b) / 3).toBeGreaterThan(180);
  });
});
