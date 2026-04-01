// server.js
const productRoutes = require('./routes/productRoutes');
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// Middleware to parse JSON (needed for e-commerce POST requests)
app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:4173'],
    credentials: true,
  })
);
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

app.use('/api', productRoutes);
app.use('/api/auth', authRoutes);

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