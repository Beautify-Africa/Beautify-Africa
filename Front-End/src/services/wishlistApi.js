import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

export async function fetchWishlist(token) {
  if (!token) return [];

  const response = await fetch(`${API_URL}/wishlist`, {
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to fetch wishlist');
  return json.data || [];
}

export async function toggleWishlistApi(token, productId) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/wishlist/toggle`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ productId }),
  });

  return parseResponse(response, 'Failed to update wishlist');
}

export async function syncWishlistApi(token, localItems) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/wishlist/sync`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ localItems: Array.isArray(localItems) ? localItems : [] }),
  });

  const json = await parseResponse(response, 'Failed to sync wishlist');
  return json.data || [];
}

export async function clearWishlistApi(token) {
  if (!token) throw new Error('Auth token required');

  const response = await fetch(`${API_URL}/wishlist`, {
    method: 'DELETE',
    headers: jsonHeaders(token),
  });

  const json = await parseResponse(response, 'Failed to clear wishlist');
  return json.data || [];
}
