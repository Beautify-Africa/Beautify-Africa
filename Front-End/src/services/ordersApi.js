// src/services/ordersApi.js
import { API_URL, requestJson } from './apiConfig';

/**
 * Submit an order to the backend API.
 * @param {Object} orderData - The structured order details.
 * @param {string|null} token - Optional JWT token for authenticated users.
 */
export async function createOrder(orderData, token = null) {
  const json = await requestJson(`${API_URL}/orders`, {
    method: 'POST',
    token,
    body: orderData,
    cache: 'no-store',
    fallbackMessage: 'Failed to place order.',
  });
  return json.data;
}

/**
 * Fetch all orders for the authenticated user.
 * @param {string} token - JWT token for authenticated users.
 */
export async function fetchMyOrders(token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/orders/myorders`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch orders.',
  });
  return json.data;
}
