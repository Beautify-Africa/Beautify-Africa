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

const router = express.Router();

router.use(setPrivateNoStore);

router.post('/register', register);
router.post('/login', login);
router.post('/admin-login', adminDashboardLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, me);
router.put('/profile', protect, updateUserProfile);
router.post('/logout', protect, logout);

module.exports = router;