// scripts/rollback.js
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, sequelize } = require('../config/db');
const migrator = require('../config/migrator');

async function runRollback() {
  console.log('--- Starting Migration Rollback (Umzug) ---');
  try {
    await connectDB();

    const executed = await migrator.executed();
    if (executed.length === 0) {
      console.log('No executed migrations found to revert.');
      await sequelize.close();
      process.exit(0);
    }

    const last = executed[executed.length - 1];
    console.log(`Reverting last migration: ${last.name}...`);
    await migrator.down();
    console.log(`Successfully reverted: ${last.name}`);

    await sequelize.close();
    console.log('--- Rollback Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('Rollback failed with error:', err);
    if (sequelize) {
      await sequelize.close().catch(() => {});
    }
    process.exit(1);
  }
}

runRollback();
