// ==========================================
// NEW: RiderMultiBookingMenu Component
// ==========================================

"use client";

import { useRef, useEffect, useState } from "react";
import {
  Navigation,
  X,
  MapPin,
  CheckCircle,
  Package,
  Star,
  Phone,
  Loader2,
  Pin,
  Search,
  Route,
  StopCircle,
  Plus,
  Truck,
  DollarSign,
  Clock,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// REUSE: Import existing types
import type {
  RiderProfile,
  PricingZone,
} from "../riderBookingHooks";
import { ZONE_COLORS } from "@/components/config/map";

// Import multi-delivery types
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest";

// NEW: Payment modal import (would need to be created or adapted)
// import PaymentModal from "./payment-modal";

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
  
  // NEW: Payment modal state (for future implementation)
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

  const getStepTitle = () => {
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
  };

  const getButtonText = () => {
    if (!riderProfile) return "Select Area";
    if (currentStep === "locations") return "Setup Deliveries";
    if (currentStep === "review") return "Continue";
    if (currentStep === "complete") return "Booking Complete";
    return "Book Multi-Delivery";
  };

  // Calculate completed items for display
  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  // NEW: Handle payment completion (placeholder for future)
  const handlePaymentComplete = (paymentData: any) => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    
    toast.success(`Payment successful! Method: ${paymentData.method.toUpperCase()}`, {
      description: `Amount: GH₵${paymentData.amount.toFixed(2)}`,
    });

    setTimeout(() => {
      onBooking();
    }, 500);
  };

  // NEW: Handle confirm multi-booking
  const handleConfirmMultiBooking = () => {
    if (!totalCalculations) return;
    
    // For now, directly proceed to booking
    // In future, could show payment modal first
    onBooking();
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating toggle buttons - Enhanced for multi-delivery */}
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
                <Package className="h-4 w-4 text-blue-600" />
                <span>{getButtonText()}</span>
                {/* Show item count if applicable */}
                {deliveryItems.length > 0 && (
                  <div className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-[10px] font-medium">
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

              {/* NEW: Total price indicator */}
              {totalCalculations && (
                <>
                  <div className="h-5 w-px bg-gray-200 mx-1" />
                  <div className="flex items-center gap-1 text-[12px] font-medium text-green-700">
                    <DollarSign className="h-4 w-4" />
                    <span>${totalCalculations.totalPrice.toFixed(0)}</span>
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
              {/* Enhanced Header with multi-delivery info */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {getStepTitle()}
                    </h2>
                    {deliveryItems.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {completedItems.length}/{deliveryItems.length} destinations ready
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
                  {paymentCompleted && currentStep === "review" && (
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
                    <RiderProfileCard riderProfile={riderProfile} />
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
                        <MultiLocationStep />
                      </motion.div>
                    )}

                    {currentStep === "review" && totalCalculations && (
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
                          onBooking={handleConfirmMultiBooking}
                          onBack={() => setCurrentStep("locations")}
                          paymentCompleted={paymentCompleted}
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
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pricing Zones - Always visible */}
                {riderZones.length > 0 && (
                  <div className="mb-6">
                    <PricingZonesCard zones={riderZones} />
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
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Future: Payment Modal for multi-delivery */}
      {/* {totalCalculations && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderDetails={{
            id: bookId || "",
            amount: totalCalculations.totalPrice,
            description: `Multi-delivery: ${deliveryItems.length} destinations`,
            vendor: riderProfile?.name || "Delivery Service",
          }}
          onPaymentComplete={handlePaymentComplete}
        />
      )} */}
    </div>
  );
}

// REUSE: Enhanced Rider Profile Card
function RiderProfileCard({ riderProfile }: { riderProfile: RiderProfile }) {
  return (
    <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage
              src={riderProfile.dpfile || "/placeholder.svg"}
              alt={riderProfile.name}
            />
            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
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
              <span>Motorcycle</span>
              <span className="text-blue-600 font-medium">Multi-Delivery</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">Specializes in multi-point deliveries</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// REUSE: Enhanced Pricing Zones Card
function PricingZonesCard({ zones }: { zones: PricingZone[] }) {
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
                ${zone.price.toFixed(2)}
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

// NEW: Multi-Location Setup Step
function MultiLocationStep() {
  return (
    <Card className="border-0">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Truck className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              Setup Multi-Delivery
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Configure one pickup location and multiple delivery destinations for efficient multi-point delivery.
            </p>
            <div className="bg-blue-50 rounded-lg p-3 text-left">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Perfect for:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Multiple packages to different addresses</li>
                <li>• Restaurant orders to various locations</li>
                <li>• Business deliveries across the city</li>
                <li>• Any multi-destination delivery needs</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// NEW: Multi-Delivery Review Step
function MultiReviewStep({
  totalCalculations,
  deliveryItems,
  isBooking,
  onBooking,
  onBack,
  paymentCompleted = false,
}: {
  totalCalculations: any;
  deliveryItems: MultiDeliveryItem[];
  isBooking: boolean;
  onBooking: () => void;
  onBack: () => void;
  paymentCompleted?: boolean;
}) {
  const [showItemDetails, setShowItemDetails] = useState(false);

  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="space-y-4">
      {/* Multi-Delivery Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <Package className="h-4 w-4 mr-2 text-blue-600" />
            Multi-Delivery Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Total Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
            <div>
              <div className="text-lg font-semibold text-blue-900">
                {completedItems.length}
              </div>
              <div className="text-xs text-blue-700">Deliveries</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-900">
                {totalCalculations.totalDistance}km
              </div>
              <div className="text-xs text-blue-700">Total Distance</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">
                GH₵{totalCalculations.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs text-blue-700">Total Price</div>
            </div>
          </div>

          {/* Estimated Duration */}
          <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              Estimated completion: {totalCalculations.averageDuration}
            </span>
          </div>

          {/* Delivery Items Toggle */}
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium">View Delivery Details ({completedItems.length})</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                ${totalCalculations.totalPrice.toFixed(2)}
              </Badge>
              <motion.div
                animate={{ rotate: showItemDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Package className="h-4 w-4" />
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
                  const calculation = totalCalculations.itemCalculations.find(calc => calc.id === item.id);
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-medium text-red-600 flex-shrink-0 mt-1">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {item.itemDescription}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {item.deliveryAddress}
                          </p>
                          {calculation && (
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

          {/* Payment Status */}
          {paymentCompleted && (
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
          disabled={isBooking || completedItems.length === 0} 
          className="flex-1"
        >
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {paymentCompleted ? "Confirming..." : "Processing..."}
            </>
          ) : (
            <>
              <Truck className="w-4 h-4 mr-2" />
              {paymentCompleted ? "Confirm Multi-Delivery" : "Book Multi-Delivery"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// NEW: Multi-Delivery Complete Step
function MultiCompleteStep({
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
}: {
  bookingReference: string | null;
  totalCalculations: any;
  deliveryItems: MultiDeliveryItem[];
  riderProfile: any;
  onReset: () => void;
  bookId?: string;
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  isLoadingRoute?: boolean;
}) {
  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="space-y-4">
      {/* Success Message */}
      <Card className="border-0 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-900 mb-1">
            Multi-Delivery Confirmed!
          </h3>
          <p className="text-sm text-green-700">
            Your {completedItems.length} delivery requests have been sent to {riderProfile?.name}.
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
              <h4 className="font-semibold text-blue-900 mb-1">Multi-Route Active</h4>
              <p className="text-sm text-blue-700">
                All delivery routes are being tracked on the map.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Delivery Summary */}
      {totalCalculations && (
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
              <Package className="h-4 w-4 mr-2 text-blue-600" />
              Multi-Delivery Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-900">
                  {completedItems.length}
                </div>
                <div className="text-xs text-blue-700">Deliveries</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-900">
                  {totalCalculations.totalDistance}km
                </div>
                <div className="text-xs text-green-700">Total Distance</div>
              </div>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Time</span>
              <span className="font-medium">{totalCalculations.averageDuration}</span>
            </div>
            
            <Separator />
            
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Total Price</span>
              <span className="font-semibold text-lg text-green-600">
                GH₵{totalCalculations.totalPrice.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Items List */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <Truck className="h-4 w-4 mr-2 text-blue-600" />
            Delivery Destinations ({completedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {completedItems.map((item, index) => {
              const calculation = totalCalculations?.itemCalculations.find(calc => calc.id === item.id);
              
              return (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-medium text-red-600 flex-shrink-0">
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
                  {calculation && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        GH₵{calculation.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculation.distance}km
                      </p>
                    </div>
                  )}
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
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
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
                  <p className="text-xs text-gray-500">Multi-delivery specialist</p>
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
        <Button onClick={onReset} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Book Another Multi-Delivery
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
                Stop Multi-Route Tracking
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Track All Deliveries
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// NEW: Multi-Delivery Step Navigation
function MultiStepNavigation({
  currentStep,
  setCurrentStep,
  hasCalculations,
  isBookingComplete,
}: {
  currentStep: "locations" | "review" | "complete";
  setCurrentStep: (step: "locations" | "review" | "complete") => void;
  hasCalculations: boolean;
  isBookingComplete: boolean;
}) {
  const steps = [
    { id: "locations", label: "Setup", icon: MapPin },
    { id: "review", label: "Review", icon: CheckCircle },
    { id: "complete", label: "Complete", icon: Package },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-2">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted =
            (step.id === "locations" && hasCalculations) ||
            (step.id === "review" && isBookingComplete) ||
            (step.id === "complete" && isBookingComplete);
          const isAccessible =
            step.id === "locations" ||
            (step.id === "review" && hasCalculations) ||
            (step.id === "complete" && isBookingComplete);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isAccessible && setCurrentStep(step.id)}
                disabled={!isAccessible}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : isAccessible
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Labels */}
      <div className="flex justify-center">
        <span className="text-sm font-medium text-gray-700">
          {steps.find((step) => step.id === currentStep)?.label}
        </span>
      </div>
    </div>
  );
}