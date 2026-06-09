// queues/inventoryNotificationQueue.js
// Queue for inventory notification jobs (low stock alerts, restock reminders)
const { Queue, QueueEvents } = require('bullmq');
const createBullmqRedisConnection = require('../config/bullmqRedis');

const inventoryNotificationQueueConnection = createBullmqRedisConnection();
const inventoryNotificationQueueEventsConnection = createBullmqRedisConnection();

// Initialize the queue using a dedicated BullMQ Redis connection.
const inventoryNotificationQueue = new Queue('inventoryNotifications', {
  connection: inventoryNotificationQueueConnection,
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
  connection: inventoryNotificationQueueEventsConnection,
});

module.exports = {
  inventoryNotificationQueue,
  inventoryNotificationQueueEvents,
};
