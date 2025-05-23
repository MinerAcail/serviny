package helper

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lehxees/serviny/database/redis"
	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"

	// "github.com/lehxees/serviny/redis"
	rds "github.com/redis/go-redis/v9"
)

//--------------------------------------------------
// IsochroneCache - Core Redis Caching Implementation
//--------------------------------------------------

// IsochroneCache handles caching of isochrone results in Redis
type IsochroneCache struct {
	client *rds.Client
	db     *gorm.DB // Add DB for database operations

}

// NewIsochroneCache creates a new isochrone cache handler using the existing Redis client
func NewIsochroneCache() *IsochroneCache {
	return &IsochroneCache{
		client: redis.ConfigureRedis(),
		db:     nil, // Will be set separately or from resolver
	}
}

// SetDB sets the database connection
func (c *IsochroneCache) SetDB(db *gorm.DB) {
	c.db = db
}

// GenerateIsochroneKey creates a unique key for storing the isochrone result
func (c *IsochroneCache) GenerateIsochroneKey(input model.IsochroneInput) string {
	// Create a simplified version of the input to use as part of the key
	inputBytes, _ := json.Marshal(map[string]interface{}{
		"locations":     input.Locations,
		"range":         input.Range,
		"transportMode": input.TransportMode,
		"address":       input.Address,
	})

	// Use the hash of the input as part of the key
	return fmt.Sprintf("isochrone:%x", inputBytes)
}

// GetIsochroneResult retrieves an isochrone result from Redis
func (c *IsochroneCache) GetIsochroneResult(ctx context.Context, input model.IsochroneInput) (*model.IsochroneResult, error) {
	key := c.GenerateIsochroneKey(input)

	// Get from Redis
	resultBytes, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == rds.Nil {
			// Key does not exist
			fmt.Printf("No cached result found for key: %s\n", key)
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get isochrone result from Redis: %w", err)
	}

	// Unmarshal the result
	var result model.IsochroneResult
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal isochrone result: %w", err)
	}

	fmt.Printf("Retrieved cached isochrone result with key: %s\n", key)
	return &result, nil
}

// SaveIsochroneResult saves an isochrone result to Redis with expiration
func (c *IsochroneCache) SaveIsochroneResult(ctx context.Context, input model.IsochroneInput, result *model.IsochroneResult) error {
	key := c.GenerateIsochroneKey(input)

	// Marshal the result to JSON
	resultBytes, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("failed to marshal isochrone result: %w", err)
	}

	// Save to Redis with expiration (e.g., 24 hours)
	expiration := 24 * time.Hour
	if err := c.client.Set(ctx, key, resultBytes, expiration).Err(); err != nil {
		return fmt.Errorf("failed to save isochrone result to Redis: %w", err)
	}

	// If the result has an ID, create a secondary index for lookups by ID
	if result.ID != uuid.Nil {
		idKey := fmt.Sprintf("isochrone:id:%s", result.ID.String())
		if err := c.client.Set(ctx, idKey, key, expiration).Err(); err != nil {
			// Log the error but don't fail the operation
			fmt.Printf("Failed to create ID index: %v\n", err)
		}
	}

	// If a riderID is specified, create a rider-based index
	if result.RiderID != "" {
		riderKey := fmt.Sprintf("isochrone:rider:%s", result.RiderID)
		// Add this isochrone key to a set of isochrones for this rider
		if err := c.client.SAdd(ctx, riderKey, key).Err(); err != nil {
			fmt.Printf("Failed to create rider index: %v\n", err)
		}
		// Set expiration on the rider key
		if err := c.client.Expire(ctx, riderKey, expiration).Err(); err != nil {
			fmt.Printf("Failed to set expiration on rider index: %v\n", err)
		}
	}

	fmt.Printf("Cached isochrone result with key: %s\n", key)
	return nil
}

