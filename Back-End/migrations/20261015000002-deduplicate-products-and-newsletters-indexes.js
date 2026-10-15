module.exports = {
  up: async (params) => {
    const queryInterface = params?.context || params;
    const dialect = queryInterface?.sequelize?.getDialect?.() || 'postgres';
    if (dialect !== 'postgres') {
      return;
    }

    await queryInterface.sequelize.query(`
      DO $$
      DECLARE
        keep_index TEXT;
        idx RECORD;
      BEGIN
        IF to_regclass('public.products') IS NOT NULL THEN
          SELECT relname
          INTO keep_index
          FROM (
            SELECT
              c.relname,
              ROW_NUMBER() OVER (
                ORDER BY
                  CASE
                    WHEN c.relname = 'products_slug_key' THEN 0
                    ELSE 1
                  END,
                  c.relname
              ) AS rn
            FROM pg_index i
            JOIN pg_class c ON c.oid = i.indexrelid
            JOIN pg_class t ON t.oid = i.indrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public'
              AND t.relname = 'products'
              AND i.indisunique = true
              AND i.indisprimary = false
              AND i.indpred IS NULL
              AND i.indexprs IS NULL
              AND i.indnatts = 1
              AND (SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = i.indkey[0]) = 'slug'
          ) ranked
          WHERE rn = 1;

          IF keep_index IS NOT NULL THEN
            FOR idx IN
              SELECT
                c.relname AS index_name,
                con.conname AS constraint_name
              FROM pg_index i
              JOIN pg_class c ON c.oid = i.indexrelid
              JOIN pg_class t ON t.oid = i.indrelid
              JOIN pg_namespace n ON n.oid = t.relnamespace
              LEFT JOIN pg_constraint con ON con.conindid = c.oid AND con.conrelid = t.oid
              WHERE n.nspname = 'public'
                AND t.relname = 'products'
                AND i.indisunique = true
                AND i.indisprimary = false
                AND i.indpred IS NULL
                AND i.indexprs IS NULL
                AND i.indnatts = 1
                AND (SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = i.indkey[0]) = 'slug'
                AND c.relname <> keep_index
            LOOP
              IF idx.constraint_name IS NOT NULL THEN
                EXECUTE format('ALTER TABLE public.products DROP CONSTRAINT IF EXISTS %I', idx.constraint_name);
              ELSE
                EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.index_name);
              END IF;
            END LOOP;
          END IF;
        END IF;

        IF to_regclass('public.newsletters') IS NOT NULL THEN
          SELECT relname
          INTO keep_index
          FROM (
            SELECT
              c.relname,
              ROW_NUMBER() OVER (
                ORDER BY
                  CASE
                    WHEN c.relname = 'newsletters_email_key' THEN 0
                    WHEN c.relname = 'newsletters_email' THEN 1
                    ELSE 2
                  END,
                  c.relname
              ) AS rn
            FROM pg_index i
            JOIN pg_class c ON c.oid = i.indexrelid
            JOIN pg_class t ON t.oid = i.indrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE n.nspname = 'public'
              AND t.relname = 'newsletters'
              AND i.indisunique = true
              AND i.indisprimary = false
              AND i.indpred IS NULL
              AND i.indexprs IS NULL
              AND i.indnatts = 1
              AND (SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = i.indkey[0]) = 'email'
          ) ranked
          WHERE rn = 1;

          IF keep_index IS NOT NULL THEN
            FOR idx IN
              SELECT
                c.relname AS index_name,
                con.conname AS constraint_name
              FROM pg_index i
              JOIN pg_class c ON c.oid = i.indexrelid
              JOIN pg_class t ON t.oid = i.indrelid
              JOIN pg_namespace n ON n.oid = t.relnamespace
              LEFT JOIN pg_constraint con ON con.conindid = c.oid AND con.conrelid = t.oid
              WHERE n.nspname = 'public'
                AND t.relname = 'newsletters'
                AND i.indisunique = true
                AND i.indisprimary = false
                AND i.indpred IS NULL
                AND i.indexprs IS NULL
                AND i.indnatts = 1
                AND (SELECT attname FROM pg_attribute WHERE attrelid = t.oid AND attnum = i.indkey[0]) = 'email'
                AND c.relname <> keep_index
            LOOP
              IF idx.constraint_name IS NOT NULL THEN
                EXECUTE format(
                  'ALTER TABLE public.newsletters DROP CONSTRAINT IF EXISTS %I',
                  idx.constraint_name
                );
              ELSE
                EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.index_name);
              END IF;
            END LOOP;
          END IF;
        END IF;
      END $$;
    `);
  },

  down: async () => {
    // Irreversible cleanup migration: intentionally no-op.
  },
};
