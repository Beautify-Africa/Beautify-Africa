// src/utils/sanitize.js
/**
 * Frontend Sanitization Utilities for XSS Defense
 */

const DISALLOWED_SCHEMES = /^(?:javascript|vbscript|data):/i;
const ALLOWED_SCHEMES = /^(?:https?|mailto|tel):/i;

/**
 * Validates and sanitizes a hyperlink URL to prevent XSS via pseudo-protocols like javascript:.
 * Only allows safe absolute protocols (http, https, mailto, tel), relative paths, anchors (#), or parameters.
 *
 * @param {string} url - The URL to inspect
 * @param {string} [fallback='#'] - Fallback URL if target is unsafe
 * @returns {string} - Sanitized safe URL
 */
export function sanitizeUrl(url, fallback = '#') {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  const trimmed = url.trim();

  // Strip control characters and whitespace before protocol inspection
  const normalized = Array.from(trimmed)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (code >= 32 && code !== 127) || code > 159;
    })
    .join('')
    .replace(/\s+/g, '');

  if (DISALLOWED_SCHEMES.test(normalized)) {
    return fallback;
  }

  // Permitted: relative paths, anchor fragments, or approved protocols
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }

  if (ALLOWED_SCHEMES.test(trimmed)) {
    return trimmed;
  }

  // If scheme contains colon but is not in allowed list, reject
  if (trimmed.includes(':')) {
    return fallback;
  }

  // Relative path without leading slash
  return trimmed;
}

/**
 * Escapes common HTML special characters to prevent HTML injection.
 *
 * @param {string} str - Raw string
 * @returns {string} - HTML-escaped string
 */
export function escapeHtml(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
}

/**
 * Strips dangerous HTML script and event tags from text.
 *
 * @param {string} str - Raw text
 * @returns {string} - Sanitized plain text
 */
export function sanitizeText(str) {
  if (!str || typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    .trim();
}
