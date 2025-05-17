import { useState, useRef, useEffect, useCallback } from "react"
import maplibregl from "maplibre-gl"
import { createMapStyleUrl, createMapInstance } from "../utils/mapHelpers"
import { Location } from "../types"
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../constants"

interface UseMapInstanceProps {
  maptilerApiKey?: string
  initialCenter?: [number, number]
  initialZoom?: number
  vendorLocation?: Location | null
  onMapClick?: (e: maplibregl.MapMouseEvent) => void
  onMapMove?: () => void
  onMapMoveEnd?: () => void
}

interface UseMapInstanceReturn {
  mapRef: React.RefObject<HTMLDivElement>
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
  mapLoaded: boolean
  createVendorMarker: (location: Location) => maplibregl.Marker | null
}

export const useMapInstance = ({
  maptilerApiKey,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  vendorLocation,
  isPinDropperMode,
  handleMapMove,
  handleMapMoveEnd,
  onMapClick,
  onMapMove,
  onMapMoveEnd
}: UseMapInstanceProps): UseMapInstanceReturn => {
  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const vendorMarkerRef = useRef<maplibregl.Marker | null>(null)
  
  // State
  const [mapLoaded, setMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    // Create map style URL
    const mapStyle = createMapStyleUrl(maptilerApiKey)

    // Use vendor location as center if available
    const center = vendorLocation
      ? [vendorLocation.lng, vendorLocation.lat] as [number, number]
      : initialCenter

    // Create new map
    const map = createMapInstance(mapRef.current, center, initialZoom, mapStyle)
    mapInstance.current = map

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right")

    // Add attribution
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      })
    )

    // Add click handler for map
    if (onMapClick) {
      map.on("click", onMapClick)
    }
    
    // Add move handlers
    if (onMapMove) {
      map.on("move", onMapMove)
    }
    
    if (onMapMoveEnd) {
      map.on("moveend", onMapMoveEnd)
    }

    // Set map as loaded
    map.on("load", () => {
      setMapLoaded(true)
    })

    // Cleanup function
    return () => {
      if (vendorMarkerRef.current) {
        vendorMarkerRef.current.remove()
      }
      
      map.remove()
    }
  }, [
    maptilerApiKey, 
    initialCenter, 
    initialZoom, 
    vendorLocation, 
    onMapClick, 
    onMapMove, 
    onMapMoveEnd
  ])
// Add this to your useMapInstance hook:
useEffect(() => {
  if (!mapInstance.current) return;
  
  // Add event listeners for pin dropper
  if (isPinDropperMode) {
    mapInstance.current.on('move', handleMapMove);
    mapInstance.current.on('moveend', handleMapMoveEnd);
  }
  
  return () => {
    if (mapInstance.current) {
      mapInstance.current.off('move', handleMapMove);
      mapInstance.current.off('moveend', handleMapMoveEnd);
    }
  };
}, [isPinDropperMode, handleMapMove, handleMapMoveEnd, mapInstance]);
  // Create vendor marker
  const createVendorMarker = useCallback((location: Location): maplibregl.Marker | null => {
    if (!mapInstance.current) return null

    // Remove existing vendor marker if any
    if (vendorMarkerRef.current) {
      vendorMarkerRef.current.remove()
    }

    // Create vendor marker
    const marker = new maplibregl.Marker({ color: "#0071E3" })
      .setLngLat([location.lng, location.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`<strong>${location.address}</strong>`)
      )
      .addTo(mapInstance.current)

    // Store marker reference
    vendorMarkerRef.current = marker

    return marker
  }, [])

  return {
    mapRef,
    mapInstance,
    mapLoaded,
    createVendorMarker
  }
}