// GetIsochroneResultByID retrieves an isochrone result from Redis or DB using ID
func (c *IsochroneCache) GetIsochroneResultByID(ctx context.Context, id uuid.UUID) (*model.IsochroneResult, error) {
	// Try database if available
	if c.db != nil {
		var result model.IsochroneResult
		if err := c.db.First(&result, "id = ?", id).Error; err == nil {
			return &result, nil
		}
	}

	// Try Redis
	idKey := fmt.Sprintf("isochrone:id:%s", id.String())
	primaryKey, err := c.client.Get(ctx, idKey).Result()
	if err != nil {
		if err == rds.Nil {
			// ID not found
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get primary key for ID %s: %w", id.String(), err)
	}

	// Get the actual result using the primary key
	resultBytes, err := c.client.Get(ctx, primaryKey).Bytes()
	if err != nil {
		if err == rds.Nil {
			// Primary key not found
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get isochrone result for key %s: %w", primaryKey, err)
	}

	// Unmarshal the result
	var result model.IsochroneResult
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal isochrone result: %w", err)
	}

	fmt.Printf("Retrieved cached isochrone result with ID: %s\n", id.String())
	return &result, nil
}

// GetIsochroneResultsByRiderID retrieves all isochrone results for a specific rider
func (c *IsochroneCache) GetIsochroneResultsByRiderID(ctx context.Context, riderID string) ([]*model.IsochroneResult, error) {
	// Try database if available
	if c.db != nil {
		var results []*model.IsochroneResult
		if err := c.db.Where("rider_id = ?", riderID).Find(&results).Error; err == nil && len(results) > 0 {
			return results, nil
		}
	}

	// Try Redis
	riderKey := fmt.Sprintf("isochrone:rider:%s", riderID)
	keys, err := c.client.SMembers(ctx, riderKey).Result()
	if err != nil {
		if err == rds.Nil {
			return []*model.IsochroneResult{}, nil
		}
		return nil, fmt.Errorf("failed to get isochrone keys for rider %s: %w", riderID, err)
	}

	if len(keys) == 0 {
		return []*model.IsochroneResult{}, nil
	}

	// Fetch each isochrone result
	results := make([]*model.IsochroneResult, 0, len(keys))
	for _, key := range keys {
		resultBytes, err := c.client.Get(ctx, key).Bytes()
		if err != nil {
			if err == rds.Nil {
				continue
			}
			fmt.Printf("Error getting isochrone at key %s: %v\n", key, err)
			continue
		}

		var result model.IsochroneResult
		if err := json.Unmarshal(resultBytes, &result); err != nil {
			fmt.Printf("Error unmarshaling isochrone at key %s: %v\n", key, err)
			continue
		}

		results = append(results, &result)
	}

	return results, nil
}

// GetIsochroneResultsByRiderID retrieves all isochrone results for a specific rider
func (c *IsochroneCache) GetIsochroneResultsByVendorID(ctx context.Context, riderID string) ([]*model.IsochroneResult, error) {
	// Try database if available
	if c.db != nil {
		var results []*model.IsochroneResult
		if err := c.db.Where("vendor_id = ?", riderID).Find(&results).Error; err == nil && len(results) > 0 {
			return results, nil
		}
		return []*model.IsochroneResult{}, nil
	}
	return []*model.IsochroneResult{}, nil
}

// GetIsochroneResultByLocationAndID retrieves an isochrone result by location and ID
func (c *IsochroneCache) GetIsochroneResultByLocationAndID(ctx context.Context, location []float64, id string) (*model.IsochroneResult, error) {
	// Parse the ID from string
	// isochroneID, err := uuid.Parse(id)
	// if err != nil {
	// 	return nil, fmt.Errorf("invalid isochrone ID: %w", err)
	// }

	// // First try to get by ID which is faster
	// result, err := c.GetIsochroneResultByID(ctx, isochroneID)
	// if err != nil {
	// 	return nil, err
	// }
	// if result != nil {
	// 	// Verify the location matches
	// 	if len(result.Locations) > 0 && len(result.Locations[0]) == len(location) {
	// 		// Simple check for location match (could be improved for more precision)
	// 		match := true
	// 		for i := 0; i < len(location); i++ {
	// 			if result.Locations[0][i] != location[i] {
	// 				match = false
	// 				break
	// 			}
	// 		}
	// 		if match {
	// 			return result, nil
	// 		}
	// 	}
	// }

	// If ID lookup failed or location didn't match, return nil
	return nil, nil
}

// SaveIsochroneToDB saves an isochrone result to the database
func (c *IsochroneCache) SaveIsochroneToDB(result *model.IsochroneResult) error {
	if c.db == nil {
		return fmt.Errorf("database connection not set")
	}

	// Set timestamps if not already set
	now := time.Now().Format(time.RFC3339)
	if result.CreatedAt == "" {
		result.CreatedAt = now
	}
	result.UpdatedAt = now

	// Set status if not already set
	if result.Status == "" {
		result.Status = "COMPLETED"
	}

	// Check if already exists
	var count int64
	if err := c.db.Model(&model.IsochroneResult{}).Where("id = ?", result.ID).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to check if isochrone exists: %w", err)
	}

	if count > 0 {
		// Update existing
		if err := c.db.Save(result).Error; err != nil {
			return fmt.Errorf("failed to update isochrone in database: %w", err)
		}
	} else {
		// Create new
		if err := c.db.Create(result).Error; err != nil {
			return fmt.Errorf("failed to save isochrone to database: %w", err)
		}
	}

	fmt.Printf("Saved isochrone with ID %s to database\n", result.ID.String())
	return nil
}

