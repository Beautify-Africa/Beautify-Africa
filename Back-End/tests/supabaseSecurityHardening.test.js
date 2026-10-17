// tests/supabaseSecurityHardening.test.js
const fs = require('fs');
const path = require('path');
const migration = require('../migrations/20261017000001-harden-supabase-security-advisor');

describe('Supabase Security Hardening Migration & Access Rules Suite', () => {
  const EXPECTED_TABLES = [
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

  test('migration exports valid up and down functions conforming to Umzug / Sequelize specs', () => {
    expect(typeof migration.up).toBe('function');
    expect(typeof migration.down).toBe('function');
  });

  test('migration targets exactly all 16 application tables identified in Supabase advisor findings', () => {
    const migrationFileContent = fs.readFileSync(
      path.resolve(__dirname, '../migrations/20261017000001-harden-supabase-security-advisor.js'),
      'utf8'
    );

    EXPECTED_TABLES.forEach((table) => {
      expect(migrationFileContent).toContain(`'${table}'`);
    });
  });

  test('migration up logic generates correct RLS activation, grant revocation, and service_role policies', async () => {
    const executedQueries = [];
    const mockSequelize = {
      getDialect: () => 'postgres',
      query: jest.fn(async (sql) => {
        executedQueries.push(sql);
        return [];
      }),
    };

    const mockParams = {
      context: {
        sequelize: mockSequelize,
      },
    };

    await migration.up(mockParams);

    // Verify query calls occurred
    expect(executedQueries.length).toBeGreaterThan(0);

    // Verify every table had RLS enabled, grants revoked from anon/authenticated, and service_role policy added
    EXPECTED_TABLES.forEach((table) => {
      const hasEnableRLS = executedQueries.some(
        (q) => q.includes(`ALTER TABLE IF EXISTS public."${table}" ENABLE ROW LEVEL SECURITY`)
      );
      expect(hasEnableRLS).toBe(true);

      const hasRevoke = executedQueries.some(
        (q) =>
          q.includes(`tablename = '${table}'`) &&
          q.includes('REVOKE ALL ON TABLE public."') &&
          q.includes('FROM anon') &&
          q.includes('FROM authenticated')
      );
      expect(hasRevoke).toBe(true);

      const hasServiceRoleGrant = executedQueries.some(
        (q) =>
          q.includes(`tablename = '${table}'`) &&
          q.includes('GRANT ALL ON TABLE public."') &&
          q.includes('TO service_role')
      );
      expect(hasServiceRoleGrant).toBe(true);

      const hasServiceRolePolicy = executedQueries.some(
        (q) =>
          q.includes(`service_role_all_${table}`) &&
          q.includes('TO service_role') &&
          q.includes('USING (true)') &&
          q.includes('WITH CHECK (true)')
      );
      expect(hasServiceRolePolicy).toBe(true);
    });
  });

  test('migration up skips non-postgres dialects gracefully', async () => {
    const mockSequelize = {
      getDialect: () => 'sqlite',
      query: jest.fn(),
    };

    await migration.up({ context: { sequelize: mockSequelize } });
    expect(mockSequelize.query).not.toHaveBeenCalled();
  });

  test('migration down cleanly drops policies and disables RLS on initially disabled tables', async () => {
    const executedQueries = [];
    const mockSequelize = {
      getDialect: () => 'postgres',
      query: jest.fn(async (sql) => {
        executedQueries.push(sql);
        return [];
      }),
    };

    await migration.down({ context: { sequelize: mockSequelize } });

    // Ensure all service_role policies are dropped
    EXPECTED_TABLES.forEach((table) => {
      const hasDropPolicy = executedQueries.some((q) =>
        q.includes(`DROP POLICY IF EXISTS "service_role_all_${table}"`)
      );
      expect(hasDropPolicy).toBe(true);
    });

    // Ensure only the two initially disabled tables are reverted to disabled
    const hasDisableMeta = executedQueries.some((q) =>
      q.includes('ALTER TABLE IF EXISTS public."sequelize_meta" DISABLE ROW LEVEL SECURITY')
    );
    const hasDisableWebhooks = executedQueries.some((q) =>
      q.includes('ALTER TABLE IF EXISTS public."webhook_events" DISABLE ROW LEVEL SECURITY')
    );
    expect(hasDisableMeta).toBe(true);
    expect(hasDisableWebhooks).toBe(true);
  });

  test('standalone SQL script matches expected safe transactional execution', () => {
    const sqlContent = fs.readFileSync(
      path.resolve(__dirname, '../scripts/supabase_security_remediation.sql'),
      'utf8'
    );

    expect(sqlContent).toContain('BEGIN;');
    expect(sqlContent).toContain('COMMIT;');

    EXPECTED_TABLES.forEach((table) => {
      expect(sqlContent).toContain(`ALTER TABLE IF EXISTS public.${table} ENABLE ROW LEVEL SECURITY;`);
      expect(sqlContent).toContain(`'${table}'`);
    });

    // Ensure no policies are assigned TO PUBLIC with USING (true)
    expect(sqlContent).not.toMatch(/CREATE POLICY.*TO public.*USING\s*\(true\)/i);
  });
});
