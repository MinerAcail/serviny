"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { toast } from "sonner";
import * as turf from "@turf/turf";
import maplibregl from "maplibre-gl";
import { ZONE_COLORS } from "@/components/config/map";

// ==========================================
// GraphQL Queries
// ==========================================

export const GET_RIDER_RANGES = gql`
  query getARiderRanges($riderId: String!) {
    getARiderRanges(routeId: $riderId) {
      id
      riderId
      startKm
      endKm
      price
      updatedAt
    }
  }
`;

export const GET_RIDER_PROFILE = gql`
  query getUserInfor($riderId: String!) {
    getUserInfor(userId: $riderId) {
      id
      name
      email
      dpfile
      coordinates
      phone: number
    }
  }
`;

export const CREATE_DELIVERY_REQUEST = gql`
  mutation createDeliveryRequest($input: DeliveryRequestInput!) {
    createDeliveryRequest(input: $input) {
      id
      riderId
      reference
      status
      totalPrice
    }
  }
`;

// ==========================================
// Types
// ==========================================

export interface PricingZone {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
  updatedAt?: string;
}

export interface RiderProfile {
  id: string;
  name: string;
  email: string;
  dpfile?: string;
  availability: boolean;
  coordinates?: number[];
  experience: string;
  phone?: string;
  vehicleType?: string;
  rating?: number;
  isOnline: boolean;
}

export interface Location {
  lng: number;
  lat: number;
  address: string;
}

export interface DeliveryCalculation {
  distance: number;
  duration: string;
  matchedZone: PricingZone | null;
  totalPrice: number;
  pickupLocation: Location;
  dropoffLocation: Location;
}
// Add this GraphQL query
const GET_MULTI_GROUP_BOOKINGS = gql`
  query getAppointmentBookingByMultiGroupId($multiGroupId: String!) {
    getAppointmentBookingByMultiGroupId(multiGroupId: $multiGroupId) {
      id
      deliveryAddress
      dropoffLocation
      pickupLocation
      item
      notes
      tableSize
    }
  }
`;

// Add this hook
export const useMultiLocationBookings = (multiGroupId?: string) => {
  const { data, loading, error } = useQuery(GET_MULTI_GROUP_BOOKINGS, {
    variables: { multiGroupId: multiGroupId || "" },
    skip: !multiGroupId,
  });

  return {
    relatedBookings: data?.getAppointmentBookingByMultiGroupId || [],
    isLoadingRelated: loading,
    relatedError: error?.message,
  };
};
// ==========================================
// 1. useRiderZones Hook
// ==========================================
//done
export function useRiderZones(riderId: string | undefined) {
  const [error, setError] = useState<string | null>(null);

  const {
    data: zonesData,
    loading: isLoadingZones,
    error: zonesError,
    refetch: refetchZones,
  } = useQuery(GET_RIDER_RANGES, {
    variables: { riderId: riderId || "" },
    skip: !riderId,
    onError: (error) => {
      console.error("Error loading rider zones:", error);
      setError("Failed to load rider pricing zones");
      toast.error("Failed to load rider pricing zones");
    },
  });

  const {
    data: profileData,
    loading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery(GET_RIDER_PROFILE, {
    variables: { riderId: riderId || "" },
    skip: !riderId,
    onError: (error) => {
      console.error("Error loading rider profile:", error);
      toast.error("Failed to load rider profile");
    },
  });

  const [createDeliveryRequestMutation, { loading: isCreatingRequest }] =
    useMutation(CREATE_DELIVERY_REQUEST, {
      onError: (error) => {
        console.error("Error creating delivery request:", error);
        toast.error("Failed to create delivery request");
      },
    });

  const createDeliveryRequest = useCallback(
    async (input: any) => {
      try {
        const result = await createDeliveryRequestMutation({
          variables: { input },
        });

        if (result?.data?.createDeliveryRequest) {
          toast.success("Delivery request created successfully!", {
            description: `Reference: ${result.data.createDeliveryRequest.reference}`,
            duration: 5000,
          });
          return result.data.createDeliveryRequest;
        }

        throw new Error("No data returned from mutation");
      } catch (error: any) {
        console.error("Create delivery request error:", error);

        let errorMessage = "Failed to create delivery request";
        if (error.graphQLErrors?.length > 0) {
          errorMessage = error.graphQLErrors[0].message;
        } else if (error.networkError) {
          errorMessage = "Network error - please check your connection";
        }

        toast.error(errorMessage, { duration: 5000 });
        throw error;
      }
    },
    [createDeliveryRequestMutation]
  );

  return {
    riderZones: zonesData?.getARiderRanges || [],
    riderProfile: profileData?.getUserInfor,
    isLoading: isLoadingZones || isLoadingProfile,
    error: error || profileError?.message || zonesError?.message || null,
    createDeliveryRequest,
    isCreatingRequest,
    refetchZones,
    refetchProfile,
  };
}

// ==========================================
// 3. useDeliveryCalculation Hook
// ==========================================
//done
export function useDeliveryCalculation() {
  const [calculation, setCalculation] = useState<DeliveryCalculation | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastCalculationParamsRef = useRef<string | null>(null);

  const calculateDelivery = useCallback(
    async (pickup: Location, dropoff: Location, zones: PricingZone[]) => {
      if (!pickup || !dropoff || !zones.length) {
        setError("Missing required data for calculation");
        return null;
      }

      // Create unique key for these calculation parameters
      const paramsKey = `${pickup.lat}-${pickup.lng}-${dropoff.lat}-${
        dropoff.lng
      }-${zones.length}-${zones.map((z) => `${z.id}-${z.price}`).join(",")}`;

      // Skip if we already calculated for these exact parameters
      if (lastCalculationParamsRef.current === paramsKey) {
        console.log("⏭️ Skipping duplicate calculation - same parameters");
        return calculation;
      }

      setIsCalculating(true);
      setError(null);
      lastCalculationParamsRef.current = paramsKey;

      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Calculate distance FROM pickup location (zone center) TO dropoff location
        const from = turf.point([pickup.lng, pickup.lat]); // Pickup is the center
        const to = turf.point([dropoff.lng, dropoff.lat]); // Dropoff is the destination
        const distance = turf.distance(from, to, { units: "kilometers" });

        console.log(
          `💰 Calculating delivery: ${distance.toFixed(
            2
          )}km from pickup (zone center) to dropoff`
        );

        // Find matching pricing zone based on distance from pickup
        const matchedZone =
          zones.find(
            (zone) => distance >= zone.startKm && distance < zone.endKm
          ) || zones[zones.length - 1];

        if (!matchedZone) {
          setError("No pricing zone found for this distance");
          return null;
        }

        // Calculate duration
        const averageSpeed = 25; // km/h
        const durationMinutes = Math.round((distance / averageSpeed) * 60);
        const duration =
          durationMinutes < 60
            ? `${durationMinutes} min`
            : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

        const result: DeliveryCalculation = {
          distance: Number(distance.toFixed(2)),
          duration,
          matchedZone,
          totalPrice: matchedZone.price,
          pickupLocation: pickup, // This is the zone center
          dropoffLocation: dropoff, // This is the destination
        };

        setCalculation(result);

        toast.success("Delivery calculated!", {
          description: `${
            result.distance
          }km from pickup center → ${result.totalPrice.toFixed(2)}`,
          duration: 3000,
        });

        return result;
      } catch (error) {
        console.error("Delivery calculation error:", error);
        setError("Failed to calculate delivery details");
        lastCalculationParamsRef.current = null; // Reset on error
        return null;
      } finally {
        setIsCalculating(false);
      }
    },
    [calculation]
  );

  const clearCalculation = useCallback(() => {
    setCalculation(null);
    setError(null);
    lastCalculationParamsRef.current = null;
  }, []);

  return {
    calculation,
    isCalculating,
    error,
    calculateDelivery,
    clearCalculation,
  };
}

