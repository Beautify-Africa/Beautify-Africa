import { test, expect } from '@playwright/test';

test.describe('Security & Admin Route Protection', () => {
  test('redirects unauthenticated guest visiting /admin/orders to home page', async ({ page }) => {
    // Attempt direct access to admin orders workspace
    await page.goto('/admin/orders');

    // ProtectedRoute should redirect to '/'
    await page.waitForURL('http://127.0.0.1:5173/');
    await expect(page).toHaveURL('http://127.0.0.1:5173/');

    // Admin dashboard elements should not be visible
    await expect(page.locator('text=Admin Orders Workspace')).not.toBeVisible();
  });

  test('redirects unauthenticated guest visiting /admin/inventory to home page', async ({
    page,
  }) => {
    await page.goto('/admin/inventory');

    await page.waitForURL('http://127.0.0.1:5173/');
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
  });

  test('redirects unauthenticated guest visiting /admin/products to home page', async ({
    page,
  }) => {
    await page.goto('/admin/products');

    await page.waitForURL('http://127.0.0.1:5173/');
    await expect(page).toHaveURL('http://127.0.0.1:5173/');
  });
});
