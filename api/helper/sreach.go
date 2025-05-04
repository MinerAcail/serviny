package helper

import (
	"fmt"

	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"
)

// FetchAllService retrieves services with pagination
func FetchAllService(db *gorm.DB, limit int, offset int) ([]*model.Service, error) {
	var services []*model.Service
	
	if err := db.Limit(limit).Offset(offset).Find(&services).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch services: %v", err)
	}
	
	return services, nil
}

// ExecuteSearchQuery performs the search for services with advanced ranking
func ExecuteSearchQuery(db *gorm.DB, query string) ([]*model.Service, error) {
	var services []*model.Service
	similarityThreshold := 0.12

	err := db.Raw(`
		WITH ranked_services AS (
			SELECT 
				*,
				ts_rank_cd(search_vector, plainto_tsquery('english', ?)) AS ts_rank_val,
				similarity(LOWER(name), LOWER(?)) AS name_sim,
				GREATEST(
					similarity(LOWER(name), LOWER(?)),
					similarity(LOWER(location), LOWER(?)),
					similarity(LOWER(number), LOWER(?))
				) AS max_field_sim
			FROM services
			WHERE 
				search_vector @@ plainto_tsquery('english', ?) OR
				similarity(LOWER(name), LOWER(?)) > CAST(? AS NUMERIC) OR
				similarity(LOWER(location), LOWER(?)) > CAST(? AS NUMERIC) OR
				similarity(LOWER(number), LOWER(?)) > CAST(? AS NUMERIC) OR
				name ILIKE '%' || ? || '%' OR
				location ILIKE '%' || ? || '%' OR
				number ILIKE '%' || ? || '%' OR
				EXISTS (
					SELECT 1 FROM unnest(profession) as p
					WHERE LOWER(p) LIKE LOWER(?)
				)
		)
		SELECT * FROM ranked_services
		ORDER BY
			CASE 
				WHEN LOWER(name) = LOWER(?) THEN 10.0
				WHEN name ILIKE ? || '%' THEN 8.0
				WHEN EXISTS (
					SELECT 1 FROM unnest(profession) as p
					WHERE LOWER(p) = LOWER(?)
				) THEN 7.0
				WHEN name ILIKE '%' || ? || '%' THEN 6.0
				WHEN location ILIKE '%' || ? || '%' THEN 4.0
				WHEN number ILIKE '%' || ? || '%' THEN 3.0
				ELSE 0 
			END +
			(max_field_sim * 5.0) +
			(name_sim * 3.0) +
			(ts_rank_val * 2.0)
		DESC LIMIT 50
	`, 
	query, query, query, query, query, 
	query, query, fmt.Sprintf("%f", similarityThreshold),
	query, fmt.Sprintf("%f", similarityThreshold),
	query, fmt.Sprintf("%f", similarityThreshold),
	query, query, query, "%" + query + "%",
	query, query, query, query, query, query).Find(&services).Error

	if err != nil {
		return nil, fmt.Errorf("failed to search services: %v", err)
	}

	return services, nil
}

// FetchServicesByType retrieves services of a specific type
func FetchServicesByType(db *gorm.DB, serviceType string, limit int, offset int) ([]*model.Service, error) {
	var services []*model.Service
	
	if err := db.Where("type = ?", serviceType).Limit(limit).Offset(offset).Find(&services).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch services by type: %v", err)
	}
	
	return services, nil
}

// FetchServicesByProfession retrieves services with a specific profession
func FetchServicesByProfession(db *gorm.DB, profession string, limit int, offset int) ([]*model.Service, error) {
	var services []*model.Service
	
	if err := db.Where("? = ANY(profession)", profession).Limit(limit).Offset(offset).Find(&services).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch services by profession: %v", err)
	}
	
	return services, nil
}

