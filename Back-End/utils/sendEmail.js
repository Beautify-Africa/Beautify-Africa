// utils/sendEmail.js
let emailQueue;
let emailQueueEvents;

function getEmailQueue() {
  if (!emailQueue || !emailQueueEvents) {
    ({ emailQueue, emailQueueEvents } = require('../queues/emailQueue'));
  }

  return { emailQueue, emailQueueEvents };
}

const sendEmail = async (options) => {
  console.log(`[API] Offloading email task to background queue for ${options.email}...`);

  const { emailQueue: queue, emailQueueEvents: queueEvents } = getEmailQueue();

  // Push the email payload onto the BullMQ background queue
  const job = await queue.add('sendEmailJob', {
    email: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html,
  }, {
    attempts: 3, // Automatically retry 3 times if it encounters network errors
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5s, 10s, 20s if it fails
    }
  });

  await job.waitUntilFinished(queueEvents, 30000);

  console.log(`[API] Successfully queued email task! Express can now resume immediately.`);
};

module.exports = sendEmail;
