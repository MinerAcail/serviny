// ==========================================
// RiderMultiBookingMenu - Main Component
// ==========================================

"use client";

import { useRef, useEffect, useState } from "react";
import {
  Navigation,
  X,
  Package,
  Loader2,
  Pin,
  Search,
  Route,
  StopCircle,
  Truck,
  DollarSign,
  FileText,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/middleware/context/authContext";

// Import simplified cargo hook
import { useCargoData, getCargoTypeLabel, useCargoParams } from "../cargoDataQuery";

// Import sub-components
import {
  RiderProfileCard,
  PricingZonesCard,
  CargoInformationCard,
  MultiLocationStep,
  MultiReviewStep,
  MultiCompleteStep,
  MultiStepNavigation,
} from "./RiderMultiBookingMenuComponents";

// REUSE: Import existing types
import type {
  RiderProfile,
  PricingZone,
} from "../riderBookingHooks";

// Import multi-delivery types
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest";
import PaymentModal from "../payment-modal";

interface RiderMultiBookingMenuProps {
  // Rider data
  riderProfile: RiderProfile | undefined;
  riderZones: PricingZone[];

  // Multi-delivery booking flow
  currentStep: "locations" | "review" | "complete";
  totalCalculations: {
    totalDistance: number;
    totalPrice: number;
    averageDuration: string;
    itemCalculations: Array<{
      id: string;
      distance: number;
      duration: string;
      price: number;
    }>;
  } | null;
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
  const { isCargo, cargoType: urlCargoType, splitCargo, isMultiLocation } = useCargoParams();
  
  // Fetch actual cargo data from database
  const { 
    cargoData, 
    isLoading: cargoLoading, 
    error: cargoError,
    primaryTransportType,
    allTransportTypes,
    hasMultipleVehicleTypes,
    totalCargoCount 
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
  const handlePaymentComplete = (paymentData: any) => {
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
                    <DollarSign className="h-4 w-4" />
                    <span>GH₵{totalCalculations.totalPrice.toFixed(0)}</span>
                  </div>
                </>
              )}

              {/* Cargo indicator */}
              {/* {isCargo && actualCargoType && (
                <>
                  <div className="h-5 w-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1 text-[12px] font-medium text-orange-700">
                    <FileText className="h-4 w-4" />
                    <span>{getCargoTypeLabelForDisplay(actualCargoType)}</span>
                    {cargoLoading && (
                      <Loader2 className="h-3 w-3 animate-spin ml-1" />
                    )}
                  </div>
                </>
              )} */}

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
                          splitCargo={splitCargo}
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