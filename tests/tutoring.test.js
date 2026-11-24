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
    expect(ld.provider.telephone).toBe('+48789174023');
    for (const href of ['tel:+48789174023', 'sms:+48789174023', 'https://wa.me/48789174023']) {
      await expect(page.locator(`a[href="${href}"]`)).toBeVisible();
    }
    await expect(page.locator('#pytania summary')).toHaveText(/płatność.*odwoływanie/i);
    await expect(page.locator('body')).not.toContainText(/rozszerzona|ograniczona liczba/i);
    expect(ld.provider.name).toBe('Mateusz Pachulski');
    expect(await (await request.get('/sitemap.xml')).text()).toContain('https://pachulski.dev/korepetycje/');
  });

  test('a parent can propose a time: the e-mail reads like a person wrote it, and nothing fails to load', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/korepetycje/');
    await page.click('#termin summary');
    await page.locator('#next').click();
    const dayButton = page.locator('#days button').first();
    const day = await dayButton.getAttribute('data-date');
    await dayButton.click();
    await expect(page.locator('#date')).toHaveValue(day);
    await expect(dayButton).toHaveAttribute('aria-pressed', 'true');
    await page.fill('#hour', '17:00');
    await page.fill('#topic', 'równania');
    await page.click('text=Przygotuj wiadomość');
    const body = decodeURIComponent(await page.locator('#send').getAttribute('href'));
    expect(body).toContain('subject=Korepetycje z matematyki: propozycja terminu');
    expect(body).toContain('godz. 17:00?');
    expect(body).toContain('Co przećwiczyć: równania');
    expect(body).not.toContain('zł');
    expect(body).toContain(day.slice(0, 4));
    await page.fill('#date', '');
    await expect(page.locator('#draft')).toBeHidden();
    await expect(page.locator('#days [aria-pressed="true"]')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test('each share text includes the phone and copies the same text as WhatsApp', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/korepetycje/udostepnij/');
  const variants = page.locator('.tabs button');
  await expect(variants).toHaveCount(3);
  for (const variant of await variants.all()) {
    await variant.click();
    const post = await page.locator('#post').innerText();
    expect(post).toContain('+48 789 174 023');
    expect(post).toContain('https://pachulski.dev/korepetycje/');
    const href = await page.locator('#wa').getAttribute('href');
    expect(new URL(href).searchParams.get('text')).toBe(post);
    await page.locator('#copy').click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(post);
  }
});
