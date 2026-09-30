const {
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  setAdminProductArchived,
} = require('../../services/adminService');
const { handleAdminError } = require('./adminErrorHelper');

async function getAdminProducts(req, res) {
  try {
    const products = await fetchAdminProducts(req.query);

    return res.status(200).json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while fetching admin products.',
      'getAdminProducts'
    );
  }
}

async function postAdminProduct(req, res) {
  try {
    const product = await createAdminProduct(req.body);

    return res.status(201).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while creating the product.',
      'postAdminProduct'
    );
  }
}

async function putAdminProduct(req, res) {
  try {
    const product = await updateAdminProduct(req.params.id, req.body);

    return res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while updating the product.',
      'putAdminProduct'
    );
  }
}

async function patchAdminProductArchive(req, res) {
  try {
    const product = await setAdminProductArchived(req.params.id, req.body?.isArchived);

    return res.status(200).json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    return handleAdminError(
      error,
      res,
      'An unexpected error occurred while updating archive status.',
      'patchAdminProductArchive'
    );
  }
}

module.exports = {
  getAdminProducts,
  postAdminProduct,
  putAdminProduct,
  patchAdminProductArchive,
};
