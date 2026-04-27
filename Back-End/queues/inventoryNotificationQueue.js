// queues/inventoryNotificationQueue.js
// Queue for inventory notification jobs (low stock alerts, restock reminders)
const { Queue, QueueEvents } = require('bullmq');
const redisClient = require('../config/redis');

// Initialize the queue
const inventoryNotificationQueue = new Queue('inventoryNotifications', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Add queue events listener
const inventoryNotificationQueueEvents = new QueueEvents('inventoryNotifications', {
  connection: redisClient,
});

module.exports = {
  inventoryNotificationQueue,
  inventoryNotificationQueueEvents,
};
