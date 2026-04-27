// src/services/productsApi.js
import { API_URL, requestJson } from './apiConfig';

const PRODUCT_REQUEST_TIMEOUT_MS = 30000;

function shouldRetryProductRequest(error, signal) {
  if (signal?.aborted) {
    return false;
  }

  if ([429, 502, 503, 504].includes(error?.statusCode)) {
    return true;
  }

  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('timed out') ||
    message.includes('failed to fetch') ||
    message.includes('networkerror') ||
    message.includes('network error')
  );
}

async function requestWithOneRetry(url, requestOptions) {
  try {
    return await requestJson(url, requestOptions);
  } catch (error) {
    if (!shouldRetryProductRequest(error, requestOptions?.signal)) {
      throw error;
    }

    return requestJson(url, requestOptions);
  }
}

/**
 * Fetch paginated products from the back-end API.
 */
export async function fetchProducts(query = {}, options = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(','));
      }
      return;
    }

    params.set(key, String(value));
  });

  const search = params.toString();
  return requestWithOneRetry(`${API_URL}/products${search ? `?${search}` : ''}`, {
    cache: 'no-store',
    timeoutMs: PRODUCT_REQUEST_TIMEOUT_MS,
    ...options,
    fallbackMessage: 'Failed to fetch products',
  });
}

export async function fetchProductCatalog(options = {}) {
  const json = await requestWithOneRetry(`${API_URL}/products/catalog`, {
    cache: 'no-store',
    timeoutMs: PRODUCT_REQUEST_TIMEOUT_MS,
    ...options,
    fallbackMessage: 'Failed to fetch product catalog',
  });
  return json.data;
}

export async function fetchProductByIdOrSlug(idOrSlug, options = {}) {
  const data = await requestJson(`${API_URL}/products/${idOrSlug}`, {
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Failed to fetch product',
  });
  return data.data;
}

export async function createReviewApi(token, productId, reviewPayload) {
  if (!token) throw new Error('Authentication required to submit review.');

  const json = await requestJson(`${API_URL}/products/${productId}/reviews`, {
    method: 'POST',
    token,
    body: reviewPayload,
    cache: 'no-store',
    fallbackMessage: 'Failed to submit review',
  });
  return json;
}
