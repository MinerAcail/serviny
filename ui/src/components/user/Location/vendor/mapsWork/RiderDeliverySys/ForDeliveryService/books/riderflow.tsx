// RiderZoneSetup.tsx - Main component (Clean & Fixed)

import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { useJsApiLoader } from "@react-google-maps/api";
import {
  Search,
  MapPin,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Settings,
  Loader2,
  Layers,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "@apollo/client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import our separated modules
import { SearchLocationDialog } from "./SearchLocationDialog";
import { ZoneConfigDialog } from "./ZoneConfigDialog";
import {
  Zone,
  Location,
  RiderRange,
  SPEED_MAPPING,
  GET_RIDER_RANGES,
  CREATE_RIDER_RANGE,
  UPDATE_RIDER_RANGE,
  DELETE_RIDER_RANGE,
  convertZoneToRiderRangeInput,
  convertRiderRangeToZone,
} from "./types";

// Import constants from your config
import { ZONE_COLORS } from "@/components/config/map";
import { GOOGLE_MAPS_CONFIG } from "@/components/global/formatPrice";

export default function RiderZoneSetup() {
  // Environment and API Keys
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // GraphQL hooks
  const {
    data: riderRangesData,
    loading: loadingRanges,
    refetch: refetchRanges,
  } = useQuery(GET_RIDER_RANGES, {
    onError: (error) => {
      console.error("Error loading rider ranges:", error);
      toast.error("Failed to load existing zones");
    },
  });

  const [createRiderRange, { loading: creatingRange }] = useMutation(
    CREATE_RIDER_RANGE,
    {
      onError: (error) => {
        console.error("Error creating rider range:", error);
        toast.error("Failed to create zone");
      },
    }
  );

  const [updateRiderRange, { loading: updatingRange }] = useMutation(
    UPDATE_RIDER_RANGE,
    {
      onError: (error) => {
        console.error("Error updating rider range:", error);
        toast.error("Failed to update zone");
      },
    }
  );

  const [deleteRiderRange, { loading: deletingRange }] = useMutation(
    DELETE_RIDER_RANGE,
    {
      onError: (error) => {
        console.error("Error deleting rider range:", error);
        toast.error("Failed to delete zone");
      },
    }
  );

  // Google Maps API Loading
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Basic State Management
  const [centerLocation, setCenterLocation] = useState<Location | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(true);

  // Zone configuration state
  const [zoneMethod, setZoneMethod] = useState<"distance" | "time">("distance");
  const [transportMode, setTransportMode] = useState<
    "walking" | "cycling" | "driving"
  >("driving");
  const [zones, setZones] = useState<Zone[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Map state - WITH COUNTDOWN
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitializing, setMapInitializing] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [showAllZones, setShowAllZones] = useState(false);
  const [mapStyle, setMapStyle] = useState("streets");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
    data?: any;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showMapStyleButtonDialog, setShowMapStyleButtonDialog] =
    useState(false);

  // Refs for DOM elements and services
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const centerMarker = useRef<maplibregl.Marker | null>(null);

  // ============== FUNCTIONS ==============

  // Location selection handler
  const handleLocationSelect = useCallback((location: Location) => {
    setCenterLocation(location);

    // Update map view and marker
    if (mapInstance.current) {
      // Remove existing marker
      if (centerMarker.current) {
        centerMarker.current.remove();
      }

      // Add new marker with popup
      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-2">
            <strong class="block text-gray-900">Service Location</strong>
            <span class="text-sm text-gray-600">${location.address}</span>
          </div>
        `);

      centerMarker.current = new maplibregl.Marker({
        color: "#0071E3",
        scale: 1.2,
      })
        .setLngLat(location.coordinates)
        .setPopup(popup)
        .addTo(mapInstance.current);

      // Fly to location with smooth animation
      mapInstance.current.flyTo({
        center: location.coordinates,
        zoom: 14,
        duration: 1500,
        essential: true,
      });
    }

    // Clear any previous validation errors
    setValidationErrors([]);

    // Show welcome message with next steps
    toast.success(
      "Location selected! You can now configure your delivery zones.",
      {
        description: "Click the settings button to set up your pricing zones.",
        duration: 5000,
      }
    );
  }, []);

  // Zone validation
  const validateZones = useCallback(() => {
    const errors: string[] = [];

    zones.forEach((zone, index) => {
      if (zone.price <= 0) {
        errors.push(`Zone ${index + 1}: Price must be greater than 0`);
      }

      const zoneSize = zone.max - zone.min;
      const minSize = zoneMethod === "distance" ? 0.5 : 1;
      if (zoneSize < minSize) {
        errors.push(
          `Zone ${index + 1}: Zone too small (minimum ${minSize} ${
            zoneMethod === "distance" ? "km" : "min"
          })`
        );
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  }, [zones, zoneMethod]);

  // Generate zone polygons
  const generateZonePolygons = useCallback(() => {
    if (!centerLocation || !mapLoaded || !mapInstance.current) return;

    const map = mapInstance.current;

    // Remove existing zones
    for (let i = 0; i < 20; i++) {
      const layerId = `zone-fill-${i}`;
      const outlineId = `zone-outline-${i}`;

      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getLayer(outlineId)) map.removeLayer(outlineId);
      if (map.getSource(layerId)) map.removeSource(layerId);
    }

    if (!map.isStyleLoaded()) {
      setTimeout(generateZonePolygons, 200);
      return;
    }

    zones.forEach((zone, index) => {
      let polygon;

      try {
        if (zoneMethod === "distance") {
          const outerCircle = turf.circle(
            centerLocation.coordinates,
            zone.max,
            {
              units: "kilometers",
              steps: 64,
            }
          );

          if (zone.min > 0) {
            const innerCircle = turf.circle(
              centerLocation.coordinates,
              zone.min,
              {
                units: "kilometers",
                steps: 64,
              }
            );

            try {
              const outerFeature = turf.feature(outerCircle.geometry);
              const innerFeature = turf.feature(innerCircle.geometry);
              polygon = turf.difference(outerFeature, innerFeature);

              if (!polygon) {
                polygon = outerCircle;
              }
            } catch (diffError) {
              polygon = outerCircle;
            }
          } else {
            polygon = outerCircle;
          }
        } else {
          const speed = SPEED_MAPPING[transportMode];
          const outerDistance = (zone.max * speed) / 60;
          const innerDistance = zone.min > 0 ? (zone.min * speed) / 60 : 0;

          const outerCircle = turf.circle(
            centerLocation.coordinates,
            outerDistance,
            {
              units: "kilometers",
              steps: 64,
            }
          );

          if (innerDistance > 0) {
            const innerCircle = turf.circle(
              centerLocation.coordinates,
              innerDistance,
              {
                units: "kilometers",
                steps: 64,
              }
            );

            try {
              const outerFeature = turf.feature(outerCircle.geometry);
              const innerFeature = turf.feature(innerCircle.geometry);
              polygon = turf.difference(outerFeature, innerFeature);

              if (!polygon) {
                polygon = outerCircle;
              }
            } catch (diffError) {
              polygon = outerCircle;
            }
          } else {
            polygon = outerCircle;
          }
        }

        if (polygon && polygon.geometry) {
          const layerId = `zone-fill-${index}`;
          const outlineId = `zone-outline-${index}`;

          if (map.getSource(layerId)) {
            map.removeSource(layerId);
          }

          map.addSource(layerId, {
            type: "geojson",
            data: polygon,
          });

          map.addLayer({
            id: layerId,
            type: "fill",
            source: layerId,
            paint: {
              "fill-color": zone.color,
              "fill-opacity": zone.isLocal ? 0.15 : 0.2,
            },
          });

          map.addLayer({
            id: outlineId,
            type: "line",
            source: layerId,
            paint: {
              "line-color": zone.color,
              "line-width": zone.isLocal ? 3 : 2,
              "line-opacity": 0.8,
              "line-dasharray": zone.isLocal ? [2, 2] : undefined,
            },
          });
        }
      } catch (error) {
        console.error(`Error generating polygon for zone ${index}:`, error);
      }
    });
  }, [centerLocation, zones, zoneMethod, transportMode, mapLoaded]);

  const addCustomZone = useCallback(
    (zoneData: { min: number; max: number; price: number }) => {
      const newZone: Zone = {
        id: `zone_${Date.now()}`,
        min: zoneData.min,
        max: zoneData.max,
        price: zoneData.price,
        color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
        isLocal: true,
      };

      setZones([...zones, newZone]);
      toast.success("Custom zone added (not saved yet)");
    },
    [zones]
  );

  const removeZone = useCallback(
    async (zoneId: string) => {
      if (zones.length <= 1) {
        toast.error("You must have at least one zone");
        return;
      }

      const zoneToRemove = zones.find((zone) => zone.id === zoneId);
      if (!zoneToRemove) return;

      if (zoneToRemove.backendId && !zoneToRemove.isLocal) {
        try {
          await deleteRiderRange({
            variables: {
              id: zoneToRemove.backendId,
            },
          });
          toast.success("Zone deleted successfully");
          await refetchRanges();
        } catch (error) {
          console.error("Error deleting zone:", error);
          return;
        }
      } else {
        setZones(zones.filter((zone) => zone.id !== zoneId));
        toast.success("Zone removed");
      }
    },
    [zones, deleteRiderRange, refetchRanges]
  );

  const updateZone = useCallback(
    (zoneId: string, field: keyof Zone, value: string | number) => {
      const numValue =
        typeof value === "string" ? Number.parseFloat(value) || 0 : value;
      const zoneIndex = zones.findIndex((zone) => zone.id === zoneId);

      if (zoneIndex === -1) return;

      const updatedZones = [...zones];
      const currentZone = updatedZones[zoneIndex];

      if (field === "min" || field === "max") {
        if (field === "min") {
          const newMin = Math.max(0, numValue);
          const newMax = Math.max(
            newMin + (zoneMethod === "distance" ? 0.5 : 1),
            currentZone.max
          );

          updatedZones[zoneIndex] = {
            ...currentZone,
            min: newMin,
            max: newMax,
            isLocal: true,
          };
        } else if (field === "max") {
          const newMax = numValue;
          const newMin = Math.min(
            currentZone.min,
            newMax - (zoneMethod === "distance" ? 0.5 : 1)
          );

          updatedZones[zoneIndex] = {
            ...currentZone,
            min: Math.max(0, newMin),
            max: newMax,
            isLocal: true,
          };
        }
      } else {
        updatedZones[zoneIndex] = {
          ...currentZone,
          [field]: field === "price" ? Number(numValue.toFixed(2)) : numValue,
          isLocal: true,
        };
      }

      setZones(updatedZones.sort((a, b) => a.min - b.min));
    },
    [zones, zoneMethod]
  );

  // Save all zones to backend
  const handleSave = useCallback(async () => {
    if (!centerLocation) {
      toast.error("Please select a service location first");
      return;
    }

    if (!validateZones()) {
      toast.error("Please fix validation errors before saving");
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);

    try {
      let savedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const zone of zones) {
        try {
          const riderRangeInput = convertZoneToRiderRangeInput(
            zone,
            zoneMethod,
            transportMode
          );

          if (zone.backendId && !zone.isLocal) {
            continue;
          } else if (zone.backendId && zone.isLocal) {
            await updateRiderRange({
              variables: {
                input: {
                  id: zone.backendId,
                  ...riderRangeInput,
                },
              },
            });
            updatedCount++;
          } else {
            const { data } = await createRiderRange({
              variables: {
                input: riderRangeInput,
              },
            });

            if (data?.createRiderRange) {
              zone.backendId = data.createRiderRange.id;
              zone.isLocal = false;
              savedCount++;
            }
          }
        } catch (error) {
          console.error(`Error saving zone ${zone.id}:`, error);
          errorCount++;
        }
      }

      const finalZones = zones.map((zone) => ({ ...zone, isLocal: false }));
      setZones(finalZones);

      await refetchRanges();

      const message = `Configuration saved! ${savedCount} new zones created, ${updatedCount} zones updated${
        errorCount > 0 ? `, ${errorCount} errors` : ""
      }`;

      setSaveStatus({
        type: errorCount === 0 ? "success" : "error",
        message,
      });

      if (errorCount === 0) {
        toast.success(message);
      } else {
        toast.error(message);
      }

      setTimeout(() => setSaveStatus(null), 5000);
    } catch (error: any) {
      console.error("Save error:", error);
      const errorMessage = "Failed to save configuration. Please try again.";

      setSaveStatus({
        type: "error",
        message: errorMessage,
      });

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [
    centerLocation,
    validateZones,
    zones,
    zoneMethod,
    transportMode,
    createRiderRange,
    updateRiderRange,
    refetchRanges,
  ]);

  // Reset zones to server state
  const handleReset = useCallback(async () => {
    try {
      await refetchRanges();
      toast.success("Zones reset to saved state");
    } catch (error) {
      toast.error("Failed to reset zones");
    }
  }, [refetchRanges]);

  // ============== MAP INITIALIZATION WITH COUNTDOWN ==============

  // Initialize map initialization function
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error("Map container not available during initialization");
      setShowCountdown(false);
      setMapInitializing(false);
      setMapLoaded(true);
      toast.error("Map container not ready. Please refresh the page.");
      return;
    }

    console.log("Initializing map now...");
    setMapInitializing(true);
    setShowCountdown(false);

    let mapStyleUrl = "https://demotiles.maplibre.org/style.json";

    if (maptilerApiKey) {
      switch (mapStyle) {
        case "streets":
          mapStyleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`;
          break;
        case "satellite":
          mapStyleUrl = `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerApiKey}`;
          break;
        case "terrain":
          mapStyleUrl = `https://api.maptiler.com/maps/outdoor/style.json?key=${maptilerApiKey}`;
          break;
        default:
          mapStyleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`;
      }
    }

    try {
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyleUrl,
        center: [-74.006, 40.7128], // NYC default
        zoom: 11,
        attributionControl: false,
      });

      mapInstance.current = map;

      map.on("load", () => {
        setMapLoaded(true);
        setMapInitializing(false);
        console.log("Map loaded successfully!");
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
        setMapInitializing(false);
        if (maptilerApiKey && e.error?.status === 401) {
          console.log("API key error, falling back to demo tiles...");
          map.setStyle("https://demotiles.maplibre.org/style.json");
        } else {
          console.error("Map failed to load");
        }
      });

      map.on("styledata", () => {
        console.log("Map style loaded");
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");

      // Set a fallback timeout in case the load event never fires
      setTimeout(() => {
        if (!mapLoaded) {
          console.log("Map load timeout, assuming map is ready");
          setMapLoaded(true);
          setMapInitializing(false);
        }
      }, 10000); // 10 second fallback
    } catch (error) {
      console.error("Failed to initialize map:", error);
      setMapInitializing(false);
      setMapLoaded(true); // Hide loading state even on error
      toast.error("Failed to initialize map", {
        description: "Please check your internet connection and try again.",
      });
    }
  }, [maptilerApiKey, mapStyle, mapLoaded]);

  // ============== USEEFFECTS ==============

  // Countdown effect - Start immediately on mount
  useEffect(() => {
    console.log("Component mounted, starting countdown...");

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        console.log(`Countdown: ${newCount}`);

        if (newCount <= 0) {
          clearInterval(countdownInterval);
          setTimeout(() => {
            if (mapRef.current) {
              initializeMap();
            } else {
              console.error("Map container not ready after countdown");
              setTimeout(() => {
                if (mapRef.current) {
                  initializeMap();
                } else {
                  toast.error("Map container failed to initialize");
                }
              }, 500);
            }
          }, 100);
        }

        return newCount;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [initializeMap]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      console.log("Cleaning up map...");
      if (centerMarker.current) {
        centerMarker.current.remove();
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // Update map style when it changes
  useEffect(() => {
    if (!mapInstance.current || !maptilerApiKey || !mapLoaded) return;

    let styleUrl = "https://demotiles.maplibre.org/style.json";

    if (maptilerApiKey) {
      switch (mapStyle) {
        case "streets":
          styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`;
          break;
        case "satellite":
          styleUrl = `https://api.maptiler.com/maps/hybrid/style.json?key=${maptilerApiKey}`;
          break;
        case "terrain":
          styleUrl = `https://api.maptiler.com/maps/outdoor/style.json?key=${maptilerApiKey}`;
          break;
        default:
          styleUrl = `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`;
      }
    }

    mapInstance.current.setStyle(styleUrl);
  }, [mapStyle, maptilerApiKey, mapLoaded]);

  // Load existing rider ranges on component mount and when data changes
  useEffect(() => {
    if (
      riderRangesData?.getRiderRanges &&
      Array.isArray(riderRangesData.getRiderRanges)
    ) {
      const loadedZones = riderRangesData.getRiderRanges.map(
        (range: RiderRange, index: number) =>
          convertRiderRangeToZone(
            range,
            zoneMethod,
            transportMode,
            index,
            ZONE_COLORS
          )
      );

      loadedZones.sort((a, b) => a.min - b.min);
      setZones(loadedZones);
      setHasUnsavedChanges(false);

      if (loadedZones.length > 0) {
        toast.success(`Loaded ${loadedZones.length} existing zones`);
      }
    } else if (
      riderRangesData?.getRiderRanges &&
      riderRangesData.getRiderRanges.length === 0
    ) {
      const defaultZones: Zone[] = [
        {
          id: "zone_1",
          min: 0,
          max: 3,
          price: 5.0,
          color: ZONE_COLORS[0],
          isLocal: true,
        },
        {
          id: "zone_2",
          min: 3,
          max: 6,
          price: 8.0,
          color: ZONE_COLORS[1],
          isLocal: true,
        },
      ];
      setZones(defaultZones);
      setHasUnsavedChanges(true);
    }
  }, [riderRangesData, zoneMethod, transportMode]);

  // Track unsaved changes
  useEffect(() => {
    const hasLocalZones = zones.some((zone) => zone.isLocal);
    setHasUnsavedChanges(hasLocalZones);
  }, [zones]);

  // Update visualization when zones change
  useEffect(() => {
    if ((showPreview || showAllZones) && centerLocation) {
      const timeoutId = setTimeout(() => {
        generateZonePolygons();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [
    generateZonePolygons,
    showPreview,
    showAllZones,
    centerLocation,
    zones.length,
  ]);

  // Validate zones when they change
  useEffect(() => {
    validateZones();
  }, [validateZones]);

  // ============== RENDER ==============

  // Render Loading State
  if (!isLoaded || loadingRanges) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  const isProcessing = creatingRange || updatingRange || deletingRange;

  // Main Component Render
  return (
    <TooltipProvider>
      <div className="w-full h-screen bg-gray-50 relative overflow-hidden">
        {/* Search Location Dialog */}
        <SearchLocationDialog
          isOpen={showSearchDialog}
          onOpenChange={setShowSearchDialog}
          onLocationSelect={handleLocationSelect}
          isLoaded={isLoaded}
          currentLocation={centerLocation}
        />

        {/* Zone Configuration Dialog */}
        <ZoneConfigDialog
          isOpen={showConfigDialog}
          onOpenChange={setShowConfigDialog}
          zones={zones}
          setZones={setZones}
          zoneMethod={zoneMethod}
          setZoneMethod={setZoneMethod}
          transportMode={transportMode}
          setTransportMode={setTransportMode}
          hasUnsavedChanges={hasUnsavedChanges}
          validationErrors={validationErrors}
          showPreview={showPreview}
          setShowPreview={setShowPreview}
          centerLocation={centerLocation}
          isSaving={isSaving}
          isProcessing={isProcessing}
          saveStatus={saveStatus}
          onSave={handleSave}
          onReset={handleReset}
          onAddZone={addCustomZone}
          onUpdateZone={updateZone}
          onRemoveZone={removeZone}
        />

        {/* Map Container */}
        <div className="w-full h-full relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* Map loading overlay with countdown */}
          {(!mapLoaded || mapInitializing || showCountdown) && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
              <div className="text-center">
                {showCountdown ? (
                  <>
                    <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-2xl font-bold">
                      {countdown}
                    </div>
                    <p className="text-gray-700 text-lg font-semibold">
                      Waiting to initialize...
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Starting in {countdown} second{countdown !== 1 ? "s" : ""}
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {mapInitializing ? "Loading map..." : "Preparing..."}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {mapInitializing
                        ? "Setting up map tiles"
                        : "Getting ready"}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Search Bar Trigger - Only show when location is selected */}
          {centerLocation && (
            <div className="absolute top-4 left-4 z-20">
              <Tooltip>
                <TooltipContent>
                  <p>Change service location</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Welcome Message - Show when no location is selected */}
          {!centerLocation && !showSearchDialog && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="text-center max-w-md mx-auto p-8">
                <MapPin className="w-16 h-16 mx-auto mb-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Zone Setup
                </h2>
                <p className="text-gray-600 mb-6">
                  To create your delivery zones, you need to first select your
                  service location.
                </p>
                <Button
                  onClick={() => setShowSearchDialog(true)}
                  size="lg"
                  className="rounded-2xl px-8 py-4"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Set Service Location
                </Button>
              </div>
            </div>
          )}

          {/* Map Controls - Right Side - Only show when location is selected */}
          {centerLocation && (
            <div className="absolute top-20 right-4 z-10 flex flex-col space-y-3">
              {/* Configuration Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => setShowConfigDialog(true)}
                    className="w-12 h-12 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-gray-100 rounded-2xl border-0 relative"
                  >
                    <Settings className="h-5 w-5" />
                    {hasUnsavedChanges && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>
                    Zone Configuration{" "}
                    {hasUnsavedChanges && "(Unsaved Changes)"}
                  </p>
                </TooltipContent>
              </Tooltip>

              {/* Zone Visibility Toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-12 h-12 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-gray-100 rounded-2xl border-0"
                    onClick={() => setShowAllZones(!showAllZones)}
                  >
                    {showAllZones ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>{showAllZones ? "Hide all zones" : "Show all zones"}</p>
                </TooltipContent>
              </Tooltip>

              {/* Map Style Selector */}
              <DropdownMenu
                open={showMapStyleButtonDialog}
                onOpenChange={setShowMapStyleButtonDialog}
              >
                <DropdownMenuTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="w-12 h-12 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-gray-100 rounded-2xl border-0"
                      >
                        <Layers className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left">
                      <p>Map Style</p>
                    </TooltipContent>
                  </Tooltip>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl">
                  <DropdownMenuLabel>Map Style</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setMapStyle("streets")}
                    className="rounded-xl"
                  >
                    {mapStyle === "streets" && (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Streets
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setMapStyle("satellite")}
                    className="rounded-xl"
                  >
                    {mapStyle === "satellite" && (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Satellite
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setMapStyle("terrain")}
                    className="rounded-xl"
                  >
                    {mapStyle === "terrain" && (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Terrain
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reload Map Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => window.location.reload()}
                    className="w-12 h-12 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-gray-100 rounded-2xl border-0"
                  >
                    <RefreshCw className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Reload Page</p>
                </TooltipContent>
              </Tooltip>
              {/* Reload Map Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    // onClick={() => window.location.reload()}
                    onClick={() => setShowSearchDialog(true)}
                    className="w-12 h-12 bg-white/95 backdrop-blur-sm shadow-lg hover:bg-gray-100 rounded-2xl border-0"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Location</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Zone Legend */}
          {mapLoaded &&
            centerLocation &&
            (showPreview || showAllZones) &&
            zones.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg max-w-xs">
                <div className="text-sm font-medium text-gray-900 mb-3">
                  Zone Legend
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {zones.map((zone, index) => (
                    <div key={zone.id} className="flex items-center text-xs">
                      <div
                        className="w-3 h-3 rounded-full mr-3 border"
                        style={{
                          backgroundColor: zone.color,
                          borderStyle: zone.isLocal ? "dashed" : "solid",
                          borderColor: zone.color,
                          borderWidth: zone.isLocal ? "2px" : "1px",
                        }}
                      ></div>
                      <span className="text-gray-700 flex-1">
                        Zone {index + 1}: {zone.min}-{zone.max}{" "}
                        {zoneMethod === "distance" ? "km" : "min"} (GH₵
                        {zone.price.toFixed(2)})
                      </span>
                      {zone.isLocal ? (
                        <AlertCircle className="w-3 h-3 text-amber-600 ml-1" />
                      ) : (
                        <CheckCircle className="w-3 h-3 text-green-600 ml-1" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Method: {zoneMethod}{" "}
                    {zoneMethod === "time" && `(${transportMode})`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {zones.filter((z) => !z.isLocal).length}/{zones.length}{" "}
                    zones saved
                  </div>
                  {hasUnsavedChanges && (
                    <div className="text-xs text-amber-600 mt-1">
                      {zones.filter((z) => z.isLocal).length} unsaved changes
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-40">
              <div className="bg-white rounded-2xl p-6 flex items-center space-x-3 shadow-lg">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-gray-900 font-medium">
                  {creatingRange && "Creating zone..."}
                  {updatingRange && "Updating zone..."}
                  {deletingRange && "Deleting zone..."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
