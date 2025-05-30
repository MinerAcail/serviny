package tracking

import (
	"encoding/json"
	"fmt"
	"log"
	"math"

	"github.com/google/uuid"
	"github.com/lehxees/serviny/graph/model"
	"github.com/paulmach/orb"
	"github.com/paulmach/orb/geojson"
	"github.com/paulmach/orb/planar"
	"gorm.io/gorm"
)

// BoundingBox calculates the bounding box for a given center point and radius
func BoundingBox(lat, lng, radiusKm float64) (minLat, maxLat, minLng, maxLng float64) {
	const earthRadius = 6371.0 // Earth's radius in km

	// Calculate latitude delta
	latDelta := radiusKm / earthRadius * (180 / math.Pi)

	// Calculate longitude delta (adjusted for latitude)
	lngDelta := radiusKm / (earthRadius * math.Cos(lat*math.Pi/180)) * (180 / math.Pi)

	minLat = lat - latDelta
	maxLat = lat + latDelta
	minLng = lng - lngDelta
	maxLng = lng + lngDelta

	return
}

// --- GeoJSON structure wrappers ---

type GeoJSONFeatureCollection struct {
	Type     string           `json:"type"`
	Features []GeoJSONFeature `json:"features"`
}

type GeoJSONFeature struct {
	Type     string          `json:"type"`
	Geometry GeoJSONGeometry `json:"geometry"`
}

type GeoJSONGeometry struct {
	Type        string          `json:"type"`
	Coordinates json.RawMessage `json:"coordinates"`
}

// --- Haversine formula ---

// Haversine calculates the distance between two points on Earth using the Haversine formula
func Haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371.0 // Earth's radius in km

	// Convert degrees to radians
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180

	// Haversine formula
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

// MaxHaversineDistanceFromGeoJSON calculates the maximum distance from a point to any vertex in a GeoJSON
func MaxHaversineDistanceFromGeoJSON(userLat, userLng float64, geojsonRaw json.RawMessage) (float64, error) {
	var fc GeoJSONFeatureCollection
	if err := json.Unmarshal(geojsonRaw, &fc); err != nil {
		return 0, fmt.Errorf("failed to parse GeoJSON FeatureCollection: %w", err)
	}

	if len(fc.Features) == 0 {
		return 0, fmt.Errorf("no features found in GeoJSON")
	}

	maxDistance := 0.0

	for _, feature := range fc.Features {
		geom := feature.Geometry

		switch geom.Type {
		case "Polygon":
			var coords [][][]float64
			if err := json.Unmarshal(geom.Coordinates, &coords); err != nil {
				return 0, fmt.Errorf("failed to parse Polygon coordinates: %w", err)
			}

			if len(coords) == 0 {
				continue
			}

			for _, ring := range coords {
				for _, point := range ring {
					if len(point) < 2 {
						continue
					}
					lng, lat := point[0], point[1]
					distance := Haversine(userLat, userLng, lat, lng)
					if distance > maxDistance {
						maxDistance = distance
					}
				}
			}

		case "MultiPolygon":
			var coords [][][][]float64
			if err := json.Unmarshal(geom.Coordinates, &coords); err != nil {
				return 0, fmt.Errorf("failed to parse MultiPolygon coordinates: %w", err)
			}

			for _, polygon := range coords {
				for _, ring := range polygon {
					for _, point := range ring {
						if len(point) < 2 {
							continue
						}
						lng, lat := point[0], point[1]
						distance := Haversine(userLat, userLng, lat, lng)
						if distance > maxDistance {
							maxDistance = distance
						}
					}
				}
			}

		default:
			return 0, fmt.Errorf("unsupported geometry type: %s", geom.Type)
		}
	}

	if maxDistance == 0 {
		return 0, fmt.Errorf("no valid coordinates found in GeoJSON")
	}

	return maxDistance, nil
}

