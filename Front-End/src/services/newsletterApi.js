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

export async function requestNewsletterUnsubscribe(email) {
  const response = await fetch(`${API_URL}/newsletter/unsubscribe/request`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email }),
  });

  return parseResponse(response, 'Unable to request an unsubscribe link.');
}

export async function confirmNewsletterUnsubscribe(token) {
  const response = await fetch(`${API_URL}/newsletter/unsubscribe/confirm`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ token }),
  });

  return parseResponse(response, 'Unable to unsubscribe right now.');
}
