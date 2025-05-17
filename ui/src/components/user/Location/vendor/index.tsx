"use client"

import { useState } from "react"
import { LocationStep } from "./location-step"
import { TransportStep } from "./components/transport-step"
import { ZoneConfigStep } from "./components/zone-config-step"
import { ResultStep } from "./result-step"
import { Card } from "@/components/ui/card"
import { StepIndicator } from "./components/step-indicator"
import { useMutation, gql } from "@apollo/client"
import { DeliveryZoneVisualizer, ZoneDetail } from "./mapsWork/visualize"
import { Button } from "@/components/ui/button"

// GraphQL mutation for isochrones
export const GET_ISOCHRONE = gql`
  mutation GenerateIsochrone($input: IsochroneInput!) {
    generateIsochrone(input: $input) {
       geojson
    uuid
    locations

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

// Conversion speeds in km/h
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60
}

// Maximum allowed range in seconds for the API
const MAX_RANGE_SECONDS = 3600; // 1 hour / 3600 seconds

// Extended support - up to 5 hours for car/motorbike (configurable)
const EXTENDED_MAX_RANGES = {
  walking: 5 * 3600, // 5 hours in seconds
  bike: 5 * 3600, // 5 hours in seconds
  motorbike: 5 * 3600, // 5 hours in seconds
  car: 5 * 3600 // 5 hours in seconds
};

export function VendorProcessFlow() {
  const [currentStep, setCurrentStep] = useState(1)
  const [location, setLocation] = useState<Location | null>(null)
  const [transportMode, setTransportMode] = useState<TransportMode>("car")
  const [rangeType, setRangeType] = useState<RangeType>("distance") // Default to distance-based
  const [ranges, setRanges] = useState<number[]>([10, 20, 30]) // in km or minutes depending on rangeType
  const [isochrones, setIsochrones] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extendedMode, setExtendedMode] = useState(false) // Toggle for extended isochrones
  const [retryCount, setRetryCount] = useState(0)
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null)
  

   // New state for DeliveryZoneVisualizer
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail[]>([]);
  const [isExtendingEnabled, setIsExtendingEnabled] = useState(false);


   // New function to handle zone click
  const handleZoneClick = (index: number) => {
    setActiveZoneIndex(activeZoneIndex === index ? null : index);
  };
  // Apollo Client mutation hook
  const [generateIsochrone] = useMutation(GET_ISOCHRONE)

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation)
  }

  const handleTransportSelect = (mode: TransportMode) => {
    setTransportMode(mode)

    // Update default ranges based on transport mode and current range type
    if (rangeType === "distance") {
      let newDistanceRanges: number[] = [10, 20, 30]
      
      if (mode === "walking") {
        newDistanceRanges = extendedMode ? [1, 3, 5, 10] : [1, 2, 4]
      } else if (mode === "bike") {
        newDistanceRanges = extendedMode ? [3, 10, 20, 40] : [3, 5, 8]
      } else if (mode === "motorbike") {
        newDistanceRanges = extendedMode ? [5, 15, 30, 60] : [5, 10, 15]
      } else if (mode === "car") {
        newDistanceRanges = extendedMode ? [10, 30, 60, 120] : [10, 20, 30]
      }
      
      setRanges(newDistanceRanges)
    } else {
      // Time ranges - For extended mode, allow longer times
      if (extendedMode) {
        if (mode === "walking" || mode === "bike") {
          setRanges([15, 30, 60, 120]) // Up to 2 hours
        } else {
          setRanges([30, 60, 120, 180]) // Up to 3 hours
        }
      } else {
        // Standard ranges (capped at 60 min)
        if (mode === "walking" || mode === "bike") {
          setRanges([10, 20, 30])
        } else {
          setRanges([15, 30, 45])
        }
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
      
      // Apply appropriate time caps based on extended mode
      if (extendedMode) {
        // Cap at max extended hours
        const maxMinutes = EXTENDED_MAX_RANGES[transportMode] / 60;
        const cappedRanges = newRanges.map(time => Math.min(time, maxMinutes))
        setRanges(cappedRanges)
      } else {
        // Cap at 60 minutes (API limit)
        const cappedRanges = newRanges.map(time => Math.min(time, 60))
        setRanges(cappedRanges)
      }
    }
  }

  const handleRangesChange = (newRanges: number[]) => {
    // If time-based, ensure ranges don't exceed configured limits
    if (rangeType === "time") {
      const maxMinutes = extendedMode 
        ? EXTENDED_MAX_RANGES[transportMode] / 60
        : 60; // Standard API limit
      
      const cappedRanges = newRanges.map(time => Math.min(time, maxMinutes))
      setRanges(cappedRanges)
    } else {
      setRanges(newRanges)
    }
  }

  const toggleExtendedMode = (enabled: boolean) => {
    setExtendedMode(enabled);
    
    // Update ranges based on new mode
    if (enabled) {
      // Expand ranges for extended mode
      if (rangeType === "distance") {
        let extendedRanges: number[] = [...ranges]; // Start with current ranges
        
        // Add a longer range if not already present
        if (transportMode === "walking") {
          if (Math.max(...ranges) < 8) {
            extendedRanges.push(10);
          }
        } else if (transportMode === "bike") {
          if (Math.max(...ranges) < 30) {
            extendedRanges.push(40);
          }
        } else if (transportMode === "motorbike" || transportMode === "car") {
          if (Math.max(...ranges) < 100) {
            extendedRanges.push(120);
          }
        }
        
        setRanges(extendedRanges);
      } else {
        // Time-based ranges
        let extendedRanges: number[] = [...ranges]; // Start with current ranges
        
        // Add longer time ranges if not already present
        const maxCurrentMinutes = Math.max(...ranges);
        if (maxCurrentMinutes < 90) {
          extendedRanges.push(120); // 2 hours
        }
        if (maxCurrentMinutes < 150 && (transportMode === "car" || transportMode === "motorbike")) {
          extendedRanges.push(180); // 3 hours for faster transport
        }
        
        setRanges(extendedRanges);
      }
    } else {
      // Revert to standard mode with API limits
      const standardRanges = ranges.filter(val => {
        if (rangeType === "time") {
          return val <= 60; // Only keep ranges under 60 minutes
        } else {
          // For distance, estimate based on transport speed
          const speed = SPEED_MAPPING[transportMode];
          const timeInMinutes = (val / speed) * 60;
          return timeInMinutes <= 60;
        }
      });
      
      // Ensure we have at least some ranges left
      if (standardRanges.length < 2) {
        handleTransportSelect(transportMode); // Reset to defaults
      } else {
        setRanges(standardRanges);
      }
    }
  }

  const nextStep = () => {
    if (currentStep < 5) {
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
      // Apply appropriate caps based on mode
      const maxMinutes = extendedMode 
        ? EXTENDED_MAX_RANGES[transportMode] / 60
        : 60; // Standard API limit
      
      return ranges.map(time => Math.min(time, maxMinutes))
    } else {
      // Convert from distance to time
      const speed = SPEED_MAPPING[transportMode] // km/h
      const timeRanges = ranges.map(distance => {
        // Convert km to minutes: (distance / speed) * 60
        return Math.round((distance / speed) * 60)
      })
      
      // Apply appropriate caps
      const maxMinutes = extendedMode 
        ? EXTENDED_MAX_RANGES[transportMode] / 60
        : 60;
        
      return timeRanges.map(time => Math.min(time, maxMinutes))
    }
  }

  const cancelRetry = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }
    setRetryCount(0);
    setIsLoading(false);
  }

  const generateIsochrones = async () => {
    if (!location) return

    // If we already have a retry timer, clear it
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }

    setIsLoading(true)
    setError(null)

    try {
      // Get time ranges in minutes
      const timeRanges = getTimeRangesForApi()
      
      // For now, we'll use 60 minute cap for the initial isochrone
      // The extension functionality will handle adding more points
      const cappedRanges = timeRanges.map(time => Math.min(time, 60));
      
      // Convert minutes to seconds for the API
      const rangesInSeconds = cappedRanges.map((minutes) => minutes * 60);

      console.log("Time ranges for API (seconds):", rangesInSeconds)
      
      if (rangeType === "distance") {
        console.log("Distance to time conversion:", {
          distances: ranges,
          times: timeRanges
        })
      }

      // Execute GraphQL query
      const response = await generateIsochrone({
        variables: {
          input: {
            locations: [[location.lng, location.lat]], // OpenRouteService expects [longitude, latitude]
            range: rangesInSeconds,
            transportMode: transportMode,
            address:location.address

          }
        }
      })

      // Reset retry counter on success
      setRetryCount(0);

      // Parse the GeoJSON string returned from the API
      if (response?.data?.generateIsochrone?.geojson) {
        const geojsonData = JSON.parse(response.data.generateIsochrone.geojson)
        
        if (geojsonData?.features) {
          setIsochrones(geojsonData.features)
          nextStep() // Move to results step
        } else {
          throw new Error("Invalid GeoJSON format received")
        }
      } else {
        throw new Error("No valid isochrone data received")
      }
    } catch (error: any) {
      console.error("Error generating isochrones:", error)
      
      const errorMessage = error?.message || "Failed to generate isochrones";
      setError(errorMessage);
      
      // Check if it's a service unavailable error
      if (errorMessage.includes("Service Unavailable") || errorMessage.includes("503")) {
        const maxRetries = 3;
        
        if (retryCount < maxRetries) {
          // Increment retry counter
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          // Calculate exponential backoff delay
          const delay = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s
          
          // Set a more helpful error message
          setError(`The mapping service is temporarily busy. Retrying in ${delay/1000} seconds... (Attempt ${newRetryCount}/${maxRetries})`);
          
          // Set a timeout to retry
          const timer = setTimeout(() => {
            generateIsochrones();
          }, delay);
          
          setRetryTimer(timer);
        } else {
          // Max retries reached
          setError("The mapping service is currently unavailable. Please try again later.");
          setIsLoading(false);
        }
      } else {
        // Not a service unavailable error, just show the error
        setIsLoading(false);
      }
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
            extendedMode={extendedMode}
            onExtendedModeChange={toggleExtendedMode}
            maxExtendedTimeMinutes={EXTENDED_MAX_RANGES[transportMode] / 60}
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
            onBack={() => {
              // Cancel any pending retries before going back
              cancelRetry();
              prevStep();
            }}
            nextStep={nextStep}

            error={error}
            extendedMode={extendedMode}
            onRetry={isLoading ? cancelRetry : generateIsochrones}
            isRetrying={isLoading && retryCount > 0}
          />
        )}

         
      </Card>
    </div>
  )
}