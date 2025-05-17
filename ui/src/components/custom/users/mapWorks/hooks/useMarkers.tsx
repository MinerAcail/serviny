import { useState, useRef, useCallback } from "react"
import maplibregl from "maplibre-gl"
import { Coordinates, PointDeliveryInfo } from "../types"

interface UseMarkersProps {
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
  clearDirections?: () => void
}

interface UseMarkersReturn {
  clickMarker: maplibregl.Marker | null
  infoPopup: maplibregl.Popup | null
  clickedPoint: Coordinates | null
  directionsReady: boolean
  createMarkerAtLocation: (lng: number, lat: number, pointInfo: PointDeliveryInfo) => void
  showPointInfoPopup: (point: Coordinates, info: PointDeliveryInfo) => void
  clearAllMarkersAndPopups: () => void
  setClickedPoint: React.Dispatch<React.SetStateAction<Coordinates | null>>
}

export const useMarkers = ({
  mapInstance,
  clearDirections
}: UseMarkersProps): UseMarkersReturn => {
  // Marker and popup state
  const [clickMarker, setClickMarker] = useState<maplibregl.Marker | null>(null)
  const [infoPopup, setInfoPopup] = useState<maplibregl.Popup | null>(null)
  const [clickedPoint, setClickedPoint] = useState<Coordinates | null>(null)
  const [directionsReady, setDirectionsReady] = useState(false)

  // Refs for tracking all markers and popups
  const markersRef = useRef<maplibregl.Marker[]>([])
  const popupsRef = useRef<maplibregl.Popup[]>([])

  // Create marker at a location
  const createMarkerAtLocation = useCallback(
    (lng: number, lat: number, pointInfo: PointDeliveryInfo) => {
      if (!mapInstance.current) return

      // Create new marker
      const marker = new maplibregl.Marker({
        color: pointInfo.inZone ? pointInfo.zone!.color : "#9CA3AF",
      })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current)

      // Track this marker in our state arrays
      markersRef.current.push(marker)

      // Also set in the individual state for backward compatibility
      setClickMarker(marker)

      // Store clicked point for future reference
      setClickedPoint({ lng, lat })

      // Show info popup
      showPointInfoPopup({ lng, lat }, pointInfo)

      // Indicate that we have a point that can be used for directions
      setDirectionsReady(true)
    },
    [mapInstance]
  )

  // Show info popup for a point
  const showPointInfoPopup = useCallback(
    (point: Coordinates, info: PointDeliveryInfo) => {
      if (!mapInstance.current) return

      // Remove existing popup
      if (infoPopup) {
        infoPopup.remove()
      }

      const map = mapInstance.current

      // Create popup content with iOS-style design
      let content = ""

      if (info.inZone) {
        content = `
        <div class="p-4 font-sans">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${info.zone!.color}"></div>
            <h3 class="font-medium text-[15px] text-[#1D1D1F]">Zone ${info.zoneIndex! + 1}</h3>
          </div>
          <div class="space-y-2 text-[13px] text-[#1D1D1F]">
            <div class="flex justify-between">
              <span class="text-[#86868B]">Distance</span>
              <span class="font-medium">${info.distance} km</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#86868B]">Delivery Fee</span>
              <span class="font-medium">${info.deliveryFee === 0 ? "Free" : "$" + info.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#86868B]">Estimated Time</span>
              <span class="font-medium">${info.estimatedTime}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#86868B]">Minimum Order</span>
              <span class="font-medium">$${info.minimumOrder.toFixed(2)}</span>
            </div>
          </div>
          <p class="mt-3 text-[12px] text-[#86868B]">${info.zone!.description}</p>
          <button id="show-directions-btn" class="mt-3 px-3 py-1.5 bg-[#0071E3] text-white text-xs rounded-full w-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Show Directions
          </button>
        </div>
      `
      } else {
        content = `
        <div class="p-4 font-sans">
          <div class="flex items-center mb-2">
            <div class="w-3 h-3 rounded-full mr-2 bg-[#9CA3AF]"></div>
            <h3 class="font-medium text-[15px] text-[#1D1D1F]">Outside Delivery Zones</h3>
          </div>
          <div class="space-y-2 text-[13px] text-[#1D1D1F]">
            <div class="flex justify-between">
              <span class="text-[#86868B]">Distance</span>
              <span class="font-medium">${info.distance} km</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#86868B]">Delivery Fee</span>
              <span class="font-medium">$${info.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#86868B]">Estimated Time</span>
              <span class="font-medium">${info.estimatedTime}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-[#86868B]">Minimum Order</span>
              <span class="font-medium">$${info.minimumOrder.toFixed(2)}</span>
            </div>
          </div>
          <p class="mt-3 text-[12px] text-[#86868B]">Extended delivery fees apply to this location</p>
          <button id="show-directions-btn" class="mt-3 px-3 py-1.5 bg-[#0071E3] text-white text-xs rounded-full w-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Show Directions
          </button>
        </div>
      `
      }

      // Create and show popup with iOS-style design
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false,
        maxWidth: "280px",
        className: "ios-style-popup",
      })
        .setLngLat([point.lng, point.lat])
        .setHTML(content)
        .addTo(map)

      // Track this popup
      popupsRef.current.push(popup)
      setInfoPopup(popup)
    },
    [infoPopup, mapInstance]
  )

  // Clear all markers and popups
  const clearAllMarkersAndPopups = useCallback(() => {
    // Remove all markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    // Remove all popups
    popupsRef.current.forEach((popup) => popup.remove())
    popupsRef.current = []

    // Reset individual marker/popup state
    if (clickMarker) {
      clickMarker.remove()
      setClickMarker(null)
    }

    if (infoPopup) {
      infoPopup.remove()
      setInfoPopup(null)
    }

    setClickedPoint(null)
    setDirectionsReady(false)

    // Clear directions if function provided
    if (clearDirections) {
      clearDirections()
    }
  }, [clickMarker, infoPopup, clearDirections])

  return {
    clickMarker,
    infoPopup,
    clickedPoint,
    directionsReady,
    createMarkerAtLocation,
    showPointInfoPopup,
    clearAllMarkersAndPopups,
    setClickedPoint
  }
}