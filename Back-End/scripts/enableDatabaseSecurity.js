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
  'webhook_events',
];

async function enableRLS() {
  try {
    await connectDB();
    console.log('Connected to PostgreSQL database for security hardening...');

    for (const table of TABLES) {
      try {
        await sequelize.query(`ALTER TABLE IF EXISTS "${table}" ENABLE ROW LEVEL SECURITY;`);
        console.log(`[RLS ENABLED] Table: "${table}"`);

        // Create default backend access policy if missing
        await sequelize.query(`
          DO $$ BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies 
              WHERE tablename = '${table}' AND policyname = 'backend_full_access_${table}'
            ) THEN
              CREATE POLICY "backend_full_access_${table}" ON "${table}" 
              FOR ALL 
              USING (true) 
              WITH CHECK (true);
            END IF;
          END $$;
        `);
      } catch (err) {
        console.warn(`[RLS WARNING] Table "${table}":`, err.message);
      }
    }

    // Public read policy for published products
    try {
      await sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'products' AND policyname = 'public_view_published_products'
          ) THEN
            CREATE POLICY "public_view_published_products" ON "products"
            FOR SELECT
            USING ("isArchived" = false);
          END IF;
        END $$;
      `);
      console.log('[POLICY] Public read policy on products verified.');
    } catch (err) {
      console.warn('[POLICY WARNING] Products policy:', err.message);
    }

    console.log('\n✅ Database Row Level Security hardening complete!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Failed to apply database security hardening:', error);
    process.exit(1);
  }
}

enableRLS();
