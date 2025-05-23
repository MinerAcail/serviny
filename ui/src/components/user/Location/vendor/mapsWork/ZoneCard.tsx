"use client"

import { useState } from "react"
import { Compass } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ZoneCardProps {
  index: number
  zone: {
    color: string
    deliveryFee: number
    area: number
  }
  activeZoneIndex: number | null
  onClick?: () => void
}

export function ZoneCard({ index, zone, activeZoneIndex, onClick }: ZoneCardProps) {
  const [isPressed, setIsPressed] = useState(false)
  const isActive = activeZoneIndex === index

  return (
    <div
      className="relative"
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 border-0 rounded-2xl",
          "bg-white/80 backdrop-blur-md",
          isActive ? "ring-2 ring-[#0071E3]" : "ring-1 ring-black/5",
          isPressed ? "scale-[0.98] shadow-sm" : "scale-100 shadow-md",
        )}
        onClick={onClick}
      >
        <div className="p-4 space-y-3">
          {/* Zone indicator pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="text-sm font-medium text-[#1D1D1F]">Zone {index + 1}</span>
            </div>
            <div className="flex items-center text-xs text-[#86868B]">
              <Compass className="h-3.5 w-3.5 mr-1" />
              <span>{zone.area.toFixed(1)} km²</span>
            </div>
          </div>

          {/* Delivery fee */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#86868B]">Delivery Fee</span>
            <span className={cn("text-lg font-semibold", zone.deliveryFee === 0 ? "text-[#34C759]" : "text-[#1D1D1F]")}>
              {zone.deliveryFee === 0 ? "Free" : `$${zone.deliveryFee.toFixed(2)}`}
            </span>
          </div>

          {/* Progress indicator for active state */}
          {isActive && (
            <div className="w-full h-1 bg-[#F2F2F7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0071E3]"
                style={{ width: `${Math.min(100, zone.area * 10)}%` }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* SF Symbol-like decorative element */}
      {isActive && (
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-[#0071E3] flex items-center justify-center shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
