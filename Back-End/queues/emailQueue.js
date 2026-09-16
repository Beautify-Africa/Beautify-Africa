const { Queue, QueueEvents } = require('bullmq');
const createBullmqRedisConnection = require('../config/bullmqRedis');

const isTestEnv = process.env.NODE_ENV === 'test';

const emailQueueConnection = createBullmqRedisConnection();
const emailQueueEventsConnection = isTestEnv ? null : createBullmqRedisConnection();

// Initialize the queue and bind it to a dedicated BullMQ Redis connection.
const emailQueue = new Queue('emailQueue', {
  connection: emailQueueConnection,
});

const emailQueueEvents = emailQueueEventsConnection
  ? new QueueEvents('emailQueue', {
      connection: emailQueueEventsConnection,
    })
  : null;

async function closeEmailQueue() {
  try {
    if (emailQueueEvents) {
      await emailQueueEvents.close();
    }
    await emailQueue.close();
  } catch {
    // Ignore error during test teardown
  }
  try {
    if (emailQueueConnection && emailQueueConnection.status !== 'end') {
      await emailQueueConnection.quit().catch(() => emailQueueConnection.disconnect());
    }
    if (emailQueueEventsConnection && emailQueueEventsConnection.status !== 'end') {
      await emailQueueEventsConnection.quit().catch(() => emailQueueEventsConnection.disconnect());
    }
  } catch {
    // Ignore error during test teardown
  }
}

module.exports = {
  emailQueue,
  emailQueueEvents,
  closeEmailQueue,
};