// ==========================================
// 4. SIMPLIFIED: useSimpleLocationManager Hook (No URL State)
// ==========================================
//done
export function useSimpleLocationManager() {
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);

  const updatePickupLocation = useCallback((location: Location | null) => {
    console.log("📍 Setting pickup location:", location?.address || "null");
    setPickupLocation(location);
  }, []);

  const updateDropoffLocation = useCallback((location: Location | null) => {
    console.log("🎯 Setting dropoff location:", location?.address || "null");
    setDropoffLocation(location);
  }, []);

  const clearAllLocations = useCallback(() => {
    console.log("🗑️ Clearing all locations");
    setPickupLocation(null);
    setDropoffLocation(null);
  }, []);

  return {
    pickupLocation,
    dropoffLocation,
    updatePickupLocation,
    updateDropoffLocation,
    clearAllLocations,
  };
}

// ==========================================
// 4. SIMPLIFIED: useSimpleLocationManager Hook (No URL State)
// ==========================================

export function useLocationAutocomplete(
  autocompleteService: google.maps.places.AutocompleteService | null,
  placesService: google.maps.places.PlacesService | null
) {
  const [pickupPredictions, setPickupPredictions] = useState<any[]>([]);
  const [dropoffPredictions, setDropoffPredictions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Search for pickup locations
  const searchPickupLocations = useCallback(
    async (query: string) => {
      if (!autocompleteService || query.length < 3) {
        setPickupPredictions([]);
        return;
      }

      setIsSearching(true);

      try {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "gh" }, // Restrict to Ghana
          },
          (results, status) => {
            setIsSearching(false);

            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !results
            ) {
              setPickupPredictions([]);
              return;
            }

            const formattedResults = results.map((result) => ({
              description: result.description,
              place_id: result.place_id,
              structured_formatting: {
                main_text:
                  result.structured_formatting?.main_text || result.description,
                secondary_text:
                  result.structured_formatting?.secondary_text || "",
              },
            }));

            setPickupPredictions(formattedResults);
          }
        );
      } catch (error) {
        console.error("Pickup search error:", error);
        setIsSearching(false);
        setPickupPredictions([]);
      }
    },
    [autocompleteService]
  );

  // Search for dropoff locations
  const searchDropoffLocations = useCallback(
    async (query: string) => {
      if (!autocompleteService || query.length < 3) {
        setDropoffPredictions([]);
        return;
      }

      setIsSearching(true);

      try {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "gh" }, // Restrict to Ghana
          },
          (results, status) => {
            setIsSearching(false);

            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !results
            ) {
              setDropoffPredictions([]);
              return;
            }

            const formattedResults = results.map((result) => ({
              description: result.description,
              place_id: result.place_id,
              structured_formatting: {
                main_text:
                  result.structured_formatting?.main_text || result.description,
                secondary_text:
                  result.structured_formatting?.secondary_text || "",
              },
            }));

            setDropoffPredictions(formattedResults);
          }
        );
      } catch (error) {
        console.error("Dropoff search error:", error);
        setIsSearching(false);
        setDropoffPredictions([]);
      }
    },
    [autocompleteService]
  );

  // Get location details from place ID
  const getLocationFromPlaceId = useCallback(
    async (placeId: string): Promise<Location | null> => {
      if (!placesService) {
        console.error("Places service not available");
        return null;
      }

      return new Promise((resolve) => {
        placesService.getDetails(
          {
            placeId,
            fields: ["geometry", "formatted_address", "name"],
          },
          (result, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result &&
              result.geometry &&
              result.geometry.location
            ) {
              const lat = result.geometry.location.lat();
              const lng = result.geometry.location.lng();
              const address = result.formatted_address || result.name || "";

              console.log("✅ Location details retrieved:", address);

              resolve({
                lat,
                lng,
                address,
              });
            } else {
              console.error("Failed to get location details:", status);
              resolve(null);
            }
          }
        );
      });
    },
    [placesService]
  );

  // Clear predictions
  const clearPickupPredictions = useCallback(() => {
    setPickupPredictions([]);
  }, []);

  const clearDropoffPredictions = useCallback(() => {
    setDropoffPredictions([]);
  }, []);

  return {
    // Predictions
    pickupPredictions,
    dropoffPredictions,
    isSearching,

    // Search functions
    searchPickupLocations,
    searchDropoffLocations,

    // Get location details
    getLocationFromPlaceId,

    // Clear functions
    clearPickupPredictions,
    clearDropoffPredictions,
  };
}

