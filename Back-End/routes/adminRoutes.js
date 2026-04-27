const express = require('express');
const {
	getAdminDashboard,
	getAdminOrders,
	getAdminOrderDetail,
	updateAdminOrderStatus,
	createAdminOrderNote,
	getAdminOrderTimeline,
	getAdminProducts,
	postAdminProduct,
	putAdminProduct,
	patchAdminProductArchive,
	getLowStockDashboard,
	getInventoryDashboard,
	triggerLowStockNotification,
	scheduleRecurringLowStockCheck,
	getNotificationStatus,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');

const router = express.Router();

router.use(setPrivateNoStore);
router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderDetail);
router.patch('/orders/:id', updateAdminOrderStatus);
router.post('/orders/:id/notes', createAdminOrderNote);
router.get('/orders/:id/timeline', getAdminOrderTimeline);
router.get('/products', getAdminProducts);
router.post('/products', postAdminProduct);
router.put('/products/:id', putAdminProduct);
router.patch('/products/:id/archive', patchAdminProductArchive);

// PHASE 3: Inventory management dashboard routes
router.get('/inventory/dashboard', getInventoryDashboard);
router.get('/inventory/low-stock', getLowStockDashboard);

// PHASE 3: Inventory notification routes
router.post('/inventory/notifications/trigger-low-stock', triggerLowStockNotification);
router.post('/inventory/notifications/schedule-recurring', scheduleRecurringLowStockCheck);
router.get('/inventory/notifications/status', getNotificationStatus);

module.exports = router;
