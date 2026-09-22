import { test, expect } from '@playwright/test';

test('custom menu sprites load and remain visible across the main menus', async ({ page }) => {
  await page.goto('/?v=custom-menu-sprites');
  const expected = ['battle', 'settings', 'pause', 'map'];
  for (const name of expected) {
    const image = page.locator(`img[src="/assets/ui/${name}.png"]`).first();
    await expect(image).toHaveJSProperty('complete', true);
    expect(await image.evaluate(node => node.naturalWidth)).toBe(96);
  }
  await expect(page.locator('.welcome-symbol img')).toBeVisible();

  await page.locator('.starter-option').first().click();
  await page.locator('#start').click();
  await expect(page.locator('.mini-heading img[src="/assets/ui/map.png"]')).toBeVisible();
  await expect(page.locator('.minimap .map-tools')).toBeHidden();
  await page.locator('#missions-toggle').click();
  await expect(page.locator('#objectives')).toHaveClass(/collapsed/);
  await expect(page.locator('#missions-toggle')).toHaveAttribute('aria-expanded', 'false');
  await page.locator('#missions-toggle').click();
  await expect(page.locator('#objectives')).not.toHaveClass(/collapsed/);
  await page.locator('#info-open').click();
  await expect(page.locator('#info img[src="/assets/ui/info.png"]')).toBeVisible();
  await expect(page.locator('#info img[src="/assets/ui/stats.png"]')).toBeVisible();
  await expect(page.locator('#info img[src="/assets/ui/types.png"]')).toBeVisible();
  await page.locator('#info-close').click();
  await page.locator('#bag-open').click();
  await expect(page.locator('#bag img[src="/assets/ui/bag.png"]')).toBeVisible();
});
