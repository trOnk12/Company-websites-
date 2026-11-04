'use strict';

const { test, expect } = require('@playwright/test');

// WCAG contrast ratio between two #RRGGBB colours.
function contrast(a, b) {
  const lum = hex => hex.trim().replace('#', '').match(/../g)
    .map(h => parseInt(h, 16) / 255)
    .map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    .reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0);
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ─── Structure ─────────────────────────────────────────────────────────────

test.describe('Structure', () => {
  test('title contains full name and role', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toContain('Mateusz Pachulski');
    expect(title).toMatch(/Android/);
  });

  test('main sections are present', async ({ page }) => {
    await page.goto('/');
    for (const id of ['top', 'work', 'ai', 'contact']) {
      await expect(page.locator(`#${id}`), `#${id} should exist`).toBeAttached();
    }
  });

  test('exactly one h1, and every section has a heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    const missing = await page.$$eval('main section', secs =>
      secs.filter(s => !s.querySelector('h1, h2')).map(s => s.id));
    expect(missing).toEqual([]);
  });

  test('header and footer navigation link to the sections', async ({ page }) => {
    await page.goto('/');
    for (const nav of ['nav[aria-label="Sections"]', 'nav[aria-label="Footer"]']) {
      for (const href of ['#work', '#ai', '#contact']) {
        await expect(page.locator(`${nav} a[href="${href}"]`)).toBeAttached();
      }
    }
  });

  test('skip link targets main content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
    await expect(page.locator('main#main')).toBeAttached();
  });

  test('work log lists every role, newest first', async ({ page }) => {
    await page.goto('/');
    const heads = await page.locator('.log-entry h3').allTextContents();
    const order = [/Arrive/, /Santander/, /Wire/, /Bright Inventions/, /FAMOC/, /Hanze/];
    expect(heads.length).toBe(order.length);
    order.forEach((re, i) => expect(heads[i]).toMatch(re));
  });
});

// ─── Honesty guards: claims must stay checkable ───────────────────────────

test.describe('Claims', () => {
  test('years of experience are stated consistently as seven', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('body').innerText();
    expect(text).toMatch(/Seven years/);
    expect(text).not.toMatch(/\b8\+?\s*years|eight years/i);
    const desc = await page.$eval('meta[name="description"]', el => el.content);
    expect(desc).toMatch(/7 years/);
    expect(desc).not.toMatch(/8\+/);
  });

  test('no overclaiming or placeholder text', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/provabl/i);
    expect(text).not.toMatch(/\[[A-Z][A-Z %]+\]/); // e.g. [BEFORE %]
    expect(text.toLowerCase()).not.toContain('lorem');
  });

  test('Wire pull-request numbers link to a GitHub search anyone can check', async ({ page }) => {
    await page.goto('/');
    const work = page.locator('#work');
    await expect(work).toContainText('278 pull requests');
    await expect(work).toContainText('211 were merged');
    const href = await work.locator('a', { hasText: 'See them on GitHub' }).getAttribute('href');
    expect(href).toContain('github.com/search');
    expect(href).toContain('author%3AtrOnk12');
  });

  test('AI-assisted work is labelled where it happened', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#work')).toContainText('with AI assistance');
    await expect(page.locator('#work')).toContainText('reviewed by the iOS team');
    await expect(page.locator('#ai')).toContainText('mutation testing');
    await expect(page.locator('footer')).toContainText('Written with AI help');
  });

  test('no side-project case studies until they are written up', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('body').innerText()).not.toMatch(/Driftless/);
  });

  test('AI tool vendors are not used as a headline skill', async ({ page }) => {
    await page.goto('/');
    const hero = await page.locator('.hero').innerText();
    expect(hero).not.toMatch(/Claude|ChatGPT|Copilot/i);
  });
});

// ─── Hero ──────────────────────────────────────────────────────────────────

test.describe('Hero', () => {
  test('availability line mentions remote EU and Dutch', async ({ page }) => {
    await page.goto('/');
    const eyebrow = await page.locator('.hero .eyebrow').innerText();
    expect(eyebrow).toMatch(/remote in the EU/);
    expect(eyebrow).toMatch(/Dutch/);
  });

  test('primary action is an email link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero .button.primary'))
      .toHaveAttribute('href', 'mailto:m.pachulski94@gmail.com');
  });
});

// ─── Contact & privacy ─────────────────────────────────────────────────────

