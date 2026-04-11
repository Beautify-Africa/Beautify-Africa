// utils/sendEmail.js
const emailQueue = require('../queues/emailQueue');

const sendEmail = async (options) => {
  console.log(`[API] Offloading email task to background queue for ${options.email}...`);
  
  // Push the email payload onto the BullMQ background queue
  await emailQueue.add('sendEmailJob', {
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

  console.log(`[API] Successfully queued email task! Express can now resume immediately.`);
};

module.exports = sendEmail;
