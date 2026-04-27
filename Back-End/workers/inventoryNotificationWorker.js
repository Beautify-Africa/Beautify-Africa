// workers/inventoryNotificationWorker.js
// Background job worker for inventory notifications (low stock alerts, restock reminders)
const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const inventoryNotificationService = require('../services/inventoryNotificationService');

const inventoryNotificationWorker = new Worker(
  'inventoryNotifications',
  async (job) => {
    const { type, threshold = 10, productId, variantId, newStock } = job.data;

    console.log(
      `[Inventory Worker] Processing job type: ${type} (Job ID: ${job.id})`
    );

    let result;

    switch (type) {
      case 'low-stock-check':
        result = await inventoryNotificationService.notifyLowStockToAdmins(threshold);
        console.log(
          `[Inventory Worker] Low stock check completed: ${result.itemsNotified} items, ${result.jobsQueued} notifications queued`
        );
        break;

      case 'restock-notification':
        result = await inventoryNotificationService.notifyRestockCompletion(
          productId,
          variantId,
          newStock
        );
        console.log(`[Inventory Worker] Restock notification sent`);
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    return result;
  },
  {
    connection: redisClient,
    concurrency: 1, // Process inventory jobs sequentially
  }
);

inventoryNotificationWorker.on('completed', (job, result) => {
  console.log(
    `[Inventory Worker] Job ${job.id} (${job.data.type}) completed successfully`
  );
});

inventoryNotificationWorker.on('failed', (job, err) => {
  console.error(
    `[Inventory Worker] Job ${job.id} (${job.data.type}) failed: ${err.message}`
  );
});

module.exports = inventoryNotificationWorker;
