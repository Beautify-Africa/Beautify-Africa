// routes/stripeRoutes.js
const express = require('express');
const router = express.Router();

const {
  createStripePaymentIntent,
  handleStripeWebhook,
} = require('../controllers/stripeController');
const { optionalProtect } = require('../middlewares/authMiddleware');
const { paymentLimiter } = require('../middlewares/rateLimiters');

const { validateBody } = require('../middlewares/validate');
const { createStripeIntentSchema } = require('../validations/paymentValidation');

// Note: Stripe requires the raw body for webhook signature verification.
// express.raw({ type: 'application/json' }) creates a buffer before JSON parsing happens on this specific route.
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post(
  '/create-payment-intent',
  optionalProtect,
  paymentLimiter,
  express.json(),
  validateBody(createStripeIntentSchema),
  createStripePaymentIntent
);

module.exports = router;
