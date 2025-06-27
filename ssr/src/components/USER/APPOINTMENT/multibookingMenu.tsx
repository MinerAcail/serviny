
import { useRef, useEffect, useState, useCallback } from "react";
import {
  X,
  CheckCircle,
  Package,
  Star,
  Loader2,
  Pin,
  Search,
  Route,
  StopCircle,
  Truck,
  FileText,
  MapPin,
  Plus,
  Phone,
  Navigation,
  MessageSquare,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import maplibregl from "maplibre-gl";
import { circle,  difference} from "@turf/turf";

import { ZONE_COLORS } from "@/components/GLOBAL/format";
import type {  PricingZone, RiderProfile } from "./BookingHooks";
import PaymentModal, { type PaymentResult } from "./payment-modal";
import type { Location } from "./pinDropHook";
import { useAuth } from "@/middleware/context/authContext";
import { useCargoData, getCargoTypeLabel, useCargoParams } from "./CARGO/cargoDataQuery";
import type { MultiDeliveryItem } from "./multiDeliveryRequest";
import { MultiStepNavigation } from "./muiltHook/multiStepNavigation";
import { Separator } from "@/components/ui/separator";
// import { Navigation } from "@/middleware/navigation";
// import { ZONE_COLORS } from "@/components/config/map";
export interface totalCalculations {
    totalDistance: number;
    totalPrice: number;
    averageDuration: string;
    itemCalculations: Array<{
      id: string;
      distance: number;
      duration: string;
      price: number;
    }>;
  } 
interface RiderMultiBookingMenuProps {
  // Rider data
  riderProfile: RiderProfile;
  riderZones: PricingZone[];

  // Multi-delivery booking flow
  currentStep: "locations" | "review" | "complete";
  totalCalculations: totalCalculations | null;
  deliveryItems: MultiDeliveryItem[];
  isBooking: boolean;
  bookingComplete: boolean;
  bookingReference: string | null;

  // Handlers
  onBooking: () => void;
  onReset: () => void;
  setCurrentStep: (step: "locations" | "review" | "complete") => void;

  // UI state
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  handleEditLocations: () => void;
  handleStartPinDrop: () => void;

  // Tracking props
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  isLoadingRoute?: boolean;
  bookId?: string;
}

export function RiderMultiBookingMenu({
  riderProfile,
  riderZones,
  currentStep,
  totalCalculations,
  deliveryItems,
  isBooking,
  bookingComplete,
  bookingReference,
  onBooking,
  onReset,
  setCurrentStep,
  isOpen,
  setIsOpen,
  handleEditLocations,
  handleStartPinDrop,
  isTrackingActive = false,
  onStartTracking,
  onStopTracking,
  isLoadingRoute = false,
  bookId,
}: RiderMultiBookingMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Get cargo parameters from URL
  const { isCargo, cargoType: urlCargoType, splitCargo } = useCargoParams();
  
  // Fetch actual cargo data from database
  const { 
    // cargoData, 
    isLoading: cargoLoading, 
    error: cargoError,
    primaryTransportType,
    allTransportTypes,
    hasMultipleVehicleTypes,
    // totalCargoCount 
  } = useCargoData(bookId);
  
  // Use database cargo type if available, otherwise fall back to URL parameter
  const actualCargoType = primaryTransportType || urlCargoType;
  console.log("Actual Cargo Type:", actualCargoType);
  
  // Payment modal state - but don't show for cargo
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  // Reset payment state when step changes
  useEffect(() => {
    if (currentStep !== "review") {
      setPaymentCompleted(false);
    }
  }, [currentStep]);

  // Helper functions
  const getCargoTypeLabelForDisplay = (type: string): string => {
    return getCargoTypeLabel(type);
  };

  const getStepTitle = () => {
    if (isCargo) {
      switch (currentStep) {
        case "locations":
          return "Setup Cargo Delivery";
        case "review":
          return "Review Cargo Delivery";
        case "complete":
          return "Cargo Delivery Complete";
        default:
          return "Cargo Delivery Booking";
      }
    } else {
      switch (currentStep) {
        case "locations":
          return "Setup Multi-Delivery";
        case "review":
          return "Review Multi-Delivery";
        case "complete":
          return "Multi-Delivery Complete";
        default:
          return "Multi-Delivery Booking";
      }
    }
  };

  const getButtonText = () => {
    if (!riderProfile) return "Select Area";
    if (currentStep === "locations") return isCargo ? "Setup Cargo" : "Setup Deliveries";
    if (currentStep === "review") return "Continue";
    if (currentStep === "complete") return "Booking Complete";
    return isCargo ? "Book Cargo Delivery" : "Book Multi-Delivery";
  };

  // Calculate completed items for display
  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  // Handle payment completion (for non-cargo only)
  const handlePaymentComplete = (paymentData: PaymentResult) => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    
    toast.success(`Payment successful! Method: ${paymentData.method.toUpperCase()}`, {
      description: `Amount: GH₵${paymentData.amount.toFixed(2)}`,
    });

    // Proceed with booking after payment
    setTimeout(() => {
      onBooking();
    }, 500);
  };

  // Handle confirm booking - different flow for cargo vs regular
  const handleConfirmBooking = () => {
    if (!totalCalculations) return;
    
    if (isCargo) {
      // For cargo deliveries, proceed directly without payment
      onBooking();
    } else {
      // For regular deliveries, show payment modal first
      setShowPaymentModal(true);
    }
  };

  // Create order details for payment modal (non-cargo only)
  const createOrderDetails = () => {
    if (isCargo || !totalCalculations || !riderProfile || !bookId) return null;

    const firstItem = completedItems[0];
    const description = completedItems.length === 1 
      ? `Delivery: ${firstItem?.itemDescription || 'Item'}`
      : `Multi-delivery: ${completedItems.length} destinations`;

    return {
      id: bookId,
      amount: totalCalculations.totalPrice,
      description,
      vendor: riderProfile.name || "Multi-Delivery Service",
    };
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating toggle buttons - Enhanced for cargo deliveries */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="toggle-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-6 lg:left-1/2 l transform -translate-x-1/2 z-10"
          >
            <div className="flex gap-3 bg-white/90 backdrop-blur-md px-2 py-3 rounded-full shadow-lg border border-gray-100">
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-[12px] font-medium text-gray-800"
              >
                {isCargo ? (
                  <Truck className="h-4 w-4 text-orange-600" />
                ) : (
                  <Package className="h-4 w-4 text-blue-600" />
                )}
                <span>{getButtonText()}</span>
                {/* Show item count if applicable */}
                {deliveryItems.length > 0 && (
                  <div className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isCargo 
                      ? "bg-orange-100 text-orange-800" 
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {completedItems.length}/{deliveryItems.length}
                  </div>
                )}
              </button>

              <div className="h-5 w-px bg-gray-200 mx-1" />

              {/* Tracking button */}
              {bookId && onStartTracking && onStopTracking && (
                <>
                  <button
                    onClick={isTrackingActive ? onStopTracking : onStartTracking}
                    disabled={isLoadingRoute}
                    className={`flex items-center gap-2 text-[12px] font-medium transition-colors ${
                      isTrackingActive
                        ? "text-red-600 hover:text-red-700"
                        : "text-blue-600 hover:text-blue-700"
                    }`}
                  >
                    {isLoadingRoute ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isTrackingActive ? (
                      <StopCircle className="h-4 w-4" />
                    ) : (
                      <Route className="h-4 w-4" />
                    )}
                    <span>
                      {isLoadingRoute 
                        ? "Loading..." 
                        : isTrackingActive 
                        ? "Stop" 
                        : "Track"
                      }
                    </span>
                  </button>

                  <div className="h-5 w-px bg-gray-200 mx-1" />
                </>
              )}

              <button
                onClick={() => handleStartPinDrop()}
                disabled={isTrackingActive}
                className={`flex items-center gap-2 text-[12px] font-medium ${
                  isTrackingActive 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-gray-800"
                }`}
              >
                <Pin className="h-4 w-4 text-blue-600" />
                <span>Pin</span>
              </button>

              <div className="h-5 w-px bg-gray-200 mx-1" />

              <button
                onClick={() => handleEditLocations()}
                disabled={isTrackingActive}
                className={`flex items-center gap-2 text-[12px] font-medium ${
                  isTrackingActive 
                    ? "text-gray-400 cursor-not-allowed" 
                    : "text-gray-800"
                }`}
              >
                <Search className="h-4 w-4 text-blue-600" />
                <span>Edit</span>
              </button>

              {/* Price indicator - only for non-cargo */}
              {!isCargo && totalCalculations && (
                <>
                  <div className="h-5 w-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1 text-[12px] font-medium text-green-700">
                    <span>GH₵{totalCalculations.totalPrice.toFixed(0)}</span>
                  </div>
                </>
              )}

          

              {/* Show loading state for cargo data */}
              {isCargo && cargoLoading && !actualCargoType && (
                <>
                  <div className="h-5 w-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1 text-[12px] font-medium text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in drawer */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="booking-drawer"
            ref={drawerRef}
            initial={{ x: 0, y: 100, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            exit={{ x: 0, y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute right-[-10px] transform -translate-x-1/2 bottom-4 sm:left-4 sm:transform-none sm:translate-x-0 z-20 w-[380px] max-w-[90vw] h-[85vh] flex flex-col rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border-0 ring-1 ring-black/5"
          >
            <div className="flex flex-col h-full min-h-0">
              {/* Enhanced Header with cargo info */}
              <div className={`flex items-center justify-between p-4 border-b border-gray-100 ${
                isCargo 
                  ? "bg-gradient-to-r from-orange-50 to-amber-50" 
                  : "bg-gradient-to-r from-blue-50 to-indigo-50"
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCargo 
                      ? "bg-orange-100" 
                      : "bg-blue-100"
                  }`}>
                    {isCargo ? (
                      <Truck className="h-4 w-4 text-orange-600" />
                    ) : (
                      <Package className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getStepTitle()}
                    </h2>
                    {deliveryItems.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {completedItems.length}/{deliveryItems.length} destinations ready
                        {isCargo && actualCargoType && ` • ${getCargoTypeLabelForDisplay(actualCargoType)}`}
                        {isCargo && hasMultipleVehicleTypes && ` • ${allTransportTypes.length} vehicle types`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isTrackingActive && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Tracking
                    </Badge>
                  )}
                  {/* Cargo delivery indicator */}
                  {isCargo && (
                    <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
                      <Truck className="w-3 h-3 mr-1" />
                      Cargo
                    </Badge>
                  )}
                  {/* Payment status indicator (non-cargo only) */}
                  {!isCargo && paymentCompleted && currentStep === "review" && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content area with scrolling */}
              <div
                className="flex-1 overflow-y-auto p-4 min-h-0"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#d1d5db #f3f4f6",
                }}
              >
                {/* Rider Profile Section - Always visible */}
                {riderProfile && (
                  <div className="mb-6">
                    <RiderProfileCard riderProfile={riderProfile} isCargo={isCargo} />
                  </div>
                )}

                {/* Step content with AnimatePresence */}
                <div className="pb-4">
                  <AnimatePresence mode="wait">
                    {currentStep === "locations" && (
                      <motion.div
                        key="step-locations"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MultiLocationStep isCargo={isCargo} cargoType={actualCargoType} />
                      </motion.div>
                    )}

                    {currentStep === "review" && (
                      <motion.div
                        key="step-review"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MultiReviewStep
                          totalCalculations={totalCalculations}
                          deliveryItems={deliveryItems}
                          isBooking={isBooking}
                          onBooking={handleConfirmBooking}
                          onBack={() => setCurrentStep("locations")}
                          paymentCompleted={paymentCompleted}
                          isCargo={isCargo}
                          cargoType={actualCargoType}
                          // splitCargo={splitCargo}
                          userPhone={user?.number || ""}
                          cargoLoading={cargoLoading}
                          hasMultipleVehicleTypes={hasMultipleVehicleTypes}
                          allTransportTypes={allTransportTypes}
                        />
                      </motion.div>
                    )}

                    {currentStep === "complete" && (
                      <motion.div
                        key="step-complete"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MultiCompleteStep
                          bookingReference={bookingReference}
                          totalCalculations={totalCalculations}
                          deliveryItems={deliveryItems}
                          riderProfile={riderProfile}
                          onReset={onReset}
                          bookId={bookId}
                          isTrackingActive={isTrackingActive}
                          onStartTracking={onStartTracking}
                          onStopTracking={onStopTracking}
                          isLoadingRoute={isLoadingRoute}
                          isCargo={isCargo}
                          cargoType={actualCargoType}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pricing Zones - Only for non-cargo */}
                {!isCargo && riderZones.length > 0 && (
                  <div className="mb-6">
                    <PricingZonesCard zones={riderZones} />
                  </div>
                )}

                {/* Cargo Information Card - Only for cargo */}
                {isCargo && (
                  <div className="mb-6">
                    <CargoInformationCard 
                      cargoType={actualCargoType} 
                      splitCargo={splitCargo} 
                      cargoLoading={cargoLoading}
                      hasMultipleVehicleTypes={hasMultipleVehicleTypes}
                      allTransportTypes={allTransportTypes}
                      cargoError={cargoError}
                    />
                  </div>
                )}
              </div>

              {/* Step Navigation */}
              <div className="border-t border-gray-100 p-4 bg-white/95">
                <MultiStepNavigation
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  hasCalculations={!!totalCalculations}
                  isBookingComplete={bookingComplete}
                  isCargo={isCargo}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal for non-cargo deliveries only */}
      {!isCargo && totalCalculations && createOrderDetails() && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderDetails={createOrderDetails()!}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
export interface MultiDeliveryMarker {
  id: string;
  marker: maplibregl.Marker;
  location: Location;
  index: number;
}
export function UseMultiDeliveryMapManager() {
  // ==========================================
  // State Management
  // ==========================================
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Single markers (for compatibility)
  const [pickupMarker, setPickupMarker] = useState<maplibregl.Marker | null>(
    null
  );
  const [dropoffMarker, setDropoffMarker] = useState<maplibregl.Marker | null>(
    null
  );

  // Multi-delivery markers
  const [multiDeliveryMarkers, setMultiDeliveryMarkers] = useState<
    MultiDeliveryMarker[]
  >([]);

  // ==========================================
  // Initialize map with pickup location
  // ==========================================
  const initializeMapWithPickup = useCallback(
    (
      container: HTMLDivElement,
      pickupLocation: Location,
      maptilerApiKey?: string
    ) => {
      

      // Clean up existing map
      if (mapInstance.current) {
        // console.log("🗑️ Removing existing map instance");
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

        const initialCenter: [number, number] = [
          pickupLocation.lng,
          pickupLocation.lat,
        ];
        const initialZoom = 13;


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
          console.log("✅ Multi-delivery map loaded successfully");
          setMapLoaded(true);
          setMapInitialized(true);
        });

        map.on("error", (e) => {
          console.error("❌ Multi-delivery map error:", e);
        });
      } catch (error) {
        console.error("❌ Failed to initialize multi-delivery map:", error);
        setMapLoaded(false);
      }
    },
    []
  );

  // ==========================================
  // Create Single Marker (for compatibility)
  // ==========================================
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

  // ==========================================
  // Create Multi-Delivery Marker
  // ==========================================

  const createEnhancedMultiDeliveryMarker = useCallback(
    (
      location: Location,
      index: number,
      total: number,
      itemDescription?: string
    ) => {
      if (!mapInstance.current || !mapLoaded) return null;

      try {
        console.log(`✅ Creating proper marker with visible badge ${index}`);

        // Create a container that mimics MapLibre's exact marker structure
        const markerContainer = document.createElement("div");
        markerContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      `;

        // Create the marker wrapper (this is how MapLibre structures it)
        const markerWrapper = document.createElement("div");
        markerWrapper.style.cssText = `
        position: relative;
        pointer-events: auto;
        cursor: pointer;
      `;

        // Create the actual marker SVG (exactly like MapLibre's default marker)
        const markerSvg = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        );
        markerSvg.setAttribute("display", "block");
        markerSvg.setAttribute("height", "41px");
        markerSvg.setAttribute("width", "27px");
        markerSvg.setAttribute("viewBox", "0 0 27 41");
        markerSvg.style.cssText = `
        cursor: pointer;
      `;

        // Create the marker path (MapLibre's exact marker shape)
        const markerPath = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        markerPath.setAttribute(
          "d",
          "M13.5,0C6.044,0,0,6.044,0,13.5C0,20.956,13.5,41,13.5,41S27,20.956,27,13.5C27,6.044,20.956,0,13.5,0z"
        );
        markerPath.setAttribute("fill", "#ef4444");
        markerPath.setAttribute("stroke", "#ffffff");
        markerPath.setAttribute("stroke-width", "2");

        markerSvg.appendChild(markerPath);

        // Create the number badge positioned relative to the marker
        const badge = document.createElement("div");
        badge.style.cssText = `
        position: absolute;
        top: -5px;
        right: -10px;
        width: 20px;
        height: 20px;
        background: #dc2626;
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        z-index: 1000;
        pointer-events: none;
        font-family: system-ui, -apple-system, sans-serif;
      `;
        badge.textContent = index.toString();

        // Assemble the marker
        markerWrapper.appendChild(markerSvg);
        markerWrapper.appendChild(badge);
        markerContainer.appendChild(markerWrapper);

        // Create the MapLibre marker with our custom element
        const marker = new maplibregl.Marker({
          element: markerContainer,
          anchor: "bottom",
          scale: 1.2,
        })
          .setLngLat([location.lng, location.lat])
          .setPopup(
            new maplibregl.Popup({
              offset: 25,
              closeButton: true,
              closeOnClick: false,
            }).setHTML(`
        <div style="padding: 12px; font-family: system-ui; min-width: 220px; max-width: 300px;">
          
          
          ${
            itemDescription
              ? `
            <div style="
          margin-bottom: 8px; 
          padding: 8px; 
          background: #f3f4f6; 
          border-radius: 6px;
          border-left: 3px solid #ef4444;
            ">
          <div style="font-weight: 600; color: #374151; font-size: 14px; margin-bottom: 2px;">📦 Item</div>
          <div style="color: #6b7280; font-size: 13px;">${itemDescription}</div>
            </div>
          `
              : ""
          }
          
          <div style="
            padding: 8px; 
            background: #fef2f2; 
            border-radius: 6px;
            border: 1px solid #fecaca;
          ">
            <div style="font-weight: 600; color: #ef4444; font-size: 12px; margin-bottom: 4px;">📍 DELIVERY ADDRESS</div>
            <div style="color: #374151; font-size: 13px; line-height: 1.4;">${
              location.address
            }</div>
          </div>
          ${index}/${total}
         
        </div>
          `)
          )
          .addTo(mapInstance.current);

        // Fit map to marker if only one delivery
        if (total === 1 && mapInstance.current) {
          mapInstance.current.flyTo({
            center: [location.lng, location.lat],
            zoom: 15,
            speed: 1.2,
            curve: 1.2,
            essential: true,
          });
        }

        // Click handler for popup
        markerWrapper.addEventListener("click", (e) => {
          e.stopPropagation();
          marker.togglePopup();
        });

        console.log(
          `✅ Created proper marker with visible badge ${index}:`,
          location.address
        );
        return marker;
      } catch (error) {
        console.error(`❌ Error creating proper marker ${index}:`, error);
        return null;
      }
    },
    [mapLoaded]
  );

  // ==========================================
  // Update Multi-Delivery Markers
  // ==========================================
  const updateMultiDeliveryMarkers = useCallback(
    (
      pickup: Location,
      deliveryLocations: Location[],
      itemDescriptions?: string[]
    ) => {
      if (!mapInstance.current || !mapLoaded) {
        console.log("⏳ Cannot update multi-delivery markers: map not ready");
        return;
      }

      console.log("📍 Updating multi-delivery markers:", {
        pickup: !!pickup,
        deliveries: deliveryLocations.length,
      });

      // Clear existing pickup marker
      if (pickupMarker) {
        pickupMarker.remove();
        setPickupMarker(null);
      }

      // Clear existing delivery markers
      multiDeliveryMarkers.forEach(({ marker }) => marker.remove());
      setMultiDeliveryMarkers([]);

      // Clear single dropoff marker for compatibility
      if (dropoffMarker) {
        dropoffMarker.remove();
        setDropoffMarker(null);
      }

      // Create pickup marker
      if (pickup) {
        const newPickupMarker = createMarker(pickup, "pickup");
        setPickupMarker(newPickupMarker);
      }

      // Create delivery markers
      if (deliveryLocations.length > 0) {
        const newMultiMarkers: MultiDeliveryMarker[] = [];

        deliveryLocations.forEach((location, index) => {
          const itemDescription = itemDescriptions?.[index];
          const marker = createEnhancedMultiDeliveryMarker(
            location,
            index + 1,
            deliveryLocations.length,
            itemDescription
          );

          if (marker) {
            newMultiMarkers.push({
              id: `delivery-${index}`,
              marker,
              location,
              index: index + 1,
            });
          }
        });

        setMultiDeliveryMarkers(newMultiMarkers);
        console.log(`✅ Created ${newMultiMarkers.length} delivery markers`);
      }
    },
    [
      mapLoaded,
      createMarker,
      createEnhancedMultiDeliveryMarker,
      pickupMarker,
      multiDeliveryMarkers,
      dropoffMarker,
    ]
  );

  // ==========================================
  // Update Single Markers (for compatibility)
  // ==========================================
  const updateMarkers = useCallback(
    (pickup?: Location | null, dropoff?: Location | null) => {
      if (!mapInstance.current || !mapLoaded) {
        console.log("⏳ Cannot update markers: map not ready");
        return;
      }

      console.log("📍 Updating single markers:", {
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

  // ==========================================
  // Draw Coverage Zones
  // ==========================================
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
        // Clear existing zones
        for (let i = 0; i < 10; i++) {
          const fillId = `zone-${i}`;
          const outlineId = `zone-outline-${i}`;

          if (map.getLayer(fillId)) map.removeLayer(fillId);
          if (map.getLayer(outlineId)) map.removeLayer(outlineId);
        }

        if (map.getLayer("pickup-center")) map.removeLayer("pickup-center");

        for (let i = 0; i < 10; i++) {
          const fillId = `zone-${i}`;
          if (map.getSource(fillId)) map.removeSource(fillId);
        }

        if (map.getSource("pickup-center")) map.removeSource("pickup-center");

        // Draw zones from largest to smallest
        const sortedZones = [...riderZones].sort((a, b) => b.endKm - a.endKm);

        sortedZones.forEach((zone, index) => {
          try {
            const outerCircle = circle(centerPoint, zone.endKm, {
              units: "kilometers",
              steps: 64,
            });

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
              `✅ Zone ${index + 1}: ${zone.startKm}-${zone.endKm}km, $${
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

  // ==========================================
  // Draw Multi-Delivery Routes
  // ==========================================
  const drawMultiDeliveryRoutes = useCallback(
    (pickup: Location, deliveryLocations: Location[]) => {
      if (!mapInstance.current || !mapLoaded) return;

      console.log(
        "🛣️ Drawing multi-delivery routes from pickup to",
        deliveryLocations.length,
        "destinations"
      );

      const map = mapInstance.current;

      try {
        // Clear existing routes
        if (map.getLayer("multi-route")) map.removeLayer("multi-route");
        if (map.getLayer("multi-route-outline"))
          map.removeLayer("multi-route-outline");
        if (map.getSource("multi-route")) map.removeSource("multi-route");

        // Create routes from pickup to each delivery
        const routeFeatures = deliveryLocations.map((delivery, index) => ({
          type: "Feature" as const,
          properties: {
            deliveryIndex: index + 1,
            color: `hsl(${(index * 60) % 360}, 70%, 50%)`, // Different color for each route
          },
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [pickup.lng, pickup.lat],
              [delivery.lng, delivery.lat],
            ],
          },
        }));

        const routeCollection = {
          type: "FeatureCollection" as const,
          features: routeFeatures,
        };

        map.addSource("multi-route", {
          type: "geojson",
          data: routeCollection,
        });

        // Add route outline (wider, darker)
        map.addLayer({
          id: "multi-route-outline",
          type: "line",
          source: "multi-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#1f2937",
            "line-width": 6,
            "line-opacity": 0.4,
          },
        });

        // Add main route lines with different colors
        map.addLayer({
          id: "multi-route",
          type: "line",
          source: "multi-route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": [
              "case",
              ["==", ["%", ["get", "deliveryIndex"], 4], 1],
              "#3b82f6", // Blue
              ["==", ["%", ["get", "deliveryIndex"], 4], 2],
              "#ef4444", // Red
              ["==", ["%", ["get", "deliveryIndex"], 4], 3],
              "#10b981", // Green
              "#f59e0b", // Orange
            ],
            "line-width": 4,
            "line-opacity": 0.8,
          },
        });

        console.log("✅ Multi-delivery routes drawn successfully");
      } catch (error) {
        console.error("❌ Error drawing multi-delivery routes:", error);
      }
    },
    [mapLoaded]
  );

  // ==========================================
  // Draw Single Route (for compatibility)
  // ==========================================
  const drawRoute = useCallback(
    (pickup: Location, dropoff: Location) => {
      if (!mapInstance.current || !mapLoaded) return;

      console.log("🛣️ Drawing single route from pickup to dropoff");

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

        console.log("✅ Single route drawn successfully");
      } catch (error) {
        console.error("❌ Error drawing single route:", error);
      }
    },
    [mapLoaded]
  );

  // ==========================================
  // Fit Map to All Locations
  // ==========================================
  const fitMapToAllLocations = useCallback(
    (pickup: Location, deliveryLocations: Location[]) => {
      if (!mapInstance.current || !mapLoaded) return;

      try {
        const bounds = new maplibregl.LngLatBounds();

        // Add pickup location
        bounds.extend([pickup.lng, pickup.lat]);

        // Add all delivery locations
        deliveryLocations.forEach((delivery) => {
          bounds.extend([delivery.lng, delivery.lat]);
        });

        // Only fit bounds if we have multiple locations
        if (deliveryLocations.length > 0) {
          mapInstance.current.fitBounds(bounds, {
            padding: {
              top: 80,
              bottom: 80,
              left: 80,
              right: 80,
            },
            duration: 1000,
            maxZoom: 15,
          });

          console.log("✅ Map fitted to show all multi-delivery locations");
        }
      } catch (error) {
        console.error(
          "❌ Error fitting map to multi-delivery locations:",
          error
        );
      }
    },
    [mapLoaded]
  );

  // ==========================================
  // Fit Map to Markers (for compatibility)
  // ==========================================
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

  // ==========================================
  // Clear Map
  // ==========================================
  const clearMap = useCallback(() => {
    if (!mapInstance.current) return;

    try {
      // Clear single markers
      if (pickupMarker) pickupMarker.remove();
      if (dropoffMarker) dropoffMarker.remove();

      // Clear multi-delivery markers
      multiDeliveryMarkers.forEach(({ marker }) => marker.remove());

      setPickupMarker(null);
      setDropoffMarker(null);
      setMultiDeliveryMarkers([]);

      console.log("✅ Multi-delivery map cleared");
    } catch (error) {
      console.error("❌ Error clearing multi-delivery map:", error);
    }
  }, [pickupMarker, dropoffMarker, multiDeliveryMarkers]);

  // ==========================================
  // Get Map Center
  // ==========================================
  const getMapCenter = useCallback(() => {
    if (!mapInstance.current) return null;

    const center = mapInstance.current.getCenter();
    return {
      lng: center.lng,
      lat: center.lat,
    };
  }, []);

  // ==========================================
  // Reverse Geocoding
  // ==========================================
  const reverseGeocode = useCallback(
    async (
      lng: number,
      lat: number,
      geocoderRef?: React.RefObject<google.maps.Geocoder | null>
    ): Promise<string> => {
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
    []
  );

  // ==========================================
  // Add Map Move Listener
  // ==========================================
  const addMapMoveListener = useCallback((callback: () => void) => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    map.on("moveend", callback);

    return () => {
      map.off("moveend", callback);
    };
  }, []);

  // ==========================================
  // Cleanup Effect
  // ==========================================
  useEffect(() => {
    return () => {
      try {
        if (pickupMarker) pickupMarker.remove();
        if (dropoffMarker) dropoffMarker.remove();
        multiDeliveryMarkers.forEach(({ marker }) => marker.remove());
        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
      } catch (error) {
        console.warn("Multi-delivery cleanup error:", error);
      }
      setMapLoaded(false);
      setMapInitialized(false);
    };
  }, []);

  // ==========================================
  // Return Hook Interface
  // ==========================================
  return {
    // Map instance and state
    mapInstance,
    mapLoaded,
    mapInitialized,

    // Markers
    pickupMarker,
    dropoffMarker,
    multiDeliveryMarkers,

    // Initialization
    initializeMapWithPickup,

    // Single delivery functions (for compatibility)
    updateMarkers,
    drawRoute,
    fitMapToMarkers,

    // Multi-delivery functions
    updateMultiDeliveryMarkers,
    drawMultiDeliveryRoutes,
    fitMapToAllLocations,

    // Shared functions
    drawCoverageZones,
    clearMap,

    // Utility functions
    getMapCenter,
    reverseGeocode,
    addMapMoveListener,
  };
}

export function RiderProfileCard({ 
  riderProfile, 
  isCargo 
}: { 
  riderProfile: RiderProfile; 
  isCargo: boolean 
}) {
  return (
    <Card className={`border-0 ${
      isCargo 
        ? "bg-gradient-to-r from-orange-50 to-amber-50" 
        : "bg-gradient-to-r from-blue-50 to-indigo-50"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage
              src={riderProfile.dpfile || "/placeholder.svg"}
              alt={riderProfile.name}
            />
            <AvatarFallback className={`text-white text-sm font-medium ${
              isCargo ? "bg-orange-600" : "bg-blue-600"
            }`}>
              {riderProfile.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {riderProfile.name}
              </h3>
              <Badge
                variant="default"
                className="text-xs px-2 py-0 bg-green-100 text-green-800 border-green-200"
              >
                Available
              </Badge>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span>4.8</span>
              </div>
              <span>{isCargo ? "Cargo Vehicle" : "Motorcycle"}</span>
              <span className={`font-medium ${isCargo ? "text-orange-600" : "text-blue-600"}`}>
                {isCargo ? "Cargo Service" : "Multi-Delivery"}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {isCargo 
                ? "Specializes in cargo and heavy item deliveries" 
                : "Specializes in multi-point deliveries"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MultiLocationStep({ 
  isCargo, 
  cargoType 
}: { 
  isCargo: boolean; 
  cargoType: string 
}) {
  return (
    <Card className="border-0">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
            isCargo ? "bg-orange-100" : "bg-blue-100"
          }`}>
            {isCargo ? (
              <Truck className="h-6 w-6 text-orange-600" />
            ) : (
              <Package className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              {isCargo ? "Setup Cargo Delivery" : "Setup Multi-Delivery"}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {isCargo 
                ? "Configure pickup and delivery locations for your cargo transportation needs."
                : "Configure one pickup location and multiple delivery destinations for efficient multi-point delivery."
              }
            </p>
            
            {isCargo && cargoType && (
              <div className="bg-orange-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Selected Vehicle: {getCargoTypeLabel(cargoType)}
                  </span>
                </div>
              </div>
            )}
            
            <div className={`rounded-lg p-3 text-left ${
              isCargo ? "bg-orange-50" : "bg-blue-50"
            }`}>
              <h4 className={`text-sm font-medium mb-2 ${
                isCargo ? "text-orange-900" : "text-blue-900"
              }`}>
                Perfect for:
              </h4>
              <ul className={`text-xs space-y-1 ${
                isCargo ? "text-orange-700" : "text-blue-700"
              }`}>
                {isCargo ? (
                  <>
                    <li>• Heavy items and furniture moving</li>
                    <li>• Business equipment transportation</li>
                    <li>• Large cargo requiring special vehicles</li>
                    <li>• Commercial delivery needs</li>
                  </>
                ) : (
                  <>
                    <li>• Multiple packages to different addresses</li>
                    <li>• Restaurant orders to various locations</li>
                    <li>• Business deliveries across the city</li>
                    <li>• Any multi-destination delivery needs</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// CARGO INFORMATION CARD
// ==========================================

export function CargoInformationCard({ 
  cargoType, 
  splitCargo, 
  cargoLoading, 
  hasMultipleVehicleTypes, 
  allTransportTypes, 
  cargoError 
}: { 
  cargoType: string; 
  splitCargo: boolean; 
  cargoLoading: boolean;
  hasMultipleVehicleTypes: boolean;
  allTransportTypes: string[];
  cargoError: string | null;
}) {
  if (cargoLoading) {
    return (
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <Truck className="h-4 w-4 mr-2 text-orange-600" />
            Loading Cargo Details...
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            <span className="ml-2 text-sm text-gray-600">Fetching cargo information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cargoError) {
    return (
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <Truck className="h-4 w-4 mr-2 text-orange-600" />
            Cargo Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
         <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Invoice-Based Pricing</p>
                <p className="text-xs text-blue-700">
                  Pricing will be calculated based on actual cargo requirements and sent via invoice.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
          <Truck className="h-4 w-4 mr-2 text-orange-600" />
          Cargo Service Details
          {hasMultipleVehicleTypes && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {allTransportTypes.length} Vehicle Types
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Vehicle Type(s) */}
          {hasMultipleVehicleTypes ? (
            <div className="p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 block mb-2">Vehicle Types:</span>
              <div className="flex flex-wrap gap-2">
                {allTransportTypes.map((type, index) => (
                  <Badge key={index} variant="outline" className="text-orange-800 border-orange-300">
                    {getCargoTypeLabel(type)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : cargoType ? (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-700">Vehicle Type:</span>
              <span className="font-medium text-orange-800">{getCargoTypeLabel(cargoType)}</span>
            </div>
          ) : null}
          
          {/* Split Cargo Strategy */}
          {splitCargo && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-700">Strategy:</span>
              <span className="font-medium text-yellow-800">Separate Vehicles</span>
            </div>
          )}
          
          {/* Invoice Information */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Invoice-Based Pricing</p>
                <p className="text-xs text-blue-700">
                  Pricing will be calculated based on actual cargo requirements and sent via invoice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// PRICING ZONES CARD (Non-cargo only)
// ==========================================

export function PricingZonesCard({ zones }: { zones: PricingZone[] }) {
  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
          Pricing Zones (Per Delivery)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone, index) => (
            <div
              key={zone.id}
              className="grid items-center justify-center p-3 rounded-lg bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length],
                  }}
                />
                <span className="text-[11px] font-medium">
                  {zone.startKm}km - {zone.endKm}km
                </span>
              </div>
              <span className="font-semibold text-[13px] text-center text-gray-900">
                GH₵{zone.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            Each delivery destination is priced separately based on distance from pickup center.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// MULTI-DELIVERY COMPLETE STEP
// ==========================================

export function MultiCompleteStep({
  bookingReference,
  totalCalculations,
  deliveryItems,
  riderProfile,
  onReset,
  bookId,
  isTrackingActive,
  onStartTracking,
  onStopTracking,
  isLoadingRoute,
  isCargo = false,
  cargoType = '',
}: {
  bookingReference: string | null;
  totalCalculations:  totalCalculations | null;
  deliveryItems: MultiDeliveryItem[];
  riderProfile: RiderProfile;
  onReset: () => void;
  bookId?: string;
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  isLoadingRoute?: boolean;
  isCargo?: boolean;
  cargoType?: string;
}) {
  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="space-y-4">
      {/* Success Message */}
      <Card className={`border-0 ${
        isCargo 
          ? "bg-gradient-to-r from-orange-50 to-amber-50" 
          : "bg-gradient-to-r from-green-50 to-emerald-50"
      }`}>
        <CardContent className="p-4 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isCargo ? "bg-orange-100" : "bg-green-100"
          }`}>
            {isCargo ? (
              <FileText className="h-6 w-6 text-orange-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h3 className={`font-semibold mb-1 ${
            isCargo ? "text-orange-900" : "text-green-900"
          }`}>
            {isCargo ? "Cargo Booking Confirmed!" : "Multi-Delivery Confirmed!"}
          </h3>
          <p className={`text-sm ${
            isCargo ? "text-orange-700" : "text-green-700"
          }`}>
            {isCargo 
              ? `Your ${completedItems.length} cargo delivery request has been submitted to ${riderProfile?.name}. Invoice will be sent shortly.`
              : `Your ${completedItems.length} delivery requests have been sent to ${riderProfile?.name}.`
            }
          </p>
        </CardContent>
      </Card>

      {/* Booking Reference */}
      {bookingReference && (
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
              <p className="font-mono text-lg font-semibold text-gray-900">
                {bookingReference.slice(0, 8)}...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Status */}
      {isTrackingActive && (
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Route className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-1">
                {isCargo ? "Cargo Route Active" : "Multi-Route Active"}
              </h4>
              <p className="text-sm text-blue-700">
                {isCargo 
                  ? "All cargo delivery routes are being tracked on the map."
                  : "All delivery routes are being tracked on the map."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            {isCargo ? (
              <Truck className="h-4 w-4 mr-2 text-orange-600" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isCargo ? "Cargo Delivery Summary" : "Multi-Delivery Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`text-center p-3 rounded-lg ${
              isCargo ? "bg-orange-50" : "bg-blue-50"
            }`}>
              <div className={`text-lg font-bold ${
                isCargo ? "text-orange-900" : "text-blue-900"
              }`}>
                {completedItems.length}
              </div>
              <div className={`text-xs ${
                isCargo ? "text-orange-700" : "text-blue-700"
              }`}>
                {isCargo ? "Cargo Stops" : "Deliveries"}
              </div>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              isCargo ? "bg-yellow-50" : "bg-green-50"
            }`}>
              <div className={`text-lg font-bold ${
                isCargo ? "text-yellow-900" : "text-green-900"
              }`}>
                {isCargo 
                  ? getCargoTypeLabel(cargoType)
                  : `${totalCalculations?.totalDistance || 0}km`
                }
              </div>
              <div className={`text-xs ${
                isCargo ? "text-yellow-700" : "text-green-700"
              }`}>
                {isCargo ? "Vehicle Type" : "Total Distance"}
              </div>
            </div>
          </div>
          
          {totalCalculations?.averageDuration && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Time</span>
              <span className="font-medium">{totalCalculations.averageDuration}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-900">
              {isCargo ? "Invoice Amount" : "Total Price"}
            </span>
            <span className={`font-semibold text-lg ${
              isCargo ? "text-orange-600" : "text-green-600"
            }`}>
              {isCargo 
                ? "Pending Invoice" 
                : `GH₵${totalCalculations?.totalPrice?.toFixed(2) || '0.00'}`
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Items List */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            {isCargo ? (
              <Truck className="h-4 w-4 mr-2 text-orange-600" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isCargo ? "Cargo" : "Delivery"} Destinations ({completedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {completedItems.map((item, index) => {
              const calculation = totalCalculations?.itemCalculations?.find((calc: { id: string; distance: number; duration: string; price: number }) => calc.id === item.id);
              
              return (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    isCargo 
                      ? "bg-orange-100 text-orange-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.itemDescription}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.deliveryAddress.split(',')[0]}
                    </p>
                  </div>
                  {!isCargo && calculation ? (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        GH₵{calculation.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculation.distance}km
                      </p>
                    </div>
                  ) : isCargo ? (
                    <div className="text-right">
                      <p className="text-xs font-medium text-orange-600">
                        Invoice
                      </p>
                      <p className="text-xs text-gray-500">
                        Pending
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      {riderProfile && (
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={riderProfile.dpfile || "/placeholder.svg"}
                    alt={riderProfile.name}
                  />
                  <AvatarFallback className={`text-white text-xs ${
                    isCargo ? "bg-orange-600" : "bg-blue-600"
                  }`}>
                    {riderProfile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {riderProfile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isCargo ? "Cargo delivery specialist" : "Multi-delivery specialist"}
                  </p>
                </div>
              </div>
              {riderProfile.phone && (
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button onClick={onReset} className={`w-full ${
          isCargo 
            ? "bg-orange-500 hover:bg-orange-600" 
            : "bg-blue-500 hover:bg-blue-600"
        }`}>
          <Plus className="w-4 h-4 mr-2" />
          {isCargo ? "Book Another Cargo Delivery" : "Book Another Multi-Delivery"}
        </Button>
        
        {/* Tracking Button */}
        {bookId && onStartTracking && onStopTracking && (
          <Button 
            variant={isTrackingActive ? "destructive" : "outline"} 
            className="w-full"
            onClick={isTrackingActive ? onStopTracking : onStartTracking}
            disabled={isLoadingRoute}
          >
            {isLoadingRoute ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Routes...
              </>
            ) : isTrackingActive ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                {isCargo ? "Stop Cargo Tracking" : "Stop Multi-Route Tracking"}
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                {isCargo ? "Track Cargo Deliveries" : "Track All Deliveries"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// MULTI-DELIVERY REVIEW STEP
// ==========================================

export function MultiReviewStep({
  totalCalculations,
  deliveryItems,
  isBooking,
  onBooking,
  onBack,
  paymentCompleted = false,
  isCargo = false,
  cargoType = '',
  // splitCargo = false,
  userPhone = '',
  cargoLoading = false,
  hasMultipleVehicleTypes = false,
  allTransportTypes = [],
  // cargoError = null,
}: {
  totalCalculations:  totalCalculations | null;
  deliveryItems: MultiDeliveryItem[];
  isBooking: boolean;
  onBooking: () => void;
  onBack: () => void;
  paymentCompleted?: boolean;
  isCargo?: boolean;
  cargoType?: string;
  // splitCargo?: boolean;
  userPhone?: string;
  cargoLoading?: boolean;
  hasMultipleVehicleTypes?: boolean;
  allTransportTypes?: string[];
  // cargoError?: string | null;
}) {
  const [showItemDetails, setShowItemDetails] = useState(false);

  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="space-y-4">
      {/* Delivery Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            {isCargo ? (
              <Truck className="h-4 w-4 mr-2 text-orange-600" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isCargo ? "Cargo Delivery Summary" : "Multi-Delivery Summary"}
            {cargoLoading && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin text-orange-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Metrics Grid - Different for cargo vs regular */}
          {isCargo ? (
            // Cargo metrics - no pricing, show vehicle info
            <div className="grid grid-cols-2 gap-3 text-center bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3">
              <div>
                <div className="text-lg font-semibold text-orange-900">
                  {completedItems.length}
                </div>
                <div className="text-xs text-orange-700">Cargo Stops</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-900">
                  {cargoLoading ? "..." : hasMultipleVehicleTypes ? `${allTransportTypes.length} Types` : getCargoTypeLabel(cargoType)}
                </div>
                <div className="text-xs text-orange-700">
                  {hasMultipleVehicleTypes ? "Vehicle Types" : "Vehicle Type"}
                </div>
              </div>
            </div>
          ) : (
            // Regular delivery metrics - with pricing
            <div className="grid grid-cols-3 gap-3 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
              <div>
                <div className="text-lg font-semibold text-blue-900">
                  {completedItems.length}
                </div>
                <div className="text-xs text-blue-700">Deliveries</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-900">
                  {totalCalculations?.totalDistance || 0}km
                </div>
                <div className="text-xs text-blue-700">Total Distance</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  GH₵{totalCalculations?.totalPrice?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-blue-700">Total Price</div>
              </div>
            </div>
          )}

          {/* Duration estimate - for both cargo and regular */}
          {totalCalculations?.averageDuration && (
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Estimated completion: {totalCalculations.averageDuration}
              </span>
            </div>
          )}

          {/* Cargo-specific information */}
          {isCargo && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">Invoice Process</h4>
                  <p className="text-sm text-orange-700 mb-2">
                    This is a cargo delivery. An invoice will be sent to you shortly.
                  </p>
                  
                  {/* Show actual vehicle types from database */}
                  {!cargoLoading && hasMultipleVehicleTypes && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-orange-800 mb-1">Vehicle Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {allTransportTypes.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-orange-700 border-orange-300">
                            {getCargoTypeLabel(type)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-800">
                        Your invoice will be sent to this number via WhatsApp or SMS:
                      </span>
                    </div>
                  )}
                  {userPhone && (
                    <div className="mt-1 font-mono text-orange-800 font-medium">
                      {userPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Items Toggle */}
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium">
              View {isCargo ? "Cargo" : "Delivery"} Details ({completedItems.length})
            </span>
            <div className="flex items-center space-x-2">
              {!isCargo && totalCalculations && (
                <Badge variant="secondary" className="text-xs">
                  GH₵{totalCalculations.totalPrice.toFixed(2)}
                </Badge>
              )}
              {isCargo && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  Invoice Pending
                </Badge>
              )}
              <motion.div
                animate={{ rotate: showItemDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCargo ? (
                  <Truck className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
              </motion.div>
            </div>
          </button>

          {/* Expandable Item Details */}
          <AnimatePresence>
            {showItemDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {completedItems.map((item, index) => {
                  const calculation = totalCalculations?.itemCalculations?.find((calc: { id: string; distance: number; duration: string; price: number }) => calc.id === item.id);
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-1 ${
                          isCargo 
                            ? "bg-orange-100 text-orange-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {item.itemDescription}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {item.deliveryAddress}
                          </p>
                          {!isCargo && calculation && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3 text-gray-500">
                                <span>{calculation.distance}km</span>
                                <span>{calculation.duration}</span>
                              </div>
                              <span className="font-medium text-green-600">
                                GH₵{calculation.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {isCargo && (
                            <div className="text-xs text-orange-600 font-medium">
                              Pricing via invoice
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Status for non-cargo */}
          {!isCargo && paymentCompleted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Payment Completed
                </span>
              </div>
              <p className="text-xs text-green-800 mt-1">
                Ready to confirm your multi-delivery booking
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={isBooking}
        >
          Back
        </Button>
        <Button 
          onClick={onBooking} 
          disabled={isBooking || completedItems.length === 0 || (isCargo && cargoLoading)} 
          className={`flex-1 ${
            isCargo 
              ? "bg-orange-500 hover:bg-orange-600" 
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isCargo ? "Submitting..." : paymentCompleted ? "Confirming..." : "Processing..."}
            </>
          ) : (
            <>
              {isCargo ? (
                <FileText className="w-4 h-4 mr-2" />
              ) : (
                <Truck className="w-4 h-4 mr-2" />
              )}
              {isCargo 
                ? cargoLoading ? "Loading..." : "Confirm Booking" 
                : paymentCompleted 
                ? "Confirm Multi-Delivery" 
                : "Choose Payment Method"
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
}