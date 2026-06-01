-- Force-reset all tables for UUID migration
-- WAARNING: this deletes all existing data

DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
DROP TABLE IF EXISTS "tasks" CASCADE;
DROP TABLE IF EXISTS "meetings" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
