// src/services/cartApi.js
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function fetchCart(token) {
  if (!token) return [];
  const res = await fetch(`${API_URL}/cart`, {
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to fetch user cart');
  const json = await res.json();
  return json.data;
}

export async function syncCartApi(token, localItems) {
  if (!token) throw new Error('Auth token required');
  const res = await fetch(`${API_URL}/cart/sync`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ localItems }),
  });
  if (!res.ok) throw new Error('Failed to sync cart');
  const json = await res.json();
  return json.data;
}

export async function addToCartApi(token, productPayload) {
  if (!token) throw new Error('Auth token required');
  const res = await fetch(`${API_URL}/cart`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(productPayload),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  const json = await res.json();
  return json.data;
}

export async function updateCartQtyApi(token, productId, quantity) {
  if (!token) throw new Error('Auth token required');
  const res = await fetch(`${API_URL}/cart/${productId}`, {
    method: 'PUT',
    headers: getHeaders(token),
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart quantity');
  const json = await res.json();
  return json.data;
}

export async function removeCartItemApi(token, productId) {
  if (!token) throw new Error('Auth token required');
  const res = await fetch(`${API_URL}/cart/${productId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to remove cart item');
  const json = await res.json();
  return json.data;
}

export async function clearCartApi(token) {
  if (!token) throw new Error('Auth token required');
  const res = await fetch(`${API_URL}/cart`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });
  if (!res.ok) throw new Error('Failed to clear cart');
  const json = await res.json();
  return json.data;
}
