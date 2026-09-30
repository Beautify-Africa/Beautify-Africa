// controllers/newsletterController.js
const crypto = require('crypto');
const validator = require('validator');
const { Op } = require('sequelize');
const Newsletter = require('../models/Newsletter');
const sendEmail = require('../utils/sendEmail');
const {
  generateWelcomeNewsletterEmail,
  generateNewsletterUnsubscribeEmail,
} = require('../services/emailTemplates');

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
  const ttlMinutes =
    Number.isFinite(configuredMinutes) && configuredMinutes > 0 ? configuredMinutes : 60;

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
    return res
      .status(400)
      .json({ status: 'error', message: 'Please provide a valid email address.' });
  }

  try {
    const existingSubscription = await Newsletter.findOne({ where: { email: normalizedEmail } });

    if (existingSubscription) {
      if (!existingSubscription.isActive) {
        existingSubscription.isActive = true;
        existingSubscription.unsubscribedAt = null;
        existingSubscription.unsubscribeToken = null;
        existingSubscription.unsubscribeTokenExpires = null;
        await existingSubscription.save();
      }

      return res
        .status(200)
        .json({ status: 'success', message: 'Already subscribed to the newsletter.' });
    }

    const newSubscriber = await Newsletter.create({ email: normalizedEmail });
    const manageNewsletterLink = buildNewsletterManageLink();

    // Luxury HTML Email Template
    const { html: emailHtml, text: emailText } = generateWelcomeNewsletterEmail({
      clientUrl: getClientApplicationUrl(),
      manageNewsletterLink,
      email: newSubscriber.email,
    });

    try {
      await sendEmail({
        email: newSubscriber.email,
        subject: 'Welcome to the Beautify Africa Newsletter',
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Email dispatch failed:', emailError);
      await Newsletter.destroy({ where: { id: newSubscriber.id } });
      return res.status(500).json({
        status: 'error',
        message: 'Unable to deliver welcome email right now. Please try again shortly.',
      });
    }

    return res
      .status(201)
      .json({ status: 'success', message: 'Successfully subscribed. Welcome email sent!' });
  } catch (error) {
    console.error('subscribeNewsletter error:', error);
    return res
      .status(500)
      .json({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
  }
};

// @desc    Request an unsubscribe link via email
// @route   POST /api/newsletter/unsubscribe/request
// @access  Public
const requestNewsletterUnsubscribe = async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body?.email || '');

  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Please provide a valid email address.' });
  }

  try {
    const subscriber = await Newsletter.findOne({
      where: { email: normalizedEmail, isActive: true },
    });

    if (!subscriber) {
      return res.status(200).json({
        status: 'success',
        message: UNSUBSCRIBE_REQUEST_SUCCESS_MESSAGE,
      });
    }

    const { rawToken, hashedToken, expiresAt } = createUnsubscribeTokenPayload();
    subscriber.unsubscribeToken = hashedToken;
    subscriber.unsubscribeTokenExpires = expiresAt;
    await subscriber.save();

    const unsubscribeLink = buildNewsletterUnsubscribeLink(rawToken);

    // Luxury HTML Email Template
    const { html: emailHtml, text: emailText } = generateNewsletterUnsubscribeEmail({
      unsubscribeLink,
      clientUrl: getClientApplicationUrl(),
      email: subscriber.email,
    });

    try {
      await sendEmail({
        email: subscriber.email,
        subject: 'Beautify Africa Newsletter Unsubscribe',
        text: emailText,
        html: emailHtml,
      });
    } catch (emailError) {
      subscriber.unsubscribeToken = null;
      subscriber.unsubscribeTokenExpires = null;
      await subscriber.save();

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
    return res
      .status(500)
      .json({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
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
      where: {
        unsubscribeToken: hashedToken,
        unsubscribeTokenExpires: { [Op.gt]: new Date() },
      },
    });

    if (!subscriber) {
      return res.status(400).json({
        status: 'error',
        message: 'Unsubscribe token is invalid or has expired.',
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    subscriber.unsubscribeToken = null;
    subscriber.unsubscribeTokenExpires = null;
    await subscriber.save();

    return res.status(200).json({
      status: 'success',
      message: 'You have been unsubscribed from the Beautify Africa newsletter.',
    });
  } catch (error) {
    console.error('unsubscribeNewsletter error:', error);
    return res
      .status(500)
      .json({ status: 'error', message: 'An unexpected error occurred. Please try again.' });
  }
};

module.exports = {
  subscribeNewsletter,
  requestNewsletterUnsubscribe,
  unsubscribeNewsletter,
};
