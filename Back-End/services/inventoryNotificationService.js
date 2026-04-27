// services/inventoryNotificationService.js
// Handles inventory-related notifications (low stock alerts, restock reminders)
const inventoryService = require('./inventoryService');
const { emailQueue } = require('../queues/emailQueue');
const User = require('../models/User');

/**
 * Generate HTML email for low stock alert
 * @param {Array} items - Low stock items from inventoryService.getLowStockItems()
 * @param {number} threshold - Stock threshold used
 * @returns {string} - HTML email content
 */
function generateLowStockEmailHTML(items, threshold) {
  const itemRows = items
    .map(
      (item) =>
        `
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 12px; text-align: left;">${item.productName}</td>
      <td style="padding: 12px; text-align: left;">${item.sku}</td>
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

/**
 * Generate plain text email for low stock alert
 * @param {Array} items - Low stock items
 * @param {number} threshold - Stock threshold used
 * @returns {string} - Plain text email content
 */
function generateLowStockEmailText(items, threshold) {
  const itemLines = items
    .map(
      (item) =>
        `\n• ${item.productName} (SKU: ${item.sku})\n  Current Stock: ${item.stock} units\n  Type: ${
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

/**
 * Send low stock alerts to admins via email
 * @param {number} threshold - Stock threshold (default 10)
 * @returns {Promise<Object>} - Notification result
 */
async function notifyLowStockToAdmins(threshold = 10) {
  try {
    // Get low stock items
    const lowStockData = await inventoryService.getLowStockItems(threshold, {
      limit: 1000,
      includeArchived: false,
    });

    if (lowStockData.items.length === 0) {
      return {
        status: 'success',
        message: 'No low stock items found',
        itemsNotified: 0,
        jobsQueued: 0,
      };
    }

    // Get all admin users
    const adminUsers = await User.find(
      { role: 'admin' },
      'email name',
      { limit: 100 }
    ).lean();

    if (adminUsers.length === 0) {
      return {
        status: 'warning',
        message: 'No admin users found to notify',
        itemsNotified: lowStockData.items.length,
        jobsQueued: 0,
      };
    }

    // Generate email content
    const htmlContent = generateLowStockEmailHTML(lowStockData.items, threshold);
    const textContent = generateLowStockEmailText(lowStockData.items, threshold);

    // Queue emails for each admin
    const queuedJobs = [];

    for (const admin of adminUsers) {
      try {
        const job = await emailQueue.add(
          'send-email',
          {
            email: admin.email,
            subject: `⚠️ Low Stock Alert (${lowStockData.items.length} items)`,
            text: textContent,
            html: htmlContent,
          },
          {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
            removeOnComplete: true,
          }
        );

        queuedJobs.push({
          jobId: job.id,
          adminEmail: admin.email,
        });
      } catch (queueError) {
        console.error(
          `Failed to queue email for admin ${admin.email}:`,
          queueError
        );
      }
    }

    return {
      status: 'success',
      message: `Low stock notification queued for ${queuedJobs.length} admin(s)`,
      itemsNotified: lowStockData.items.length,
      jobsQueued: queuedJobs.length,
      threshold,
      jobs: queuedJobs.map((j) => ({ jobId: j.jobId })),
    };
  } catch (error) {
    console.error('notifyLowStockToAdmins error:', error);
    throw error;
  }
}

/**
 * Send restock completion notification
 * Used when stock is restored to above threshold
 * @param {string} productId - Product ID
 * @param {string} variantId - Variant ID (optional)
 * @param {number} newStock - New stock level
 * @returns {Promise<Object>} - Notification result
 */
async function notifyRestockCompletion(productId, variantId = null, newStock) {
  try {
    const Product = require('../models/Product');

    const product = await Product.findById(productId, 'name sku variants').lean();

    if (!product) {
      throw new Error('Product not found');
    }

    let variant = null;
    let itemSku = product.sku;

    if (variantId) {
      variant = product.variants.id(variantId);
      if (variant) {
        itemSku = variant.sku;
      }
    }

    const adminUsers = await User.find(
      { role: 'admin' },
      'email name'
    ).lean();

    if (adminUsers.length === 0) {
      return {
        status: 'warning',
        message: 'No admin users found to notify',
      };
    }

    const subject = `✅ Restock Complete - ${product.name}`;
    const text = `
The following item has been restocked:

Product: ${product.name}
SKU: ${itemSku}
New Stock: ${newStock} units
${variantId ? `Variant: Yes` : ''}

Best regards,
Beautify Africa Operations Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h2>✅ Restock Complete</h2>
  <p>The following item has been restocked:</p>
  <ul>
    <li><strong>Product:</strong> ${product.name}</li>
    <li><strong>SKU:</strong> ${itemSku}</li>
    <li><strong>New Stock:</strong> ${newStock} units</li>
    ${variantId ? '<li><strong>Variant:</strong> Yes</li>' : ''}
  </ul>
  <p>Best regards,<br>Beautify Africa Operations Team</p>
</body>
</html>
    `;

    const queuedJobs = [];

    for (const admin of adminUsers) {
      try {
        const job = await emailQueue.add(
          'send-email',
          {
            email: admin.email,
            subject,
            text,
            html,
          },
          {
            attempts: 2,
            removeOnComplete: true,
          }
        );

        queuedJobs.push({ jobId: job.id, adminEmail: admin.email });
      } catch (queueError) {
        console.error(
          `Failed to queue restock notification for ${admin.email}:`,
          queueError
        );
      }
    }

    return {
      status: 'success',
      message: `Restock notification queued for ${queuedJobs.length} admin(s)`,
      jobsQueued: queuedJobs.length,
    };
  } catch (error) {
    console.error('notifyRestockCompletion error:', error);
    throw error;
  }
}

module.exports = {
  notifyLowStockToAdmins,
  notifyRestockCompletion,
  generateLowStockEmailHTML,
  generateLowStockEmailText,
};
