const { Queue, QueueEvents } = require('bullmq');
const createBullmqRedisConnection = require('../config/bullmqRedis');

const emailQueueConnection = createBullmqRedisConnection();
const emailQueueEventsConnection = createBullmqRedisConnection();

// Initialize the queue and bind it to a dedicated BullMQ Redis connection.
const emailQueue = new Queue('emailQueue', {
  connection: emailQueueConnection,
});

const emailQueueEvents = new QueueEvents('emailQueue', {
  connection: emailQueueEventsConnection,
});

module.exports = {
  emailQueue,
  emailQueueEvents,
};
