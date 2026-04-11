const express = require('express');

function getRequestBodyLimit() {
  const configuredLimit = String(process.env.REQUEST_BODY_LIMIT || '1mb').trim();
  return configuredLimit || '1mb';
}

function createJsonBodyParser() {
  return express.json({ limit: getRequestBodyLimit() });
}

function createUrlEncodedBodyParser() {
  return express.urlencoded({ extended: true, limit: getRequestBodyLimit() });
}

function handleBodySizeLimitError(error, req, res, next) {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      status: 'error',
      message: `Request body is too large. Maximum size is ${getRequestBodyLimit()}.`,
    });
  }

  return next(error);
}

module.exports = {
  getRequestBodyLimit,
  createJsonBodyParser,
  createUrlEncodedBodyParser,
  handleBodySizeLimitError,
};
