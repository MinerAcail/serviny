"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, AlertCircle, MapPin } from "lucide-react"
import { IsochroneMap } from "./isochrone-map"

type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"

interface ResultStepProps {
  location: Location | null
  transportMode: TransportMode
  timeRanges: number[]
  isochrones: any[]
  onBack: () => void
  error: string | null
}

export function ResultStep({ location, transportMode, timeRanges, isochrones, onBack, error }: ResultStepProps) {
  if (!location) return null

  const zoneColors = ["#4ade80", "#facc15", "#f87171"]

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Delivery Zones</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your delivery zones based on {transportMode} travel time
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {timeRanges.map((time, index) => (
                <Card key={index} className="border-t-4" style={{ borderTopColor: zoneColors[index] }}>
                  <div className="p-4">
                    <h3 className="font-medium text-[#1D1D1F] dark:text-white">Zone {index + 1}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {index === 0 ? "0" : timeRanges[index - 1]}-{time} min
                    </p>
                    <p className="text-lg font-semibold mt-2">
                      {index === 0 ? "Base Price" : `Base + $${index * 3}.00`}
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
