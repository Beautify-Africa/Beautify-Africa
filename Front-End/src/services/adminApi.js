import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

export async function fetchAdminDashboard(token) {
  if (!token) throw new Error('Authentication token required.');

  const response = await fetch(`${API_URL}/admin/dashboard`, {
    method: 'GET',
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to fetch admin dashboard.');

  return json.data;
}

export async function updateAdminOrderAction(orderId, action, token) {
  if (!token) throw new Error('Authentication token required.');

  const response = await fetch(`${API_URL}/admin/orders/${orderId}`, {
    method: 'PATCH',
    headers: jsonHeaders(token),
    body: JSON.stringify({ action }),
  });

  const json = await parseResponse(response, 'Failed to update the order.');

  return json.data;
}
