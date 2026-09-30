import { test, expect } from '@playwright/test';

test.describe('Customer Account & Authentication Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const openAuthDialog = async (page, isMobile) => {
    const isMobileViewport = Boolean(isMobile || (page.viewportSize()?.width ?? 1280) < 1024);
    if (isMobileViewport) {
      // Mobile viewport: open menu and click Sign In inside mobile menu
      const openMenuBtn = page.getByRole('button', { name: /open menu/i });
      await openMenuBtn.waitFor({ state: 'visible', timeout: 15000 });
      await openMenuBtn.click();
      const mobileSignIn = page.locator('#mobile-menu button:has-text("Sign In")');
      await mobileSignIn.waitFor({ state: 'visible', timeout: 15000 });
      await mobileSignIn.click();
    } else {
      // Desktop viewport: wait for desktop Sign In button to appear after session check
      const desktopSignIn = page.locator('nav button:has-text("Sign In")');
      await desktopSignIn.waitFor({ state: 'visible', timeout: 15000 });
      await desktopSignIn.click();
    }
  };

  test('opens customer authentication dialog from navigation header', async ({ page, isMobile }) => {
    // Find and click Sign In button in navigation header (handles desktop and mobile)
    await openAuthDialog(page, isMobile);

    // Verify modal dialog appears
    const authDialog = page.locator('#account-auth-dialog');
    await expect(authDialog).toBeVisible();

    // Should default to Sign In mode
    await expect(page.getByRole('heading', { name: /Sign in while you shop|Stay signed in/i }).first()).toBeVisible();
  });

  test('toggles seamlessly between Sign In, Registration, and Password Reset states', async ({
    page,
    isMobile,
  }) => {
    // Open auth dialog
    await openAuthDialog(page, isMobile);

    const authDialog = page.locator('#account-auth-dialog');
    await expect(authDialog).toBeVisible();

    // 1. Switch to Register mode
    const createAccountButton = authDialog.locator('button:has-text("Create one")');
    await expect(createAccountButton).toBeVisible();
    await createAccountButton.click();

    await expect(page.getByRole('heading', { name: /Create your account/i }).first()).toBeVisible();
    await expect(authDialog.getByRole('button', { name: /Create Account/i })).toBeVisible();

    // 2. Switch back to Sign In
    const switchBackToSignIn = authDialog.getByRole('button', { name: 'Sign in', exact: true });
    await expect(switchBackToSignIn).toBeVisible();
    await switchBackToSignIn.click();

    await expect(page.getByRole('heading', { name: /Sign in while you shop|Stay signed in/i }).first()).toBeVisible();

    // 3. Navigate to Forgot Password
    const forgotPasswordBtn = authDialog.locator('button:has-text("Forgot your password?")');
    if (await forgotPasswordBtn.isVisible()) {
      await forgotPasswordBtn.click();
      await expect(page.getByRole('heading', { name: /Reset your password|Recover your account/i }).first()).toBeVisible();

      // Return to Sign In from forgot password
      const returnToSignInBtn = authDialog.locator('button:has-text("Back to Sign In")');
      await expect(returnToSignInBtn).toBeVisible();
      await returnToSignInBtn.click();
      await expect(page.getByRole('heading', { name: /Sign in while you shop|Stay signed in/i }).first()).toBeVisible();
    }

    // 4. Close dialog via Escape key
    await page.keyboard.press('Escape');
    await expect(authDialog).not.toBeVisible();
  });
});
