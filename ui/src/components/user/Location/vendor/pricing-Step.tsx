"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ChevronLeft, DollarSign, Clock,  Plus, Info, AlertTriangle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

interface PricingRule {
  zone: number
  price: number
  minimumOrder: number
  estimatedDeliveryTime: string
  description: string
  isActive: boolean
}

interface PricingStepProps {
  transportMode: TransportMode
  rangeType: RangeType
  ranges: number[]
  timeRanges: number[]
  onPricingComplete: (pricingRules: PricingRule[]) => void
  onBack: () => void
  isLoading?: boolean
}

// Default pricing templates based on transport mode
const getPricingTemplate = (mode: TransportMode, ranges: number[], rangeType: RangeType): PricingRule[] => {
  return ranges.map((range, index) => {
    // Calculate base delivery fee
    let basePrice = 0
    if (index === 0) {
      basePrice = 0 // First zone is often free
    } else {
      // Progressive pricing based on zone
      basePrice = Math.round((2 + (index * 1.5)) * 100) / 100
    }

    // Adjust pricing based on transport mode
    const modeMultiplier = {
      walking: 0.7,
      bike: 0.8,
      motorbike: 1.0,
      car: 1.2
    }[mode]

    const finalPrice = index === 0 ? 0 : Math.round(basePrice * modeMultiplier * 100) / 100

    // Calculate minimum order (increases with distance/time)
    const minimumOrder = 15 + (index * 5)

    // Calculate estimated delivery time
    const getEstimatedTime = (): string => {
      let baseTime: number
      
      if (rangeType === "distance") {
        // Convert distance to time based on transport speed
        const speeds = { walking: 5, bike: 15, motorbike: 30, car: 60 }
        baseTime = Math.round((range / speeds[mode]) * 60)
      } else {
        baseTime = range
      }

      const bufferTime = 5 + (index * 3)
      return `${baseTime}-${baseTime + bufferTime} min`
    }

    // Zone descriptions
    const getDescription = (): string => {
      switch (index) {
        case 0:
          return "Prime delivery zone - fastest service"
        case 1:
          return "Standard delivery zone"
        case 2:
          return "Extended delivery zone"
        default:
          return `Extended zone ${index + 1}`
      }
    }

    return {
      zone: index + 1,
      price: finalPrice,
      minimumOrder,
      estimatedDeliveryTime: getEstimatedTime(),
      description: getDescription(),
      isActive: true
    }
  })
}

