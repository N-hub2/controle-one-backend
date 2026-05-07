-- Project: Controle One
-- File: database/reset.sql
-- Purpose: Reset the local demo database
-- This file is for local development/demo only.
-- Do not use in production.
-- This file drops and recreates the controle_one database.
-- After running this file, run database/schema.sql.
-- Then run database/seed.sql if demo data is needed.

-- WARNING:
-- This file deletes the local controle_one database.
-- Use only for local demo reset.

SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS controle_one;

CREATE DATABASE IF NOT EXISTS controle_one
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE controle_one;

SET FOREIGN_KEY_CHECKS = 1;

-- Reset completed.
-- Next steps:
-- 1. Import database/schema.sql
-- 2. Import database/seed.sql if demo data is required
