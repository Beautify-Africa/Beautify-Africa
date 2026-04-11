const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const nodemailer = require('nodemailer');

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { email, subject, text, html } = job.data;
    
    // Extracted from original sendEmail.js
    const smtpUser = String(process.env.EMAIL_USER || '').trim();
    const smtpPass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');
    const smtpHost = String(process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
    const smtpPort = Number(process.env.EMAIL_PORT || 587);

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP credentials are not configured. Set EMAIL_USER and EMAIL_PASS.');
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"Beautify Africa" <${smtpUser}>`,
      to: email,
      subject: subject,
      text: text,
      html: html,
    };

    console.log(`[Worker] Processing email job: sending '${subject}' to ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Worker] Completed email job: ${info.messageId}`);
    return info;
  },
  {
    connection: redisClient,
    concurrency: 5, // Send up to 5 emails in parallel without blocking Express
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[Worker] Email job ${job.id} has completed processing!`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[Worker] Email job ${job.id} has failed with error: ${err.message}`);
});

module.exports = emailWorker;
