// src/services/authApi.js
import { API_URL, jsonHeaders, parseResponse } from './apiConfig';

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(userData),
  });

  return parseResponse(response, 'Registration failed');
}

export async function loginUser(userData) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(userData),
  });

  return parseResponse(response, 'Login failed');
}

export async function loginAdminUser(userData) {
  const response = await fetch(`${API_URL}/auth/admin-login`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(userData),
  });

  return parseResponse(response, 'Admin login failed');
}

export async function requestPasswordReset(payload) {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response, 'Unable to start password reset.');
}

export async function submitPasswordReset(payload) {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse(response, 'Unable to reset password.');
}

export async function fetchMe(token) {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: jsonHeaders(token),
  });

  return parseResponse(response, 'Fetch user failed');
}

export async function updateUser(userData, token) {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: 'PUT',
    headers: jsonHeaders(token),
    body: JSON.stringify(userData),
  });

  return parseResponse(response, 'Update failed');
}
