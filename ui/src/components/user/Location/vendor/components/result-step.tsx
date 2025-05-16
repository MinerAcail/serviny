"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, AlertCircle, MapPin, Clock } from "lucide-react"
import { IsochroneMap } from "./isochrone-map"

type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

interface ResultStepProps {
  location: Location | null
  transportMode: TransportMode
  rangeType: RangeType
  ranges: number[] // Original ranges (either distance or time)
  timeRanges: number[] // Converted time ranges in minutes (for API and display)
  isochrones: any[]
  onBack: () => void
  error: string | null
}

export function ResultStep({ 
  location, 
  transportMode, 
  rangeType,
  ranges,
  timeRanges, 
  isochrones, 
  onBack, 
  error 
}: ResultStepProps) {
  if (!location) return null

  // Generate a color palette for any number of zones
  const generateZoneColors = (count: number) => {
    // Base colors for first 3 zones
    const baseColors = ["#4ade80", "#facc15", "#f87171"]
    
    if (count <= 3) return baseColors.slice(0, count)
    
    // For more than 3 zones, generate additional colors
    const colors = [...baseColors]
    
    // Add more colors if needed
    const additionalColors = [
      "#60a5fa", // blue
      "#c084fc", // purple
      "#2dd4bf", // teal
      "#fb923c", // orange
      "#f472b6"  // pink
    ]
    
    for (let i = 3; i < count; i++) {
      if (i - 3 < additionalColors.length) {
        colors.push(additionalColors[i - 3])
      } else {
        // If we run out of predefined colors, generate random ones
        // But make them somewhat visually distinct from each other
        const hue = (i * 137) % 360 // Golden angle approximation for even distribution
        colors.push(`hsl(${hue}, 70%, 60%)`)
      }
    }
    
    return colors
  }

  const zoneColors = generateZoneColors(ranges.length)

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Delivery Zones</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your delivery zones based on {transportMode} travel {rangeType}
          </p>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error generating delivery zones</p>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <Card className="bg-[#F5F5F7] dark:bg-[#2C2C2E] border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-[#0071E3] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-[#1D1D1F] dark:text-white">Vendor Location</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{location.address}</p>
                </div>
              </div>
            </Card>

            {/* Map with isochrones */}
            <div className="h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2C2C2E]">
              <IsochroneMap vendorLocation={location} isochrones={isochrones} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ranges.map((value, index) => (
                <Card key={index} className="border-t-4" style={{ borderTopColor: zoneColors[index] }}>
                  <div className="p-4">
                    <h3 className="font-medium text-[#1D1D1F] dark:text-white">Zone {index + 1}</h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        {rangeType === "distance" ? (
                          <MapPin className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <p>
                          {index === 0 ? "0" : ranges[index - 1]}-{value} {rangeType === "distance" ? "km" : "min"}
                        </p>
                      </div>
                      
                      {rangeType === "distance" && (
                        <p className="text-xs mt-1">
                          (~{index === 0 ? "0" : timeRanges[index - 1]}-{timeRanges[index]} min travel time)
                        </p>
                      )}
                      {rangeType === "time" && (
                        <p className="text-xs mt-1">
                          (~{index === 0 ? "0" : Math.round(((ranges[index - 1] / 60) * SPEED_MAPPING[transportMode]) * 10) / 10}-
                          {Math.round(((value / 60) * SPEED_MAPPING[transportMode]) * 10) / 10} km travel distance)
                        </p>
                      )}
                    </div>
                    <p className="text-lg font-semibold mt-2">
                      {index === 0 ? 
                        "Base Price" : 
                        `Base + $${Math.min(index * 3, 15)}.${index % 2 === 0 ? '00' : '50'}`
                      }
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-full px-5 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium">
            Save Delivery Zones
          </Button>
        </div>
      </div>
    </div>
  )
}

// Conversion speeds in km/h - copied here for distance calculation
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60
}