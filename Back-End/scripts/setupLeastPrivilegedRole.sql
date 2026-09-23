-- scripts/setupLeastPrivilegedRole.sql
-- ==============================================================================
-- Least-Privileged Database Role Provisioning Script for Beautify Africa
--
-- Objective:
-- Separate application runtime database access from migration/DDL administrative
-- privileges. The web application runs under 'beautify_app_user' with strictly
-- bounded DML permissions (SELECT, INSERT, UPDATE, DELETE).
--
-- Run this script as the database superuser (e.g. 'postgres' or 'supabase_admin').
-- ==============================================================================

-- 1. Create the application runtime role with login capability
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'beautify_app_user') THEN
    CREATE ROLE beautify_app_user WITH LOGIN PASSWORD 'change_to_secure_app_password';
  END IF;
END
$$;

-- 2. Grant connection rights to the application database
GRANT CONNECT ON DATABASE postgres TO beautify_app_user;

-- 3. Grant schema usage (cannot create or drop schemas/tables)
GRANT USAGE ON SCHEMA public TO beautify_app_user;
REVOKE CREATE ON SCHEMA public FROM beautify_app_user;

-- 4. Grant strictly DML operations on all existing application tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO beautify_app_user;

-- 5. Explicitly deny destructive DDL commands by withholding table ownership
-- beautify_app_user CANNOT execute DROP TABLE, TRUNCATE TABLE, or ALTER TABLE

-- 6. Grant sequence usage for auto-incrementing primary keys
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO beautify_app_user;

-- 7. Ensure future tables created by migrations automatically inherit DML permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO beautify_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE, SELECT ON SEQUENCES TO beautify_app_user;

-- 8. Protect migration tracking table from application runtime modifications
REVOKE ALL PRIVILEGES ON TABLE "SequelizeMeta" FROM beautify_app_user;
GRANT SELECT ON TABLE "SequelizeMeta" TO beautify_app_user;

COMMENT ON ROLE beautify_app_user IS 'Least-privileged runtime database user for Beautify Africa web application';
