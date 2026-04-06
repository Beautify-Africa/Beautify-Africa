// src/services/productsApi.js
import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

/**
 * Fetch all products from the back-end API.
 * Returns the array of product objects from MongoDB.
 */
export async function fetchProducts() {
  const response = await fetch(`${API_URL}/products`);
  const json = await parseResponse(response, 'Failed to fetch products');
  return json.data; // the API returns { status, count, data: [...products] }
}

export async function fetchProductByIdOrSlug(idOrSlug) {
  const response = await fetch(`${API_URL}/products/${idOrSlug}`);

  const data = await parseResponse(response, 'Failed to fetch product');
  return data.data;
}

export async function createReviewApi(token, productId, reviewPayload) {
  if (!token) throw new Error('Authentication required to submit review.');

  const response = await fetch(`${API_URL}/products/${productId}/reviews`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify(reviewPayload),
  });

  const json = await parseResponse(response, 'Failed to submit review');
  return json;
}
