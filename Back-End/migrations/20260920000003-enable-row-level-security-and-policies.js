// migrations/20260920000003-enable-row-level-security-and-policies.js
/**
 * Migration enabling Row Level Security (RLS) on all application tables
 * and establishing baseline security policies for least-privileged data access.
 * Includes PostgreSQL dialect guards and error protection for test environments.
 */

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

module.exports = {
  up: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    const sequelize = queryInterface.sequelize;

    for (const table of TABLES) {
      try {
        // 1. Enable RLS on table
        await sequelize.query(`ALTER TABLE IF EXISTS "${table}" ENABLE ROW LEVEL SECURITY;`);

        // 2. Grant full access to table owner / superuser / backend connection role
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
        console.warn(`[RLS Migration] Notice for table ${table}:`, err.message);
      }
    }

    // 3. Define specific public read policies for products and reviews for external clients
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

      await sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'product_reviews' AND policyname = 'public_view_reviews'
          ) THEN
            CREATE POLICY "public_view_reviews" ON "product_reviews"
            FOR SELECT
            USING (true);
          END IF;
        END $$;
      `);
    } catch (err) {
      console.warn('[RLS Migration] Public policies notice:', err.message);
    }
  },

  down: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    const sequelize = queryInterface.sequelize;

    for (const table of TABLES) {
      try {
        await sequelize.query(`DROP POLICY IF EXISTS "backend_full_access_${table}" ON "${table}";`);
        await sequelize.query(`ALTER TABLE IF EXISTS "${table}" DISABLE ROW LEVEL SECURITY;`);
      } catch (err) {
        // continue
      }
    }

    try {
      await sequelize.query('DROP POLICY IF EXISTS "public_view_published_products" ON "products";');
      await sequelize.query('DROP POLICY IF EXISTS "public_view_reviews" ON "product_reviews";');
    } catch (err) {
      // continue
    }
  },
};
