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

/**
 * Fetch single order details by ID (authenticated user or guest with email verification).
 * @param {string} orderId - The order UUID.
 * @param {string|null} token - Optional JWT token.
 * @param {string|null} guestEmail - Optional email for guest verification.
 */
export async function fetchOrderById(
  orderId,
  token = null,
  guestEmail = null,
  requestOptions = {}
) {
  const query = guestEmail ? `?email=${encodeURIComponent(guestEmail)}` : '';
  const json = await requestJson(`${API_URL}/orders/${orderId}${query}`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch order details.',
  });
  return json.data;
}

/**
 * Cancel an order and restore inventory.
 * @param {string} orderId - The order UUID.
 * @param {string} token - JWT token.
 * @param {string} reason - Cancellation reason.
 */
export async function cancelOrderApi(orderId, token, reason = 'Cancelled by customer') {
  if (!token) throw new Error('Authentication token required to cancel order.');

  const json = await requestJson(`${API_URL}/orders/${orderId}/cancel`, {
    method: 'PUT',
    token,
    body: { reason },
    cache: 'no-store',
    fallbackMessage: 'Failed to cancel order.',
  });
  return json.data;
}
