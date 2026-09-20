// services/adminService.js - Facade maintaining full backward compatibility
const dashboardService = require('./admin/adminDashboardService');
const orderService = require('./admin/adminOrderService');
const productService = require('./admin/adminProductService');

module.exports = {
  // Dashboard & Analytics
  FULFILLMENT_STATUSES: orderService.FULFILLMENT_STATUSES,
  SUPPORTED_ADMIN_ACTIONS: orderService.SUPPORTED_ADMIN_ACTIONS,
  SUPPORTED_ADMIN_ORDER_SORTS: orderService.SUPPORTED_ADMIN_ORDER_SORTS,
  buildAdminDashboardFromOrders: dashboardService.buildAdminDashboardFromOrders,
  fetchAdminDashboard: dashboardService.fetchAdminDashboard,
  fetchAdminAnalytics: dashboardService.fetchAdminAnalytics,
  fetchReorderPlan: dashboardService.fetchReorderPlan,

  // Orders
  updateAdminOrder: orderService.updateAdminOrder,
  applyAdminOrderAction: orderService.applyAdminOrderAction,
  addAdminOrderNote: orderService.addAdminOrderNote,
  fetchAdminOrderTimeline: orderService.fetchAdminOrderTimeline,
  fetchAdminOrderDetail: orderService.fetchAdminOrderDetail,
  fetchAdminOrders: orderService.fetchAdminOrders,

  // Products
  fetchAdminProducts: productService.fetchAdminProducts,
  createAdminProduct: productService.createAdminProduct,
  updateAdminProduct: productService.updateAdminProduct,
  setAdminProductArchived: productService.setAdminProductArchived,
};
