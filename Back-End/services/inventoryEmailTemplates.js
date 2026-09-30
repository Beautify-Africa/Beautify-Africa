// services/inventoryEmailTemplates.js
const {
  generateLuxuryLowStockEmail,
  generateLuxuryRestockEmail,
} = require('./emailTemplates');

function generateLowStockEmailHTML(items, threshold) {
  const { html } = generateLuxuryLowStockEmail({
    items,
    threshold,
    dashboardUrl: process.env.ADMIN_DASHBOARD_URL || 'https://admin.beautify-africa.com',
  });
  return html;
}

function generateLowStockEmailText(items, threshold) {
  const { text } = generateLuxuryLowStockEmail({
    items,
    threshold,
    dashboardUrl: process.env.ADMIN_DASHBOARD_URL || 'https://admin.beautify-africa.com',
  });
  return text;
}

function generateRestockEmailHTML(productName, itemSku, newStock, variantId) {
  const { html } = generateLuxuryRestockEmail({
    productName,
    itemSku,
    newStock,
    variantId,
    dashboardUrl: process.env.ADMIN_DASHBOARD_URL || 'https://admin.beautify-africa.com',
  });
  return html;
}

function generateRestockEmailText(productName, itemSku, newStock, variantId) {
  const { text } = generateLuxuryRestockEmail({
    productName,
    itemSku,
    newStock,
    variantId,
    dashboardUrl: process.env.ADMIN_DASHBOARD_URL || 'https://admin.beautify-africa.com',
  });
  return text;
}

module.exports = {
  generateLowStockEmailHTML,
  generateLowStockEmailText,
  generateRestockEmailHTML,
  generateRestockEmailText,
};
