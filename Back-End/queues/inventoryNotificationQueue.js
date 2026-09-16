// queues/inventoryNotificationQueue.js
// Queue for inventory notification jobs (low stock alerts, restock reminders)
const { Queue, QueueEvents } = require('bullmq');
const createBullmqRedisConnection = require('../config/bullmqRedis');

const isTestEnv = process.env.NODE_ENV === 'test';

const inventoryNotificationQueueConnection = createBullmqRedisConnection();
const inventoryNotificationQueueEventsConnection = isTestEnv ? null : createBullmqRedisConnection();

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
const inventoryNotificationQueueEvents = inventoryNotificationQueueEventsConnection
  ? new QueueEvents('inventoryNotifications', {
      connection: inventoryNotificationQueueEventsConnection,
    })
  : null;

async function closeInventoryNotificationQueue() {
  try {
    if (inventoryNotificationQueueEvents) {
      await inventoryNotificationQueueEvents.close();
    }
    await inventoryNotificationQueue.close();
  } catch {
    // Ignore error during test teardown
  }
  try {
    if (
      inventoryNotificationQueueConnection &&
      inventoryNotificationQueueConnection.status !== 'end'
    ) {
      await inventoryNotificationQueueConnection
        .quit()
        .catch(() => inventoryNotificationQueueConnection.disconnect());
    }
    if (
      inventoryNotificationQueueEventsConnection &&
      inventoryNotificationQueueEventsConnection.status !== 'end'
    ) {
      await inventoryNotificationQueueEventsConnection
        .quit()
        .catch(() => inventoryNotificationQueueEventsConnection.disconnect());
    }
  } catch {
    // Ignore error during test teardown
  }
}

module.exports = {
  inventoryNotificationQueue,
  inventoryNotificationQueueEvents,
  closeInventoryNotificationQueue,
};
