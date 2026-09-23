const express = require('express');
const {
  register,
  login,
  adminDashboardLogin,
  forgotPassword,
  resetPassword,
  me,
  logout,
  updateUserProfile,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  revokeAllSessions,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');
const { validateBody } = require('../middlewares/validate');
const {
  authLimiter,
  adminAuthLimiter,
  passwordResetLimiter,
  resetPasswordAttemptLimiter,
} = require('../middlewares/rateLimiters');
const {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  twoFactorEnableSchema,
  twoFactorDisableSchema,
} = require('../validations/authValidation');

const router = express.Router();

router.use(setPrivateNoStore);

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/admin-login', adminAuthLimiter, validateBody(adminLoginSchema), adminDashboardLogin);
router.post('/forgot-password', passwordResetLimiter, validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', resetPasswordAttemptLimiter, validateBody(resetPasswordSchema), resetPassword);
router.get('/me', protect, me);
router.put('/profile', protect, validateBody(updateProfileSchema), updateUserProfile);
router.post('/logout', protect, logout);

// Two-Factor Authentication (TOTP - RFC 6238)
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/enable', protect, validateBody(twoFactorEnableSchema), enableTwoFactor);
router.post('/2fa/disable', protect, validateBody(twoFactorDisableSchema), disableTwoFactor);

// Centralized Session Invalidation & Device Revocation
router.post('/revoke-all-sessions', protect, revokeAllSessions);

module.exports = router;
