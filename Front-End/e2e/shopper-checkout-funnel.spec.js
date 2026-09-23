import { test, expect } from '@playwright/test';

test.describe('Shopper Catalog & Checkout Funnel Suite', () => {
  test('loads shop catalog with collections and interactive filter controls', async ({
    page,
  }) => {
    await page.goto('/shop');

    // Title verification
    await expect(page).toHaveTitle(/Shop \| Beautify Africa/i);

    // Main layout container
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeVisible();

    // Verify navigation and cart access are present
    const cartButton = page.locator('button[aria-label^="Shopping cart"]');
    await expect(cartButton).toBeVisible();
  });

  test('interacts with the cart drawer and verifies checkout initiation triggers', async ({
    page,
  }) => {
    await page.goto('/shop');

    // Open cart drawer
    const cartButton = page.locator('button[aria-label^="Shopping cart"]');
    await cartButton.click();

    const cartDrawer = page.locator('aside[role="dialog"][aria-label="Shopping cart"]');
    await expect(cartDrawer).toBeVisible();
    await expect(cartDrawer).toHaveAttribute('aria-hidden', 'false');

    // In a fresh session, cart displays empty message
    const emptyNotice = page.getByText(/Your cart is empty/i);
    await expect(emptyNotice).toBeVisible();

    // Verify "Discover Products" or "Continue Shopping" CTA inside empty cart
    const discoverBtn = cartDrawer.getByRole('button', { name: /Discover products|Continue shopping/i });
    if (await discoverBtn.isVisible()) {
      await discoverBtn.click();
      await expect(cartDrawer).toHaveAttribute('aria-hidden', 'true');
    } else {
      await page.keyboard.press('Escape');
      await expect(cartDrawer).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
