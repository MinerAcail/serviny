"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, AlertCircle, MapPin, Clock, Car, Bike, Truck, Info } from "lucide-react"
import { IsochroneMap } from "./isochrone-map"

type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

// Zone details including customized information
interface ZoneDetail {
  deliveryFee: number;
  estimatedDeliveryTime: string;
  description: string;
  minimumOrder?: number;
}

interface ResultStepProps {
  location: Location | null
  transportMode: TransportMode
  rangeType: RangeType
  ranges: number[]
  timeRanges: number[]
  isochrones: any[]
  onBack: () => void
  error: string | null
  extendedMode?: boolean
}

export function ResultStep({ 
  location, 
  transportMode, 
  rangeType,
  ranges,
  timeRanges, 
  isochrones, 
  onBack, 
  error,
  extendedMode = false
}: ResultStepProps) {
  
  // State to track which zone is active/selected
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);
  if (!location) return null

  // Define zone colors that match the map colors
  const zoneColors = ["#4ade80", "#facc15", "#f87171"]

  // Format range labels based on range type
  const formatRangeLabel = (index: number): string => {
    if (index === 0) {
      return `0-${ranges[index]} ${rangeType === "distance" ? "km" : "min"}`
    } else {
      return `${ranges[index-1]}-${ranges[index]} ${rangeType === "distance" ? "km" : "min"}`
    }
  }

  // Enhanced zone details with more information
  const zoneDetails: ZoneDetail[] = [
    {
      deliveryFee: 0,
      estimatedDeliveryTime: "15-25 min",
      description: "Prime delivery zone with fastest service and no additional fees",
      minimumOrder: 15
    },
    {
      deliveryFee: 3.00,
      estimatedDeliveryTime: "25-40 min",
      description: "Standard delivery zone with moderate delivery times",
      minimumOrder: 20
    },
    {
      deliveryFee: 6.00,
      estimatedDeliveryTime: "40-60 min",
      description: "Extended delivery zone with longer delivery times",
      minimumOrder: 25
    }
  ];

  // Calculate delivery fee based on zone with enhanced information
  const calculateDeliveryFee = (index: number): string => {
    if (index >= zoneDetails.length) return `Base + $${index * 3}.00`;
    
    const zone = zoneDetails[index];
    return zone.deliveryFee === 0 
      ? "Free Delivery" 
      : `$${zone.deliveryFee.toFixed(2)}`;
  }

  // Handle zone click from the map
  const handleZoneClick = (index: number) => {
    // Toggle selection - if already selected, deselect it
    setActiveZoneIndex(activeZoneIndex === index ? null : index);
  };

  // Function to get the appropriate transport icon
  const getTransportIcon = () => {
    switch (transportMode) {
      case "walking":
        return <Clock className="h-5 w-5 text-gray-500 mr-2" />;
      case "bike":
        return <Bike className="h-5 w-5 text-gray-500 mr-2" />;
      case "motorbike":
        return <Truck className="h-5 w-5 text-gray-500 mr-2" />;
      default:
        return <Car className="h-5 w-5 text-gray-500 mr-2" />;
    }
  };

  // Check if any isochrones have the extended property
  const hasExtendedIsochrones = isochrones.some(
    isochrone => isochrone.properties && isochrone.properties.extended === true
  );

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Delivery Zones</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Your delivery zones based on {rangeType === "distance" ? `${transportMode} travel distance` : `${transportMode} travel time`}
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
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {getTransportIcon()}
                    <span>
                      {rangeType === "distance" 
                        ? `Zones based on ${transportMode} distance (km)`
                        : `Zones based on ${transportMode} travel time (min)`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Map with isochrones */}
            <div className="h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2C2C2E]">
              <IsochroneMap 
                vendorLocation={location} 
                isochrones={isochrones} 
                transportMode={transportMode}
                rangeType={rangeType}
                ranges={ranges}
                activeZoneIndex={activeZoneIndex}
                onZoneClick={handleZoneClick}
                extendedMode={extendedMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ranges.map((_, index) => {
                const zoneDetail = index < zoneDetails.length 
                  ? zoneDetails[index] 
                  : {
                      deliveryFee: index * 3,
                      estimatedDeliveryTime: "60+ min",
                      description: "Extended delivery zone with additional fee",
                      minimumOrder: 25 + (index - 2) * 5
                    };
                
                // For extended zones, update the description and delivery time
                if (extendedMode && rangeType === "time" && ranges[index] > 60) {
                  zoneDetail.estimatedDeliveryTime = `${ranges[index]}+ min`;
                  zoneDetail.description = "Far extended delivery zone - longer delivery times";
                }
                
                return (
                  <Card 
                    key={index} 
                    className={`border-t-4 transition-shadow hover:shadow-md cursor-pointer ${activeZoneIndex === index ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
                    style={{ borderTopColor: zoneColors[index % zoneColors.length] }}
                    onClick={() => handleZoneClick(index)}
                  >
                    <div className="p-4">
                      <h3 className="font-medium text-[#1D1D1F] dark:text-white">Zone {index + 1}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatRangeLabel(index)}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">
                          {calculateDeliveryFee(index)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Min. ${zoneDetail.minimumOrder}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {zoneDetail.description}
                        </p>
                        <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                          Est. delivery: {zoneDetail.estimatedDeliveryTime}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Click on any zone card or area on the map to focus on that specific delivery zone.</p>
            </div>
            
            {extendedMode && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Extended Range Mode Active</p>
                  <p className="mt-1">These delivery zones are generated with extended processing to go beyond the standard 1-hour API limit. Travel times over 60 minutes are approximations based on multiple chained isochrones.</p>
                </div>
              </div>
            )}
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