// src/services/authApi.js
import { API_URL, requestJson } from './apiConfig';

export async function registerUser(userData) {
  return requestJson(`${API_URL}/auth/register`, {
    method: 'POST',
    body: userData,
    cache: 'no-store',
    fallbackMessage: 'Registration failed',
  });
}

export async function loginUser(userData) {
  return requestJson(`${API_URL}/auth/login`, {
    method: 'POST',
    body: userData,
    cache: 'no-store',
    fallbackMessage: 'Login failed',
  });
}

export async function loginAdminUser(userData) {
  return requestJson(`${API_URL}/auth/admin-login`, {
    method: 'POST',
    body: userData,
    cache: 'no-store',
    fallbackMessage: 'Admin login failed',
  });
}

export async function requestPasswordReset(payload) {
  return requestJson(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    body: payload,
    cache: 'no-store',
    fallbackMessage: 'Unable to start password reset.',
  });
}

export async function submitPasswordReset(payload) {
  return requestJson(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    body: payload,
    cache: 'no-store',
    fallbackMessage: 'Unable to reset password.',
  });
}

export async function logoutUser(token) {
  return requestJson(`${API_URL}/auth/logout`, {
    method: 'POST',
    token,
    cache: 'no-store',
    fallbackMessage: 'Logout failed',
  }).catch(() => ({ status: 'success' }));
}

export async function fetchMe(token, options = {}) {
  return requestJson(`${API_URL}/auth/me`, {
    token,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Fetch user failed',
  });
}

export async function updateUser(userData, token, options = {}) {
  return requestJson(`${API_URL}/auth/profile`, {
    method: 'PUT',
    token,
    body: userData,
    cache: 'no-store',
    ...options,
    fallbackMessage: 'Update failed',
  });
}

export async function setupTwoFactor(token) {
  return requestJson(`${API_URL}/auth/2fa/setup`, {
    method: 'POST',
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to initiate 2FA setup',
  });
}

export async function enableTwoFactor(code, token) {
  return requestJson(`${API_URL}/auth/2fa/enable`, {
    method: 'POST',
    token,
    body: { code },
    cache: 'no-store',
    fallbackMessage: 'Failed to enable 2FA',
  });
}

export async function disableTwoFactor(payload, token) {
  return requestJson(`${API_URL}/auth/2fa/disable`, {
    method: 'POST',
    token,
    body: payload,
    cache: 'no-store',
    fallbackMessage: 'Failed to disable 2FA',
  });
}

export async function revokeAllSessions(token) {
  return requestJson(`${API_URL}/auth/revoke-all-sessions`, {
    method: 'POST',
    token,
    cache: 'no-store',
    fallbackMessage: 'Failed to revoke sessions',
  });
}

