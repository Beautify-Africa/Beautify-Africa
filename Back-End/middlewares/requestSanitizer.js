const PROHIBITED_KEY_PATTERN = /^\$|\./;
const PROHIBITED_PROPERTIES = new Set(['__proto__', 'constructor', 'prototype']);

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.entries(value).reduce((sanitized, [key, nestedValue]) => {
    // Block MongoDB operators, dot-notation injection, and prototype pollution keys
    if (PROHIBITED_KEY_PATTERN.test(key) || PROHIBITED_PROPERTIES.has(key)) {
      return sanitized;
    }

    sanitized[key] = sanitizeValue(nestedValue);
    return sanitized;
  }, {});
}

function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    req.body = sanitizeValue(req.body);
  }

  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }

  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }

  next();
}

module.exports = {
  sanitizeRequest,
  sanitizeValue,
};
