import { useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import { Coordinates, PointDeliveryInfo } from "../types"

interface UsePinDropperProps {
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
  calculatePointDeliveryInfo: (point: [number, number]) => PointDeliveryInfo | null
  clearAllMarkersAndPopups: () => void
  createMarkerAtLocation: (lng: number, lat: number, pointInfo: PointDeliveryInfo) => void
}

interface UsePinDropperReturn {
  isPinDropperMode: boolean
  isMapMoving: boolean
  centerPoint: Coordinates | null
  centerPointInfo: PointDeliveryInfo | null
  togglePinDropperMode: () => void
  handleMapMove: () => void
  handleMapMoveEnd: () => void
  confirmPinLocation: () => void
}

export const usePinDropper = ({
  mapInstance,
  calculatePointDeliveryInfo,
  clearAllMarkersAndPopups,
  createMarkerAtLocation
}: UsePinDropperProps): UsePinDropperReturn => {
  // State for pin dropper
  const [isPinDropperMode, setIsPinDropperMode] = useState(false)
  const [centerPoint, setCenterPoint] = useState<Coordinates | null>(null)
  const [isMapMoving, setIsMapMoving] = useState(false)
  const [centerPointInfo, setCenterPointInfo] = useState<PointDeliveryInfo | null>(null)

  // Toggle pin dropper mode
  const togglePinDropperMode = useCallback(() => {
    if (!mapInstance.current) return;

    // If currently in pin dropper mode, exit it
    if (isPinDropperMode) {
      setIsPinDropperMode(false);
      setCenterPoint(null);
      setCenterPointInfo(null);
    } else {
      // Clear existing markers and popups before entering pin dropper mode
      clearAllMarkersAndPopups();
      
      // Enter pin dropper mode
      setIsPinDropperMode(true);
      
      // Get the current center of the map
      const center = mapInstance.current.getCenter();
      const centerCoords: [number, number] = [center.lng, center.lat];
      
      // Set center point
      setCenterPoint({ lng: center.lng, lat: center.lat });
      
      // Calculate delivery info for center point
      const pointInfo = calculatePointDeliveryInfo(centerCoords);
      if (pointInfo) {
        setCenterPointInfo(pointInfo);
      }
    }
  }, [
    isPinDropperMode, 
    mapInstance, 
    clearAllMarkersAndPopups, 
    calculatePointDeliveryInfo
  ])

  // Handle map move events for pin dropper mode
  const handleMapMove = useCallback(() => {
    if (isPinDropperMode && mapInstance.current) {
      setIsMapMoving(true);
    }
  }, [isPinDropperMode, mapInstance])

  // Handle map moveend event for pin dropper
  const handleMapMoveEnd = useCallback(() => {
    if (isPinDropperMode && mapInstance.current) {
      setIsMapMoving(false);
      
      // Get the current center of the map
      const center = mapInstance.current.getCenter();
      const centerCoords: [number, number] = [center.lng, center.lat];
      
      // Update center point
      setCenterPoint({ lng: center.lng, lat: center.lat });
      
      // Calculate delivery info for center point
      const pointInfo = calculatePointDeliveryInfo(centerCoords);
      if (pointInfo) {
        setCenterPointInfo(pointInfo);
      }
    }
  }, [isPinDropperMode, mapInstance, calculatePointDeliveryInfo])

  // Place a marker at the center point
  const confirmPinLocation = useCallback(() => {
    if (!mapInstance.current || !centerPoint || !centerPointInfo) return;
    
    // Exit pin dropper mode
    setIsPinDropperMode(false);
    
    // Create marker and show popup
    createMarkerAtLocation(centerPoint.lng, centerPoint.lat, centerPointInfo);
  }, [
    mapInstance, 
    centerPoint, 
    centerPointInfo, 
    createMarkerAtLocation
  ])

  return {
    isPinDropperMode,
    isMapMoving,
    centerPoint,
    centerPointInfo,
    togglePinDropperMode,
    handleMapMove,
    handleMapMoveEnd,
    confirmPinLocation
  }
}