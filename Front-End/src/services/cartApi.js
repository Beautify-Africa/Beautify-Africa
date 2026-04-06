// src/services/cartApi.js
import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

export async function fetchCart(token) {
  if (!token) return [];

  const response = await fetch(`${API_URL}/cart`, {
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to fetch user cart');
  return json.data;
}

export async function syncCartApi(token, localItems) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/cart/sync`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ localItems }),
  });

  const json = await parseResponse(response, 'Failed to sync cart');
  return json.data;
}

export async function addToCartApi(token, productPayload) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(productPayload),
  });

  const json = await parseResponse(response, 'Failed to add to cart');
  return json.data;
}

export async function updateCartQtyApi(token, productId, quantity) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify({ quantity }),
  });

  const json = await parseResponse(response, 'Failed to update cart quantity');
  return json.data;
}

export async function removeCartItemApi(token, productId) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/cart/${productId}`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to remove cart item');
  return json.data;
}

export async function clearCartApi(token) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/cart`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to clear cart');
  return json.data;
}