//done
export function useSimpleMapManagerWithCenteredPinDrop() {
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [pickupMarker, setPickupMarker] = useState<maplibregl.Marker | null>(
    null
  );
  const [dropoffMarker, setDropoffMarker] = useState<maplibregl.Marker | null>(
    null
  );

  // Initialize map only when pickup is set
  const initializeMapWithPickup = useCallback(
    (
      container: HTMLDivElement,
      pickupLocation: Location,
      maptilerApiKey?: string
    ) => {
      console.log(
        "🗺️ Initializing map centered on pickup:",
        pickupLocation.address
      );

      // Clean up existing map
      if (mapInstance.current) {
        console.log("🗑️ Removing existing map instance");
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapLoaded(false);
      }

      try {
        let mapStyle;

        if (maptilerApiKey) {
          mapStyle = `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerApiKey}`;
        } else {
          mapStyle = {
            version: 8,
            name: "Basic",
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                // attribution: "© OpenStreetMap contributors",
              },
            },
            layers: [{ id: "osm", type: "raster", source: "osm" }],
          };
        }

        // ALWAYS center on pickup location
        const initialCenter: [number, number] = [
          pickupLocation.lng,
          pickupLocation.lat,
        ];
        const initialZoom = 13;

        console.log("🎯 Initializing map with PICKUP center:", initialCenter);

        const map = new maplibregl.Map({
          container,

          style: mapStyle,
          center: initialCenter,
          zoom: initialZoom,
          attributionControl: false,

          maxZoom: 18,
          minZoom: 2,
        });

        mapInstance.current = map;

        map.on("load", () => {
          console.log(
            "✅ Map loaded successfully centered on pickup:",
            initialCenter
          );
          setMapLoaded(true);
          setMapInitialized(true);
        });

        map.on("error", (e) => {
          console.error("❌ Map error:", e);
        });

        // map.addControl(new maplibregl.FullscreenControl(), "top-left")
      } catch (error) {
        console.error("❌ Failed to initialize map:", error);
        setMapLoaded(false);
      }
    },
    []
  );

  // Get current map center coordinates
  const getMapCenter = useCallback(() => {
    if (!mapInstance.current) return null;

    const center = mapInstance.current.getCenter();
    return {
      lng: center.lng,
      lat: center.lat,
    };
  }, []);

  // Reverse geocoding function for pin drops
  const reverseGeocode = useCallback(
    async (
      lng: number,
      lat: number,
      geocoderRef?: React.RefObject<google.maps.Geocoder | null>
    ): Promise<string> => {
      try {
        // Try Google Geocoder if available
        if (geocoderRef?.current) {
          return new Promise((resolve) => {
            geocoderRef.current!.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (
                  status === google.maps.GeocoderStatus.OK &&
                  results &&
                  results[0]
                ) {
                  resolve(results[0].formatted_address);
                } else {
                  // Fallback to coordinate-based address
                  resolve(
                    `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                  );
                }
              }
            );
          });
        }

        // Fallback: Create descriptive address from coordinates
        const fallbackAddress = `📍 Pin dropped at ${lat.toFixed(
          4
        )}, ${lng.toFixed(4)}`;
        return fallbackAddress;
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    },
    []
  );

  // Add map move event listeners for pin drop mode
  const addMapMoveListener = useCallback((callback: () => void) => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    map.on("moveend", callback);

    // Return cleanup function
    return () => {
      map.off("moveend", callback);
    };
  }, []);

  // Create markers
  const createMarker = useCallback(
    (location: Location, type: "pickup" | "dropoff") => {
      if (!mapInstance.current || !mapLoaded) return null;

      const isPickup = type === "pickup";
      const color = isPickup ? "#22c55e" : "#ef4444";
      const icon = isPickup ? "📍" : "🎯";
      const title = isPickup
        ? "Pickup Location (Zone Center)"
        : "Drop-off Location";

      try {
        const marker = new maplibregl.Marker({
          color,
          scale: 1.2,
        })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px; font-family: system-ui;">
                <strong style="color: ${color};">${icon} ${title}</strong><br/>
                <small style="color: #666;">${location.address}</small>
                ${
                  isPickup
                    ? '<br/><small style="color: #22c55e; font-weight: 500;">🎯 All zones center here</small>'
                    : ""
                }
              </div>
            `)
          )
          .addTo(mapInstance.current);

        console.log(`✅ Created ${type} marker:`, location.address);
        return marker;
      } catch (error) {
        console.error(`❌ Error creating ${type} marker:`, error);
        return null;
      }
    },
    [mapLoaded]
  );

  // Update markers
  const updateMarkers = useCallback(
    (pickup?: Location | null, dropoff?: Location | null) => {
      if (!mapInstance.current || !mapLoaded) {
        console.log("⏳ Cannot update markers: map not ready");
        return;
      }

      console.log("📍 Updating markers:", {
        pickup: !!pickup,
        dropoff: !!dropoff,
      });

      // Clear existing markers
      if (pickupMarker) {
        pickupMarker.remove();
        setPickupMarker(null);
      }
      if (dropoffMarker) {
        dropoffMarker.remove();
        setDropoffMarker(null);
      }

      // Create new markers
      if (pickup) {
        const newPickupMarker = createMarker(pickup, "pickup");
        setPickupMarker(newPickupMarker);
      }

      if (dropoff) {
        const newDropoffMarker = createMarker(dropoff, "dropoff");
        setDropoffMarker(newDropoffMarker);
      }
    },
    [mapLoaded, createMarker, pickupMarker, dropoffMarker]
  );

  // Draw coverage zones around pickup
  const drawCoverageZones = useCallback(
    (pickupLocation: Location, riderZones: PricingZone[]) => {
      if (!mapInstance.current || !mapLoaded || !riderZones.length) return;

      console.log(
        "🟢 Drawing coverage zones centered on pickup:",
        pickupLocation.address
      );

      const map = mapInstance.current;
      const centerPoint: [number, number] = [
        pickupLocation.lng,
        pickupLocation.lat,
      ];

      try {
        // Clear existing zones - PROPER ORDER: layers first, then sources
        for (let i = 0; i < 10; i++) {
          const fillId = `zone-${i}`;
          const outlineId = `zone-outline-${i}`;

          // Remove layers first
          if (map.getLayer(fillId)) map.removeLayer(fillId);
          if (map.getLayer(outlineId)) map.removeLayer(outlineId);
        }

        // Remove center marker layer
        if (map.getLayer("pickup-center")) map.removeLayer("pickup-center");

        // Now remove sources
        for (let i = 0; i < 10; i++) {
          const fillId = `zone-${i}`;
          if (map.getSource(fillId)) map.removeSource(fillId);
        }

        // Remove center marker source
        if (map.getSource("pickup-center")) map.removeSource("pickup-center");

        // Draw zones from largest to smallest
        const sortedZones = [...riderZones].sort((a, b) => b.endKm - a.endKm);

        sortedZones.forEach((zone, index) => {
          try {
            const outerCircle = turf.circle(centerPoint, zone.endKm, {
              units: "kilometers",
              steps: 64,
            });

            let zonePolygon = outerCircle;

            if (zone.startKm > 0) {
              const innerCircle = turf.circle(centerPoint, zone.startKm, {
                units: "kilometers",
                steps: 64,
              });

              try {
                const difference = turf.difference(
                  turf.feature(outerCircle.geometry),
                  turf.feature(innerCircle.geometry)
                );
                if (difference) zonePolygon = difference;
              } catch {
                // Use full circle if difference fails
              }
            }

            const layerId = `zone-${index}`;
            const outlineId = `zone-outline-${index}`;
            const color = ZONE_COLORS[index % ZONE_COLORS.length];

            map.addSource(layerId, {
              type: "geojson",
              data: zonePolygon,
            });

            map.addLayer({
              id: layerId,
              type: "fill",
              source: layerId,
              paint: {
                "fill-color": color,
                "fill-opacity": 0.3,
              },
            });

            map.addLayer({
              id: outlineId,
              type: "line",
              source: layerId,
              paint: {
                "line-color": color,
                "line-width": 2,
                "line-opacity": 0.8,
              },
            });

            console.log(
              `✅ Zone ${index + 1}: ${zone.startKm}-${zone.endKm}km, ${
                zone.price
              }`
            );
          } catch (error) {
            console.error(`❌ Error creating zone ${index}:`, error);
          }
        });

        // Add center marker
        const centerMarkerId = "pickup-center";

        map.addSource(centerMarkerId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: centerPoint,
            },
          },
        });

        map.addLayer({
          id: centerMarkerId,
          type: "circle",
          source: centerMarkerId,
          paint: {
            "circle-radius": 8,
            "circle-color": "#22c55e",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });

        console.log("✅ Coverage zones drawn successfully");
      } catch (error) {
        console.error("❌ Error drawing coverage zones:", error);
      }
    },
    [mapLoaded]
  );

  // Draw route
  const drawRoute = useCallback(
    (pickup: Location, dropoff: Location) => {
      if (!mapInstance.current || !mapLoaded) return;

      console.log("🛣️ Drawing route from pickup to dropoff");

      const map = mapInstance.current;

      try {
        // Clear existing route
        if (map.getLayer("route")) map.removeLayer("route");
        if (map.getSource("route")) map.removeSource("route");

        const routeData = {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [pickup.lng, pickup.lat],
              [dropoff.lng, dropoff.lat],
            ],
          },
        };

        map.addSource("route", {
          type: "geojson",
          data: routeData,
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        console.log("✅ Route drawn successfully");
      } catch (error) {
        console.error("❌ Error drawing route:", error);
      }
    },
    [mapLoaded]
  );

  // Fit map to show both markers
  const fitMapToMarkers = useCallback(() => {
    if (!mapInstance.current || !mapLoaded) return;

    const coordinates = [];
    if (pickupMarker) coordinates.push(pickupMarker.getLngLat());
    if (dropoffMarker) coordinates.push(dropoffMarker.getLngLat());

    if (coordinates.length === 0) return;

    try {
      if (coordinates.length === 1) {
        // Only pickup - already centered
        return;
      } else {
        // Both pickup and dropoff - fit to show both
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach((coord) => bounds.extend(coord));

        mapInstance.current.fitBounds(bounds, {
          padding: 80,
          duration: 1000,
          maxZoom: 15,
        });

        console.log("✅ Map fitted to show both locations");
      }
    } catch (error) {
      console.error("❌ Error fitting map:", error);
    }
  }, [mapLoaded, pickupMarker, dropoffMarker]);

  // Clear everything
  const clearMap = useCallback(() => {
    if (!mapInstance.current) return;

    try {
      // Clear markers
      if (pickupMarker) pickupMarker.remove();
      if (dropoffMarker) dropoffMarker.remove();

      setPickupMarker(null);
      setDropoffMarker(null);

      console.log("✅ Map cleared");
    } catch (error) {
      console.error("❌ Error clearing map:", error);
    }
  }, [pickupMarker, dropoffMarker]);

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        if (pickupMarker) pickupMarker.remove();
        if (dropoffMarker) dropoffMarker.remove();
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      } catch (error) {
        console.warn("Cleanup error:", error);
      }
      setMapLoaded(false);
      setMapInitialized(false);
    };
  }, []);

  return {
    mapInstance,
    mapLoaded,
    mapInitialized,
    pickupMarker,
    dropoffMarker,
    initializeMapWithPickup,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
    clearMap,
    // New functions for centered pin drop
    getMapCenter,
    reverseGeocode,
    addMapMoveListener,
  };
}

