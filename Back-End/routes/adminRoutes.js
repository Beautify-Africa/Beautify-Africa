const express = require('express');
const {
  getAdminDashboard,
  getAdminAnalytics,
  getReorderPlan,
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
  getAdminCustomers,
  getAdminCustomerDetail,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middlewares/authMiddleware');
const { setPrivateNoStore } = require('../middlewares/cacheHeaders');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validate');
const {
  adminOrdersQuerySchema,
  adminCustomersQuerySchema,
  adminOrderIdParamSchema,
  adminCustomerParamSchema,
  updateOrderStatusSchema,
  createOrderNoteSchema,
  adminProductSchema,
} = require('../validations/adminValidation');
const { productIdParamSchema } = require('../validations/productValidation');

const router = express.Router();

router.use(setPrivateNoStore);
router.use(protect, requireAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/analytics/summary', getAdminAnalytics);
router.get('/inventory/reorder-plan', getReorderPlan);
router.get('/orders', validateQuery(adminOrdersQuerySchema), getAdminOrders);
router.get('/orders/:id', validateParams(adminOrderIdParamSchema), getAdminOrderDetail);
router.patch(
  '/orders/:id',
  validateParams(adminOrderIdParamSchema),
  validateBody(updateOrderStatusSchema),
  updateAdminOrderStatus
);
router.post(
  '/orders/:id/notes',
  validateParams(adminOrderIdParamSchema),
  validateBody(createOrderNoteSchema),
  createAdminOrderNote
);
router.get('/orders/:id/timeline', validateParams(adminOrderIdParamSchema), getAdminOrderTimeline);
router.get('/products', getAdminProducts);
router.post('/products', validateBody(adminProductSchema), postAdminProduct);
router.put(
  '/products/:id',
  validateParams(productIdParamSchema),
  validateBody(adminProductSchema.partial()),
  putAdminProduct
);
router.patch(
  '/products/:id/archive',
  validateParams(productIdParamSchema),
  patchAdminProductArchive
);

// Customer management routes
router.get('/customers', validateQuery(adminCustomersQuerySchema), getAdminCustomers);
router.get('/customers/:id', validateParams(adminCustomerParamSchema), getAdminCustomerDetail);

// PHASE 3: Inventory management dashboard routes
router.get('/inventory/dashboard', getInventoryDashboard);
router.get('/inventory/low-stock', getLowStockDashboard);

// PHASE 3: Inventory notification routes
router.post('/inventory/notifications/trigger-low-stock', triggerLowStockNotification);
router.post('/inventory/notifications/schedule-recurring', scheduleRecurringLowStockCheck);
router.get('/inventory/notifications/status', getNotificationStatus);

module.exports = router;
