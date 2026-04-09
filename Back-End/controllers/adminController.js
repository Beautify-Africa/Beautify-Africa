const { fetchAdminDashboard, updateAdminOrder } = require('../services/adminService');

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

async function updateAdminOrderStatus(req, res) {
  try {
    const updatedOrder = await updateAdminOrder(req.params.id, req.body?.action);

    return res.status(200).json({
      status: 'success',
      data: updatedOrder,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message =
      statusCode === 500
        ? 'An unexpected error occurred while updating the order.'
        : error.message;

    if (statusCode === 500) {
      console.error('updateAdminOrderStatus error:', error);
    }

    return res.status(statusCode).json({
      status: 'error',
      message,
    });
  }
}

module.exports = {
  getAdminDashboard,
  updateAdminOrderStatus,
};
