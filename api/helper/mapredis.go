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
	"github.com/lib/pq"
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
	// result.UpdatedAt = result.CreatedAt
	result.Status = "COMPLETED"

	// Set riderID if provided
	if riderIDStr == "" {
		return nil, fmt.Errorf("riderID is required")
	}
	result.RiderID = riderIDStr

	if len(input.RiderRangeIds) > 0 {
		idinputs := make([]string, len(input.RiderRangeIds))
		for i, id := range input.RiderRangeIds {
			if id != nil {
				idinputs[i] = *id
			}
		}
		result.RiderRangeIDs = pq.StringArray(idinputs)
	}
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

// Helper function to convert distance to time (reused from previous implementation)
func ConvertDistanceToTime(distanceKm float64, transportMode *string) int32 {
	// Approximate speeds (km/h)
	var speed float64

	if transportMode != nil {
		switch *transportMode {
		case "walking":
			speed = 5.0
		case "bike":
			speed = 15.0
		case "motorbike":
			speed = 40.0
		case "car":
			speed = 50.0
		default:
			speed = 40.0 // Default motorbike speed
		}
	} else {
		speed = 40.0 // Default motorbike speed
	}

	// Convert to seconds
	timeHours := distanceKm / speed
	timeSeconds := timeHours * 3600

	return int32(timeSeconds)
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

	// Fix: Properly assign zone number from metadata, with correct fallback
		if i < len(metaData) && metaData[i] != nil && metaData[i].ZoneNumber != nil {
			props["zone"] = *metaData[i].ZoneNumber
		} else {
			// Fallback should be 0 for first zone, then increment
			props["zone"] = i
		}


		// Assign price if provided (metaData slice might be shorter or nil)
		if i < len(metaData) {
			props["price"] = metaData[i].Price
			if metaData[i].RiderRangeID != nil {
				props["rider_range_id"] = *metaData[i].RiderRangeID
			}
			if metaData[i].Distance != nil {
				props["distance"] = *metaData[i].Distance
			}
		} else {
			props["price"] = nil // or 0, or omit if you want
		}
		// Add group index for multi-range isochrones
		if groupIndex, exists := props["group_index"]; exists {
			props["group_index"] = groupIndex
		} else {
			props["group_index"] = i
		}
		featureMap["properties"] = props
		features[i] = featureMap
	}

	data["features"] = features

	return json.Marshal(data)
}

// updateGeoJSONWithRangeData updates the GeoJSON features with new range data
func UpdateGeoJSONWithRangeData(geoJSON []byte, rangeID string, updatedRange model.RiderRange) ([]byte, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(geoJSON, &data); err != nil {
		return nil, err
	}

	features, ok := data["features"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("GeoJSON missing features array")
	}

	// Update the feature that corresponds to this range
	for i, feature := range features {
		featureMap, ok := feature.(map[string]interface{})
		if !ok {
			continue
		}

		props, ok := featureMap["properties"].(map[string]interface{})
		if !ok {
			continue
		}

		// Check if this feature corresponds to our range
		if riderRangeIDVal, exists := props["rider_range_id"]; exists {
			if riderRangeID, ok := riderRangeIDVal.(string); ok && riderRangeID == rangeID {
				// Update the properties with new range data
				props["price"] = updatedRange.Price
				props["distance"] = updatedRange.EndKm
				featureMap["properties"] = props
				features[i] = featureMap
				break
			}
		}
	}

	data["features"] = features
	return json.Marshal(data)
}

