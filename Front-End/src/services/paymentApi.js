// src/services/paymentApi.js
import { API_URL, requestJson } from './apiConfig';

/**
 * Initializes a payment intent/transaction across any supported gateway (Stripe, Paystack, M-Pesa).
 */
export async function initializePayment({
  orderId,
  orderItems,
  shippingAddress,
  gateway = 'stripe',
  currency = 'USD',
  phone,
  returnUrl,
  token = null,
}) {
  return requestJson(`${API_URL}/payments/initialize`, {
    method: 'POST',
    token,
    body: {
      orderId,
      orderItems,
      shippingAddress,
      gateway,
      currency,
      phone,
      returnUrl,
    },
    cache: 'no-store',
    fallbackMessage: 'Payment initialization failed. Please try again.',
  });
}

/**
 * Verifies transaction status from provider.
 */
export async function verifyPayment({ gateway, reference, orderId, token = null }) {
  const query = orderId ? `?orderId=${encodeURIComponent(orderId)}` : '';
  return requestJson(
    `${API_URL}/payments/verify/${encodeURIComponent(gateway)}/${encodeURIComponent(reference)}${query}`,
    {
      method: 'GET',
      token,
      cache: 'no-store',
      fallbackMessage: 'Payment verification failed.',
    }
  );
}

/**
 * Fetches available payment gateway metadata.
 */
export async function getPaymentGateways() {
  return requestJson(`${API_URL}/payments/gateways`, {
    method: 'GET',
    cache: 'default',
    fallbackMessage: 'Failed to load payment options.',
  });
}
