import { API_URL, requestJson } from '../apiConfig';

export async function fetchAdminCustomers(query = {}, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });

  const search = params.toString();
  const json = await requestJson(`${API_URL}/admin/customers${search ? `?${search}` : ''}`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch customer directory.',
  });

  return json.data;
}

export async function fetchAdminCustomerDetail(customerId, token, requestOptions = {}) {
  if (!token) throw new Error('Authentication token required.');

  const json = await requestJson(`${API_URL}/admin/customers/${customerId}`, {
    ...requestOptions,
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to fetch customer detail profile.',
  });

  return json.data;
}