// addRangeToGeoJSON generates new isochrone geometry for the updated range and adds it to GeoJSON
func (r *IsochroneCache) AddRangeToGeoJSON(geoJSON []byte, rangeID string, metadata *model.ZoneMetaDataInput, updatedRange model.RiderRange) ([]byte, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(geoJSON, &data); err != nil {
		return nil, err
	}

	features, ok := data["features"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("GeoJSON missing features array")
	}

	// Get service coordinates for the range generation
	var service model.Service
	if err := r.db.First(&service, "id = ?", updatedRange.RiderID).Error; err != nil {
		return nil, fmt.Errorf("service not found: %w", err)
	}

	// Generate new isochrone geometry for the updated range
	defaultTransportMode := "driving-car"
	timeRange := ConvertDistanceToTime(updatedRange.EndKm, &defaultTransportMode)

	// Create input for generating the new isochrone geometry
	rangeInput := model.IsochroneInput{
		Locations:     [][]float64{service.Coordinates},
		Range:         []int32{timeRange},
		TransportMode: &defaultTransportMode,
	}

	// Generate the isochrone for this specific range
	var newFeatureGeometry map[string]interface{}

	// Check if we need regular or extended isochrone
	if timeRange <= int32(MAX_ORS_TIME_SECONDS) {
		// Use regular isochrone generation
		result, err := GenerateRegularIsochrone(rangeInput)
		if err != nil {
			return nil, fmt.Errorf("failed to generate regular isochrone for updated range: %w", err)
		}

		// Parse the generated GeoJSON to extract the geometry
		var generatedData map[string]interface{}
		if err := json.Unmarshal(result.GeoJSON, &generatedData); err != nil {
			return nil, fmt.Errorf("failed to parse generated GeoJSON: %w", err)
		}

		generatedFeatures, ok := generatedData["features"].([]interface{})
		if !ok || len(generatedFeatures) == 0 {
			return nil, fmt.Errorf("invalid generated GeoJSON format")
		}

		// Extract the geometry from the first (and only) feature
		if firstFeature, ok := generatedFeatures[0].(map[string]interface{}); ok {
			if geometry, ok := firstFeature["geometry"].(map[string]interface{}); ok {
				newFeatureGeometry = geometry
			}
		}
	} else {
		// Use extended isochrone generation
		extendedFeature, err := generateChainedIsochrone(rangeInput.Locations, timeRange, "driving-car")
		if err != nil {
			return nil, fmt.Errorf("failed to generate extended isochrone for updated range: %w", err)
		}

		if geometry, ok := extendedFeature["geometry"].(map[string]interface{}); ok {
			newFeatureGeometry = geometry
		}
	}

	if newFeatureGeometry == nil {
		return nil, fmt.Errorf("failed to extract geometry from generated isochrone")
	}

	// Create a new feature with the generated geometry and updated metadata
	newFeature := map[string]interface{}{
		"type": "Feature",
		"properties": map[string]interface{}{
			"id":             uuid.New().String(),
			"zone":           len(features), // Will be re-indexed later
			"group_index":    len(features),
			"price":          metadata.Price,
			"rider_range_id": rangeID,
			"distance":       *metadata.Distance,
		},
		"geometry": newFeatureGeometry, // Use the actual generated geometry
	}

	// Add the new feature and re-index all features
	features = append(features, newFeature)

	// Re-index all features to maintain proper ordering
	for i, feature := range features {
		if featureMap, ok := feature.(map[string]interface{}); ok {
			if props, ok := featureMap["properties"].(map[string]interface{}); ok {
				props["zone"] = i
				props["group_index"] = i
				featureMap["properties"] = props
				features[i] = featureMap
			}
		}
	}

	data["features"] = features
	return json.Marshal(data)
}

