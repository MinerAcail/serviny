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
    if (!data?.getIsochroneResult?.geojson) {
      setError("Failed to fetch isochrone data.")
      setLoading(false)
      return
    }

    // Parse the GeoJSON - handle potential double encoding
    let geojsonData
    const geojsonString = data.getIsochroneResult.geojson

    try {
      geojsonData = JSON.parse(geojsonString)
      // Check if it's a string (double-encoded)
      if (typeof geojsonData === "string") {
        geojsonData = JSON.parse(geojsonData)
      }
    } catch (err) {
      console.error("Failed to parse GeoJSON:", err)
      setError("Failed to parse GeoJSON data.")
      return
    }

    // Extract data from GraphQL response
    if (data.getIsochroneResult.range) {
      setRanges(data.getIsochroneResult.range)
    }

    if (data.getIsochroneResult.transportMode) {
      setTransportMode(data.getIsochroneResult.transportMode as TransportMode)
    }

    // Extract vendor location
    if (data.getIsochroneResult.locations && data.getIsochroneResult.locations.length > 0) {
      const location = data.getIsochroneResult.locations[0]
      setVendorLocation({
        lng: location[0],
        lat: location[1],
        address: data.getIsochroneResult.address || "Vendor Location",
      })
    } else if (geojsonData.metadata?.query?.locations) {
      // Fallback to GeoJSON metadata
      const location = geojsonData.metadata.query.locations[0]
      setVendorLocation({
        lng: location[0],
        lat: location[1],
        address: data.getIsochroneResult.address || "Vendor Location",
      })
    }

    if (geojsonData.features && geojsonData.features.length > 0) {
      // Process the features
      const processedFeatures = geojsonData.features.map((feature: any, index: number) => {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            group_index: index,
            range: ranges[index < ranges.length ? index : ranges.length - 1],
            color: ZONE_COLORS[index % ZONE_COLORS.length],
          },
        }
      })

      setIsochrones(processedFeatures)

      // Calculate zone details
      calculateZoneDetails(processedFeatures, ranges)

      // Update map if already loaded
      if (mapLoaded && mapInstance.current) {
        updateMapIsochrones(processedFeatures, null, mapInstance)
      }
    } else {
      setError("No isochrone data available for this location.")
    }
  } catch (err) {
    console.error("Error processing isochrones:", err)
    setError("An error occurred while processing delivery zones.")
  } finally {
    setLoading(false)
  }
}

// Calculate zone details based on isochrones
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