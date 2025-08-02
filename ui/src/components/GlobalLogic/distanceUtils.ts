import { point, distance } from '@turf/turf';

// Types for location coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export type DropoffLocation = [number, number]; // [lat, lng]

/**
 * Calculate distance between two coordinate points using Turf.js
 * @param from - Starting point coordinates
 * @param to - Destination point coordinates
 * @param units - Distance units (default: kilometers)
 * @returns Distance in specified units
 */
export function calculateDistance(
  from: Coordinates,
  to: Coordinates,
  units: 'kilometers' | 'miles' | 'meters' = 'kilometers'
): number {
  try {
    const fromPoint = point([from.lng, from.lat]);
    const toPoint = point([to.lng, to.lat]);
    
    const calculatedDistance = distance(fromPoint, toPoint, { units });
    
    return Number(calculatedDistance.toFixed(2));
  } catch (error) {
    console.error('Error calculating distance:', error);
    return 0;
  }
}

/**
 * Calculate distance from pickup location to delivery item dropoff location
 * @param pickupLocation - Pickup location object
 * @param deliveryItem - Delivery item with dropoffLocation [lat, lng]
 * @param units - Distance units (default: kilometers)
 * @returns Distance in specified units
 */
export function calculatePickupToDeliveryDistance(
  pickupLocation: Location,
  dropoffLocation: DropoffLocation,
  units: 'kilometers' | 'miles' | 'meters' = 'kilometers'
): number {
  try {
    const from: Coordinates = {
      lat: pickupLocation.lat,
      lng: pickupLocation.lng
    };
    
    const to: Coordinates = {
      lat: dropoffLocation[0],  // dropoffLocation is [lat, lng]
      lng: dropoffLocation[1]
    };
    
    return calculateDistance(from, to, units);
  } catch (error) {
    console.error('Error calculating pickup to delivery distance:', error);
    return 0;
  }
}

/**
 * Calculate distance between two locations
 * @param location1 - First location
 * @param location2 - Second location
 * @param units - Distance units (default: kilometers)
 * @returns Distance in specified units
 */
export function calculateLocationDistance(
  location1: Location,
  location2: Location,
  units: 'kilometers' | 'miles' | 'meters' = 'kilometers'
): number {
  const from: Coordinates = {
    lat: location1.lat,
    lng: location1.lng
  };
  
  const to: Coordinates = {
    lat: location2.lat,
    lng: location2.lng
  };
  
  return calculateDistance(from, to, units);
}

/**
 * Calculate multiple distances from one pickup point to multiple delivery points
 * @param pickupLocation - Pickup location
 * @param deliveryLocations - Array of delivery locations
 * @param units - Distance units (default: kilometers)
 * @returns Array of distances corresponding to each delivery location
 */
export function calculateMultipleDistances(
  pickupLocation: Location,
  deliveryLocations: DropoffLocation[],
  units: 'kilometers' | 'miles' | 'meters' = 'kilometers'
): number[] {
  return deliveryLocations.map(dropoffLocation => 
    calculatePickupToDeliveryDistance(pickupLocation, dropoffLocation, units)
  );
}

/**
 * Find the closest delivery location to pickup
 * @param pickupLocation - Pickup location
 * @param deliveryLocations - Array of delivery locations with IDs
 * @param units - Distance units (default: kilometers)
 * @returns Object with closest location info
 */
export function findClosestDelivery(
  pickupLocation: Location,
  deliveryLocations: Array<{ id: string; dropoffLocation: DropoffLocation; address?: string }>,
  units: 'kilometers' | 'miles' | 'meters' = 'kilometers'
): { id: string; distance: number; address?: string } | null {
  if (deliveryLocations.length === 0) return null;
  
  let closest = deliveryLocations[0];
  let minDistance = calculatePickupToDeliveryDistance(
    pickupLocation, 
    closest.dropoffLocation, 
    units
  );
  
  for (let i = 1; i < deliveryLocations.length; i++) {
    const currentDistance = calculatePickupToDeliveryDistance(
      pickupLocation,
      deliveryLocations[i].dropoffLocation,
      units
    );
    
    if (currentDistance < minDistance) {
      minDistance = currentDistance;
      closest = deliveryLocations[i];
    }
  }
  
  return {
    id: closest.id,
    distance: minDistance,
    address: closest.address
  };
}

/**
 * Calculate total distance for a multi-delivery route
 * @param pickupLocation - Starting pickup location
 * @param deliveryLocations - Array of delivery locations in route order
 * @param units - Distance units (default: kilometers)
 * @returns Total route distance
 */
export function calculateTotalRouteDistance(
  pickupLocation: Location,
  deliveryLocations: DropoffLocation[],
  units: 'kilometers' | 'miles' | 'meters' = 'kilometers'
): number {
  if (deliveryLocations.length === 0) return 0;
  
  let totalDistance = 0;
  const currentLocation: Coordinates = {
    lat: pickupLocation.lat,
    lng: pickupLocation.lng
  };
  
  // Calculate distance from pickup to first delivery
  totalDistance += calculateDistance(
    currentLocation,
    { lat: deliveryLocations[0][0], lng: deliveryLocations[0][1] },
    units
  );
  
  // Calculate distances between consecutive deliveries
  for (let i = 1; i < deliveryLocations.length; i++) {
    const from: Coordinates = {
      lat: deliveryLocations[i - 1][0],
      lng: deliveryLocations[i - 1][1]
    };
    
    const to: Coordinates = {
      lat: deliveryLocations[i][0],
      lng: deliveryLocations[i][1]
    };
    
    totalDistance += calculateDistance(from, to, units);
  }
  
  return Number(totalDistance.toFixed(2));
}