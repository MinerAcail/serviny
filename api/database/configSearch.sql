-- // SQL to add search capabilities to the services table

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

-- Create function to update search vector
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

-- Create trigger for search vector updates
DROP TRIGGER IF EXISTS services_search_vector_update ON services;
CREATE TRIGGER services_search_vector_update
BEFORE INSERT OR UPDATE ON services
FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();

-- Create GIN index for full-text search
DROP INDEX IF EXISTS services_search_idx;
CREATE INDEX services_search_idx ON services USING GIN(search_vector);

-- Create trigram indexes for fuzzy matching
DROP INDEX IF EXISTS services_name_trgm_idx;
CREATE INDEX services_name_trgm_idx ON services USING GIN (name gin_trgm_ops);

DROP INDEX IF EXISTS services_location_trgm_idx;
CREATE INDEX services_location_trgm_idx ON services USING GIN (location gin_trgm_ops);

DROP INDEX IF EXISTS services_number_trgm_idx;
CREATE INDEX services_number_trgm_idx ON services USING GIN (number gin_trgm_ops);

-- Update existing records
UPDATE services SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(number, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(profession, ' '), '')), 'A');