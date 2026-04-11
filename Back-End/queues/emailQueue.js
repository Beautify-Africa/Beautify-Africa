const { Queue } = require('bullmq');
const redisClient = require('../config/redis');

// Initialize the queue and bind it to our shared Redis connection
const emailQueue = new Queue('emailQueue', {
  connection: redisClient,
});

module.exports = emailQueue;
