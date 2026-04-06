// server.js
const productRoutes = require('./routes/productRoutes');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Security Middlewares
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// 1. HTTP Security Headers
// app.use(helmet());

// 2. Prevent Cross-Site Scripting and Set Credentials
app.use(
  cors({
    origin: process.env.CLIENT_URL || [
      'http://localhost:5173',
      'http://localhost:4173',
      'http://localhost:4174',
      'http://localhost:4175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:4173',
      'http://127.0.0.1:4174'
    ],
    credentials: true,
  })
);

// 3. Body Parser
app.use(express.json());

app.get('/', (req, res) => {
  res.send('E-commerce API is running...');
});

app.get('/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const isDbConnected = readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: isDbConnected ? 'connected' : 'disconnected',
  });
});

// Apply limiting strictly to API routes
app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/newsletter', newsletterRoutes);

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

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

startServer();