// Hook for managing centered pin drop state
export function useCenteredPinDrop(
  mapInstance: React.RefObject<maplibregl.Map | null>,
  geocoderRef?: React.RefObject<google.maps.Geocoder | null>
) {
  const [pinDropMode, setPinDropMode] = useState<{
    active: boolean;
    mode: "pickup" | "dropoff" | null;
  }>({
    active: false,
    mode: null,
  });

  const [currentAddress, setCurrentAddress] = useState<string>("Loading...");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reverse geocoding function
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        // Use Google Geocoder if available
        if (geocoderRef?.current) {
          return new Promise((resolve) => {
            geocoderRef.current!.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (
                  status === google.maps.GeocoderStatus.OK &&
                  results &&
                  results[0]
                ) {
                  resolve(results[0].formatted_address);
                } else {
                  resolve(
                    `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                  );
                }
              }
            );
          });
        }

        // Fallback
        return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    },
    [geocoderRef]
  );

  // Handle map movement during pin drop
  const handleMapMove = useCallback(() => {
    if (!pinDropMode.active || !mapInstance.current) return;

    // Clear existing timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    setIsLoadingAddress(true);

    // Debounce the geocoding request
    geocodeTimeoutRef.current = setTimeout(async () => {
      try {
        const center = mapInstance.current!.getCenter();
        const lat = center.lat;
        const lng = center.lng;

        const address = await reverseGeocode(lat, lng);
        setCurrentAddress(address);
      } catch (error) {
        console.error("Error getting address:", error);
        setCurrentAddress("Unable to get address");
      } finally {
        setIsLoadingAddress(false);
      }
    }, 500); // 500ms debounce
  }, [pinDropMode.active, mapInstance, reverseGeocode]);

  // Start pin drop mode
  const startPinDropMode = useCallback((mode: "pickup" | "dropoff") => {
    setPinDropMode({ active: true, mode });
    setCurrentAddress("Loading...");
    setIsLoadingAddress(true);
  }, []);

  // Change pin drop mode
  const changePinDropMode = useCallback((mode: "pickup" | "dropoff") => {
    setPinDropMode({ active: true, mode });
  }, []);

  // Cancel pin drop mode
  const cancelPinDropMode = useCallback(() => {
    setPinDropMode({ active: false, mode: null });
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
  }, []);

  // Confirm pin drop location
  const confirmPinDropLocation = useCallback(() => {
    if (!mapInstance.current || !pinDropMode.active) return null;

    const center = mapInstance.current.getCenter();
    const lat = center.lat;
    const lng = center.lng;

    const location = {
      lng,
      lat,
      address: currentAddress,
    };

    setPinDropMode({ active: false, mode: null });

    return {
      location,
      mode: pinDropMode.mode,
    };
  }, [mapInstance, pinDropMode, currentAddress]);

  // Set up map move listeners when pin drop is active
  useEffect(() => {
    if (!pinDropMode.active || !mapInstance.current) return;

    const map = mapInstance.current;

    // Initial address update
    handleMapMove();

    // Add move listeners
    map.on("moveend", handleMapMove);

    // Cleanup
    return () => {
      map.off("moveend", handleMapMove);
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [pinDropMode.active, mapInstance, handleMapMove]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, []);

  return {
    pinDropMode,
    currentAddress,
    isLoadingAddress,
    startPinDropMode,
    changePinDropMode,
    cancelPinDropMode,
    confirmPinDropLocation,
  };
}

// Updated hooks with simplified pin drop functionality

// 4. Simple Pin Drop Button Component
export function SimplePinDropButton({
  onPinDrop,
  disabled = false,
}: {
  onPinDrop: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onPinDrop}
      disabled={disabled}
      className={`
        px-3 py-1.5 text-sm rounded-lg flex items-center transition-all duration-200
        bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300
        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-sm"}
      `}
    >
      <span className="mr-1">📍</span>
      Pin Drop
    </button>
  );
}

// Updated hooks with simplified pin drop functionality

// 1. Simplified Pin Drop Hook
export function useSimplePinDrop(
  mapInstance: React.RefObject<maplibregl.Map | null>,
  geocoderRef?: React.RefObject<google.maps.Geocoder | null>
) {
  const [isActive, setIsActive] = useState(false);
  const [currentMode, setCurrentMode] = useState<"pickup" | "dropoff" | null>(
    null
  );
  const [draggableMarker, setDraggableMarker] =
    useState<maplibregl.Marker | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Reverse geocoding function
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<string> => {
      try {
        if (geocoderRef?.current) {
          return new Promise((resolve) => {
            geocoderRef.current!.geocode(
              { location: { lat, lng } },
              (results, status) => {
                if (
                  status === google.maps.GeocoderStatus.OK &&
                  results &&
                  results[0]
                ) {
                  resolve(results[0].formatted_address);
                } else {
                  resolve(
                    `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
                  );
                }
              }
            );
          });
        }
        return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    },
    [geocoderRef]
  );

  // Create draggable pin marker
  const createDraggableMarker = useCallback(
    (initialLng: number, initialLat: number, mode: "pickup" | "dropoff") => {
      if (!mapInstance.current) return null;

      const color = mode === "pickup" ? "#22c55e" : "#ef4444";
      const icon = mode === "pickup" ? "📍" : "🎯";

      // Create draggable marker
      const marker = new maplibregl.Marker({
        color,
        scale: 1.5,
        draggable: true,
      })
        .setLngLat([initialLng, initialLat])
        .addTo(mapInstance.current);

      // Handle drag events
      marker.on("drag", () => {
        setIsLoadingAddress(true);
      });

      marker.on("dragend", async () => {
        const lngLat = marker.getLngLat();
        try {
          const address = await reverseGeocode(lngLat.lat, lngLat.lng);
          setCurrentAddress(address);
        } catch (error) {
          setCurrentAddress("Unable to get address");
        } finally {
          setIsLoadingAddress(false);
        }
      });

      return marker;
    },
    [mapInstance, reverseGeocode]
  );

  // Start pin drop mode
  const startPinDrop = useCallback(
    async (mode: "pickup" | "dropoff", initialLocation?: Location) => {
      if (!mapInstance.current) return;

      setIsActive(true);
      setCurrentMode(mode);
      setIsLoadingAddress(true);

      // Remove existing draggable marker
      if (draggableMarker) {
        draggableMarker.remove();
      }

      let markerLng, markerLat;

      if (initialLocation) {
        // Use existing location
        markerLng = initialLocation.lng;
        markerLat = initialLocation.lat;
        setCurrentAddress(initialLocation.address);
        setIsLoadingAddress(false);
      } else {
        // Use map center
        const center = mapInstance.current.getCenter();
        markerLng = center.lng;
        markerLat = center.lat;

        // Get address for center
        try {
          const address = await reverseGeocode(markerLat, markerLng);
          setCurrentAddress(address);
        } catch (error) {
          setCurrentAddress("Unable to get address");
        } finally {
          setIsLoadingAddress(false);
        }
      }

      // Create draggable marker
      const marker = createDraggableMarker(markerLng, markerLat, mode);
      setDraggableMarker(marker);

      toast.info(`Pin drop mode: ${mode}`, {
        description: "Drag the pin to your desired location",
      });
    },
    [mapInstance, draggableMarker, reverseGeocode, createDraggableMarker]
  );

  // Cancel pin drop
  const cancelPinDrop = useCallback(() => {
    if (draggableMarker) {
      draggableMarker.remove();
      setDraggableMarker(null);
    }
    setIsActive(false);
    setCurrentMode(null);
    setCurrentAddress("");
    toast.info("Pin drop cancelled");
  }, [draggableMarker]);

  // Confirm pin drop
  const confirmPinDrop = useCallback(() => {
    if (!draggableMarker || !currentMode) return null;

    const lngLat = draggableMarker.getLngLat();
    const location: Location = {
      lng: lngLat.lng,
      lat: lngLat.lat,
      address: currentAddress,
    };

    // Clean up
    draggableMarker.remove();
    setDraggableMarker(null);
    setIsActive(false);
    const mode = currentMode;
    setCurrentMode(null);
    setCurrentAddress("");

    return { location, mode };
  }, [draggableMarker, currentMode, currentAddress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draggableMarker) {
        draggableMarker.remove();
      }
    };
  }, [draggableMarker]);

  return {
    isActive,
    currentMode,
    currentAddress,
    isLoadingAddress,
    startPinDrop,
    cancelPinDrop,
    confirmPinDrop,
  };
}

