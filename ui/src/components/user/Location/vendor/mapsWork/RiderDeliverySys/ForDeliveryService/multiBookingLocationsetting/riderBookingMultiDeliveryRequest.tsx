"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router";
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
  dropoffLocation: [number, number]; // [lat, lng] for UI
  notes: string;
  calculated?: {
    distance: number;
    duration: string;
    price: number;
  };
}

type BookingStep = "locations" | "review" | "complete";



// ==========================================
// HOOKS IMPORTS
// ==========================================

import {
  useRiderZones,
  useSimpleMapManagerWithCenteredPinDrop,
  useRouteTracking,
  RouteInfoPanel,
  type Location,
  useMultiDeliveryCalculation,
  useMultiGroupBookingManagement,
  convertBookingsToDeliveryItems,
  convertDeliveryItemsToUpdateInputs, // KEY HOOK!
} from "../riderBookingHooks";

import {
  useEnhancedPinDrop,
  PinDropDialog,
  EnhancedPinDropControlPanel,
} from "../books/pinDropHook";

// ==========================================
// COMPONENT IMPORTS
// ==========================================

import { MultiLocationInputDialog } from "./MultiLocationInputDialog";
import { MapAndMultiBooking } from "./MapAndMultiBooking";
import { RiderMultiBookingMenu } from "./RiderMultiBookingMenu";

// ==========================================
// CONSTANTS
// ==========================================

const libraries: Libraries = ["places"];

// ==========================================
// MAIN COMPONENT
// ==========================================

