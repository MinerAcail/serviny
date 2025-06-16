package directions

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"sync"
	"time"

	"github.com/lehxees/serviny/graph/model"
	"github.com/twpayne/go-polyline"
)

type DirectionsRequest struct {
	Origin      string
	Destination string
	Mode        string
	Language    string
	Units       string
}

type GoogleDirectionsResponse struct {
	Routes []struct {
		Summary string `json:"summary"`
		Legs    []struct {
			Distance struct {
				Text  string `json:"text"`
				Value int    `json:"value"`
			} `json:"distance"`
			Duration struct {
				Text  string `json:"text"`
				Value int    `json:"value"`
			} `json:"duration"`
			Steps []struct {
				Polyline struct {
					Points string `json:"points"`
				} `json:"polyline"`
			} `json:"steps"`
		} `json:"legs"`
		OverviewPolyline struct {
			Points string `json:"points"`
		} `json:"overview_polyline"`
	} `json:"routes"`
	Status string `json:"status"`
}

type Client struct {
	APIKey string
}

var (
	DirectionsClient *Client
	once             sync.Once
	globalSwapper    *CoordinateSwapper
)

// Load the API key once at startup
func init() {
	once.Do(func() {
		apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
		if apiKey == "" {
			log.Println("WARNING: GOOGLE_MAPS_API_KEY not set")
		}
		DirectionsClient = &Client{APIKey: apiKey}
		globalSwapper = &CoordinateSwapper{}
	})
}

func (c *Client) GetDirections(req *DirectionsRequest) (*GoogleDirectionsResponse, error) {
	if c.APIKey == "" {
		return nil, fmt.Errorf("Google Maps API key is not set")
	}

	endpoint := "https://maps.googleapis.com/maps/api/directions/json"
	params := url.Values{}
	params.Set("origin", req.Origin)
	params.Set("destination", req.Destination)
	params.Set("mode", req.Mode)
	params.Set("language", req.Language)
	params.Set("units", req.Units)
	params.Set("key", c.APIKey)

	resp, err := http.Get(fmt.Sprintf("%s?%s", endpoint, params.Encode()))
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google Directions API returned status: %s", resp.Status)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var directionsResp GoogleDirectionsResponse
	if err := json.Unmarshal(body, &directionsResp); err != nil {
		return nil, fmt.Errorf("failed to parse directions response: %w", err)
	}

	if directionsResp.Status != "OK" {
		return nil, fmt.Errorf("Google API error: %s", directionsResp.Status)
	}

	return &directionsResp, nil
}

type GeoJSON struct {
	Type     string          `json:"type"`
	Geometry GeoJSONGeometry `json:"geometry"`
	Metadata RouteMetadata   `json:"metadata"`
}

type RouteMetadata struct {
	Summary  string `json:"summary"`
	Distance string `json:"distance"`
	Duration string `json:"duration"`
}

type GeoJSONGeometry struct {
	Type        string      `json:"type"`
	Coordinates [][]float64 `json:"coordinates"`
}

// Configuration constants for performance tuning
const (
	// Minimum coordinates to justify parallel processing
	MinCoordsForParallel = 500
	
	// Minimum work per goroutine to avoid overhead
	MinWorkPerGoroutine = 100
	
	// Maximum number of workers (prevent overwhelming the system)
	MaxWorkers = 16
)

// Worker pool for high-frequency coordinate swapping
type CoordinateSwapper struct {
	workerPool chan struct{}
	once       sync.Once
}

// Initialize the swapper with a worker pool
func (cs *CoordinateSwapper) init() {
	cs.once.Do(func() {
		// Create a buffered channel to limit concurrent goroutines
		cs.workerPool = make(chan struct{}, runtime.NumCPU()*2)
		log.Printf("Initialized coordinate swapper with pool size: %d", runtime.NumCPU()*2)
	})
}

