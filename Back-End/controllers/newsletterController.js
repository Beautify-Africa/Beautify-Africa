// controllers/newsletterController.js
const crypto = require('crypto');
const validator = require('validator');
const Newsletter = require('../models/Newsletter');
const sendEmail = require('../utils/sendEmail');

const UNSUBSCRIBE_REQUEST_SUCCESS_MESSAGE =
  'If that email is subscribed, we have sent an unsubscribe link.';

function normalizeEmail(email = '') {
  return String(email).toLowerCase().trim();
}

function hashUnsubscribeToken(rawToken = '') {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function createUnsubscribeTokenPayload() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const configuredMinutes = Number(process.env.NEWSLETTER_UNSUBSCRIBE_TOKEN_TTL_MINUTES || 60);
  const ttlMinutes = Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 60;

  return {
    rawToken,
    hashedToken: hashUnsubscribeToken(rawToken),
    expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000),
  };
}

function getClientApplicationUrl() {
  const configuredUrl = String(
    process.env.NEWSLETTER_UNSUBSCRIBE_URL_BASE ||
      process.env.CLIENT_URL ||
      process.env.FRONT_END_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:5173'
  )
    .split(',')[0]
    .trim();

  return configuredUrl.replace(/\/+$/, '');
}

function buildNewsletterUnsubscribeLink(rawToken) {
  return `${getClientApplicationUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(rawToken)}`;
}

function buildNewsletterManageLink() {
  return `${getClientApplicationUrl()}/newsletter/unsubscribe-request`;
}

