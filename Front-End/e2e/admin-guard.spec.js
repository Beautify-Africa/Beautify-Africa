import { test, expect } from '@playwright/test';

test.describe('Security & Admin Route Protection', () => {
  test('redirects unauthenticated guest visiting /admin/orders to admin login page', async ({ page }) => {
    // Attempt direct access to admin orders workspace
    await page.goto('/admin/orders');

    // ProtectedRoute should redirect to '/admin/login'
    await page.waitForURL('**/admin/login**');
    await expect(page).toHaveURL(/.*\/admin\/login/);

    // Admin dashboard elements should not be visible
    await expect(page.locator('text=Admin Orders Workspace')).not.toBeVisible();
  });

  test('redirects unauthenticated guest visiting /admin/inventory to admin login page', async ({
    page,
  }) => {
    await page.goto('/admin/inventory');

    await page.waitForURL('**/admin/login**');
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });

  test('redirects unauthenticated guest visiting /admin/products to admin login page', async ({
    page,
  }) => {
    await page.goto('/admin/products');

    await page.waitForURL('**/admin/login**');
    await expect(page).toHaveURL(/.*\/admin\/login/);
  });
});