// Helper function for min (since Go doesn't have built-in min for ints)
func min(a, b, c int) int {
	result := a
	if b < result {
		result = b
	}
	if c < result {
		result = c
	}
	return result
}

// Optimized coordinate swapping with intelligent parallel processing
func swapCoordinatesOptimized(coords [][]float64) {
	coordCount := len(coords)
	
	// For small datasets, use simple sequential processing
	if coordCount < MinCoordsForParallel {
		for i := range coords {
			if len(coords[i]) >= 2 {
				coords[i][0], coords[i][1] = coords[i][1], coords[i][0]
			}
		}
		log.Printf("Sequential processing: %d coordinates swapped", coordCount)
		return
	}

	// Calculate optimal number of workers
	numCPU := runtime.NumCPU()
	maxWorkersBasedOnData := coordCount / MinWorkPerGoroutine
	
	// Choose the minimum of: available CPUs, data-based workers, and max limit
	numWorkers := min(numCPU, maxWorkersBasedOnData, MaxWorkers)
	
	// Ensure at least 1 worker
	if numWorkers < 1 {
		numWorkers = 1
	}

	log.Printf("Parallel processing: %d coordinates with %d workers (CPUs: %d)", coordCount, numWorkers, numCPU)

	// Calculate work distribution
	chunkSize := coordCount / numWorkers
	remainder := coordCount % numWorkers

	var wg sync.WaitGroup
	
	// Launch workers
	for workerID := 0; workerID < numWorkers; workerID++ {
		wg.Add(1)
		
		// Calculate this worker's range
		start := workerID * chunkSize
		end := start + chunkSize
		
		// Give the last worker any remaining coordinates
		if workerID == numWorkers-1 {
			end += remainder
		}

		// Launch goroutine for this chunk
		go func(workerID, start, end int) {
			defer wg.Done()
			
			// Process this worker's chunk
			swapCount := 0
			for i := start; i < end; i++ {
				if len(coords[i]) >= 2 {
					coords[i][0], coords[i][1] = coords[i][1], coords[i][0]
					swapCount++
				}
			}
			
			log.Printf("Worker %d: processed %d coordinates (%d-%d)", workerID, swapCount, start, end-1)
		}(workerID, start, end)
	}

	// Wait for all workers to complete
	wg.Wait()
	log.Printf("Parallel processing completed: %d coordinates swapped", coordCount)
}

// Worker pool version - prevents goroutine spam for frequent calls
func (cs *CoordinateSwapper) SwapCoordinatesWithPool(coords [][]float64) {
	cs.init()
	coordCount := len(coords)
	
	// For small datasets, use simple sequential processing
	if coordCount < MinCoordsForParallel {
		for i := range coords {
			if len(coords[i]) >= 2 {
				coords[i][0], coords[i][1] = coords[i][1], coords[i][0]
			}
		}
		log.Printf("Pool sequential processing: %d coordinates swapped", coordCount)
		return
	}

	// Calculate optimal number of workers (same logic as before)
	numCPU := runtime.NumCPU()
	maxWorkersBasedOnData := coordCount / MinWorkPerGoroutine
	numWorkers := min(numCPU, maxWorkersBasedOnData, MaxWorkers)
	
	if numWorkers < 1 {
		numWorkers = 1
	}

	log.Printf("Pool parallel processing: %d coordinates with %d workers", coordCount, numWorkers)

	chunkSize := coordCount / numWorkers
	remainder := coordCount % numWorkers

	var wg sync.WaitGroup
	
	for workerID := 0; workerID < numWorkers; workerID++ {
		// Acquire a worker slot (blocks if pool is full)
		cs.workerPool <- struct{}{}
		wg.Add(1)
		
		start := workerID * chunkSize
		end := start + chunkSize
		if workerID == numWorkers-1 {
			end += remainder
		}

		go func(workerID, start, end int) {
			defer func() {
				wg.Done()
				<-cs.workerPool // Release worker slot
			}()
			
			swapCount := 0
			for i := start; i < end; i++ {
				if len(coords[i]) >= 2 {
					coords[i][0], coords[i][1] = coords[i][1], coords[i][0]
					swapCount++
				}
			}
			log.Printf("Pool worker %d: processed %d coordinates (%d-%d)", workerID, swapCount, start, end-1)
		}(workerID, start, end)
	}

	wg.Wait()
	log.Printf("Pool parallel processing completed: %d coordinates swapped", coordCount)
}

