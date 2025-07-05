package helper

import (
	"database/sql"
	"fmt"
	"strings"

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
// executeSearchQuery performs the full-text search with ranking
func ExecuteSearchQueryProduct(db *gorm.DB, query string) ([]*model.Product, error) {
	var products []*model.Product
	similarityThreshold := 0.12

	err := db.Raw(`
        WITH ranked_products AS (
            SELECT 
                * ,
                ts_rank_cd(search_vector, plainto_tsquery('english', ?)) AS ts_rank_val,
                similarity(LOWER(name), LOWER(?)) AS name_sim,
                word_similarity(name, ?) AS word_sim,
                GREATEST(
                    similarity(LOWER(name), LOWER(?)),
                    similarity(LOWER(?), LOWER(name))
                ) AS bidirectional_sim,
                levenshtein(LOWER(name), LOWER(?)) AS typo_distance
            FROM products
            WHERE 
                state != 'INACTIVE' AND 
                (search_vector @@ plainto_tsquery('english', ?) OR 
                (similarity(LOWER(name), LOWER(?)) > CAST(? AS NUMERIC)) OR 
                (name ILIKE '%' || ? || '%') OR 
                (name ILIKE ? || '%') OR 
                (levenshtein(LOWER(name), LOWER(?)) <= 2))
        )
        SELECT * FROM ranked_products
        ORDER BY
            CASE 
                WHEN LOWER(name) = LOWER(?) THEN 10.0
                WHEN name ILIKE ? THEN 8.0
                WHEN name ILIKE ? || '%' THEN 6.0
                WHEN name ILIKE '%' || ? || '%' THEN 4.0
                ELSE 0 
            END +
            (bidirectional_sim * 10.0) +
            (name_sim * 5.0) +
            (ts_rank_val * 2.0) +
            (word_sim * 3.0) +
            (CASE WHEN typo_distance <= 2 THEN (5 - typo_distance) * 2 ELSE 0 END)
        DESC LIMIT 50
    `, query, query, query, query, query, query, query, query, fmt.Sprintf("%f", similarityThreshold),
		query, query, query, query, query, query, query, query).Find(&products).Error

	if err != nil {
		return nil, fmt.Errorf("failed to search products: %v", err)
	}

	return products, nil
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
		query, query, query, "%"+query+"%",
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

	if err := db.Where("location ILIKE ?", "%"+location+"%").Limit(limit).Offset(offset).Find(&services).Error; err != nil {
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

// ExecuteGlobalSearch runs a full-text and fuzzy search across multiple models.
func ExecuteGlobalSearch(db *gorm.DB, query string, limit int, offset int, serviceID string) ([]*model.SearchResult, int, error) {
	var results []*model.SearchResult
	var total int

	// Clean the query to prevent SQL injection
	query = strings.TrimSpace(query)
	if query == "" {
		return results, 0, fmt.Errorf("search query cannot be empty")
	}

	// SQL for counting total results
	countSQL := `WITH
        gallery_results AS (
            SELECT COUNT(*) FROM gallery_professions
            WHERE service_id = ? AND (
                search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(COALESCE(title, '')), LOWER(?)) > 0.12 OR
                LOWER(COALESCE(title, '')) LIKE LOWER('%' || ? || '%') OR
                LOWER(COALESCE(description, '')) LIKE LOWER('%' || ? || '%')
            )
        ),
        policy_detail_results AS (
            SELECT COUNT(*) FROM policy_details pd
            JOIN policies p ON pd.policy_id = p.id::text
            WHERE p.service_id = ? AND (
                pd.search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(pd.title), LOWER(?)) > 0.12 OR
                similarity(LOWER(pd.content), LOWER(?)) > 0.12 OR
                LOWER(pd.title) LIKE LOWER('%' || ? || '%') OR
                LOWER(pd.content) LIKE LOWER('%' || ? || '%')
            )
        ),
        policy_results AS (
            SELECT COUNT(*) FROM policies
            WHERE service_id = ? AND (
                search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(name), LOWER(?)) > 0.12 OR
                similarity(LOWER(description), LOWER(?)) > 0.12 OR
                LOWER(name) LIKE LOWER('%' || ? || '%') OR
                LOWER(description) LIKE LOWER('%' || ? || '%')
            )
        ),
        amenity_results AS (
            SELECT COUNT(*) FROM amenities a
            JOIN price_cards pc ON a.price_card_id = pc.id::text
            WHERE pc.service_id = ? AND (
                a.search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(a.text), LOWER(?)) > 0.12 OR
                LOWER(a.text) LIKE LOWER('%' || ? || '%')
            )
        ),
        price_card_results AS (
            SELECT COUNT(*) FROM price_cards
            WHERE service_id = ? AND (
                search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(title), LOWER(?)) > 0.12 OR
                similarity(LOWER(description), LOWER(?)) > 0.12 OR
                LOWER(title) LIKE LOWER('%' || ? || '%') OR
                LOWER(description) LIKE LOWER('%' || ? || '%')
            )
        ),
        price_results AS (
            SELECT COUNT(*) FROM prices p
            JOIN price_cards pc ON p.price_card_id = pc.id::text
            WHERE pc.service_id = ? AND (
                p.search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(p.label), LOWER(?)) > 0.12 OR
                similarity(LOWER(p.value), LOWER(?)) > 0.12 OR
                LOWER(p.label) LIKE LOWER('%' || ? || '%') OR
                LOWER(p.value) LIKE LOWER('%' || ? || '%')
            )
        ),
        product_results AS (
            SELECT COUNT(*) FROM products
            WHERE vendor_id = ? AND state != 'INACTIVE' AND (
                search_vector @@ plainto_tsquery('english', ?) OR
                similarity(LOWER(COALESCE(name, '')), LOWER(?)) > 0.12 OR
                similarity(LOWER(COALESCE(description, '')), LOWER(?)) > 0.12 OR
                LOWER(COALESCE(name, '')) LIKE LOWER('%' || ? || '%') OR
                LOWER(COALESCE(description, '')) LIKE LOWER('%' || ? || '%') OR
                LOWER(COALESCE(price, '')) LIKE LOWER('%' || ? || '%') OR
                EXISTS (
                    SELECT 1 FROM unnest(categories) as c
                    WHERE LOWER(c) LIKE LOWER('%' || ? || '%')
                ) OR
                EXISTS (
                    SELECT 1 FROM unnest(items_type) as it
                    WHERE LOWER(it) LIKE LOWER('%' || ? || '%')
                )
            )
        )
    SELECT
        (SELECT * FROM gallery_results) +
        (SELECT * FROM policy_detail_results) +
        (SELECT * FROM policy_results) +
        (SELECT * FROM amenity_results) +
        (SELECT * FROM price_card_results) +
        (SELECT * FROM price_results) +
        (SELECT * FROM product_results) AS total`

	countParams := []interface{}{
		// gallery_professions
		serviceID, query, query, query, query,
		// policy_details
		serviceID, query, query, query, query, query,
		// policies
		serviceID, query, query, query, query, query,
		// amenities
		serviceID, query, query, query,
		// price_cards
		serviceID, query, query, query, query, query,
		// prices
		serviceID, query, query, query, query, query,
		// products
		serviceID, query, query, query, query, query, query, query, query,
	}

	row := db.Raw(countSQL, countParams...).Row()
	if err := row.Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %v", err)
	}

	// Main search query - now updated to include parent IDs as relationship IDs
	searchSQL := `WITH
        gallery_results AS (
            SELECT
                id::text,
                COALESCE(title, 'Untitled Gallery') AS title,
                description AS description,
                'GalleryProfession' AS model_type,
                NULL AS relationship_id, -- Pass NULL for GalleryProfession
                array_to_string(categories, ', ') AS additional_info,
                CASE 
                    WHEN array_length(image_urls, 1) > 0 THEN image_urls[1]
                    ELSE NULL
                END AS image_url,
                ts_rank_cd(search_vector, plainto_tsquery('english', ?)) +
                GREATEST(
                    similarity(LOWER(COALESCE(title, '')), LOWER(?)),
                    similarity(LOWER(COALESCE(description, '')), LOWER(?))
                ) * 5.0 AS search_score,
                created_at,
                updated_at
            FROM gallery_professions
            WHERE
                service_id = ? AND (
                    search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(COALESCE(title, '')), LOWER(?)) > 0.12 OR
                    LOWER(COALESCE(title, '')) LIKE LOWER('%' || ? || '%') OR
                    LOWER(COALESCE(description, '')) LIKE LOWER('%' || ? || '%')
                )
        ),
        policy_detail_results AS (
            SELECT
                pd.id::text,
                pd.title,
                pd.content AS description,
                'PolicyDetail' AS model_type,
                pd.policy_id AS relationship_id, -- Policy is the parent of PolicyDetail  
                array_to_string(pd.list_items, ', ') AS additional_info,
                NULL AS image_url,
                ts_rank_cd(pd.search_vector, plainto_tsquery('english', ?)) +
                GREATEST(
                    similarity(LOWER(pd.title), LOWER(?)),
                    similarity(LOWER(pd.content), LOWER(?))
                ) * 5.0 AS search_score,
                pd.created_at,
                pd.updated_at
            FROM policy_details pd
            JOIN policies p ON pd.policy_id = p.id::text
            WHERE
                p.service_id = ? AND (
                    pd.search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(pd.title), LOWER(?)) > 0.12 OR
                    similarity(LOWER(pd.content), LOWER(?)) > 0.12 OR
                    LOWER(pd.title) LIKE LOWER('%' || ? || '%') OR
                    LOWER(pd.content) LIKE LOWER('%' || ? || '%')
                )
        ),
        policy_results AS (
            SELECT
                id::text,
                name AS title,
                description,
                'Policy' AS model_type,
                id::text AS relationship_id, -- Pass its own ID for Policy
                NULL AS additional_info,
                NULL AS image_url,
                ts_rank_cd(search_vector, plainto_tsquery('english', ?)) +
                GREATEST(
                    similarity(LOWER(name), LOWER(?)),
                    similarity(LOWER(description), LOWER(?))
                ) * 5.0 AS search_score,
                created_at,
                updated_at
            FROM policies
            WHERE
                service_id = ? AND (
                    search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(name), LOWER(?)) > 0.12 OR
                    similarity(LOWER(description), LOWER(?)) > 0.12 OR
                    LOWER(name) LIKE LOWER('%' || ? || '%') OR
                    LOWER(description) LIKE LOWER('%' || ? || '%')
                )
        ),
        amenity_results AS (
            SELECT
                a.id::text,
                a.text AS title,
                NULL AS description,
                'Amenity' AS model_type,
                a.price_card_id AS relationship_id, -- PriceCard is the parent of Amenity
                NULL AS additional_info,
                NULL AS image_url,
                ts_rank_cd(a.search_vector, plainto_tsquery('english', ?)) +
                similarity(LOWER(a.text), LOWER(?)) * 5.0 AS search_score,
                a.created_at,
                a.updated_at
            FROM amenities a
            JOIN price_cards pc ON a.price_card_id = pc.id::text
            WHERE
                pc.service_id = ? AND (
                    a.search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(a.text), LOWER(?)) > 0.12 OR
                    LOWER(a.text) LIKE LOWER('%' || ? || '%')
                )
        ),
        price_card_results AS (
            SELECT
                id::text,
                title,
                description,
                'PriceCard' AS model_type,
                id::text AS relationship_id, -- Pass its own ID for PriceCard
                NULL AS additional_info,
                NULL AS image_url,
                ts_rank_cd(search_vector, plainto_tsquery('english', ?)) +
                GREATEST(
                    similarity(LOWER(title), LOWER(?)),
                    similarity(LOWER(description), LOWER(?))
                ) * 5.0 AS search_score,
                created_at,
                updated_at
            FROM price_cards
            WHERE
                service_id = ? AND (
                    search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(title), LOWER(?)) > 0.12 OR
                    similarity(LOWER(description), LOWER(?)) > 0.12 OR
                    LOWER(title) LIKE LOWER('%' || ? || '%') OR
                    LOWER(description) LIKE LOWER('%' || ? || '%')
                )
        ),
        price_results AS (
            SELECT
                p.id::text,
                p.label AS title,
                p.value AS description,
                'Price' AS model_type,
                p.price_card_id AS relationship_id, -- PriceCard is the parent of Price
                NULL AS additional_info,
                NULL AS image_url,
                ts_rank_cd(p.search_vector, plainto_tsquery('english', ?)) +
                GREATEST(
                    similarity(LOWER(p.label), LOWER(?)),
                    similarity(LOWER(p.value), LOWER(?))
                ) * 5.0 AS search_score,
                p.created_at,
                p.updated_at
            FROM prices p
            JOIN price_cards pc ON p.price_card_id = pc.id::text
            WHERE
                pc.service_id = ? AND (
                    p.search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(p.label), LOWER(?)) > 0.12 OR
                    similarity(LOWER(p.value), LOWER(?)) > 0.12 OR
                    LOWER(p.label) LIKE LOWER('%' || ? || '%') OR
                    LOWER(p.value) LIKE LOWER('%' || ? || '%')
                )
        ),
        product_results AS (
            SELECT
                id::text,
                COALESCE(name, 'Untitled Product') AS title,
                description,
                'Product' AS model_type,
                id::text AS relationship_id, -- Pass its own ID for Product
                CASE 
                    WHEN array_length(categories, 1) > 0 AND array_length(items_type, 1) > 0 THEN
                        'Categories: ' || array_to_string(categories, ', ') || ' | Types: ' || array_to_string(items_type, ', ')
                    WHEN array_length(categories, 1) > 0 THEN
                        'Categories: ' || array_to_string(categories, ', ')
                    WHEN array_length(items_type, 1) > 0 THEN
                        'Types: ' || array_to_string(items_type, ', ')
                    ELSE NULL
                END AS additional_info,
                CASE 
                    WHEN array_length(image_urls, 1) > 0 THEN image_urls[1]
                    ELSE NULL
                END AS image_url,
                ts_rank_cd(search_vector, plainto_tsquery('english', ?)) +
                GREATEST(
                    similarity(LOWER(COALESCE(name, '')), LOWER(?)),
                    similarity(LOWER(COALESCE(description, '')), LOWER(?)),
                    similarity(LOWER(COALESCE(price, '')), LOWER(?))
                ) * 5.0 +
                CASE 
                    WHEN LOWER(COALESCE(name, '')) = LOWER(?) THEN 10.0
                    WHEN LOWER(COALESCE(name, '')) LIKE LOWER(? || '%') THEN 8.0
                    WHEN LOWER(COALESCE(name, '')) LIKE LOWER('%' || ? || '%') THEN 6.0
                    WHEN EXISTS (
                        SELECT 1 FROM unnest(categories) as c
                        WHERE LOWER(c) = LOWER(?)
                    ) THEN 7.0
                    WHEN EXISTS (
                        SELECT 1 FROM unnest(items_type) as it
                        WHERE LOWER(it) = LOWER(?)
                    ) THEN 7.0
                    ELSE 0 
                END AS search_score,
                created_at,
                updated_at
            FROM products
            WHERE
                vendor_id = ? AND state != 'INACTIVE' AND (
                    search_vector @@ plainto_tsquery('english', ?) OR
                    similarity(LOWER(COALESCE(name, '')), LOWER(?)) > 0.12 OR
                    similarity(LOWER(COALESCE(description, '')), LOWER(?)) > 0.12 OR
                    LOWER(COALESCE(name, '')) LIKE LOWER('%' || ? || '%') OR
                    LOWER(COALESCE(description, '')) LIKE LOWER('%' || ? || '%') OR
                    LOWER(COALESCE(price, '')) LIKE LOWER('%' || ? || '%') OR
                    EXISTS (
                        SELECT 1 FROM unnest(categories) as c
                        WHERE LOWER(c) LIKE LOWER('%' || ? || '%')
                    ) OR
                    EXISTS (
                        SELECT 1 FROM unnest(items_type) as it
                        WHERE LOWER(it) LIKE LOWER('%' || ? || '%')
                    )
                )
        ),
        combined_results AS (
            SELECT * FROM gallery_results
            UNION ALL
            SELECT * FROM policy_detail_results
            UNION ALL
            SELECT * FROM policy_results
            UNION ALL
            SELECT * FROM amenity_results
            UNION ALL
            SELECT * FROM price_card_results
            UNION ALL
            SELECT * FROM price_results
            UNION ALL
            SELECT * FROM product_results
        )
    SELECT *
    FROM combined_results
    ORDER BY search_score DESC
    LIMIT ? OFFSET ?`

    searchParams := []interface{}{
        // gallery_professions
        query, query, query, serviceID, query, query, query, query,
        // policy_details
        query, query, query, serviceID, query, query, query, query, query,
        // policies
        query, query, query, serviceID, query, query, query, query, query,
        // amenities
        query, query, serviceID, query, query, query,
        // price_cards
        query, query, query, serviceID, query, query, query, query, query,
        // prices
        query, query, query, serviceID, query, query, query, query, query,
        // products
        query, query, query, query, query, query, query, query, query, serviceID, query, query, query, query, query, query, query, query,
        limit, offset,
    }

    rows, err := db.Raw(searchSQL, searchParams...).Rows()
    if err != nil {
        return nil, 0, fmt.Errorf("failed to execute search: %v", err)
    }
    defer rows.Close()

    for rows.Next() {
        var result model.SearchResult
        var description, relationshipID, additionalInfo, imageURL sql.NullString
        var score float64

        if err := rows.Scan(
            &result.ID,
            &result.Title,
            &description,
            &result.ModelType,
            &relationshipID,
            &additionalInfo,
            &imageURL,
            &score,
            &result.CreatedAt,
            &result.UpdatedAt,
        ); err != nil {
            return nil, 0, fmt.Errorf("failed to scan search result: %v", err)
        }

        if description.Valid {
            descValue := description.String
            result.Description = &descValue
        }
        if relationshipID.Valid {
            relIDValue := relationshipID.String
            result.RelationshipID = &relIDValue
        }
        if additionalInfo.Valid {
            infoValue := additionalInfo.String
            result.AdditionalInfo = &infoValue
        }
        if imageURL.Valid {
            urlValue := imageURL.String
            result.Imageurl = &urlValue
        }
        result.Score = &score
        results = append(results, &result)
    }

    return results, total, nil
}