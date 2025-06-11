
import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import {
  Search,
  MapPin,
  Clock,
  Ruler,
  Plus,
  Trash2,
  Save,
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
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { gql } from "@apollo/client";
import { ZONE_COLORS } from "@/components/config/map";
// import { GOOGLE_MAPS_CONFIG } from "@/components/serviceProviders/DELIVERY_ENTERPRISE/liveMap/liveMap";

// GraphQL Operations (keeping your original schema)
export const GET_RIDER_RANGES = gql`
   query getRiderRanges{
    getRiderRanges{
      id
      riderId
      startKm
      endKm
      price
      updatedAt
    }
  }
`;

export const CREATE_RIDER_RANGE = gql`
  mutation createRiderRange($input: NewRiderRangeInput!) {
    createRiderRange(input: $input) {
      id
      riderId
      startKm
      endKm
      price
    }
  }
`;

export const UPDATE_RIDER_RANGE = gql`
  mutation updateRiderRange($input: UpdateRiderRangeInput!) {
    updateRiderRange(input: $input) {
      id
      riderId
      startKm
      endKm
      price
    }
  }
`;

export const DELETE_RIDER_RANGE = gql`
  mutation deleteRiderRange($id: String!) {
    deleteRiderRange(id: $id)
  }
`;

// Types
interface Zone {
  id: string;
  min: number;
  max: number;
  price: number;
  color: string;
  backendId?: string; // Maps to RiderRange.id
  isLocal?: boolean; // True for new zones not yet saved
}

interface Location {
  coordinates: [number, number];
  address: string;
  placeId: string;
}

interface RiderRange {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
  updatedAt?: string;
}

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places", "geocoding"];


// Speed mappings for time-based zones (km/h)
const SPEED_MAPPING = {
  walking: 5,
  cycling: 15,
  driving: 40,
};

// Utility functions for data conversion
const convertZoneToRiderRangeInput = (
  zone: Zone,
  zoneMethod: "distance" | "time",
  transportMode: "walking" | "cycling" | "driving"
) => {
  let startKm = zone.min;
  let endKm = zone.max;

  // Convert time-based zones to distance for backend storage
  if (zoneMethod === "time") {
    const speed = SPEED_MAPPING[transportMode];
    startKm = (zone.min * speed) / 60; // Convert minutes to hours, then to km
    endKm = (zone.max * speed) / 60;
  }

  return {
    startKm: Number(startKm.toFixed(2)),
    endKm: Number(endKm.toFixed(2)),
    price: Number(zone.price.toFixed(2)),
  };
};

const convertRiderRangeToZone = (
  riderRange: RiderRange,
  zoneMethod: "distance" | "time",
  transportMode: "walking" | "cycling" | "driving",
  colorIndex: number
): Zone => {
  let min = riderRange.startKm;
  let max = riderRange.endKm;

  // Convert distance back to time for display if needed
  if (zoneMethod === "time") {
    const speed = SPEED_MAPPING[transportMode];
    min = (riderRange.startKm * 60) / speed; // Convert km to minutes
    max = (riderRange.endKm * 60) / speed;
  }

  return {
    id: `zone_${riderRange.id}`,
    min: Number(min.toFixed(1)),
    max: Number(max.toFixed(1)),
    price: riderRange.price,
    color: ZONE_COLORS[colorIndex % ZONE_COLORS.length],
    backendId: riderRange.id,
    isLocal: false,
  };
};

export function RiderZoneSetup() {
  // Environment and API Keys
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
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
 const GOOGLE_MAPS_CONFIG = {
  id: "google-map-script", // Keep this consistent
  googleMapsApiKey: googleMapsApiKey,
  libraries: libraries,
}
  // Google Maps API Loading
  const { isLoaded } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Basic State Management
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [centerLocation, setCenterLocation] = useState<Location | null>(null);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

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
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error";
    message: string;
    data?: any;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddZoneDialog, setShowAddZoneDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [showMapStyleButtonDialog, setShowMapStyleButtonDialog] = useState(false);
  const [newZoneData, setNewZoneData] = useState({
    min: 0,
    max: 3,
    price: 5.0,
  });

  // Refs for DOM elements and services
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const centerMarker = useRef<maplibregl.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Google Places services
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // ============== FUNCTIONS - DEFINED ONCE ==============

  // Search implementation
const searchWithGooglePlaces = useCallback(async (query: string) => {
  if (!isLoaded || !autocompleteServiceRef.current) {
    setIsSearching(false);
    toast.error("Search service not ready. Please wait a moment and try again.");
    return;
  }

  setIsSearching(true);
  
  try {
    const request = {
      input: query,
      types: ['geocode'], 
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsSearching(false);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const formattedPredictions = predictions.map((prediction) => ({
            placeId: prediction.place_id,
            description: prediction.description,
            structured_formatting: {
              main_text: prediction.structured_formatting?.main_text || prediction.description,
              secondary_text: prediction.structured_formatting?.secondary_text || '',
            },
            coordinates: null, // Will be geocoded when selected
            address: prediction.description,
          }));
          
          setPredictions(formattedPredictions);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
          
          // Handle different status codes
          switch (status) {
            case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
              toast.error("No results found for your search.");
              break;
            case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
              toast.error("Search quota exceeded. Please try again later.");
              break;
            case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
              toast.error("Search request denied. Please check your API key.");
              break;
            case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
              toast.error("Invalid search request.");
              break;
            default:
              toast.error("Search service temporarily unavailable.");
          }
        }
      }
    );
  } catch (error) {
    console.error("Google Places search error:", error);
    setIsSearching(false);
    toast.error("Search service error. Please try again.");
    setPredictions([]);
    setShowPredictions(false);
  }
}, [isLoaded]);

