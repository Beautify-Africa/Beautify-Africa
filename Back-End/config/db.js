// config/db.js
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const { Sequelize } = require('sequelize');
const pg = require('pg');

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const rawDbUrl = process.env.DATABASE_URL || '';
const rawReadDbUrl = process.env.DATABASE_READ_URL || '';
const isLocal =
  rawDbUrl.includes('localhost') ||
  rawDbUrl.includes('127.0.0.1') ||
  rawDbUrl.includes('@postgres:');

function safeSqlLogger(sql) {
  if (process.env.NODE_ENV !== 'development') return;
  const redacted = sql.replace(
    /(password|passwordResetToken|token|email)\s*=\s*'[^']+'/gi,
    "$1 = '[REDACTED]'"
  );
  console.log('[SQL]', redacted);
}

const poolConfig = {
  max: parsePositiveInt(process.env.PG_MAX_POOL_SIZE, 25),
  min: parsePositiveInt(process.env.PG_MIN_POOL_SIZE, 5),
  acquire: parsePositiveInt(process.env.PG_ACQUIRE_TIMEOUT_MS, 30000),
  idle: parsePositiveInt(process.env.PG_IDLE_TIMEOUT_MS, 10000),
  evict: parsePositiveInt(process.env.PG_EVICT_TIMEOUT_MS, 1000),
  maxUses: parsePositiveInt(process.env.PG_MAX_USES, 5000),
};

const dialectOptions = {
  keepAlive: true,
  statement_timeout: parsePositiveInt(process.env.PG_STATEMENT_TIMEOUT_MS, 10000),
  idle_in_transaction_session_timeout: parsePositiveInt(process.env.PG_IDLE_IN_TX_TIMEOUT_MS, 10000),
  ...(isLocal
    ? {}
    : {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === 'true',
        },
      }),
};

const sequelizeOptions = {
  dialect: 'postgres',
  dialectModule: pg,
  dialectOptions,
  pool: poolConfig,
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

function parseDbUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 5432,
      username: decodeURIComponent(parsed.username || ''),
      password: decodeURIComponent(parsed.password || ''),
      database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : '',
    };
  } catch {
    return null;
  }
}

const dbHost = process.env.DB_HOST || '';
const dbReadHost = process.env.DB_READ_HOST || '';
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || 'postgres';
const dbName = process.env.DB_NAME || 'beautify_africa';
const dbPort = parsePositiveInt(process.env.DB_PORT, 5432);

function createSequelizeInstance(preferReplication = true) {
  if (preferReplication && isValidUrl(rawDbUrl) && isValidUrl(rawReadDbUrl)) {
    const writeConn = parseDbUrl(rawDbUrl);
    const readConn = parseDbUrl(rawReadDbUrl);

    if (writeConn && readConn) {
      return new Sequelize(writeConn.database, writeConn.username, writeConn.password, {
        ...sequelizeOptions,
        replication: {
          read: [
            {
              host: readConn.host,
              port: readConn.port,
              username: readConn.username,
              password: readConn.password,
            },
          ],
          write: {
            host: writeConn.host,
            port: writeConn.port,
            username: writeConn.username,
            password: writeConn.password,
          },
        },
      });
    }
  }

  if (preferReplication && dbHost && dbReadHost) {
    return new Sequelize(dbName, dbUser, dbPassword, {
      ...sequelizeOptions,
      replication: {
        read: [
          {
            host: dbReadHost,
            port: parsePositiveInt(process.env.DB_READ_PORT, dbPort),
            username: process.env.DB_READ_USER || dbUser,
            password: process.env.DB_READ_PASSWORD || dbPassword,
          },
        ],
        write: {
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: dbPassword,
        },
      },
    });
  }

  if (isValidUrl(rawDbUrl)) {
    return new Sequelize(rawDbUrl, sequelizeOptions);
  }

  return new Sequelize(dbName, dbUser, dbPassword, {
    ...sequelizeOptions,
    host: dbHost || 'localhost',
    port: dbPort,
  });
}

sequelize = createSequelizeInstance(true);

const connectDB = async () => {
  const activeUrl = process.env.DATABASE_URL;

  if (!activeUrl || !isValidUrl(activeUrl)) {
    throw new Error(
      'Missing or invalid DATABASE_URL in environment variables. Please update .env with your actual Supabase connection string.'
    );
  }

  try {
    try {
      await sequelize.authenticate();
    } catch (authError) {
      // If replica was configured and failed, fallback to standalone primary connection
      if (rawReadDbUrl || dbReadHost) {
        console.warn(
          '[DB] Read replica unreachable or authentication failed. Falling back to primary cluster:',
          authError.message
        );
        sequelize = createSequelizeInstance(false);
        await sequelize.authenticate();
      } else {
        throw authError;
      }
    }

    console.log('PostgreSQL Connected (Supabase)');

    // In production and enterprise environments, migrations should be run via 'npm run migrate'.
    // Runtime sync is only performed if explicitly opted into via DB_SYNC=true.
    if (process.env.DB_SYNC === 'true') {
      await sequelize.sync();
      console.log('Database schema synced via DB_SYNC');
    }

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
