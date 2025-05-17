import * as turf from "@turf/turf"
import { Coordinates, PointDeliveryInfo,  TransportMode } from "../types"
import { SPEED_MAPPING } from "../constants"

/**
 * Calculate distance between two points in kilometers
 */
export const calculateDistance = (
  point1: Coordinates,
  point2: Coordinates
): number => {
  return turf.distance(
    turf.point([point1.lng, point1.lat]),
    turf.point([point2.lng, point2.lat]),
    { units: "kilometers" }
  )
}

/**
 * Check if a point is inside a polygon
 */
export const isPointInPolygon = (
  point: Coordinates,
  polygon: any
): boolean => {
  return turf.booleanPointInPolygon(
    turf.point([point.lng, point.lat]),
    polygon
  )
}

/**
 * Calculate area of a polygon in square kilometers
 */
export const calculateArea = (polygon: any): number => {
  return turf.area(polygon) / 1000000 // Convert from m² to km²
}

/**
 * Format distance string
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`
  }
  return `${distance.toFixed(2)} km`
}

/**
 * Format delivery fee
 */
export const formatDeliveryFee = (fee: number): string => {
  return fee === 0 ? "Free" : `$${fee.toFixed(2)}`
}

/**
 * Calculate estimated travel time based on distance and transport mode
 */
export const calculateTravelTime = (
  distanceKm: number,
  transportMode: TransportMode
): number => {
  return Math.round((distanceKm / SPEED_MAPPING[transportMode]) * 60) // Return minutes
}

/**
 * Format travel time range
 */
export const formatTimeRange = (
  baseTimeMinutes: number,
  bufferMinutes: number = 5
): string => {
  return `${baseTimeMinutes}-${baseTimeMinutes + bufferMinutes} min`
}

/**
 * Generate out-of-zone delivery info
 */
export const generateOutOfZoneInfo = (
  distance: number,
  transportMode: TransportMode
): Partial<PointDeliveryInfo> => {
  const travelTime = calculateTravelTime(distance, transportMode)
  const deliveryFee = Math.round((3 + distance * 0.5) * 100) / 100
  const minimumOrder = 25 + Math.round(distance * 2)

  return {
    inZone: false,
    deliveryFee,
    estimatedTime: formatTimeRange(travelTime, 15),
    minimumOrder,
    distance: distance.toFixed(2),
    travelTime,
  }
}