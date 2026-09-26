// controllers/adminController.js - Facade maintaining full backward compatibility
const orderController = require('./admin/adminOrderController');
const productController = require('./admin/adminProductController');
const inventoryController = require('./admin/adminInventoryController');
const customerController = require('./admin/adminCustomerController');

module.exports = {
  // Dashboard, Analytics & Orders
  getAdminDashboard: orderController.getAdminDashboard,
  getAdminAnalytics: orderController.getAdminAnalytics,
  getReorderPlan: orderController.getReorderPlan,
  updateAdminOrderStatus: orderController.updateAdminOrderStatus,
  createAdminOrderNote: orderController.createAdminOrderNote,
  getAdminOrderTimeline: orderController.getAdminOrderTimeline,
  getAdminOrderDetail: orderController.getAdminOrderDetail,
  getAdminOrders: orderController.getAdminOrders,

  // Products
  getAdminProducts: productController.getAdminProducts,
  postAdminProduct: productController.postAdminProduct,
  putAdminProduct: productController.putAdminProduct,
  patchAdminProductArchive: productController.patchAdminProductArchive,

  // Inventory
  getLowStockDashboard: inventoryController.getLowStockDashboard,
  getInventoryDashboard: inventoryController.getInventoryDashboard,
  triggerLowStockNotification: inventoryController.triggerLowStockNotification,
  scheduleRecurringLowStockCheck: inventoryController.scheduleRecurringLowStockCheck,
  getNotificationStatus: inventoryController.getNotificationStatus,

  // Customers
  getAdminCustomers: customerController.getAdminCustomers,
  getAdminCustomerDetail: customerController.getAdminCustomerDetail,
};
