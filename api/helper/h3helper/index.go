package h3helper

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"time"
	// h3 "github.com/uber/h3-go/v4"
)


var H3ResolutionLevels = []int{9, 8, 7}

// package h3helper

// CalculateHaversineDistance uses OpenRouteService to compute the actual route distance
// between two points, falling back to a mathematical formula if the API call fails
func CalculateHaversineDistance(lat1, lng1, lat2, lng2 float64) float64 {
	// Try to get the distance from OpenRouteService first
	distance, err := getDistanceFromORS(lng1, lat1, lng2, lat2)
	if err == nil {
		return distance
	}

	// If ORS fails, fall back to mathematical haversine calculation
	return calculateMathematicalHaversine(lat1, lng1, lat2, lng2)
}

// getDistanceFromORS calls the OpenRouteService API to get the actual route distance
func getDistanceFromORS(lng1, lat1, lng2, lat2 float64) (float64, error) {
	// OpenRouteService API key - in a real app, use environment variables
	apiKey := os.Getenv("OPENROUTE_SERVICE_API_KEY")
	if apiKey == "" {
		return 0, fmt.Errorf("OpenRouteService API key not found")
	}

	// Determine which profile to use (you could pass this as an argument)
	profile := "driving-car" // Options: driving-car, foot-walking, cycling-regular

	// Format coordinates for ORS API (ORS uses [longitude, latitude] format)
	coordinates := [][]float64{
		{lng1, lat1},
		{lng2, lat2},
	}

	// Create the request body
	requestBody, err := json.Marshal(map[string]interface{}{
		"coordinates":  coordinates,
		"instructions": false,
		"units":        "km",
	})
	if err != nil {
		return 0, fmt.Errorf("failed to marshal request body: %w", err)
	}

	// Construct the URL
	url := fmt.Sprintf("https://api.openrouteservice.org/v2/directions/%s/json", profile)

	// Create the HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(requestBody))
	if err != nil {
		return 0, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Execute the request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, fmt.Errorf("failed to perform ORS request: %w", err)
	}
	defer resp.Body.Close()

	// Check for successful response
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("ORS API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Read and parse the response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, fmt.Errorf("failed to read response body: %w", err)
	}

	var response struct {
		Routes []struct {
			Summary struct {
				Distance float64 `json:"distance"`
			} `json:"summary"`
		} `json:"routes"`
	}

	if err := json.Unmarshal(body, &response); err != nil {
		return 0, fmt.Errorf("failed to parse JSON response: %w", err)
	}

	// Check if we have valid routes
	if len(response.Routes) == 0 {
		return 0, fmt.Errorf("no routes found in response")
	}

	// Return the distance in kilometers (ORS returns it in meters)
	return response.Routes[0].Summary.Distance / 1000, nil
}

// calculateMathematicalHaversine calculates the "as the crow flies" distance
// This is a fallback in case the ORS API call fails
func calculateMathematicalHaversine(lat1, lng1, lat2, lng2 float64) float64 {
	// Earth radius in kilometers
	const earthRadius = 6371.0

	// Convert latitude and longitude from degrees to radians
	lat1Rad := lat1 * math.Pi / 180
	lng1Rad := lng1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	lng2Rad := lng2 * math.Pi / 180

	// Differences
	dLat := lat2Rad - lat1Rad
	dLng := lng2Rad - lng1Rad

	// Haversine formula
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(dLng/2)*math.Sin(dLng/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := earthRadius * c

	return distance
}
