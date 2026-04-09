// src/services/stripeApi.js
import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

/**
 * Creates a Stripe PaymentIntent by calling the backend API.
 * @param {Array} orderItems - The cart items to purchase
 * @param {Object} shippingAddress - The shipping details
 * @param {string|null} token - Optional JWT token
 * @returns {Promise<{ clientSecret: string, orderId: string }>}
 */
export async function createPaymentIntent(orderItems, shippingAddress, token = null) {
  const response = await fetch(`${API_URL}/stripe/create-payment-intent`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ orderItems, shippingAddress }),
  });

  const json = await parseResponse(response, 'Failed to initialize payment.');
  return json;
}
