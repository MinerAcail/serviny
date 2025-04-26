
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Get current user
SELECT current_user;

-- Get current table (example)
SELECT table_name
FROM information_schema.tables
WHERE table_catalog = current_database()
  AND table_schema = 'public'
LIMIT 1;

-- Get current database name
SELECT current_database();
