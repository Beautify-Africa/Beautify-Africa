import { API_URL, requestJson } from './apiConfig';

export async function fetchWishlist(token, options = {}) {
  if (!token) return [];

  const json = await requestJson(`${API_URL}/wishlist`, {
    token,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to fetch wishlist',
  });
  return json.data || [];
}

export async function toggleWishlistApi(token, productId, options = {}) {
  if (!token) throw new Error('Auth token required');

  return requestJson(`${API_URL}/wishlist/toggle`, {
    method: 'POST',
    token,
    body: { productId },
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to update wishlist',
  });
}

export async function syncWishlistApi(token, localItems, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/wishlist/sync`, {
    method: 'POST',
    token,
    body: { localItems: Array.isArray(localItems) ? localItems : [] },
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to sync wishlist',
  });
  return json.data || [];
}

export async function clearWishlistApi(token, options = {}) {
  if (!token) throw new Error('Auth token required');

  const json = await requestJson(`${API_URL}/wishlist`, {
    method: 'DELETE',
    token,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to clear wishlist',
  });
  return json.data || [];
}