export function PricingStep({ 
  transportMode, 
  rangeType, 
  ranges, 
  timeRanges,
  onPricingComplete, 
  onBack,
  isLoading = false
}: PricingStepProps) {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
  const [useAutoPricing, setUseAutoPricing] = useState(true)
  const [currency, setCurrency] = useState("$")

  // Initialize pricing rules when component mounts or ranges change
  useEffect(() => {
    const template = getPricingTemplate(transportMode, ranges, rangeType)
    setPricingRules(template)
  }, [transportMode, ranges, rangeType])

  // Format range labels
  const formatRangeLabel = (index: number): string => {
    const range = ranges[index]
    if (index === 0) {
      return `0-${range} ${rangeType === "distance" ? "km" : "min"}`
    } else {
      const prevRange = ranges[index - 1]
      return `${prevRange}-${range} ${rangeType === "distance" ? "km" : "min"}`
    }
  }

  // Handle price change for a specific zone
  const handlePriceChange = (zoneIndex: number, newPrice: string) => {
    const price = parseFloat(newPrice) || 0
    setPricingRules(prev => 
      prev.map((rule, index) => 
        index === zoneIndex ? { ...rule, price } : rule
      )
    )
  }

  // Handle minimum order change
  const handleMinimumOrderChange = (zoneIndex: number, newMinimum: string) => {
    const minimumOrder = parseFloat(newMinimum) || 0
    setPricingRules(prev => 
      prev.map((rule, index) => 
        index === zoneIndex ? { ...rule, minimumOrder } : rule
      )
    )
  }

  // Toggle zone active status
  const handleToggleZone = (zoneIndex: number, isActive: boolean) => {
    setPricingRules(prev => 
      prev.map((rule, index) => 
        index === zoneIndex ? { ...rule, isActive } : rule
      )
    )
  }

  // Reset to auto pricing
  const handleResetToPricing = () => {
    const template = getPricingTemplate(transportMode, ranges, rangeType)
    setPricingRules(template)
    setUseAutoPricing(true)
  }

  // Apply smart pricing (increase by distance/time)
  const handleSmartPricing = () => {
    setPricingRules(prev => 
      prev.map((rule, index) => {
        if (index === 0) return { ...rule, price: 0 } // Keep first zone free
        
        // Progressive pricing: each zone costs more
        const smartPrice = Math.round((3 + (index * 2.5)) * 100) / 100
        return { ...rule, price: smartPrice }
      })
    )
    setUseAutoPricing(false)
  }

  // Validate pricing rules
  const validatePricing = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Check for negative prices
    pricingRules.forEach((rule, index) => {
      if (rule.price < 0) {
        errors.push(`Zone ${index + 1} cannot have negative pricing`)
      }
      if (rule.minimumOrder < 0) {
        errors.push(`Zone ${index + 1} cannot have negative minimum order`)
      }
    })

    // Check that at least one zone is active
    const activeZones = pricingRules.filter(rule => rule.isActive)
    if (activeZones.length === 0) {
      errors.push("At least one delivery zone must be active")
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Handle continue button
  const handleContinue = () => {
    const validation = validatePricing()
    if (validation.isValid) {
      onPricingComplete(pricingRules)
    } else {
      // Show validation errors (you might want to add a toast notification here)
      console.error("Pricing validation errors:", validation.errors)
    }
  }

  const validation = validatePricing()

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Set Delivery Pricing</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configure pricing and minimum orders for each delivery zone
          </p>
        </div>

        {/* Pricing Controls */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant={useAutoPricing ? "default" : "outline"}
            onClick={handleResetToPricing}
            size="sm"
            className="rounded-full"
          >
            Auto Pricing
          </Button>
          
          <Button
            variant="outline"
            onClick={handleSmartPricing}
            size="sm"
            className="rounded-full"
          >
            Smart Pricing
          </Button>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Auto: Template pricing based on transport mode</p>
                <p>Smart: Progressive pricing that increases with distance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-600 dark:text-red-300">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Please fix the following issues:</p>
                <ul className="mt-1 list-disc list-inside">
                  {validation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Rules */}
        <div className="space-y-4">
          {pricingRules.map((rule, index) => (
            <Card 
              key={index} 
              className={`p-4 transition-opacity ${
                rule.isActive ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <div className="space-y-4">
                {/* Zone Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: `hsl(${(index * 60) % 360}, 60%, 50%)` }}
                      />
                      <h3 className="font-medium text-[#1D1D1F] dark:text-white">
                        Zone {rule.zone}
                      </h3>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatRangeLabel(index)}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`zone-${index}-active`} className="text-sm">Active</Label>
                    <Switch
                      id={`zone-${index}-active`}
                      checked={rule.isActive}
                      onCheckedChange={(checked) => handleToggleZone(index, checked)}
                    />
                  </div>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Delivery Price */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Delivery Fee
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {currency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rule.price}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        className="pl-8"
                        disabled={!rule.isActive}
                      />
                    </div>
                    {index === 0 && rule.price === 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400">Free delivery zone</p>
                    )}
                  </div>

                  {/* Minimum Order */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <Plus className="h-4 w-4 mr-1" />
                      Minimum Order
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        {currency}
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={rule.minimumOrder}
                        onChange={(e) => handleMinimumOrderChange(index, e.target.value)}
                        className="pl-8"
                        disabled={!rule.isActive}
                      />
                    </div>
                  </div>

                  {/* Estimated Time */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Est. Delivery Time
                    </Label>
                    <div className="flex items-center h-10 px-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-600 dark:text-gray-400">
                      {rule.estimatedDeliveryTime}
                    </div>
                  </div>
                </div>

                {/* Zone Description */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{rule.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Pricing Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Active Zones:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {pricingRules.filter(r => r.isActive).length} of {pricingRules.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Price Range:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {currency}{Math.min(...pricingRules.filter(r => r.isActive).map(r => r.price))} - 
                {currency}{Math.max(...pricingRules.filter(r => r.isActive).map(r => r.price))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700 dark:text-blue-200">Transport Mode:</span>
              <span className="font-medium text-blue-900 dark:text-blue-100 capitalize">
                {transportMode}
              </span>
            </div>
          </div>
        </Card>

        {/* Navigation */}
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
            onClick={handleContinue}
            disabled={!validation.isValid || isLoading}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium"
          >
            Continue to Results
          </Button>
        </div>
      </div>
    </div>
  )
}