// 2. Pin Drop Mode Selection Modal Component
export function PinModeSelector({
  isOpen,
  onClose,
  onSelectMode,
  hasPickup,
  hasDropoff,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: "pickup" | "dropoff") => void;
  hasPickup: boolean;
  hasDropoff: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            📍 Choose Location to Pin
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => onSelectMode("pickup")}
              className="w-full flex items-center justify-between p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    Pickup Location
                  </div>
                  <div className="text-sm text-gray-500">
                    Zone center for pricing
                  </div>
                </div>
              </div>
              <div className="text-2xl">📍</div>
            </button>

            <button
              onClick={() => onSelectMode("dropoff")}
              disabled={!hasPickup}
              className={`w-full flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                hasPickup
                  ? "border-red-200 hover:border-red-300 hover:bg-red-50"
                  : "border-gray-200 bg-gray-50 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                <div className="text-left">
                  <div
                    className={`font-medium ${
                      hasPickup ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Drop-off Location
                  </div>
                  <div
                    className={`text-sm ${
                      hasPickup ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {hasPickup ? "Delivery destination" : "Set pickup first"}
                  </div>
                </div>
              </div>
              <div className="text-2xl">🎯</div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. Pin Drop Control Panel Component
export function PinDropControlPanel({
  isActive,
  mode,
  currentAddress,
  isLoadingAddress,
  onCancel,
  onConfirm,
}: {
  isActive: boolean;
  mode: "pickup" | "dropoff" | null;
  currentAddress: string;
  isLoadingAddress: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isActive || !mode) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-lg border max-w-sm w-full mx-4">
      <div className="p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="font-semibold text-gray-900 mb-1 flex items-center justify-center">
            {mode === "pickup" ? (
              <>
                <span className="text-green-500 mr-2">📍</span>
                Set Pickup Location
              </>
            ) : (
              <>
                <span className="text-red-500 mr-2">🎯</span>
                Set Drop-off Location
              </>
            )}
          </h3>
          <p className="text-sm text-gray-600">
            Drag the pin to your desired location
          </p>
        </div>

        {/* Current Address Display */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">
            SELECTED LOCATION
          </p>
          <div className="flex items-start">
            {isLoadingAddress ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin h-4 w-4 text-gray-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="text-sm text-gray-500">
                  Getting address...
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-900 leading-relaxed">
                {currentAddress}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoadingAddress}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLoadingAddress
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : mode === "pickup"
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {isLoadingAddress ? "Loading..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
}

// import { gql, useMutation, useQuery } from "@apollo/client"

// Updated mutation to match your backend
export const UPDATE_BOOKING_WITH_LOCATION = gql`
  mutation UpdateMultipleBookingsWithLocation($input: addBookCoordinateInput!) {
    updateMultipleBookingsWithLocation(input: $input) {
      id
      startTime
      endTime
      dropoffLocation
      pickupLocation
      estimatedDeliveryDate
      notes
      tableSize
      deliveryAddress
      item
      distance
      duration
      deliveryFee
      isConfirmed
      riderId
      serviceId
      updatedAt
    }
  }
`;

// Query to get existing booking
export const GET_APPOINTMENT_BOOKING = gql`
  query GetAppointmentBooking($bookId: String!) {
    getAppointmentBooking(bookId: $bookId) {
      id
      startTime
      endTime
      dropoffLocation
      pickupLocation
      estimatedDeliveryDate
      notes
      tableSize
      deliveryAddress
      item
      distance
      duration
      deliveryFee
      isConfirmed
      riderId
      serviceId
      updatedAt
    }
  }
`;

// ==========================================
// Updated Types
// ==========================================

export interface AddBookCoordinateInput {
  bookId: string;
  deliveryAddress?: string;
  dropoffLocation?: number[]; // [lng, lat]
  pickupLocation?: number[]; // [lng, lat]
  rangeMetaId?: string;
  ridersId?: string;
}

export interface AppointmentBooking {
  id: string;
  startTime: string;
  endTime: string;
  dropoffLocation?: number[];
  pickupLocation?: number[];
  estimatedDeliveryDate?: string;
  notes?: string;
  tableSize: number;
  deliveryAddress: string;
  item?: string;
  distance?: string;
  duration?: string;
  deliveryFee?: string;
  isConfirmed?: boolean;
  riderId: string;
  serviceId: string;
  updatedAt: string;
}

// ==========================================
// Updated Hook for Booking Management
// ==========================================

export function useBookingManagement(bookId?: string) {
  // Query existing booking
  const {
    data: bookingData,
    loading: isLoadingBooking,
    error: bookingError,
    refetch: refetchBooking,
  } = useQuery(GET_APPOINTMENT_BOOKING, {
    variables: { bookId: bookId || "" },
    skip: !bookId,
    onError: (error) => {
      console.error("Error loading booking:", error);
    },
  });

  // Mutation to update booking
  const [updateBookingMutation, { loading: isUpdatingBooking }] = useMutation(
    UPDATE_BOOKING_WITH_LOCATION,
    {
      onError: (error) => {
        console.error("Error updating booking:", error);
      },
    }
  );

  const updateBookingWithLocation = useCallback(
    async (input: AddBookCoordinateInput) => {
      try {
        const result = await updateBookingMutation({
          variables: { input },
        });

        if (result?.data?.updateMultipleBookingsWithLocation) {
          return result.data.updateMultipleBookingsWithLocation;
        }

        throw new Error("No data returned from mutation");
      } catch (error: any) {
        console.error("Update booking error:", error);
        throw error;
      }
    },
    [updateBookingMutation]
  );

  return {
    booking: bookingData?.getAppointmentBooking,
    isLoadingBooking,
    bookingError: bookingError?.message,
    updateBookingWithLocation,
    isUpdatingBooking,
    refetchBooking,
  };
}

// GraphQL Query for route data
export const GET_ROUTE_DATA = gql`
  query GetRouteData($bookId: String!) {
    getOrderRoute(orderId: $bookId) {
      id
      geojson
      updatedAt
    }
  }
`;

// Types
interface RouteData {
  id: string;
  geojson: string;
  updatedAt: string;
}

interface RouteGeometry {
  type: "LineString";
  coordinates: number[][];
}

interface RouteFeature {
  type: "Feature";
  geometry: RouteGeometry;
  metadata: {
    summary: string;
    distance: string;
    duration: string;
  };
}

// ==========================================
// Hook for Route Tracking
// ==========================================
export function useRouteTracking(bookId?: string) {
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [routeData, setRouteData] = useState<RouteFeature | null>(null);

  const {
    data: routeQueryData,
    loading: isLoadingRoute,
    error: routeError,
    refetch: refetchRoute,
  } = useQuery(GET_ROUTE_DATA, {
    variables: { bookId: bookId || "" },
    skip: !bookId || !isTrackingActive,
    onCompleted: (data) => {
      if (data?.getOrderRoute?.geojson) {
        try {
          const parsedRoute = JSON.parse(
            data.getOrderRoute.geojson
          ) as RouteFeature;
          setRouteData(parsedRoute);
          console.log("📍 Route data loaded:", parsedRoute.metadata);
        } catch (error) {
          console.error("❌ Failed to parse route GeoJSON:", error);
          toast.error("Failed to parse route data");
        }
      }
    },
    onError: (error) => {
      console.error("❌ Failed to load route:", error);
      toast.error("Failed to load delivery route");
    },
  });

  const startTracking = useCallback(() => {
    if (!bookId) {
      toast.error("No booking ID available for tracking");
      return;
    }

    console.log("🚛 Starting delivery tracking for booking:", bookId);
    setIsTrackingActive(true);
    refetchRoute();
  }, [bookId, refetchRoute]);

  const stopTracking = useCallback(() => {
    console.log("⏹️ Stopping delivery tracking");
    setIsTrackingActive(false);
    setRouteData(null);
  }, []);

  return {
    isTrackingActive,
    routeData,
    isLoadingRoute,
    routeError: routeError?.message,
    startTracking,
    stopTracking,
    refetchRoute,
  };
}

// ==========================================
// Route Display Component for Map
// ==========================================
export function useMapRouteDisplay(
  mapInstance: React.RefObject<maplibregl.Map | null>,
  routeData: RouteFeature | null,
  isTrackingActive: boolean
) {
  const [routeDisplayed, setRouteDisplayed] = useState(false);

  // Draw route on map
  const drawDeliveryRoute = useCallback(() => {
    if (!mapInstance.current || !routeData) return;

    const map = mapInstance.current;

    try {
      console.log("🗺️ Drawing delivery route on map");

      // Remove existing route if any
      if (map.getLayer("delivery-route")) {
        map.removeLayer("delivery-route");
      }
      if (map.getLayer("delivery-route-outline")) {
        map.removeLayer("delivery-route-outline");
      }
      if (map.getSource("delivery-route")) {
        map.removeSource("delivery-route");
      }

      // Add route source
      map.addSource("delivery-route", {
        type: "geojson",
        data: routeData,
      });

      // Add route outline (wider, darker)
      map.addLayer({
        id: "delivery-route-outline",
        type: "line",
        source: "delivery-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#1f2937", // dark gray
          "line-width": 8,
          "line-opacity": 0.6,
        },
      });

      // Add main route line
      map.addLayer({
        id: "delivery-route",
        type: "line",
        source: "delivery-route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3b82f6", // blue
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });

      // Fit map to show entire route
      const coordinates = routeData.geometry.coordinates;
      if (coordinates.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        coordinates.forEach((coord) => {
          bounds.extend([coord[0], coord[1]]);
        });

        map.fitBounds(bounds, {
          padding: 50,
          duration: 1500,
          maxZoom: 15,
        });
      }

      setRouteDisplayed(true);
      console.log("✅ Delivery route displayed successfully");

      // Show route metadata
      if (routeData.metadata) {
        toast.success("Route loaded!", {
          description: `${routeData.metadata.distance} • ${routeData.metadata.duration}`,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("❌ Error drawing route:", error);
      toast.error("Failed to display route on map");
    }
  }, [mapInstance, routeData]);

  // Clear route from map
  const clearDeliveryRoute = useCallback(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    try {
      console.log("🧹 Clearing delivery route from map");

      // Remove route layers
      if (map.getLayer("delivery-route")) {
        map.removeLayer("delivery-route");
      }
      if (map.getLayer("delivery-route-outline")) {
        map.removeLayer("delivery-route-outline");
      }
      if (map.getSource("delivery-route")) {
        map.removeSource("delivery-route");
      }

      setRouteDisplayed(false);
      console.log("✅ Route cleared successfully");
    } catch (error) {
      console.error("❌ Error clearing route:", error);
    }
  }, [mapInstance]);

  // Effect to handle route display
  useEffect(() => {
    if (isTrackingActive && routeData && !routeDisplayed) {
      drawDeliveryRoute();
    } else if (!isTrackingActive && routeDisplayed) {
      clearDeliveryRoute();
    }
  }, [
    isTrackingActive,
    routeData,
    routeDisplayed,
    drawDeliveryRoute,
    clearDeliveryRoute,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearDeliveryRoute();
    };
  }, [clearDeliveryRoute]);

  return {
    routeDisplayed,
    drawDeliveryRoute,
    clearDeliveryRoute,
  };
}

// ==========================================
// Track Delivery Button Component
// ==========================================
export function TrackDeliveryButton({
  isTracking,
  onStartTracking,
  onStopTracking,
  isLoading = false,
  disabled = false,
}: {
  isTracking: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={isTracking ? onStopTracking : onStartTracking}
      disabled={disabled || isLoading}
      className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        isTracking
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-blue-600 text-white hover:bg-blue-700"
      } ${
        disabled || isLoading
          ? "opacity-50 cursor-not-allowed"
          : "hover:shadow-md"
      }`}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Loading Route...
        </>
      ) : isTracking ? (
        <>
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Stop Tracking
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Track This Delivery
        </>
      )}
    </button>
  );
}

