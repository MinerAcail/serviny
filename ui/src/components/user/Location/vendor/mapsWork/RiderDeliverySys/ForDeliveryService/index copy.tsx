// ==========================================
// Fixed Main Component with Complete Payment Integration
// ==========================================

import { useState, useEffect, useRef, useCallback } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "../../map-popup.css";

import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { gql, useQuery } from "@apollo/client";
import { useAuth } from "@/middleware/context/authContext";

import { LocationInputDialog, MapAndBooking } from "./MapAndBooking";
import { RiderBookingMenu } from "./RiderBookingMenu";

import {
  useRiderZones,
  useDeliveryCalculation,
  useSimpleLocationManager,
  useSimpleMapManagerWithCenteredPinDrop,
  useRouteTracking,
  RouteInfoPanel,
  type Location,
  useBookingManagement,
} from "./riderBookingHooks";

import {
  useEnhancedPinDrop,
  PinDropDialog,
  EnhancedPinDropControlPanel,
} from "./books/pinDropHook";

// GraphQL query for user information
const GET_USER_INFOR = gql`
  query GetUserInfor($userID: String!) {
    getUserInfor(userId: $userID) {
      id
      name
      type
      number
      email
      location
      dpfile
    }
  }
`;

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];

// UPDATED: Enhanced booking input interface
interface AddBookCoordinateInput {
  bookId: string;
  deliveryAddress?: string;
  dropoffLocation?: number[];
  pickupLocation?: number[];
  rangeMetaId?: string;
  ridersId?: string;
}

