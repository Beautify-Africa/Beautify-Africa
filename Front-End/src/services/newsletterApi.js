import { API_URL, requestJson } from './apiConfig';

export async function subscribeToNewsletter(email) {
  return requestJson(`${API_URL}/newsletter/subscribe`, {
    method: 'POST',
    body: { email },
    cache: 'no-store',
    fallbackMessage: 'Failed to subscribe to the newsletter',
  });
}

export async function requestNewsletterUnsubscribe(email) {
  return requestJson(`${API_URL}/newsletter/unsubscribe/request`, {
    method: 'POST',
    body: { email },
    cache: 'no-store',
    fallbackMessage: 'Unable to request an unsubscribe link.',
  });
}

export async function confirmNewsletterUnsubscribe(token) {
  return requestJson(`${API_URL}/newsletter/unsubscribe/confirm`, {
    method: 'POST',
    body: { token },
    cache: 'no-store',
    fallbackMessage: 'Unable to unsubscribe right now.',
  });
}