// GetIsochroneResultByUUID retrieves an isochrone result from Redis using UUID
func (c *IsochroneCache) GetIsochroneResultByUUID(ctx context.Context, uuid string) (*model.IsochroneResult, error) {
	// First get the primary key from the UUID index
	uuidKey := fmt.Sprintf("isochrone:uuid:%s", uuid)
	primaryKey, err := c.client.Get(ctx, uuidKey).Result()
	if err != nil {
		if err == rds.Nil {
			// UUID not found
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get primary key for UUID %s: %w", uuid, err)
	}

	// Now get the actual result using the primary key
	resultBytes, err := c.client.Get(ctx, primaryKey).Bytes()
	if err != nil {
		if err == rds.Nil {
			// Primary key not found (shouldn't happen if UUID index exists)
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get isochrone result for key %s: %w", primaryKey, err)
	}

	// Unmarshal the result
	var result model.IsochroneResult
	if err := json.Unmarshal(resultBytes, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal isochrone result: %w", err)
	}

	fmt.Printf("Retrieved cached isochrone result with UUID: %s\n", uuid)
	return &result, nil
}

// GetIsochroneResultByLocationAndUUID retrieves an isochrone result by location and UUID
func (c *IsochroneCache) GetIsochroneResultByLocationAndUUID(ctx context.Context, location []float64, uuid string) (*model.IsochroneResult, error) {
	// First try to get by UUID which is faster
	// result, err := c.GetIsochroneResultByUUID(ctx, uuid)
	// if err != nil {
	// 	return nil, err
	// }
	// if result != nil {
	// 	// Verify the location matches
	// 	if len(result.Locations) > 0 && len(result.Locations[0]) == len(location) {
	// 		// Simple check for location match (could be improved for more precision)
	// 		match := true
	// 		for i := 0; i < len(location); i++ {
	// 			if result.Locations[0][i] != location[i] {
	// 				match = false
	// 				break
	// 			}
	// 		}
	// 		if match {
	// 			return result, nil
	// 		}
	// 	}
	// }

	// If UUID lookup failed or location didn't match, return nil
	return nil, nil
}

// DeleteIsochroneResult deletes an isochrone result from Redis
func (c *IsochroneCache) DeleteIsochroneResult(ctx context.Context, input model.IsochroneInput) error {
	key := c.GenerateIsochroneKey(input)

	// Delete from Redis
	if err := c.client.Del(ctx, key).Err(); err != nil {
		return fmt.Errorf("failed to delete isochrone result from Redis: %w", err)
	}

	fmt.Printf("Deleted cached isochrone result with key: %s\n", key)
	return nil
}

// ClearAllIsochrones clears all isochrone entries from Redis
func (c *IsochroneCache) ClearAllIsochrones(ctx context.Context) error {
	pattern := "isochrone:*"

	// Use SCAN to find all matching keys
	iter := c.client.Scan(ctx, 0, pattern, 100).Iterator()
	var keysToDelete []string

	for iter.Next(ctx) {
		keysToDelete = append(keysToDelete, iter.Val())
	}

	if err := iter.Err(); err != nil {
		return fmt.Errorf("failed to scan for isochrone keys: %w", err)
	}

	// Delete all found keys
	if len(keysToDelete) > 0 {
		if err := c.client.Del(ctx, keysToDelete...).Err(); err != nil {
			return fmt.Errorf("failed to delete isochrone keys: %w", err)
		}
		fmt.Printf("Cleared %d isochrone entries from Redis\n", len(keysToDelete))
	} else {
		fmt.Println("No isochrone entries found to clear")
	}

	return nil
}

//--------------------------------------------------
// IsochroneCacheManager - Advanced Cache Management
//--------------------------------------------------

// IsochroneCacheManager provides management functions for the isochrone cache
type IsochroneCacheManager struct {
	cache *IsochroneCache
}

// NewIsochroneCacheManager creates a new isochrone cache manager
func NewIsochroneCacheManager() *IsochroneCacheManager {
	return &IsochroneCacheManager{
		cache: NewIsochroneCache(),
	}
}

// PurgeCache removes all isochrone entries from the cache
func (m *IsochroneCacheManager) PurgeCache() error {
	ctx := context.Background()
	return m.cache.ClearAllIsochrones(ctx)
}

// InvalidateEntry removes a specific isochrone entry from the cache
func (m *IsochroneCacheManager) InvalidateEntry(input model.IsochroneInput) error {
	ctx := context.Background()
	return m.cache.DeleteIsochroneResult(ctx, input)
}

// GetStats returns statistics about the isochrone cache
func (m *IsochroneCacheManager) GetStats() (map[string]interface{}, error) {
	ctx := context.Background()
	client := m.cache.client

	// Get all isochrone keys
	pattern := "isochrone:*"
	iter := client.Scan(ctx, 0, pattern, 100).Iterator()
	var keys []string

	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}

	if err := iter.Err(); err != nil {
		return nil, fmt.Errorf("failed to scan for isochrone keys: %w", err)
	}

	// Get TTL for each key
	expirations := make(map[string]time.Duration)
	for _, key := range keys {
		ttl, err := client.TTL(ctx, key).Result()
		if err != nil {
			continue
		}
		expirations[key] = ttl
	}

	// Prepare stats
	stats := map[string]interface{}{
		"total_entries": len(keys),
		"entries":       expirations,
	}

	return stats, nil
}

// RefreshEntry extends the TTL of a specific isochrone entry
func (m *IsochroneCacheManager) RefreshEntry(input model.IsochroneInput, newTTL time.Duration) error {
	ctx := context.Background()
	key := m.cache.GenerateIsochroneKey(input)

	// Check if key exists
	exists, err := m.cache.client.Exists(ctx, key).Result()
	if err != nil {
		return fmt.Errorf("failed to check if key exists: %w", err)
	}

	if exists == 0 {
		return fmt.Errorf("key does not exist")
	}

	// Update expiration
	if err := m.cache.client.Expire(ctx, key, newTTL).Err(); err != nil {
		return fmt.Errorf("failed to update TTL: %w", err)
	}

	fmt.Printf("Refreshed TTL for key %s to %v\n", key, newTTL)
	return nil
}

//--------------------------------------------------
// GraphQL Resolver Integration
//--------------------------------------------------

// GetCachedOrGenerateIsochrone first checks the cache, then generates if needed
func GetCachedOrGenerateIsochrone(ctx context.Context, input model.IsochroneInput, riderIDStr string) (*model.IsochroneResult, error) {
	// Initialize cache
	cache := NewIsochroneCache()

	// Try to get cached result
	cachedResult, err := cache.GetIsochroneResult(ctx, input)
	if err != nil {
		// Log error but continue to generate
		fmt.Printf("Error retrieving from cache: %v\n", err)
	} else if cachedResult != nil {
		// Return cached result if available
		return cachedResult, nil
	}

	// Generate a new ID
	newID := uuid.New()

	// Generate fresh result
	var result *model.IsochroneResult
	var genErr error

	// Check if we need regular or extended isochrones
	needsExtendedIsochrones := false
	for _, rangeVal := range input.Range {
		if rangeVal > MAX_ORS_TIME_SECONDS {
			needsExtendedIsochrones = true
			break
		}
	}

	// Generate appropriate isochrone
	if !needsExtendedIsochrones {
		result, genErr = GenerateRegularIsochrone(input)
	} else {
		result, genErr = GenerateExtendedIsochrone(input)
	}

	if genErr != nil {
		return nil, genErr
	}
	// Inject metadata (id, price) into GeoJSON features
	geoJSONWithMeta, err := injectMetaDataIntoGeoJSON(result.GeoJSON, input.MetaData)
	if err != nil {
		return nil, fmt.Errorf("failed to inject metadata into GeoJSON: %w", err)
	}
	result.GeoJSON = geoJSONWithMeta
	// Set all required fields on the result
	result.ID = newID
	// todo
	// Flatten [][]float64 to []float64 for pq.Float64Array
	var flatLocations []float64
	for _, loc := range input.Locations {
		flatLocations = append(flatLocations, loc...)
	}
	result.Locations = flatLocations
	result.Range = input.Range
	result.TransportMode = input.TransportMode
	result.Address = input.Address
	result.VendorID = input.VendorID
	result.CreatedAt = time.Now().Format(time.RFC3339)
	result.UpdatedAt = result.CreatedAt
	result.UpdatedAt = result.CreatedAt
	result.Status = "COMPLETED"

	// Set riderID if provided
	if riderIDStr == "" {
		return nil, fmt.Errorf("riderID is required")
	}
	result.RiderID = riderIDStr

	// If db connection available, save to database
	if cache.db != nil {
		if err := cache.SaveIsochroneToDB(result); err != nil {
			// Log error but don't fail the request
			fmt.Printf("Error saving isochrone to database: %v\n", err)
		}
	}

	// Cache the newly generated result
	if err := cache.SaveIsochroneResult(ctx, input, result); err != nil {
		// Log error but don't fail the request
		fmt.Printf("Error caching isochrone: %v\n", err)
	}

	return result, nil
}

// GetIsochroneResult looks up an isochrone by location and UUID

// GetIsochroneResult looks up an isochrone by location and ID
func GetIsochroneResult(ctx context.Context, location []float64, id string) (*model.IsochroneResult, error) {
	// Initialize cache
	cache := NewIsochroneCache()

	// Try to get by location and ID
	result, err := cache.GetIsochroneResultByLocationAndID(ctx, location, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get isochrone result: %w", err)
	}

	if result == nil {
		return nil, fmt.Errorf("no isochrone found with location and ID: %s", id)
	}

	return result, nil
}

// GetAllIsochroneResults retrieves all isochrone results from Redis

// GetAllIsochroneResults retrieves all isochrone results from Redis and DB
func (c *IsochroneCache) GetAllIsochroneResults(ctx context.Context) ([]*model.IsochroneResult, error) {
	// Try database first if available
	if c.db != nil {
		var results []*model.IsochroneResult
		if err := c.db.Find(&results).Error; err == nil && len(results) > 0 {
			return results, nil
		}
	}

	// Get all isochrone keys (excluding index keys)
	pattern := "isochrone:*"
	iter := c.client.Scan(ctx, 0, pattern, 100).Iterator()
	var keys []string

	for iter.Next(ctx) {
		key := iter.Val()
		// Skip index keys
		if !strings.HasPrefix(key, "isochrone:id:") &&
			!strings.HasPrefix(key, "isochrone:rider:") {
			keys = append(keys, key)
		}
	}

	if err := iter.Err(); err != nil {
		return nil, fmt.Errorf("failed to scan for isochrone keys: %w", err)
	}

	// If no keys found, return empty slice
	if len(keys) == 0 {
		return []*model.IsochroneResult{}, nil
	}

	// Retrieve all isochrones
	var results []*model.IsochroneResult

	for _, key := range keys {
		resultBytes, err := c.client.Get(ctx, key).Bytes()
		if err != nil {
			if err == rds.Nil {
				// Skip if key doesn't exist (might have expired)
				continue
			}
			// Log the error but continue with other keys
			fmt.Printf("Error retrieving isochrone with key %s: %v\n", key, err)
			continue
		}

		// Unmarshal the result
		var result model.IsochroneResult
		if err := json.Unmarshal(resultBytes, &result); err != nil {
			// Log the error but continue with other keys
			fmt.Printf("Error unmarshaling isochrone with key %s: %v\n", key, err)
			continue
		}

		results = append(results, &result)
	}

	fmt.Printf("Retrieved %d isochrone results\n", len(results))
	return results, nil
}

// --------------------------------------------------
// GraphQL Mutation Functions
// --------------------------------------------------
// HandleCacheManagement with support for addresses
// Fixed HandleCacheManagement function with correct types
func HandleCacheManagement(ctx context.Context, input model.CacheManagementInput) (*model.CacheStats, error) {
	manager := NewIsochroneCacheManager()
	var err error
	var stats map[string]interface{}

	switch input.Action {
	case "purge":
		if err = manager.PurgeCache(); err != nil {
			return nil, fmt.Errorf("failed to purge cache: %w", err)
		}

	// case "refresh":
	// 	if len(input.Locations) > 0 && len(input.Ranges) > 0 && len(input.TransportModes) > 0 && input.TTL != nil {
	// 		for _, loc := range input.Locations {
	// 			for _, r := range input.Ranges {
	// 				for i, mode := range input.TransportModes {
	// 					modeCopy := mode // Create a copy for pointer

	// 					// Handle address if available
	// 					var addressPtr *string
	// 					arrinput := *input.Addresses
	// 					if input.Addresses != nil && i < len(arrinput) {
	// 						addressCopy := arrinput[i]
	// 						addressPtr = addressCopy
	// 					}

	// 					isoInput := model.IsochroneInput{
	// 						Locations:     [][]float64{loc},
	// 						Range:         []int32{r},
	// 						TransportMode: &modeCopy,
	// 						Address:       addressPtr,
	// 					}

	// 					if err := manager.RefreshEntry(isoInput, time.Duration(*input.TTL)*time.Second); err != nil {
	// 						fmt.Printf("Error refreshing entry: %v\n", err)
	// 						// Continue with other entries
	// 					}
	// 				}
	// 			}
	// 		}
	// 	} else {
	// 		return nil, fmt.Errorf("refresh requires locations, ranges, transportModes, and ttl")
	// 	}

	case "prewarm":
		if len(input.Locations) > 0 && len(input.Ranges) > 0 && len(input.TransportModes) > 0 {
			// Create a proper input for the PrewarmCache function
			if err := manager.PrewarmCache(input.Locations, input.Ranges, input.TransportModes); err != nil {
				return nil, fmt.Errorf("failed to prewarm cache: %w", err)
			}
		} else {
			return nil, fmt.Errorf("prewarm requires locations, ranges, and transportModes")
		}
	case "stats":
		// Just get stats, no action needed
	default:
		return nil, fmt.Errorf("unknown action: %s", input.Action)
	}

	// Get latest stats
	stats, err = manager.GetStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get cache stats: %w", err)
	}

	// Convert to CacheStats model
	result := &model.CacheStats{
		TotalEntries: stats["total_entries"].(int32),
		Entries:      make([]*model.CacheEntry, 0), // Fixed: Use slice of pointers []*model.CacheEntry
	}

	// Process entries
	if entriesMap, ok := stats["entries"].(map[string]time.Duration); ok {
		for key, ttl := range entriesMap {
			// Fixed: Convert to int32 and create a pointer to CacheEntry
			ttlSeconds := int32(ttl.Seconds()) // Convert to int32
			entry := &model.CacheEntry{        // Create a pointer
				Key: key,
				TTL: ttlSeconds,
			}
			result.Entries = append(result.Entries, entry)
		}
	}

	return result, nil
}