// CheckPointInIsochrone checks if a point is within any of the isochrone polygons
func CheckPointInIsochrone(userLat, userLng float64, geojsonRaw json.RawMessage) (bool, error) {
	fc, err := geojson.UnmarshalFeatureCollection(geojsonRaw)
	if err != nil {
		return false, fmt.Errorf("failed to parse isochrone GeoJSON: %w", err)
	}

	if len(fc.Features) == 0 {
		return false, fmt.Errorf("invalid isochrone geometry: no features found")
	}

	userPoint := orb.Point{userLng, userLat}

	// Check if the point is within any of the features
	for i, feature := range fc.Features {
		if feature.Geometry == nil {
			log.Printf("Warning: feature %d has nil geometry, skipping", i)
			continue
		}

		geometry := feature.Geometry

		switch geom := geometry.(type) {
		case orb.Polygon:
			if planar.PolygonContains(geom, userPoint) {
				return true, nil
			}
		case orb.MultiPolygon:
			if planar.MultiPolygonContains(geom, userPoint) {
				return true, nil
			}
		default:
			log.Printf("Warning: unsupported geometry type %T in feature %d, skipping", geom, i)
			continue
		}
	}

	// Point is not within any of the features
	return false, nil
}


// GetRouteCoordinates returns the route coordinates from rider to vendor
func GetRouteCoordinates(db *gorm.DB, isochrone model.IsochroneResult) ([][2]float64, error) {
	var rider model.Rider
	if err := db.First(&rider, "id = ?", isochrone.RiderID).Error; err != nil {
		return nil, fmt.Errorf("failed to find rider: %w", err)
	}

	if len(isochrone.Locations) < 2 {
		return nil, fmt.Errorf("invalid vendor location in isochrone.Locations")
	}
	if len(rider.Coordinates) < 2 {
		return nil, fmt.Errorf("invalid rider coordinates")
	}

	vendorLocation := [2]float64{isochrone.Locations[0], isochrone.Locations[1]}
	riderLocation := [2]float64{rider.Coordinates[0], rider.Coordinates[1]}

	return [][2]float64{riderLocation, vendorLocation}, nil
}

