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

  test('availability eyebrow sits above the name and mentions remote EU', async ({ page }) => {
    await page.goto('/');
    const eyebrow = page.locator('.hero-eyebrow');
    await expect(eyebrow).toContainText(/remote EU/i);
    const eyebrowBox = await eyebrow.boundingBox();
    const nameBox = await page.locator('#hero-name').boundingBox();
    expect(eyebrowBox.y).toBeLessThan(nameBox.y);
  });

  test('hero status ledger exposes recruiter facts', async ({ page }) => {
    await page.goto('/');
    const status = page.locator('.hero-status');
    await expect(status).toContainText(/EasyPark/i);
    await expect(status).toContainText(/Santander/i);
    await expect(status).toContainText(/EN \/ PL \/ NL/i);
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

  test('outcomes lead with scannable metrics', async ({ page }) => {
    await page.goto('/');
    const metrics = await page.locator('#work .work-outcomes strong').allTextContents();
    expect(metrics.length).toBeGreaterThanOrEqual(5);
    expect(metrics.some(m => /40\+/.test(m))).toBe(true);
    expect(metrics.some(m => /300\+/.test(m))).toBe(true);
  });

  test('intro sentences stay short enough to scan', async ({ page }) => {
    await page.goto('/');
    const descs = await page.locator('#work .work-desc').allTextContents();
    for (const d of descs) {
      expect(d.split(/\s+/).length, `too long: ${d}`).toBeLessThanOrEqual(26);
    }
  });
});

// ─── Contrast ──────────────────────────────────────────────────────────────

test.describe('Contrast', () => {
  test('small accent text meets WCAG AA against the page background', async ({ page }) => {
    await page.goto('/');
    const ratio = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const parse = v => {
        const hex = v.trim().replace('#', '');
        return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
      };
      const lum = ch => ch.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
        .reduce((a, c, i) => a + c * [0.2126, 0.7152, 0.0722][i], 0);
      const l1 = lum(parse(root.getPropertyValue('--accent-deep')));
      const l2 = lum(parse(root.getPropertyValue('--bg')));
      const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
      return (hi + 0.05) / (lo + 0.05);
    });
    expect(ratio, `--accent-deep contrast ratio ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});

// ─── Raise the bar ─────────────────────────────────────────────────────────

test.describe('Raise the bar', () => {
  test('section heading is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#bar-heading')).toContainText(/raise the bar/i);
  });

  test('architecture leads; AI-assisted engineering is present but not ranked first', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#bar .bar-item')).toHaveCount(5);
    const names = await page.locator('#bar .bar-name').allTextContents();
    expect(names[0]).toMatch(/Architecture/i);
    const aiIndex = names.findIndex(n => /AI-assisted/i.test(n));
    expect(aiIndex).toBeGreaterThan(0);
    expect(aiIndex).toBeLessThanOrEqual(2);
  });
});

// ─── AI positioning ────────────────────────────────────────────────────────

test.describe('AI positioning', () => {
  test('hero mentions daily Claude Code workflow', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero-sub')).toContainText(/Claude Code/i);
  });

  test('Claude Code is present but not over-repeated', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('body').innerText();
    const mentions = (text.match(/claude code/gi) || []).length;
    expect(mentions, 'AI should read as practice, not positioning').toBeGreaterThanOrEqual(2);
    expect(mentions, 'too many Claude Code mentions reads as hype').toBeLessThanOrEqual(5);
  });

  test('no defensive AI phrasing', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/not a demo habit/i);
    expect(text).not.toMatch(/not a side experiment/i);
  });
});

// ─── Navigation ────────────────────────────────────────────────────────────

test.describe('Navigation', () => {
  test('sticky nav links to the main sections', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('#site-nav');
    await expect(nav).toBeVisible();
    for (const href of ['#work', '#stack', '#timeline', '#contact']) {
      await expect(nav.locator(`a[href="${href}"]`)).toBeAttached();
    }
  });

  test('nav stays visible after scrolling', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('#site-nav')).toBeInViewport();
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

  test('Lab bench lists concrete experiments', async ({ page }) => {
    await page.goto('/');
    const items = page.locator('#lab .lab-item');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Every experiment carries an honest status, a next step, and tech tags
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await expect(item.locator('.lab-status')).toHaveText(/building|exploring|archived|live/i);
      const next = (await item.locator('.lab-next').innerText()).replace(/^next\s*/i, '').trim();
      expect(next.length, 'each experiment needs a concrete next step').toBeGreaterThan(30);
      expect(await item.locator('.lab-tags li').count()).toBeGreaterThanOrEqual(2);
    }
  });

  test('Lab avoids placeholder filler language', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('#lab').innerText();
    expect(text).not.toMatch(/scratchpad|coming soon|TBD|lorem/i);
  });

  test('Lab claims no links it does not have', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('#lab .lab-item a').evaluateAll(els => els.map(e => e.href));
    for (const href of hrefs) {
      expect(href, 'Lab links must be real, not placeholders').not.toMatch(/example\.com|#$|javascript:/);
    }
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

  test('hero CTA is tappable and left-aligned, not full-bleed', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    const cta = page.locator('.hero-cta');
    await expect(cta).toBeVisible();
    const box = await cta.boundingBox();
    const viewport = page.viewportSize();
    expect(box.height, 'CTA should meet touch target height').toBeGreaterThanOrEqual(44);
    expect(box.width, 'CTA should not span the full viewport').toBeLessThan(viewport.width * 0.9);
  });

  test('secondary CTA shares the left axis with the name', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    const secondary = await page.locator('.hero-secondary').boundingBox();
    const name = await page.locator('#hero-name').boundingBox();
    expect(Math.abs(secondary.x - name.x)).toBeLessThan(8);
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
