import * as turf from "@turf/turf"
import { gql } from "@apollo/client"

// ==========================================
// Constants and Types
// ==========================================

// GraphQL query for isochrones
export const GET_ISOCHRONE_RESULT = gql`
  query GetIsochroneResult($uuid: String!, $location: [Float!]!) {
    getIsochroneResult(uuid: $uuid, location: $location) {
      geojson
      range
      transportMode
      address
      uuid
      locations
    }
  }
`
// Replace the existing GET_ISOCHRONE_RESULT query
export const GET_ISOCHRONES_BY_RIDER = gql`
  query GetAllIsochronesByRider($riderId: String!) {
    getAllIsochronesByRider(riderId: $riderId) {
      id
      geojson
      range
      transportMode
      address
      locations
    }
  }
`;
// Types
export type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

export type TransportMode = "walking" | "bike" | "motorbike" | "car"
export type RangeType = "time" | "distance"

// Enhanced zone details type
export interface ZoneDetail {
  deliveryFee: number
  estimatedDeliveryTime: string
  description: string
  minimumOrder: number
  color: string
  area: number
  rangeValue: number
}

// Point info for delivery calculations
export interface PointDeliveryInfo {
  inZone: boolean
  zoneIndex?: number
  zone?: ZoneDetail
  deliveryFee: number
  estimatedTime: string
  minimumOrder: number
  distance: string
  travelTime?: number
}

// Conversion speeds in km/h
export const SPEED_MAPPING: Record<string, number> = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60,
}

// Zone colors from green (closest) to red (farthest)
export const ZONE_COLORS = [
  "#4ade80", // green
  "#facc15", // yellow
  "#f87171", // red
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
]

// ==========================================
// Data Processing Functions
// ==========================================

// Process isochrone data from API response

// Process isochrone data from API response - unchanged
// Process isochrone data from API response - with additional logging
export const processIsochroneData = (
  data: any,
  setRanges: (ranges: number[]) => void,
  setTransportMode: (mode: TransportMode) => void,
  setVendorLocation: (location: Location) => void,
  setIsochrones: (isochrones: any[]) => void,
  mapLoaded: boolean,
  mapInstance: React.MutableRefObject<any>,
  updateMapIsochrones: (isochrones: any[], activeZoneIndex: number | null, mapInstance: any) => void,
  calculateZoneDetails: Function,
  setError: (error: string | null) => void,
  setLoading: (loading: boolean) => void,
  ranges: number[]
) => {
  try {
    console.log("Processing isochrone data:", data);
    
    if (!data?.getIsochroneResult?.geojson) {
      console.error("Missing geojson data in response:", data);
      setError("Failed to fetch isochrone data.");
      setLoading(false);
      return;
    }

    // Parse the GeoJSON - handle potential double encoding
    let geojsonData;
    const geojsonString = data.getIsochroneResult.geojson;
    console.log("Raw geojson string length:", geojsonString.length);
    
    try {
      geojsonData = JSON.parse(geojsonString);
      // Check if it's a string (double-encoded)
      if (typeof geojsonData === "string") {
        console.log("Double-encoded GeoJSON detected, parsing again");
        geojsonData = JSON.parse(geojsonData);
      }
    } catch (err) {
      console.error("Failed to parse GeoJSON:", err);
      setError("Failed to parse GeoJSON data.");
      return;
    }

    console.log("Parsed GeoJSON data type:", typeof geojsonData);
    
    // Extract data from GraphQL response
    if (data.getIsochroneResult.range) {
      console.log("Setting ranges:", data.getIsochroneResult.range);
      setRanges(data.getIsochroneResult.range);
    }

    if (data.getIsochroneResult.transportMode) {
      console.log("Setting transport mode:", data.getIsochroneResult.transportMode);
      setTransportMode(data.getIsochroneResult.transportMode as TransportMode);
    }

    // Extract vendor location
    if (data.getIsochroneResult.locations && data.getIsochroneResult.locations.length > 0) {
      const location = data.getIsochroneResult.locations[0];
      console.log("Setting vendor location from locations:", location);
      setVendorLocation({
        lng: location[0],
        lat: location[1],
        address: data.getIsochroneResult.address || "Vendor Location",
      });
    } else if (geojsonData.metadata?.query?.locations) {
      // Fallback to GeoJSON metadata
      const location = geojsonData.metadata.query.locations[0];
      console.log("Setting vendor location from metadata:", location);
      setVendorLocation({
        lng: location[0],
        lat: location[1],
        address: data.getIsochroneResult.address || "Vendor Location",
      });
    }

    if (geojsonData.features && geojsonData.features.length > 0) {
      // Process the features
      console.log("Processing features, count:", geojsonData.features.length);
      
      const processedFeatures = geojsonData.features.map((feature: any, index: number) => {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            group_index: index,
            range: ranges[index < ranges.length ? index : ranges.length - 1],
            color: ZONE_COLORS[index % ZONE_COLORS.length],
          },
        };
      });

      console.log("Processed features, count:", processedFeatures.length);
      setIsochrones(processedFeatures);

      // Calculate zone details
      calculateZoneDetails(processedFeatures, ranges);

      // Update map if already loaded
      if (mapLoaded && mapInstance.current) {
        console.log("Map is loaded, updating isochrones on map (null activeZoneIndex)");
        updateMapIsochrones(processedFeatures, null, mapInstance);
      } else {
        console.log("Map not loaded yet, will update later");
      }
    } else {
      console.error("No features found in GeoJSON data");
      setError("No isochrone data available for this location.");
    }
  } catch (err) {
    console.error("Error processing isochrones:", err);
    setError("An error occurred while processing delivery zones.");
  } finally {
    setLoading(false);
  }
};

