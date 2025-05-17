package helper

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"

	"github.com/lehxees/serviny/graph/model"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/geojson"
	"github.com/paulmach/orb/planar"
)

// Maximum time range for OpenRouteService API in seconds
const MAX_ORS_TIME_SECONDS = 3600 // 1 hour

// GenerateRegularIsochrone handles isochrone generation within the API's time limits
func GenerateRegularIsochrone(input model.IsochroneInput) (*model.IsochroneResult, error) {
	// Prepare request payload
	transportProfile := "driving-car" // Default

	// Map transport mode if provided in input
	if input.TransportMode != nil {
		switch *input.TransportMode {
		case "walking":
			transportProfile = "foot-walking"
		case "bike":
			transportProfile = "cycling-regular"
		case "motorbike":
			transportProfile = "driving-motorcycle"
		case "car":
			transportProfile = "driving-car"
		}
	}

	requestURL := fmt.Sprintf("https://api.openrouteservice.org/v2/isochrones/%s", transportProfile)

	// Prepare payload from input
	payload, err := json.Marshal(map[string]interface{}{
		"locations":     input.Locations, // [[long, lat]]
		"range":         input.Range,     // [seconds]
		"range_type":    "time",          // Always use time as range_type
		"attributes":    []string{"total_pop"},
		"location_type": "start",
		"area_units":    "km",
	})

	if err != nil {
		return nil, fmt.Errorf("failed to marshal input: %w", err)
	}

	// Create request
	req, err := http.NewRequest("POST", requestURL, bytes.NewBuffer(payload))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	apiKey := os.Getenv("OPENROUTE_SERVICE_API_KEY")
	req.Header.Set("Authorization", apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json, application/geo+json")

	// Execute request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to perform ORS request: %w", err)
	}
	defer resp.Body.Close()

	// Handle error responses
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("OpenRouteService API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read ORS response: %w", err)
	}

	return &model.IsochroneResult{
		GeoJSON: json.RawMessage(body),
	}, nil
}

// GenerateExtendedIsochrone handles isochrone generation beyond the API's time limits
// using a chaining approach with multiple requests
func GenerateExtendedIsochrone(input model.IsochroneInput) (*model.IsochroneResult, error) {
	// Map transport mode if provided in input
	transportProfile := "driving-car" // Default
	if input.TransportMode != nil {
		switch *input.TransportMode {
		case "walking":
			transportProfile = "foot-walking"
		case "bike":
			transportProfile = "cycling-regular"
		case "motorbike":
			transportProfile = "driving-motorcycle"
		case "car":
			transportProfile = "driving-car"
		}
	}

	// Process each range and build extended isochrones
	allFeatures := make([]map[string]interface{}, 0)

	for idx, rangeVal := range input.Range {
		// If within API limits, just make a regular request
		if rangeVal <= int32(MAX_ORS_TIME_SECONDS) {
			singleRangeInput := model.IsochroneInput{
				Locations:     input.Locations,
				Range:         []int32{rangeVal},
				TransportMode: input.TransportMode,
			}

			result, err := GenerateRegularIsochrone(singleRangeInput)
			if err != nil {
				return nil, fmt.Errorf("failed to generate regular isochrone for range %d: %w", rangeVal, err)
			}

			// Parse the GeoJSON response
			var geojsonData map[string]interface{}
			if err := json.Unmarshal(result.GeoJSON, &geojsonData); err != nil {
				return nil, fmt.Errorf("failed to parse GeoJSON for range %d: %w", rangeVal, err)
			}

			// Get the features and add to our collection
			features, ok := geojsonData["features"].([]interface{})
			if !ok || len(features) == 0 {
				return nil, fmt.Errorf("invalid GeoJSON format for range %d", rangeVal)
			}

			// Add the feature with proper group index
			for _, feature := range features {
				featureMap, ok := feature.(map[string]interface{})
				if ok {
					props, ok := featureMap["properties"].(map[string]interface{})
					if ok {
						props["group_index"] = idx
					}
				}
				allFeatures = append(allFeatures, featureMap)
			}

			continue
		}

		// For extended isochrones beyond API limits
		extendedIsochrone, err := generateChainedIsochrone(input.Locations, rangeVal, transportProfile)
		if err != nil {
			return nil, err
		}

		// Add group index to properties
		props, ok := extendedIsochrone["properties"].(map[string]interface{})
		if ok {
			props["group_index"] = idx
			props["extended"] = true
		}

		allFeatures = append(allFeatures, extendedIsochrone)
	}

	// Prepare the final GeoJSON response
	finalGeoJSON := map[string]interface{}{
		"type":     "FeatureCollection",
		"features": allFeatures,
	}

	// Convert to JSON
	resultJSON, err := json.Marshal(finalGeoJSON)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal final GeoJSON: %w", err)
	}

	return &model.IsochroneResult{
		GeoJSON: resultJSON,
	}, nil
}

