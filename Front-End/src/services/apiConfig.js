const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '');

export const API_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

export function jsonHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function parseResponse(response, fallbackMessage) {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.message || fallbackMessage);
  }

  return json;
}