// @desc    Subscribe to the newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
const subscribeNewsletter = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email || '');

  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
  }

  try {
    const existingSubscription = await Newsletter.findOne({ email: normalizedEmail });

    if (existingSubscription) {
      if (!existingSubscription.isActive) {
        existingSubscription.isActive = true;
        existingSubscription.unsubscribedAt = null;
        existingSubscription.unsubscribeToken = undefined;
        existingSubscription.unsubscribeTokenExpires = undefined;
        await existingSubscription.save({ validateBeforeSave: false });
      }

      return res.status(200).json({ status: 'success', message: 'Already subscribed to the newsletter.' });
    }

    const newSubscriber = await Newsletter.create({ email: normalizedEmail });
    const manageNewsletterLink = buildNewsletterManageLink();

    // HTML Email Template
    const emailHtml = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1c1917; padding: 20px; border: 1px solid #e7e5e4;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #451a03; font-size: 28px; font-weight: normal; margin: 0; letter-spacing: 2px;">BEAUTIFY AFRICA</h1>
          <p style="text-transform: uppercase; letter-spacing: 4px; font-size: 10px; color: #78716c; margin-top: 5px;">Skincare Excellence</p>
        </div>

        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">Hello,</p>

        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
          Thank you for subscribing to the Beautify Africa newsletter! We are thrilled to welcome you to our community.
        </p>

        <p style="font-size: 16px; line-height: 1.6; color: #44403c;">
          You are now on the exclusive list to receive our latest product launches, skincare secrets, and VIP promotional offers directly in your inbox.
        </p>

        <div style="text-align: center; margin: 40px 0;">
          <a href="${getClientApplicationUrl()}/shop" style="background-color: #1c1917; color: #ffffff; padding: 14px 30px; text-decoration: none; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; font-weight: bold; display: inline-block;">
            Shop Collection
          </a>
        </div>

        <p style="font-size: 12px; line-height: 1.6; color: #78716c; text-align: center; margin-bottom: 18px;">
          You can unsubscribe at any time from your newsletter settings.
        </p>

        <p style="text-align: center; margin: 0 0 20px 0;">
          <a href="${manageNewsletterLink}" style="font-size: 12px; color: #57534e; text-decoration: underline; letter-spacing: 0.04em; text-transform: uppercase;">Manage newsletter preferences</a>
        </p>

        <p style="font-size: 14px; color: #78716c; border-top: 1px solid #e7e5e4; padding-top: 20px; text-align: center;">
          Always authentically African.
        </p>
      </div>
    `;

    // Attempt to send email
    try {
      await sendEmail({
        email: newSubscriber.email,
        subject: 'Welcome to the Beautify Africa Newsletter',
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Email dispatch failed:', emailError);
      // We still return success since the database record successfully captured the email.
      return res.status(201).json({
        status: 'success',
        message: 'Successfully subscribed (Email currently offline).',
      });
    }

    return res.status(201).json({ status: 'success', message: 'Successfully subscribed. Welcome email sent!' });
  } catch (error) {
    console.error('subscribeNewsletter error:', error);
    return res.status(500).json({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
  }
};

// @desc    Request an unsubscribe link via email
// @route   POST /api/newsletter/unsubscribe/request
// @access  Public
const requestNewsletterUnsubscribe = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email || '');

  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return res.status(400).json({ status: 'error', message: 'Please provide a valid email address.' });
  }

  try {
    const subscriber = await Newsletter.findOne({ email: normalizedEmail, isActive: true });

    if (!subscriber) {
      return res.status(200).json({
        status: 'success',
        message: UNSUBSCRIBE_REQUEST_SUCCESS_MESSAGE,
      });
    }

    const { rawToken, hashedToken, expiresAt } = createUnsubscribeTokenPayload();
    subscriber.unsubscribeToken = hashedToken;
    subscriber.unsubscribeTokenExpires = expiresAt;
    await subscriber.save({ validateBeforeSave: false });

    const unsubscribeLink = buildNewsletterUnsubscribeLink(rawToken);

    const emailText = [
      'Unsubscribe from Beautify Africa newsletter',
      '',
      'We received a request to unsubscribe this email from our newsletter.',
      'Use the link below to confirm the unsubscribe request:',
      unsubscribeLink,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n');

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#292524;max-width:620px;margin:0 auto;">
        <h2 style="font-size:24px;margin-bottom:16px;">Confirm newsletter unsubscribe</h2>
        <p style="margin-bottom:12px;">We received a request to remove this email from Beautify Africa newsletter updates.</p>
        <p style="margin-bottom:18px;">Click the button below to confirm. This link expires shortly for your security.</p>
        <p style="margin:24px 0;">
          <a href="${unsubscribeLink}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 18px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Confirm Unsubscribe</a>
        </p>
        <p style="font-size:13px;color:#57534e;word-break:break-all;">If the button does not work, copy and paste this link into your browser:<br />${unsubscribeLink}</p>
      </div>
    `;

    try {
      await sendEmail({
        email: subscriber.email,
        subject: 'Beautify Africa Newsletter Unsubscribe',
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      subscriber.unsubscribeToken = undefined;
      subscriber.unsubscribeTokenExpires = undefined;
      await subscriber.save({ validateBeforeSave: false });

      return res.status(500).json({
        status: 'error',
        message: 'Unable to deliver unsubscribe email right now. Please try again shortly.',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: UNSUBSCRIBE_REQUEST_SUCCESS_MESSAGE,
    });
  } catch (error) {
    console.error('requestNewsletterUnsubscribe error:', error);
    return res.status(500).json({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
  }
};

// @desc    Confirm newsletter unsubscribe with token
// @route   POST /api/newsletter/unsubscribe/confirm
// @access  Public
const unsubscribeNewsletter = async (req, res) => {
  const token = String(req.body?.token || req.query?.token || '').trim();

  if (!token) {
    return res.status(400).json({ status: 'error', message: 'Unsubscribe token is required.' });
  }

  try {
    const hashedToken = hashUnsubscribeToken(token);
    const subscriber = await Newsletter.findOne({
      unsubscribeToken: hashedToken,
      unsubscribeTokenExpires: { $gt: new Date() },
    });

    if (!subscriber) {
      return res.status(400).json({
        status: 'error',
        message: 'Unsubscribe token is invalid or has expired.',
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    subscriber.unsubscribeToken = undefined;
    subscriber.unsubscribeTokenExpires = undefined;
    await subscriber.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: 'success',
      message: 'You have been unsubscribed from the Beautify Africa newsletter.',
    });
  } catch (error) {
    console.error('unsubscribeNewsletter error:', error);
    return res.status(500).json({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
  }
};

module.exports = {
  subscribeNewsletter,
  requestNewsletterUnsubscribe,
  unsubscribeNewsletter,
};