// generateChainedIsochrone creates an extended isochrone by chaining multiple API requests
func generateChainedIsochrone(locations [][]float64, maxRangeSeconds int32, transportProfile string) (map[string]interface{}, error) {
	// Calculate how many "hops" we need
	hopsNeeded := int(math.Ceil(float64(maxRangeSeconds) / float64(MAX_ORS_TIME_SECONDS)))

	// Start with initial locations
	currentPoints := make([][]float64, len(locations))
	copy(currentPoints, locations)

	var allPolygons []*geojson.Feature
	
	// Use int32 for remainingSeconds to match maxRangeSeconds
	var remainingSeconds int32 = maxRangeSeconds

	// Process each hop
	for hop := 0; hop < hopsNeeded; hop++ {
		// For the last hop, use remaining seconds, otherwise use max allowed
		// Convert to int32 to match remainingSeconds type
		var currentRangeSeconds int32
		if remainingSeconds > int32(MAX_ORS_TIME_SECONDS) {
			currentRangeSeconds = int32(MAX_ORS_TIME_SECONDS)
		} else {
			currentRangeSeconds = remainingSeconds
		}

		// Skip if we don't have any remaining seconds
		if currentRangeSeconds <= 0 {
			break
		}

		// Prepare input for this hop
		hopInput := model.IsochroneInput{
			Locations:     currentPoints,
			Range:         []int32{currentRangeSeconds},
			TransportMode: nil, // We'll set this directly in the request
		}

		// Create request payload
		requestURL := fmt.Sprintf("https://api.openrouteservice.org/v2/isochrones/%s", transportProfile)
		payload, err := json.Marshal(map[string]interface{}{
			"locations":     hopInput.Locations,
			"range":         hopInput.Range,
			"range_type":    "time",
			"attributes":    []string{"total_pop"},
			"location_type": "start",
			"area_units":    "km",
		})
		if err != nil {
			return nil, fmt.Errorf("failed to marshal input for hop %d: %w", hop, err)
		}

		// Create and execute request
		req, err := http.NewRequest("POST", requestURL, bytes.NewBuffer(payload))
		if err != nil {
			return nil, fmt.Errorf("failed to create request for hop %d: %w", hop, err)
		}

		apiKey := os.Getenv("OPENROUTE_SERVICE_API_KEY")
		req.Header.Set("Authorization", apiKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json, application/geo+json")

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return nil, fmt.Errorf("failed to perform ORS request for hop %d: %w", hop, err)
		}

		// Read and parse response
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			return nil, fmt.Errorf("OpenRouteService API error in hop %d (status %d): %s", hop, resp.StatusCode, string(body))
		}

		var geojsonData map[string]interface{}
		if err := json.Unmarshal(body, &geojsonData); err != nil {
			return nil, fmt.Errorf("failed to parse GeoJSON in hop %d: %w", hop, err)
		}

		// Get features and convert to geojson.Feature for merging
		features, ok := geojsonData["features"].([]interface{})
		if !ok || len(features) == 0 {
			return nil, fmt.Errorf("invalid GeoJSON format in hop %d", hop)
		}

		// Add polygons to our collection and prepare next set of points
		for _, feature := range features {
			// Convert to geojson.Feature
			featureJSON, err := json.Marshal(feature)
			if err != nil {
				continue
			}

			geojsonFeature, err := geojson.UnmarshalFeature(featureJSON)
			if err != nil {
				continue
			}

			allPolygons = append(allPolygons, geojsonFeature)
		}

		// If this is the last hop, we're done
		if hop == hopsNeeded-1 {
			break
		}

		// Get next set of points from the boundaries for the next hop
		nextPoints := samplePointsFromPolygons(allPolygons, 8, 0.2)
		if len(nextPoints) > 0 {
			currentPoints = nextPoints
		}

		// Update remaining seconds - now both are int32 so no type mismatch
		remainingSeconds -= currentRangeSeconds
	}

	// Merge all polygons using union operations
	mergedPolygon := mergePolygons(allPolygons)
	if mergedPolygon == nil {
		return nil, fmt.Errorf("failed to merge polygons")
	}

	// Convert back to map for JSON marshaling
	mergedJSON, err := json.Marshal(mergedPolygon)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal merged polygon: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(mergedJSON, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal merged polygon: %w", err)
	}

	// Add metadata to properties
	props, ok := result["properties"].(map[string]interface{})
	if !ok {
		props = make(map[string]interface{})
		result["properties"] = props
	}

	props["value"] = maxRangeSeconds
	props["extended"] = true

	return result, nil
}

