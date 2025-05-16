/**
 * Extended Isochrone Utilities
 * Provides functionality to generate isochrones beyond OpenRouteService's 1-hour limit
 * using a chaining approach with Turf.js.
 */

import * as turf from '@turf/turf';

// Maximum time limit for OpenRouteService API (in seconds)
export const MAX_ORS_TIME_SECONDS = 3600; // 1 hour

interface ExtendedIsochroneOptions {
  locations: number[][]; // [[lng, lat], ...] coordinates
  maxRangeSeconds: number; // Total desired range in seconds
  transportMode: string; // "walking", "bike", "motorbike", "car"
  apiRequestFn: (coords: number[][], rangeSeconds: number[], transportMode: string) => Promise<any>;
  samplePointsCount?: number; // Number of edge points to sample (default: 8)
  buffer?: number; // Buffer distance in kilometers for sample points (default: 0.2)
}

/**
 * Generates extended isochrones beyond the OpenRouteService API limit
 * by chaining multiple isochrone requests and merging the results.
 */
export async function generateExtendedIsochrones({
  locations,
  maxRangeSeconds,
  transportMode,
  apiRequestFn,
  samplePointsCount = 8,
  buffer = 0.2
}: ExtendedIsochroneOptions): Promise<any> {
  
  // If within API limits, just make a single request
  if (maxRangeSeconds <= MAX_ORS_TIME_SECONDS) {
    return await apiRequestFn(locations, [maxRangeSeconds], transportMode);
  }

  // Calculate how many "hops" we need
  const hopsNeeded = Math.ceil(maxRangeSeconds / MAX_ORS_TIME_SECONDS);
  console.log(`Generating extended isochrone with ${hopsNeeded} hops`);
  
  // Start with initial locations
  let currentPoints = [...locations];
  let allIsochrones: any[] = [];
  let allSourcePoints: number[][] = [...locations]; // Track all source points
  let remainingSeconds = maxRangeSeconds;

  // Process each hop
  for (let hop = 0; hop < hopsNeeded; hop++) {
    // For the last hop, use remaining seconds, otherwise use max allowed
    const currentRangeSeconds = Math.min(remainingSeconds, MAX_ORS_TIME_SECONDS);
    
    // Skip if we don't have any remaining seconds
    if (currentRangeSeconds <= 0) break;
    
    console.log(`Hop ${hop+1}/${hopsNeeded}: From ${currentPoints.length} points, range: ${currentRangeSeconds} seconds`);
    
    try {
      // Request isochrones for current points
      const response = await apiRequestFn(currentPoints, [currentRangeSeconds], transportMode);
      
      // Parse the GeoJSON
      const geojsonData = typeof response.data?.generateIsochrone?.geojson === 'string' 
        ? JSON.parse(response.data.generateIsochrone.geojson)
        : response.data?.generateIsochrone?.geojson;
      
      if (!geojsonData?.features || !geojsonData.features.length) {
        throw new Error(`Invalid GeoJSON response in hop ${hop+1}`);
      }
      
      // Add to our collection
      allIsochrones.push(...geojsonData.features);
      
      // If we've reached the last hop, we're done
      if (hop === hopsNeeded - 1) break;
      
      // Get next set of sample points from the isochrone boundaries
      currentPoints = [];
      
      for (const feature of geojsonData.features) {
        const points = samplePointsFromPolygon(feature, samplePointsCount, buffer);
        currentPoints.push(...points);
      }
      
      // Add to the collection of all source points
      allSourcePoints.push(...currentPoints);
      
      // Update remaining seconds
      remainingSeconds -= currentRangeSeconds;
      
    } catch (error) {
      console.error(`Error in isochrone hop ${hop+1}:`, error);
      // Return what we have so far if there's an error
      break;
    }
  }
  
  // Combine all isochrones into a single polygon using Turf.js
  const mergedIsochrone = mergeIsochrones(allIsochrones);
  
  // Return as GeoJSON FeatureCollection
  return {
    data: {
      generateIsochrone: {
        geojson: JSON.stringify({
          type: "FeatureCollection",
          features: [
            {
              ...mergedIsochrone,
              properties: {
                ...mergedIsochrone.properties,
                value: maxRangeSeconds,
                total_pop: allIsochrones.reduce((sum, iso) => sum + (iso.properties?.total_pop || 0), 0),
                group_index: 0, // Single isochrone result
                extended: true,
                source_points: allSourcePoints
              }
            }
          ]
        })
      }
    }
  };
}

/**
 * Samples points from the boundary of a polygon feature
 */
