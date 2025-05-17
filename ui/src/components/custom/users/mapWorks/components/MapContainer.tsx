import React, { useCallback } from "react"
import { MapIcon, Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Coordinates, PointDeliveryInfo } from "../types"
import { DirectionsPanel } from "./DirectionsPanel"
import { PinDropper } from "./PinDropper"

interface MapContainerProps {
  mapRef: React.RefObject<HTMLDivElement>
  mapDivRef: React.RefObject<HTMLDivElement>
  loading: boolean
  isPinDropperMode: boolean
  isMapMoving: boolean
  clickedPoint: Coordinates | null
  centerPointInfo: PointDeliveryInfo | null
  showDirections: boolean
  directionsDistance: number | null
  directionsTime: string | null
  transportMode: string
  togglePinDropperMode: () => void
  confirmPinLocation: () => void
  handleShowDirectionsClick: (destination: Coordinates) => void
  clearDirections: () => void
}

export const MapContainer: React.FC<MapContainerProps> = ({
  mapRef,
  mapDivRef,
  loading,
  isPinDropperMode,
  isMapMoving,
  clickedPoint,
  centerPointInfo,
  showDirections,
  directionsDistance,
  directionsTime,
  transportMode,
  togglePinDropperMode,
  confirmPinLocation,
  handleShowDirectionsClick,
  clearDirections
}) => {
  // Handler for directions button click
  const onShowDirectionsClick = useCallback(() => {
    if (clickedPoint) {
      handleShowDirectionsClick(clickedPoint)
    }
  }, [clickedPoint, handleShowDirectionsClick])

  return (
    <div className="h-[500px] rounded-2xl overflow-hidden border-0 shadow-sm bg-white relative">
      <div ref={mapRef} className="w-full h-full relative rounded-lg" />
      <div
        id="map-service"
        ref={mapDivRef}
        style={{ display: "none" }}
      ></div>

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071E3] mb-2" />
            <p className="text-[#0071E3] font-medium">Loading zones...</p>
          </div>
        </div>
      )}

      {/* Map badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center shadow-sm">
          <MapIcon className="h-3 w-3 mr-1.5 text-[#0071E3]" />
          <span className="font-medium text-[#1D1D1F]">WinneMart</span>
        </div>
      </div>
      
      {/* Pin Dropper UI */}
      <PinDropper
        isPinDropperMode={isPinDropperMode}
        isMapMoving={isMapMoving}
        centerPointInfo={centerPointInfo}
        togglePinDropperMode={togglePinDropperMode}
        confirmPinLocation={confirmPinLocation}
      />

      {/* Directions button - only show when a point has been selected */}
      {clickedPoint && !showDirections && !isPinDropperMode && (
        <div className="absolute top-3 right-12 z-10">
          <Button
            size="sm"
            className="bg-[#0071E3] hover:bg-[#0062C3] text-white text-xs rounded-full px-4 shadow-sm"
            onClick={onShowDirectionsClick}
          >
            <Navigation className="h-3 w-3 mr-1.5" />
            Show Directions
          </Button>
        </div>
      )}

      {/* Directions info panel */}
      <DirectionsPanel 
        showDirections={showDirections}
        directionsDistance={directionsDistance}
        directionsTime={directionsTime}
        transportMode={transportMode as any}
        clearDirections={clearDirections}
      />
    </div>
  )
}