// ==========================================
// Route Information Panel Component
// ==========================================
export function RouteInfoPanel({
  routeData,
  isVisible,
  onClose,
  showRouteDialog,
  setShowRouteDialog,
  isLoadingRoute,
  handleStartTracking,
  isTrackingActive,
  booking,
}: {
  routeData: RouteFeature | null;
  isVisible: boolean;
  onClose: () => void;
  showRouteDialog: boolean;
  setShowRouteDialog: (show: boolean) => void;
  isLoadingRoute: boolean;
  handleStartTracking: () => void;
  isTrackingActive: boolean;
  booking: any;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close panel
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isVisible) {
        onClose();
        setShowRouteDialog(!showRouteDialog);
      }
    };

    if (isVisible) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isVisible, onClose]);

  // Don't render if not visible or no route data
  if (!isVisible || !routeData) {
    return null;
  }

  return (
    <>
      {!showRouteDialog && (
        <div
          ref={panelRef}
          className="absolute top-4 right-4 z-[9999] w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 overflow-hidden animate-in slide-in-from-right-2 fade-in duration-300"
        >
          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Live Status Banner */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <span className="text-sm font-semibold text-green-700">
                  Route Active & Tracking
                </span>
              </div>
            </div>

            {/* Route Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <svg
                  className="h-4 w-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="text-sm font-semibold text-blue-900">
                  Route Summary
                </p>
              </div>
              <p className="text-xs text-blue-700 leading-relaxed bg-white/50 rounded-lg p-3">
                {routeData.metadata.summary}
              </p>
            </div>

            {/* Distance & Duration Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow duration-200">
                <div className="text-lg font-bold text-gray-900">
                  {routeData.metadata.distance}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Distance
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition-shadow duration-200">
                <div className="text-lg font-bold text-gray-900">
                  {routeData.metadata.duration}
                </div>
                <div className="text-xs text-gray-500 font-medium">
                  Duration
                </div>
              </div>
            </div>

            {/* Booking Information Card */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="h-3 w-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Booking Details
                  </h4>
                </div>
                <span className="font-mono text-xs bg-white px-2 py-1 rounded-md border border-gray-200">
                  #{booking.id.slice(0, 8)}
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-white/80 rounded-lg p-3 space-y-2">
                  <div className="flex items-start space-x-2">
                    <svg
                      className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-600">
                        Delivery Address
                      </p>
                      <p className="text-sm text-gray-900 truncate">
                        {booking.deliveryAddress || "Not set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <svg
                      className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-600">Item</p>
                      <p className="text-sm text-gray-900 truncate">
                        {booking.item || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route & Fee Info */}
                {(booking.distance || booking.deliveryFee) && (
                  <div className="bg-white/80 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {booking.distance && booking.duration && (
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-600">
                            Route
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking.distance} • {booking.duration}
                          </p>
                        </div>
                      )}
                      {booking.deliveryFee && (
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-600">
                            Fee
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            ${booking.deliveryFee}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Track Button */}
            {booking && !isTrackingActive && (
              <button
                onClick={handleStartTracking}
                disabled={isLoadingRoute}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl py-3 px-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                {isLoadingRoute ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Initializing...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>Start Quick Track</span>
                  </>
                )}
              </button>
            )}

            {/* Close Action */}
            <button
              onClick={() => {
                setShowRouteDialog(!showRouteDialog);
                onClose();
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl py-2 px-4 font-medium text-sm transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Close Route Panel</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// Updated Complete Step Component
// ==========================================
export function CompleteStepWithTracking({
  bookingReference,
  calculation,
  riderProfile,
  onReset,
  bookId,
}: {
  bookingReference: string | null;
  calculation: any;
  riderProfile: any;
  onReset: () => void;
  bookId?: string;
}) {
  // Use tracking hook
  const {
    isTrackingActive,
    routeData,
    isLoadingRoute,
    routeError,
    startTracking,
    stopTracking,
  } = useRouteTracking(bookId);

  return (
    <div className="space-y-4">
      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="font-semibold text-green-900 mb-1">
          Booking Confirmed!
        </h3>
        <p className="text-sm text-green-700">
          Your delivery request has been sent to {riderProfile?.name}.
        </p>
      </div>

      {/* Booking Reference */}
      {bookingReference && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
            <p className="font-mono text-lg font-semibold text-gray-900">
              {bookingReference.slice(0, 8)}...
            </p>
          </div>
        </div>
      )}

      {/* Route Error Display */}
      {routeError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-sm text-yellow-800">⚠️ {routeError}</p>
        </div>
      )}

      {/* Route Information */}
      {isTrackingActive && routeData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Active Route</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-blue-700">Distance:</span>
              <span className="font-medium ml-1">
                {routeData.metadata.distance}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Duration:</span>
              <span className="font-medium ml-1">
                {routeData.metadata.duration}
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {routeData.metadata.summary}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onReset}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
        >
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Book Another Delivery
        </button>

        <TrackDeliveryButton
          isTracking={isTrackingActive}
          onStartTracking={startTracking}
          onStopTracking={stopTracking}
          isLoading={isLoadingRoute}
          disabled={!bookId}
        />
      </div>
    </div>
  );
}