function samplePointsFromPolygon(feature: any, count: number, bufferDistance: number): number[][] {
  try {
    // Get the polygon coordinates
    if (!feature.geometry || !feature.geometry.coordinates) {
      console.error("Invalid feature geometry", feature);
      return [];
    }
    
    // Create a line from the polygon boundary
    let line;
    if (feature.geometry.type === 'Polygon') {
      // Use outer ring of the polygon
      line = turf.lineString(feature.geometry.coordinates[0]);
    } else if (feature.geometry.type === 'MultiPolygon') {
      // Get the largest polygon from the multi-polygon
      let maxArea = 0;
      let largestPolygon: number[][] = [];
      
      for (const polygonCoords of feature.geometry.coordinates) {
        const poly = turf.polygon([polygonCoords[0]]);
        const area = turf.area(poly);
        if (area > maxArea) {
          maxArea = area;
          largestPolygon = polygonCoords[0];
        }
      }
      
      line = turf.lineString(largestPolygon);
    } else {
      console.error("Unsupported geometry type:", feature.geometry.type);
      return [];
    }
    
    // Sample points along the boundary
    const length = turf.length(line);
    const interval = length / count;
    
    const points: number[][] = [];
    for (let i = 0; i < count; i++) {
      const distance = i * interval;
      const point = turf.along(line, distance);
      
      // Move the point slightly inward to avoid edge effects
      const bufferedPoint = turf.buffer(point, bufferDistance, {units: 'kilometers'});
      const center = turf.center(bufferedPoint);
      
      points.push(center.geometry.coordinates);
    }
    
    return points;
  } catch (error) {
    console.error("Error sampling points from polygon:", error);
    return [];
  }
}

/**
 * Merges multiple isochrone polygons into a single polygon
 */
function mergeIsochrones(isochrones: any[]): any {
  if (!isochrones.length) return null;
  if (isochrones.length === 1) return isochrones[0];
  
  try {
    // Start with the first isochrone
    let merged = isochrones[0];
    
    // Merge with each subsequent isochrone
    for (let i = 1; i < isochrones.length; i++) {
      try {
        const union = turf.union(merged, isochrones[i]);
        if (union) merged = union;
      } catch (error) {
        console.error(`Error merging isochrone ${i}:`, error);
        // Continue with what we have
      }
    }
    
    return merged;
  } catch (error) {
    console.error("Error merging isochrones:", error);
    return isochrones[0]; // Return the first one if merger fails
  }
}

/**
 * Client-side utility to visualize extended isochrones
 * This function can be used directly in the browser to visualize extended isochrones
 * without relying on server-side processing.
 */
export function visualizeExtendedIsochrone(geojson: any, options: {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  showSourcePoints?: boolean;
} = {}) {
  // Default options
  const {
    fillColor = "#4ade80",
    fillOpacity = 0.4,
    strokeColor = "#10b981",
    strokeWidth = 2,
    showSourcePoints = false
  } = options;

  // Parse GeoJSON if it's a string
  const geojsonData = typeof geojson === 'string' ? JSON.parse(geojson) : geojson;
  
  // Ensure it's a valid GeoJSON object
  if (!geojsonData || !geojsonData.features) {
    console.error("Invalid GeoJSON data", geojsonData);
    return null;
  }
  
  // Find extended isochrones
  const extendedFeatures = geojsonData.features.filter((f: any) => 
    f.properties && f.properties.extended === true
  );
  
  if (extendedFeatures.length === 0) {
    console.log("No extended isochrones found in the GeoJSON data");
    // Just return the original GeoJSON
    return geojsonData;
  }
  
  // Create a styled version of the GeoJSON for visualization
  const styledGeoJSON = {
    ...geojsonData,
    features: geojsonData.features.map((feature: any) => {
      const isExtended = feature.properties && feature.properties.extended === true;
      
      // Apply special styling to extended isochrones
      if (isExtended) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            strokeColor: strokeColor,
            strokeWidth: strokeWidth,
            isExtended: true
          }
        };
      }
      
      // Keep regular isochrones as is
      return feature;
    })
  };
  
  // Add source points if requested
  if (showSourcePoints) {
    for (const feature of extendedFeatures) {
      if (feature.properties && feature.properties.source_points) {
        const sourcePoints = feature.properties.source_points;
        
        // Create a new feature for each source point
        for (const point of sourcePoints) {
          styledGeoJSON.features.push({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: point
            },
            properties: {
              isSourcePoint: true,
              pointColor: "#f87171",
              pointSize: 5
            }
          });
        }
      }
    }
  }
  
  return styledGeoJSON;
}