import { API_URL, requestJson } from '../apiConfig';

export async function fetchAdminProducts(query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const json = await requestJson(`${API_URL}/admin/products${search ? `?${search}` : ''}`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch admin products.',
  });

  return json.data;
}

export async function createAdminProduct(payload, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: payload,
    fallbackMessage: 'Failed to create product.',
  });

  return json.data;
}

export async function updateAdminProduct(productId, payload, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}`, {
    ...requestOptions,
    method: 'PUT',
    token,
    body: payload,
    fallbackMessage: 'Failed to update product.',
  });

  return json.data;
}

export async function setAdminProductArchived(productId, isArchived, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/archive`, {
    ...requestOptions,
    method: 'PATCH',
    token,
    body: { isArchived: Boolean(isArchived) },
    fallbackMessage: `Failed to ${isArchived ? 'archive' : 'unarchive'} product.`,
  });

  return json.data;
}

export async function getProductVariants(productId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/variants`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch product variants.',
  });

  return json.data;
}

export async function addProductVariant(productId, variantData, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/variants`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: variantData,
    fallbackMessage: 'Failed to add product variant.',
  });

  return json.data;
}

export async function updateProductVariant(
  productId,
  variantId,
  variantData,
  token,
  requestOptions = {}
) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/variants/${variantId}`, {
    ...requestOptions,
    method: 'PUT',
    token,
    body: variantData,
    fallbackMessage: 'Failed to update product variant.',
  });

  return json.data;
}

export async function deleteProductVariant(productId, variantId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/variants/${variantId}`, {
    ...requestOptions,
    method: 'DELETE',
    token,
    fallbackMessage: 'Failed to delete product variant.',
  });

  return json.data;
}

export async function setProductStatus(productId, newStatus, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/status`, {
    ...requestOptions,
    method: 'PATCH',
    token,
    body: { status: newStatus },
    fallbackMessage: 'Failed to update product status.',
  });

  return json.data;
}

export async function duplicateProduct(productId, newName, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/${productId}/duplicate`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: { name: newName },
    fallbackMessage: 'Failed to duplicate product.',
  });

  return json.data;
}

export async function exportAdminProducts(query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const response = await fetch(`${API_URL}/admin/products/export${search ? `?${search}` : ''}`, {
    ...requestOptions,
    credentials: 'include',
  });

  if (!response.ok) {
    const csv = await response.text();
    throw new Error(csv || 'Failed to export products.');
  }

  return response.blob();
}

export async function importAdminProducts(csvText, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/products/import`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: { csvData: csvText },
    fallbackMessage: 'Failed to import products.',
  });

  return json.data;
}
