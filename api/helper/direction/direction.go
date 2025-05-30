package directions

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"sync"

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
)

// Load the API key once at startup
func init() {
	once.Do(func() {
		apiKey := os.Getenv("GOOGLE_MAPS_API_KEY")
		if apiKey == "" {
			log.Println("WARNING: GOOGLE_MAPS_API_KEY not set")
		}
		DirectionsClient = &Client{APIKey: apiKey}
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

func ConvertToGeoJSON(resp *GoogleDirectionsResponse) *GeoJSON {
	if len(resp.Routes) == 0 || len(resp.Routes[0].Legs) == 0 {
		return nil
	}
	route := resp.Routes[0]
	leg := route.Legs[0]

	overviewPolyline := route.OverviewPolyline.Points
	coords, _, err := polyline.DecodeCoords([]byte(overviewPolyline))
	if err != nil {
		return nil
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

//This function now properly converts [lat, lng] from polyline to [lng, lat] for GeoJSON
func ConvertToGeoJSON1(resp *GoogleDirectionsResponse) *GeoJSON {
	if len(resp.Routes) == 0 || len(resp.Routes[0].Legs) == 0 {
		return nil
	}
	route := resp.Routes[0]
	leg := route.Legs[0]

	overviewPolyline := route.OverviewPolyline.Points
	
	// polyline.DecodeCoords returns coordinates in [lat, lng] format
	decodedCoords, _, err := polyline.DecodeCoords([]byte(overviewPolyline))
	if err != nil {
		log.Printf("Error decoding polyline: %v", err)
		return nil
	}

	// Convert from [lat, lng] to [lng, lat] for GeoJSON compliance
	geoJSONCoords := make([][]float64, len(decodedCoords))
	for i, coord := range decodedCoords {
		if len(coord) >= 2 {
			// Swap lat,lng to lng,lat for GeoJSON
			geoJSONCoords[i] = []float64{coord[1], coord[0]} // [lng, lat]
		}
	}

	log.Printf("Route conversion: %d coordinates converted from [lat,lng] to [lng,lat]", len(geoJSONCoords))
	if len(geoJSONCoords) > 0 {
		log.Printf("First coordinate: [%.6f, %.6f] (lng, lat)", geoJSONCoords[0][0], geoJSONCoords[0][1])
		log.Printf("Last coordinate: [%.6f, %.6f] (lng, lat)", geoJSONCoords[len(geoJSONCoords)-1][0], geoJSONCoords[len(geoJSONCoords)-1][1])
	}

	return &GeoJSON{
		Type: "Feature",
		Geometry: GeoJSONGeometry{
			Type:        "LineString",
			Coordinates: geoJSONCoords, // Now properly in [lng, lat] format
		},
		Metadata: RouteMetadata{
			Summary:  route.Summary,
			Distance: leg.Distance.Text,
			Duration: leg.Duration.Text,
		},
	}
}

func GetRouteGeoJSON(userLat, userLng float64, result model.IsochroneResult) (string, error) {
	directionsClient := DirectionsClient
	vendorLng := result.Locations[0]
	vendorLat := result.Locations[1]
	// Prepare Google Maps Directions API request
	directionsReq := DirectionsRequest{
		Origin:      fmt.Sprintf("%.6f,%.6f", vendorLat, vendorLng),
		Destination: fmt.Sprintf("%.6f,%.6f", userLat, userLng),
		Mode:        *result.TransportMode,
		Language:    "en",
		Units:       "metric",
	}

	// Fetch route from Google Directions API
	directionsResp, err := directionsClient.GetDirections(&directionsReq)
	if err != nil {
		return "", fmt.Errorf("failed to get directions from Google API: %w", err)
	}

	// Convert directions response to GeoJSON
	geoJSON := ConvertToGeoJSON(directionsResp)
	if geoJSON == nil {
		return "", fmt.Errorf("could not convert directions to GeoJSON")
	}

	geoJSONBytes, err := json.Marshal(geoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to marshal GeoJSON: %w", err)
	}
	geoJSONStr := string(geoJSONBytes)

	return geoJSONStr, nil
}
