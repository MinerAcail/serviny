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
  Share,
  Download,
  Trash2,
  Edit3,
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

interface ZoneDetail {
  deliveryFee: number;
  estimatedDeliveryTime: string;
  description: string;
  minimumOrder: number;
  color: string;
  distance: number;
  price: number;
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
  rangePrices: number[]; // Add rangePrices prop
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
  rangePrices, // Add rangePrices parameter
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
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail[]>([]);
  const [sortedIsochrones, setSortedIsochrones] = useState<any[]>([]);
  const [editingZone, setEditingZone] = useState<number | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [extendedZones, setExtendedZones] = useState<any[]>([]);
  const [mergedCoverage, setMergedCoverage] = useState<any>(null);
  const [isExtendingEnabled, setIsExtendingEnabled] = useState(false);
  const [extendError, setExtendError] = useState<string | null>(null);

  // GraphQL mutation hook for generating isochrones for new points
  const [generatePointIsochrone, { loading: isGeneratingPoint }] =
    useMutation(GET_POINT_ISOCHRONE);

  // Process and sort isochrones by range
  useEffect(() => {
    if (!isochrones || isochrones.length === 0) return;

    // Sort isochrones by distance/range (ascending)
    const sorted = [...isochrones].sort((a, b) => {
      const aDistance = a.distance || ranges[a.id?.split('_')[1]] || 0;
      const bDistance = b.distance || ranges[b.id?.split('_')[1]] || 0;
      return aDistance - bDistance;
    });
    
    setSortedIsochrones(sorted);
  }, [isochrones, ranges]);

  // Generate zone details based on ranges and transport mode
  useEffect(() => {
    if (!ranges.length || !rangePrices.length) return;

    const details = ranges.map((range, index) => {
      const price = rangePrices[index] || (index === 0 ? 0 : 5.0 + (index * 2.5));

      // Helper function to calculate estimated delivery time
      const getEstimatedDeliveryTime = (): string => {
        let baseTime: number;

        if (rangeType === "distance") {
          baseTime = Math.round((range / SPEED_MAPPING[transportMode]) * 60);
        } else {
          baseTime = range;
        }

        const bufferTime = 5 + index * 5;
        const minTime = baseTime;
        const maxTime = baseTime + bufferTime;

        return `${minTime}-${maxTime} min`;
      };

      const getZoneDescription = (): string => {
        switch (index) {
          case 0:
            return price === 0 ? "Prime delivery zone with free delivery" : "Prime delivery zone with fastest service";
          case 1:
            return "Standard delivery zone with moderate delivery times";
          case 2:
            return "Extended delivery zone with longer delivery times";
          default:
            return "Distant zone with extended delivery window";
        }
      };

      return {
        deliveryFee: price,
        estimatedDeliveryTime: getEstimatedDeliveryTime(),
        description: getZoneDescription(),
        minimumOrder: 15 + index * 5,
        color: (sortedIsochrones[index]?.color) || "#34c759",
        distance: range,
        price: price,
        area: 0, // Will be calculated if needed
      };
    });

    setZoneDetails(details);
  }, [ranges, rangePrices, transportMode, rangeType, sortedIsochrones]);

  // Format range labels based on range type
  const formatRangeLabel = (index: number): string => {
    if (!zoneDetails[index]) return "";

    if (index === 0) {
      return `0-${zoneDetails[index].distance} ${rangeType === "distance" ? "km" : "min"}`;
    } else {
      const prevRange = zoneDetails[index - 1].distance;
      const currentRange = zoneDetails[index].distance;
      
      return `${prevRange}-${currentRange} ${rangeType === "distance" ? "km" : "min"}`;
    }
  };

  // Calculate delivery fee with editing capability
  const calculateDeliveryFee = (index: number): string => {
    if (!zoneDetails.length) return `GHS ${index * 3}.00`;

    const zone = zoneDetails[index];
    return zone.deliveryFee === 0 ? "Free Delivery" : `GHS ${zone.deliveryFee.toFixed(2)}`;
  };

  // Handle zone click from the map
  const handleZoneClick = (index: number) => {
    setActiveZoneIndex(activeZoneIndex === index ? null : index);
  };

