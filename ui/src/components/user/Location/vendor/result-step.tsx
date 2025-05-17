// Updated ResultStep component with proper zone ordering and visualization
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  AlertCircle,
  MapPin,
  Clock,
  Car,
  Bike,
  Truck,
  Info,
  RefreshCw,
  X,
  Maximize,
} from "lucide-react";
import { IsochroneMap } from "./isochrone-map";
import { useMutation, gql } from "@apollo/client";
import * as extendedUtils from "./extendedIsochroneUtils";

// GraphQL mutation for single point isochrones
export const GET_POINT_ISOCHRONE = gql`
  mutation GenerateIsochrone($input: IsochroneInput!) {
    generateIsochrone(input: $input) {
      geojson
    }
  }
`;

type Location = {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
};

type TransportMode = "walking" | "bike" | "motorbike" | "car";
type RangeType = "time" | "distance";

// Enhanced zone details type
interface ZoneDetail {
  deliveryFee: number;
  estimatedDeliveryTime: string;
  description: string;
  minimumOrder: number;
  color: string;
  area: number; // Add area measurement
}

// Conversion speeds in km/h
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60,
};

interface ResultStepProps {
  location: Location | null;
  transportMode: TransportMode;
  rangeType: RangeType;
  ranges: number[];
  timeRanges: number[];
  isochrones: any[];
  onBack: () => void;
  nextStep: () => void;
  error: string | null;
  extendedMode?: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ResultStep({
  location,
  transportMode,
  rangeType,
  ranges,
  timeRanges,
  isochrones,
  onBack,
  nextStep,
  error,
  extendedMode = false,
  onRetry,
  isRetrying = false,
}: ResultStepProps) {
  // State to track which zone is active/selected
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);
  const [extendedZones, setExtendedZones] = useState<
    extendedUtils.IsochroneZone[]
  >([]);
  const [mergedCoverage, setMergedCoverage] = useState<any>(null);
  const [isExtendingEnabled, setIsExtendingEnabled] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail[]>([]);
  const [sortedIsochrones, setSortedIsochrones] = useState<any[]>([]);

  // GraphQL mutation hook for generating isochrones for new points
  const [generatePointIsochrone, { loading: isGeneratingPoint }] =
    useMutation(GET_POINT_ISOCHRONE);

  // Define zone colors that match the map colors - from green (closest) to red (farthest)
  const zoneColors = [
    "#4ade80",
    "#facc15",
    "#f87171",
    "#60a5fa",
    "#a78bfa",
    "#f472b6",
  ];

  // Process and sort isochrones by range
  useEffect(() => {
    if (!isochrones || isochrones.length === 0) return;

    // Calculate area for each isochrone using turf.js
    const processedIsochrones = isochrones.map((isochrone, index) => {
      const areaInSqKm = extendedUtils.calculateArea(isochrone);
      return {
        ...isochrone,
        areaInSqKm,
        rangeValue: ranges[index],
        index,
      };
    });

    // Sort isochrones by range (ascending)
    // This ensures smaller ranges (closer zones) are drawn on top of larger ones
    const sorted = [...processedIsochrones].sort((a, b) => a.index - b.index);
    setSortedIsochrones(sorted);
  }, [isochrones, ranges]);

