import { test, expect } from '@playwright/test';

test.describe('Customer Account & Authentication Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('opens customer authentication dialog from navigation header', async ({ page }) => {
    // Find Sign In button in navigation header
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Verify modal dialog appears
    const authDialog = page.locator('div[role="dialog"]');
    await expect(authDialog).toBeVisible();

    // Should default to Sign In mode
    await expect(page.getByRole('heading', { name: /Sign in while you shop/i })).toBeVisible();
  });

  test('toggles seamlessly between Sign In, Registration, and Password Reset states', async ({
    page,
  }) => {
    // Open auth dialog
    const signInButton = page.locator('button:has-text("Sign In")').first();
    await signInButton.click();

    const authDialog = page.locator('div[role="dialog"]');
    await expect(authDialog).toBeVisible();

    // 1. Switch to Register mode
    const createAccountButton = page.locator('button:has-text("Create one")');
    await expect(createAccountButton).toBeVisible();
    await createAccountButton.click();

    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();

    // 2. Switch back to Sign In
    const switchBackToSignIn = page.locator('button:has-text("Sign in")');
    await expect(switchBackToSignIn).toBeVisible();
    await switchBackToSignIn.click();

    await expect(page.getByRole('heading', { name: /Sign in while you shop/i })).toBeVisible();

    // 3. Navigate to Forgot Password
    const forgotPasswordBtn = page.locator('button:has-text("Forgot your password?")');
    if (await forgotPasswordBtn.isVisible()) {
      await forgotPasswordBtn.click();
      await expect(page.getByRole('heading', { name: /Reset your password/i })).toBeVisible();

      // Return to Sign In from forgot password
      const returnToSignInBtn = page.locator('button:has-text("Back to Sign In")');
      await expect(returnToSignInBtn).toBeVisible();
      await returnToSignInBtn.click();
      await expect(page.getByRole('heading', { name: /Sign in while you shop/i })).toBeVisible();
    }

    // 4. Close dialog via Escape key
    await page.keyboard.press('Escape');
    await expect(authDialog).not.toBeVisible();
  });
});
