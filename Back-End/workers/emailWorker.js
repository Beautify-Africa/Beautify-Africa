const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const { Resend } = require('resend');

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { email, subject, text, html } = job.data;
    
    const resendApiKey = process.env.RESEND_API_KEY || '';
    if (!resendApiKey) {
      throw new Error('Resend API key is missing. Set RESEND_API_KEY in environment variables.');
    }

    const resend = new Resend(resendApiKey);

    const payload = {
      from: 'Beautify Africa <onboarding@resend.dev>', // Required for free tier until domain verification
      to: email,
      subject: subject,
      text: text,
      html: html,
    };

    console.log(`[Worker] Processing Resend job: sending '${subject}' to ${email}...`);
    
    // Dispatch securely over HTTP Port 443
    const response = await resend.emails.send(payload);
    
    if (response.error) {
      throw new Error(response.error.message);
    }

    console.log(`[Worker] Completed Resend job: ${response.data.id}`);
    return response.data;
  },
  {
    connection: redisClient,
    concurrency: 5, // Process up to 5 emails simultaneously
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[Worker] Email job ${job.id} has completed processing!`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Email job ${job.id} has failed with error: ${err.message}`);
});

module.exports = emailWorker;
