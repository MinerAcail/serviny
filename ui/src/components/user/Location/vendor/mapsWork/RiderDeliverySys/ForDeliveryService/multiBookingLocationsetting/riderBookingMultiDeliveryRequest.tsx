"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";

// Styles
import "maplibre-gl/dist/maplibre-gl.css";
import "../../../map-popup.css";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface MultiDeliveryItem {
  id: string;
  itemDescription: string;
  deliveryAddress: string;
  pickUpAddress: string;
  dropoffLocation: [number, number]; // [lat, lng] for UI
  notes: string;
  userId?: string;
  calculated?: {
    distance: number;
    duration: string;
    price: number;
    // zoneId?: string; 
  };
}

type BookingStep = "locations" | "review" | "complete";

// ==========================================
// HOOKS IMPORTS
// ==========================================

import {
  useRiderZones,
  useRouteTracking,
  RouteInfoPanel,
  type Location,
  useMultiDeliveryCalculation,
  useMultiGroupBookingManagement,
  convertBookingsToDeliveryItems,
  convertDeliveryItemsToUpdateInputs,
  // Import the multi-delivery map manager
  useMultiDeliveryMapManager,
  UpdateOrderWithLocationInput,
} from "../riderBookingHooks";

import {
  useEnhancedPinDrop,
  PinDropDialog,
  EnhancedPinDropControlPanel,
} from "../books/pinDropHook";

// ==========================================
// COMPONENT IMPORTS
// ==========================================

import {
  MultiLocationInputDialog,
  vendorData,
} from "./MultiLocationInputDialog";
import { MapAndMultiBooking } from "./MapAndMultiBooking";
import { RiderMultiBookingMenu } from "./RiderMultiBookingMenu";
import { findClosestDelivery } from "@/components/GlobalLogic/distanceUtils";

// ==========================================
// CONSTANTS
// ==========================================

