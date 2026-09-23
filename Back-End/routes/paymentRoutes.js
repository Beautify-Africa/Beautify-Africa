// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
  handleWebhook,
  getGateways,
} = require('../controllers/paymentController');
const { optionalProtect } = require('../middlewares/authMiddleware');
const {
  paymentLimiter,
  paymentVerificationLimiter,
  apiLimiter,
} = require('../middlewares/rateLimiters');

// Webhooks require raw body buffer for HMAC signature verification
router.post('/webhook/:gateway', express.raw({ type: 'application/json' }), handleWebhook);

// Payment initialization: optionalProtect first so limiter can associate with authenticated user
router.post('/initialize', optionalProtect, paymentLimiter, express.json(), initializePayment);

// Payment verification (polling or return callback): generous verification limiter so polling never blocks checkout
router.get(
  '/verify/:gateway/:reference',
  optionalProtect,
  paymentVerificationLimiter,
  verifyPayment
);

// Supported gateways metadata
router.get('/gateways', apiLimiter, getGateways);

module.exports = router;