// Calculate zone details based on isochrones

// Calculate zone details based on isochrones - unchanged
export const calculateZoneDetails = (
  isoFeatures: any[], 
  ranges: number[],
  rangeType: RangeType = "time",
  transportMode: TransportMode = "car"
) => {
  if (!isoFeatures.length) return []

  const details = isoFeatures.map((feature, index) => {
    // Calculate area in square kilometers
    const area = turf.area(feature) / 1000000

    // Calculate delivery fee (first zone often free)
    const deliveryFee = index === 0 ? 0 : 3 + index * 2

    // Estimate delivery time
    let baseTime: number
    if (rangeType === "time") {
      baseTime = ranges[index < ranges.length ? index : ranges.length - 1] // Already in minutes
    } else {
      baseTime = Math.round(
        (ranges[index < ranges.length ? index : ranges.length - 1] / SPEED_MAPPING[transportMode]) * 60,
      )
    }

    const bufferTime = 5 + index * 5
    const estimatedDeliveryTime = `${baseTime}-${baseTime + bufferTime} min`

    // Zone description
    const description =
      index === 0
        ? "Prime delivery zone with fastest service and no additional fees"
        : index === 1
          ? "Standard delivery zone with moderate delivery times"
          : "Extended delivery zone with longer delivery times"

    // Minimum order
    const minimumOrder = 15 + index * 5

    return {
      deliveryFee,
      estimatedDeliveryTime,
      description,
      minimumOrder,
      color: ZONE_COLORS[index % ZONE_COLORS.length],
      area,
      rangeValue: ranges[index < ranges.length ? index : ranges.length - 1],
    }
  })

  return details
}
// Calculate delivery info for a specific point
export const calculatePointDeliveryInfo = (
  point: [number, number],
  isochrones: any[],
  vendorLocation: Location | null,
  zoneDetails: ZoneDetail[],
  transportMode: string
): PointDeliveryInfo | null => {
  if (!isochrones.length || !vendorLocation) return null

  // Create a GeoJSON point
  const clickedPoint = turf.point(point)

  // Calculate distance from center (vendor location)
  const distance = turf.distance(turf.point([vendorLocation.lng, vendorLocation.lat]), clickedPoint, {
    units: "kilometers",
  })

  // Find which zone contains the point - iterate from smallest to largest
  // We need to reverse-check the zones since larger zones contain smaller ones
  for (let i = 0; i < isochrones.length; i++) {
    if (turf.booleanPointInPolygon(clickedPoint, isochrones[i])) {
      return {
        inZone: true,
        zoneIndex: i,
        zone: zoneDetails[i],
        deliveryFee: zoneDetails[i].deliveryFee,
        estimatedTime: zoneDetails[i].estimatedDeliveryTime,
        minimumOrder: zoneDetails[i].minimumOrder,
        distance: distance.toFixed(2), // Add distance info even for in-zone points
      }
    }
  }

  // If not in any zone, calculate out-of-zone info
  const travelTime = Math.round((distance / SPEED_MAPPING[transportMode]) * 60)
  const deliveryFee = Math.round((3 + distance * 0.5) * 100) / 100
  const estimatedTime = `${travelTime}-${travelTime + 15} min`
  const minimumOrder = 25 + Math.round(distance * 2)

  return {
    inZone: false,
    deliveryFee,
    estimatedTime,
    minimumOrder,
    distance: distance.toFixed(2),
    travelTime,
  }
}



/**
 * Enhanced function to find the best isochrone for a given location
 * with better error handling and performance optimization
 */
