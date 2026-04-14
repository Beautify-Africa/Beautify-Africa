// config/db.js
const mongoose = require('mongoose');

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getMongoOptions() {
  return {
    serverSelectionTimeoutMS: parsePositiveInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10000),
    connectTimeoutMS: parsePositiveInt(process.env.MONGO_CONNECT_TIMEOUT_MS, 10000),
    socketTimeoutMS: parsePositiveInt(process.env.MONGO_SOCKET_TIMEOUT_MS, 45000),
    waitQueueTimeoutMS: parsePositiveInt(process.env.MONGO_WAIT_QUEUE_TIMEOUT_MS, 10000),
    maxPoolSize: parsePositiveInt(process.env.MONGO_MAX_POOL_SIZE, 20),
    minPoolSize: parsePositiveInt(process.env.MONGO_MIN_POOL_SIZE, 2),
    maxIdleTimeMS: parsePositiveInt(process.env.MONGO_MAX_IDLE_TIME_MS, 30000),
    retryWrites: true,
    appName: process.env.MONGO_APP_NAME || 'beautify-africa-api',
  };
}

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI in environment variables.');
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, getMongoOptions());
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    let hint = '';

    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      hint = ' Check Atlas username/password and database user permissions.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      hint = ' Verify cluster hostname and your network DNS/connectivity.';
    } else if (error.message.includes('timed out')) {
      hint = ' Check Atlas network access (IP allow list).';
    }

    throw new Error(`MongoDB connection failed: ${error.message}${hint}`);
  }
};

module.exports = connectDB;