// src/services/ordersApi.js

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

/**
 * Submit an order to the backend API.
 * @param {Object} orderData - The structured order details.
 * @param {string|null} token - Optional JWT token for authenticated users.
 */
export async function createOrder(orderData, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Failed to place order.');
  }

  return json.data;
}

/**
 * Fetch all orders for the authenticated user.
 * @param {string} token - JWT token for authenticated users.
 */
export async function fetchMyOrders(token) {
  if (!token) throw new Error('Authentication token required.');

  const res = await fetch(`${API_URL}/orders/myorders`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch orders.');
  }

  return json.data;
}
