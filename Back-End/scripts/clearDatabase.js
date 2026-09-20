// scripts/clearDatabase.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, sequelize } = require('../config/db');
const redisClient = require('../config/redis');

async function clearDatabase() {
  try {
    console.log('Connecting to database...');
    await connectDB();

    // Query all public tables except migration tracking
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('SequelizeMeta', 'sequelize_meta');
    `);

    const tableNames = tables.map((t) => t.table_name);
    console.log('Found tables to clear:', tableNames);

    if (tableNames.length === 0) {
      console.log('No tables found.');
      return;
    }

    // Measure counts before truncate
    console.log('\n--- Pre-Clear Table Row Counts ---');
    for (const name of tableNames) {
      try {
        const [[{ count }]] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM "${name}";`);
        console.log(`  ${name}: ${count} rows`);
      } catch (err) {
        console.log(`  ${name}: could not count (${err.message})`);
      }
    }

    // Perform TRUNCATE CASCADE on all user tables
    const quotedTables = tableNames.map((name) => `"${name}"`).join(', ');
    console.log(`\nExecuting TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE...`);
    await sequelize.query(`TRUNCATE TABLE ${quotedTables} RESTART IDENTITY CASCADE;`);

    // Measure counts after truncate
    console.log('\n--- Post-Clear Table Row Counts ---');
    for (const name of tableNames) {
      try {
        const [[{ count }]] = await sequelize.query(`SELECT COUNT(*)::int AS count FROM "${name}";`);
        console.log(`  ${name}: ${count} rows`);
      } catch (err) {
        console.log(`  ${name}: could not count (${err.message})`);
      }
    }

    // Flush Redis cached keys (products, carts, exchange rates, etc.)
    console.log('\nClearing Redis cache...');
    if (redisClient.isOpen) {
      await redisClient.flushDb();
      console.log('Redis flushed successfully (all keys wiped).');
    }

    console.log('\n✅ Database and Redis successfully cleared! Ready to start afresh.');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exitCode = 1;
  } finally {
    try {
      if (redisClient.isOpen) {
        await redisClient.quit();
      }
    } catch {}
    try {
      await sequelize.close();
    } catch {}
    console.log('Database and Redis connections closed.');
  }
}

clearDatabase();
