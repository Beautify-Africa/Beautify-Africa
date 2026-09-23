// scripts/enableDatabaseSecurity.js
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, sequelize } = require('../config/db');

const TABLES = [
  'users',
  'products',
  'product_variants',
  'product_reviews',
  'orders',
  'order_items',
  'order_shipping_addresses',
  'admin_timeline_entries',
  'inventory_ledgers',
  'newsletters',
  'wishlists',
  'wishlist_products',
  'carts',
  'cart_items',
];

async function enableRLS() {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL database for security hardening...');

    for (const table of TABLES) {
      try {
        await sequelize.query(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`[RLS ENABLED] Table: "${table}"`);
      } catch (err) {
        console.warn(`[RLS WARNING] Could not enable RLS on table "${table}":`, err.message);
      }
    }

    console.log('\nDatabase Row Level Security hardening complete!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply database security hardening:', error);
    process.exit(1);
  }
}

enableRLS();
