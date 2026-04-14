// src/services/cartApi.js
import { API_URL, requestJson } from './apiConfig';

export async function fetchCart(token, options = {}) {
  if (!token) return [];

  const json = await requestJson(`${API_URL}/cart`, {
    token,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to fetch user cart',
  });
  return json.data;
}

export async function syncCartApi(token, localItems, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/cart/sync`, {
    method: 'POST',
    token,
    body: { localItems },
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to sync cart',
  });
  return json.data;
}

export async function addToCartApi(token, productPayload, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/cart`, {
    method: 'POST',
    token,
    body: productPayload,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to add to cart',
  });
  return json.data;
}

export async function updateCartQtyApi(token, productId, quantity, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/cart/${productId}`, {
    method: 'PUT',
    token,
    body: { quantity },
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to update cart quantity',
  });
  return json.data;
}

export async function removeCartItemApi(token, productId, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/cart/${productId}`, {
    method: 'DELETE',
    token,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to remove cart item',
  });
  return json.data;
}

export async function clearCartApi(token, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/cart`, {
    method: 'DELETE',
    token,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to clear cart',
  });
  return json.data;
}