  // Dynamically generate zone details based on ranges and transport mode
  useEffect(() => {
    if (!ranges.length || !sortedIsochrones.length) return;

    // Create zone details array with proper ordering
    const details = sortedIsochrones.map((isochrone, index) => {
      // Calculate area to verify proper matching
      const areaInSqKm =
        isochrone.areaInSqKm || extendedUtils.calculateArea(isochrone);

      // Get the corresponding range from the original order
      const originalIndex = isochrone.index;
      const range = ranges[originalIndex];

      // Helper function to calculate estimated delivery time
      const getEstimatedDeliveryTime = (): string => {
        // Calculate base time in minutes
        let baseTime: number;

        if (rangeType === "distance") {
          // Convert distance to time: (distance / speed) * 60
          baseTime = Math.round((range / SPEED_MAPPING[transportMode]) * 60);
        } else {
          // Already in minutes
          baseTime = range;
        }

        // Add buffer time based on zone
        const bufferTime = 5 + index * 5;

        // Return range
        const minTime = baseTime;
        const maxTime = baseTime + bufferTime;

        // For extended zones, adjust the delivery time estimation
        if (extendedMode && rangeType === "time" && range > 60) {
          return `${range}+ min`;
        }

        return `${minTime}-${maxTime} min`;
      };

      // Helper function to calculate delivery fee based on zone
      const getDeliveryFee = (): number => {
        // Base fee increases with distance/time
        const baseFee = 3 + index * 2;

        // First zone is often free
        if (index === 0) return 0;

        // Adjust based on transport mode (e.g., faster modes are more expensive)
        const modeMultiplier =
          transportMode === "car"
            ? 1.0
            : transportMode === "motorbike"
            ? 0.9
            : transportMode === "bike"
            ? 0.8
            : 0.7; // walking

        return Math.round(baseFee * modeMultiplier * 100) / 100;
      };

      // Helper function to get zone description
      const getZoneDescription = (): string => {
        if (extendedMode && index > 2) {
          return "Far extended delivery zone - additional delivery time and fees may apply";
        }

        switch (index) {
          case 0:
            return "Prime delivery zone with fastest service and no additional fees";
          case 1:
            return "Standard delivery zone with moderate delivery times";
          case 2:
            return "Extended delivery zone with longer delivery times";
          default:
            return "Distant zone with extended delivery window";
        }
      };

      // Helper function to get minimum order
      const getMinimumOrder = (): number => {
        // Base minimum order increases with zone index
        return 15 + index * 5;
      };

      return {
        deliveryFee: getDeliveryFee(),
        estimatedDeliveryTime: getEstimatedDeliveryTime(),
        description: getZoneDescription(),
        minimumOrder: getMinimumOrder(),
        color: zoneColors[index % zoneColors.length],
        area: areaInSqKm,
        rangeValue: range,
      };
    });

    setZoneDetails(details);
  }, [sortedIsochrones, ranges, transportMode, rangeType, extendedMode]);

  // Format range labels based on range type
const formatRangeLabel = (index: number): string => {
  if (!zoneDetails[index]) return "";

  if (index === 0) {
    // For the first zone, show "0-X" range
    return `0-${zoneDetails[index].rangeValue} ${
      rangeType === "distance" ? "km" : "min"
    }`;
  } else {
    // For other zones, show "prevRange-currentRange"
    const prevRange = zoneDetails[index - 1].rangeValue;
    const currentRange = zoneDetails[index].rangeValue;
    
    return `${prevRange}-${currentRange} ${
      rangeType === "distance" ? "km" : "min"
    }`;
  }
};

  // Calculate delivery fee based on zone with enhanced information
  const calculateDeliveryFee = (index: number): string => {
    if (!zoneDetails.length) return `$${index * 3}.00`;

    const zone = zoneDetails[index];
    return zone.deliveryFee === 0
      ? "Free Delivery"
      : `$${zone.deliveryFee.toFixed(2)}`;
  };

  // Handle zone click from the map
  const handleZoneClick = (index: number) => {
    // Toggle selection - if already selected, deselect it
    setActiveZoneIndex(activeZoneIndex === index ? null : index);
  };

  // Toggle extend mode
  const toggleExtendMode = () => {
    // Reset active zone if enabling extend mode
    if (!isExtendingEnabled) {
      setActiveZoneIndex(null);
    }

    setIsExtendingEnabled(!isExtendingEnabled);
  };

