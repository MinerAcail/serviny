package tracking

import "math"

// RiderLocation stores a rider's location update
type RiderLocation struct {
	RiderID   string    `json:"riderId"`
	Location  []float64 `json:"location"`
	Timestamp int64     `json:"timestamp"`
	H3Indexes []string  `json:"h3Indexes"`
	Status    string    `json:"status"`
}

// // UpdateRiderLocation updates a rider's location and H3 indexes
// func UpdateRiderLocation(ctx context.Context, riderID string, lat, lng float64, status string) error {
// 	redisClient := redis.ConfigureRedis()

// 	// Generate H3 indexes for the location
// 	h3Indexes := h3helper.GetH3IndexesForLocation(lat, lng)

// 	// Create location data
// 	location := RiderLocation{
// 		RiderID:   riderID,
// 		Location:  []float64{lng, lat}, // Note: [lng, lat] format
// 		Timestamp: time.Now().Unix(),
// 		H3Indexes: h3Indexes,
// 		Status:    status,
// 	}

// 	// Store in primary location record
// 	locationKey := fmt.Sprintf("rider:location:%s", riderID)
// 	locationJSON, _ := json.Marshal(location)
// 	if err := redisClient.Set(ctx, locationKey, locationJSON, 24*time.Hour).Err(); err != nil {
// 		return fmt.Errorf("failed to store rider location: %w", err)
// 	}

// 	// Update spatial index for each H3 resolution
// 	for _, h3Index := range h3Indexes {
// 		spatialKey := fmt.Sprintf("spatial:riders:%s", h3Index)
// 		if err := redisClient.SAdd(ctx, spatialKey, riderID).Err(); err != nil {
// 			return fmt.Errorf("failed to update spatial index: %w", err)
// 		}
// 		// Set expiration on the spatial index
// 		redisClient.Expire(ctx, spatialKey, 24*time.Hour)
// 	}

// 	return nil
// }

// // GetNearbyRiders finds riders near a specific location
// func GetNearbyRiders(ctx context.Context, lat, lng float64, ringSize int, status string) ([]RiderLocation, error) {
// 	redisClient := redis.ConfigureRedis()

// 	// Get H3 indexes for the target location
// 	h3Indexes := h3helper.GetH3IndexesForLocation(lat, lng)

// 	// We'll use the middle resolution (index 1) for finding nearby riders
// 	centerIndex := h3Indexes[1] // Resolution 8

// 	// Get hexagons in the ring around the center
// 	nearbyHexes, err := h3helper.GetNearbyH3Indexes(centerIndex, ringSize)
// 	if err != nil {
// 		return nil, fmt.Errorf("failed to get nearby hexes: %w", err)
// 	}

// 	// Find riders in all these hexes
// 	var riderIDs []string
// 	for _, hex := range nearbyHexes {
// 		spatialKey := fmt.Sprintf("spatial:riders:%s", hex)
// 		hexRiders, err := redisClient.SMembers(ctx, spatialKey).Result()
// 		if err != nil {
// 			continue
// 		}
// 		riderIDs = append(riderIDs, hexRiders...)
// 	}

// 	// Remove duplicates
// 	uniqueRiderIDs := make(map[string]bool)
// 	for _, id := range riderIDs {
// 		uniqueRiderIDs[id] = true
// 	}

// 	// Get details for each rider
// 	var riders []RiderLocation
// 	for id := range uniqueRiderIDs {
// 		locationKey := fmt.Sprintf("rider:location:%s", id)
// 		locationJSON, err := redisClient.Get(ctx, locationKey).Bytes()
// 		if err != nil {
// 			continue
// 		}

// 		var location RiderLocation
// 		if err := json.Unmarshal(locationJSON, &location); err != nil {
// 			continue
// 		}

// 		// Filter by status if specified
// 		if status != "" && location.Status != status {
// 			continue
// 		}

// 		riders = append(riders, location)
// 	}

// 	return riders, nil
// }

func Haversine(lat1, lon1, lat2, lon2 float64) float64 {
	const R = 6371 // Earth radius in kilometers
	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}