// Main ConvertToGeoJSON function with optimized parallel coordinate swapping
func ConvertToGeoJSON(resp *GoogleDirectionsResponse) *GeoJSON {
	if len(resp.Routes) == 0 || len(resp.Routes[0].Legs) == 0 {
		log.Println("No routes or legs found in Google Directions response")
		return nil
	}
	route := resp.Routes[0]
	leg := route.Legs[0]

	overviewPolyline := route.OverviewPolyline.Points
	if overviewPolyline == "" {
		log.Println("No overview polyline found in route")
		return nil
	}
	
	// polyline.DecodeCoords returns coordinates in [lat, lng] format
	coords, _, err := polyline.DecodeCoords([]byte(overviewPolyline))
	if err != nil {
		log.Printf("Error decoding polyline: %v", err)
		return nil
	}

	if len(coords) == 0 {
		log.Println("No coordinates decoded from polyline")
		return nil
	}

	log.Printf("Decoded %d coordinates from polyline", len(coords))

	// Swap coordinates from [lat, lng] to [lng, lat] for GeoJSON compliance
	swapCoordinatesOptimized(coords)

	log.Printf("Route conversion completed: %d coordinates converted from [lat,lng] to [lng,lat]", len(coords))
	if len(coords) > 0 {
		log.Printf("First coordinate: [%.6f, %.6f] (lng, lat)", coords[0][0], coords[0][1])
		log.Printf("Last coordinate: [%.6f, %.6f] (lng, lat)", coords[len(coords)-1][0], coords[len(coords)-1][1])
	}

	return &GeoJSON{
		Type: "Feature",
		Geometry: GeoJSONGeometry{
			Type:        "LineString",
			Coordinates: coords,
		},
		Metadata: RouteMetadata{
			Summary:  route.Summary,
			Distance: leg.Distance.Text,
			Duration: leg.Duration.Text,
		},
	}
}

// Alternative ConvertToGeoJSON using worker pool (for high-frequency usage)
func ConvertToGeoJSONWithPool(resp *GoogleDirectionsResponse) *GeoJSON {
	if len(resp.Routes) == 0 || len(resp.Routes[0].Legs) == 0 {
		log.Println("No routes or legs found in Google Directions response")
		return nil
	}
	route := resp.Routes[0]
	leg := route.Legs[0]

	overviewPolyline := route.OverviewPolyline.Points
	if overviewPolyline == "" {
		log.Println("No overview polyline found in route")
		return nil
	}
	
	coords, _, err := polyline.DecodeCoords([]byte(overviewPolyline))
	if err != nil {
		log.Printf("Error decoding polyline: %v", err)
		return nil
	}

	if len(coords) == 0 {
		log.Println("No coordinates decoded from polyline")
		return nil
	}

	log.Printf("Decoded %d coordinates from polyline (using worker pool)", len(coords))

	// Use worker pool version for high-frequency calls
	globalSwapper.SwapCoordinatesWithPool(coords)

	log.Printf("Pool route conversion completed: %d coordinates", len(coords))
	if len(coords) > 0 {
		log.Printf("First coordinate: [%.6f, %.6f] (lng, lat)", coords[0][0], coords[0][1])
		log.Printf("Last coordinate: [%.6f, %.6f] (lng, lat)", coords[len(coords)-1][0], coords[len(coords)-1][1])
	}

	return &GeoJSON{
		Type: "Feature",
		Geometry: GeoJSONGeometry{
			Type:        "LineString",
			Coordinates: coords,
		},
		Metadata: RouteMetadata{
			Summary:  route.Summary,
			Distance: leg.Distance.Text,
			Duration: leg.Duration.Text,
		},
	}
}

