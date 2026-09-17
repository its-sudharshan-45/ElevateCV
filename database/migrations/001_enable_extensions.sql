-- 001_enable_extensions.sql
-- Enables required PostgreSQL extensions for UpSkilr.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
