"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  MapPin,
  Clock,
  Car,
  Bike,
  Truck,
  RefreshCw,
  History,
} from "lucide-react";
import { IsochroneMap } from "./isochrone-map";
import { useQuery, gql } from "@apollo/client";
import * as extendedUtils from "./extendedIsochroneUtils";
import { useAuth } from "@/middleware/context/authContext";

// Define the GET_ISOCHRONES_BY_RIDER query
export const GET_ISOCHRONES_BY_RIDER = gql`
  query GetAllIsochronesByRider($riderId: String!) {
    getAllIsochronesByRider(riderId: $riderId) {
      id
      geojson
      riderId
      range
      transportMode
      
      updatedAt
      address :locations
    }
  }
`;

type TransportMode = "walking" | "bike" | "motorbike" | "car";
type RangeType = "time" | "distance";

// Saved isochrone type
interface SavedIsochrone {
  id: string;
  geojson: any;
  riderId: string;
  range: number;
  transportMode: TransportMode;
  rangeType: RangeType;
  updatedAt: string;
  locations: string;
  address: string;
}

// Define zone colors that match the map colors - from green (closest) to red (farthest)
const zoneColors = [
  "#4ade80",
  "#facc15",
  "#f87171",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
];

export function ResultStepData() {
  const { user } = useAuth();
  const riderId = user?.id || null;

  // State to track which zone is active/selected
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);
  const [savedIsochrones, setSavedIsochrones] = useState<any[]>([]);
  const [groupedSavedIsochrones, setGroupedSavedIsochrones] = useState<{
    [key: string]: any[];
  }>({});

    // Fallback vendor location if no specific location is available
  const fallbackVendorLocation = {
    address: "Default Location",
    lat: 0,
    lng: 0
  };
  // Query to fetch saved isochrones
  const {
    data: savedIsochronesData,
    loading: isFetchingSaved,
    error: savedIsochronesError,
    refetch: refetchSavedIsochrones,
  } = useQuery(GET_ISOCHRONES_BY_RIDER, {
    variables: { riderId },
    skip: !riderId, // Skip if no riderId
    fetchPolicy: "network-only", // Always fetch from server
  });

  // Process saved isochrones when they are fetched
  useEffect(() => {
    if (savedIsochronesData?.getAllIsochronesByRider?.length > 0) {
      try {
        const isochronesByAddress: { [key: string]: any[] } = {};
        const allProcessedFeatures: any[] = [];

        // Group isochrones by address
        savedIsochronesData.getAllIsochronesByRider.forEach(
          (isochrone: SavedIsochrone) => {
            const address = isochrone.address || "Unknown location";

            if (!isochronesByAddress[address]) {
              isochronesByAddress[address] = [];
            }

            // Parse GeoJSON if it's a string
            const geoJsonData =
              typeof isochrone.geojson === "string"
                ? JSON.parse(isochrone.geojson)
                : isochrone.geojson;

            if (geoJsonData?.features && geoJsonData.features.length > 0) {
              // For each feature in the GeoJSON, calculate area and add metadata
              const enrichedFeatures = geoJsonData.features.map(
                (feature: any, idx: number) => {
                  const areaInSqKm = extendedUtils.calculateArea(feature);

                  // Add metadata to each feature for display and interaction
                  const enrichedFeature = {
                    ...feature,
                    properties: {
                      ...feature?.properties,
                      areaInSqKm,
                      isochrone_id: isochrone.id,
                      created_at: isochrone.updatedAt,
                      address: isochrone.address,
                      transportMode: isochrone.transportMode,
                      rangeType: "time",
                      range: isochrone.range,
                      group_index: idx, // For proper coloring
                      saved: true, // Flag as saved isochrone
                      color: zoneColors[idx % zoneColors.length],
                    },
                  };

                  return enrichedFeature;
                }
              );

              // Add to grouped isochrones by address
              isochronesByAddress[address].push(...enrichedFeatures);

              // Add to all processed features
              allProcessedFeatures.push(...enrichedFeatures);
            }
          }
        );

        // Update grouped state for UI
        setGroupedSavedIsochrones(isochronesByAddress);

        // Update flat list for map display
        setSavedIsochrones(allProcessedFeatures);

        console.log(
          `Loaded ${allProcessedFeatures.length} saved isochrones from ${
            Object.keys(isochronesByAddress).length
          } locations`
        );
      } catch (error) {
        console.error("Error processing saved isochrones:", error);
      }
    }
  }, [savedIsochronesData]);

  // Handle zone click from the map
  const handleZoneClick = (index: number) => {
    // Toggle selection - if already selected, deselect it
    setActiveZoneIndex(activeZoneIndex === index ? null : index);
  };

  // Function to get the appropriate transport icon
  const getTransportIcon = (transportMode: TransportMode) => {
    switch (transportMode) {
      case "walking":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "bike":
        return <Bike className="h-4 w-4 text-gray-500" />;
      case "motorbike":
        return <Truck className="h-4 w-4 text-gray-500" />;
      default:
        return <Car className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get summary statistics for saved isochrones
  const getSummaryStats = () => {
    const totalZones = savedIsochrones.length;
    const uniqueTransportModes = new Set(
      savedIsochrones.map((zone) => zone.properties?.transportMode || "unknown")
    ).size;
    const totalCoverage = savedIsochrones
      .reduce((sum, zone) => sum + (zone.properties?.areaInSqKm || 0), 0)
      .toFixed(1);
    const uniqueLocations = Object.keys(groupedSavedIsochrones).length;

    return { totalZones, uniqueTransportModes, totalCoverage, uniqueLocations };
  };

  const stats = getSummaryStats();

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">
              Saved Delivery Zones
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              View and manage your saved delivery zones
            </p>
          </div>

          <Button
            onClick={() => refetchSavedIsochrones()}
            disabled={isFetchingSaved}
            className="rounded-full px-4 py-1"
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${
                isFetchingSaved ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </div>

        {/* Loading state */}
        {isFetchingSaved && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl flex items-start">
            <RefreshCw className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
            <div className="flex-1">
              <p className="font-medium">Loading saved delivery zones...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {savedIsochronesError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Error loading saved zones</p>
              <p className="mt-1 text-sm">
                {savedIsochronesError.message || "Failed to load saved delivery zones"}
              </p>
            </div>
          </div>
        )}

        {/* No data state */}
        {!isFetchingSaved && !savedIsochronesError && savedIsochrones.length === 0 && (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No saved delivery zones
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              You haven't created any delivery zones yet. Create your first zone to get started.
            </p>
          </div>
        )}

        {/* Summary statistics */}
        {savedIsochrones.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Zones
                </p>
                <p className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                  {stats.totalZones}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Transport Modes
                </p>
                <p className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                  {stats.uniqueTransportModes}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Coverage
                </p>
                <p className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                  {stats.totalCoverage} km²
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Locations
                </p>
                <p className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                  {stats.uniqueLocations}
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Map with all saved isochrones */}
        {savedIsochrones.length > 0 && (
          <div className="h-[400px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#2C2C2E]">
            <IsochroneMap
              vendorLocation={fallbackVendorLocation}
              isochrones={savedIsochrones}
              transportMode="car"
              rangeType="time"
              ranges={[]}
              activeZoneIndex={activeZoneIndex}
              onZoneClick={handleZoneClick}
              extendedMode={false}
              allowExtending={false}
              showSavedIsochrones={true}
            />
          </div>
        )}

        {/* List of saved locations */}
        {Object.keys(groupedSavedIsochrones).length > 0 && (
          <Card className="p-4">
            <h3 className="font-medium text-[#1D1D1F] dark:text-white mb-4">
              Saved Locations ({Object.keys(groupedSavedIsochrones).length})
            </h3>
            <div className="space-y-4">
              {Object.entries(groupedSavedIsochrones).map(
                ([address, zones], idx) => {
                  // Get unique transport modes for this location
                  const transportModes = [...new Set(
                    zones.map(zone => zone.properties?.transportMode)
                  )];
                  
                  // Get total coverage for this location
                  const totalCoverage = zones.reduce(
                    (sum, zone) => sum + (zone.properties?.areaInSqKm || 0),
                    0
                  ).toFixed(1);

                  // Get the most recent update
                  const lastUpdated = zones.reduce((latest, zone) => {
                    const zoneDate = new Date(zone.properties?.created_at);
                    return zoneDate > latest ? zoneDate : latest;
                  }, new Date(0));

                  return (
                    <div
                      key={idx}
                      className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <MapPin className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-[#1D1D1F] dark:text-white">
                              {address}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                              <span>{zones.length} zones</span>
                              <span>{totalCoverage} km² coverage</span>
                              <span>Updated {lastUpdated.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {transportModes.map((mode, modeIdx) => (
                                <div
                                  key={modeIdx}
                                  className="flex items-center gap-1 text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded-md"
                                >
                                  {getTransportIcon(mode as TransportMode)}
                                  <span className="capitalize">{mode}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Zone ID: {zones[0]?.properties?.isochrone_id}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </Card>
        )}

        {/* Zone details for selected zone */}
        {activeZoneIndex !== null && savedIsochrones[activeZoneIndex] && (
          <Card className="p-4 border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-[#1D1D1F] dark:text-white mb-3">
              Selected Zone Details
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              {(() => {
                const zone = savedIsochrones[activeZoneIndex];
                const props = zone.properties;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                      <p className="font-medium">{props?.address || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Transport</p>
                      <div className="flex items-center gap-1">
                        {getTransportIcon(props?.transportMode)}
                        <span className="font-medium capitalize">{props?.transportMode}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Range</p>
                      <p className="font-medium">
                        {props?.range} {props?.rangeType === "time" ? "min" : "km"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Coverage</p>
                      <p className="font-medium">{props?.areaInSqKm?.toFixed(1)} km²</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}