export const findBestIsochroneForLocation = (
  point: [number, number],
  allRiderIsochrones: any[]
): { isochroneIndex: number; isInAnyZone: boolean } => {
  if (!allRiderIsochrones || allRiderIsochrones.length === 0) {
    console.warn("No isochrones available to find best match");
    return { isochroneIndex: 0, isInAnyZone: false };
  }
  
  // Default to first isochrone
  let bestIndex = 0;
  let isInAnyZone = false;
  let smallestArea = Infinity;
  
  // Keep track of isochrones containing the point, sorted by area
  const containingIsochrones: { index: number; area: number }[] = [];
  
  // Create a turf point for point-in-polygon checking
  try {
    const clickedPoint = turf.point(point);
    
    // Find all isochrones that contain the point
    for (let i = 0; i < allRiderIsochrones.length; i++) {
      try {
        const isochrone = allRiderIsochrones[i];
        if (!isochrone || !isochrone.geojson) {
          console.warn(`Isochrone at index ${i} is missing or has no geojson`);
          continue;
        }
        
        const geojsonString = isochrone.geojson;
        
        // Parse the GeoJSON
        let geojsonData;
        try {
          geojsonData = JSON.parse(geojsonString);
          // Handle double-encoded JSON
          if (typeof geojsonData === "string") {
            geojsonData = JSON.parse(geojsonData);
          }
        } catch (err) {
          console.error(`Failed to parse GeoJSON for isochrone ${i}:`, err);
          continue;
        }
        
        if (!geojsonData.features || geojsonData.features.length === 0) {
          console.warn(`No features in geojson for isochrone ${i}`);
          continue;
        }
        
        // Check each feature/zone in this isochrone, from smallest to largest
        let isInThisIsochrone = false;
        let smallestContainingFeatureArea = Infinity;
        
        // Try checking with the largest feature first for quick exclusion
        const largestFeatureIndex = geojsonData.features.length - 1;
        const largestFeature = geojsonData.features[largestFeatureIndex];
        
        try {
          // If not in the largest zone, we can skip the rest
          if (!turf.booleanPointInPolygon(clickedPoint, largestFeature)) {
            continue;
          }
          
          // Point is in the largest zone, now check all zones to find the smallest containing one
          isInThisIsochrone = true;
          
          for (const feature of geojsonData.features) {
            if (turf.booleanPointInPolygon(clickedPoint, feature)) {
              try {
                const area = turf.area(feature);
                if (area < smallestContainingFeatureArea) {
                  smallestContainingFeatureArea = area;
                }
              } catch (areaErr) {
                console.warn("Error calculating area:", areaErr);
              }
            }
          }
        } catch (pointInPolyErr) {
          console.warn("Error in point-in-polygon check:", pointInPolyErr);
          continue;
        }
        
        if (isInThisIsochrone) {
          containingIsochrones.push({
            index: i,
            area: smallestContainingFeatureArea
          });
        }
      } catch (isochroneError) {
        console.error(`Error processing isochrone ${i}:`, isochroneError);
        continue;
      }
    }
    
    // If point is in one or more isochrones, select the one with the smallest containing zone
    if (containingIsochrones.length > 0) {
      isInAnyZone = true;
      
      // Sort by area (smallest first)
      containingIsochrones.sort((a, b) => a.area - b.area);
      bestIndex = containingIsochrones[0].index;
      
      console.log(`Found ${containingIsochrones.length} isochrones containing the point. Selected index ${bestIndex}`);
    } else {
      // If not in any isochrone, find the closest one by center point
      console.log("Point not in any isochrone, finding closest center");
      let closestDistance = Infinity;
      
      for (let i = 0; i < allRiderIsochrones.length; i++) {
        try {
          const isochrone = allRiderIsochrones[i];
          if (isochrone.locations && isochrone.locations.length > 0) {
            const isoCenter = isochrone.locations[0]; // [lng, lat]
            
            const distance = turf.distance(
              turf.point(point),
              turf.point(isoCenter),
              { units: "kilometers" }
            );
            
            console.log(`Distance to isochrone ${i} center: ${distance.toFixed(2)} km`);
            
            if (distance < closestDistance) {
              closestDistance = distance;
              bestIndex = i;
            }
          }
        } catch (error) {
          console.warn(`Error calculating distance for isochrone ${i}:`, error);
          continue;
        }
      }
      
      console.log(`Selected closest isochrone at index ${bestIndex}, distance: ${closestDistance.toFixed(2)} km`);
    }
  } catch (error) {
    console.error("Error in findBestIsochroneForLocation:", error);
    // In case of error, return the first isochrone
    return { isochroneIndex: 0, isInAnyZone: false };
  }
  
  return { isochroneIndex: bestIndex, isInAnyZone };
};


// Function to safely parse GeoJSON which might be a string or already an object
export const safeParseGeoJSON = (geojsonData) => {
  if (!geojsonData) return null;
  
  try {
    // If it's already an object, return it
    if (typeof geojsonData === 'object') return geojsonData;
    
    // Parse string to object
    const parsed = JSON.parse(geojsonData);
    
    // Check if it's double encoded (sometimes happens with APIs)
    if (typeof parsed === 'string') {
      return JSON.parse(parsed);
    }
    
    return parsed;
  } catch (error) {
    console.error("Error parsing GeoJSON:", error);
    return null;
  }
};

// Enhanced function to process GeoJSON from various sources
export const processGeoJSONForIsochrone = (geojsonData, ranges) => {
  // Parse the GeoJSON if it's a string
  const parsedGeoJSON = safeParseGeoJSON(geojsonData);
  
  if (!parsedGeoJSON || !parsedGeoJSON.features) {
    console.error("Invalid GeoJSON data:", geojsonData);
    return [];
  }
  
  // Process the features
  return parsedGeoJSON.features.map((feature, index) => {
    return {
      ...feature,
      properties: {
        ...feature.properties,
        group_index: index,
        range: ranges[index < ranges.length ? index : ranges.length - 1],
        color: ZONE_COLORS[index % ZONE_COLORS.length],
      },
    };
  });
};