// Enhanced GetRouteGeoJSON with performance metrics and error handling
func GetRouteGeoJSON(userLat, userLng float64, result model.IsochroneResult) (string, error) {
	if DirectionsClient == nil {
		return "", fmt.Errorf("directions client not initialized")
	}

	directionsClient := DirectionsClient
	
	// Validate input coordinates
	if len(result.Locations) < 2 {
		return "", fmt.Errorf("insufficient location data in isochrone result")
	}
	
	vendorLng := result.Locations[0]
	vendorLat := result.Locations[1]
	
	// Validate coordinates are reasonable (basic sanity check)
	if vendorLat < -90 || vendorLat > 90 || userLat < -90 || userLat > 90 {
		return "", fmt.Errorf("invalid latitude values: vendor=%.6f, user=%.6f", vendorLat, userLat)
	}
	if vendorLng < -180 || vendorLng > 180 || userLng < -180 || userLng > 180 {
		return "", fmt.Errorf("invalid longitude values: vendor=%.6f, user=%.6f", vendorLng, userLng)
	}
	
	log.Printf("Getting route from vendor [%.6f, %.6f] to user [%.6f, %.6f]", vendorLat, vendorLng, userLat, userLng)
	
	// Validate transport mode
	if result.TransportMode == nil {
		return "", fmt.Errorf("transport mode not specified in isochrone result")
	}
	
	// Prepare Google Maps Directions API request
	// Google expects "lat,lng" format in the API request
	directionsReq := DirectionsRequest{
		Origin:      fmt.Sprintf("%.6f,%.6f", vendorLat, vendorLng),  // lat,lng format for Google API
		Destination: fmt.Sprintf("%.6f,%.6f", userLat, userLng),     // lat,lng format for Google API
		Mode:        *result.TransportMode,
		Language:    "en",
		Units:       "metric",
	}

	log.Printf("Requesting directions: %s -> %s (mode: %s)", directionsReq.Origin, directionsReq.Destination, directionsReq.Mode)

	// Fetch route from Google Directions API
	directionsResp, err := directionsClient.GetDirections(&directionsReq)
	if err != nil {
		return "", fmt.Errorf("failed to get directions from Google API: %w", err)
	}

	// Convert directions response to GeoJSON (this handles coordinate swapping correctly)
	geoJSON := ConvertToGeoJSON(directionsResp)
	if geoJSON == nil {
		return "", fmt.Errorf("could not convert directions to GeoJSON")
	}

	// Marshal to JSON string
	geoJSONBytes, err := json.Marshal(geoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to marshal GeoJSON: %w", err)
	}
	geoJSONStr := string(geoJSONBytes)

	log.Printf("Successfully generated GeoJSON route with %d coordinates", len(geoJSON.Geometry.Coordinates))
	log.Printf("Route metadata - Summary: %s, Distance: %s, Duration: %s", 
		geoJSON.Metadata.Summary, geoJSON.Metadata.Distance, geoJSON.Metadata.Duration)
	
	return geoJSONStr, nil
}
// Enhanced GetBookRouteGeoJSON with performance metrics and error handling for bookings
// Enhanced GetBookRouteGeoJSON with better validation and error handling
func GetBookRouteGeoJSON(pickupLat, pickupLng, dropoffLat, dropoffLng float64) (string, error) {
	if DirectionsClient == nil {
		return "", fmt.Errorf("directions client not initialized")
	}

	directionsClient := DirectionsClient
	
	// Validate coordinates are reasonable (basic sanity check)
	if pickupLat < -90 || pickupLat > 90 || dropoffLat < -90 || dropoffLat > 90 {
		return "", fmt.Errorf("invalid latitude values: pickup=%.6f, dropoff=%.6f", pickupLat, dropoffLat)
	}
	if pickupLng < -180 || pickupLng > 180 || dropoffLng < -180 || dropoffLng > 180 {
		return "", fmt.Errorf("invalid longitude values: pickup=%.6f, dropoff=%.6f", pickupLng, dropoffLng)
	}

	// ENHANCED: Check for identical coordinates (the problematic case from your logs)
	const coordinateTolerance = 0.000001 // ~0.1 meters
	if math.Abs(pickupLat-dropoffLat) < coordinateTolerance && math.Abs(pickupLng-dropoffLng) < coordinateTolerance {
		log.Printf("⚠️ WARNING: Pickup and dropoff coordinates are essentially identical (within %.6f degrees)", coordinateTolerance)
		log.Printf("📍 Pickup: [%.6f, %.6f], Dropoff: [%.6f, %.6f]", pickupLat, pickupLng, dropoffLat, dropoffLng)
		
		// Return a minimal valid GeoJSON for identical coordinates
		minimalRoute := GeoJSON{
			Type: "Feature",
			Geometry: GeoJSONGeometry{
				Type:        "LineString",
				Coordinates: [][]float64{{pickupLng, pickupLat}, {dropoffLng, dropoffLat}},
			},
			Metadata: RouteMetadata{
				Summary:  "Same location",
				Distance: "0 m",
				Duration: "0 mins",
			},
		}
		
		geoJSONBytes, err := json.Marshal(minimalRoute)
		if err != nil {
			return "", fmt.Errorf("failed to marshal minimal route GeoJSON: %w", err)
		}
		
		log.Printf("🔄 Generated minimal route for identical coordinates")
		return string(geoJSONBytes), nil
	}
	
	log.Printf("🗺️ Getting route from pickup [%.6f, %.6f] to dropoff [%.6f, %.6f]", pickupLat, pickupLng, dropoffLat, dropoffLng)
	
	// Prepare Google Maps Directions API request
	// Google expects "lat,lng" format in the API request
	directionsReq := DirectionsRequest{
		Origin:      fmt.Sprintf("%.6f,%.6f", pickupLat, pickupLng),   // lat,lng format for Google API
		Destination: fmt.Sprintf("%.6f,%.6f", dropoffLat, dropoffLng), // lat,lng format for Google API
		Mode:        "driving", // Default to driving mode for bookings
		Language:    "en",
		Units:       "metric",
	}

	log.Printf("📡 Requesting directions: %s -> %s (mode: %s)", directionsReq.Origin, directionsReq.Destination, directionsReq.Mode)

	// ENHANCED: Add retry logic for API failures
	var directionsResp *GoogleDirectionsResponse
	var err error
	maxRetries := 3
	
	for attempt := 1; attempt <= maxRetries; attempt++ {
		directionsResp, err = directionsClient.GetDirections(&directionsReq)
		if err == nil {
			break
		}
		
		if attempt < maxRetries {
			waitTime := time.Duration(attempt) * time.Second
			log.Printf("⚠️ Attempt %d failed, retrying in %v: %v", attempt, waitTime, err)
			time.Sleep(waitTime)
		}
	}
	
	if err != nil {
		return "", fmt.Errorf("failed to get directions from Google API after %d attempts: %w", maxRetries, err)
	}

	// ENHANCED: Validate the response
	if directionsResp == nil {
		return "", fmt.Errorf("received nil directions response")
	}
	
	if len(directionsResp.Routes) == 0 {
		return "", fmt.Errorf("no routes found in directions response")
	}
	
	if len(directionsResp.Routes[0].Legs) == 0 {
		return "", fmt.Errorf("no legs found in first route")
	}

	// Convert directions response to GeoJSON (this handles coordinate swapping correctly)
	geoJSON := ConvertToGeoJSON(directionsResp)
	if geoJSON == nil {
		return "", fmt.Errorf("could not convert directions to GeoJSON")
	}

	// ENHANCED: Validate the generated GeoJSON
	if len(geoJSON.Geometry.Coordinates) == 0 {
		return "", fmt.Errorf("generated GeoJSON has no coordinates")
	}

	// Marshal to JSON string
	geoJSONBytes, err := json.Marshal(geoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to marshal GeoJSON: %w", err)
	}
	geoJSONStr := string(geoJSONBytes)

	log.Printf("✅ Successfully generated GeoJSON route with %d coordinates", len(geoJSON.Geometry.Coordinates))
	log.Printf("📊 Route metadata - Summary: %s, Distance: %s, Duration: %s", 
		geoJSON.Metadata.Summary, geoJSON.Metadata.Distance, geoJSON.Metadata.Duration)
	
	return geoJSONStr, nil
}

