const express = require('express');
const { getAdminDashboard, updateAdminOrderStatus } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');

const router = express.Router();

router.use(setPrivateNoStore);
router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.patch('/orders/:id', updateAdminOrderStatus);

module.exports = router;
