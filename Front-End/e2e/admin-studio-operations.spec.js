import { test, expect } from '@playwright/test';

test.describe('Admin Studio Security Gate & Operations Suite', () => {
  test('renders secure admin login gate with expected attributes and security notices', async ({
    page,
  }) => {
    await page.goto('/admin/login');

    // Title and perimeter badge
    await expect(page).toHaveTitle(/Admin Studio Security Gate \| Beautify Africa/i);
    await expect(page.getByRole('heading', { name: /Admin Studio Vault/i })).toBeVisible();
    await expect(page.getByText(/Restricted Perimeter/i)).toBeVisible();

    // System owner credential inputs
    const emailInput = page.locator('#admin-email');
    const passwordInput = page.locator('#admin-password');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText(/Authenticate Master Session/i);
  });

  test('validates required fields on admin authentication form', async ({ page }) => {
    await page.goto('/admin/login');

    const emailInput = page.locator('#admin-email');
    const passwordInput = page.locator('#admin-password');
    const submitBtn = page.locator('button[type="submit"]');

    // Email and password should be required HTML5 fields
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(passwordInput).toHaveAttribute('required', '');

    // Fill invalid email and observe validity
    await emailInput.fill('invalid-email-format');
    await passwordInput.fill('short');
    await submitBtn.click();

    // Verify page stays on /admin/login (does not navigate away)
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
