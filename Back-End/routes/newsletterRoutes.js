// routes/newsletterRoutes.js
const express = require('express');
const router = express.Router();
const {
  subscribeNewsletter,
  requestNewsletterUnsubscribe,
  unsubscribeNewsletter,
} = require('../controllers/newsletterController');
const { newsletterLimiter } = require('../middlewares/rateLimiters');
const { validateBody } = require('../middlewares/validate');
const {
  subscribeSchema,
  unsubscribeRequestSchema,
  unsubscribeConfirmSchema,
} = require('../validations/newsletterValidation');

router.post('/subscribe', newsletterLimiter, validateBody(subscribeSchema), subscribeNewsletter);
router.post(
  '/unsubscribe/request',
  newsletterLimiter,
  validateBody(unsubscribeRequestSchema),
  requestNewsletterUnsubscribe
);
router.post('/unsubscribe/confirm', validateBody(unsubscribeConfirmSchema), unsubscribeNewsletter);

module.exports = router;