export function RiderBookingMultiDeliveryRequest() {
  // ==========================================
  // 1. ROUTER & ENV SETUP
  // ==========================================
  const { riderId, bookId } = useParams<{ riderId: string; bookId: string }>();
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // ==========================================
  // 2. REFS
  // ==========================================
  const mapRef = useRef<HTMLDivElement | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

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
  const [isOpenBookingMenu, setIsOpenBookingMenu] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [showRouteDialog, setShowRouteDialog] = useState(false);

  // ==========================================
  // 4. GOOGLE MAPS API
  // ==========================================
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries,
  });

  // ==========================================
  // 5. MULTI-GROUP BOOKING MANAGEMENT (KEY HOOK!)
  // ==========================================
  const {
    multiGroupBookings,           // Existing bookings from backend
    isLoadingBookings,           // Loading state
    bookingsError,               // Error state
    updateBookingsWithLocations, // Function to update bookings
    isUpdatingBookings,          // Update loading state
    refetchBookings,             // Refetch function
  } = useMultiGroupBookingManagement(bookId);

  // ==========================================
  // 6. RIDER DATA
  // ==========================================
  const {
    riderZones,
    riderProfile,
    isLoading: zonesLoading,
    error: zonesError,
  } = useRiderZones(riderId);
  console.log("riderZones",riderZones);
  

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
  // 8. MAP MANAGEMENT
  // ==========================================
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
  // 11. LOAD EXISTING BOOKINGS EFFECT
  // ==========================================
  useEffect(() => {
    if (multiGroupBookings.length > 0 && !hasLoadedFromBookings) {
      console.log("📦 Loading existing bookings:", multiGroupBookings);
      
      // Convert backend bookings to UI format
      const firstBooking = multiGroupBookings[0];
      
      // Set pickup location from first booking
      if (firstBooking.pickupLocation && firstBooking.pickupLocation.length >= 2) {
        const pickup: Location = {
          lng: firstBooking.pickupLocation[0], // Backend uses lng,lat
          lat: firstBooking.pickupLocation[1],
          address: firstBooking.pickupAddress || "Pickup Location (Zone Center)"
        };
        setPickupLocation(pickup);
        console.log("🏠 Set pickup location:", pickup);
      }

      // Convert all bookings to delivery items
      const items = convertBookingsToDeliveryItems(multiGroupBookings);
      setDeliveryItems(items);
      setHasLoadedFromBookings(true);
      setDialogHasBeenCompleted(true);

      toast.success(`Loaded ${items.length} existing deliveries`, {
        description: "Edit locations or proceed with current setup"
      });
    }
  }, [multiGroupBookings, hasLoadedFromBookings]);

  // ==========================================
  // 12. GOOGLE PLACES INITIALIZATION EFFECT
  // ==========================================
  useEffect(() => {
    if (!isLoaded) return;

    console.log("🔧 Initializing Google Places services...");
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    const serviceDiv = document.createElement("div");
    const dummyMap = new google.maps.Map(serviceDiv);
    placesServiceRef.current = new google.maps.places.PlacesService(dummyMap);

    console.log("✅ Google Places services initialized");
  }, [isLoaded]);

  // ==========================================
  // 13. MAP INITIALIZATION EFFECT
  // ==========================================
  useEffect(() => {
    if (!mapRef.current || !pickupLocation || mapInitialized || !dialogHasBeenCompleted) {
      return;
    }

    console.log("🗺️ Pickup location set - initializing map:", pickupLocation.address);

    const timer = setTimeout(() => {
      initializeMapWithPickup(mapRef.current!, pickupLocation, maptilerApiKey);
    }, 200);

    return () => clearTimeout(timer);
  }, [pickupLocation, mapInitialized, initializeMapWithPickup, maptilerApiKey, dialogHasBeenCompleted]);

  // ==========================================
  // 14. CALCULATION EFFECT
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

    // Auto-calculate pricing for all valid delivery items
    const validItems = deliveryItems.filter(item => 
      item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
    );

    if (validItems.length === 0) {
      return;
    }

    console.log("💰 Auto-calculating multi-delivery pricing for", validItems.length, "items");
    calculateMultiDeliveryPricing(pickupLocation, validItems, riderZones);
  }, [
    pickupLocation?.lat,
    pickupLocation?.lng,
    deliveryItems.length,
    riderZones.length,
    isCalculating,
    dialogHasBeenCompleted,
    calculateMultiDeliveryPricing,
  ]);

  // ==========================================
  // 15. STEP PROGRESSION EFFECT
  // ==========================================
  useEffect(() => {
    if (totalCalculations && currentStep === "locations") {
      setCurrentStep("review");
    }
  }, [totalCalculations, currentStep]);

  // ==========================================
  // ROUTE PANEL MANAGEMENT
  // ==========================================

  const handleCloseRoutePanel = useCallback(() => {
    console.log("🔴 Closing route panel");
    setShowRoutePanel(false);
  }, []);

  useEffect(() => {
    console.log("🔍 Route tracking state changed:", { 
      isTrackingActive, 
      hasRouteData: !!routeData, 
      showRoutePanel 
    });

    if (isTrackingActive && routeData) {
      if (!showRoutePanel) {
        console.log("✅ Showing route panel");
        setShowRoutePanel(true);
      }
    } else if (!isTrackingActive && showRoutePanel) {
      console.log("❌ Hiding route panel - tracking stopped");
      setShowRoutePanel(false);
    }
  }, [isTrackingActive, routeData, showRoutePanel]);

  useEffect(() => {
    return () => {
      console.log("🔧 Component cleanup - closing route panel");
      setShowRoutePanel(false);
    };
  }, []);

  // ==========================================
  // 16. EVENT HANDLERS
  // ==========================================

  const handleLocationsComplete = useCallback((pickup: Location, items: MultiDeliveryItem[]) => {
    setPickupLocation(pickup);
    setDeliveryItems(items);
    setCurrentStep("locations");
    clearCalculations();
    setDialogHasBeenCompleted(true);

    // Reset tracking if active
    if (isTrackingActive) {
      stopTracking();
    }

    toast.success("Multi-delivery locations updated!", {
      description: `Pickup + ${items.length} delivery destinations`,
    });
  }, [clearCalculations, isTrackingActive, stopTracking]);

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
  // MULTI-BOOKING HANDLER
  // ==========================================
  
  const handleMultiBooking = useCallback(async () => {
    if (!totalCalculations || !pickupLocation || !deliveryItems.length || !riderId || !bookId) {
      toast.error("Missing required multi-delivery booking information");
      return;
    }

    setIsBooking(true);

    try {
      console.log("📦 Updating existing multi-delivery bookings...");

      // Convert delivery items to update inputs
      const updateInputs = convertDeliveryItemsToUpdateInputs(
        deliveryItems,
        pickupLocation,
        riderId
      );

      console.log("📝 Update inputs prepared:", updateInputs);

      // Update existing bookings with location data
      const updatedBookings = await updateBookingsWithLocations(updateInputs);

      console.log("✅ Bookings updated successfully:", updatedBookings);

      setBookingReference(bookId);
      setBookingComplete(true);
      setCurrentStep("complete");

      toast.success("Multi-delivery bookings updated!", {
        description: `${deliveryItems.length} deliveries • Total: ${totalCalculations.totalPrice.toFixed(2)}`,
        duration: 5000,
      });
    } catch (error: unknown) {
      console.error("❌ Multi-delivery booking update failed:", error);
      toast.error("Failed to update multi-delivery bookings. Please try again.", { 
        duration: 5000 
      });
    } finally {
      setIsBooking(false);
    }
  }, [totalCalculations, pickupLocation, deliveryItems, riderId, bookId, updateBookingsWithLocations]);

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
  // 17. OTHER HANDLERS (pin drop, tracking, etc.)
  // ==========================================

  const handleStartPinDrop = useCallback(() => {
    startPinDropMode();
  }, [startPinDropMode]);

  const handlePinDropChoice = useCallback((mode: "pickup" | "dropoff") => {
    handleDialogChoice(mode);
  }, [handleDialogChoice]);

  const handlePinDropConfirm = useCallback(() => {
    const result = confirmPinLocation();
    if (!result) return;

    const { location, mode } = result;

    if (mode === "pickup") {
      setPickupLocation(location);
      toast.success("Pickup location updated!", {
        description: "Zone center moved to pin location",
      });
    } else {
      toast.info("Multi-delivery pin drop needs item selection");
    }

    clearCalculations();
  }, [confirmPinLocation, clearCalculations]);

  const handlePinDropCancel = useCallback(() => {
    cancelPinDrop();
  }, [cancelPinDrop]);

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

    if (pickupLocation && deliveryItems.length > 0) {
      setTimeout(() => {
        if (riderZones.length > 0) {
          drawCoverageZones(pickupLocation, riderZones);
        }
        fitMapToMarkers();
      }, 500);
    }
  }, [stopTracking, pickupLocation, deliveryItems, riderZones, drawCoverageZones, fitMapToMarkers]);

  // ==========================================
  // 18. LOADING STATE
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
              : "Setting up delivery zones..."
            }
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 19. ERROR STATE
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
  // WELCOME MESSAGE COMPONENT
  // ==========================================
  const WelcomeMessage = () => (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        {hasLoadedFromBookings ? "Update Multi-Delivery Locations" : "Multi-Delivery Booking"}
      </h2>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {hasLoadedFromBookings 
          ? "Edit your existing multi-delivery booking locations and update the details."
          : "Set one pickup location and multiple delivery destinations. Perfect for multiple orders or packages going to different addresses."
        }
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={() => setShowLocationDialog(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {hasLoadedFromBookings ? "Edit Multi-Delivery" : "Setup Multi-Delivery"}
        </button>
      </div>
    </div>
  );

  // ==========================================
  // 20. MAIN RENDER
  // ==========================================
  return (
    <div className="py-6 font-sans w-full min-h-screen">
      <div className="max-w-4xl h-full mx-auto space-y-6">
        
        {/* Multi-Location Input Dialog */}
        <MultiLocationInputDialog
          isOpen={showLocationDialog}
          onClose={handleDialogClose}
          onComplete={handleLocationsComplete}
          initialPickup={pickupLocation}
          initialDeliveryItems={deliveryItems}
          autocompleteServiceRef={autocompleteServiceRef}
          placesServiceRef={placesServiceRef}
          isLoaded={isLoaded}
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
            {!pickupLocation && !deliveryItems.length && !showLocationDialog && !hasLoadedFromBookings && (
              <WelcomeMessage />
            )}

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
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}