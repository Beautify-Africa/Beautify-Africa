import { API_URL, requestJson } from './apiConfig';

export async function fetchAdminDashboard(token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/dashboard`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch admin dashboard.',
  });

  return json.data;
}

export async function fetchAdminOrders(query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const json = await requestJson(`${API_URL}/admin/orders${search ? `?${search}` : ''}`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch admin orders.',
  });

  return json.data;
}

export async function fetchAdminOrderDetail(orderId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/orders/${orderId}`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch order detail.',
  });

  return json.data;
}

export async function updateAdminOrderAction(orderId, action, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/orders/${orderId}`, {
    ...requestOptions,
    method: 'PATCH',
    token,
    body: { action },
    cache: 'no-store',
    fallbackMessage: 'Failed to update the order.',
  });

  return json.data;
}

export async function addAdminOrderNote(orderId, note, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/orders/${orderId}/notes`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: { note },
    cache: 'no-store',
    fallbackMessage: 'Failed to add order note.',
  });

  return json.data;
}

export async function fetchAdminOrderTimeline(orderId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/orders/${orderId}/timeline`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch order timeline.',
  });

  return json.data;
}

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
    cache: 'no-store',
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
    cache: 'no-store',
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
    body: { isArchived },
    cache: 'no-store',
    fallbackMessage: 'Failed to update archive status.',
  });

  return json.data;
}

// ===== PHASE 3: Variant Management =====
export async function getProductVariants(productId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/products/${productId}/variants`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch product variants.',
  });

  return json.data || [];
}

export async function addProductVariant(productId, variantData, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/products/${productId}/variants`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: variantData,
    cache: 'no-store',
    fallbackMessage: 'Failed to add variant.',
  });

  return json.data;
}

export async function updateProductVariant(
  productId,
  variantId,
  updates,
  token,
  requestOptions = {}
) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/products/${productId}/variants/${variantId}`, {
    ...requestOptions,
    method: 'PUT',
    token,
    body: updates,
    cache: 'no-store',
    fallbackMessage: 'Failed to update variant.',
  });

  return json.data;
}

export async function deleteProductVariant(productId, variantId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/products/${productId}/variants/${variantId}`, {
    ...requestOptions,
    method: 'DELETE',
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to delete variant.',
  });

  return json.data;
}

export async function setProductStatus(productId, newStatus, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/products/${productId}/status`, {
    ...requestOptions,
    method: 'PATCH',
    token,
    body: { status: newStatus },
    cache: 'no-store',
    fallbackMessage: 'Failed to update product status.',
  });

  return json.data;
}

export async function duplicateProduct(productId, newName, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/products/${productId}/duplicate`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: { newName },
    cache: 'no-store',
    fallbackMessage: 'Failed to duplicate product.',
  });

  return json.data;
}

// ===== PHASE 3: Inventory Management =====
export async function fetchInventoryDashboard(token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/inventory/dashboard`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch inventory dashboard.',
  });

  return json.data;
}

export async function fetchLowStockItems(query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const json = await requestJson(
    `${API_URL}/admin/inventory/low-stock${search ? `?${search}` : ''}`,
    {
      ...requestOptions,
      token,
      cache: 'no-store',
      fallbackMessage: 'Failed to fetch low stock items.',
    }
  );

  return json.data;
}

export async function adjustVariantStock(
  productId,
  variantId,
  quantity,
  reason,
  notes = '',
  token,
  requestOptions = {}
) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(
    `${API_URL}/products/${productId}/variants/${variantId}/stock`,
    {
      ...requestOptions,
      method: 'POST',
      token,
      body: { quantity, reason, notes },
      cache: 'no-store',
      fallbackMessage: 'Failed to adjust stock.',
    }
  );

  return json.data;
}

export async function fetchStockHistory(productId, query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const json = await requestJson(
    `${API_URL}/products/${productId}/stock-history${search ? `?${search}` : ''}`,
    {
      ...requestOptions,
      token,
      cache: 'no-store',
      fallbackMessage: 'Failed to fetch stock history.',
    }
  );

  return json.data;
}

export async function triggerLowStockNotification(threshold = 10, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(
    `${API_URL}/admin/inventory/notifications/trigger-low-stock`,
    {
      ...requestOptions,
      method: 'POST',
      token,
      body: { threshold },
      cache: 'no-store',
      fallbackMessage: 'Failed to trigger notification.',
    }
  );

  return json.data;
}

export async function getNotificationStatus(token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/inventory/notifications/status`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch notification status.',
  });

  return json.data;
}
