import { useCallback } from "react"
import * as turf from "@turf/turf"
import { Location, PointDeliveryInfo, ZoneDetail, TransportMode } from "../types"
import { calculateDistance, generateOutOfZoneInfo } from "../utils/geoCalculations"

interface UseZoneCalculationsProps {
  isochrones: any[]
  zoneDetails: ZoneDetail[]
  vendorLocation: Location | null
  transportMode: TransportMode
}

interface UseZoneCalculationsReturn {
  calculatePointDeliveryInfo: (point: [number, number]) => PointDeliveryInfo | null
}

export const useZoneCalculations = ({
  isochrones,
  zoneDetails,
  vendorLocation,
  transportMode
}: UseZoneCalculationsProps): UseZoneCalculationsReturn => {
  
  // Calculate delivery info for a specific point
  const calculatePointDeliveryInfo = useCallback(
    (point: [number, number]): PointDeliveryInfo | null => {
      if (!isochrones.length || !vendorLocation) return null

      // Create a GeoJSON point
      const clickedPoint = turf.point(point)

      // Calculate distance from center (vendor location)
      const distance = calculateDistance(
        { lng: vendorLocation.lng, lat: vendorLocation.lat },
        { lng: point[0], lat: point[1] }
      )

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
      return {
        ...generateOutOfZoneInfo(distance, transportMode),
        distance: distance.toFixed(2),
      } as PointDeliveryInfo
    },
    [isochrones, vendorLocation, zoneDetails, transportMode]
  )

  return {
    calculatePointDeliveryInfo
  }
}