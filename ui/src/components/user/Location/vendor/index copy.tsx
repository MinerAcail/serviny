"use client"

import { useState } from "react"
import { LocationStep } from "./location-step"
import { TransportStep } from "./components/transport-step"
import { ZoneConfigStep } from "./components/zone-config-step"
import { ResultStep } from "./result-step"
import { Card } from "@/components/ui/card"
import { StepIndicator } from "./components/step-indicator"
import { gql } from "@apollo/client"

export const GET_ISOCHRONE = gql`
  query GetIsochrone($input: IsochroneInput!) {
    getIsochrone(input: $input) {
      geojson
    }
  }
`
type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

const envApiKey = import.meta.env.VITE_OPENROUTE_SERVICE_API_KEY;

// Conversion speeds in km/h
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60
}

// Maximum allowed range in seconds for the API
const MAX_RANGE_SECONDS = 3600; // 1 hour / 3600 seconds

export function VendorProcessFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [location, setLocation] = useState<Location | null>(null)
  const [transportMode, setTransportMode] = useState<TransportMode>("car")
  const [rangeType, setRangeType] = useState<RangeType>("distance") // Default to distance-based
  const [ranges, setRanges] = useState<number[]>([10, 20, 30]) // in km or minutes depending on rangeType
  const [isochrones, setIsochrones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation)
  }

  const handleTransportSelect = (mode: TransportMode) => {
    setTransportMode(mode)

    // Update default ranges based on transport mode and current range type
    if (rangeType === "distance") {
      let newDistanceRanges: number[] = [10, 20, 30]
      
      if (mode === "walking") {
        newDistanceRanges = [1, 2, 4]
      } else if (mode === "bike") {
        newDistanceRanges = [3, 5, 8]
      } else if (mode === "motorbike") {
        newDistanceRanges = [5, 10, 15]
      } else if (mode === "car") {
        newDistanceRanges = [10, 20, 30]
      }
      
      setRanges(newDistanceRanges)
    } else {
      // Time ranges - Ensure they don't exceed the maximum allowed range (60 minutes)
      if (mode === "walking" || mode === "bike") {
        setRanges([10, 20, 30])
      } else {
        setRanges([15, 30, 45])
      }
    }
  }

  const handleRangeTypeChange = (type: RangeType) => {
    setRangeType(type)
    
    // Convert current ranges to the new type
    if (type === "distance" && rangeType === "time") {
      // Convert from time (minutes) to distance (km)
      const speed = SPEED_MAPPING[transportMode] // km/h
      const newRanges = ranges.map(time => {
        // Convert minutes to km: (time / 60) * speed
        return Math.round(((time / 60) * speed) * 10) / 10 // Round to 1 decimal
      })
      setRanges(newRanges)
    } else if (type === "time" && rangeType === "distance") {
      // Convert from distance (km) to time (minutes)
      const speed = SPEED_MAPPING[transportMode] // km/h
      const newRanges = ranges.map(distance => {
        // Convert km to minutes: (distance / speed) * 60
        return Math.round((distance / speed) * 60)
      })
      
      // Ensure no time range exceeds 60 minutes (API limit)
      const cappedRanges = newRanges.map(time => Math.min(time, 60))
      setRanges(cappedRanges)
    }
  }

  const handleRangesChange = (newRanges: number[]) => {
    // If time-based, ensure no range exceeds 60 minutes
    if (rangeType === "time") {
      const cappedRanges = newRanges.map(time => Math.min(time, 60))
      setRanges(cappedRanges)
    } else {
      setRanges(newRanges)
    }
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

  // Convert ranges to time ranges (in minutes) for the API
  const getTimeRangesForApi = (): number[] => {
    if (rangeType === "time") {
      // Cap all time values at 60 minutes (API limit)
      return ranges.map(time => Math.min(time, 60))
    } else {
      // Convert from distance to time
      const speed = SPEED_MAPPING[transportMode] // km/h
      const timeRanges = ranges.map(distance => {
        // Convert km to minutes: (distance / speed) * 60
        return Math.round((distance / speed) * 60)
      })
      
      // Cap all time values at 60 minutes
      return timeRanges.map(time => Math.min(time, 60))
    }
  }

  const generateIsochrones = async () => {
    if (!location) return

    setIsLoading(true)
    setError(null)

    try {
      // Get time ranges in minutes
      const timeRanges = getTimeRangesForApi()
      
      // Convert minutes to seconds for the API and ensure they don't exceed the maximum
      const rangesInSeconds = timeRanges.map((minutes) => Math.min(minutes * 60, MAX_RANGE_SECONDS))

      // Create request payload
      const requestPayload = {
        locations: [[location.lng, location.lat]], // OpenRouteService expects [longitude, latitude]
        range: rangesInSeconds,
        range_type: "time",
        attributes: ["total_pop"],
        location_type: "start",
        area_units: "km",
      }

      console.log("OpenRouteService API Request:", requestPayload)
      
      if (rangeType === "distance") {
        console.log("Distance to time conversion:", {
          distances: ranges,
          times: timeRanges
        })
      }

      // Determine the transportation profile based on the selected mode
      const transportProfile =
        transportMode === "car"
          ? "driving-car"
          : transportMode === "bike"
            ? "cycling-regular"
            : transportMode === "motorbike"
              ? "driving-motorcycle"
              : "foot-walking"

      const response = await fetch(`https://api.openrouteservice.org/v2/isochrones/${transportProfile}`, {
        method: "POST",
        headers: {
          Authorization: envApiKey || "",
          "Content-Type": "application/json",
          Accept: "application/json, application/geo+json",
        },
        body: JSON.stringify(requestPayload),
      })

      // Log raw response status
      console.log("OpenRouteService API Response Status:", response.status)

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenRouteService API Error:", errorData)
        throw new Error(errorData.error?.message || "Failed to generate isochrones")
      }

      // Parse successful response
      const data = await response.json()
      console.log("OpenRouteService API Response Data:", data)

      setIsochrones(data.features)
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
          <ZoneConfigStep
            transportMode={transportMode}
            rangeType={rangeType}
            onRangeTypeChange={handleRangeTypeChange}
            ranges={ranges}
            onRangesChange={handleRangesChange}
            onGenerate={generateIsochrones}
            onBack={prevStep}
            isLoading={isLoading}
          />
        )}

        {currentStep === 4 && (
          <ResultStep
            location={location}
            transportMode={transportMode}
            rangeType={rangeType}
            ranges={ranges}
            timeRanges={rangeType === "time" ? ranges : getTimeRangesForApi()}
            isochrones={isochrones}
            onBack={prevStep}
            error={error}
          />
        )}
      </Card>
    </div>
  )
}