// routes/newsletterRoutes.js
const express = require('express');
const router = express.Router();
const {
  subscribeNewsletter,
  requestNewsletterUnsubscribe,
  unsubscribeNewsletter,
} = require('../controllers/newsletterController');
const { newsletterLimiter } = require('../middlewares/rateLimiters');

router.post('/subscribe', newsletterLimiter, subscribeNewsletter);
router.post('/unsubscribe/request', newsletterLimiter, requestNewsletterUnsubscribe);
router.post('/unsubscribe/confirm', unsubscribeNewsletter);

module.exports = router;
