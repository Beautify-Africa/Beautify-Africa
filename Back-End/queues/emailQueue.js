const { Queue, QueueEvents } = require('bullmq');
const redisClient = require('../config/redis');

// Initialize the queue and bind it to our shared Redis connection
const emailQueue = new Queue('emailQueue', {
  connection: redisClient,
});

const emailQueueEvents = new QueueEvents('emailQueue', {
  connection: redisClient,
});

module.exports = {
  emailQueue,
  emailQueueEvents,
};