// RemoveRangeFromIsochroneData finds isochrones containing the deleted range and removes that range data
func (r *IsochroneCache) RemoveRangeFromIsochroneData(ctx context.Context, riderID string, rangeID string) error {
	// Find existing isochrones for this rider that contain the deleted range
	var existingIsochrones []model.IsochroneResult
	query := `
		SELECT i.* FROM isochrone_results i 
		INNER JOIN isochrone_rider_range_links l ON i.id = l.isochrone_id::uuid 
		WHERE i.rider_id = ? AND l.rider_range_id = ?
	`

	if err := r.db.Raw(query, riderID, rangeID).Scan(&existingIsochrones).Error; err != nil {
		return fmt.Errorf("failed to find isochrones containing range %s: %w", rangeID, err)
	}

	for _, isochrone := range existingIsochrones {
		// Remove the range data from the isochrone's GeoJSON
		updatedGeoJSON, err := r.RemoveRangeFromGeoJSON(isochrone.GeoJSON, rangeID)
		if err != nil {
			fmt.Printf("Error removing range from GeoJSON for isochrone %s: %v\n", isochrone.ID.String(), err)
			continue
		}

		// Update the isochrone in the database
		isochrone.GeoJSON = updatedGeoJSON
		isochrone.UpdatedAt = time.Now().Format(time.RFC3339)

		// Update the RiderRangeIDs array to remove the deleted range
		updatedRangeIDs := make([]string, 0)
		for _, existingRangeID := range isochrone.RiderRangeIDs {
			if existingRangeID != rangeID {
				updatedRangeIDs = append(updatedRangeIDs, existingRangeID)
			}
		}
		isochrone.RiderRangeIDs = pq.StringArray(updatedRangeIDs)

		if err := r.db.Save(&isochrone).Error; err != nil {
			fmt.Printf("Error saving updated isochrone %s after range removal: %v\n", isochrone.ID.String(), err)
			continue
		}

		// Remove the junction table link
		if err := r.db.Delete(&model.IsochroneRiderRangeLink{}, "isochrone_id = ? AND rider_range_id = ?", isochrone.ID.String(), rangeID).Error; err != nil {
			fmt.Printf("Error removing junction table link for isochrone %s and range %s: %v\n", isochrone.ID.String(), rangeID, err)
		}

		// Invalidate cache for this specific isochrone
		cache := NewIsochroneCache()
		cache.SetDB(r.db)
		if err := r.InvalidateIsochroneByID(isochrone.ID.String()); err != nil {
			fmt.Printf("Error invalidating cache for isochrone %s: %v\n", isochrone.ID.String(), err)
		}

		fmt.Printf("Removed range %s data from isochrone %s\n", rangeID, isochrone.ID.String())
	}

	return nil
}

// removeRangeFromGeoJSON removes the feature corresponding to the deleted range from GeoJSON
func (r *IsochroneCache) RemoveRangeFromGeoJSON(geoJSON []byte, rangeID string) ([]byte, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(geoJSON, &data); err != nil {
		return nil, err
	}

	features, ok := data["features"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("GeoJSON missing features array")
	}

	// Filter out the feature that corresponds to the deleted range
	updatedFeatures := make([]interface{}, 0)
	for _, feature := range features {
		featureMap, ok := feature.(map[string]interface{})
		if !ok {
			updatedFeatures = append(updatedFeatures, feature)
			continue
		}

		props, ok := featureMap["properties"].(map[string]interface{})
		if !ok {
			updatedFeatures = append(updatedFeatures, feature)
			continue
		}

		// Check if this feature corresponds to our deleted range
		if riderRangeIDVal, exists := props["rider_range_id"]; exists {
			if riderRangeID, ok := riderRangeIDVal.(string); ok && riderRangeID == rangeID {
				// Skip this feature (don't add it to updatedFeatures)
				fmt.Printf("Removing feature for range %s from GeoJSON\n", rangeID)
				continue
			}
		}

		// Keep this feature
		updatedFeatures = append(updatedFeatures, feature)
	}

	// Update zone indices to maintain proper ordering
	for i, feature := range updatedFeatures {
		if featureMap, ok := feature.(map[string]interface{}); ok {
			if props, ok := featureMap["properties"].(map[string]interface{}); ok {
				props["zone"] = i
				props["group_index"] = i
				featureMap["properties"] = props
				updatedFeatures[i] = featureMap
			}
		}
	}

	data["features"] = updatedFeatures
	return json.Marshal(data)
}

