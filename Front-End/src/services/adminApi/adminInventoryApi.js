import { API_URL, requestJson } from '../apiConfig';

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

export async function fetchAdminAnalytics(token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/analytics/summary`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch analytics summary.',
  });

  return json.data;
}

export async function fetchReorderPlan(query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const json = await requestJson(
    `${API_URL}/admin/inventory/reorder-plan${search ? `?${search}` : ''}`,
    {
      ...requestOptions,
      token,
      cache: 'no-store',
      fallbackMessage: 'Failed to fetch reorder plan.',
    }
  );

  return json.data;
}

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
      fallbackMessage: 'Failed to fetch low-stock items.',
    }
  );

  const payload = json.data;
  const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];

  return {
    data: items,
    items,
    totalCount: payload?.totalCount !== undefined ? payload.totalCount : items.length,
    totalPages: payload?.totalPages !== undefined ? payload.totalPages : 1,
    page: payload?.page || Number(query.page) || 1,
    limit: payload?.limit || Number(query.limit) || 10,
    threshold: payload?.threshold || Number(query.threshold) || 10,
  };
}

export async function adjustVariantStock(
  productId,
  variantId,
  quantityChange,
  reason,
  token,
  requestOptions = {}
) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(
    `${API_URL}/admin/products/${productId}/variants/${variantId}/stock`,
    {
      ...requestOptions,
      method: 'POST',
      token,
      body: { quantityChange, reason },
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
    `${API_URL}/admin/products/${productId}/stock-history${search ? `?${search}` : ''}`,
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

  const json = await requestJson(`${API_URL}/admin/inventory/notifications/trigger`, {
    ...requestOptions,
    method: 'POST',
    token,
    body: { threshold },
    fallbackMessage: 'Failed to trigger low stock notification.',
  });

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