// FetchServicesByLocation retrieves services in a specific location
func FetchServicesByLocation(db *gorm.DB, location string, limit int, offset int) ([]*model.Service, error) {
	var services []*model.Service
	
	if err := db.Where("location ILIKE ?", "%" + location + "%").Limit(limit).Offset(offset).Find(&services).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch services by location: %v", err)
	}
	
	return services, nil
}

// PrepareSearchVector sets up the necessary PostgreSQL extensions and indexes for search
func PrepareSearchVector(db *gorm.DB) error {
	// Install required extensions
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS pg_trgm").Error; err != nil {
		return fmt.Errorf("failed to create pg_trgm extension: %v", err)
	}
	
	if err := db.Exec("CREATE EXTENSION IF NOT EXISTS fuzzystrmatch").Error; err != nil {
		return fmt.Errorf("failed to create fuzzystrmatch extension: %v", err)
	}
	
	// Add search_vector column if it doesn't exist
	if err := db.Exec(`
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
	`).Error; err != nil {
		return fmt.Errorf("failed to add search_vector column: %v", err)
	}
	
	// Create function for search vector updates
	if err := db.Exec(`
		CREATE OR REPLACE FUNCTION services_search_vector_update() RETURNS trigger AS $$
		BEGIN
		  NEW.search_vector = 
			setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
			setweight(to_tsvector('english', COALESCE(NEW.number, '')), 'C') ||
			setweight(to_tsvector('english', COALESCE(NEW.location, '')), 'B') ||
			setweight(to_tsvector('english', COALESCE(array_to_string(NEW.profession, ' '), '')), 'A');
		  RETURN NEW;
		END
		$$ LANGUAGE plpgsql;
	`).Error; err != nil {
		return fmt.Errorf("failed to create search vector update function: %v", err)
	}
	
	// Create trigger for search vector updates
	if err := db.Exec(`
		DROP TRIGGER IF EXISTS services_search_vector_update ON services;
		CREATE TRIGGER services_search_vector_update
		BEFORE INSERT OR UPDATE ON services
		FOR EACH ROW EXECUTE FUNCTION services_search_vector_update();
	`).Error; err != nil {
		return fmt.Errorf("failed to create search vector update trigger: %v", err)
	}
	
	// Create GIN index for full-text search
	if err := db.Exec(`
		DROP INDEX IF EXISTS services_search_idx;
		CREATE INDEX services_search_idx ON services USING GIN(search_vector);
	`).Error; err != nil {
		return fmt.Errorf("failed to create search index: %v", err)
	}
	
	// Create trigram indexes for fuzzy matching
	if err := db.Exec(`
		DROP INDEX IF EXISTS services_name_trgm_idx;
		CREATE INDEX services_name_trgm_idx ON services USING GIN (name gin_trgm_ops);
	`).Error; err != nil {
		return fmt.Errorf("failed to create name trigram index: %v", err)
	}
	
	if err := db.Exec(`
		DROP INDEX IF EXISTS services_location_trgm_idx;
		CREATE INDEX services_location_trgm_idx ON services USING GIN (location gin_trgm_ops);
	`).Error; err != nil {
		return fmt.Errorf("failed to create location trigram index: %v", err)
	}
	
	if err := db.Exec(`
		DROP INDEX IF EXISTS services_number_trgm_idx;
		CREATE INDEX services_number_trgm_idx ON services USING GIN (number gin_trgm_ops);
	`).Error; err != nil {
		return fmt.Errorf("failed to create number trigram index: %v", err)
	}
	
	// Update existing records
	if err := db.Exec(`
		UPDATE services SET search_vector = 
		setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
		setweight(to_tsvector('english', COALESCE(number, '')), 'C') ||
		setweight(to_tsvector('english', COALESCE(location, '')), 'B') ||
		setweight(to_tsvector('english', COALESCE(array_to_string(profession, ' '), '')), 'A');
	`).Error; err != nil {
		return fmt.Errorf("failed to update existing records: %v", err)
	}
	
	return nil
}