// Update PrewarmCache to handle Address field
func (m *IsochroneCacheManager) PrewarmCache(commonLocations [][]float64, commonRanges []int32, transportModes []string) error {
	ctx := context.Background()

	// Check if cache already contains the entries
	count := 0
	for _, location := range commonLocations {
		for _, rangeVal := range commonRanges {
			for _, mode := range transportModes {
				modeCopy := mode // Create a copy for pointer
				input := model.IsochroneInput{
					Locations:     [][]float64{location},
					Range:         []int32{rangeVal},
					TransportMode: &modeCopy,
					// Address is optional and not part of the prewarming
				}

				// Check if already cached
				result, err := m.cache.GetIsochroneResult(ctx, input)
				if err != nil || result == nil {
					// Not cached, generate
					var result *model.IsochroneResult
					var err error

					if rangeVal <= MAX_ORS_TIME_SECONDS {
						result, err = GenerateRegularIsochrone(input)
					} else {
						result, err = GenerateExtendedIsochrone(input)
					}

					if err != nil {
						fmt.Printf("Error generating isochrone for prewarm: %v\n", err)
						continue
					}

					// Ensure all fields are properly set on the result
					result.Range = input.Range
					result.TransportMode = input.TransportMode
					result.Address = input.Address

					// Cache the result
					if err := m.cache.SaveIsochroneResult(ctx, input, result); err != nil {
						fmt.Printf("Error caching isochrone for prewarm: %v\n", err)
						continue
					}

					count++
				}
			}
		}
	}

	fmt.Printf("Prewarmed cache with %d new entries\n", count)
	return nil
}
func injectMetaDataIntoGeoJSON(geoJSON []byte, metaData []*model.ZoneMetaDataInput) ([]byte, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(geoJSON, &data); err != nil {
		return nil, err
	}

	features, ok := data["features"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("GeoJSON missing features array")
	}

	for i, feature := range features {
		featureMap, ok := feature.(map[string]interface{})
		if !ok {
			continue
		}

		props, ok := featureMap["properties"].(map[string]interface{})
		if !ok {
			props = make(map[string]interface{})
		}

		// Assign ID as string uuid
		props["id"] = uuid.New().String()

		// Assign price if provided (metaData slice might be shorter or nil)
		if i < len(metaData) {
			props["price"] = metaData[i].Price
		} else {
			props["price"] = nil // or 0, or omit if you want
		}

		featureMap["properties"] = props
		features[i] = featureMap
	}

	data["features"] = features

	return json.Marshal(data)
}
