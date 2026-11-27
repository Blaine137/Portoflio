import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const routes = ['/', '/about/', '/projects/', '/resume/', '/contact/'];
const viewports = [
  { width: 320, height: 720 }, { width: 375, height: 812 },
  { width: 390, height: 844 }, { width: 768, height: 1024 },
  { width: 1024, height: 768 }, { width: 1440, height: 900 },
  { width: 1920, height: 1080 }, { width: 844, height: 390 },
];
async function checkReflow(page: Page) {
  const layout = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
    main: document.querySelector('main')!.getBoundingClientRect().bottom,
    footer: document.querySelector('footer')!.getBoundingClientRect().top,
    footerBottom: document.querySelector('footer')!.getBoundingClientRect().bottom,
    viewportHeight: window.innerHeight,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    footerBackground: getComputedStyle(document.querySelector('footer')!).backgroundColor,
    heading: document.querySelector('h1')!.getBoundingClientRect().bottom,
  }));
  expect(layout.content, 'Horizontal overflow').toBeLessThanOrEqual(layout.width + 1);
  expect(layout.footer, 'Footer overlaps main').toBeGreaterThanOrEqual(layout.main - 1);
  expect(layout.footerBottom, 'Footer leaves a gap below the viewport').toBeGreaterThanOrEqual(layout.viewportHeight - 1);
  expect(layout.bodyBackground, 'Page backdrop differs from the footer').toBe(layout.footerBackground);
  expect(layout.heading, 'Heading escapes main').toBeLessThanOrEqual(layout.main + 1);
}
async function checkHomeViewport(page: Page) {
  const layout = await page.evaluate(() => ({
    height: window.innerHeight,
    content: document.documentElement.scrollHeight,
    footer: document.querySelector('footer')!.getBoundingClientRect().top,
    bottoms: [...document.querySelectorAll('.hero-copy, .particle-field')]
      .map(element => element.getBoundingClientRect().bottom),
  }));
  expect(layout.content, 'Home page requires vertical scrolling').toBeLessThanOrEqual(layout.height + 1);
  for (const bottom of layout.bottoms) {
    expect(bottom, 'Home content overlaps footer').toBeLessThanOrEqual(layout.footer + 1);
  }
}

test('extension body attribute does not trigger a hydration warning', async ({ page }) => {
  const problems: string[] = [];
  page.on('console', message => { if (message.type() === 'error') problems.push(message.text()); });
  page.on('pageerror', error => problems.push(error.message));
  await page.route('**/', async route => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('<body>', '<body cz-shortcut-listen="true">') });
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('cz-shortcut-listen', 'true');
  expect(problems).toEqual([]);
});
for (const viewport of viewports) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, reducedMotion: 'reduce' });
    for (const route of routes) {
      test(`${route} layout, hydration and accessibility`, async ({ page }, info) => {
        const problems: string[] = [];
        page.on('pageerror', e => problems.push(e.message));
        page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
        expect((await page.goto(route))?.ok()).toBe(true);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(page.locator('main')).toBeVisible();
        if (route !== '/') await expect(page.locator('nav a[aria-current="page"]')).toHaveAttribute('href', route);
        if (route === '/projects/') await expect(page.locator('.project')).toHaveCount(5);
        if (route === '/resume/') {
          await expect(page.locator('object')).toHaveAttribute('data', /\.pdf#view=FitH$/);
          const pdf = await page.request.get(await page.locator('a[download]').getAttribute('href') as string);
          expect(pdf.ok()).toBe(true);
          expect(pdf.headers()['content-type']).toContain('application/pdf');
        }
        await checkReflow(page);
        if (route === '/') await checkHomeViewport(page);
        expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
        await page.screenshot({ path: info.outputPath('page.png'), fullPage: true });
        expect(problems).toEqual([]);
      });
    }
  });
}
test('keyboard skip and route navigation', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await page.getByRole('link', { name: 'View projects', exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
  await page.getByRole('navigation').getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL(/\/contact\/$/);
  await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
});
test('mobile menu supports pointer, keyboard and Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open menu' });
  await open.click();
  await expect(page.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
  await page.keyboard.press('Space');
  await page.getByRole('navigation').getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(open).toHaveAttribute('aria-expanded', 'false');
});
test('animation control aligns with footer and supports pause/resume', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const supported = await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')));
    if (!supported) {
      info.annotations.push({ type: 'environment', description: 'WebGL unavailable; static fallback verified.' });
      await expect(page.locator('.particle-mask')).toBeVisible();
      continue;
    }
    const pause = page.getByRole('button', { name: 'Pause animation' });
    async function checkMobileCenter() {
      if (viewport.width > 672) return;
      const offset = await page.locator('footer button').evaluate(button => {
        const rect = button.getBoundingClientRect();
        return Math.abs(rect.left + rect.width / 2 - document.documentElement.clientWidth / 2);
      });
      expect(offset).toBeLessThanOrEqual(1);
    }
    await expect(pause).toBeVisible();
    await checkMobileCenter();
    await expect(page.locator('footer button')).toHaveCount(1);
    const bounds = await page.locator('footer .shell').evaluate(el => {
      const row = el.getBoundingClientRect();
      const b = el.querySelector('button')!.getBoundingClientRect();
      const labels = [...el.querySelectorAll(':scope > span')].map(n => n.getBoundingClientRect());
      return { contained: b.top >= row.top && b.bottom <= row.bottom,
        offsets: labels.filter(r => r.top < b.bottom && r.bottom > b.top).map(r => Math.abs((r.top + r.bottom - b.top - b.bottom) / 2)) };
    });
    expect(bounds.contained).toBe(true);
    for (const offset of bounds.offsets) expect(offset).toBeLessThanOrEqual(1);
    await pause.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Resume animation' })).toBeFocused();
    await checkMobileCenter();
    await page.keyboard.press('Space');
    await expect(pause).toBeFocused();
    await checkReflow(page);
    await checkHomeViewport(page);
    await page.screenshot({ path: info.outputPath(`motion-${viewport.width}.png`), fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('footer button')).toHaveCount(0);
});
test('each route starts its own art and accepts a pointer and playback input', async ({ page }) => {
  for (const [index, route] of routes.entries()) {
    await page.goto(route);
    const field = page.locator('.particle-field');
    await expect(field).toHaveAttribute('data-variant', ['ribbon', 'orbit', 'lattice', 'helix', 'wave'][index]);
    if (!await page.evaluate(() => Boolean(document.createElement('canvas').getContext('webgl2')))) {
      await expect(field.locator('.particle-mask')).toBeVisible();
      continue;
    }
    await expect(field).toHaveAttribute('data-active', 'true');
    await field.hover();
    await page.getByRole('button', { name: 'Pause animation' }).click();
    await page.getByRole('button', { name: 'Resume animation' }).click();
    await expect(page.getByRole('button', { name: 'Pause animation' })).toBeVisible();
  }
});

test('200% text reflows on every route', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 720 });
    for (const route of routes) {
      await page.goto(route);
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      await checkReflow(page);
    }
  }
});
test.describe('server-rendered content', () => {
  test.use({ javaScriptEnabled: false });
  test('all routes remain readable without JavaScript', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.locator('.particle-mask')).toBeVisible();
      await checkReflow(page);
    }
  });
});
