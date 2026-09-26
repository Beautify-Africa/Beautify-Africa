const {
  fetchAdminDashboard,
  fetchAdminAnalytics,
  fetchReorderPlan,
  updateAdminOrder,
  addAdminOrderNote,
  fetchAdminOrderTimeline,
  fetchAdminOrderDetail,
  fetchAdminOrders,
} = require('../../services/adminService');
const { handleAdminError } = require('./adminErrorHelper');

async function getAdminDashboard(req, res) {
  try {
    const dashboard = await fetchAdminDashboard();
    return res.status(200).json({
      status: 'success',
      data: dashboard,
    });
  } catch (error) {
    console.error('getAdminDashboard error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching the admin dashboard.',
    });
  }
}

async function getAdminAnalytics(req, res) {
  try {
    const analytics = await fetchAdminAnalytics();
    return res.status(200).json({
      status: 'success',
      data: analytics,
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while fetching analytics.',
    });
  }
}

async function getReorderPlan(req, res) {
  try {
    const reorderPlan = await fetchReorderPlan({
      threshold: req.query?.threshold,
      leadTimeDays: req.query?.leadTimeDays,
      windowDays: req.query?.windowDays,
    });

    const wantsCsv = String(req.query?.format || '').toLowerCase() === 'csv';

    if (wantsCsv) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${reorderPlan.filename}"`);
      return res.status(200).send(reorderPlan.csv);
    }

    return res.status(200).json({
      status: 'success',
      data: reorderPlan,
    });
  } catch (error) {
    console.error('getReorderPlan error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while building reorder recommendations.',
    });
  }
}

async function updateAdminOrderStatus(req, res) {
  try {
    const updatedOrder = await updateAdminOrder(
      req.params.id,
      req.body?.action,
      req.user,
      req.body?.note
    );

    return res.status(200).json({
      status: 'success',
      data: updatedOrder,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while updating the order.',
      'updateAdminOrderStatus'
    );
  }
}

async function createAdminOrderNote(req, res) {
  try {
    const note = await addAdminOrderNote(req.params.id, req.body?.note, req.user);

    return res.status(201).json({
      status: 'success',
      data: note,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while saving the order note.',
      'createAdminOrderNote'
    );
  }
}

async function getAdminOrderTimeline(req, res) {
  try {
    const timeline = await fetchAdminOrderTimeline(req.params.id);

    return res.status(200).json({
      status: 'success',
      data: timeline,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while fetching order timeline.',
      'getAdminOrderTimeline'
    );
  }
}

async function getAdminOrderDetail(req, res) {
  try {
    const order = await fetchAdminOrderDetail(req.params.id);

    return res.status(200).json({
      status: 'success',
      data: order,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while fetching order detail.',
      'getAdminOrderDetail'
    );
  }
}

async function getAdminOrders(req, res) {
  try {
    const orders = await fetchAdminOrders(req.query);

    return res.status(200).json({
      status: 'success',
      data: orders,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while fetching admin orders.',
      'getAdminOrders'
    );
  }
}

module.exports = {
  getAdminDashboard,
  getAdminAnalytics,
  getReorderPlan,
  updateAdminOrderStatus,
  createAdminOrderNote,
  getAdminOrderTimeline,
  getAdminOrderDetail,
  getAdminOrders,
};
