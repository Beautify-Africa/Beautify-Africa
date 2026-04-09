// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpUser = String(process.env.EMAIL_USER || '').trim();
  // Support Gmail app passwords copied with visual spacing (e.g. "abcd efgh ijkl mnop").
  const smtpPass = String(process.env.EMAIL_PASS || '').replace(/\s+/g, '');
  const smtpHost = String(process.env.EMAIL_HOST || 'smtp.gmail.com').trim();
  const smtpPort = Number(process.env.EMAIL_PORT || 587);

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP credentials are not configured. Set EMAIL_USER and EMAIL_PASS.');
  }

  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // 2. Define the email options
  const mailOptions = {
    from: `"Beautify Africa" <${smtpUser}>`,
    to: options.email,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // 3. Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
