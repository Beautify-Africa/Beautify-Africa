// services/inventoryNotificationService.js
// Handles inventory-related notifications (low stock alerts, restock reminders)
const inventoryService = require('./inventoryService');
const { emailQueue } = require('../queues/emailQueue');
const User = require('../models/User');
const { Product, ProductVariant } = require('../models/Product');
const {
  generateLowStockEmailHTML,
  generateLowStockEmailText,
  generateRestockEmailHTML,
  generateRestockEmailText,
} = require('./inventoryEmailTemplates');

/**
 * Send low stock alerts to admins via email
 * @param {number} threshold - Stock threshold (default 10)
 * @returns {Promise<Object>} - Notification result
 */
async function notifyLowStockToAdmins(threshold = 10) {
  try {
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

    const adminUsers = await User.findAll({
      where: { isAdmin: true },
      attributes: ['email', 'name'],
      limit: 100,
      raw: true,
    });

    if (adminUsers.length === 0) {
      return {
        status: 'warning',
        message: 'No admin users found to notify',
        itemsNotified: lowStockData.items.length,
        jobsQueued: 0,
      };
    }

    const htmlContent = generateLowStockEmailHTML(lowStockData.items, threshold);
    const textContent = generateLowStockEmailText(lowStockData.items, threshold);

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
        console.error(`Failed to queue email for admin ${admin.email}:`, queueError);
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
 */
async function notifyRestockCompletion(productId, variantId = null, newStock) {
  try {
    const product = await Product.findByPk(productId, {
      include: [{ model: ProductVariant, as: 'variants' }],
    });

    if (!product) {
      throw new Error('Product not found');
    }

    let itemSku = 'N/A';
    if (variantId) {
      const variant = (product.variants || []).find((v) => v.id === variantId);
      if (variant) {
        itemSku = variant.sku;
      }
    }

    const adminUsers = await User.findAll({
      where: { isAdmin: true },
      attributes: ['email', 'name'],
      raw: true,
    });

    if (adminUsers.length === 0) {
      return {
        status: 'warning',
        message: 'No admin users found to notify',
      };
    }

    const subject = `✅ Restock Complete - ${product.name}`;
    const text = generateRestockEmailText(product.name, itemSku, newStock, variantId);
    const html = generateRestockEmailHTML(product.name, itemSku, newStock, variantId);

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
        console.error(`Failed to queue restock notification for ${admin.email}:`, queueError);
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
