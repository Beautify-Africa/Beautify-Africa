// migrations/20261017000001-harden-supabase-security-advisor.js
/**
 * Security Hardening Migration for Supabase Security Advisor Findings
 * 
 * Remediates:
 * 1. 0007_rls_disabled_in_public: Enables RLS on public.sequelize_meta and public.webhook_events.
 * 2. 0008_rls_enabled_no_policy: Enforces least-privilege security by revoking public/anon/authenticated
 *    access on all 16 application tables and defining explicit internal service_role policies.
 * 
 * Safe Ordering:
 * - Drops legacy broad policies lacking explicit role scoping.
 * - Enables RLS on all 16 tables.
 * - Revokes grants from anon, authenticated, and public.
 * - Grants full access to backend connection role (postgres) and service_role.
 * - Establishes explicit service_role policies so that the Supabase Security Advisor checks pass completely.
 */

const TABLES = [
  'sequelize_meta',
  'webhook_events',
  'admin_timeline_entries',
  'cart_items',
  'carts',
  'inventory_ledgers',
  'newsletters',
  'order_items',
  'order_shipping_addresses',
  'orders',
  'product_reviews',
  'product_variants',
  'products',
  'users',
  'wishlist_products',
  'wishlists',
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
        // 1. Drop any legacy broad policies that defaulted to TO PUBLIC
        await sequelize.query(`
          DROP POLICY IF EXISTS "backend_full_access_${table}" ON public."${table}";
        `);

        // 2. Enable Row Level Security (covers both newly enabled and already enabled tables)
        await sequelize.query(`
          ALTER TABLE IF EXISTS public."${table}" ENABLE ROW LEVEL SECURITY;
        `);

        // 3. Revoke all permissions from anon, authenticated, and public
        await sequelize.query(`
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '${table}') THEN
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                REVOKE ALL ON TABLE public."${table}" FROM anon;
              END IF;
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                REVOKE ALL ON TABLE public."${table}" FROM authenticated;
              END IF;
              REVOKE ALL ON TABLE public."${table}" FROM public;
            END IF;
          END $$;
        `);

        // 4. Ensure backend owner (postgres) and Supabase service_role retain full privileges
        await sequelize.query(`
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '${table}') THEN
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
                GRANT ALL ON TABLE public."${table}" TO postgres;
              END IF;
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
                GRANT ALL ON TABLE public."${table}" TO service_role;
              END IF;
            END IF;
          END $$;
        `);

        // 5. Establish explicit policy for service_role to resolve 0008_rls_enabled_no_policy
        await sequelize.query(`
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = '${table}') THEN
              IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
                IF NOT EXISTS (
                  SELECT 1 FROM pg_policies 
                  WHERE schemaname = 'public' AND tablename = '${table}' AND policyname = 'service_role_all_${table}'
                ) THEN
                  CREATE POLICY "service_role_all_${table}" ON public."${table}"
                  FOR ALL
                  TO service_role
                  USING (true)
                  WITH CHECK (true);
                END IF;
              END IF;
            END IF;
          END $$;
        `);
      } catch (err) {
        console.warn(`[Security Hardening Migration] Notice for table ${table}:`, err.message);
      }
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
        await sequelize.query(`
          DROP POLICY IF EXISTS "service_role_all_${table}" ON public."${table}";
        `);
      } catch (err) {
        // continue
      }
    }

    // Only disable RLS on tables where it was initially disabled before this hardening
    const initiallyDisabled = ['sequelize_meta', 'webhook_events'];
    for (const table of initiallyDisabled) {
      try {
        await sequelize.query(`
          ALTER TABLE IF EXISTS public."${table}" DISABLE ROW LEVEL SECURITY;
        `);
      } catch (err) {
        // continue
      }
    }
  },
};
