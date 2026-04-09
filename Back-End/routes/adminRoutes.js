const express = require('express');
const { getAdminDashboard, updateAdminOrderStatus } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.patch('/orders/:id', updateAdminOrderStatus);

module.exports = router;