// ValidateRiderServiceVendorRelationship finds the closest rider for a service that can reach the vendor
// This is for service -> rider -> vendor relationships
func ValidateRiderServiceVendorRelationship(tx *gorm.DB, vendorID string, serviceID string, userCoordinates []*float64) (string, error) {
	// Validate service ID format
	if _, err := uuid.Parse(serviceID); err != nil {
		return "", fmt.Errorf("invalid service ID format: %w", err)
	}

	// Validate vendor ID format
	if _, err := uuid.Parse(vendorID); err != nil {
		return "", fmt.Errorf("invalid vendor ID format: %w", err)
	}

	// Validate user coordinates
	if len(userCoordinates) < 2 || userCoordinates[0] == nil || userCoordinates[1] == nil {
		return "", fmt.Errorf("invalid user coordinates: must provide [lng, lat]")
	}
	userLng, userLat := *userCoordinates[0], *userCoordinates[1]

	// Validate coordinate ranges
	if userLng < -180 || userLng > 180 {
		return "", fmt.Errorf("invalid longitude: must be between -180 and 180")
	}
	if userLat < -90 || userLat > 90 {
		return "", fmt.Errorf("invalid latitude: must be between -90 and 90")
	}

	// Get vendor information and coordinates
	var vendor model.Service // Assuming vendor is a service
	if err := tx.Where("id = ?", vendorID).First(&vendor).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", fmt.Errorf("vendor %s not found", vendorID)
		}
		return "", fmt.Errorf("failed to fetch vendor: %w", err)
	}

	// Validate vendor coordinates
	if len(vendor.Coordinates) < 2 {
		return "", fmt.Errorf("vendor %s has invalid coordinates", vendorID)
	}
	vendorLng, vendorLat := vendor.Coordinates[0], vendor.Coordinates[1]

	// Get the service's isochrone relationship with the vendor (service is the rider service provider)
	var serviceIsochrone model.IsochroneResult
	if err := tx.Where("vendor_id = ? AND rider_id = ?", vendorID, serviceID).First(&serviceIsochrone).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", fmt.Errorf("no isochrone relationship found between service %s and vendor %s", serviceID, vendorID)
		}
		return "", fmt.Errorf("failed to check service isochrone relationship: %w", err)
	}

	// Check if user is within the service's coverage area first
	withinServiceCoverage, err := CheckPointInIsochrone(userLat, userLng, serviceIsochrone.GeoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to check if user is within service coverage: %w", err)
	}

	if !withinServiceCoverage {
		return "", fmt.Errorf("user location is outside service coverage area. Please use a different Rider Service Provider")
	}

	// Get approved riders for this service
	var approvedRiders []model.RidersRequest
	if err := tx.Where("service_id = ? AND state = ?", serviceID, "approved").Find(&approvedRiders).Error; err != nil {
		return "", fmt.Errorf("failed to get approved riders: %w", err)
	}

	if len(approvedRiders) == 0 {
		log.Printf("No approved riders found for service %s, will use service as rider", serviceID)
		// When no riders available, the service will reassign a different rider
		return serviceID, nil
	}

	// Extract rider IDs
	var riderIDs []string
	for _, req := range approvedRiders {
		riderIDs = append(riderIDs, req.RiderID)
	}

	// Get all candidate riders
	var candidateRiders []model.Rider
	if err := tx.Where("id IN ?", riderIDs).Find(&candidateRiders).Error; err != nil {
		return "", fmt.Errorf("failed to fetch candidate riders: %w", err)
	}

	if len(candidateRiders) == 0 {
		return "", fmt.Errorf("no candidate riders found for service %s", serviceID)
	}

	// Find the closest rider to the vendor that is within the service coverage area
	var closestRiderID string
	minDistance := math.MaxFloat64

	for _, rider := range candidateRiders {
		if len(rider.Coordinates) < 2 {
			continue
		}
		riderLng, riderLat := rider.Coordinates[0], rider.Coordinates[1]

		// Check if rider is within the service's coverage area (since service manages this rider)
		riderWithinService, err := CheckPointInIsochrone(riderLat, riderLng, serviceIsochrone.GeoJSON)
		if err != nil {
			log.Printf("Failed to check if rider %s is within service coverage: %v", rider.ID.String(), err)
			continue
		}

		if !riderWithinService {
			log.Printf("Rider %s is outside service coverage area", rider.ID.String())
			continue
		}

		// Calculate distance from rider to vendor
		distance := Haversine(riderLat, riderLng, vendorLat, vendorLng)

		// Validate that the vendor is within the service's reach (riders work under service coverage)
		maxDistanceKm, err := MaxHaversineDistanceFromGeoJSON(vendorLat, vendorLng, serviceIsochrone.GeoJSON)
		if err != nil {
			log.Printf("Failed to compute max distance from service isochrone for rider %s: %v", rider.ID.String(), err)
			continue
		}

		// Check if vendor is within the service's coverage area and this is the closest rider
		if distance <= maxDistanceKm && distance < minDistance {
			minDistance = distance
			closestRiderID = rider.ID.String()
		}
	}

	// If no suitable rider found, use service as fallback
	// The rider service will reassign a different rider
	if closestRiderID == "" {
		log.Printf("No suitable individual rider found, using service %s as fallback", serviceID)
		return serviceID, nil
	}

	log.Printf("Found closest rider %s at distance %.2f km for service %s to reach vendor %s",
		closestRiderID, minDistance, serviceID, vendorID)
	return closestRiderID, nil
}

