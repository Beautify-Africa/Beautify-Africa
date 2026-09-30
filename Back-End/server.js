// server.js
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

const { connectDB, sequelize } = require('./config/db');
require('./models'); // Ensure all cross-model associations are registered
const logger = require('./utils/logger');
const requestIdMiddleware = require('./middlewares/requestId');
const { apiLimiter, authLimiter, cartLimiter } = require('./middlewares/rateLimiters');
const { createCorsOptions } = require('./config/corsConfig');
const { createHelmetOptions, permissionsPolicyMiddleware } = require('./config/helmetConfig');
const { csrfProtection, getCsrfTokenHandler } = require('./middlewares/csrfProtection');
const queryCaps = require('./middlewares/queryCaps');

if (process.env.NODE_ENV !== 'test') {
  require('./workers/emailWorker');
  require('./workers/inventoryNotificationWorker');
}
const { buildOpenApiSpec } = require('./docs/openapi');
const {
  createJsonBodyParser,
  createUrlEncodedBodyParser,
  handleBodySizeLimitError,
} = require('./middlewares/bodyParser');
const { sanitizeRequest } = require('./middlewares/requestSanitizer');
const { setPublicCache, setPrivateNoStore } = require('./middlewares/cacheHeaders');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const healthRoutes = require('./routes/healthRoutes');
const ensureHttps = require('./middlewares/ensureHttps');
const { validateEnvironmentSecrets } = require('./config/envValidator');

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.fatal(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

validateEnvironmentSecrets({ throwOnError: process.env.NODE_ENV === 'production' });

const app = express();
app.disable('x-powered-by');

app.use(requestIdMiddleware);
app.use(helmet(createHelmetOptions()));
app.use(permissionsPolicyMiddleware);
app.use(
  compression({
    threshold: 1024,
    level: 6,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);
app.set('query parser', 'simple');
app.set('trust proxy', 1);

app.use(ensureHttps);
app.use(cors(createCorsOptions()));

if (process.env.NODE_ENV !== 'production') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// Mount payment webhooks before global body parsers (require raw buffer for HMAC verification)
app.use('/api/stripe', stripeRoutes);
app.use('/api/payments', paymentRoutes);

app.use(createJsonBodyParser());
app.use(createUrlEncodedBodyParser());
app.use(sanitizeRequest);
app.use(queryCaps);

// Issue CSRF tokens for web clients
app.get('/api/csrf-token', getCsrfTokenHandler);

// Enforce CSRF protection on state-changing requests
app.use(csrfProtection);

app.get('/', setPrivateNoStore, (req, res) => {
  res.send('E-commerce API is running...');
});

// Health checks
app.use('/health', healthRoutes);

app.get('/api/openapi.json', setPublicCache(300, 900), (req, res) => {
  res.status(200).json(buildOpenApiSpec(req));
});

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(null, {
    explorer: true,
    swaggerOptions: {
      url: '/api/openapi.json',
    },
  })
);

// RFC 9116 Security Vulnerability Disclosure Policy
const SECURITY_TXT_BODY = [
  '# Beautify Africa Security Vulnerability Disclosure Policy',
  '# Reference: RFC 9116',
  'Contact: mailto:security@beautifyafrica.app',
  'Expires: 2027-12-31T23:59:59.000Z',
  'Preferred-Languages: en, sw',
  'Canonical: https://beautifyafrica.app/.well-known/security.txt',
  'Policy: https://beautifyafrica.app/security-policy',
  'Acknowledgments: https://beautifyafrica.app/security/hall-of-fame',
  '',
].join('\n');

app.get(['/.well-known/security.txt', '/security.txt'], (req, res) => {
  res.type('text/plain; charset=utf-8').send(SECURITY_TXT_BODY);
});

// Observability & Health Probes (Liveness & Readiness)
app.use('/api', healthRoutes);
app.use('/', healthRoutes);

// API Routes
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/cart', cartLimiter, cartRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);
app.use('/api/currency', apiLimiter, currencyRoutes);

app.use(handleBodySizeLimitError);

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, next) => {
  const reqLogger = req.log || logger;
  reqLogger.error(err, 'Unhandled Application Error');
  const statusCode = Number(err.statusCode || err.status || 500);
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message || 'An unexpected error occurred.';
  res.status(statusCode).json({
    status: 'error',
    code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
});

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  try {
    await sequelize.close();
  } catch (err) {
    logger.warn(`Error closing database connection: ${err.message}`);
  }
  process.exit(0);
};

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });

    // Slowloris & HTTP connection timeouts (DoS mitigation)
    server.headersTimeout = 60000;
    server.requestTimeout = 30000;
    server.keepAliveTimeout = 65000;

    return server;
  } catch (error) {
    logger.fatal(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.fatal(`Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, shutdown };