  // Function to generate isochrone for a new point
  const generateZoneForPoint = async (
    point: [number, number]
  ): Promise<any> => {
    try {
      setExtendError(null);

      // Use optimal range in seconds for the API
      // For extended zones, we want to maximize coverage while respecting API limits
      const maxApiRange = 3600; // 60 minutes in seconds (API limit)
      const rangeInSeconds = Math.min(ranges[0] * 60, maxApiRange);

      // Call the GraphQL API to generate isochrone for this point
      const response = await generatePointIsochrone({
        variables: {
          input: {
            locations: [point], // [longitude, latitude]
            range: [rangeInSeconds],
            transportMode: transportMode,
            address:location?.address
          },
        },
      });

      if (response?.data?.generateIsochrone?.geojson) {
        // Parse the GeoJSON
        const geojsonData = JSON.parse(response.data.generateIsochrone.geojson);

        if (geojsonData?.features && geojsonData.features.length > 0) {
          // Return the first feature (the isochrone polygon)
          return geojsonData.features[0];
        }
      }

      throw new Error("Failed to generate isochrone for the selected point");
    } catch (error: any) {
      console.error("Error generating point isochrone:", error);
      setExtendError(
        "Failed to generate zone for the selected point. Please try again."
      );
      throw error;
    }
  };