// ValidateRiderVendorRelationship validates if a specific rider can reach the vendor and serve the user
// This is for direct rider -> vendor relationships
func ValidateRiderVendorRelationship(tx *gorm.DB, vendorID string, riderID string, userCoordinates []*float64) (string, error) {
	// Validate rider ID format
	if _, err := uuid.Parse(riderID); err != nil {
		return "", fmt.Errorf("invalid rider ID format: %w", err)
	}

	// Validate vendor ID format
	if _, err := uuid.Parse(vendorID); err != nil {
		return "", fmt.Errorf("invalid vendor ID format: %w", err)
	}

	// Validate user coordinates
	if len(userCoordinates) < 2 || userCoordinates[0] == nil || userCoordinates[1] == nil {
		return "", fmt.Errorf("invalid user coordinates: must provide [lng, lat]")
	}
	userLng, userLat := *userCoordinates[0], *userCoordinates[1]

	// Validate coordinate ranges
	if userLng < -180 || userLng > 180 {
		return "", fmt.Errorf("invalid longitude: must be between -180 and 180")
	}
	if userLat < -90 || userLat > 90 {
		return "", fmt.Errorf("invalid latitude: must be between -90 and 90")
	}

	// Fetch isochrone result for vendor-rider relationship
	var result model.IsochroneResult
	if err := tx.Where("vendor_id = ? AND rider_id = ?", vendorID, riderID).First(&result).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return "", fmt.Errorf("no isochrone relationship found between rider %s and vendor %s", riderID, vendorID)
		}
		return "", fmt.Errorf("failed to check isochrone relationship: %w", err)
	}

	// Check if user is within the rider's isochrone
	withinIsochrone, err := CheckPointInIsochrone(userLat, userLng, result.GeoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to check if user is within rider's service area: %w", err)
	}

	if !withinIsochrone {
		return "", fmt.Errorf("user location is outside rider's service area. Please use a Rider Service Provider or A different Rider")
	}

	// Get route coordinates (rider to vendor)
	routeCoordinates, err := GetRouteCoordinates(tx, result)
	if err != nil {
		return "", fmt.Errorf("failed to get route coordinates: %w", err)
	}

	if len(routeCoordinates) < 2 {
		return "", fmt.Errorf("invalid route coordinates")
	}

	riderLocation := routeCoordinates[0]
	vendorLocation := routeCoordinates[1]

	// Parse the isochrone GeoJSON using orb library for better handling
	fc, err := geojson.UnmarshalFeatureCollection(result.GeoJSON)
	if err != nil {
		return "", fmt.Errorf("failed to parse isochrone GeoJSON: %w", err)
	}

	if len(fc.Features) == 0 || fc.Features[0].Geometry == nil {
		return "", fmt.Errorf("invalid isochrone geometry: no features found")
	}

	// Handle different geometry types
	var maxDistanceKm float64
	geometry := fc.Features[0].Geometry

	switch geom := geometry.(type) {
	case orb.Polygon:
		if len(geom) == 0 || len(geom[0]) == 0 {
			return "", fmt.Errorf("invalid polygon geometry: empty coordinates")
		}

		// Calculate max distance from rider to polygon boundary
		for _, ring := range geom {
			for _, point := range ring {
				lng, lat := point[0], point[1]
				distance := Haversine(riderLocation[1], riderLocation[0], lat, lng)
				if distance > maxDistanceKm {
					maxDistanceKm = distance
				}
			}
		}

	case orb.MultiPolygon:
		// Handle MultiPolygon case
		for _, polygon := range geom {
			for _, ring := range polygon {
				for _, point := range ring {
					lng, lat := point[0], point[1]
					distance := Haversine(riderLocation[1], riderLocation[0], lat, lng)
					if distance > maxDistanceKm {
						maxDistanceKm = distance
					}
				}
			}
		}

	default:
		return "", fmt.Errorf("unsupported geometry type in isochrone")
	}

	if maxDistanceKm == 0 {
		return "", fmt.Errorf("could not determine valid service area from isochrone")
	}

	// Calculate distance between rider and vendor
	distanceKm := Haversine(riderLocation[1], riderLocation[0], vendorLocation[1], vendorLocation[0])

	// Check if rider can reach the vendor within the service area
	if distanceKm > maxDistanceKm {
		return "", fmt.Errorf("rider is outside vendor's service area: %.2f km away (max allowed: %.2f km)", distanceKm, maxDistanceKm)
	}

	log.Printf("Rider %s can reach vendor at distance %.2f km and serve user (within %.2f km limit)", riderID, distanceKm, maxDistanceKm)
	return riderID, nil
}