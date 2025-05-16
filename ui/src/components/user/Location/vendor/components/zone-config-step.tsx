"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronLeft, MapPin, Clock, Loader2, Plus, X, AlertTriangle, Info } from "lucide-react"
import { Tabs,  TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

interface ZoneConfigStepProps {
  transportMode: TransportMode
  rangeType: RangeType
  onRangeTypeChange: (type: RangeType) => void
  ranges: number[] 
  onRangesChange: (ranges: number[]) => void
  onGenerate: () => void
  onBack: () => void
  isLoading: boolean
  extendedMode?: boolean
  onExtendedModeChange?: (enabled: boolean) => void
  maxExtendedTimeMinutes?: number
}

// Conversion speeds in km/h
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60
}

export function ZoneConfigStep({ 
  transportMode, 
  rangeType,
  onRangeTypeChange,
  ranges, 
  onRangesChange, 
  onGenerate, 
  onBack, 
  isLoading,
  extendedMode = false,
  onExtendedModeChange,
  maxExtendedTimeMinutes = 300 // Default 5 hours
}: ZoneConfigStepProps) {
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [customRanges, setCustomRanges] = useState<number[]>([...ranges])
  const [showComingSoonMessage, setShowComingSoonMessage] = useState(false)

  // Get maximum value based on transport mode, range type, and extended mode
  const getMaxValue = (mode: TransportMode, type: RangeType): number => {
    if (type === "time") {
      // Return appropriate max based on extended mode
      return extendedMode 
        ? maxExtendedTimeMinutes // Extended time (usually 300 minutes / 5 hours)
        : 60; // Standard 60 minutes (API limit)
    } else {
      // For distance, calculate max based on travel time
      const speed = SPEED_MAPPING[mode]
      const maxMinutes = extendedMode 
        ? maxExtendedTimeMinutes 
        : 60;
        
      return Math.round((maxMinutes / 60) * speed) // Convert minutes to distance
    }
  }

  const maxValue = getMaxValue(transportMode, rangeType)

  const handleAutoGenerateToggle = (checked: boolean) => {
    setAutoGenerate(checked)

    if (checked) {
      // Reset to default ranges based on transport mode and range type
      const defaultRanges = getDefaultRanges(transportMode, rangeType)
      setCustomRanges(defaultRanges)
      onRangesChange(defaultRanges)
    }
  }

  const handleExtendedModeToggle = (checked: boolean) => {
    // If trying to enable extended mode, show the coming soon message instead
    if (checked && !extendedMode) {
      setShowComingSoonMessage(true)
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setShowComingSoonMessage(false)
      }, 5000)
      return;
    }
    
    // Otherwise, allow disabling it if it was already enabled
    if (onExtendedModeChange) {
      onExtendedModeChange(checked)
    }
  }

  const getDefaultRanges = (mode: TransportMode, type: RangeType): number[] => {
    if (type === "distance") {
      // Default ranges for each mode in kilometers, with extended options if enabled
      if (extendedMode) {
        switch(mode) {
          case "walking":
            return [1, 3, 5, 10]
          case "bike":
            return [3, 10, 20, 40]
          case "motorbike":
            return [5, 15, 30, 60]
          case "car":
            return [10, 30, 60, 120]
          default:
            return [1, 3, 5, 10]
        }
      } else {
        // Standard ranges (within API limits)
        switch(mode) {
          case "walking":
            return [1, 2, 4]
          case "bike":
            return [3, 5, 8]
          case "motorbike":
            return [5, 10, 15]
          case "car":
            return [10, 20, 30]
          default:
            return [1, 2, 4]
        }
      }
    } else {
      // Default ranges for each mode in minutes
      if (extendedMode) {
        switch(mode) {
          case "walking":
          case "bike":
            return [15, 30, 60, 120] // Up to 2 hours
          case "motorbike":
          case "car":
            return [30, 60, 120, 180] // Up to 3 hours
          default:
            return [15, 30, 60, 120]
        }
      } else {
        // Standard ranges (capped at 60 minutes)
        switch(mode) {
          case "walking":
          case "bike":
            return [10, 20, 30]
          case "motorbike":
          case "car":
            return [15, 30, 45]
          default:
            return [10, 20, 30]
        }
      }
    }
  }

  const handleRangeChange = (index: number, value: number[]) => {
    const newRanges = [...customRanges]
    newRanges[index] = value[0]

    // Sort ranges to ensure they're in ascending order
    const sortedRanges = [...newRanges].sort((a, b) => a - b)

    setCustomRanges(sortedRanges)
    onRangesChange(sortedRanges)
  }

  const handleAddRange = () => {
    // Add a new range that's 25% more than the last one, capped at max
    const lastValue = customRanges[customRanges.length - 1]
    const newValue = Math.min(Math.round(lastValue * 1.25), maxValue)
    
    const newRanges = [...customRanges, newValue]
    setCustomRanges(newRanges)
    onRangesChange(newRanges)
  }

  const handleRemoveRange = (index: number) => {
    if (customRanges.length <= 1) return // Don't allow removing the last range
    
    const newRanges = customRanges.filter((_, i) => i !== index)
    setCustomRanges(newRanges)
    onRangesChange(newRanges)
  }

  // For distance-to-time conversion display
  const getEstimatedTime = (distance: number, mode: TransportMode): number => {
    const speed = SPEED_MAPPING[mode]
    return Math.round((distance / speed) * 60) // Convert to minutes, don't cap
  }

  // For time-to-distance conversion display
  const getEstimatedDistance = (time: number, mode: TransportMode): number => {
    const speed = SPEED_MAPPING[mode]
    return Math.round(((time / 60) * speed) * 10) / 10 // Convert to km with 1 decimal
  }

  const handleRangeTypeSwitch = (value: string) => {
    onRangeTypeChange(value as RangeType)
  }

  // Helper to format the time or distance for display
  const formatRangeValue = (value: number, type: RangeType): string => {
    if (type === "time") {
      if (!extendedMode && value >= 60) {
        return "60 min (maximum)"
      } else if (extendedMode && value >= maxExtendedTimeMinutes) {
        return `${maxExtendedTimeMinutes} min (maximum)`
      }
    }
    return `${value} ${type === "distance" ? "km" : "min"}`
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Define Delivery Zones</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set how your delivery zones will be calculated</p>
        </div>

        <Tabs 
          defaultValue={rangeType} 
          onValueChange={handleRangeTypeSwitch}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="distance">Distance-based</TabsTrigger>
            <TabsTrigger value="time">Time-based</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch id="auto-generate" checked={autoGenerate} onCheckedChange={handleAutoGenerateToggle} />
              <Label htmlFor="auto-generate" className="text-[#1D1D1F] dark:text-white font-medium">
                Auto-generate {rangeType} zones
              </Label>
            </div>
          </div>

          {onExtendedModeChange && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="extended-mode" 
                          checked={extendedMode} 
                          onCheckedChange={handleExtendedModeToggle}
                          disabled={!extendedMode} // Disable enabling it, but allow disabling
                        />
                        <Label htmlFor="extended-mode" className="text-[#1D1D1F] dark:text-white font-medium flex items-center">
                          Enable extended range delivery zones
                          <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                            Coming Soon
                          </span>
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extended range delivery zones are under development and will be available soon.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>

        {showComingSoonMessage && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm animate-pulse">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Coming Soon!</p>
                <p className="mt-1">We're working on extended range delivery zones. This feature will be available soon.</p>
              </div>
            </div>
          </div>
        )}

        {rangeType === "time" && !extendedMode && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg text-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>Time ranges are limited to a maximum of 60 minutes due to API constraints. Extended range zones will be available soon.</p>
            </div>
          </div>
        )}

        {extendedMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Extended Mode Enabled</p>
                <p className="mt-1">You can now create delivery zones with up to {maxExtendedTimeMinutes} minutes ({Math.round(maxExtendedTimeMinutes/60)} hours) of travel time. Generating extended zones may take longer.</p>
              </div>
            </div>
          </div>
        )}

        <Card className="bg-[#F5F5F7] dark:bg-[#2C2C2E] border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-start">
            {rangeType === "distance" ? (
              <MapPin className="h-5 w-5 text-[#0071E3] mr-3 mt-0.5 flex-shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-[#0071E3] mr-3 mt-0.5 flex-shrink-0" />
            )}
            <div className="w-full">
              <h3 className="font-medium text-[#1D1D1F] dark:text-white">
                {rangeType === "distance" ? "Distance Ranges" : "Time Ranges"}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {autoGenerate
                  ? `Default ranges for ${transportMode}: ${ranges.join(", ")} ${rangeType === "distance" ? "km" : "minutes"}`
                  : `Customize your delivery ${rangeType} ranges`}
              </p>

              {!autoGenerate && (
                <div className="space-y-6 mt-4">
                  {customRanges.map((value, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-gray-600 dark:text-gray-300">Zone {index + 1}</Label>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-sm font-medium text-[#0071E3]">
                              {formatRangeValue(value, rangeType)}
                            </span>
                            {rangeType === "distance" && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ~{getEstimatedTime(value, transportMode)} min travel time
                              </p>
                            )}
                            {rangeType === "time" && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ~{getEstimatedDistance(value, transportMode)} km travel distance
                              </p>
                            )}
                          </div>
                          {customRanges.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 rounded-full"
                              onClick={() => handleRemoveRange(index)}
                            >
                              <X className="h-4 w-4 text-gray-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <Slider
                        value={[value]}
                        min={rangeType === "distance" ? 1 : 5}
                        max={maxValue}
                        step={rangeType === "distance" ? 1 : 5}
                        onValueChange={(value) => handleRangeChange(index, value)}
                        className="[&>span]:bg-[#0071E3]"
                      />
                    </div>
                  ))}

                  {customRanges.length < 8 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 w-full border-dashed" 
                      onClick={handleAddRange}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Zone
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-full px-5 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {extendedMode ? "Generating Extended Zones..." : "Generating..."}
              </>
            ) : (
              "Generate Delivery Zones"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}