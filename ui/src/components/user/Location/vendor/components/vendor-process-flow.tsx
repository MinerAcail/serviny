"use client"

import { useState } from "react"
import { LocationStep } from "../location-step"
import { TransportStep } from "./transport-step"
import { TimeStep } from "./time-step"
import { ResultStep } from "./result-step"
// import { StepIndicator } from "./step-indicator"
import { Card } from "@/components/ui/card"
import { StepIndicator } from "./step-indicator"
type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"

export function VendorProcessFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [location, setLocation] = useState<Location | null>(null)
  const [transportMode, setTransportMode] = useState<TransportMode>("car")
  const [timeRanges, setTimeRanges] = useState<number[]>([10, 20, 30])
  const [isochrones, setIsochrones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation)
  }

  const handleTransportSelect = (mode: TransportMode) => {
    setTransportMode(mode)

    // Update default time ranges based on transport mode
    if (mode === "walking" || mode === "bike") {
      setTimeRanges([10, 20, 30])
    } else {
      setTimeRanges([20, 30, 60])
    }
  }

  const handleTimeSelect = (ranges: number[]) => {
    setTimeRanges(ranges)
  }

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateIsochrones = async () => {
    if (!location) return

    setIsLoading(true)
    setError(null)

    try {
      // Convert minutes to seconds for the API
      const rangesInSeconds = timeRanges.map((minutes) => minutes * 60)

      // Create request payload
      const requestPayload = {
        locations: [[location.lng, location.lat]], // OpenRouteService expects [longitude, latitude]
        range: rangesInSeconds,
        range_type: "time",
        attributes: ["total_pop"],
        location_type: "start",
        area_units: "km",
      }

      // This would be your actual API call
      // For demo purposes, we'll simulate a response
      // In a real app, you would use:
      /*
      const response = await fetch("https://api.openrouteservice.org/v2/isochrones/driving-car", {
        method: "POST",
        headers: {
          "Authorization": "YOUR_API_KEY",
          "Content-Type": "application/json",
          "Accept": "application/json, application/geo+json"
        },
        body: JSON.stringify(requestPayload)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || "Failed to generate isochrones")
      }

      const data = await response.json()
      setIsochrones(data.features)
      */

      // Simulate API response delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock isochrone data
      const mockIsochrones = timeRanges.map((time, index) => ({
        type: "Feature",
        properties: {
          value: index,
          center: [location.lng, location.lat],
          time: time * 60,
        },
        geometry: {
          type: "Polygon",
          coordinates: [
            // This would be the actual polygon coordinates from the API
            // For demo purposes, we're creating simple circles
            Array.from({ length: 20 }).map((_, i) => {
              const angle = (i / 20) * Math.PI * 2
              const radius = 0.01 * (index + 1) // Larger radius for each time range
              return [location.lng + Math.cos(angle) * radius, location.lat + Math.sin(angle) * radius]
            }),
          ],
        },
      }))

      setIsochrones(mockIsochrones)
      nextStep() // Move to results step
    } catch (error) {
      console.error("Error generating isochrones:", error)
      setError(error instanceof Error ? error.message : "Failed to generate isochrones")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-[#2C2C2E]">
        {currentStep === 1 && (
          <LocationStep onLocationSelect={handleLocationSelect} selectedLocation={location} onNext={nextStep} />
        )}

        {currentStep === 2 && (
          <TransportStep
            selectedMode={transportMode}
            onTransportSelect={handleTransportSelect}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 && (
          <TimeStep
            transportMode={transportMode}
            timeRanges={timeRanges}
            onTimeSelect={handleTimeSelect}
            onGenerate={generateIsochrones}
            onBack={prevStep}
            isLoading={isLoading}
          />
        )}

        {currentStep === 4 && (
          <ResultStep
            location={location}
            transportMode={transportMode}
            timeRanges={timeRanges}
            isochrones={isochrones}
            onBack={prevStep}
            error={error}
          />
        )}
      </Card>
    </div>
  )
}