// Enhanced location selection handler for Google Places
const handleLocationSelection = useCallback(async (prediction: any) => {
  if (!placesServiceRef.current || !geocoderRef.current) {
    toast.error("Location service not ready. Please try again.");
    return;
  }

  setIsLoading(true);
  setShowPredictions(false);

  try {
    // Use Places Service to get detailed information
    const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
      const request = {
        placeId: prediction.placeId,
        fields: ['geometry', 'formatted_address', 'name', 'types'],
      };

      placesServiceRef.current!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Failed to get place details: ${status}`));
        }
      });
    });

    if (!placeDetails.geometry?.location) {
      throw new Error('No location data available for this place');
    }

    const lat = placeDetails.geometry.location.lat();
    const lng = placeDetails.geometry.location.lng();
    const coordinates: [number, number] = [lng, lat]; // MapLibre uses [lng, lat] format

    const location: Location = {
      coordinates: coordinates,
      address: placeDetails.formatted_address || prediction.address,
      placeId: prediction.placeId,
    };

    setCenterLocation(location);
    setSearchQuery(location.address);

    // Update map view and marker
    if (mapInstance.current) {
      // Remove existing marker
      if (centerMarker.current) {
        centerMarker.current.remove();
      }

      // Add new marker with popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
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

    toast.success("Location selected successfully!");
    
    // Clear any previous validation errors
    setValidationErrors([]);
    
  } catch (error) {
    console.error("Error selecting location:", error);
    toast.error("Failed to select location. Please try another search.");
  } finally {
    setIsLoading(false);
  }
}, []);
const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  setSearchQuery(value);
  
  if (value.length > 2) {
    setShowPredictions(true);
    // Debounce the search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchWithGooglePlaces(value);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  } else {
    setPredictions([]);
    setShowPredictions(false);
    setIsSearching(false);
  }
}, [searchWithGooglePlaces]);

// Add a current location handler
const handleCurrentLocation = useCallback(() => {
  if (!navigator.geolocation) {
    toast.error("Geolocation is not supported by this browser.");
    return;
  }

  setIsLoading(true);
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const coordinates: [number, number] = [longitude, latitude];

      try {
        // Reverse geocode to get address
        if (geocoderRef.current) {
          const geocodeResult = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
            geocoderRef.current!.geocode(
              { location: { lat: latitude, lng: longitude } },
              (results, status) => {
                if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                  resolve(results[0]);
                } else {
                  reject(new Error(`Geocoding failed: ${status}`));
                }
              }
            );
          });

          const location: Location = {
            coordinates,
            address: geocodeResult.formatted_address,
            placeId: geocodeResult.place_id,
          };

          setCenterLocation(location);
          setSearchQuery(location.address);

          // Update map
          if (mapInstance.current) {
            if (centerMarker.current) {
              centerMarker.current.remove();
            }

            centerMarker.current = new maplibregl.Marker({
              color: "#0071E3",
              scale: 1.2,
            })
              .setLngLat(coordinates)
              .setPopup(
                new maplibregl.Popup({ offset: 25 }).setHTML(
                  `<strong>Current Location</strong><br/>${location.address}`
                )
              )
              .addTo(mapInstance.current);

            mapInstance.current.flyTo({
              center: coordinates,
              zoom: 14,
              duration: 1500,
            });
          }

          toast.success("Current location detected!");
        }
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        toast.error("Could not get address for current location.");
      } finally {
        setIsLoading(false);
      }
    },
    (error) => {
      setIsLoading(false);
      console.error("Geolocation error:", error);
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error("Location access denied. Please enable location permissions.");
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error("Location information unavailable.");
          break;
        case error.TIMEOUT:
          toast.error("Location request timed out.");
          break;
        default:
          toast.error("An unknown error occurred while getting location.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
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

  const addCustomZone = useCallback(() => {
    const newZone: Zone = {
      id: `zone_${Date.now()}`,
      min: newZoneData.min,
      max: newZoneData.max,
      price: newZoneData.price,
      color: ZONE_COLORS[zones.length % ZONE_COLORS.length],
      isLocal: true,
    };

    setZones([...zones, newZone]);
    setShowAddZoneDialog(false);

    setNewZoneData({
      min: 0,
      max: 3,
      price: 5.0,
    });

    toast.success("Custom zone added (not saved yet)");
  }, [zones, newZoneData]);

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

  // Initialize map initialization function - IMPROVED ERROR HANDLING
  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      console.error('Map container not available during initialization');
      // Hide countdown and show error state
      setShowCountdown(false);
      setMapInitializing(false);
      setMapLoaded(true); // This will hide the loading overlay
      toast.error('Map container not ready. Please refresh the page.');
      return;
    }

    console.log('Initializing map now...');
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
  }, [maptilerApiKey, mapStyle]);

  // Countdown effect - FIXED to start immediately
  useEffect(() => {
    // Start countdown immediately when component mounts
    console.log('Component mounted, starting countdown...');

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        const newCount = prev - 1;
        console.log(`Countdown: ${newCount}`);
        
        if (newCount <= 0) {
          clearInterval(countdownInterval);
          // Trigger map initialization when countdown reaches 0
          setTimeout(() => {
            if (mapRef.current) {
              initializeMap();
            } else {
              console.error('Map container not ready after countdown');
              // Retry after a short delay
              setTimeout(() => {
                if (mapRef.current) {
                  initializeMap();
                } else {
                  toast.error('Map container failed to initialize');
                }
              }, 500);
            }
          }, 100); // Small delay to show "0" briefly
        }
        
        return newCount;
      });
    }, 1000); // Update every second

    return () => {
      clearInterval(countdownInterval);
    };
  }, []); // Empty dependency array - start immediately on mount

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

  // ============== USEEFFECTS ==============

  // Load existing rider ranges on component mount and when data changes
  useEffect(() => {
    if (
      riderRangesData?.getRiderRanges &&
      Array.isArray(riderRangesData.getRiderRanges)
    ) {
      const loadedZones = riderRangesData.getRiderRanges.map(
        (range: RiderRange, index: number) =>
          convertRiderRangeToZone(range, zoneMethod, transportMode, index)
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

  // Responsive design detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize Google Places services
  useEffect(() => {
    if (!isLoaded) return;

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    const serviceDiv = document.createElement("div");
    serviceDiv.style.display = "none";
    document.body.appendChild(serviceDiv);
    placesServiceRef.current = new google.maps.places.PlacesService(serviceDiv);

    return () => {
      if (serviceDiv.parentNode) {
        serviceDiv.parentNode.removeChild(serviceDiv);
      }
    };
  }, [isLoaded]);

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

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
                      Starting in {countdown} second{countdown !== 1 ? 's' : ''}
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      {mapInitializing ? 'Loading map...' : 'Preparing...'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {mapInitializing ? 'Setting up map tiles' : 'Getting ready'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Search Bar on Map */}
         {/* Search Bar on Map */}
<div className="absolute top-4 left-4 right-4 z-20">
  <div className="max-w-md mx-auto" ref={searchInputRef}>
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <Input
        type="text"
        value={searchQuery}
        onChange={handleSearchInput}
        placeholder="Search for your service location..."
        className="w-full pl-12 pr-16 py-4 bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-base"
        disabled={isLoading || !isLoaded}
      />
      
      {/* Loading indicator */}
      {(isSearching || isLoading) && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        </div>
      )}
      
      {/* Current location button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCurrentLocation}
            disabled={isLoading || !isLoaded}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100"
          >
            <MapPin className="w-4 h-4 text-gray-500" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Use current location</p>
        </TooltipContent>
      </Tooltip>
    </div>

    {/* Google Places API status indicator */}
    {!isLoaded && (
      <div className="absolute top-full mt-2 w-full">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
          <div className="flex items-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading Google Places API...
          </div>
        </div>
      </div>
    )}

    {/* Predictions dropdown */}
    {showPredictions && predictions.length > 0 && (
      <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-xl max-h-80 overflow-y-auto">
        {predictions.map((prediction, index) => (
          <button
            key={prediction.placeId || index}
            onClick={() => handleLocationSelection(prediction)}
            disabled={isLoading}
            className="w-full text-left px-6 py-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 first:rounded-t-2xl last:rounded-b-2xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-medium text-gray-900">
              {prediction.structured_formatting.main_text}
            </div>
            <div className="text-sm text-gray-500">
              {prediction.structured_formatting.secondary_text}
            </div>
          </button>
        ))}
      </div>
    )}

    {/* No results message */}
    {showPredictions && predictions.length === 0 && !isSearching && searchQuery.length > 2 && (
      <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-sm border-0 rounded-2xl shadow-xl p-4">
        <div className="text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No results found</p>
          <p className="text-xs text-gray-400">Try a different search term</p>
        </div>
      </div>
    )}
  </div>
</div>


          {/* Map Controls - Right Side */}
          <div className="absolute top-20 right-4 z-10 flex flex-col space-y-3">
            {/* Configuration Button */}
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => setShowConfigDialog(!showConfigDialog)}
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
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center justify-between">
                    <span>Zone Configuration</span>
                    <div className="flex items-center space-x-2">
                      {hasUnsavedChanges && (
                        <span className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                          Unsaved Changes
                        </span>
                      )}
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="sm"
                        disabled={!hasUnsavedChanges || isProcessing}
                        className="rounded-xl"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </DialogTitle>
                  <DialogDescription>
                    Configure your service zones and pricing structure
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Zone Method & Transport Mode */}
                  <div className="space-y-6">
                    <div>
                      <Label className="block text-sm font-semibold text-gray-900 mb-4">
                        Zone Definition Method
                      </Label>
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          onClick={() => setZoneMethod("distance")}
                          variant={
                            zoneMethod === "distance" ? "default" : "outline"
                          }
                          className={`p-6 flex flex-col items-center space-y-3 h-auto rounded-2xl ${
                            zoneMethod === "distance"
                              ? "bg-blue-600 text-white"
                              : ""
                          }`}
                          disabled={isProcessing}
                        >
                          <Ruler className="w-8 h-8" />
                          <span className="font-semibold text-lg">
                            Distance
                          </span>
                          <span className="text-sm opacity-80">Kilometers</span>
                        </Button>
                        <Button
                          onClick={() => setZoneMethod("time")}
                          variant={
                            zoneMethod === "time" ? "default" : "outline"
                          }
                          className={`p-6 flex flex-col items-center space-y-3 h-auto rounded-2xl ${
                            zoneMethod === "time"
                              ? "bg-blue-600 text-white"
                              : ""
                          }`}
                          disabled={isProcessing}
                        >
                          <Clock className="w-8 h-8" />
                          <span className="font-semibold text-lg">Time</span>
                          <span className="text-sm opacity-80">Minutes</span>
                        </Button>
                      </div>
                    </div>

                    {zoneMethod === "time" && (
                      <div>
                        <Label className="block text-sm font-semibold text-gray-900 mb-3">
                          Transport Mode
                        </Label>
                        <Select
                          value={transportMode}
                          onValueChange={(value) =>
                            setTransportMode(
                              value as "walking" | "cycling" | "driving"
                            )
                          }
                          disabled={isProcessing}
                        >
                          <SelectTrigger className="w-full p-4 border-2 border-gray-200 rounded-2xl">
                            <SelectValue placeholder="Select transport mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="walking">
                              Walking (~5 km/h)
                            </SelectItem>
                            <SelectItem value="cycling">
                              Cycling (~15 km/h)
                            </SelectItem>
                            <SelectItem value="driving">
                              Driving (~40 km/h)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Zone Configuration */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg font-semibold text-gray-900">
                        Pricing Zones ({zones.length})
                        {zones.filter((z) => z.isLocal).length > 0 && (
                          <span className="ml-2 text-sm text-amber-600">
                            ({zones.filter((z) => z.isLocal).length} unsaved)
                          </span>
                        )}
                      </Label>
                      <Dialog
                        open={showAddZoneDialog}
                        onOpenChange={setShowAddZoneDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            className="flex items-center space-x-2 rounded-2xl"
                            disabled={isProcessing}
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Zone</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] rounded-3xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">
                              Add New Zone
                            </DialogTitle>
                            <DialogDescription>
                              Configure your new service zone
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-8 py-6">
                            {/* Range Slider */}
                            <div className="space-y-6">
                              <div className="text-center">
                                <Label className="text-lg font-semibold text-gray-900">
                                  Range: {newZoneData.min} - {newZoneData.max}{" "}
                                  {zoneMethod === "distance" ? "km" : "min"}
                                </Label>
                              </div>
                              <div className="px-4">
                                <Slider
                                  value={[newZoneData.min, newZoneData.max]}
                                  onValueChange={(range) =>
                                    setNewZoneData({
                                      ...newZoneData,
                                      min: range[0],
                                      max: range[1],
                                    })
                                  }
                                  max={zoneMethod === "distance" ? 50 : 120}
                                  min={0}
                                  step={zoneMethod === "distance" ? 0.5 : 1}
                                  className="w-full h-3"
                                />
                              </div>
                            </div>

                            {/* Price Slider */}
                            <div className="space-y-6">
                              <div className="text-center">
                                <Label className="text-lg font-semibold text-gray-900">
                                  Price: ${newZoneData.price.toFixed(2)}
                                </Label>
                              </div>
                              <div className="px-4">
                                <Slider
                                  value={[newZoneData.price]}
                                  onValueChange={(value) =>
                                    setNewZoneData({
                                      ...newZoneData,
                                      price: value[0],
                                    })
                                  }
                                  max={200}
                                  min={0.5}
                                  step={0.5}
                                  className="w-full h-3"
                                />
                              </div>
                            </div>
                          </div>
                          <DialogFooter className="space-x-3">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddZoneDialog(false)}
                              className="rounded-2xl"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={addCustomZone}
                              disabled={
                                newZoneData.max <= newZoneData.min ||
                                newZoneData.price <= 0 ||
                                isProcessing
                              }
                              className="rounded-2xl"
                            >
                              Add Zone
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Validation Errors */}
                    {validationErrors.length > 0 && (
                      <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                        <div className="flex items-center text-red-700 mb-2">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            Validation Errors:
                          </span>
                        </div>
                        <ul className="text-sm text-red-600 space-y-1">
                          {validationErrors.map((error, index) => (
                            <li key={index} className="list-disc list-inside">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {zones.map((zone, index) => (
                        <Card
                          key={zone.id}
                          className={`overflow-hidden rounded-3xl border-2 ${
                            zone.isLocal
                              ? "border-amber-300 bg-amber-50/50"
                              : "border-gray-200"
                          }`}
                        >
                          <CardHeader className="p-4 bg-gray-50 border-b">
                            <CardTitle className="text-base flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-6 h-6 rounded-full ring-2 ring-white shadow-md"
                                  style={{ backgroundColor: zone.color }}
                                />
                                <span className="font-semibold text-gray-900">
                                  Zone {index + 1}
                                </span>
                                {zone.isLocal ? (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                    Unsaved
                                  </span>
                                ) : (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Saved
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {zones.length > 1 && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 rounded-xl"
                                        onClick={() => removeZone(zone.id)}
                                        disabled={isProcessing}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove zone</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-6">
                            {/* Zone Controls */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">
                                  Min {zoneMethod === "distance" ? "km" : "min"}
                                </Label>
                                <Input
                                  type="number"
                                  value={zone.min}
                                  onChange={(e) =>
                                    updateZone(zone.id, "min", e.target.value)
                                  }
                                  className="mt-1"
                                  step={zoneMethod === "distance" ? 0.5 : 1}
                                  disabled={isProcessing}
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium">
                                  Max {zoneMethod === "distance" ? "km" : "min"}
                                </Label>
                                <Input
                                  type="number"
                                  value={zone.max}
                                  onChange={(e) =>
                                    updateZone(zone.id, "max", e.target.value)
                                  }
                                  className="mt-1"
                                  step={zoneMethod === "distance" ? 0.5 : 1}
                                  disabled={isProcessing}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Price ($)
                              </Label>
                              <Input
                                type="number"
                                value={zone.price}
                                onChange={(e) =>
                                  updateZone(zone.id, "price", e.target.value)
                                }
                                className="mt-1"
                                step={0.5}
                                min={0.5}
                                disabled={isProcessing}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Preview Toggle */}
                  <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                    <div className="flex items-center space-x-4">
                      <Switch
                        id="preview"
                        checked={showPreview}
                        onCheckedChange={setShowPreview}
                      />
                      <Label
                        htmlFor="preview"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        Show zone preview on map
                      </Label>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSave}
                    disabled={
                      !centerLocation ||
                      isSaving ||
                      validationErrors.length > 0 ||
                      isProcessing
                    }
                    className="w-full py-6 rounded-3xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200"
                    size="lg"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving Configuration...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save Zone Configuration</span>
                      </>
                    )}
                  </Button>

                  {/* Save Status */}
                  {saveStatus && (
                    <div
                      className={`p-4 rounded-3xl border-2 text-sm font-medium ${
                        saveStatus.type === "success"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}
                    >
                      <div className="flex items-center">
                        {saveStatus.type === "success" ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <AlertCircle className="w-4 h-4 mr-2" />
                        )}
                        {saveStatus.message}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

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
                      onClick={() =>
                        setShowMapStyleButtonDialog(!showMapStyleButtonDialog)
                      }
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
          </div>

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
                        {zoneMethod === "distance" ? "km" : "min"} ($
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