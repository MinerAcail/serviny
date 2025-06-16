// ==========================================
// Updated Main Component with Route Tracking
// ==========================================

import { useState, useEffect, useRef, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "../../map-popup.css";

import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import { useParams } from "react-router";
import { toast } from "sonner";

import { LocationInputDialog, MapAndBooking } from "./MapAndBooking";
import { RiderBookingMenu } from "./RiderBookingMenu";
import {
  useRiderZones,
  useDeliveryCalculation,
  useSimpleLocationManager,
  useSimpleMapManagerWithCenteredPinDrop,
  useRouteTracking,
  // useMapRouteDisplay,
  RouteInfoPanel,
  
  // CompleteStepWithTracking,
  type Location,
  useBookingManagement,
} from "./riderBookingHooks";

import {
  useEnhancedPinDrop,
  PinDropDialog,
  EnhancedPinDropControlPanel,
  // EnhancedPinDropButton,
} from "./books/pinDropHook";

// Import new tracking components

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];

// Type for the booking input
interface AddBookCoordinateInput {
  bookId: string;
  deliveryAddress?: string;
  dropoffLocation?: number[]; // [lng, lat]
  pickupLocation?: number[]; // [lng, lat]
  rangeMetaId?: string;
  ridersId?: string;
}

export function RiderBookingDeliveryRequest() {
  const { riderId, bookId } = useParams<{ riderId: string; bookId: string }>();

  // ==========================================
  // Environment and API Keys
  // ==========================================
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // ==========================================
  // Refs
  // ==========================================
  const mapRef = useRef<HTMLDivElement | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const lastPickupRef = useRef<string | null>(null);
  const lastDropoffRef = useRef<string | null>(null);
  const lastCalculationRef = useRef<string | null>(null);

  // ==========================================
  // Dialog State - Start with dialog open
  // ==========================================
  const [showLocationDialog, setShowLocationDialog] = useState(true);
  const [dialogHasBeenCompleted, setDialogHasBeenCompleted] = useState(false);

  // ==========================================
  // Hooks
  // ==========================================

  // Use the booking management hook
  const {
    booking,
    isLoadingBooking,
    bookingError,
    updateBookingWithLocation,
    isUpdatingBooking,
    // refetchBooking,
  } = useBookingManagement(bookId);

  // Fetch rider data and zones
  const {
    riderZones,
    riderProfile,
    isLoading: zonesLoading,
    error: zonesError,
  } = useRiderZones(riderId);

  // Simple location state management
  const {
    pickupLocation,
    dropoffLocation,
    updatePickupLocation,
    updateDropoffLocation,
    clearAllLocations,
  } = useSimpleLocationManager();

  // Delivery calculation
  const {
    calculation,
    isCalculating,
    error: calculationError,
    calculateDelivery,
    clearCalculation,
  } = useDeliveryCalculation();

  // Map manager with pin drop support
  const {
    mapInstance,
    mapLoaded,
    mapInitialized,
    initializeMapWithPickup,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
    clearMap,
  } = useSimpleMapManagerWithCenteredPinDrop();

  // Enhanced Pin Drop Hook
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

  // NEW: Route tracking hooks
  const {
    isTrackingActive,
    routeData,
    isLoadingRoute,
    // routeError,
    startTracking,
    stopTracking,
  } = useRouteTracking(bookId);

  // Google Places API
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries,
  });

  // ==========================================
  // State Management
  // ==========================================

  const [currentStep, setCurrentStep] = useState<
    "locations" | "review" | "complete"
  >("locations");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [isOpenBookingMenu, setIsOpenBookingMenu] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);

  const handleCloseRoutePanel = useCallback(() => {
    console.log("🔴 Closing route panel");
    setShowRoutePanel(false);
  }, []);

  // Fix the useEffect that manages panel visibility
  useEffect(() => {
    console.log("🔍 Route tracking state changed:", { 
      isTrackingActive, 
      hasRouteData: !!routeData, 
      showRoutePanel 
    });

    if (isTrackingActive && routeData) {
      // Only show panel if not already shown
      if (!showRoutePanel) {
        console.log("✅ Showing route panel");
        setShowRoutePanel(true);
      }
    } else if (!isTrackingActive) {
      // Always hide panel when tracking stops
      if (showRoutePanel) {
        console.log("❌ Hiding route panel - tracking stopped");
        setShowRoutePanel(false);
      }
    }
  }, [isTrackingActive, routeData, showRoutePanel]);

  // Add a separate effect to handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      console.log("🔧 Component cleanup - closing route panel");
      setShowRoutePanel(false);
    };
  }, []);

  // ==========================================
  // Load existing booking data into location state
  // ==========================================
  useEffect(() => {
    if (booking && !pickupLocation && !dropoffLocation) {
      console.log("📍 Loading existing booking locations:", booking);

      // Set pickup location if available
      if (booking.pickupLocation && booking.pickupLocation.length >= 2) {
        const pickup: Location = {
          lng: booking.pickupLocation[0],
          lat: booking.pickupLocation[1],
          address: "Pickup Location (from booking)",
        };
        updatePickupLocation(pickup);
      }

      // Set dropoff location if available
      if (booking.dropoffLocation && booking.dropoffLocation.length >= 2) {
        const dropoff: Location = {
          lng: booking.dropoffLocation[0],
          lat: booking.dropoffLocation[1],
          address: booking.deliveryAddress || "Drop-off Location",
        };
        updateDropoffLocation(dropoff);
      }

      // Even if we have existing locations, keep the dialog open on initial mount
      // User can close it if they don't want to change locations
    }
  }, [
    booking,
    pickupLocation,
    dropoffLocation,
    updatePickupLocation,
    updateDropoffLocation,
  ]);

  // ==========================================
  // Initialize Google Places services
  // ==========================================
  useEffect(() => {
    if (!isLoaded) return;

    console.log("🔧 Initializing Google Places services...");
    autocompleteServiceRef.current =
      new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    const serviceDiv = document.createElement("div");
    const dummyMap = new google.maps.Map(serviceDiv);
    placesServiceRef.current = new google.maps.places.PlacesService(dummyMap);

    console.log("✅ Google Places services initialized");
  }, [isLoaded]);

  // Initialize map when pickup is set and dialog has been completed
  useEffect(() => {
    if (!mapRef.current || !pickupLocation || mapInitialized || !dialogHasBeenCompleted) {
      return;
    }

    console.log(
      "🗺️ Pickup location set - initializing map:",
      pickupLocation.address
    );

    const timer = setTimeout(() => {
      initializeMapWithPickup(mapRef.current!, pickupLocation, maptilerApiKey);
    }, 200);

    return () => clearTimeout(timer);
  }, [pickupLocation, mapInitialized, initializeMapWithPickup, maptilerApiKey, dialogHasBeenCompleted]);

  // Update map when locations change (only if not tracking and dialog completed)
  useEffect(() => {
    if (!mapLoaded || !pickupLocation || isTrackingActive || !dialogHasBeenCompleted) {
      return;
    }

    // Create unique keys for locations to prevent duplicate operations
    const pickupKey = `${pickupLocation.lat}-${pickupLocation.lng}`;
    const dropoffKey = dropoffLocation
      ? `${dropoffLocation.lat}-${dropoffLocation.lng}`
      : null;

    // Check if we've already processed these exact locations
    if (
      lastPickupRef.current === pickupKey &&
      lastDropoffRef.current === dropoffKey
    ) {
      console.log("⏭️ Skipping duplicate map update for same locations");
      return;
    }

    console.log("📍 Updating map with locations");

    // Update our tracking refs
    lastPickupRef.current = pickupKey;
    lastDropoffRef.current = dropoffKey;

    // Update markers
    updateMarkers(pickupLocation, dropoffLocation);

    // Draw coverage zones around pickup
    if (riderZones.length > 0) {
      setTimeout(() => {
        drawCoverageZones(pickupLocation, riderZones);
      }, 100);
    }

    // Draw route if both locations exist
    if (dropoffLocation) {
      setTimeout(() => {
        drawRoute(pickupLocation, dropoffLocation);

        // Fit map to show both locations
        setTimeout(() => {
          fitMapToMarkers();
        }, 200);
      }, 300);
    }
  }, [
    mapLoaded,
    pickupLocation?.lat,
    pickupLocation?.lng,
    dropoffLocation?.lat,
    dropoffLocation?.lng,
    riderZones.length,
    isTrackingActive,
    dialogHasBeenCompleted, // NEW: Only update when dialog is completed
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
  ]);

  // Auto-calculate when both locations are set and dialog completed
  useEffect(() => {
    if (
      !pickupLocation ||
      !dropoffLocation ||
      riderZones.length === 0 ||
      isCalculating ||
      !dialogHasBeenCompleted
    ) {
      return;
    }

    // Create unique key for this calculation to prevent duplicates
    const calculationKey = `${pickupLocation.lat}-${pickupLocation.lng}-${dropoffLocation.lat}-${dropoffLocation.lng}-${riderZones.length}`;

    // Check if we've already calculated for these exact same parameters
    if (lastCalculationRef.current === calculationKey) {
      console.log(
        "⏭️ Skipping duplicate calculation for same locations and zones"
      );
      return;
    }

    console.log("💰 Auto-calculating delivery pricing...");
    lastCalculationRef.current = calculationKey;

    // Call calculateDelivery directly
    calculateDelivery(pickupLocation, dropoffLocation, riderZones);
  }, [
    pickupLocation?.lat,
    pickupLocation?.lng,
    dropoffLocation?.lat,
    dropoffLocation?.lng,
    riderZones.length,
    isCalculating,
    dialogHasBeenCompleted, // NEW: Only calculate when dialog is completed
    calculateDelivery,
  ]);

  // Update step when calculation is ready
  useEffect(() => {
    if (calculation && currentStep === "locations") {
      setCurrentStep("review");
    }
  }, [calculation, currentStep]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      lastPickupRef.current = null;
      lastDropoffRef.current = null;
      lastCalculationRef.current = null;
    };
  }, []);

  // ==========================================
  // Enhanced Pin Drop Handlers
  // ==========================================

  const handleStartPinDrop = useCallback(() => {
    startPinDropMode();
  }, [startPinDropMode]);

  const handlePinDropChoice = useCallback(
    (mode: "pickup" | "dropoff") => {
      handleDialogChoice(mode);
    },
    [handleDialogChoice]
  );

  const handlePinDropConfirm = useCallback(() => {
    const result = confirmPinLocation();
    if (!result) return;

    const { location, mode } = result;

    if (mode === "pickup") {
      updatePickupLocation(location);
      toast.success("Pickup location updated!", {
        description: "Zone center moved to pin location",
      });
    } else {
      updateDropoffLocation(location);
      toast.success("Dropoff location updated!", {
        description: "Destination moved to pin location",
      });
    }

    // Reset calculation for new locations
    clearCalculation();
    lastPickupRef.current = null;
    lastDropoffRef.current = null;
    lastCalculationRef.current = null;
  }, [
    confirmPinLocation,
    updatePickupLocation,
    updateDropoffLocation,
    clearCalculation,
  ]);

  const handlePinDropCancel = useCallback(() => {
    cancelPinDrop();
  }, [cancelPinDrop]);

  // ==========================================
  // NEW: Tracking Handlers
  // ==========================================

  const handleStartTracking = useCallback(() => {
    if (!bookId) {
      toast.error("No booking ID available for tracking");
      return;
    }

    // Stop any active pin drop mode
    if (isPinDropActive) {
      cancelPinDrop();
    }

    // Clear existing map elements
    if (!isTrackingActive) {
      console.log("🚛 Starting delivery tracking mode");
      startTracking();
    }
  }, [bookId, isPinDropActive, cancelPinDrop, isTrackingActive, startTracking]);

  const handleStopTracking = useCallback(() => {
    console.log("⏹️ Stopping delivery tracking mode");
    
    // First stop tracking
    stopTracking();
    
    // Immediately close the panel
    setShowRoutePanel(false);

    // Restore normal map view if we have locations
    if (pickupLocation && dropoffLocation) {
      setTimeout(() => {
        updateMarkers(pickupLocation, dropoffLocation);
        if (riderZones.length > 0) {
          drawCoverageZones(pickupLocation, riderZones);
        }
        drawRoute(pickupLocation, dropoffLocation);
        fitMapToMarkers();
      }, 500);
    }
  }, [
    stopTracking,
    pickupLocation,
    dropoffLocation,
    riderZones,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
  ]);

  // ==========================================
  // Event Handlers
  // ==========================================

  const handleLocationsComplete = (pickup: Location, dropoff: Location) => {
    updatePickupLocation(pickup);
    updateDropoffLocation(dropoff);
    setCurrentStep("locations");
    clearCalculation(); // Reset calculation for new locations
    setDialogHasBeenCompleted(true); // Mark dialog as completed

    // Reset tracking state
    if (isTrackingActive) {
      stopTracking();
    }

    // Reset tracking refs
    lastPickupRef.current = null;
    lastDropoffRef.current = null;
    lastCalculationRef.current = null;

    toast.success("Locations set successfully!", {
      description: "Map will show your delivery route and pricing",
    });
  };

  const handleDialogClose = () => {
    setShowLocationDialog(false);
    setDialogHasBeenCompleted(true);
  };

  const handleEditLocations = () => {
    // Stop tracking when editing locations
    if (isTrackingActive) {
      stopTracking();
    }
    setShowLocationDialog(true);
  };

  // ==========================================
  // Updated booking handler
  // ==========================================
  const handleBooking = useCallback(async () => {
    if (
      !calculation ||
      !pickupLocation ||
      !dropoffLocation ||
      !riderId ||
      !bookId
    ) {
      toast.error("Missing required booking information");
      return;
    }

    setIsBooking(true);

    try {
      const input: AddBookCoordinateInput = {
        bookId,
        deliveryAddress: dropoffLocation.address,
        dropoffLocation: [dropoffLocation.lng, dropoffLocation.lat],
        pickupLocation: [pickupLocation.lng, pickupLocation.lat],
        ridersId: riderId,
        // Add range metadata if available
        ...(calculation.matchedZone?.id && {
          rangeMetaId: calculation.matchedZone.id,
        }),
      };

      console.log("📦 Booking input:", input);

      const updatedBooking = await updateBookingWithLocation(input);

      console.log("✅ Booking updated successfully:", updatedBooking);

      // Update success state
      setBookingReference(updatedBooking.id);
      setBookingComplete(true);
      setCurrentStep("complete");

      toast.success("Booking updated successfully!", {
        description: `Distance: ${calculation.distance}km • Fee: ${calculation.totalPrice}`,
        duration: 5000,
      });
    } catch (error: unknown) {
      console.error("❌ Booking failed:", error);

      let errorMessage = "Failed to update booking. Please try again.";
      if (
        typeof error === "object" &&
        error !== null &&
        "graphQLErrors" in error &&
        Array.isArray((error as { graphQLErrors?: unknown }).graphQLErrors) &&
        (error as { graphQLErrors: unknown[] }).graphQLErrors.length > 0
      ) {
        errorMessage = (error as { graphQLErrors: { message: string }[] }).graphQLErrors[0].message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "networkError" in error
      ) {
        errorMessage = "Network error - please check your connection";
      }

      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsBooking(false);
    }
  }, [
    calculation,
    pickupLocation,
    dropoffLocation,
    riderId,
    bookId,
    updateBookingWithLocation,
  ]);

  const resetBooking = useCallback(() => {
    clearAllLocations();
    clearCalculation();
    clearMap();
    setCurrentStep("locations");
    setBookingComplete(false);
    setBookingReference(null);
    setShowLocationDialog(true);
    setDialogHasBeenCompleted(false); // Reset dialog completion state

    // Stop tracking
    if (isTrackingActive) {
      stopTracking();
    }

    // Reset tracking refs
    lastPickupRef.current = null;
    lastDropoffRef.current = null;
    lastCalculationRef.current = null;

    // Cancel any active pin drop
    if (isPinDropActive) {
      cancelPinDrop();
    }

    toast.info("Booking reset", {
      description: "Ready to set new pickup location",
    });
  }, [
    clearAllLocations,
    clearCalculation,
    clearMap,
    isTrackingActive,
    stopTracking,
    isPinDropActive,
    cancelPinDrop,
  ]);

  // ==========================================
  // Show loading state
  // ==========================================
  if (!isLoaded || zonesLoading || isLoadingBooking) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading booking information...</p>
          <p className="text-xs text-gray-400 mt-2">
            Setting up delivery zones...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (zonesError || bookingError) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-4">{zonesError || bookingError}</p>
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
  // Render Component
  // ==========================================
  return (
    <div className="py-6 font-sans w-full min-h-screen">
      <div className="max-w-4xl h-full mx-auto space-y-6">
        {/* Location Input Dialog - Always render, visibility controlled by showLocationDialog */}
        <LocationInputDialog
          isOpen={showLocationDialog}
          onClose={handleDialogClose}
          onComplete={handleLocationsComplete}
          initialPickup={pickupLocation}
          initialDropoff={dropoffLocation}
          autocompleteServiceRef={autocompleteServiceRef}
          placesServiceRef={placesServiceRef}
          isLoaded={isLoaded}
        />

        {/* Only render the rest of the UI when dialog has been completed */}
        {dialogHasBeenCompleted && (
          <>
            {/* Enhanced Pin Drop Dialog */}
            <PinDropDialog
              isOpen={showPinDropDialog}
              onSelectMode={handlePinDropChoice}
              onCancel={cancelDialog}
              hasPickup={!!pickupLocation}
              hasDropoff={!!dropoffLocation}
            />

            {/* Enhanced Pin Drop Control Panel */}
            <EnhancedPinDropControlPanel
              isActive={isPinDropActive}
              mode={pinDropMode}
              currentAddress={pinDropAddress}
              isLoadingAddress={isPinDropLoading}
              onCancel={handlePinDropCancel}
              onConfirm={handlePinDropConfirm}
            />

            {/* Welcome Message - Show when no locations are set and dialog is closed */}
            {!pickupLocation && !dropoffLocation && !showLocationDialog && (
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
                  {booking
                    ? "Update Delivery Locations"
                    : "Welcome to Delivery Booking"}
                </h2>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {booking
                    ? "Set or update your pickup and delivery locations for this booking."
                    : "Set your pickup and delivery locations by searching addresses or dropping pins directly on the map."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={() => setShowLocationDialog(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    {booking ? "Update Locations" : "Search Locations"}
                  </button>
                </div>
              </div>
            )}

            {/* Map and Booking Interface */}
            {pickupLocation && (
              <div className="relative">
                <MapAndBooking
                  // Map refs
                  mapRef={mapRef}
                  mapInstance={mapInstance}
                  mapLoaded={mapLoaded}
                  // Location state
                  pickupLocation={pickupLocation}
                  dropoffLocation={dropoffLocation}
                  // Calculation state
                  calculation={calculation}
                  isCalculating={isCalculating}
                  // UI state
                  isOpenBookingMenu={isOpenBookingMenu}
                  showZones={showZones && !isTrackingActive} // Hide zones when tracking
                  onToggleZones={() => setShowZones(!showZones)}
                  // Pin drop state
                  isPinDropActive={isPinDropActive}
                  pinDropMode={pinDropMode}
                  onStartPinDrop={handleStartPinDrop}
                  hasPickup={!!pickupLocation}
                  hasDropoff={!!dropoffLocation}
                  // Loading and errors
                  loading={zonesLoading}
                  error={zonesError || calculationError}
                  riderZones={riderZones}
                  showRouteDialog={showRouteDialog}
                  setShowRouteDialog={setShowRouteDialog}
                />

                {/* NEW: Route Information Panel */}
                <RouteInfoPanel
                  routeData={routeData}
                  isVisible={showRoutePanel && isTrackingActive && !!routeData}
                  onClose={handleCloseRoutePanel}
                  showRouteDialog={showRouteDialog}
                  setShowRouteDialog={setShowRouteDialog}
                  isLoadingRoute={isLoadingRoute}
                  handleStartTracking={handleStartTracking}
                  isTrackingActive={isTrackingActive}
                  booking={booking}
                />
              </div>
            )}

            {/* Booking Menu with Updated Complete Step */}
            {pickupLocation && (
              <RiderBookingMenu
                // Rider data
                riderProfile={riderProfile}
                riderZones={riderZones}
                // Booking flow
                currentStep={currentStep}
                calculation={calculation}
                isBooking={isBooking || isUpdatingBooking}
                bookingComplete={bookingComplete}
                bookingReference={bookingReference}
                // Handlers
                onBooking={handleBooking}
                onReset={resetBooking}
                setCurrentStep={setCurrentStep}
                // UI state
                isOpen={isOpenBookingMenu}
                setIsOpen={setIsOpenBookingMenu}
                handleStartPinDrop={handleStartPinDrop}
                handleEditLocations={handleEditLocations}
                // NEW: Pass tracking handlers and state
                isTrackingActive={isTrackingActive}
                onStartTracking={handleStartTracking}
                onStopTracking={handleStopTracking}
                isLoadingRoute={isLoadingRoute}
                bookId={bookId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}