// Helper function to inject rider range metadata into GeoJSON
func InjectRiderRangeMetadata(result *model.IsochroneResult, ranges []*model.RiderRange) error {
	// Parse the existing GeoJSON
	var geoData map[string]interface{}
	if err := json.Unmarshal(result.GeoJSON, &geoData); err != nil {
		return fmt.Errorf("failed to unmarshal GeoJSON: %w", err)
	}

	features, ok := geoData["features"].([]interface{})
	if !ok {
		return fmt.Errorf("invalid GeoJSON format: no features array")
	}

	// Inject rider range information into each feature
	for i, feature := range features {
		if i >= len(ranges) {
			break // Safety check
		}

		featureMap, ok := feature.(map[string]interface{})
		if !ok {
			continue
		}

		properties, ok := featureMap["properties"].(map[string]interface{})
		if !ok {
			properties = make(map[string]interface{})
			featureMap["properties"] = properties
		}

		// Add rider range information
		riderRange := ranges[i]
		properties["rider_range_id"] = riderRange.ID.String()
		properties["price"] = riderRange.Price
		properties["start_km"] = riderRange.StartKm
		properties["end_km"] = riderRange.EndKm
		properties["distance"] = riderRange.EndKm // Use end_km as the distance for this zone
		properties["zone_index"] = i
	}

	// Marshal back to JSON
	updatedGeoJSON, err := json.Marshal(geoData)
	if err != nil {
		return fmt.Errorf("failed to marshal updated GeoJSON: %w", err)
	}

	result.GeoJSON = updatedGeoJSON
	return nil
}
func (c *IsochroneCache) GetNextZoneNumberForRider(riderID string) (int32, error) {
	// Check if DB connection is available
	if c.db == nil {
		return 0, fmt.Errorf("database connection not available")
	}

	var count int64
	if err := c.db.Model(&model.IsochroneResult{}).Where("vendor_id = ?", riderID).Count(&count); err != nil {
		return 0, fmt.Errorf("failed to count existing isochrones: %w", err)
	}

	return int32(count), nil
}
// invalidateRiderIsochrones removes all isochrones and their cache entries for a specific rider
func (r *IsochroneCache) InvalidateRiderIsochrones(riderID string) error {
	// Get all isochrones for this rider
	var isochrones []model.IsochroneResult
	if err := r.db.Find(&isochrones, "rider_id = ?", riderID).Error; err != nil {
		return fmt.Errorf("failed to find isochrones for rider: %w", err)
	}

	// Initialize cache for invalidation
	cache := NewIsochroneCache()
	cache.SetDB(r.db)

	// Delete each isochrone and its cache
	for _, isochrone := range isochrones {
		// Delete junction table entries
		if err := r.db.Delete(&model.IsochroneRiderRangeLink{}, "isochrone_id = ?", isochrone.ID.String()).Error; err != nil {
			fmt.Printf("Error deleting junction table entries for isochrone %s: %v\n", isochrone.ID.String(), err)
		}

		// Delete from cache if possible
		if err := cache.InvalidateIsochrone(context.Background(), isochrone.ID.String()); err != nil {
			fmt.Printf("Error invalidating cache for isochrone %s: %v\n", isochrone.ID.String(), err)
		}

		// Delete from database
		if err := r.db.Delete(&isochrone).Error; err != nil {
			fmt.Printf("Error deleting isochrone %s from database: %v\n", isochrone.ID.String(), err)
		}
	}

	fmt.Printf("Invalidated %d isochrones for rider %s\n", len(isochrones), riderID)
	return nil
}

// Helper method to invalidate specific isochrone by ID (if needed elsewhere)
func (r *IsochroneCache) InvalidateIsochroneByID(isochroneID string) error {
	// Delete junction table entries
	if err := r.db.Delete(&model.IsochroneRiderRangeLink{}, "isochrone_id = ?", isochroneID).Error; err != nil {
		fmt.Printf("Error deleting junction table entries for isochrone %s: %v\n", isochroneID, err)
	}

	// Delete from cache
	cache := NewIsochroneCache()
	cache.SetDB(r.db)
	if err := cache.InvalidateIsochrone(context.Background(), isochroneID); err != nil {
		fmt.Printf("Error invalidating cache for isochrone %s: %v\n", isochroneID, err)
	}

	// Delete from database
	if err := r.db.Delete(&model.IsochroneResult{}, "id = ?", isochroneID).Error; err != nil {
		return fmt.Errorf("failed to delete isochrone: %w", err)
	}

	return nil
}

