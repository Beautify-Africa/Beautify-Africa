// migrations/20260920000002-add-trigram-gin-search-indexes.js
/**
 * Migration enabling PostgreSQL pg_trgm extension and creating GIN trigram indexes
 * for lightning-fast wildcard and fuzzy search on products (name, brand, category).
 * Includes dialect guard and error protection for non-Postgres / test environments.
 */
module.exports = {
  up: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    } catch (err) {
      // In restricted DB environments where extension creation requires superuser,
      // continue gracefully without breaking migration execution.
      console.warn('pg_trgm extension installation skipped or non-superuser:', err.message);
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS products_name_trgm_gin ON products USING gin (name gin_trgm_ops);
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS products_brand_trgm_gin ON products USING gin (brand gin_trgm_ops);
      `);
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS products_category_trgm_gin ON products USING gin (category gin_trgm_ops);
      `);
    } catch (err) {
      console.warn('Failed to create GIN trigram search indexes:', err.message);
    }
  },

  down: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    try {
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_category_trgm_gin;');
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_brand_trgm_gin;');
      await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_name_trgm_gin;');
    } catch (err) {
      // Ignored during rollback
    }
  },
};
