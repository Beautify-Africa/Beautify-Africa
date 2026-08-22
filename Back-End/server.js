// server.js

// --- Built-in ---
const path = require('path');

// --- Third-party ---
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');

// --- Local ---
const { connectDB, sequelize } = require('./config/db');
const { apiLimiter, authLimiter, cartLimiter } = require('./middlewares/rateLimiters');

if (process.env.NODE_ENV !== 'test') {
  require('./workers/emailWorker'); // Boot background job pipeline outside of tests
  require('./workers/inventoryNotificationWorker'); // Boot inventory notification worker
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
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// 1. HTTP Security Headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression({ threshold: 1024 }));

// Use Express' simple query parser so querystrings stay flat strings/arrays.
app.set('query parser', 'simple');

// 2. Trust Proxy (Required for Render/Cloud load balancers for rate limiting to work)
app.set('trust proxy', 1);

// 3. Rate Limiting — Redis-backed so counters survive container restarts (imported from middlewares/rateLimiters)

function normalizeOrigin(value = '') {
  return String(value).trim().replace(/\/+$/, '').toLowerCase();
}

// 4. CORS - Strict project domain matching
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const envOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',').map((u) => normalizeOrigin(u)).filter(Boolean)
        : [];
      const localOrigins = [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:4174',
        'http://localhost:4175',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
        'http://127.0.0.1:4174',
        'https://www.beautifyafrica.app',
        'https://beautifyafrica.app',
        'https://beautify-africa.vercel.app'
      ].map((u) => normalizeOrigin(u));

      // Match exact configured origins or project-specific Vercel preview domains
      const isProjectVercelOrigin = /^https:\/\/(beautify-africa|beautifyafrica)[a-z0-9-]*\.vercel\.app$/.test(normalizedOrigin);

      if (
        envOrigins.includes(normalizedOrigin) ||
        localOrigins.includes(normalizedOrigin) ||
        isProjectVercelOrigin
      ) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked unauthorized origin: ${origin}`);
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// 5. HTTP Request Logging (dev only — morgan is not needed in production)
if (process.env.NODE_ENV !== 'production') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// 6. Mount Stripe routes deeply before global body parsing
// Webhooks demand raw stream requests (unparsed JSON)
app.use('/api/stripe', stripeRoutes);

// 7. Body Parser (explicit, configurable size limits)
app.use(createJsonBodyParser());
app.use(createUrlEncodedBodyParser());

// 8. Strip Mongo operator-style keys & Prototype Pollution from mutable request payloads.
app.use(sanitizeRequest);

// --- Utility Routes ---

app.get('/', setPrivateNoStore, (req, res) => {
  res.send('E-commerce API is running...');
});

app.get('/health', setPrivateNoStore, async (req, res) => {
  let isDbConnected = false;
  try {
    await sequelize.authenticate();
    isDbConnected = true;
  } catch {
    isDbConnected = false;
  }

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
  });
});

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

// --- API Routes ---

app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/cart', cartLimiter, cartRoutes);
app.use('/api/wishlist', apiLimiter, wishlistRoutes);
app.use('/api/newsletter', apiLimiter, newsletterRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/upload', apiLimiter, uploadRoutes);

// Surface oversized payloads with a stable API error response.
app.use(handleBodySizeLimitError);

// Centralized JSON 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = Number(err.statusCode || err.status || 500);
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'An internal server error occurred.'
      : err.message || 'An unexpected error occurred.';
  res.status(statusCode).json({ status: 'error', message });
});

// --- Server Startup ---

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  try {
    await sequelize.close();
  } catch (err) {
    console.warn('Error closing database connection:', err.message);
  }
  process.exit(0);
};

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

startServer();
