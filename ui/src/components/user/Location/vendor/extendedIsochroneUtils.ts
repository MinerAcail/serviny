/**
 * Enhanced Isochrone Utilities
 * Provides improved functionality for extending isochrones using Turf.js with better
 * performance, accuracy, and visualization capabilities.
 */

import * as turf from '@turf/turf';

// Maximum time limit for OpenRouteService API in seconds
export const MAX_ORS_TIME_SECONDS = 3600; // 1 hour

// Types for isochrone data
export interface IsochroneZone {
  id: string;
  geojson: any; // The GeoJSON polygon
  isOriginal: boolean; // Whether this is the original isochrone or an extension
  sourcePoint: [number, number]; // The source point [lng, lat] that generated this isochrone
  rangeInSeconds: number; // Time range in seconds
  transportMode: string; // Transport mode used
  areaInSqKm?: number; // Area in square kilometers
  additionalCoverage?: any; // The difference between this zone and the existing coverage
  timestamp?: number; // When this zone was created
  compactness?: number; // Compactness ratio (1 = perfect circle)
  boundaryLength?: number; // Boundary length in kilometers
}

/**
 * Generates a unique ID for a zone
 */
export function generateZoneId(): string {
  return `zone_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

/**
 * Calculate the area of a GeoJSON polygon in square kilometers
 */
export function calculateArea(geojson: any): number {
  if (!geojson) return 0;
  
  try {
    const area = turf.area(geojson);
    return area / 1000000; // Convert from square meters to square kilometers
  } catch (error) {
    console.error("Error calculating area:", error);
    return 0;
  }
}

/**
 * Calculate the length of a polygon's boundary in kilometers
 */
export function calculateBoundaryLength(geojson: any): number {
  if (!geojson) return 0;
  
  try {
    // For Polygon type
    if (geojson.geometry.type === 'Polygon') {
      const line = turf.lineString(geojson.geometry.coordinates[0]);
      return turf.length(line, { units: 'kilometers' });
    } 
    // For MultiPolygon type
    else if (geojson.geometry.type === 'MultiPolygon') {
      let totalLength = 0;
      geojson.geometry.coordinates.forEach((polygon: any) => {
        const line = turf.lineString(polygon[0]);
        totalLength += turf.length(line, { units: 'kilometers' });
      });
      return totalLength;
    }
    return 0;
  } catch (error) {
    console.error("Error calculating boundary length:", error);
    return 0;
  }
}

/**
 * Calculate the compactness ratio of a polygon
 * Formula: 4π * area / (perimeter²)
 * A circle has compactness of 1 (most compact)
 */
export function calculateCompactness(geojson: any): number {
  if (!geojson) return 0;
  
  try {
    const area = turf.area(geojson);
    const perimeter = calculateBoundaryLength(geojson) * 1000; // Convert to meters
    
    if (perimeter === 0) return 0;
    
    const compactness = (4 * Math.PI * area) / (perimeter * perimeter);
    
    // Clamp to 0-1 and round
    return Math.min(1, Math.max(0, parseFloat(compactness.toFixed(2))));
  } catch (error) {
    console.error("Error calculating compactness:", error);
    return 0;
  }
}

/**
 * Calculates the difference between a new zone and existing coverage
 * Returns the portion of the new zone that wasn't already covered
 * with optimized handling of complex geometry
 */
export function calculateNewCoverage(newZone: any, existingCoverage: any): any {
  if (!existingCoverage) {
    return newZone; // If there's no existing coverage, the entire new zone is additional
  }

  try {
    // Simplify geometries slightly to avoid topology errors
    const simplifiedNewZone = turf.simplify(newZone, { tolerance: 0.00001 });
    const simplifiedExistingCoverage = turf.simplify(existingCoverage, { tolerance: 0.00001 });
    
    // Use turf.difference to calculate the difference
    const difference = turf.difference(simplifiedNewZone, simplifiedExistingCoverage);
    
    // If difference is null, it means the new zone is completely contained in the existing coverage
    if (!difference) {
      return null;
    }
    
    // Calculate area of the difference and only return it if significant
    const diffArea = calculateArea(difference);
    if (diffArea < 0.01) { // Less than 0.01 km² is considered negligible
      return null;
    }
    
    return difference;
  } catch (error) {
    console.error("Error calculating difference between zones:", error);
    // Fallback: If the difference operation fails, try using a buffer approach
    try {
      // Buffer the existing coverage slightly inward to avoid edge artifacts
      const bufferedExisting = turf.buffer(existingCoverage, -0.01, { units: 'kilometers' });
      return turf.difference(newZone, bufferedExisting);
    } catch (innerError) {
      console.error("Fallback difference calculation also failed:", innerError);
      // In case all attempts fail, return null (no additional coverage)
      return null;
    }
  }
}

/**
 * Merges multiple isochrone zones into a single GeoJSON polygon
 * with improved handling of complex geometries
 */
export function mergeZones(zones: IsochroneZone[]): any {
  if (!zones.length) return null;
  if (zones.length === 1) return zones[0].geojson;

  try {
    // Start with the first zone
    let mergedPolygon = zones[0].geojson;
    
    // Union with each subsequent zone
    for (let i = 1; i < zones.length; i++) {
      try {
        // Simplify geometries slightly before union to avoid topology errors
        const simplifiedMerged = turf.simplify(mergedPolygon, { tolerance: 0.00001 });
        const simplifiedCurrent = turf.simplify(zones[i].geojson, { tolerance: 0.00001 });
        
        const union = turf.union(simplifiedMerged, simplifiedCurrent);
        if (union) {
          mergedPolygon = union;
        }
      } catch (error) {
        console.error(`Error merging zone ${i}:`, error);
        // Alternative approach using buffer to handle complex geometries
        try {
          // Create a tiny buffer to fix potential topology issues
          const bufferedMerged = turf.buffer(mergedPolygon, 0.001, { units: 'kilometers' });
          const bufferedCurrent = turf.buffer(zones[i].geojson, 0.001, { units: 'kilometers' });
          
          const union = turf.union(bufferedMerged, bufferedCurrent);
          if (union) {
            mergedPolygon = union;
          }
        } catch (bufferError) {
          console.error(`Buffer-based union also failed for zone ${i}:`, bufferError);
          // Continue with what we have
        }
      }
    }
    
    return mergedPolygon;
  } catch (error) {
    console.error("Error merging zones:", error);
    return zones[0].geojson; // Return the first one if merger fails
  }
}

/**
 * Process a new isochrone zone, calculating its unique coverage and merging it with existing zones
 * with enhanced error handling and additional metrics
 */
export function processNewIsochroneZone(
  newZoneGeojson: any, 
  existingZones: IsochroneZone[], 
  sourcePoint: [number, number],
  rangeInSeconds: number,
  transportMode: string,
  isOriginal: boolean = false
): { 
  newZone: IsochroneZone, 
  mergedCoverage: any,
  allZones: IsochroneZone[]
} {
  // Create the merged coverage from existing zones
  const existingCoverage = mergeZones(existingZones);
  
  // Calculate the additional coverage provided by this new zone
  const additionalCoverage = calculateNewCoverage(newZoneGeojson, existingCoverage);
  
  // Calculate area metrics
  const areaInSqKm = calculateArea(newZoneGeojson);
  const boundaryLength = calculateBoundaryLength(newZoneGeojson);
  const compactness = calculateCompactness(newZoneGeojson);
  
  // Create the new zone object with enhanced metrics
  const newZone: IsochroneZone = {
    id: generateZoneId(),
    geojson: newZoneGeojson,
    isOriginal,
    sourcePoint,
    rangeInSeconds,
    transportMode,
    areaInSqKm,
    boundaryLength,
    compactness,
    additionalCoverage,
    timestamp: Date.now()
  };
  
  // Add the new zone to the list
  const allZones = [...existingZones, newZone];
  
  // Merge all zones together
  const mergedCoverage = mergeZones(allZones);
  
  return {
    newZone,
    mergedCoverage,
    allZones
  };
}

/**
 * Intelligently selects optimal boundary points for extending isochrones
 * using an improved algorithm that considers both distance and directional coverage
 */
export function selectOptimalBoundaryPoints(
  isochronePolygon: any, 
  numPoints: number = 8,
  existingPoints: [number, number][] = []
): [number, number][] {
  if (!isochronePolygon || !isochronePolygon.geometry) return [];
  
  try {
    const geometry = isochronePolygon.geometry || isochronePolygon;
    let coordinates: number[][] = [];
    
    // Extract coordinates based on geometry type
    if (geometry.type === 'Polygon' && geometry.coordinates && geometry.coordinates.length > 0) {
      coordinates = geometry.coordinates[0]; // Outer ring
    } else if (geometry.type === 'MultiPolygon' && geometry.coordinates) {
      // Find the largest polygon
      let maxLength = 0;
      geometry.coordinates.forEach((poly: number[][][]) => {
        if (poly[0] && poly[0].length > maxLength) {
          coordinates = poly[0];
          maxLength = poly[0].length;
        }
      });
    }
    
    if (coordinates.length < 3) return []; // Not a valid polygon
    
    // Create a simplified version of the polygon for analysis
    const simplified = turf.simplify(isochronePolygon, { tolerance: 0.01 });
    
    // Get the centroid
    const centroid = turf.centroid(simplified);
    const centerCoords = centroid.geometry.coordinates;
    
    // Calculate distances from centroid to boundary points
    const boundaryWithDistances = coordinates.map(coord => {
      const distance = turf.distance(centerCoords, coord, { units: 'kilometers' });
      // Calculate bearing (direction) from center to point
      const bearing = turf.bearing(centerCoords, coord);
      return {
        coord,
        distance,
        bearing
      };
    });
    
    // Filter out points too close to each other (within 10% of the max distance)
    const filteredPoints: { coord: number[], distance: number, bearing: number }[] = [];
    const maxDist = Math.max(...boundaryWithDistances.map(p => p.distance));
    const minDistBetweenPoints = maxDist * 0.1;
    
    // First, divide the circle into sectors for better directional distribution
    const sectors: { sector: number, points: typeof boundaryWithDistances[0][] }[] = [];
    for (let i = 0; i < 8; i++) {
      sectors.push({
        sector: i,
        points: []
      });
    }
    
    // Assign points to sectors based on bearing
    boundaryWithDistances.forEach(point => {
      const normalizedBearing = (point.bearing + 360) % 360;
      const sectorIndex = Math.floor(normalizedBearing / 45);
      sectors[sectorIndex].points.push(point);
    });
    
    // Get the furthest point in each sector
    sectors.forEach(sector => {
      if (sector.points.length > 0) {
        // Sort by distance (descending) to prioritize points furthest from center
        sector.points.sort((a, b) => b.distance - a.distance);
        
        // Get the furthest point that's not too close to existing points
        const validPoint = sector.points.find(point => {
          return existingPoints.every(existingPoint => {
            return turf.distance(point.coord, existingPoint, { units: 'kilometers' }) >= minDistBetweenPoints;
          });
        });
        
        if (validPoint) {
          filteredPoints.push(validPoint);
        }
      }
    });
    
    // Sort by distance (descending) to prioritize points furthest from center
    filteredPoints.sort((a, b) => b.distance - a.distance);
    
    // Take the top N points, respecting maximum requested
    return filteredPoints.slice(0, numPoints).map(p => p.coord as [number, number]);
  } catch (error) {
    console.error("Error selecting optimal boundary points:", error);
    return [];
  }
}

/**
 * Suggests optimal points to add to extend coverage further
 * with improved distribution and coverage optimization
 */
export function suggestExtensionPoints(
  currentZones: IsochroneZone[],
  mergedCoverage: any,
  numSuggestions: number = 3
): [number, number][] {
  if (!mergedCoverage || currentZones.length === 0) return [];
  
  // Get all existing source points
  const existingPoints = currentZones.map(zone => zone.sourcePoint);
  
  // Calculate the convex hull of the merged coverage to find the overall shape
  let convexHull;
  try {
    const points = turf.explode(mergedCoverage);
    convexHull = turf.convex(points);
  } catch (error) {
    console.error("Error calculating convex hull:", error);
    convexHull = mergedCoverage; // Fallback to the original coverage
  }
  
  // Find optimal boundary points based on the convex hull (for better extension)
  return selectOptimalBoundaryPoints(convexHull || mergedCoverage, numSuggestions, existingPoints);
}

/**
 * Helper function to create a GeoJSON feature from a point
 * with improved properties for visualization
 */
export function createPointFeature(coordinates: [number, number], properties: any = {}): any {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates
    },
    properties: {
      // Default properties for visualization
      pointColor: "#4ade80",
      pointSize: 6,
      pointStrokeWidth: 1,
      pointStrokeColor: "#ffffff",
      // Override with custom properties
      ...properties
    }
  };
}

/**
 * Creates a GeoJSON feature collection for visualization
 * with enhanced styling and feature properties
 */
export function createVisualizationData(
  zones: IsochroneZone[], 
  mergedCoverage: any,
  showAdditionalAreas: boolean = true
): any {
  const features = [];
  
  // Add the merged coverage polygon
  if (mergedCoverage) {
    features.push({
      ...mergedCoverage,
      properties: {
        ...mergedCoverage.properties,
        isMergedCoverage: true,
        fillColor: "#4ade80",
        fillOpacity: 0.3,
        strokeColor: "#10b981",
        strokeWidth: 2,
        area_km2: calculateArea(mergedCoverage)
      }
    });
  }
  
  // Add additional coverage areas if requested
  if (showAdditionalAreas) {
    zones.forEach((zone, index) => {
      if (zone.additionalCoverage) {
        const additionalArea = calculateArea(zone.additionalCoverage);
        features.push({
          ...zone.additionalCoverage,
          properties: {
            ...zone.additionalCoverage.properties,
            isAdditionalCoverage: true,
            zoneId: zone.id,
            fillColor: "#60a5fa",
            fillOpacity: 0.5,
            strokeColor: "#2563eb",
            strokeWidth: 1,
            zIndex: index + 1,
            area_km2: additionalArea,
            percent_increase: zone.areaInSqKm ? 
              Math.round((additionalArea / zone.areaInSqKm) * 100) : 0
          }
        });
      }
    });
  }
  
  // Add source points with improved styling
  zones.forEach((zone, index) => {
    // Different styling for original vs extension points
    const pointColor = zone.isOriginal ? "#ef4444" : "#8b5cf6";
    const pointSize = zone.isOriginal ? 10 : 8;
    const label = zone.isOriginal ? "Origin" : `Extension ${index}`;
    
    features.push(createPointFeature(zone.sourcePoint, {
      isSourcePoint: true,
      zoneId: zone.id,
      isOriginal: zone.isOriginal,
      pointColor,
      pointSize,
      label,
      additionalArea: zone.additionalCoverage ? 
        calculateArea(zone.additionalCoverage).toFixed(2) + " km²" : "0 km²"
    }));
  });
  
  // Add suggested extension points with improved visibility
  const suggestedPoints = suggestExtensionPoints(zones, mergedCoverage, 3);
  
  suggestedPoints.forEach((point, index) => {
    features.push(createPointFeature(point, {
      isSuggestedPoint: true,
      pointColor: "#f97316", // Orange
      pointSize: 6,
      pointStrokeColor: "#ffffff",
      pointStrokeWidth: 2,
      label: `Suggested ${index + 1}`,
      zIndex: 1000 + index // Ensure they're on top
    }));
  });
  
  return {
    type: "FeatureCollection",
    features
  };
}

/**
 * Analyze the extended isochrone coverage and provide comprehensive statistical insights
 */
export function analyzeExtendedCoverage(
  originalZone: IsochroneZone | null, 
  extendedZones: IsochroneZone[],
  mergedCoverage: any
): {
  totalArea: number;
  originalArea: number;
  extendedArea: number;
  extensionPercentage: number;
  uniqueCoverage: number;
  uniqueCoveragePercentage: number;
  pointEfficiency: { pointId: string, addedArea: number, efficiency: number }[];
  overallCompactness: number;
  boundaryLength: number;
} {
  // Default values
  const result = {
    totalArea: 0,
    originalArea: 0,
    extendedArea: 0,
    extensionPercentage: 0,
    uniqueCoverage: 0,
    uniqueCoveragePercentage: 0,
    pointEfficiency: [] as { pointId: string, addedArea: number, efficiency: number }[],
    overallCompactness: 0,
    boundaryLength: 0
  };
  
  // Calculate the total merged area
  if (mergedCoverage) {
    result.totalArea = calculateArea(mergedCoverage);
    result.boundaryLength = calculateBoundaryLength(mergedCoverage);
    result.overallCompactness = calculateCompactness(mergedCoverage);
  }
  
  // Find the original zone
  const original = originalZone || extendedZones.find(z => z.isOriginal);
  
  if (original) {
    result.originalArea = original.areaInSqKm || calculateArea(original.geojson);
    
    // Calculate extension stats
    result.extendedArea = result.totalArea - result.originalArea;
    result.extensionPercentage = result.originalArea > 0 
      ? (result.extendedArea / result.originalArea) * 100 
      : 0;
    
    // Calculate unique coverage
    result.uniqueCoverage = extendedZones
      .filter(zone => !zone.isOriginal && zone.additionalCoverage)
      .reduce((sum, zone) => {
        return sum + (zone.additionalCoverage ? calculateArea(zone.additionalCoverage) : 0);
      }, 0);
      
    result.uniqueCoveragePercentage = result.totalArea > 0 
      ? (result.uniqueCoverage / result.totalArea) * 100 
      : 0;
      
    // Calculate point efficiency
    result.pointEfficiency = extendedZones
      .filter(zone => !zone.isOriginal)
      .map(zone => {
        const addedArea = zone.additionalCoverage ? calculateArea(zone.additionalCoverage) : 0;
        const efficiency = result.originalArea > 0 
          ? (addedArea / result.originalArea) * 100 
          : 0;
          
        return {
          pointId: zone.id,
          addedArea,
          efficiency
        };
      })
      .sort((a, b) => b.efficiency - a.efficiency);
  }
  
  return result;
}

/**
 * Create a comprehensive coverage report with enhanced information
 */
export function createCoverageReport(
  vendorLocation: { lat: number, lng: number, address: string },
  rangeType: string,
  transportMode: string,
  ranges: number[],
  extendedZones: IsochroneZone[],
  mergedCoverage: any
): any {
  // Calculate statistics
  const originalZone = extendedZones.find(z => z.isOriginal);
  const stats = analyzeExtendedCoverage(originalZone || null, extendedZones, mergedCoverage);
  
  // Format transport mode for display
  const formatTransportMode = (mode: string): string => {
    switch (mode) {
      case "walking": return "Walking";
      case "bike": return "Cycling";
      case "motorbike": return "Motorcycle";
      case "car": return "Driving";
      default: return mode;
    }
  };
  
  // Calculate delivery time estimates
  const calculateTimeEstimates = () => {
    // Conversion speeds in km/h
    const SPEED_MAPPING: Record<string, number> = {
      walking: 5,
      bike: 15,
      motorbike: 30,
      car: 60
    };
    
    // Get the speed for selected mode
    const speed = SPEED_MAPPING[transportMode] || 30;
    
    // Calculate radius in kilometers (assuming roughly circular shape)
    const radius = Math.sqrt(stats.totalArea / Math.PI);
    
    // Estimate travel time in minutes
    return {
      radius_km: parseFloat(radius.toFixed(1)),
      estimated_time_minutes: parseFloat(((radius / speed) * 60).toFixed(1)),
      speed_kmh: speed
    };
  };
  
  // Get extension points metrics
  const getExtensionMetrics = () => {
    const extensionPoints = extendedZones.filter(zone => !zone.isOriginal);
    
    return {
      count: extensionPoints.length,
      total_additional_area: extensionPoints.reduce((sum, zone) => {
        return sum + (zone.additionalCoverage ? calculateArea(zone.additionalCoverage) : 0);
      }, 0),
      average_addition_per_point: extensionPoints.length > 0 
        ? stats.extendedArea / extensionPoints.length 
        : 0,
      most_efficient_point: stats.pointEfficiency[0] || null
    };
  };
  
  // Create report
  return {
    vendor: {
      location: vendorLocation,
      transportMode: formatTransportMode(transportMode),
      rangeType,
      ranges
    },
    coverage: {
      totalAreaKm2: stats.totalArea,
      originalAreaKm2: stats.originalArea,
      extendedAreaKm2: stats.extendedArea,
      extensionPercentage: stats.extensionPercentage,
      uniqueCoverageKm2: stats.uniqueCoverage,
      uniqueCoveragePercentage: stats.uniqueCoveragePercentage,
      boundaryLengthKm: stats.boundaryLength,
      compactness: stats.overallCompactness,
      pointsAdded: extendedZones.filter(z => !z.isOriginal).length,
      totalPoints: extendedZones.length
    },
    timeEstimates: calculateTimeEstimates(),
    extensionMetrics: getExtensionMetrics(),
    pointEfficiency: stats.pointEfficiency,
    suggestedNextPoints: suggestExtensionPoints(extendedZones, mergedCoverage, 3),
    visualizationData: createVisualizationData(extendedZones, mergedCoverage),
    timestamp: new Date().toISOString()
  };
}