// GetRouteGeoJSONWithPool - Alternative version using worker pool for high-frequency calls
func GetRouteGeoJSONWithPool(userLat, userLng float64, result model.IsochroneResult) (string, error) {
	if DirectionsClient == nil {
		return "", fmt.Errorf("directions client not initialized")
	}

	directionsClient := DirectionsClient
	
	// Validate input coordinates
	if len(result.Locations) < 2 {
		return "", fmt.Errorf("insufficient location data in isochrone result")
	}
	
	vendorLng := result.Locations[0]
	vendorLat := result.Locations[1]
	
	// Validate coordinates are reasonable (basic sanity check)
	if vendorLat < -90 || vendorLat > 90 || userLat < -90 || userLat > 90 {
		return "", fmt.Errorf("invalid latitude values: vendor=%.6f, user=%.6f", vendorLat, userLat)
	}
	if vendorLng < -180 || vendorLng > 180 || userLng < -180 || userLng > 180 {
		return "", fmt.Errorf("invalid longitude values: vendor=%.6f, user=%.6f", vendorLng, userLng)
	}
	
	log.Printf("Getting route with worker pool from vendor [%.6f, %.6f] to user [%.6f, %.6f]", vendorLat, vendorLng, userLat, userLng)
	
	// Validate transport mode
	if result.TransportMode == nil {
		return "", fmt.Errorf("transport mode not specified in isochrone result")
	}
	
	// Prepare Google Maps Directions API request
	directionsReq := DirectionsRequest{
		Origin:      fmt.Sprintf("%.6f,%.6f", vendorLat, vendorLng),
		Destination: fmt.Sprintf("%.6f,%.6f", userLat, userLng),
		Mode:        *result.TransportMode,
		Language:    "en",
		Units:       "metric",
	}

	log.Printf("Requesting directions with pool: %s -> %s (mode: %s)", directionsReq.Origin, directionsReq.Destination, directionsReq.Mode)

	// Fetch route from Google Directions API
	directionsResp, err := directionsClient.GetDirections(&directionsReq)
	if err != nil {
		return "", fmt.Errorf("failed to get directions from Google API: %w", err)
	}

	// Convert using worker pool version
	geoJSON := ConvertToGeoJSONWithPool(directionsResp)
	if geoJSON == nil {
		return "", fmt.Errorf("could not convert directions to GeoJSON")
	}

	// Marshal to JSON string
	geoJSONBytes, err := json.Marshal(geoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to marshal GeoJSON: %w", err)
	}
	geoJSONStr := string(geoJSONBytes)

	log.Printf("Successfully generated GeoJSON route with pool: %d coordinates", len(geoJSON.Geometry.Coordinates))
	log.Printf("Route metadata - Summary: %s, Distance: %s, Duration: %s", 
		geoJSON.Metadata.Summary, geoJSON.Metadata.Distance, geoJSON.Metadata.Duration)
	
	return geoJSONStr, nil
}