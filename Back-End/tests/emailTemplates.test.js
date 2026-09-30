// tests/emailTemplates.test.js
const {
  renderBaseEmailTemplate,
  renderEmailButton,
  generateWelcomeNewsletterEmail,
  generateNewsletterUnsubscribeEmail,
  generatePasswordResetEmail,
  generateLuxuryLowStockEmail,
  generateLuxuryRestockEmail,
} = require('../services/emailTemplates');

describe('Luxury Email Templates Service Suite', () => {
  const testClientUrl = 'http://localhost:5173';

  describe('renderBaseEmailTemplate', () => {
    test('renders valid HTML email shell with brand styling and footer', () => {
      const html = renderBaseEmailTemplate({
        previewText: 'Exclusive beauty invitation',
        eyebrow: 'THE BEAUTIFY SOCIETY',
        title: 'Welcome to Luxury',
        contentHtml: '<p>Sample content</p>',
        clientUrl: testClientUrl,
        unsubscribeLink: `${testClientUrl}/newsletter/unsubscribe?token=sample123`,
        managePreferencesLink: `${testClientUrl}/newsletter/preferences`,
      });

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('BEAUTIFY');
      expect(html).toContain('World-Class Beauty &amp; Luxury Cosmetics');
      expect(html).toContain('Exclusive beauty invitation');
      expect(html).toContain('Welcome to Luxury');
      expect(html).toContain('<p>Sample content</p>');
      expect(html).toContain('sample123');
      expect(html).toContain('/newsletter/preferences');
      expect(html).toContain('All rights reserved');
    });
  });

  describe('renderEmailButton', () => {
    test('generates bulletproof table button for cross-client compatibility', () => {
      const buttonHtml = renderEmailButton({
        href: 'https://example.com/action',
        label: 'Shop Now',
      });

      expect(buttonHtml).toContain('https://example.com/action');
      expect(buttonHtml).toContain('Shop Now');
      expect(buttonHtml).toContain('table');
      expect(buttonHtml).toContain('background-color: #18181B');
    });
  });

  describe('generateWelcomeNewsletterEmail', () => {
    test('generates luxury welcome email with perks and store link', () => {
      const { html, text } = generateWelcomeNewsletterEmail({
        clientUrl: testClientUrl,
        manageNewsletterLink: `${testClientUrl}/newsletter/manage`,
        email: 'member@example.com',
      });

      expect(html).toContain('Welcome to the Inner Circle');
      expect(html).toContain('BEAUTY10');
      expect(html).toContain('10% Off Your Curated Order');
      expect(html).toContain(`${testClientUrl}/shop`);
      expect(html).toContain(`${testClientUrl}/newsletter/manage`);
      expect(html).toContain('Top Brands');
      expect(html).toContain('Cruelty-Free');

      expect(text).toContain('BEAUTIFY — Welcome to The Beautify Society');
      expect(text).toContain('BEAUTY10');
      expect(text).toContain(`${testClientUrl}/shop`);
    });
  });

  describe('generateNewsletterUnsubscribeEmail', () => {
    test('generates secure unsubscribe email containing required token route', () => {
      const unsubscribeLink = `${testClientUrl}/newsletter/unsubscribe?token=abcdef1234567890`;
      const { html, text } = generateNewsletterUnsubscribeEmail({
        unsubscribeLink,
        clientUrl: testClientUrl,
        email: 'user@example.com',
      });

      expect(html).toContain('/newsletter/unsubscribe?token=abcdef1234567890');
      expect(html).toContain('Confirm Unsubscribe');
      expect(html).toContain('user@example.com');
      expect(html).toContain('Confirm Newsletter Unsubscribe');

      expect(text).toContain(unsubscribeLink);
      expect(text).toContain('Confirm newsletter unsubscribe — Beautify');
    });
  });

  describe('generatePasswordResetEmail', () => {
    test('generates luxury password reset email with token and security advice', () => {
      const resetLink = `${testClientUrl}/reset-password?token=deadbeefcafe12345678`;
      const { html, text } = generatePasswordResetEmail({
        resetLink,
        clientUrl: testClientUrl,
        email: 'customer@example.com',
      });

      expect(html).toContain('Reset Your Password');
      expect(html).toContain('token=deadbeefcafe12345678');
      expect(html).toContain('Reset My Password');
      expect(html).toContain('Security Advisory:');
      expect(html).toContain('1 hour');

      expect(text).toContain(resetLink);
      expect(text).toContain('Reset your Beautify password');
      expect(text).toContain('1 hour');
    });
  });

  describe('generateLuxuryLowStockEmail', () => {
    test('generates low stock operational alert table with KPI metrics', () => {
      const items = [
        { productName: 'Velvet Botanique Lipstick', sku: 'VB-01', stock: 2, type: 'variant' },
        { productName: 'Luminous Silk Serum', sku: 'LSS-02', stock: 0, type: 'main' },
      ];

      const { html, text } = generateLuxuryLowStockEmail({
        items,
        threshold: 10,
        dashboardUrl: 'https://admin.beautify.com',
      });

      expect(html).toContain('Low Stock Notification');
      expect(html).toContain('Velvet Botanique Lipstick');
      expect(html).toContain('Luminous Silk Serum');
      expect(html).toContain('Out of Stock');
      expect(html).toContain('Low Stock');
      expect(html).toContain('https://admin.beautify.com/inventory');

      expect(text).toContain('LOW STOCK ALERT');
      expect(text).toContain('Velvet Botanique Lipstick');
      expect(text).toContain('Luminous Silk Serum');
    });
  });

  describe('generateLuxuryRestockEmail', () => {
    test('generates restock notification with SKU and new stock count', () => {
      const { html, text } = generateLuxuryRestockEmail({
        productName: 'Sculpt & Define Brush',
        itemSku: 'SDB-100',
        newStock: 50,
        variantId: 'var-999',
        dashboardUrl: 'https://admin.beautify.com',
      });

      expect(html).toContain('Inventory Restocked');
      expect(html).toContain('Sculpt & Define Brush');
      expect(html).toContain('SDB-100');
      expect(html).toContain('50 units');
      expect(html).toContain('var-999');

      expect(text).toContain('BEAUTIFY — RESTOCK COMPLETE');
      expect(text).toContain('Sculpt & Define Brush');
      expect(text).toContain('50 units');
    });
  });
});