// InvalidateIsochrone removes an isochrone from cache by its ID
func (c *IsochroneCache) InvalidateIsochrone(ctx context.Context, isochroneID string) error {
	// If no Redis connection, skip cache invalidation
	if c.client == nil {
		return nil
	}

	// We need to find all possible cache keys for this isochrone
	// Since we don't store reverse mapping, we'll use a pattern to find related keys
	pattern := "isochrone:*"

	// Get all cache keys matching the pattern
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to get cache keys: %w", err)
	}

	// Check each key to see if it belongs to this isochrone
	var keysToDelete []string
	for _, key := range keys {
		// Get the cached result
		cachedData, err := c.client.Get(ctx, key).Result()
		if err != nil {
			continue // Skip if we can't read it
		}

		// Try to unmarshal to check the ID
		var result model.IsochroneResult
		if err := json.Unmarshal([]byte(cachedData), &result); err != nil {
			continue // Skip if we can't unmarshal
		}

		// If this cached result matches our isochrone ID, mark for deletion
		if result.ID.String() == isochroneID {
			keysToDelete = append(keysToDelete, key)
		}
	}

	// Delete the matching keys
	if len(keysToDelete) > 0 {
		if err := c.client.Del(ctx, keysToDelete...).Err(); err != nil {
			return fmt.Errorf("failed to delete cache keys: %w", err)
		}
		fmt.Printf("Deleted %d cache entries for isochrone %s\n", len(keysToDelete), isochroneID)
	}

	return nil
}

// InvalidateRiderCache removes all cached isochrones for a specific rider
func (c *IsochroneCache) InvalidateRiderCache(ctx context.Context, riderID string) error {
	// If no Redis connection, skip cache invalidation
	if c.client == nil {
		return nil
	}

	// Get all cache keys
	pattern := "isochrone:*"
	keys, err := c.client.Keys(ctx, pattern).Result()
	if err != nil {
		return fmt.Errorf("failed to get cache keys: %w", err)
	}

	// Check each key to see if it belongs to this rider
	var keysToDelete []string
	for _, key := range keys {
		// Get the cached result
		cachedData, err := c.client.Get(ctx, key).Result()
		if err != nil {
			continue // Skip if we can't read it
		}

		// Try to unmarshal to check the rider ID
		var result model.IsochroneResult
		if err := json.Unmarshal([]byte(cachedData), &result); err != nil {
			continue // Skip if we can't unmarshal
		}

		// If this cached result matches our rider ID, mark for deletion
		if result.RiderID == riderID {
			keysToDelete = append(keysToDelete, key)
		}
	}

	// Delete the matching keys
	if len(keysToDelete) > 0 {
		if err := c.client.Del(ctx, keysToDelete...).Err(); err != nil {
			return fmt.Errorf("failed to delete cache keys: %w", err)
		}
		fmt.Printf("Deleted %d cache entries for rider %s\n", len(keysToDelete), riderID)
	}

	return nil
}

// More efficient alternative: InvalidateRiderCacheByPattern
// This method assumes you can modify your cache key structure to include rider ID
func (c *IsochroneCache) InvalidateRiderCacheByPattern(ctx context.Context, riderID string) error {
	// If no client connection, skip cache invalidation
	if c.client == nil {
		return nil
	}

	// If you modify your cache key to include rider ID, you can use:
	// pattern := fmt.Sprintf("isochrone:rider:%s:*", riderID)

	// For now, using the general approach since your current key doesn't include rider ID
	return c.InvalidateRiderCache(ctx, riderID)
}
