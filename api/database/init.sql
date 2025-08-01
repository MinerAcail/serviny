-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user if it doesn't already exist
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles WHERE rolname = 'justserviny'
   ) THEN
      CREATE USER justserviny WITH PASSWORD '0000';
   END IF;
END
$$;

-- Create database if it doesn't already exist
DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_database WHERE datname = 'testserviny'
   ) THEN
      CREATE DATABASE testserviny OWNER justserviny;
   END IF;
END
$$;

-- Optional: connect to the new DB
-- \c testserviny

-- Optional: check current user
SELECT current_user;

-- Optional: show a table (if exists)
SELECT table_name
FROM information_schema.tables
WHERE table_catalog = current_database()
  AND table_schema = 'public'
LIMIT 1;

-- Optional: show DB name
SELECT current_database();
