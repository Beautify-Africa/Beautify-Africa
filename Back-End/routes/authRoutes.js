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
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');
const { validateBody } = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require('../validations/authValidation');

const router = express.Router();

router.use(setPrivateNoStore);

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/admin-login', validateBody(adminLoginSchema), adminDashboardLogin);
router.post('/forgot-password', validateBody(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), resetPassword);
router.get('/me', protect, me);
router.put('/profile', protect, validateBody(updateProfileSchema), updateUserProfile);
router.post('/logout', protect, logout);

module.exports = router;
