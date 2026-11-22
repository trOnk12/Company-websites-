// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Tutoring page', () => {
  test('is findable and shareable: local title, canonical, preview image, structured data, sitemap', async ({ page, request }) => {
    await page.goto('/korepetycje/');
    await expect(page).toHaveTitle(/matematyki.*do matury.*Wschowy/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pachulski.dev/korepetycje/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://pachulski.dev/korepetycje/og.png');
    expect((await request.get('/korepetycje/og.png')).status()).toBe(200);
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || '{}');
    expect([].concat(ld.offers).map(o => o.price)).toEqual(['45', '50', '60']);
    expect(ld.provider.name).toBe('Mateusz Pachulski');
    expect(await (await request.get('/sitemap.xml')).text()).toContain('https://pachulski.dev/korepetycje/');
  });

  test('a parent can propose a time: the e-mail reads like a person wrote it, and nothing fails to load', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/korepetycje/');
    await page.click('#termin summary');
    const day = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
    await page.fill('#date', day);
    await page.fill('#hour', '17:00');
    await page.fill('#topic', 'równania');
    await page.click('text=Przygotuj wiadomość');
    const body = decodeURIComponent(await page.locator('#send').getAttribute('href'));
    expect(body).toContain('subject=Korepetycje z matematyki: propozycja terminu');
    expect(body).toContain('godz. 17:00?');
    expect(body).toContain('Co przećwiczyć: równania');
    expect(body).not.toContain('zł');
    expect(errors).toEqual([]);
  });
});
