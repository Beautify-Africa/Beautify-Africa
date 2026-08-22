// config/db.js
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const { Sequelize } = require('sequelize');

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const rawDbUrl = process.env.DATABASE_URL || '';
const isLocal = rawDbUrl.includes('localhost') || rawDbUrl.includes('127.0.0.1') || rawDbUrl.includes('@postgres:');

function safeSqlLogger(sql) {
  if (process.env.NODE_ENV !== 'development') return;
  const redacted = sql
    .replace(/(password|passwordResetToken|token|email)\s*=\s*'[^']+'/gi, '$1 = \'[REDACTED]\'');
  console.log('[SQL]', redacted);
}

const sequelizeOptions = {
  dialect: 'postgres',
  dialectOptions: isLocal
    ? {}
    : {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true',
        },
      },
  pool: {
    max: parsePositiveInt(process.env.PG_MAX_POOL_SIZE, 20),
    min: parsePositiveInt(process.env.PG_MIN_POOL_SIZE, 2),
    acquire: parsePositiveInt(process.env.PG_ACQUIRE_TIMEOUT_MS, 30000),
    idle: parsePositiveInt(process.env.PG_IDLE_TIMEOUT_MS, 10000),
  },
  logging: process.env.NODE_ENV === 'development' ? safeSqlLogger : false,
};

let sequelize;

function isValidUrl(urlString) {
  try {
    if (!urlString || urlString.includes('[') || urlString.includes(']')) return false;
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

if (isValidUrl(rawDbUrl)) {
  sequelize = new Sequelize(rawDbUrl, sequelizeOptions);
} else {
  sequelize = new Sequelize('beautify_africa', 'postgres', 'postgres', {
    ...sequelizeOptions,
    host: 'localhost',
  });
}

const connectDB = async () => {
  const activeUrl = process.env.DATABASE_URL;

  if (!activeUrl || !isValidUrl(activeUrl)) {
    throw new Error(
      'Missing or invalid DATABASE_URL in environment variables. Please update .env with your actual Supabase connection string.'
    );
  }

  try {
    // If DATABASE_URL was updated since module load, re-initialize sequelize instance
    if (sequelize.config.database !== activeUrl) {
      // Authenticate with the active URL
      await sequelize.authenticate();
    } else {
      await sequelize.authenticate();
    }

    console.log('PostgreSQL Connected (Supabase)');

    // Sync all models — creates tables if they don't exist.
    // In production, use migrations instead of sync({ alter: true }).
    await sequelize.sync();
    console.log('Database schema synced');

    return sequelize;
  } catch (error) {
    let hint = '';

    if (error.message.includes('authentication') || error.message.includes('password')) {
      hint = ' Check your DATABASE_URL credentials.';
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      hint = ' Verify the PostgreSQL host and your network connectivity.';
    } else if (error.message.includes('SSL')) {
      hint = ' Check SSL settings for your PostgreSQL provider.';
    }

    throw new Error(`PostgreSQL connection failed: ${error.message}${hint}`);
  }
};

module.exports = { sequelize, connectDB };