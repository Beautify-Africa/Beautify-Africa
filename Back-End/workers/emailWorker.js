const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const { Resend } = require('resend');

function buildFromAddress() {
  const resendFrom = String(process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || '').trim();
  return (
    resendFrom || 'Beautify Africa <onboarding@resend.dev>'
  );
}

async function sendViaResend({ to, subject, text, html }) {
  const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!resendApiKey) {
    throw new Error('Resend API key is missing. Set RESEND_API_KEY in environment variables.');
  }

  const resend = new Resend(resendApiKey);
  const response = await resend.emails.send({
    from: buildFromAddress(),
    to,
    subject,
    text,
    html,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return {
    provider: 'resend',
    id: response.data?.id,
  };
}

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { email, subject, text, html } = job.data;

    console.log(`[Worker] Processing email job: sending '${subject}' to ${email}...`);

    const resendResult = await sendViaResend({ to: email, subject, text, html });
    console.log(`[Worker] Completed Resend job: ${resendResult.id}`);
    return resendResult;
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