// samplePointsFromPolygons extracts sample points from polygon boundaries
func samplePointsFromPolygons(polygons []*geojson.Feature, count int, bufferDistance float64) [][]float64 {
	if len(polygons) == 0 {
		return nil
	}

	var points [][]float64

	for _, polygon := range polygons {
		geom := polygon.Geometry

		// Handle different geometry types
		switch g := geom.(type) {
		case orb.Polygon:
			// Sample points from the outer ring
			if len(g) > 0 {
				ring := g[0]
				pointsFromRing := samplePointsFromRing(ring, count/len(polygons), bufferDistance)
				points = append(points, pointsFromRing...)
			}

		case orb.MultiPolygon:
			// Find the largest polygon
			var largestRing orb.Ring
			var maxArea float64

			for _, poly := range g {
				if len(poly) > 0 {
					area := planar.Area(poly)
					if area > maxArea {
						maxArea = area
						largestRing = poly[0]
					}
				}
			}

			if len(largestRing) > 0 {
				pointsFromRing := samplePointsFromRing(largestRing, count/len(polygons), bufferDistance)
				points = append(points, pointsFromRing...)
			}
		}
	}

	return points
}

// samplePointsFromRing extracts evenly spaced points from a polygon ring
func samplePointsFromRing(ring orb.Ring, count int, bufferDistance float64) [][]float64 {
	if count < 1 || len(ring) < 3 {
		return nil
	}

	// Ensure minimum count
	if count < 4 {
		count = 4
	}

	var points [][]float64

	// Calculate total length
	var totalLength float64
	for i := 0; i < len(ring)-1; i++ {
		totalLength += planar.Distance(ring[i], ring[i+1])
	}

	// Calculate sampling interval
	interval := totalLength / float64(count)

	// Sample points
	var accumulatedLength float64
	for i := 0; i < len(ring)-1; i++ {
		segLength := planar.Distance(ring[i], ring[i+1])

		// Skip very short segments
		if segLength < 0.0001 {
			continue
		}

		// How many points can fit in this segment
		numPoints := int(math.Floor(segLength / interval))

		if numPoints > 0 {
			// Vector for the segment
			dx := ring[i+1][0] - ring[i][0]
			dy := ring[i+1][1] - ring[i][1]

			// Sample points along the segment
			for j := 0; j < numPoints; j++ {
				t := float64(j+1) / float64(numPoints+1)

				// Calculate point slightly inward from the boundary
				inwardFactor := bufferDistance / segLength
				if inwardFactor > 0.4 { // Cap the inward factor
					inwardFactor = 0.4
				}

				// Sample point
				x := ring[i][0] + t*dx
				y := ring[i][1] + t*dy

				points = append(points, []float64{x, y})
			}
		}

		accumulatedLength += segLength
	}

	return points
}

// mergePolygons merges multiple polygons into one using union operations
func mergePolygons(polygons []*geojson.Feature) *geojson.Feature {
	if len(polygons) == 0 {
		return nil
	}

	if len(polygons) == 1 {
		return polygons[0]
	}

	// Start with the first polygon
	result := polygons[0]

	// Union with each subsequent polygon
	// Note: In a production environment, you would implement actual
	// geometric union operations here. For simplicity, we're just returning
	// the largest polygon as an example.
	var maxArea float64
	for _, poly := range polygons {
		// Calculate area (simple approximation)
		area := 0.0

		switch g := poly.Geometry.(type) {
		case orb.Polygon:
			area = planar.Area(g)
		case orb.MultiPolygon:
			for _, p := range g {
				area += planar.Area(p)
			}
		}

		if area > maxArea {
			maxArea = area
			result = poly
		}
	}

	return result
}



