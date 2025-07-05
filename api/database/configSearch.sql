-- SQL to add search capabilities to the services table

-- Install required extensions if not already installed
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- pg_wordvector dependency removed

-- Add search_vector column to services table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE services ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Add search_vector column to products table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE products ADD COLUMN search_vector tsvector;
    END IF;
END $$;

-- Create function to update search vector for services
CREATE OR REPLACE FUNCTION services_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.number, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.profession, ' '), '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create function to update search vector for products
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.price, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.items_type, ' '), '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.state::text, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for services search vector updates
DROP TRIGGER IF EXISTS services_search_vector_update ON services;
CREATE TRIGGER services_search_vector_update
BEFORE INSERT OR UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();

-- Create trigger for products search vector updates
DROP TRIGGER IF EXISTS products_search_vector_update ON products;
CREATE TRIGGER products_search_vector_update
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Create GIN index for full-text search on services
DROP INDEX IF EXISTS services_search_idx;
CREATE INDEX services_search_idx ON services USING GIN(search_vector);

-- Create GIN index for full-text search on products
DROP INDEX IF EXISTS products_search_idx;
CREATE INDEX products_search_idx ON products USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on services
DROP INDEX IF EXISTS services_name_trgm_idx;
CREATE INDEX services_name_trgm_idx ON services USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS services_location_trgm_idx;
CREATE INDEX services_location_trgm_idx ON services USING GIN (location gin_trgm_ops);

DROP INDEX IF EXISTS services_number_trgm_idx;
CREATE INDEX services_number_trgm_idx ON services USING GIN (number gin_trgm_ops);

-- Create trigram indexes for fuzzy matching on products
DROP INDEX IF EXISTS products_name_trgm_idx;
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops) WHERE name IS NOT NULL;

DROP INDEX IF EXISTS products_description_trgm_idx;
CREATE INDEX products_description_trgm_idx ON products USING GIN (description gin_trgm_ops) WHERE description IS NOT NULL;

DROP INDEX IF EXISTS products_price_trgm_idx;
CREATE INDEX products_price_trgm_idx ON products USING GIN (price gin_trgm_ops) WHERE price IS NOT NULL;

-- Update existing services records
UPDATE services SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(number, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(profession, ' '), '')), 'A');

-- Update existing products records with search vectors
UPDATE products SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(price, '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(categories, ' '), '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(items_type, ' '), '')), 'C') ||
  setweight(to_tsvector('english', COALESCE(state::text, '')), 'C');

-- Function to check if column exists
CREATE OR REPLACE FUNCTION column_exists(p_table_name text, p_column_name text) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = p_table_name
      AND column_name = p_column_name
  );
END;
$$ LANGUAGE plpgsql;

-- Add search_vector column to additional tables (if not exists)
DO $$
BEGIN
  IF NOT column_exists('gallery_professions', 'search_vector') THEN
    ALTER TABLE gallery_professions ADD COLUMN search_vector tsvector;
  END IF;
  IF NOT column_exists('policy_details', 'search_vector') THEN
    ALTER TABLE policy_details ADD COLUMN search_vector tsvector;
  END IF;
  IF NOT column_exists('policies', 'search_vector') THEN
    ALTER TABLE policies ADD COLUMN search_vector tsvector;
  END IF;
  IF NOT column_exists('amenities', 'search_vector') THEN
    ALTER TABLE amenities ADD COLUMN search_vector tsvector;
  END IF;
  IF NOT column_exists('price_cards', 'search_vector') THEN
    ALTER TABLE price_cards ADD COLUMN search_vector tsvector;
  END IF;
  IF NOT column_exists('prices', 'search_vector') THEN
    ALTER TABLE prices ADD COLUMN search_vector tsvector;
  END IF;
END
$$;

-- Create search vector functions for additional tables

-- gallery_professions
CREATE OR REPLACE FUNCTION gallery_professions_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS gallery_professions_search_vector_update ON gallery_professions;
CREATE TRIGGER gallery_professions_search_vector_update
  BEFORE INSERT OR UPDATE ON gallery_professions
  FOR EACH ROW EXECUTE FUNCTION gallery_professions_search_vector_update();

DROP INDEX IF EXISTS gallery_professions_search_idx;
CREATE INDEX gallery_professions_search_idx ON gallery_professions USING GIN(search_vector);

-- policy_details
CREATE OR REPLACE FUNCTION policy_details_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.list_items, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS policy_details_search_vector_update ON policy_details;
CREATE TRIGGER policy_details_search_vector_update
  BEFORE INSERT OR UPDATE ON policy_details
  FOR EACH ROW EXECUTE FUNCTION policy_details_search_vector_update();

DROP INDEX IF EXISTS policy_details_search_idx;
CREATE INDEX policy_details_search_idx ON policy_details USING GIN(search_vector);

-- policies
CREATE OR REPLACE FUNCTION policies_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS policies_search_vector_update ON policies;
CREATE TRIGGER policies_search_vector_update
  BEFORE INSERT OR UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION policies_search_vector_update();

DROP INDEX IF EXISTS policies_search_idx;
CREATE INDEX policies_search_idx ON policies USING GIN(search_vector);

