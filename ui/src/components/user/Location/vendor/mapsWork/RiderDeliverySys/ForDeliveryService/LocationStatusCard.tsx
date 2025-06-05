"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Location, DeliveryCalculation } from "./riderBookingHooks"

interface LocationStatusCardProps {
  pickupLocation: Location | null
  dropoffLocation: Location | null
  calculation: DeliveryCalculation | null
}

export function LocationStatusCard({ pickupLocation, dropoffLocation, calculation }: LocationStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center mr-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <span className="font-medium text-sm">Location Details</span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {pickupLocation && (
            <div className="flex items-center text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <span className="truncate text-xs">Zone Center: {pickupLocation.address.split(",")[0]}</span>
            </div>
          )}
          {dropoffLocation && (
            <div className="flex items-center text-red-700">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              <span className="truncate text-xs">Destination: {dropoffLocation.address.split(",")[0]}</span>
            </div>
          )}
          {calculation && (
            <div className="grid grid-cols-2 mt-2 pt-2 border-t border-gray-100">
              <div className="text-base font-bold text-green-600">${calculation.totalPrice.toFixed(2)}</div>
              <div className="text-sm text-gray-500 text-right">{calculation.distance}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
