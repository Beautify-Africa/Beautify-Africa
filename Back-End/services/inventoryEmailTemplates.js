// services/inventoryEmailTemplates.js

function generateLowStockEmailHTML(items, threshold) {
  const itemRows = items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 12px; text-align: left;">${item.productName}</td>
      <td style="padding: 12px; text-align: left;">${item.sku || 'N/A'}</td>
      <td style="padding: 12px; text-align: center;"><strong>${item.stock}</strong></td>
      <td style="padding: 12px; text-align: center;">${item.type === 'variant' ? 'Variant' : 'Main'}</td>
      <td style="padding: 12px; text-align: center;">
        <span style="background-color: ${item.stock === 0 ? '#ff4444' : '#ff9800'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          ${item.stock === 0 ? 'OUT OF STOCK' : 'LOW'}
        </span>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    .header { background: #2c3e50; color: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 24px; }
    .header p { margin: 8px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { background: white; padding: 20px; border-radius: 4px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th { background: #34495e; color: white; padding: 12px; text-align: left; font-weight: bold; }
    td { padding: 12px; }
    .footer { font-size: 12px; color: #666; text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    .summary-box { background: #ecf0f1; padding: 15px; border-left: 4px solid #e67e22; border-radius: 4px; margin-bottom: 20px; }
    .action-button { 
      display: inline-block; 
      background: #3498db; 
      color: white; 
      padding: 10px 20px; 
      border-radius: 4px; 
      text-decoration: none; 
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Low Stock Alert</h1>
      <p>Beautify Africa - Inventory Management</p>
    </div>

    <div class="content">
      <div class="summary-box">
        <strong>⚠️ Alert Summary:</strong> ${items.length} product(s) with stock below ${threshold} units
      </div>

      <p>Hello,</p>
      <p>We've detected the following items are running low on stock. Please review and consider restocking:</p>

      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Current Stock</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <p><strong>Recommended Action:</strong> Review the <a href="${process.env.ADMIN_DASHBOARD_URL || 'https://admin.beautify-africa.com'}/inventory/low-stock" class="action-button">inventory dashboard</a> to manage stock levels.</p>

      <p>Best regards,<br>Beautify Africa Operations Team</p>
    </div>

    <div class="footer">
      <p>This is an automated notification. Please do not reply to this email.</p>
      <p>Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateLowStockEmailText(items, threshold) {
  const itemLines = items
    .map(
      (item) =>
        `\n• ${item.productName} (SKU: ${item.sku || 'N/A'})\n  Current Stock: ${item.stock} units\n  Type: ${
          item.type === 'variant' ? 'Variant' : 'Main'
        }\n  Status: ${item.stock === 0 ? 'OUT OF STOCK' : 'LOW'}`
    )
    .join('');

  return `LOW STOCK ALERT - Beautify Africa

Alert Summary: ${items.length} product(s) with stock below ${threshold} units

${itemLines}

Please review the inventory dashboard to manage stock levels.

Best regards,
Beautify Africa Operations Team

This is an automated notification. Please do not reply to this email.
Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC
  `;
}

function generateRestockEmailHTML(productName, itemSku, newStock, variantId) {
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h2>✅ Restock Complete</h2>
  <p>The following item has been restocked:</p>
  <ul>
    <li><strong>Product:</strong> ${productName}</li>
    <li><strong>SKU:</strong> ${itemSku}</li>
    <li><strong>New Stock:</strong> ${newStock} units</li>
    ${variantId ? '<li><strong>Variant:</strong> Yes</li>' : ''}
  </ul>
  <p>Best regards,<br>Beautify Africa Operations Team</p>
</body>
</html>
  `;
}

function generateRestockEmailText(productName, itemSku, newStock, variantId) {
  return `
The following item has been restocked:

Product: ${productName}
SKU: ${itemSku}
New Stock: ${newStock} units
${variantId ? 'Variant: Yes' : ''}

Best regards,
Beautify Africa Operations Team
  `;
}

module.exports = {
  generateLowStockEmailHTML,
  generateLowStockEmailText,
  generateRestockEmailHTML,
  generateRestockEmailText,
};
