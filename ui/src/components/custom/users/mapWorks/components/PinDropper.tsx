import React from "react"
import { MapPin, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PointDeliveryInfo } from "../types"
import { formatDeliveryFee } from "../utils/geoCalculations"

interface PinDropperProps {
  isPinDropperMode: boolean
  isMapMoving: boolean
  centerPointInfo: PointDeliveryInfo | null
  togglePinDropperMode: () => void
  confirmPinLocation: () => void
}

export const PinDropper: React.FC<PinDropperProps> = ({
  isPinDropperMode,
  isMapMoving,
  centerPointInfo,
  togglePinDropperMode,
  confirmPinLocation
}) => {
  if (!isPinDropperMode) {
    return (
      <div className="absolute top-3 right-20 z-10">
        <Button
          size="sm"
          className="bg-[#0071E3] hover:bg-[#0062C3] text-white text-xs rounded-full px-4 shadow-sm"
          onClick={togglePinDropperMode}
        >
          <MapPin className="h-3 w-3 mr-1.5" />
          Drop Pin
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Pin Dropper Cancel Button */}
      <div className="absolute top-3 right-20 z-10">
        <Button
          size="sm"
          className="bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs rounded-full px-4 shadow-sm"
          onClick={togglePinDropperMode}
        >
          <X className="h-3 w-3 mr-1.5" />
          Cancel
        </Button>
      </div>

      {/* Fixed centered pin */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <div className="flex flex-col items-center">
          {/* Pin shadow (expands during movement) */}
          <div 
            className={`w-4 h-4 rounded-full bg-black/20 transform scale-75 transition-transform duration-200 mb-1 ${
              isMapMoving ? "scale-100" : "scale-75"
            }`} 
          />
          
          {/* Pin itself */}
          <div className="flex flex-col items-center" style={{ marginTop: "-4px" }}>
            <MapPin 
              size={32} 
              className={`text-[#0071E3] drop-shadow-md transition-all duration-200 ${
                isMapMoving ? "translate-y-0" : "translate-y-[-4px]"
              }`} 
              strokeWidth={2} 
              fill={centerPointInfo?.inZone 
                ? centerPointInfo.zone?.color || "#0071E3" 
                : "#9CA3AF"}
            />
          </div>
        </div>
      </div>
      
      {/* Confirm location button */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20">
        <Button
          onClick={confirmPinLocation}
          className="bg-[#0071E3] hover:bg-[#0062C3] text-white px-6 py-2 rounded-full shadow-md"
        >
          <Check className="h-4 w-4 mr-2" />
          Confirm Location
        </Button>
      </div>
      
      {/* Location info card */}
      {centerPointInfo && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-3 max-w-[280px] border border-[#E5E5EA]">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-center">
              {centerPointInfo.inZone 
                ? `Zone ${centerPointInfo.zoneIndex! + 1}`
                : "Outside Delivery Zones"}
            </p>
            <div className="flex justify-between text-xs">
              <span className="text-[#86868B]">Delivery Fee</span>
              <span className="font-medium">
                {formatDeliveryFee(centerPointInfo.deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#86868B]">Est. Time</span>
              <span className="font-medium">{centerPointInfo.estimatedTime}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#86868B]">Distance</span>
              <span className="font-medium">{centerPointInfo.distance} km</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}