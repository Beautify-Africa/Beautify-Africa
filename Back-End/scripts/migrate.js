// scripts/migrate.js
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, sequelize } = require('../config/db');
const migrator = require('../config/migrator');

async function runMigrations() {
  console.log('--- Starting Database Migrations (Umzug) ---');
  try {
    await connectDB();

    const pending = await migrator.pending();
    console.log(`Found ${pending.length} pending migration(s).`);

    if (pending.length > 0) {
      console.log('Applying migrations:', pending.map((m) => m.name).join(', '));
      const executed = await migrator.up();
      console.log(`Successfully executed ${executed.length} migration(s).`);
    } else {
      console.log('Database is already up to date. No migrations to apply.');
    }

    await sequelize.close();
    console.log('--- Migration Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed with error:', err);
    if (sequelize) {
      await sequelize.close().catch(() => {});
    }
    process.exit(1);
  }
}

runMigrations();
