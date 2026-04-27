// server.js

// --- Built-in ---
const path = require('path');

// --- Third-party ---
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Redis } = require('ioredis');
const { RedisStore } = require('rate-limit-redis');
const swaggerUi = require('swagger-ui-express');

// --- Local ---
const connectDB = require('./config/db');

// Dedicated Redis client for rate limiting.
// Must be separate from the BullMQ client (config/redis.js) which has
// enableOfflineQueue: false — that setting crashes rate-limit-redis on startup.
const rateLimitRedis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  connectTimeout: 2000,
  lazyConnect: true,
  retryStrategy: (times) => Math.min(times * 200, 2000),
});
rateLimitRedis.on('error', (err) => console.warn('Rate-limit Redis error:', err.message));

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

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// 1. HTTP Security Headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());
app.use(compression({ threshold: 1024 }));

// Use Express' simple query parser so querystrings stay flat strings/arrays.
app.set('query parser', 'simple');

// 2. Trust Proxy (Required for Render/Cloud load balancers for rate limiting to work)
app.set('trust proxy', 1);

// 3. Rate Limiting — Redis-backed so counters survive container restarts
function makeRedisStore(prefix) {
  return new RedisStore({
    sendCommand: (...args) => rateLimitRedis.call(...args),
    prefix,
  });
}

// General API limiter: 100 requests per IP per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:api:'),
  passOnStoreError: true,
  message: { status: 'error', message: 'Too many requests, please try again later.' },
});

// Auth limiter: strict 20 requests per IP per 15 minutes — deters brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:auth:'),
  passOnStoreError: true,
  message: { status: 'error', message: 'Too many authentication attempts, please try again later.' },
});

// Cart limiter: tight 30 requests per IP per minute — blocks bot cart abuse
const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeRedisStore('rl:cart:'),
  passOnStoreError: true,
  message: { status: 'error', message: 'Too many cart requests, please slow down.' },
});

function normalizeOrigin(value = '') {
  return String(value).trim().replace(/\/+$/, '').toLowerCase();
}

// 4. CORS
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
      ].map((u) => normalizeOrigin(u));

      // Allow exact matches from ENV, local testing, OR any dynamically generated Vercel domain
      if (
        envOrigins.includes(normalizedOrigin) ||
        localOrigins.includes(normalizedOrigin) ||
        normalizedOrigin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
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

// 8. Strip Mongo operator-style keys from mutable request payloads.
app.use(sanitizeRequest);

// --- Utility Routes ---

app.get('/', setPrivateNoStore, (req, res) => {
  res.send('E-commerce API is running...');
});

app.get('/health', setPrivateNoStore, (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isDbConnected = readyState === 1;

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

// --- Server Startup ---

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (signal) => {
  console.log(`${signal} received. Shutting down gracefully...`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await mongoose.connection.close();
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
