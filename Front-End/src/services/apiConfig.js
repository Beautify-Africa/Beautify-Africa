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
    credentials = 'omit',
    fallbackMessage = 'Request failed',
  } = options;

  const requestHeaders = {
    ...headers,
    ...(body !== undefined ? jsonHeaders(token) : token ? { Authorization: `Bearer ${token}` } : {}),
  };

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
    throw new Error(json.message || fallbackMessage);
  }

  return json;
}