export function RiderBookingDeliveryRequest() {
  const { riderId, bookId } = useParams<{ riderId: string; bookId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const userID = user?.id;

  // ==========================================
  // Environment and API Keys
  // ==========================================
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // ==========================================
  // GraphQL Queries
  // ==========================================

  // Fetch user information
  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER_INFOR, {
    variables: { userID },
    skip: !userID,
    onError: (error) => {
      console.error("❌ Failed to load user data:", error);
      toast.error("Failed to load user information");
    },
  });

  // Use the booking management hook
  const {
    booking,
    isLoadingBooking,
    bookingError,
    updateBookingWithLocation,
    isUpdatingBooking,
  } = useBookingManagement(bookId);

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
  // Dialog State
  // ==========================================
  const [showLocationDialog, setShowLocationDialog] = useState(true);
  const [dialogHasBeenCompleted, setDialogHasBeenCompleted] = useState(false);

  // ==========================================
  // Hooks
  // ==========================================

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

  // Route tracking hooks
  const {
    isTrackingActive,
    routeData,
    isLoadingRoute,
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

  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [isOpenBookingMenu, setIsOpenBookingMenu] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);

  // ==========================================
  // UPDATED: Enhanced validation function
  // ==========================================

  const validateBookingData = useCallback(() => {
    const errors: string[] = [];

    if (!bookId) errors.push("Booking ID is missing");
    if (!riderId) errors.push("Rider is not selected");
    if (!pickupLocation) errors.push("Pickup location is not set");
    if (!dropoffLocation) errors.push("Dropoff location is not set");
    if (!userData?.getUserInfor?.email) errors.push("User email is required");
    if (!calculation) errors.push("Delivery calculation is missing");

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [bookId, riderId, pickupLocation, dropoffLocation, userData, calculation]);

  // ==========================================
  // Route panel management
  // ==========================================
  const handleCloseRoutePanel = useCallback(() => {
    console.log("🔴 Closing route panel");
    setShowRoutePanel(false);
  }, []);

  useEffect(() => {
    console.log("🔍 Route tracking state changed:", {
      isTrackingActive,
      hasRouteData: !!routeData,
      showRoutePanel,
    });

    if (isTrackingActive && routeData) {
      if (!showRoutePanel) {
        console.log("✅ Showing route panel");
        setShowRoutePanel(true);
      }
    } else if (!isTrackingActive) {
      if (showRoutePanel) {
        console.log("❌ Hiding route panel - tracking stopped");
        setShowRoutePanel(false);
      }
    }
  }, [isTrackingActive, routeData, showRoutePanel]);

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

      if (booking.pickupLocation && booking.pickupLocation.length >= 2) {
        const pickup: Location = {
          lng: booking.pickupLocation[0],
          lat: booking.pickupLocation[1],
          address: "Pickup Location (from booking)",
        };
        updatePickupLocation(pickup);
      }

      if (booking.dropoffLocation && booking.dropoffLocation.length >= 2) {
        const dropoff: Location = {
          lng: booking.dropoffLocation[0],
          lat: booking.dropoffLocation[1],
          address: booking.deliveryAddress || "Drop-off Location",
        };
        updateDropoffLocation(dropoff);
      }
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

  // ==========================================
  // Map initialization and updates
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

    console.log(
      "🗺️ Pickup location set - initializing map:",
      pickupLocation.address
    );

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

  useEffect(() => {
    if (
      !mapLoaded ||
      !pickupLocation ||
      isTrackingActive ||
      !dialogHasBeenCompleted
    ) {
      return;
    }

    const pickupKey = `${pickupLocation.lat}-${pickupLocation.lng}`;
    const dropoffKey = dropoffLocation
      ? `${dropoffLocation.lat}-${dropoffLocation.lng}`
      : null;

    if (
      lastPickupRef.current === pickupKey &&
      lastDropoffRef.current === dropoffKey
    ) {
      console.log("⏭️ Skipping duplicate map update for same locations");
      return;
    }

    console.log("📍 Updating map with locations");

    lastPickupRef.current = pickupKey;
    lastDropoffRef.current = dropoffKey;

    updateMarkers(pickupLocation, dropoffLocation);

    if (riderZones.length > 0) {
      setTimeout(() => {
        drawCoverageZones(pickupLocation, riderZones);
      }, 100);
    }

    if (dropoffLocation) {
      setTimeout(() => {
        drawRoute(pickupLocation, dropoffLocation);
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
    dialogHasBeenCompleted,
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

    const calculationKey = `${pickupLocation.lat}-${pickupLocation.lng}-${dropoffLocation.lat}-${dropoffLocation.lng}-${riderZones.length}`;

    if (lastCalculationRef.current === calculationKey) {
      console.log(
        "⏭️ Skipping duplicate calculation for same locations and zones"
      );
      return;
    }

    console.log("💰 Auto-calculating delivery pricing...");
    lastCalculationRef.current = calculationKey;

    calculateDelivery(pickupLocation, dropoffLocation, riderZones);
  }, [
    pickupLocation?.lat,
    pickupLocation?.lng,
    dropoffLocation?.lat,
    dropoffLocation?.lng,
    riderZones.length,
    isCalculating,
    dialogHasBeenCompleted,
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
  // Tracking Handlers
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
      console.log("🚛 Starting delivery tracking mode");
      startTracking();
    }
  }, [bookId, isPinDropActive, cancelPinDrop, isTrackingActive, startTracking]);

  const handleStopTracking = useCallback(() => {
    console.log("⏹️ Stopping delivery tracking mode");

    stopTracking();
    setShowRoutePanel(false);

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
    clearCalculation();
    setDialogHasBeenCompleted(true);

    if (isTrackingActive) {
      stopTracking();
    }

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
    if (isTrackingActive) {
      stopTracking();
    }
    setShowLocationDialog(true);
  };

  // ==========================================
  // UPDATED: Enhanced booking handler with proper validation
  // ==========================================
  const handleBooking = useCallback(
    async (paymentRef: string = "") => {
      console.log(
        "🎯 Starting booking process with payment reference:",
        paymentRef
      );

      // UPDATED: Validate all required data before proceeding
      const validation = validateBookingData();
      if (!validation.isValid) {
        console.error("❌ Booking validation failed:", validation.errors);
        toast.error("Missing required information", {
          description: validation.errors.join(", "),
          duration: 5000,
        });
        throw new Error(
          "Missing required information: " + validation.errors.join(", ")
        );
      }

      setIsBooking(true);

      try {
        console.log("📦 Creating booking with validated data:", {
          bookId,
          riderId,
          paymentReference: paymentRef,
          amount: calculation?.totalPrice,
          hasPayment: !!paymentRef,
          hasPickup: !!pickupLocation,
          hasDropoff: !!dropoffLocation,
          hasUser: !!userData?.getUserInfor,
        });

        const input: AddBookCoordinateInput = {
          bookId: bookId!,
          deliveryAddress: dropoffLocation!.address,
          dropoffLocation: [dropoffLocation!.lng, dropoffLocation!.lat],
          pickupLocation: [pickupLocation!.lng, pickupLocation!.lat],
          ridersId: riderId!,

          // Add range metadata if available
          ...(calculation?.matchedZone?.id && {
            rangeMetaId: calculation.matchedZone.id,
          }),
        };

        console.log("📦 Final booking input:", input);

        const updatedBooking = await updateBookingWithLocation(input);

        console.log("✅ Booking completed successfully:", updatedBooking);

        // UPDATED: Set both booking and payment references
        setBookingReference(updatedBooking.id);
        setPaymentReference(paymentRef || null);
        setBookingComplete(true);
        setCurrentStep("complete");

        // Don't show toast here - let the EnhancedReviewStep handle success messages
        console.log("🎉 Booking flow completed successfully");
      } catch (error: unknown) {
        console.error("❌ Booking failed:", error);

        // Re-throw the error with enhanced error information
        let errorMessage = "Failed to complete booking. Please try again.";

        if (
          typeof error === "object" &&
          error !== null &&
          "graphQLErrors" in error &&
          Array.isArray((error as { graphQLErrors?: unknown }).graphQLErrors) &&
          (error as { graphQLErrors: unknown[] }).graphQLErrors.length > 0
        ) {
          errorMessage = (error as { graphQLErrors: { message: string }[] })
            .graphQLErrors[0].message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "networkError" in error
        ) {
          errorMessage = "Network error - please check your connection";
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Create a proper error object to throw
        interface EnhancedError extends Error {
          originalError?: unknown;
          paymentReference?: string;
        }
        const enhancedError: EnhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        enhancedError.paymentReference = paymentRef;

        throw enhancedError;
      } finally {
        setIsBooking(false);
      }
    },
    [
      validateBookingData,
      bookId,
      riderId,
      dropoffLocation,
      pickupLocation,
      calculation,
      userData,
      updateBookingWithLocation,
    ]
  );

  // Navigation handler for viewing bookings
  const handleViewBookings = useCallback(() => {
    navigate("/vob");
  }, [navigate]);

  const resetBooking = useCallback(() => {
    clearAllLocations();
    clearCalculation();
    clearMap();
    setCurrentStep("locations");
    setBookingComplete(false);
    setBookingReference(null);
    setPaymentReference(null); // UPDATED: Reset payment reference
    setShowLocationDialog(true);
    setDialogHasBeenCompleted(false);

    if (isTrackingActive) {
      stopTracking();
    }

    lastPickupRef.current = null;
    lastDropoffRef.current = null;
    lastCalculationRef.current = null;

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
  // UPDATED: Enhanced loading state with user data
  // ==========================================
  if (!isLoaded || zonesLoading || isLoadingBooking || userLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading booking information...</p>
          <p className="text-xs text-gray-400 mt-2">
            Setting up delivery zones and user profile...
          </p>
        </div>
      </div>
    );
  }

  // UPDATED: Enhanced error state with specific error messages
  if (zonesError || bookingError || userError) {
    const errorMessage =
      zonesError ||
      bookingError ||
      userError?.message ||
      "Unknown error occurred";

    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Failed
          </h2>
          <p className="text-gray-700 mb-4 max-w-md">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <br />
            <button
              onClick={() => navigate("/vob")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              View Bookings
            </button>
          </div>
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
        {/* Location Input Dialog */}
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

            {/* Welcome Message */}
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
                  mapRef={mapRef}
                  mapInstance={mapInstance}
                  mapLoaded={mapLoaded}
                  pickupLocation={pickupLocation}
                  dropoffLocation={dropoffLocation}
                  calculation={calculation}
                  isCalculating={isCalculating}
                  isOpenBookingMenu={isOpenBookingMenu}
                  showZones={showZones && !isTrackingActive}
                  onToggleZones={() => setShowZones(!showZones)}
                  isPinDropActive={isPinDropActive}
                  pinDropMode={pinDropMode}
                  onStartPinDrop={handleStartPinDrop}
                  hasPickup={!!pickupLocation}
                  hasDropoff={!!dropoffLocation}
                  loading={zonesLoading}
                  error={zonesError || calculationError}
                  riderZones={riderZones}
                  showRouteDialog={showRouteDialog}
                  setShowRouteDialog={setShowRouteDialog}
                />

                {/* Route Information Panel */}
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

            {/* UPDATED: Enhanced Booking Menu with Complete Payment Integration */}
            {pickupLocation && (
              <RiderBookingMenu
                riderProfile={riderProfile}
                riderZones={riderZones}
                currentStep={currentStep}
                calculation={calculation}
                isBooking={isBooking || isUpdatingBooking}
                bookingComplete={bookingComplete}
                bookingReference={bookingReference}
                paymentReference={paymentReference} // NEW: Pass payment reference
                onBooking={handleBooking} // Enhanced with validation
                onReset={resetBooking}
                onViewBookings={handleViewBookings} // NEW: Navigation handler
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
                // UPDATED: Enhanced user profile data
                userProfile={
                  userData?.getUserInfor
                    ? {
                        id: userData.getUserInfor.id,
                        email: userData.getUserInfor.email,
                        name: userData.getUserInfor.name,
                        number: userData.getUserInfor.number,
                        type: userData.getUserInfor.type,
                        location: userData.getUserInfor.location,
                        dpfile: userData.getUserInfor.dpfile,
                      }
                    : undefined
                }
                pickupLocation={pickupLocation}
                dropoffLocation={dropoffLocation}
                riderId={riderId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
