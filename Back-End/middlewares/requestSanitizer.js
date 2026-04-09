const PROHIBITED_KEY_PATTERN = /^\$|\./;

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
    if (PROHIBITED_KEY_PATTERN.test(key)) {
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

  next();
}

module.exports = {
  sanitizeRequest,
  sanitizeValue,
};
