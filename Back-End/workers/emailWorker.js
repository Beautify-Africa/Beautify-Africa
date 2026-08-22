const { Worker } = require('bullmq');
const createBullmqRedisConnection = require('../config/bullmqRedis');
const { Resend } = require('resend');
const nodemailer = require('nodemailer');

const bullmqRedisConnection = createBullmqRedisConnection();

function buildFromAddress() {
  const resendFrom = String(process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || '').trim();
  return (
    resendFrom || 'Beautify Africa <onboarding@resend.dev>'
  );
}

function hasSmtpCredentials() {
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
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

async function sendViaNodemailer({ to, subject, text, html }) {
  if (!hasSmtpCredentials()) {
    throw new Error('SMTP credentials missing. Set EMAIL_USER and EMAIL_PASS in environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587', 10),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const from = process.env.EMAIL_FROM || `Beautify Africa <${process.env.EMAIL_USER}>`;
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });

  return {
    provider: 'nodemailer',
    id: info.messageId,
  };
}

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { email, subject, text, html } = job.data;

    console.log(`[Worker] Processing email job: sending '${subject}' to ${email}...`);

    let lastError;

    // 1. Try Resend if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resendResult = await sendViaResend({ to: email, subject, text, html });
        console.log(`[Worker] Completed Resend job: ${resendResult.id}`);
        return resendResult;
      } catch (err) {
        lastError = err;
        console.warn(`[Worker] Resend dispatch failed (${err.message}). Attempting SMTP fallback...`);
      }
    }

    // 2. Fallback to Nodemailer / SMTP
    if (hasSmtpCredentials()) {
      try {
        const nodemailerResult = await sendViaNodemailer({ to: email, subject, text, html });
        console.log(`[Worker] Completed Nodemailer (SMTP) job: ${nodemailerResult.id}`);
        return nodemailerResult;
      } catch (smtpErr) {
        lastError = smtpErr;
        console.error(`[Worker] SMTP fallback failed: ${smtpErr.message}`);
      }
    }

    throw new Error(lastError ? lastError.message : 'No email dispatch provider configured.');
  },
  {
    connection: bullmqRedisConnection,
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
