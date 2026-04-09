// routes/newsletterRoutes.js
const express = require('express');
const router = express.Router();
const {
  subscribeNewsletter,
  requestNewsletterUnsubscribe,
  unsubscribeNewsletter,
} = require('../controllers/newsletterController');

router.post('/subscribe', subscribeNewsletter);
router.post('/unsubscribe/request', requestNewsletterUnsubscribe);
router.post('/unsubscribe/confirm', unsubscribeNewsletter);

module.exports = router;
