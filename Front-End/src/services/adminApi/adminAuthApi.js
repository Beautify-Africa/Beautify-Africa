import { API_URL, requestJson } from '../apiConfig';

export async function adminLogin(email, password, requestOptions = {}) {
  const json = await requestJson(`${API_URL}/auth/login`, {
    ...requestOptions,
    method: 'POST',
    body: { email, password },
    fallbackMessage: 'Admin sign in failed.',
  });

  return json;
}

export async function checkAdminAuth(token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/auth/me`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Authentication check failed.',
  });

  return json.data;
}
