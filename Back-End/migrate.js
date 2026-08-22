const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { connectDB, sequelize } = require('./config/db');
require('./models'); // Loads and binds all models & associations

async function migrate() {
  try {
    await connectDB();
    console.log('PostgreSQL Connected');

    await sequelize.sync({ alter: true });
    console.log('Database sync complete! All tables and relations are up to date.');

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