const libraries: Libraries = ["places"];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function RiderBookingMultiDeliveryRequest() {
  // ==========================================
  // 1. ROUTER & ENV SETUP
  // ==========================================
  const { riderId, bookId } = useParams<{ riderId: string; bookId: string }>();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const isService = queryParams.get("service");
  const isOrder = queryParams.get("order") === "true";

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;
  // const [searchParams] = useSearchParams()
  // const isCargo = searchParams.get('cargo') === 'true'
  // console.log("isService", isService);

  // ==========================================
  // 2. REFS
  // ==========================================
  const mapRef = useRef<HTMLDivElement | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // NEW: Performance optimization refs
  const lastProcessedDataRef = useRef<string>("");
  const mapUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMapUpdatingRef = useRef(false);

  // ==========================================
  // 3. LOCAL STATE
  // ==========================================
  const [showLocationDialog, setShowLocationDialog] = useState(true);
  const [dialogHasBeenCompleted, setDialogHasBeenCompleted] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [deliveryItems, setDeliveryItems] = useState<MultiDeliveryItem[]>([]);

  const [hasLoadedFromBookings, setHasLoadedFromBookings] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>("locations");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [isOpenBookingMenu, setIsOpenBookingMenu] = useState(false);
  const [showZones, setShowZones] = useState(true);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);
  // setVendorData state
  const [vendorData, setVendorData] = useState<vendorData>({
    id: "",
    name: "",
    coordinates: [0, 0],
    location: "",
  });

  // ==========================================
  // 4. GOOGLE MAPS API
  // ==========================================
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries,
  });

  // ==========================================
  // 5. MULTI-GROUP BOOKING MANAGEMENT
  // ==========================================
  const {
    multiGroupBookings,
    isLoadingBookings,
    bookingsError,
    updateBookingsWithLocations,
    isUpdatingBookings,
    // refetchBookings,
    orderData,
    updateOrderWithLocation,
     orderLoading,
    isUpdatingOrder,
    refetchOrder,
    orderError,

  } = useMultiGroupBookingManagement(bookId, isOrder ? "ORDER" : "BOOKING");
  // console.log("orderData",orderData);
  const orderId = orderData?.getOrderDetails.id ; // Use orderData if available, otherwise fallback to bookId

  // ==========================================
  // 6. RIDER DATA
  // ==========================================
  const {
    riderZones,
    riderProfile,
    isLoading: zonesLoading,
    error: zonesError,
  } = useRiderZones(riderId);

  // ==========================================
  // 7. MULTI-DELIVERY CALCULATION
  // ==========================================
  const {
    totalCalculations,
    isCalculating,
    error: calculationError,
    calculateMultiDeliveryPricing,
    clearCalculations,
  } = useMultiDeliveryCalculation();

  // ==========================================
  // 8. MULTI-DELIVERY MAP MANAGEMENT
  // ==========================================
  const {
    mapInstance,
    mapLoaded,
    mapInitialized,
    initializeMapWithPickup,
    // Multi-delivery functions
    updateMultiDeliveryMarkers,
    drawMultiDeliveryRoutes,
    fitMapToAllLocations,
    // Single delivery functions (for compatibility)
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
    clearMap,
  } = useMultiDeliveryMapManager();

  // ==========================================
  // 9. PIN DROP FUNCTIONALITY
  // ==========================================
  const {
    isActive: isPinDropActive,
    currentMode: pinDropMode,
    showDialog: showPinDropDialog,
    currentAddress: pinDropAddress,
    isLoadingAddress: isPinDropLoading,
    startPinDropMode,
    handleDialogChoice,
    cancelPinDrop,
    cancelDialog,
    confirmPinLocation,
  } = useEnhancedPinDrop(mapInstance, geocoderRef);

  // ==========================================
  // 10. ROUTE TRACKING
  // ==========================================
  const {
    isTrackingActive,
    routeData,
    isLoadingRoute,
    startTracking,
    stopTracking,
  } = useRouteTracking(bookId);

  // ==========================================
  // 11. MEMOIZED DELIVERY DATA (PERFORMANCE OPTIMIZATION)
  // ==========================================
  const memoizedDeliveryData = useMemo(() => {
    const completedDeliveryItems = deliveryItems.filter(
      (item) =>
        item.deliveryAddress &&
        item.itemDescription &&
        item.dropoffLocation[0] !== 0 &&
        item.dropoffLocation[1] !== 0
    );

    const deliveryLocations: Location[] = completedDeliveryItems.map(
      (item) => ({
        lng: item.dropoffLocation[1], // Convert from [lat, lng] to [lng, lat]
        lat: item.dropoffLocation[0],
        address: item.deliveryAddress,
      })
    );

    const itemDescriptions = completedDeliveryItems.map(
      (item) => item.itemDescription
    );

    return {
      deliveryLocations,
      itemDescriptions,
      count: completedDeliveryItems.length,
      // Create a stable key for comparison
      key: completedDeliveryItems
        .map(
          (item) =>
            `${item.id}-${item.dropoffLocation[0]}-${item.dropoffLocation[1]}-${item.deliveryAddress}-${item.itemDescription}`
        )
        .join("|"),
    };
  }, [deliveryItems]);

  // ==========================================
  // 12. LOAD EXISTING BOOKINGS EFFECT
  // ==========================================
  useEffect(() => {
    if (multiGroupBookings.length > 0 && !hasLoadedFromBookings) {
      // console.log(
      //   "📦 Loading existing multi-group bookings:",
      //   multiGroupBookings
      // );

      // Convert backend bookings to UI format
      const firstBooking = multiGroupBookings[0];

      // Set pickup location from first booking
      if (
        firstBooking.pickupLocation &&
        firstBooking.pickupLocation.length >= 2
      ) {
        const pickup: Location = {
          lng: firstBooking.pickupLocation[0], // Backend uses lng,lat
          lat: firstBooking.pickupLocation[1],
          address:
            firstBooking.pickUpAddress || "Pickup Location (Zone Center)",
        };
        setPickupLocation(pickup);
        // console.log("🏠 Set pickup location:", pickup);
      }

      // Convert all bookings to delivery items
      const items = convertBookingsToDeliveryItems(multiGroupBookings);
      // console.log("📋 Converted delivery items:", items);

      setDeliveryItems(items);
      //
      setHasLoadedFromBookings(true);

      // **KEY FIX**: Don't auto-complete the dialog, let user review the data
      setDialogHasBeenCompleted(false);
      setShowLocationDialog(true); // Ensure dialog opens to show existing data

      // toast.success(`Loaded ${items.length} existing deliveries`, {
      //   description: "Review locations and make changes or proceed",
      //   duration: 5000,
      // });
    }
  }, [multiGroupBookings, hasLoadedFromBookings]);
  // ==========================================
  // 13. GOOGLE PLACES INITIALIZATION EFFECT
  // ==========================================
  useEffect(() => {
    if (!isLoaded) return;

    // console.log("🔧 Initializing Google Places services...");
    autocompleteServiceRef.current =
      new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    const serviceDiv = document.createElement("div");
    const dummyMap = new google.maps.Map(serviceDiv);
    placesServiceRef.current = new google.maps.places.PlacesService(dummyMap);

    // console.log("✅ Google Places services initialized");
  }, [isLoaded]);

  // ==========================================
  // 14. MAP INITIALIZATION EFFECT
  // ==========================================
  useEffect(() => {
    if (
      !mapRef.current ||
      !pickupLocation ||
      mapInitialized ||
      !dialogHasBeenCompleted
    ) {
      return;
    }

    const timer = setTimeout(() => {
      initializeMapWithPickup(mapRef.current!, pickupLocation, maptilerApiKey);
    }, 200);

    return () => clearTimeout(timer);
  }, [
    pickupLocation,
    mapInitialized,
    initializeMapWithPickup,
    maptilerApiKey,
    dialogHasBeenCompleted,
  ]);

  // ==========================================
  // 15. OPTIMIZED: MULTI-DELIVERY MAP UPDATE EFFECT
  // ==========================================
  useEffect(() => {
    if (
      !mapLoaded ||
      !pickupLocation ||
      isTrackingActive ||
      !dialogHasBeenCompleted
    ) {
      return;
    }

    // Create a unique key for this update
    const currentDataKey = `${pickupLocation.lat}-${pickupLocation.lng}-${memoizedDeliveryData.key}-${riderZones.length}-${showZones}`;

    // Skip if we've already processed this exact data
    if (
      lastProcessedDataRef.current === currentDataKey ||
      isMapUpdatingRef.current
    ) {
      // console.log("⏭️ Skipping duplicate map update");
      return;
    }

    // Clear any pending updates
    if (mapUpdateTimeoutRef.current) {
      clearTimeout(mapUpdateTimeoutRef.current);
    }

    // Debounce the map update
    mapUpdateTimeoutRef.current = setTimeout(() => {
      if (!mapLoaded || isTrackingActive) return;

      // console.log("📍 Updating multi-delivery map (debounced):", {
      //   pickup: pickupLocation.address,
      //   deliveryCount: memoizedDeliveryData.count,
      //   zonesCount: riderZones.length,
      //   showZones,
      // });

      isMapUpdatingRef.current = true;
      lastProcessedDataRef.current = currentDataKey;

      try {
        // 1. Update markers first
        updateMultiDeliveryMarkers(
          pickupLocation,
          memoizedDeliveryData.deliveryLocations,
          memoizedDeliveryData.itemDescriptions
        );

        // 2. Draw zones after a short delay
        if (riderZones.length > 0 && showZones) {
          setTimeout(() => {
            if (mapLoaded && !isTrackingActive) {
              drawCoverageZones(pickupLocation, riderZones);
            }
          }, 150);
        }

        // 3. Draw routes and fit map after zones
        if (memoizedDeliveryData.deliveryLocations.length > 0) {
          setTimeout(() => {
            if (mapLoaded && !isTrackingActive) {
              drawMultiDeliveryRoutes(
                pickupLocation,
                memoizedDeliveryData.deliveryLocations
              );

              // Fit map with longer delay to ensure all elements are rendered
              setTimeout(() => {
                if (mapLoaded && !isTrackingActive) {
                  fitMapToAllLocations(
                    pickupLocation,
                    memoizedDeliveryData.deliveryLocations
                  );
                }
              }, 300);
            }
          }, 250);
        }
      } catch {
        // console.error("❌ Error in map update:", error);
      } finally {
        // Reset updating flag after all operations
        setTimeout(() => {
          isMapUpdatingRef.current = false;
        }, 1000);
      }
    }, 200); // 200ms debounce

    // Cleanup function
    return () => {
      if (mapUpdateTimeoutRef.current) {
        clearTimeout(mapUpdateTimeoutRef.current);
      }
    };
  }, [
    mapLoaded,
    pickupLocation?.lat,
    pickupLocation?.lng,
    memoizedDeliveryData.key, // Use the memoized key instead of complex dependencies
    riderZones.length,
    showZones,
    isTrackingActive,
    dialogHasBeenCompleted,
    updateMultiDeliveryMarkers,
    drawCoverageZones,
    drawMultiDeliveryRoutes,
    fitMapToAllLocations,
  ]);

  // ==========================================
  // 16. OPTIMIZED: CALCULATION EFFECT
  // ==========================================
  useEffect(() => {
    if (
      !pickupLocation ||
      deliveryItems.length === 0 ||
      riderZones.length === 0 ||
      isCalculating ||
      !dialogHasBeenCompleted
    ) {
      return;
    }

    const validItems = deliveryItems.filter(
      (item) =>
        item.deliveryAddress &&
        item.itemDescription &&
        item.dropoffLocation[0] !== 0 &&
        item.dropoffLocation[1] !== 0
    );

    if (validItems.length === 0) {
      return;
    }

    // Clear existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    // Debounce calculation
    calculationTimeoutRef.current = setTimeout(() => {
      // console.log(
      //   "💰 Auto-calculating multi-delivery pricing for",
      //   validItems.length,
      //   "items"
      // );
      calculateMultiDeliveryPricing(pickupLocation, validItems, riderZones);
    }, 300); // 300ms debounce

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, [
    pickupLocation?.lat,
    pickupLocation?.lng,
    memoizedDeliveryData.count, // Use count instead of complex dependency
    riderZones.length,
    isCalculating,
    dialogHasBeenCompleted,
    calculateMultiDeliveryPricing,
  ]);

  // ==========================================
  // 17. STEP PROGRESSION EFFECT
  // ==========================================
  useEffect(() => {
    if (totalCalculations && currentStep === "locations") {
      setCurrentStep("review");
    }
  }, [totalCalculations, currentStep]);

  // ==========================================
  // 18. ROUTE PANEL MANAGEMENT
  // ==========================================

  const handleCloseRoutePanel = useCallback(() => {
    // console.log("🔴 Closing route panel");
    setShowRoutePanel(false);
  }, []);

  useEffect(() => {
    // console.log("🔍 Route tracking state changed:", {
    //   isTrackingActive,
    //   hasRouteData: !!routeData,
    //   showRoutePanel,
    // });

    if (isTrackingActive && routeData) {
      if (!showRoutePanel) {
        console.log("✅ Showing route panel");
        setShowRoutePanel(true);
      }
    } else if (!isTrackingActive && showRoutePanel) {
      // console.log("❌ Hiding route panel - tracking stopped");
      setShowRoutePanel(false);
    }
  }, [isTrackingActive, routeData, showRoutePanel]);

  // ==========================================
  // 19. CLEANUP EFFECTS
  // ==========================================
  useEffect(() => {
    return () => {
      // console.log("🔧 Component cleanup");
      if (mapUpdateTimeoutRef.current) {
        clearTimeout(mapUpdateTimeoutRef.current);
      }
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      lastProcessedDataRef.current = "";
      isMapUpdatingRef.current = false;
      setShowRoutePanel(false);
    };
  }, []);

  // ==========================================
  // 21. EVENT HANDLERS
  // ==========================================

  const handleLocationsComplete = useCallback(
    (pickup: Location, items: MultiDeliveryItem[]) => {
      setPickupLocation(pickup);
      setDeliveryItems(items);
      setCurrentStep("locations");
      clearCalculations();
      setDialogHasBeenCompleted(true);

      // Reset tracking if active
      if (isTrackingActive) {
        stopTracking();
      }

      // Clear performance tracking refs
      lastProcessedDataRef.current = "";
      isMapUpdatingRef.current = false;

      // toast.success("Multi-delivery locations updated!", {
      //   description: `Pickup + ${items.length} delivery destinations`,
      // });
    },
    [clearCalculations, isTrackingActive, stopTracking]
  );

  const handleDialogClose = useCallback(() => {
    setShowLocationDialog(false);
    setDialogHasBeenCompleted(true);
  }, []);

  const handleEditLocations = useCallback(() => {
    if (isTrackingActive) {
      stopTracking();
    }
    setShowLocationDialog(true);
  }, [isTrackingActive, stopTracking]);

  // ==========================================
  // 22. MULTI-BOOKING HANDLER & ORDER UPDATE
  // ==========================================

  const handleMultiBooking = useCallback(async () => {
    if (
      !totalCalculations ||
      !pickupLocation ||
      !deliveryItems.length ||
      !riderId ||
      !bookId
    ) {
      toast.error("Missing required multi-delivery booking information");
      return;
    }

    setIsBooking(true);

    try {
      // console.log("📦 Updating existing multi-delivery bookings...");

      // Convert delivery items to update inputs
      const updateInputs = convertDeliveryItemsToUpdateInputs(
        deliveryItems,
        pickupLocation,
        riderId,
        riderZones // Pass riderZones instead of undefined 'zones'
      );

      // console.log("📝 Update inputs prepared:", updateInputs);

      // Update existing bookings with location data
      const updatedBookings = await updateBookingsWithLocations(updateInputs);

      // console.log("✅ Bookings updated successfully:", updatedBookings);

      setBookingReference(bookId);
      setBookingComplete(true);
      setCurrentStep("complete");

      toast.success("Multi-delivery bookings updated!", {
        description: `${
          deliveryItems.length
        } deliveries • Total: $${totalCalculations.totalPrice.toFixed(2)}`,
        duration: 5000,
      });
      const firstBooking = multiGroupBookings[0];

      //redirect
      if (isService) {
        const timeout = setTimeout(() => {
          window.location.href = `/dbp/c/${firstBooking.userId}/?share=${bookId}`;
        }, 5000);

        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          window.location.href = `/vob`;
        }, 5000);

        return () => clearTimeout(timeout);
      }
    } catch (error: unknown) {
      // console.error("❌ Multi-delivery booking update failed:", error);
      toast.error(
        "Failed to update multi-delivery bookings. Please try again.",
        {
          duration: 5000,
        }
      );
    } finally {
      setIsBooking(false);
    }
  }, [
    totalCalculations,
    pickupLocation,
    deliveryItems,
    riderId,
    bookId,
    riderZones, // Add riderZones to dependency array
    updateBookingsWithLocations,
    isService,
    bookId,
  ]);
 const handleOrderUpdateWithLocation = useCallback(async () => {
    if (
      !totalCalculations ||
      !pickupLocation ||
      !deliveryItems.length ||
      !riderId ||
      !bookId
    ) {
      toast.error("Missing required multi-delivery booking information");
      return;
    }

    setIsBooking(true);

    try {
      // console.log("📦 Updating existing multi-delivery bookings...");

      
   
      const closestDelivery = findClosestDelivery(
  pickupLocation,
  deliveryItems.map(item => ({
    id: item.id,
    dropoffLocation: item.dropoffLocation,
    address: item.deliveryAddress
  }))
);
      const InputOrder: UpdateOrderWithLocationInput = {
        coordinates: [ pickupLocation.lat,pickupLocation.lng],
        deliveryAddress:  deliveryItems[0]?.deliveryAddress,
        dropoffLocation:  deliveryItems[0]?.dropoffLocation,
        rangeMetaId: closestDelivery?.id || "",
        orderId: orderId || bookId, // Use orderId if available, otherwise fallback to bookId
        ridersId: riderId,
      }

      console.log("📝 Update inputs prepared:", InputOrder);

      // Update existing bookings with location data
      const updatedBookings = await updateOrderWithLocation(InputOrder);

      console.log("✅ Bookings updated successfully:", updatedBookings);

      setBookingReference(bookId);
      setBookingComplete(true);
      setCurrentStep("complete");

      toast.success("Multi-delivery bookings updated!", {
        description: `${
          deliveryItems.length
        } deliveries • Total: $${totalCalculations.totalPrice.toFixed(2)}`,
        duration: 5000,
      });
   

      //redirect
         const timeout = setTimeout(() => {
          window.location.href = `/vob`;
        }, 5000);

        return () => clearTimeout(timeout);
    } catch (error: unknown) {
      // console.error("❌ Multi-delivery booking update failed:", error);
      toast.error(
        "Failed to update delivery order. Please try again.",
        {
          duration: 5000,
        }
      );
    } finally {
      setIsBooking(false);
    }
  }, [
    totalCalculations,
    pickupLocation,
    // deliveryItems,
    riderId,
    bookId,
    riderZones, // Add riderZones to dependency array
    updateOrderWithLocation,
    bookId,
  ]);
  const resetBooking = useCallback(() => {
    setPickupLocation(null);
    setDeliveryItems([]);
    setHasLoadedFromBookings(false);
    clearCalculations();
    clearMap();
    setCurrentStep("locations");
    setBookingComplete(false);
    setBookingReference(null);
    setShowLocationDialog(true);
    setDialogHasBeenCompleted(false);

    // Reset performance refs
    lastProcessedDataRef.current = "";
    isMapUpdatingRef.current = false;
    if (mapUpdateTimeoutRef.current) {
      clearTimeout(mapUpdateTimeoutRef.current);
    }
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    if (isTrackingActive) {
      stopTracking();
    }

    if (isPinDropActive) {
      cancelPinDrop();
    }

    toast.info("Multi-delivery booking reset", {
      description: "Ready to set new pickup and delivery locations",
    });
  }, [
    clearCalculations,
    clearMap,
    isTrackingActive,
    stopTracking,
    isPinDropActive,
    cancelPinDrop,
  ]);

  // ==========================================
  // 23. PIN DROP HANDLERS
  // ==========================================

  const handleStartPinDrop = useCallback(() => {
    startPinDropMode();
  }, [startPinDropMode]);

  const handlePinDropChoice = useCallback(
    (mode: "pickup" | "dropoff", deliveryItemId?: string) => {
      console.log("🎯 handlePinDropChoice called:", { mode, deliveryItemId });
      handleDialogChoice(mode, deliveryItemId);
    },
    [handleDialogChoice]
  );
  const forceMapUpdate = useCallback(() => {
    // console.log("🔄 forceMapUpdate called");

    // Clear the last processed data to force a map update
    lastProcessedDataRef.current = "";
    isMapUpdatingRef.current = false;

    // Clear any pending timeouts
    if (mapUpdateTimeoutRef.current) {
      clearTimeout(mapUpdateTimeoutRef.current);
    }

    // Force immediate update with the current state
    setTimeout(() => {
      if (!pickupLocation) {
        // console.log("❌ No pickup location for force update");
        return;
      }

      // Get current delivery data
      const currentCompletedItems = deliveryItems.filter(
        (item) =>
          item.deliveryAddress &&
          item.itemDescription &&
          item.dropoffLocation[0] !== 0 &&
          item.dropoffLocation[1] !== 0
      );

      const currentDeliveryLocations: Location[] = currentCompletedItems.map(
        (item) => ({
          lng: item.dropoffLocation[1], // Convert from [lat, lng] to [lng, lat]
          lat: item.dropoffLocation[0],
          address: item.deliveryAddress,
        })
      );

      const currentItemDescriptions = currentCompletedItems.map(
        (item) => item.itemDescription
      );

      // console.log("🔄 Force updating map with:", {
      //   pickup: pickupLocation.address,
      //   deliveryCount: currentDeliveryLocations.length,
      //   deliveries: currentDeliveryLocations.map((loc) => loc.address),
      // });

      if (currentDeliveryLocations.length > 0) {
        updateMultiDeliveryMarkers(
          pickupLocation,
          currentDeliveryLocations,
          currentItemDescriptions
        );

        if (riderZones.length > 0 && showZones) {
          setTimeout(() => drawCoverageZones(pickupLocation, riderZones), 100);
        }

        setTimeout(() => {
          drawMultiDeliveryRoutes(pickupLocation, currentDeliveryLocations);
          setTimeout(() => {
            fitMapToAllLocations(pickupLocation, currentDeliveryLocations);
          }, 200);
        }, 200);
      } else {
        // Only pickup, no deliveries
        updateMultiDeliveryMarkers(pickupLocation, [], []);
        if (riderZones.length > 0 && showZones) {
          drawCoverageZones(pickupLocation, riderZones);
        }
      }
    }, 100);
  }, [
    pickupLocation,
    deliveryItems,
    riderZones,
    showZones,
    updateMultiDeliveryMarkers,
    drawCoverageZones,
    drawMultiDeliveryRoutes,
    fitMapToAllLocations,
  ]);

  const handlePinDropConfirm = useCallback(() => {
    const result = confirmPinLocation();
    if (!result) {
      // console.log("❌ No pin drop result");
      return;
    }

    const { location, mode, deliveryItemId } = result;

    if (mode === "pickup") {
      setPickupLocation(location);

      // Reset performance refs when pickup changes
      lastProcessedDataRef.current = "";
      isMapUpdatingRef.current = false;

      // toast.success("Pickup location updated!", {
      //   description: "Zone center moved to pin location",
      // });
    } else if (mode === "dropoff" && deliveryItemId) {
      // FIXED: Update specific delivery item
      setDeliveryItems((prev) => {
        const updated = prev.map((item) => {
          if (item.id === deliveryItemId) {
            console.log(`📍 Updating delivery item ${item.id}:`, {
              oldAddress: item.deliveryAddress,
              newAddress: location.address,
              oldCoords: item.dropoffLocation,
              newCoords: [location.lat, location.lng],
            });

            return {
              ...item,
              deliveryAddress: location.address,
              dropoffLocation: [location.lat, location.lng] as [number, number],
            };
          }
          return item;
        });

        console.log("📦 Updated delivery items:", updated);
        return updated;
      });

      // Find the updated item for toast
      const updatedItem = deliveryItems.find(
        (item) => item.id === deliveryItemId
      );

      toast.success("Delivery location updated!", {
        description: `${
          updatedItem?.itemDescription || "Delivery"
        } moved to pin location`,
      });

      // Reset performance refs to trigger map update
      lastProcessedDataRef.current = "";
      isMapUpdatingRef.current = false;
      // FORCE map update after state change
      setTimeout(() => {
        forceMapUpdate();
      }, 200);
    }

    clearCalculations();
  }, [
    confirmPinLocation,
    setPickupLocation,
    setDeliveryItems,
    deliveryItems,
    clearCalculations,
    forceMapUpdate,
  ]);
  const handlePinDropCancel = useCallback(() => {
    cancelPinDrop();
  }, [cancelPinDrop]);

  // ==========================================
  // 24. TRACKING HANDLERS
  // ==========================================

  const handleStartTracking = useCallback(() => {
    if (!bookId) {
      toast.error("No booking ID available for tracking");
      return;
    }

    if (isPinDropActive) {
      cancelPinDrop();
    }

    if (!isTrackingActive) {
      console.log("🚛 Starting multi-delivery tracking mode");
      startTracking();
    }
  }, [bookId, isPinDropActive, cancelPinDrop, isTrackingActive, startTracking]);

  const handleStopTracking = useCallback(() => {
    console.log("⏹️ Stopping multi-delivery tracking mode");

    stopTracking();
    setShowRoutePanel(false);

    // Reset performance refs
    lastProcessedDataRef.current = "";
    isMapUpdatingRef.current = false;

    // Restore normal multi-delivery map view
    if (pickupLocation && deliveryItems.length > 0) {
      setTimeout(() => {
        updateMultiDeliveryMarkers(
          pickupLocation,
          memoizedDeliveryData.deliveryLocations,
          memoizedDeliveryData.itemDescriptions
        );

        if (riderZones.length > 0) {
          drawCoverageZones(pickupLocation, riderZones);
        }

        if (memoizedDeliveryData.deliveryLocations.length > 0) {
          drawMultiDeliveryRoutes(
            pickupLocation,
            memoizedDeliveryData.deliveryLocations
          );
          fitMapToAllLocations(
            pickupLocation,
            memoizedDeliveryData.deliveryLocations
          );
        }
      }, 500);
    }
  }, [
    stopTracking,
    pickupLocation,
    deliveryItems.length,
    memoizedDeliveryData,
    riderZones,
    updateMultiDeliveryMarkers,
    drawCoverageZones,
    drawMultiDeliveryRoutes,
    fitMapToAllLocations,
  ]);
  // get vendor data in setVendorData
  const handlVendorData = useCallback((vendorData: any) => {
    // console.log("📦 Vendor data received:", vendorData);
    if (vendorData && vendorData.id) {
      setVendorData({
        id: vendorData.id,
        name: vendorData.name || "Unknown Vendor",
        coordinates: vendorData.coordinates || [0, 0],
        location: vendorData.location || "Unknown Location",
      });
    }
  }, []);

  // ==========================================
  // 25. LOADING STATE
  // ==========================================
  if (!isLoaded || zonesLoading || isLoadingBookings) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading multi-delivery booking...</p>
          <p className="text-xs text-gray-400 mt-2">
            {isLoadingBookings
              ? "Loading existing bookings..."
              : "Setting up delivery zones..."}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 26. ERROR STATE
  // ==========================================
  if (zonesError || bookingsError) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-4">{zonesError || bookingsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 27. WELCOME MESSAGE COMPONENT
  // ==========================================
  const WelcomeMessage = () => (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="h-8 w-8 text-blue-600"
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        {hasLoadedFromBookings
          ? "Update Multi-Delivery Locations"
          : "Multi-Delivery Booking"}
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasLoadedFromBookings
          ? "Edit your existing multi-delivery booking locations and update the details."
          : "Set one pickup location and multiple delivery destinations. Perfect for multiple orders or packages going to different addresses."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => setShowLocationDialog(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {hasLoadedFromBookings
            ? "Edit Multi-Delivery"
            : "Setup Multi-Delivery"}
        </button>
      </div>
    </div>
  );

  // ==========================================
  // 28. MAIN RENDER
  // ==========================================
  return (
    <div className=" font-sans w-full min-h-screen">
      <div className="">
        {/* Multi-Location Input Dialog */}
        <MultiLocationInputDialog
          key={`dialog-${hasLoadedFromBookings}-${deliveryItems.length}-${pickupLocation?.lat}-${pickupLocation?.lng}`}
          isOpen={showLocationDialog}
          onClose={handleDialogClose}
          onComplete={handleLocationsComplete}
          initialPickup={pickupLocation}
          initialDeliveryItems={deliveryItems}
          autocompleteServiceRef={autocompleteServiceRef}
          placesServiceRef={placesServiceRef}
          isLoaded={isLoaded}
          isOrder={isOrder}
          serviceID={riderId}
          getVendorData={handlVendorData}
        />

        {dialogHasBeenCompleted && (
          <>
            {/* Pin Drop Components */}
            <PinDropDialog
              isOpen={showPinDropDialog}
              onSelectMode={handlePinDropChoice}
              onCancel={cancelDialog}
              hasPickup={!!pickupLocation}
              hasDropoff={deliveryItems.length > 0}
              deliveryItems={deliveryItems}
              isMultiDelivery={true}
            />

            <EnhancedPinDropControlPanel
              isActive={isPinDropActive}
              mode={pinDropMode}
              currentAddress={pinDropAddress}
              isLoadingAddress={isPinDropLoading}
              onCancel={handlePinDropCancel}
              onConfirm={handlePinDropConfirm}
            />

            {/* Welcome Message (when no data) */}
            {!pickupLocation &&
              !deliveryItems.length &&
              !showLocationDialog &&
              !hasLoadedFromBookings && <WelcomeMessage />}

            {/* Main Interface (when has pickup) */}
            {pickupLocation && (
              <div className="relative">
                <MapAndMultiBooking
                  mapRef={mapRef}
                  mapInstance={mapInstance}
                  mapLoaded={mapLoaded}
                  pickupLocation={pickupLocation}
                  deliveryItems={deliveryItems}
                  totalCalculations={totalCalculations}
                  isCalculating={isCalculating}
                  isOpenBookingMenu={isOpenBookingMenu}
                  showZones={showZones && !isTrackingActive}
                  onToggleZones={() => setShowZones(!showZones)}
                  isPinDropActive={isPinDropActive}
                  pinDropMode={pinDropMode}
                  onStartPinDrop={handleStartPinDrop}
                  hasPickup={!!pickupLocation}
                  hasDeliveryItems={deliveryItems.length > 0}
                  loading={zonesLoading}
                  error={zonesError || calculationError}
                  riderZones={riderZones}
                  showRouteDialog={showRouteDialog}
                  setShowRouteDialog={setShowRouteDialog}
                  setIsOpen={setIsOpenBookingMenu}
                  orderData={orderData?.getOrderDetails}
                  isOrder={isOrder}
                />

                <RouteInfoPanel
                  routeData={routeData}
                  isVisible={showRoutePanel && isTrackingActive && !!routeData}
                  onClose={handleCloseRoutePanel}
                  showRouteDialog={showRouteDialog}
                  setShowRouteDialog={setShowRouteDialog}
                  isLoadingRoute={isLoadingRoute}
                  handleStartTracking={handleStartTracking}
                  isTrackingActive={isTrackingActive}
                  booking={multiGroupBookings?.[0]} // Pass first booking for reference
                />
              </div>
            )}

            {/* Booking Menu (when has pickup) */}
            {pickupLocation && (
              <RiderMultiBookingMenu
                riderProfile={riderProfile}
                riderZones={riderZones}
                currentStep={currentStep}
                totalCalculations={totalCalculations}
                deliveryItems={deliveryItems}
                isBooking={isBooking || isUpdatingBookings} // Handle both states
                bookingComplete={bookingComplete}
                bookingReference={bookingReference}
                onBooking={handleMultiBooking}
                onReset={resetBooking}
                setCurrentStep={setCurrentStep}
                isOpen={isOpenBookingMenu}
                setIsOpen={setIsOpenBookingMenu}
                handleStartPinDrop={handleStartPinDrop}
                handleEditLocations={handleEditLocations}
                isTrackingActive={isTrackingActive}
                onStartTracking={handleStartTracking}
                onStopTracking={handleStopTracking}
                isLoadingRoute={isLoadingRoute}
                bookId={bookId}
                orderData={orderData?.getOrderDetails}
                isOrder={isOrder}
                vendorData={vendorData}
                onOrder={handleOrderUpdateWithLocation}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