  // Handle when an extended zone is generated
  const handleExtendGenerated = (extendedData: any) => {
    setExtendedZones(extendedData.allZones);
    setMergedCoverage(extendedData.mergedCoverage);

    // Generate coverage report for debugging
    if (location) {
      const report = extendedUtils.createCoverageReport(
        location,
        rangeType,
        transportMode,
        ranges,
        extendedData.allZones,
        extendedData.mergedCoverage
      );
      console.log("Coverage report:", report);
    }
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

  // Format error messages to be more user-friendly
  const formatErrorMessage = (errorMsg: string): string => {
    if (errorMsg.includes("Service Unavailable") || errorMsg.includes("503")) {
      return "The mapping service is temporarily unavailable. Please try again in a few moments.";
    }

    if (errorMsg.includes("Retrying in")) {
      // Already a formatted retry message
      return errorMsg;
    }

    return errorMsg;
  };

  // Determine if we're showing retry UI
  const isServiceUnavailable =
    error?.includes("Service Unavailable") ||
    error?.includes("503") ||
    error?.includes("unavailable") ||
    error?.includes("Retrying");

  // Function to get suggested extension points
  const getSuggestedExtensionPoints = (): [number, number][] => {
    if (!mergedCoverage || !extendedZones.length) return [];

    return extendedUtils.suggestExtensionPoints(
      extendedZones,
      mergedCoverage,
      3 // Suggest 3 points
    );
  };

  if (!location) return null;

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">
              Delivery Zones
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Your delivery zones based on{" "}
              {rangeType === "distance"
                ? `${transportMode} travel distance`
                : `${transportMode} travel time`}
            </p>
          </div>

          {!error && extendedMode && (
            <Button
              variant={isExtendingEnabled ? "default" : "outline"}
              onClick={toggleExtendMode}
              className={`rounded-full px-4 py-1 ${
                isExtendingEnabled
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              }`}
            >
              <Maximize className="h-4 w-4 mr-1" />
              {isExtendingEnabled ? "Exit Extend Mode" : "Extend Coverage"}
            </Button>
          )}
        </div>

        {error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error generating delivery zones</p>
              <p className="mt-1 text-sm">{formatErrorMessage(error)}</p>

              {isRetrying && (
                <div className="mt-3 flex items-center text-sm">
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  <span>Retrying automatically...</span>
                  {onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 px-2 text-xs"
                      onClick={onRetry}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}

              {!isRetrying && isServiceUnavailable && onRetry && (
                <Button
                  onClick={onRetry}
                  size="sm"
                  className="mt-2"
                  disabled={isRetrying}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <Card className="bg-[#F5F5F7] dark:bg-[#2C2C2E] border-gray-100 dark:border-gray-800 p-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-[#0071E3] mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-[#1D1D1F] dark:text-white">
                    Vendor Location
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {location.address}
                  </p>
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
                isochrones={sortedIsochrones}
                transportMode={transportMode}
                rangeType={rangeType}
                ranges={ranges}
                activeZoneIndex={!isExtendingEnabled ? activeZoneIndex : null}
                onZoneClick={!isExtendingEnabled ? handleZoneClick : undefined}
                extendedMode={extendedMode}
                allowExtending={isExtendingEnabled}
                onExtendGenerated={handleExtendGenerated}
                generateZoneForPoint={generateZoneForPoint}
                suggestedPoints={
                  isExtendingEnabled ? getSuggestedExtensionPoints() : []
                }
              />
            </div>

            {/* Extended mode error */}
            {extendError && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-sm text-red-600 dark:text-red-300">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{extendError}</p>
                </div>
              </div>
            )}

            {!isExtendingEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {zoneDetails.map((zone, index) => (
                  <Card
                    key={index}
                    className={`border-t-4 transition-shadow hover:shadow-md cursor-pointer ${
                      activeZoneIndex === index
                        ? "ring-2 ring-blue-500 shadow-md"
                        : ""
                    }`}
                    style={{
                      borderTopColor: zone.color,
                    }}
                    onClick={() => handleZoneClick(index)}
                  >
                    <div className="p-4">
                      <h3 className="font-medium text-[#1D1D1F] dark:text-white">
                        Zone {index + 1}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatRangeLabel(index)}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">
                          {calculateDeliveryFee(index)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Min. ${zone.minimumOrder}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {zone.description}
                        </p>
                        <div className="flex justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Est. delivery: {zone.estimatedDeliveryTime}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {zone.area.toFixed(1)} km²
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {isExtendingEnabled && extendedZones.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <h3 className="font-medium text-lg mb-2">
                  Extended Coverage Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Points Added:</span>{" "}
                      {extendedZones.length}
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-medium">Total Coverage Area:</span>{" "}
                      {mergedCoverage
                        ? extendedUtils.calculateArea(mergedCoverage).toFixed(1)
                        : 0}{" "}
                      km²
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-medium">Unique Coverage:</span>{" "}
                      {extendedZones
                        .filter((zone) => zone.additionalCoverage)
                        .reduce((sum, zone) => {
                          return (
                            sum +
                            (zone.additionalCoverage
                              ? extendedUtils.calculateArea(
                                  zone.additionalCoverage
                                )
                              : 0)
                          );
                        }, 0)
                        .toFixed(1)}{" "}
                      km²
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Original Zone:</span>{" "}
                      {extendedZones
                        .find((z) => z.isOriginal)
                        ?.areaInSqKm?.toFixed(1) || 0}{" "}
                      km²
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-medium">Extended By:</span>{" "}
                      {(
                        (extendedUtils.calculateArea(mergedCoverage) /
                          (extendedZones.find((z) => z.isOriginal)
                            ?.areaInSqKm || 1)) *
                          100 -
                        100
                      ).toFixed(0)}
                      %
                    </p>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      <span className="font-medium">
                        {getSuggestedExtensionPoints().length > 0
                          ? "Orange dots suggest optimal extension points"
                          : "Click anywhere on the map to add more points"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!isExtendingEnabled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">
                  Click on any zone card or area on the map to focus on that
                  specific delivery zone.
                </p>

                {extendedMode && (
                  <p className="mt-1">
                    Click "Extend Coverage" to add more points to your delivery
                    area.
                  </p>
                )}
              </div>
            )}

            {extendedMode && !isExtendingEnabled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-start">
                <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Extended Range Mode Active</p>
                  <p className="mt-1">
                    You can extend your delivery coverage by clicking "Extend
                    Coverage" and adding additional points on the map.
                  </p>
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

          {!error && (
            <Button
            
            
            onClick={nextStep}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium">
              Save Delivery Zones
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
