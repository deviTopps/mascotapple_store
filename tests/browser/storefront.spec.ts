import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('cookie choices persist and can be changed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject optional' }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Cookie settings', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your cookie choices' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cookie settings', exact: true }).click();
  await page.getByRole('checkbox', { name: /Google address search/ }).check();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('mascot-cookie-preferences-v1')!).maps)).toBe(true);
});

test('shop pagination, filtering and back navigation', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Reject optional' }).click();
  const base = await (await page.request.get('/api/products')).json();
  const products = Array.from({ length: 55 }, (_, i) => ({ ...base.products[0], slug: `test-${i}`, name: `Test product ${i}` }));
  await page.route('**/api/products', route => route.fulfill({ json: { products } }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('status').filter({ hasText: '55 products' })).toBeVisible();
  await expect(page.locator('article')).toHaveCount(24);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.locator('article').first()).toContainText('Test product 24');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('article')).toHaveCount(7);
  await page.goBack();
  await expect(page.locator('article')).toHaveCount(24);
  await page.getByRole('searchbox', { name: 'Search all products' }).fill('Test product 54');
  await expect(page.locator('article')).toHaveCount(1);
  await expect(page).not.toHaveURL(/page=/);
});

test('product configuration, cart and safe checkout validation', async ({ page }) => {
  await page.goto('/products/iphone-17-pro');
  await page.getByRole('button', { name: 'Reject optional' }).click();
  await expect(page).toHaveTitle(/Mascot Apple Dealz/);
  const selectors = page.locator('#product-options select');
  for (let i = 0; i < await selectors.count(); i++) await selectors.nth(i).selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
  await page.getByRole('link', { name: 'View cart & checkout →' }).click();
  await expect(page.locator('.cart-line')).toHaveCount(1);
  await page.getByRole('button', { name: /Increase .* quantity/ }).click();
  await expect(page.getByLabel('Quantity 2', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Proceed to checkout →' }).click();
  await expect(page.getByRole('heading', { name: 'Checkout', exact: true })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations.filter(v => v.impact === 'critical' || v.impact === 'serious').map(v => ({ id: v.id, elements: v.nodes.map(n => n.target) }))).toEqual([]);
  await page.getByRole('button', { name: 'Place order', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Full name' })).toBeFocused();
  // Stop before submitting: this suite never creates real customer orders.
});

test('core pages fit the viewport and pass critical accessibility checks', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => localStorage.setItem('mascot-cookie-preferences-v1', JSON.stringify({ version: 1, maps: false, savedAt: Date.now() })));
  for (const path of ['/', '/products', '/products/iphone-17-pro', '/cart', '/support', '/cookies', '/consumer-health-data-privacy']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), path).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    const blocking = result.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(blocking.map(v => ({ id: v.id, elements: v.nodes.map(n => n.target) })), path).toEqual([]);
  }
});
