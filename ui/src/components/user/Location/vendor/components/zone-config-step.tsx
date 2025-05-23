import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronLeft, MapPin, Clock, Loader2, Plus, X, AlertTriangle, Info } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

interface ZoneRange {
  distance: number
  price: number
  id: string
}

interface ZoneConfigStepProps {
  transportMode: TransportMode
  rangeType: RangeType
  onRangeTypeChange: (type: RangeType) => void
  ranges: number[] 
  rangePrices: number[]
  onRangesChange: (ranges: number[]) => void
  onRangePricesChange: (prices: number[]) => void
  onGenerate: () => void
  onBack: () => void
  isLoading: boolean
  extendedMode?: boolean
  onExtendedModeChange?: (enabled: boolean) => void
  maxExtendedTimeMinutes?: number
}

// Conversion speeds in km/h (same as first example)
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60
}

export default function ZoneConfigStep({ 
  transportMode, 
  rangeType,
  onRangeTypeChange,
  ranges, 
  rangePrices,
  onRangesChange, 
  onRangePricesChange,
  onGenerate, 
  onBack, 
  isLoading,
  extendedMode = false,
  onExtendedModeChange,
  maxExtendedTimeMinutes = 60
}: ZoneConfigStepProps) {
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [zoneRanges, setZoneRanges] = useState<ZoneRange[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [showInfoMessage, setShowInfoMessage] = useState(false)
  const [infoMessageType, setInfoMessageType] = useState<'info' | 'warning' | 'success'>('info')
  const [infoMessage, setInfoMessage] = useState("")

  // Initialize zone ranges from props only once
  useEffect(() => {
    if (!isInitialized && ranges.length > 0) {
      const initialZones = ranges.map((range, index) => ({
        id: `zone_${index}`,
        distance: range,
        price: rangePrices[index] || (5.0 + (index * 2.5))
      }))
      setZoneRanges(initialZones)
      setIsInitialized(true)
    }
  }, [ranges, rangePrices, isInitialized])

  // Only sync back to parent when user makes changes (not during initialization)
  const syncToParent = (newZoneRanges: ZoneRange[]) => {
    if (!isInitialized) return
    
    const newRanges = newZoneRanges.map(zone => zone.distance)
    const newPrices = newZoneRanges.map(zone => zone.price)
    
    onRangesChange(newRanges)
    onRangePricesChange(newPrices)
  }

  const showTemporaryMessage = (message: string, type: 'info' | 'warning' | 'success' = 'info', duration: number = 5000) => {
    setInfoMessage(message)
    setInfoMessageType(type)
    setShowInfoMessage(true)
    
    // Auto-hide the message after specified duration
    setTimeout(() => {
      setShowInfoMessage(false)
    }, duration)
  }

  // Render appropriate message based on info type
  const renderInfoMessage = () => {
    if (!showInfoMessage) return null;
    
    let bgClass = "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300";
    let Icon = Info;
    
    if (infoMessageType === 'warning') {
      bgClass = "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300";
      Icon = AlertTriangle;
    } else if (infoMessageType === 'success') {
      bgClass = "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300";
      Icon = Info;
    }
    
    return (
      <div className={`${bgClass} p-3 rounded-lg text-sm animate-pulse`}>
        <div className="flex items-start">
          <Icon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p>{infoMessage}</p>
          </div>
        </div>
      </div>
    );
  }

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

  const handleAutoGenerateToggle = (checked: boolean) => {
    setAutoGenerate(checked)

    if (checked) {
      // Reset to default ranges based on transport mode and range type
      const defaultRanges = getDefaultRanges(transportMode, rangeType)
      const defaultZones = defaultRanges.map((range, index) => ({
        id: `zone_${index}`,
        distance: range,
        price: 5.0 + (index * 2.5)
      }))
      setZoneRanges(defaultZones)
      syncToParent(defaultZones)
    }
  }

  const handleRangeChange = (id: string, newDistance: number) => {
    const updatedZones = zoneRanges.map(zone => 
      zone.id === id ? { ...zone, distance: newDistance } : zone
    )
    
    // Sort by distance to maintain order
    const sortedZones = updatedZones.sort((a, b) => a.distance - b.distance)
    setZoneRanges(sortedZones)
    syncToParent(sortedZones)
  }

  const handlePriceChange = (id: string, newPrice: number) => {
    const updatedZones = zoneRanges.map(zone =>
      zone.id === id ? { ...zone, price: Math.max(0, newPrice) } : zone
    )
    setZoneRanges(updatedZones)
    syncToParent(updatedZones)
  }

  const handleAddRange = () => {
    // Add a new range that's 25% more than the last one, capped at max
    const lastZone = zoneRanges[zoneRanges.length - 1]
    const newDistance = Math.min(Math.round(lastZone.distance * 1.25), maxValue)
    const newPrice = lastZone.price + 2.5
    
    const newZone: ZoneRange = {
      id: `zone_${zoneRanges.length}`,
      distance: newDistance,
      price: newPrice
    }
    
    const newZoneRanges = [...zoneRanges, newZone]
    setZoneRanges(newZoneRanges)
    syncToParent(newZoneRanges)
  }

  const handleRemoveRange = (id: string) => {
    if (zoneRanges.length <= 1) return // Don't allow removing the last range
    
    const updatedZones = zoneRanges.filter(zone => zone.id !== id)
    setZoneRanges(updatedZones)
    syncToParent(updatedZones)
  }

  // For distance-to-time conversion display
  const getEstimatedTime = (distance: number, mode: TransportMode): number => {
    const speed = SPEED_MAPPING[mode]
    return Math.round((distance / speed) * 60) // Convert to minutes
  }

  // For time-to-distance conversion display
  const getEstimatedDistance = (time: number, mode: TransportMode): number => {
    const speed = SPEED_MAPPING[mode]
    return Math.round(((time / 60) * speed) * 10) / 10 // Convert to km with 1 decimal
  }

  const handleRangeTypeSwitch = (value: string) => {
    onRangeTypeChange(value as RangeType)
  }

  const handleExtendedModeToggle = (checked: boolean) => {
    // Toggle extended mode via parent component
    if (onExtendedModeChange) {
      onExtendedModeChange(checked)
      
      // Show appropriate message
      if (checked) {
        showTemporaryMessage(
          "Extended mode enabled! After generating your zones, you'll be able to extend them by clicking on additional points.", 
          'success'
        )
      } else {
        showTemporaryMessage(
          "Extended mode disabled. Zones will be limited to the standard 60-minute API constraint.",
          'info'
        )
      }
    }
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

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 relative">
              <div className="absolute inset-0 rounded-full border-2 border-[#007aff] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[#86868b] font-medium">Setting up zones...</p>
          </div>
        </div>
      </div>
    )
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
                        />
                        <Label htmlFor="extended-mode" className="text-[#1D1D1F] dark:text-white font-medium flex items-center">
                          Enable extended range delivery zones
                          {!extendedMode && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                              New
                            </span>
                          )}
                        </Label>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Extended mode allows you to create coverage beyond the standard 60-minute API limit by adding extra points to your delivery area.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic info/success message */}
        {renderInfoMessage()}

        {rangeType === "time" && !extendedMode && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 p-3 rounded-lg text-sm">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>Time ranges are limited to a maximum of 60 minutes due to API constraints. Enable extended mode to create larger delivery zones.</p>
            </div>
          </div>
        )}

        {extendedMode && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm">
            <div className="flex items-start">
              <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Extended Mode Enabled</p>
                <p className="mt-1">You'll be able to expand your delivery zones by clicking on additional points after the initial zone is generated. This helps overcome the 60-minute API limit.</p>
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
                  ? `Default ranges for ${transportMode}: ${zoneRanges.map(z => z.distance).join(", ")} ${rangeType === "distance" ? "km" : "minutes"}`
                  : `Customize your delivery ${rangeType} ranges and pricing`}
              </p>

              {!autoGenerate && (
                <div className="space-y-6 mt-4">
                  {zoneRanges.map((zone, index) => (
                    <div key={zone.id} className="space-y-4 p-4 bg-white dark:bg-[#3A3A3C] rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Zone {index + 1}
                        </Label>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-sm font-medium text-[#0071E3]">
                              {formatRangeValue(zone.distance, rangeType)}
                            </span>
                            {rangeType === "distance" && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ~{getEstimatedTime(zone.distance, transportMode)} min travel time
                              </p>
                            )}
                            {rangeType === "time" && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ~{getEstimatedDistance(zone.distance, transportMode)} km travel distance
                              </p>
                            )}
                          </div>
                          {zoneRanges.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveRange(zone.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Distance/Time Slider */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          {rangeType === "distance" ? "Distance Range" : "Time Range"}
                        </Label>
                        <Slider
                          value={[zone.distance]}
                          min={rangeType === "distance" ? 1 : 5}
                          max={maxValue}
                          step={rangeType === "distance" ? 1 : 5}
                          onValueChange={(value) => handleRangeChange(zone.id, value[0])}
                          className="[&>span]:bg-[#0071E3]"
                        />
                      </div>

                      {/* Price Input */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600 dark:text-gray-400">
                          Delivery Price (GHS)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₵</span>
                          <input
                            type="number"
                            min="0"
                            step="0.50"
                            value={zone.price}
                            onChange={(e) => handlePriceChange(zone.id, Number(e.target.value))}
                            className="w-full pl-8 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0071E3] focus:border-transparent bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Zone Summary */}
                      <div className="pt-3 border-t border-gray-100 dark:border-gray-600">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            {index === 0 
                              ? `0-${zone.distance} ${rangeType === "distance" ? "km" : "min"}`
                              : `${zoneRanges[index - 1]?.distance || 0}-${zone.distance} ${rangeType === "distance" ? "km" : "min"}`
                            }
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ₵{zone.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {zoneRanges.length < 6 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4 w-full border-dashed hover:bg-blue-50 hover:border-blue-300" 
                      onClick={handleAddRange}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Zone
                    </Button>
                  )}
                </div>
              )}

              {/* Zone Summary */}
              {!autoGenerate && zoneRanges.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">Zone Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Total Zones:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">{zoneRanges.length}</span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Max Coverage:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        {Math.max(...zoneRanges.map(z => z.distance))} {rangeType === "distance" ? "km" : "min"}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Min Price:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        ₵{Math.min(...zoneRanges.map(z => z.price)).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700 dark:text-blue-300">Avg. Price:</span>
                      <span className="ml-2 font-medium text-blue-900 dark:text-blue-100">
                        ₵{(zoneRanges.reduce((sum, zone) => sum + zone.price, 0) / zoneRanges.length).toFixed(2)}
                      </span>
                    </div>
                  </div>
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
                Generating...
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