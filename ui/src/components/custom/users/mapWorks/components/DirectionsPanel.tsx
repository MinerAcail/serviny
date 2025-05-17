import React from "react"
import { Navigation } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TransportMode } from "../types"

interface DirectionsPanelProps {
  showDirections: boolean
  directionsDistance: number | null
  directionsTime: string | null
  transportMode: TransportMode
  clearDirections: () => void
}

export const DirectionsPanel: React.FC<DirectionsPanelProps> = ({
  showDirections,
  directionsDistance,
  directionsTime,
  transportMode,
  clearDirections
}) => {
  if (!showDirections || directionsDistance === null || !directionsTime) {
    return null
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-4 max-w-xs border border-[#E5E5EA]">
      <div className="flex items-center mb-2">
        <div className="h-6 w-6 rounded-full bg-[#0071E3] flex items-center justify-center mr-2">
          <Navigation className="h-3 w-3 text-white" />
        </div>
        <h3 className="font-medium text-[#1D1D1F]">
          Route Details
        </h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#86868B]">Distance</span>
          <span className="font-medium">
            {directionsDistance.toFixed(2)} km
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#86868B]">Est. Travel Time</span>
          <span className="font-medium">{directionsTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#86868B]">Transport Mode</span>
          <span className="font-medium">
            {transportMode.charAt(0).toUpperCase() + transportMode.slice(1)}
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="mt-3 text-xs w-full rounded-full border-[#0071E3] text-[#0071E3]"
        onClick={clearDirections}
      >
        Hide Directions
      </Button>
    </div>
  )
}