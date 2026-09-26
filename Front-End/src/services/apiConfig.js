const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const normalizedApiUrl = rawApiUrl.replace(/\/+$/, '');

export const API_URL = normalizedApiUrl.endsWith('/api')
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

export const COOKIE_SESSION_ACTIVE = 'cookie-session-active';

let csrfTokenPromise;

async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(`${API_URL}/csrf-token`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((response) => {
        if (!response.ok) throw new Error('Unable to establish a secure session');
        return response.json();
      })
      .then((data) => data.csrfToken)
      .catch((error) => {
        csrfTokenPromise = undefined;
        throw error;
      });
  }
  return csrfTokenPromise;
}

export function jsonHeaders(token) {
  return { 'Content-Type': 'application/json' };
}

function createTimeoutSignal(signal, timeoutMs) {
  if (!timeoutMs) {
    return { signal, cleanup: () => {} };
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort(new DOMException('Request timed out', 'TimeoutError'));
  }, timeoutMs);

  const forwardAbort = () => controller.abort(signal.reason);

  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      controller.abort(signal.reason);
    } else {
      signal.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener('abort', forwardAbort);
      }
    },
  };
}

export async function requestJson(url, options = {}) {
  const {
    token,
    method = 'GET',
    body,
    headers = {},
    signal,
    timeoutMs = 15000,
    cache,
    credentials = 'include',
    fallbackMessage = 'Request failed',
  } = options;

  const requestHeaders = {
    ...headers,
    ...(body !== undefined ? jsonHeaders(token) : {}),
  };

  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  if (isMutation) {
    requestHeaders['X-CSRF-Token'] = await getCsrfToken();
  }

  const requestInit = {
    method,
    headers: requestHeaders,
    signal,
    credentials,
  };

  if (cache) {
    requestInit.cache = cache;
  }

  if (body !== undefined) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const { signal: timeoutSignal, cleanup } = createTimeoutSignal(signal, timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: timeoutSignal,
    });

    return parseResponse(response, fallbackMessage);
  } finally {
    cleanup();
  }
}

export async function parseResponse(response, fallbackMessage) {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(json.message || fallbackMessage);
    error.statusCode = response.status;
    error.response = json;
    throw error;
  }

  return json;
}
