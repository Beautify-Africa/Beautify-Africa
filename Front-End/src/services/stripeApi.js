// src/services/stripeApi.js
import { API_URL, requestJson } from './apiConfig';

/**
 * Creates a Stripe PaymentIntent by calling the backend API.
 * @param {Array} orderItems - The cart items to purchase
 * @param {Object} shippingAddress - The shipping details
 * @param {string|null} token - Optional JWT token
 * @returns {Promise<{ clientSecret: string, orderId: string }>}
 */
export async function createPaymentIntent(orderItems, shippingAddress, token = null) {
  return requestJson(`${API_URL}/stripe/create-payment-intent`, {
    method: 'POST',
    token,
    body: { orderItems, shippingAddress },
    cache: 'no-store',
    fallbackMessage: 'Failed to initialize payment.',
  });
}
