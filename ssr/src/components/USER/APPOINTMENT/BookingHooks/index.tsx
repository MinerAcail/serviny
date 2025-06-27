
// ==========================================
// Updated Hook for Booking Management
// ==========================================

import { gql, useMutation, useQuery } from "@apollo/client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Location } from "../pinDropHook";
import maplibregl from "maplibre-gl";
import { circle,  difference, distance, point } from "@turf/turf";
import { ZONE_COLORS } from "@/components/GLOBAL/format";
// Query to get existing booking
 const GET_APPOINTMENT_BOOKING = gql`
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
      pickUpAddress
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

 const UPDATE_BOOKING_WITH_LOCATION = gql`
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
      pickUpAddress
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
 const GET_ROUTE_DATA = gql`
  query GetRouteData($bookId: String!) {
    getOrderRoute(orderId: $bookId) {
      id
      geojson
      updatedAt
    }
  }
`;
 const GET_RIDER_RANGES = gql`
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
 const GET_RIDER_PROFILE = gql`
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

 interface AddBookCoordinateInput {
  bookId: string;
  deliveryAddress?: string;
  pickUpAddress?: string;

  dropoffLocation?: number[]; // [lng, lat]
  pickupLocation?: number[]; // [lng, lat]
  rangeMetaId?: string;
  ridersId?: string;
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

export interface PricingZone {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
  updatedAt?: string;
}
export interface DeliveryCalculation {
  distance: number;
  duration: string;
  matchedZone: PricingZone | null;
  totalPrice: number;
  pickupLocation: Location;
  dropoffLocation: Location;
  // itemCalculations?:


}
export function UseBookingManagement(bookId?: string) {
  // Query existing booking
  const {
    data: bookingData,
    loading: isLoadingBooking,
    error: bookingError,
    refetch: refetchBooking,
  } = useQuery(GET_APPOINTMENT_BOOKING, {
    variables: { bookId: bookId || "" },
    skip: !bookId,
    onError: (error:unknown) => {
      console.error("Error loading booking:", error);
    },
  });

  // Mutation to update booking
  const [updateBookingMutation, { loading: isUpdatingBooking }] = useMutation(
    UPDATE_BOOKING_WITH_LOCATION,
    {
      onError: (error:unknown) => {
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
      } catch (error: unknown) {
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


// ==========================================
// Route Information Panel Component
// ==========================================
// Booking interface based on the component usage
interface Booking {
  id: string
  deliveryAddress?: string
  item?: string
  distance?: string
  duration?: string
  deliveryFee?: string | number
  // Additional common booking properties you might need
  status?: string
  customerName?: string
  customerPhone?: string
  pickupAddress?: string
  notes?: string
  createdAt?: string
  estimatedDeliveryTime?: string
  riderId?: string
  vendorId?: string
}

// Updated RouteInfoPanel props interface
interface RouteInfoPanelProps {
  routeData: RouteFeature | null
  isVisible: boolean
  onClose: () => void
  showRouteDialog: boolean
  setShowRouteDialog: (show: boolean) => void
  isLoadingRoute: boolean
  handleStartTracking: () => void
  isTrackingActive: boolean
  booking: Booking | null // Changed from 'any' to proper type, allowing null
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
// Updated component with proper typing
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
}: RouteInfoPanelProps) {
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
                  #{booking?.id.slice(0, 8)}
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
                        {booking?.deliveryAddress || "Not set"}
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
                        {booking?.item || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Route & Fee Info */}
                {(booking?.distance || booking?.deliveryFee) && (
                  <div className="bg-white/80 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-3">
                      {booking?.distance && booking?.duration && (
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-600">
                            Route
                          </p>
                          <p className="text-sm font-semibold text-gray-900">
                            {booking?.distance} • {booking?.duration}
                          </p>
                        </div>
                      )}
                      {booking?.deliveryFee && (
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-600">
                            Fee
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            ${booking?.deliveryFee}
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
// Hook for Route Tracking
// ==========================================
export function UseRouteTracking(bookId?: string) {
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [routeData, setRouteData] = useState<RouteFeature | null>(null);

  const {
    // data: routeQueryData,
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


export function UseSimpleMapManagerWithCenteredPinDrop() {
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
            version: 8 as const,
            name: "Basic",
            sources: {
              osm: {
                type: "raster" as const,
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
              },
            },
            layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
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
            const outerCircle = circle(centerPoint, zone.endKm, {
              units: "kilometers",
              steps: 64,
            });

            // Start with the outer circle as the base polygon
            let zonePolygon: import("geojson").Feature<import("geojson").Polygon | import("geojson").MultiPolygon> = outerCircle;

            if (zone.startKm > 0) {
              const innerCircle = circle(centerPoint, zone.startKm, {
                units: "kilometers",
                steps: 64,
              });

              try {
                // Use the difference function correctly - it only takes one argument (a FeatureCollection)
                const differenceResult = difference({
                  type: "FeatureCollection",
                  features: [outerCircle, innerCircle]
                });
                
                if (differenceResult) {
                  zonePolygon = differenceResult;
                }
              } catch (differenceError) {
                console.warn(`⚠️ Difference operation failed for zone ${index}, using full circle:`, differenceError);
                // Use full circle if difference fails
                zonePolygon = outerCircle;
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
              `✅ Zone ${index + 1}: ${zone.startKm}-${zone.endKm}km, ${zone.price}`
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
            properties: {},
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
    getMapCenter,
    reverseGeocode,
    addMapMoveListener,
  };
}

export function UseSimpleLocationManager() {
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
export function UseDeliveryCalculation() {
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
        const from = point([pickup.lng, pickup.lat]); // Pickup is the center
        const to = point([dropoff.lng, dropoff.lat]); // Dropoff is the destination
        const distances = distance(from, to, { units: "kilometers" });

        console.log(
          `💰 Calculating delivery: ${distances.toFixed(
            2
          )}km from pickup (zone center) to dropoff`
        );

        // Find matching pricing zone based on distance from pickup
        const matchedZone =
          zones.find(
            (zone) => distances >= zone.startKm && distances < zone.endKm
          ) || zones[zones.length - 1];

        if (!matchedZone) {
          setError("No pricing zone found for this distance");
          return null;
        }

        // Calculate duration
        const averageSpeed = 25; // km/h
        const durationMinutes = Math.round((distances / averageSpeed) * 60);
        const duration =
          durationMinutes < 60
            ? `${durationMinutes} min`
            : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

        const result: DeliveryCalculation = {
          distance: Number(distances.toFixed(2)),
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
export function UseRiderZones(riderId: string | undefined) {
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

  



  return {
    riderZones: zonesData?.getARiderRanges || [],
    riderProfile: profileData?.getUserInfor,
    isLoading: isLoadingZones || isLoadingProfile,
    error: error || profileError?.message || zonesError?.message || null,
 
    refetchZones,
    refetchProfile,
  };
}
// Interface for the formatted prediction results
export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  
}



// Hook return type interface
interface UseLocationAutocompleteReturn {
  // Predictions
  pickupPredictions: PlacePrediction[];
  dropoffPredictions: PlacePrediction[];
  isSearching: boolean;

  // Search functions
  searchPickupLocations: (query: string) => Promise<void>;
  searchDropoffLocations: (query: string) => Promise<void>;

  // Get location details
  getLocationFromPlaceId: (placeId: string) => Promise<Location | null>;

  // Clear functions
  clearPickupPredictions: () => void;
  clearDropoffPredictions: () => void;
}

export function UseLocationAutocomplete(
  autocompleteService: google.maps.places.AutocompleteService | null,
  placesService: google.maps.places.PlacesService | null
): UseLocationAutocompleteReturn {
  const [pickupPredictions, setPickupPredictions] = useState<PlacePrediction[]>([]);
  const [dropoffPredictions, setDropoffPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Search for pickup locations
  const searchPickupLocations = useCallback(
    async (query: string): Promise<void> => {
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
          (results: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
            setIsSearching(false);

            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !results
            ) {
              setPickupPredictions([]);
              return;
            }

            const formattedResults: PlacePrediction[] = results.map((result) => ({
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
    async (query: string): Promise<void> => {
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
          (results: google.maps.places.AutocompletePrediction[] | null, status: google.maps.places.PlacesServiceStatus) => {
            setIsSearching(false);

            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !results
            ) {
              setDropoffPredictions([]);
              return;
            }

            const formattedResults: PlacePrediction[] = results.map((result) => ({
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

      return new Promise<Location | null>((resolve) => {
        placesService.getDetails(
          {
            placeId,
            fields: ["geometry", "formatted_address", "name"],
          },
          (result: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
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
  const clearPickupPredictions = useCallback((): void => {
    setPickupPredictions([]);
  }, []);

  const clearDropoffPredictions = useCallback((): void => {
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