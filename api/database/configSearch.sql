-- Install required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Check if search_vector column exists, if not add it
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


-- Create or replace the function for search vector updates
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.categories, ' '), '')), 'B');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists, then create it
DROP TRIGGER IF EXISTS products_search_vector_update ON products;
CREATE TRIGGER products_search_vector_update
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Drop the indexes if they exist, then create them
DROP INDEX IF EXISTS products_search_idx;
CREATE INDEX products_search_idx ON products USING GIN(search_vector);

-- Create trigram index for fuzzy matching on name
DROP INDEX IF EXISTS products_name_trgm_idx;
CREATE INDEX products_name_trgm_idx ON products USING GIN (name gin_trgm_ops);

-- Update existing records to ensure they're indexed
UPDATE products SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(array_to_string(categories, ' '), '')), 'B');





  -- Ensure search_vector column exists in category_boxes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'category_boxes' 
        AND column_name = 'search_vector'
    ) THEN
        ALTER TABLE category_boxes ADD COLUMN search_vector tsvector;
    END IF;
END $$;
-- Function to update search_vector for category_boxes
CREATE OR REPLACE FUNCTION category_boxes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;


DROP TRIGGER IF EXISTS category_boxes_search_vector_update ON category_boxes;
CREATE TRIGGER category_boxes_search_vector_update
BEFORE INSERT OR UPDATE ON category_boxes
FOR EACH ROW EXECUTE FUNCTION category_boxes_search_vector_update();


DROP INDEX IF EXISTS category_boxes_search_idx;
CREATE INDEX category_boxes_search_idx ON category_boxes USING GIN(search_vector);


-- Update existing records to ensure search indexing
UPDATE category_boxes SET search_vector = 
  setweight(to_tsvector('english', COALESCE(name, '')), 'A');