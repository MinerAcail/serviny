// Types for location data
export type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

// Transportation modes
export type TransportMode = "walking" | "bike" | "motorbike" | "car"

// Range type (time or distance)
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

// Coordinates interface for common use
export interface Coordinates {
  lng: number
  lat: number
}

// Libraries to load with the Google Maps API
export type Libraries = Array<
  | "drawing"
  | "geometry"
  | "localContext"
  | "places"
  | "visualization"
>