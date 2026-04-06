import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

export async function subscribeToNewsletter(email) {
  const response = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email }),
  });

  const data = await parseResponse(response, 'Failed to subscribe to the newsletter');

  return data;
}
