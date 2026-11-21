// @ts-check
const { test, expect } = require('./fixtures');

test.describe('Tutoring page', () => {
  test('is findable and shareable: local title, canonical, preview image, structured data, sitemap', async ({ page, request }) => {
    await page.goto('/korepetycje/');
    await expect(page).toHaveTitle(/matematyki.*klasy 4–8.*Wschowy/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pachulski.dev/korepetycje/');
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://pachulski.dev/korepetycje/og.png');
    expect((await request.get('/korepetycje/og.png')).status()).toBe(200);
    const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent() || '{}');
    expect(ld.offers.price).toBe('45');
    expect(ld.provider.name).toBe('Mateusz Pachulski');
    expect(await (await request.get('/sitemap.xml')).text()).toContain('https://pachulski.dev/korepetycje/');
  });
});
