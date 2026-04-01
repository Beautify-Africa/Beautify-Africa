// src/services/productsApi.js

// Build the API URL the same way authApi.js does
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

/**
 * Fetch all products from the back-end API.
 * Returns the array of product objects from MongoDB.
 */
export async function fetchProducts() {
  const res = await fetch(`${API_URL}/products`);

  if (!res.ok) {
    throw new Error('Failed to fetch products');
  }

  const json = await res.json();
  return json.data; // the API returns { status, count, data: [...products] }
}
