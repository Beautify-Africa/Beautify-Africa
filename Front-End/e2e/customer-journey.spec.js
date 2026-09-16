import { test, expect } from '@playwright/test';

test.describe('Customer Storefront Journey', () => {
  test('navigates from landing page to catalog and views storefront', async ({ page }) => {
    // 1. Visit Home Page
    await page.goto('/');
    await expect(page).toHaveTitle(/Beautify Africa/i);

    // Verify main navigation is present
    const mainNav = page.locator('nav').first();
    await expect(mainNav).toBeVisible();

    // 2. Navigate to Shop Page via direct url
    await page.goto('/shop');
    await expect(page).toHaveURL(/\/shop/);

    // Verify shop catalogue page loaded
    const mainContent = page.locator('#main-content');
    await mainContent.waitFor({ state: 'visible', timeout: 20000 });
    await expect(mainContent).toBeVisible();
  });

  test('opens and interacts with the sliding cart drawer', async ({ page }) => {
    await page.goto('/shop');

    // Click the cart button in the navigation bar
    const cartButton = page.locator('button[aria-label^="Shopping cart"]');
    await expect(cartButton).toBeVisible();
    await cartButton.click();

    // Verify cart drawer is opened
    const cartDrawer = page.locator('aside[role="dialog"][aria-label="Shopping cart"]');
    await expect(cartDrawer).toHaveAttribute('aria-hidden', 'false');
    await expect(cartDrawer).toHaveClass(/translate-x-0/);

    // Verify empty cart state is displayed when no items have been added
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible();

    // Close cart drawer by pressing Escape
    await page.keyboard.press('Escape');
    await expect(cartDrawer).toHaveAttribute('aria-hidden', 'true');
    await expect(cartDrawer).toHaveClass(/translate-x-full/);
  });
});
