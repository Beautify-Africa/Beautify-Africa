const express = require('express');
const {
	register,
	login,
	adminDashboardLogin,
	forgotPassword,
	resetPassword,
	me,
	updateUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminDashboardLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, me);
router.put('/profile', protect, updateUserProfile);

module.exports = router;