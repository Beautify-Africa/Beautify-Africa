// utils/logger.js
const pino = require('pino');

const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: {
    paths: [
      'password',
      '*.password',
      'token',
      '*.token',
      'authorization',
      'headers.authorization',
      'headers.cookie',
      'cookie',
      'creditCard',
      'secret',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

module.exports = logger;