  // Handle zone price editing
  const handleEditZone = (id: number, newPrice: number) => {
    const updatedDetails = zoneDetails.map((zone, index) => 
      index === id ? { ...zone, deliveryFee: newPrice, price: newPrice } : zone
    );
    setZoneDetails(updatedDetails);
    setEditingZone(null);
    
    // Show success feedback
    showSuccess("Zone updated");
  };

  // Handle zone removal
  const handleRemoveZone = (index: number) => {
    if (zoneDetails.length <= 1) return;
    
    const newDetails = zoneDetails.filter((_, i) => i !== index);
    const newIsochrones = sortedIsochrones.filter((_, i) => i !== index);
    
    setZoneDetails(newDetails);
    setSortedIsochrones(newIsochrones);
    
    showSuccess("Zone removed");
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
      const maxApiRange = 3600; // 60 minutes in seconds (API limit)
      const rangeInSeconds = Math.min(ranges[0] * 60, maxApiRange);

      // Call the GraphQL API to generate isochrone for this point
      const response = await generatePointIsochrone({
        variables: {
          input: {
            locations: [point], // [longitude, latitude]
            range: [rangeInSeconds],
            transportMode: transportMode,
            address: location?.address
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
    if (location && typeof extendedUtils !== 'undefined' && extendedUtils.createCoverageReport) {
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

  // Function to get suggested extension points
  const getSuggestedExtensionPoints = (): [number, number][] => {
    if (!mergedCoverage || !extendedZones.length) return [];

    if (typeof extendedUtils !== 'undefined' && extendedUtils.suggestExtensionPoints) {
      return extendedUtils.suggestExtensionPoints(
        extendedZones,
        mergedCoverage,
        3 // Suggest 3 points
      );
    }
    return [];
  };

  // Share zones
  const handleShareZones = () => {
    const shareData = {
      title: "Delivery Zones",
      text: `Delivery zones for ${location?.address}`,
      url: window.location.href,
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showSuccess("Link copied to clipboard!");
    }
    setShowShareMenu(false);
  };

  // Export zones
  const handleExportZones = () => {
    const exportData = {
      vendor: location,
      zones: sortedIsochrones,
      zoneDetails: zoneDetails,
      transportMode: transportMode,
      rangeType: rangeType,
      ranges: ranges,
      createdAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `delivery-zones-${location?.placeId || 'vendor'}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showSuccess("Zones exported successfully!");
    setShowShareMenu(false);
  };

  const showSuccess = (message: string) => {
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#34c759] text-white px-4 py-2 rounded-xl shadow-lg z-50 font-medium text-sm transition-all duration-300";
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.style.opacity = "0";
      alertDiv.style.transform = "translate(-50%, -20px)";
      setTimeout(() => alertDiv.remove(), 300);
    }, 2000);
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

  // Format error messages
  const formatErrorMessage = (errorMsg: string): string => {
    if (errorMsg.includes("Service Unavailable") || errorMsg.includes("503")) {
      return "The mapping service is temporarily unavailable. Please try again in a few moments.";
    }

    if (errorMsg.includes("Retrying in")) {
      return errorMsg;
    }

    return errorMsg;
  };

  const isServiceUnavailable =
    error?.includes("Service Unavailable") ||
    error?.includes("503") ||
    error?.includes("unavailable") ||
    error?.includes("Retrying");

  const totalCoverage = ranges.length > 0 ? Math.max(...ranges) : 0

  // Extended mode components
  const ExtendModeToggle = () => {
    if (!extendedMode || error) return null;

    return (
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
    );
  };;

  if (!location) return null;

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">
              Delivery Zones Preview
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Review and customize your delivery zones
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!error && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5e7] flex items-center justify-center transition-colors"
                >
                  <Share className="h-4 w-4 text-[#007aff]" />
                </button>

                {showShareMenu && (
                  <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-[#e5e5e7] p-2 min-w-[160px] z-30">
                    <button
                      onClick={handleShareZones}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f5f5f7] rounded-xl transition-colors"
                    >
                      <Share className="h-4 w-4 text-[#007aff]" />
                      <span className="text-sm">Share Zones</span>
                    </button>
                    <button
                      onClick={handleExportZones}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f5f5f7] rounded-xl transition-colors"
                    >
                      <Download className="h-4 w-4 text-[#007aff]" />
                      <span className="text-sm">Export Data</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
            <div className="relative h-[300px] md:h-[450px] rounded-xl overflow-hidden mb-6 border border-[#e5e5e7]">
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
              <>
                {/* Zone Details Cards */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2">
                      Your Zones ({zoneDetails.length})
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-[#007aff]/10 text-[#007aff] px-2 py-1 rounded-full">
                        {zoneDetails.length} zone{zoneDetails.length !== 1 ? "s" : ""}
                      </span>
                      <span className="text-xs bg-[#34c759]/10 text-[#34c759] px-2 py-1 rounded-full">
                        {totalCoverage}{rangeType === "distance" ? "km" : "min"} max
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {zoneDetails.map((zone, index) => (
                      <Card
                        key={index}
                        className={`border-t-4 transition-all hover:shadow-md cursor-pointer ${
                          activeZoneIndex === index
                            ? "ring-2 ring-blue-500 shadow-md scale-[1.02]"
                            : ""
                        }`}
                        style={{
                          borderTopColor: zone.color,
                        }}
                        onClick={() => handleZoneClick(index)}
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium text-[#1D1D1F] dark:text-white">
                              Zone {index + 1}
                            </h3>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingZone(editingZone === index ? null : index);
                                }}
                                className="text-[#007aff] hover:bg-[#007aff]/10 rounded-full p-1 transition-colors"
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                              {zoneDetails.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveZone(index);
                                  }}
                                  className="text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-full p-1 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            {formatRangeLabel(index)}
                          </p>
                          
                          <div className="flex justify-between items-center mb-3">
                            {editingZone === index ? (
                              <input
                                type="number"
                                min="0"
                                step="0.50"
                                defaultValue={zone.deliveryFee}
                                onBlur={(e) => handleEditZone(index, Number(e.target.value))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditZone(index, Number(e.currentTarget.value));
                                  }
                                }}
                                className="w-20 px-2 py-1 text-sm border border-[#e5e5e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <p className="text-lg font-semibold">
                                {calculateDeliveryFee(index)}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              Min. GHS {zone.minimumOrder}
                            </p>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {zone.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Est. delivery: {zone.estimatedDeliveryTime}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </>
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
                      {mergedCoverage && typeof extendedUtils !== 'undefined' && extendedUtils.calculateArea
                        ? extendedUtils.calculateArea(mergedCoverage).toFixed(1)
                        : 0}{" "}
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

            <div className="bg-[#f5f5f7] rounded-xl p-5 border border-[#e5e5e7]">
              <h4 className="font-medium mb-4">Delivery Zone Summary</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Vendor Location</p>
                  <p className="text-sm font-medium truncate">{location.address}</p>
                </div>
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Transport Mode</p>
                  <p className="text-sm font-medium capitalize">{transportMode}</p>
                </div>
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Max Coverage</p>
                  <p className="text-sm font-medium">{totalCoverage} {rangeType === "distance" ? "km" : "min"}</p>
                </div>
                <div>
                  <p className="text-xs text-[#86868b] mb-1">Total Zones</p>
                  <p className="text-sm font-medium">{zoneDetails.length}</p>
                </div>
              </div>
            </div>

            {!isExtendingEnabled && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium">
                  Click on any zone card or area on the map to focus on that specific delivery zone.
                </p>
                <p className="mt-1">
                  You can edit zone prices by clicking the edit icon on each zone card.
                </p>
                {extendedMode && (
                  <p className="mt-1">
                    Click "Extend Coverage" to add more points to your delivery area.
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
                    You can extend your delivery coverage by clicking "Extend Coverage" and adding additional points on the map.
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
              className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium"
            >
              Save Delivery Zones
            </Button>
          )}
        </div>
      </div>

      {/* Click outside to close share menu */}
      {showShareMenu && <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />}
    </div>
  );
}