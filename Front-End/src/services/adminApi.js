import { API_URL, requestJson } from './apiConfig';

export async function fetchAdminDashboard(token) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/dashboard`, {
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch admin dashboard.',
  });

  return json.data;
}

export async function updateAdminOrderAction(orderId, action, token) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/orders/${orderId}`, {
    method: 'PATCH',
    token,
    body: { action },
    cache: 'no-store',
    fallbackMessage: 'Failed to update the order.',
  });

  return json.data;
}