-- amenities
CREATE OR REPLACE FUNCTION amenities_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = setweight(to_tsvector('english', COALESCE(NEW.text, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS amenities_search_vector_update ON amenities;
CREATE TRIGGER amenities_search_vector_update
  BEFORE INSERT OR UPDATE ON amenities
  FOR EACH ROW EXECUTE FUNCTION amenities_search_vector_update();

DROP INDEX IF EXISTS amenities_search_idx;
CREATE INDEX amenities_search_idx ON amenities USING GIN(search_vector);

-- price_cards
CREATE OR REPLACE FUNCTION price_cards_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS price_cards_search_vector_update ON price_cards;
CREATE TRIGGER price_cards_search_vector_update
  BEFORE INSERT OR UPDATE ON price_cards
  FOR EACH ROW EXECUTE FUNCTION price_cards_search_vector_update();

DROP INDEX IF EXISTS price_cards_search_idx;
CREATE INDEX price_cards_search_idx ON price_cards USING GIN(search_vector);

-- prices
CREATE OR REPLACE FUNCTION prices_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('english', COALESCE(NEW.label::text, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.value::text, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prices_search_vector_update ON prices;
CREATE TRIGGER prices_search_vector_update
  BEFORE INSERT OR UPDATE ON prices
  FOR EACH ROW EXECUTE FUNCTION prices_search_vector_update();

DROP INDEX IF EXISTS prices_search_idx;
CREATE INDEX prices_search_idx ON prices USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching on additional tables
DROP INDEX IF EXISTS gallery_professions_title_trgm_idx;
CREATE INDEX gallery_professions_title_trgm_idx ON gallery_professions USING GIN ((title) gin_trgm_ops) WHERE title IS NOT NULL;

DROP INDEX IF EXISTS gallery_professions_description_trgm_idx;
CREATE INDEX gallery_professions_description_trgm_idx ON gallery_professions USING GIN ((description) gin_trgm_ops) WHERE description IS NOT NULL;

DROP INDEX IF EXISTS policy_details_title_trgm_idx;
CREATE INDEX policy_details_title_trgm_idx ON policy_details USING GIN (title gin_trgm_ops);

DROP INDEX IF EXISTS policy_details_content_trgm_idx;
CREATE INDEX policy_details_content_trgm_idx ON policy_details USING GIN (content gin_trgm_ops);

DROP INDEX IF EXISTS policies_name_trgm_idx;
CREATE INDEX policies_name_trgm_idx ON policies USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS policies_description_trgm_idx;
CREATE INDEX policies_description_trgm_idx ON policies USING GIN (description gin_trgm_ops);

DROP INDEX IF EXISTS amenities_text_trgm_idx;
CREATE INDEX amenities_text_trgm_idx ON amenities USING GIN (text gin_trgm_ops);

DROP INDEX IF EXISTS price_cards_title_trgm_idx;
CREATE INDEX price_cards_title_trgm_idx ON price_cards USING GIN (title gin_trgm_ops);

DROP INDEX IF EXISTS price_cards_description_trgm_idx;
CREATE INDEX price_cards_description_trgm_idx ON price_cards USING GIN (description gin_trgm_ops);

DROP INDEX IF EXISTS prices_label_trgm_idx;
CREATE INDEX prices_label_trgm_idx ON prices USING GIN (label gin_trgm_ops);

DROP INDEX IF EXISTS prices_value_trgm_idx;
CREATE INDEX prices_value_trgm_idx ON prices USING GIN (value gin_trgm_ops);

-- Backfill search_vector for all tables
DO $$
DECLARE
  t RECORD;
  sql TEXT;
BEGIN
  FOR t IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN (
        'gallery_professions',
        'policy_details',
        'policies',
        'amenities',
        'price_cards',
        'prices'
      )
  LOOP
    IF t.table_name = 'gallery_professions' THEN
      sql := format(
        'UPDATE %I.%I
         SET search_vector =
           setweight(to_tsvector(''english'', COALESCE(title, '''')), ''A'') ||
           setweight(to_tsvector(''english'', COALESCE(description, '''')), ''B'') ||
           setweight(to_tsvector(''english'', COALESCE(array_to_string(categories, '' ''), '''')), ''B'')',
        t.table_schema, t.table_name);
    ELSIF t.table_name = 'policy_details' THEN
      sql := format(
        'UPDATE %I.%I
         SET search_vector =
           setweight(to_tsvector(''english'', COALESCE(title, '''')), ''A'') ||
           setweight(to_tsvector(''english'', COALESCE(content, '''')), ''B'') ||
           setweight(to_tsvector(''english'', COALESCE(array_to_string(list_items, '' ''), '''')), ''C'')',
        t.table_schema, t.table_name);
    ELSIF t.table_name = 'policies' THEN
      sql := format(
        'UPDATE %I.%I
         SET search_vector =
           setweight(to_tsvector(''english'', COALESCE(name, '''')), ''A'') ||
           setweight(to_tsvector(''english'', COALESCE(description, '''')), ''B'')',
        t.table_schema, t.table_name);
    ELSIF t.table_name = 'amenities' THEN
      sql := format(
        'UPDATE %I.%I
         SET search_vector =
           setweight(to_tsvector(''english'', COALESCE(text, '''')), ''A'')',
        t.table_schema, t.table_name);
    ELSIF t.table_name = 'price_cards' THEN
      sql := format(
        'UPDATE %I.%I
         SET search_vector =
           setweight(to_tsvector(''english'', COALESCE(title, '''')), ''A'') ||
           setweight(to_tsvector(''english'', COALESCE(description, '''')), ''B'')',
        t.table_schema, t.table_name);
    ELSIF t.table_name = 'prices' THEN
      sql := format(
        'UPDATE %I.%I
         SET search_vector =
           setweight(to_tsvector(''english'', COALESCE(label::text, '''')), ''A'') ||
           setweight(to_tsvector(''english'', COALESCE(value::text, '''')), ''B'')',
        t.table_schema, t.table_name);
    END IF;
    EXECUTE sql;
  END LOOP;
END;
$$;