test.describe('Contact and privacy', () => {
  test('contact offers email, LinkedIn and GitHub', async ({ page }) => {
    await page.goto('/');
    const c = page.locator('#contact');
    await expect(c.locator('a[href="mailto:m.pachulski94@gmail.com"]')).toBeAttached();
    await expect(c.locator('a[href*="linkedin.com/in/mateusz-pachulski"]')).toBeAttached();
    await expect(c.locator('a[href="https://github.com/trOnk12"]')).toBeAttached();
  });

  test('no dead mailbox, no public phone number, no day rate', async ({ page }) => {
    await page.goto('/');
    const html = await page.content();
    expect(html).not.toContain('mateusz@pachulski.dev');
    expect(html).not.toMatch(/tel:|789\s?174/);
    expect(await page.locator('body').innerText()).not.toMatch(/€|PLN|per day/i);
  });

  test('page loads nothing from third parties and runs no scripts', async ({ page }) => {
    const external = [];
    page.on('request', req => {
      const u = new URL(req.url());
      if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) external.push(req.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    expect(external).toEqual([]);
    await expect(page.locator('script')).toHaveCount(0);
  });
});

// ─── Accessibility ─────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
  test('text colours meet WCAG AA on both backgrounds', async ({ page }) => {
    await page.goto('/');
    const v = await page.evaluate(() => {
      const r = getComputedStyle(document.documentElement);
      return ['--bg', '--bg-band', '--ink', '--muted', '--accent-deep']
        .reduce((o, k) => ({ ...o, [k]: r.getPropertyValue(k).trim() }), {});
    });
    for (const bg of ['--bg', '--bg-band']) {
      for (const fg of ['--ink', '--muted', '--accent-deep']) {
        const ratio = contrast(v[fg], v[bg]);
        expect(ratio, `${fg} on ${bg}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test('buttons meet the 44px touch-target height', async ({ page }) => {
    await page.goto('/');
    for (const box of await page.locator('.button').evaluateAll(els => els.map(e => e.getBoundingClientRect().height))) {
      expect(box).toBeGreaterThanOrEqual(44);
    }
  });
});

// ─── Layout ────────────────────────────────────────────────────────────────

test.describe('Layout', () => {
  test('no horizontal page scroll', async ({ page }) => {
    await page.goto('/');
    const [scroll, client] = await page.evaluate(() =>
      [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    expect(scroll).toBeLessThanOrEqual(client);
  });

  test('light paper theme with the site fonts', async ({ page }) => {
    await page.goto('/');
    const s = await page.evaluate(() => {
      const cs = getComputedStyle(document.body);
      return { bg: cs.backgroundColor, font: cs.fontFamily };
    });
    expect(s.font).toContain('Atkinson Hyperlegible Next');
    const [r, g, b] = s.bg.match(/\d+/g).map(Number);
    expect((r + g + b) / 3).toBeGreaterThan(200);
  });

  test('on phones, the work dates stack above each entry', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only test');
    await page.goto('/');
    const date = await page.locator('.log-entry').first().locator('.log-date').boundingBox();
    const body = await page.locator('.log-entry').first().locator('.log-body').boundingBox();
    expect(date.y + date.height).toBeLessThanOrEqual(body.y + 1);
  });

  test('on desktop, the work dates sit in a margin column', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop-only test');
    await page.goto('/');
    const date = await page.locator('.log-entry').first().locator('.log-date').boundingBox();
    const body = await page.locator('.log-entry').first().locator('.log-body').boundingBox();
    expect(date.x + date.width).toBeLessThanOrEqual(body.x);
  });
});

// ─── SEO & social ──────────────────────────────────────────────────────────

test.describe('SEO and social', () => {
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

  test('meta description names the key companies', async ({ page }) => {
    await page.goto('/');
    const desc = await page.$eval('meta[name="description"]', el => el.content);
    for (const name of [/Wire/, /Santander/, /EasyPark/]) expect(desc).toMatch(name);
  });

  test('Open Graph tags are complete', async ({ page }) => {
    await page.goto('/');
    const og = async p => page.$eval(`meta[property="og:${p}"]`, el => el.content);
    expect(await og('url')).toBe('https://pachulski.dev');
    expect(await og('image')).toContain('og-image');
    expect(await og('image:width')).toBeTruthy();
    expect(await og('image:height')).toBeTruthy();
    expect(await og('image:alt')).toBeTruthy();
    expect(await og('site_name')).toBe('Mateusz Pachulski');
    expect(await og('locale')).toBe('en_US');
  });
});

// ─── Security ──────────────────────────────────────────────────────────────

test.describe('Security meta tags', () => {
  test('nosniff and referrer policy are set', async ({ page }) => {
    await page.goto('/');
    expect(await page.$eval('meta[http-equiv="X-Content-Type-Options"]', el => el.content)).toBe('nosniff');
    expect(await page.$eval('meta[name="referrer"]', el => el.content)).toBe('strict-origin-when-cross-origin');
  });

  test('Content-Security-Policy blocks scripts and objects', async ({ page }) => {
    await page.goto('/');
    const csp = await page.$eval('meta[http-equiv="Content-Security-Policy"]', el => el.content);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});
