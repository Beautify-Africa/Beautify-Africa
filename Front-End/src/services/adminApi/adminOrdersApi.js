import { API_URL, requestJson } from '../apiConfig';

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
    fallbackMessage: 'Failed to add the order note.',
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
