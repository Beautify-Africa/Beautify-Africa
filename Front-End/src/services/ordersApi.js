// src/services/ordersApi.js
import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

/**
 * Submit an order to the backend API.
 * @param {Object} orderData - The structured order details.
 * @param {string|null} token - Optional JWT token for authenticated users.
 */
export async function createOrder(orderData, token = null) {
  const response = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(orderData),
  });

  const json = await parseResponse(response, 'Failed to place order.');

  return json.data;
}

/**
 * Fetch all orders for the authenticated user.
 * @param {string} token - JWT token for authenticated users.
 */
export async function fetchMyOrders(token) {
  if (!token) throw new Error('Authentication token required.');

  const response = await fetch(`${API_URL}/orders/myorders`, {
    method: 'GET',
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to fetch orders.');

  return json.data;
}
