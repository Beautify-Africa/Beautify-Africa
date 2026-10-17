-- =====================================================================
-- Beautify Africa - Supabase Security Advisor Hardening Script
-- Remediates:
-- 1. 0007_rls_disabled_in_public (sequelize_meta, webhook_events)
-- 2. 0008_rls_enabled_no_policy (14 application tables)
--
-- Safe, transactional, idempotent. Can be run in Supabase SQL Editor.
-- =====================================================================

BEGIN;

-- 1. Enable RLS on all 16 tables
ALTER TABLE IF EXISTS public.sequelize_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlist_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists ENABLE ROW LEVEL SECURITY;

-- 2. Drop any legacy broad policies that defaulted to TO PUBLIC
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'sequelize_meta', 'webhook_events', 'admin_timeline_entries',
    'cart_items', 'carts', 'inventory_ledgers', 'newsletters',
    'order_items', 'order_shipping_addresses', 'orders',
    'product_reviews', 'product_variants', 'products',
    'users', 'wishlist_products', 'wishlists'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "backend_full_access_%s" ON public.%I;', tbl, tbl);
  END LOOP;
END $$;

-- 3. Revoke all permissions on all 16 tables from anon, authenticated, and public
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'sequelize_meta', 'webhook_events', 'admin_timeline_entries',
    'cart_items', 'carts', 'inventory_ledgers', 'newsletters',
    'order_items', 'order_shipping_addresses', 'orders',
    'product_reviews', 'product_variants', 'products',
    'users', 'wishlist_products', 'wishlists'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon;', tbl);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated;', tbl);
      END IF;
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public;', tbl);
    END IF;
  END LOOP;
END $$;

-- 4. Ensure backend owner (postgres) and service_role retain full permissions
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'sequelize_meta', 'webhook_events', 'admin_timeline_entries',
    'cart_items', 'carts', 'inventory_ledgers', 'newsletters',
    'order_items', 'order_shipping_addresses', 'orders',
    'product_reviews', 'product_variants', 'products',
    'users', 'wishlist_products', 'wishlists'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO postgres;', tbl);
      END IF;
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role;', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 5. Establish explicit internal service_role policies to resolve 0008_rls_enabled_no_policy
DO $$
DECLARE
  tbl text;
  pol text;
  tables text[] := ARRAY[
    'sequelize_meta', 'webhook_events', 'admin_timeline_entries',
    'cart_items', 'carts', 'inventory_ledgers', 'newsletters',
    'order_items', 'order_shipping_addresses', 'orders',
    'product_reviews', 'product_variants', 'products',
    'users', 'wishlist_products', 'wishlists'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        pol := format('service_role_all_%s', tbl);
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE schemaname = 'public' AND tablename = tbl AND policyname = pol
        ) THEN
          EXECUTE format(
            'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
            pol, tbl
          );
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;
