const {
  fetchAdminCustomers,
  fetchAdminCustomerDetail,
} = require('../../services/adminCustomerService');
const { handleAdminError } = require('./adminErrorHelper');

async function getAdminCustomers(req, res) {
  try {
    const data = await fetchAdminCustomers(req.query);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while fetching customers.',
      'getAdminCustomers'
    );
  }
}

async function getAdminCustomerDetail(req, res) {
  try {
    const data = await fetchAdminCustomerDetail(req.params.id);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while fetching customer details.',
      'getAdminCustomerDetail'
    );
  }
}

module.exports = {
  getAdminCustomers,
  getAdminCustomerDetail,
};
