
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { ZONE_COLORS } from "@/components/GLOBAL/format";
import type { DeliveryCalculation, PricingZone, RiderProfile } from "./BookingHooks";
import PaymentModal, { type PaymentResult } from "./payment-modal";
// import { ZONE_COLORS } from "@/components/config/map";

interface RiderBookingMenuProps {
  // Rider data
  riderProfile: RiderProfile | undefined;
  riderZones: PricingZone[];

  // Booking flow
  currentStep: "locations" | "review" | "complete";
  calculation: DeliveryCalculation | null;
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

export function RiderBookingMenu({
  riderProfile,
  riderZones,
  currentStep,
  calculation,
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
}: RiderBookingMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  
  // NEW: Payment modal state
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
        return "Select Locations";
      case "review":
        return "Review Delivery";
      case "complete":
        return "Booking Complete";
      default:
        return "Book Delivery";
    }
  };

  const getButtonText = () => {
    if (!riderProfile) return "Select Area";
    if (currentStep === "locations") return "Select Locations";
    if (currentStep === "review") return "Continue";
    if (currentStep === "complete") return "Booking Complete";
    return "Book Delivery";
  };

  // NEW: Handle payment completion
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

  // NEW: Handle confirm booking - show payment modal first
  const handleConfirmBooking = () => {
    if (!calculation) return;
    setShowPaymentModal(true);
  };

  // NEW: Create order details for payment modal
  const createOrderDetails = () => {
    if (!calculation || !riderProfile || !bookId) return null;

    return {
      id: bookId,
      amount: calculation.totalPrice,
      description: `Delivery from ${calculation.pickupLocation.address?.split(',')[0] || 'Pickup'} to ${calculation.dropoffLocation.address?.split(',')[0] || 'Destination'}`,
      vendor: riderProfile.name || "Delivery Service",
    };
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating toggle buttons - iOS style */}
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
                <span>Search</span>
              </button>
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
            className="absolute right-[-10px] transform -translate-x-1/2 bottom-4 sm:left-4 sm:transform-none sm:translate-x-0 z-20 w-[350px] max-w-[90vw] h-[85vh] flex flex-col rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border-0 ring-1 ring-black/5"
          >
            <div className="flex flex-col h-full min-h-0">
              {/* Header with tracking status */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getStepTitle()}
                  </h2>
                  {isTrackingActive && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Tracking
                    </Badge>
                  )}
                  {/* NEW: Payment status indicator */}
                  {paymentCompleted && currentStep === "review" && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
                        <LocationsStep />
                      </motion.div>
                    )}

                    {currentStep === "review" && calculation && (
                      <motion.div
                        key="step-review"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ReviewStep
                          calculation={calculation}
                          isBooking={isBooking}
                          onBooking={handleConfirmBooking} // NEW: Changed to handle payment first
                          onBack={() => setCurrentStep("locations")}
                          paymentCompleted={paymentCompleted} // NEW: Pass payment status
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
                        <CompleteStepWithTracking
                          bookingReference={bookingReference}
                          calculation={calculation}
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
                    <PricingZonesCard
                      zones={riderZones}
                      calculation={calculation}
                    />
                  </div>
                )}
              </div>

              {/* Step Navigation */}
              <div className="border-t border-gray-100 p-4 bg-white/95">
                <StepNavigation
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                  hasCalculation={!!calculation}
                  isBookingComplete={bookingComplete}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NEW: Payment Modal */}
      {calculation && createOrderDetails() && (
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
            </div>

            <p className="text-xs text-gray-500 mt-1">3+ years experience</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PricingZonesCard({
  zones,
  calculation,
}: {
  zones: PricingZone[];
  calculation: DeliveryCalculation | null;
}) {
  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900">
          Pricing Zones
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone, index) => {
            const isActive = calculation?.matchedZone?.id === zone.id;
            return (
              <div
                key={zone.id}
                className={`grid items-center justify-center p-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-blue-100 border-2 border-blue-300"
                    : "bg-gray-50"
                }`}
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
                <span
                  className={`font-semibold text-[13px] text-center ${
                    isActive ? "text-blue-700" : "text-gray-900"
                  }`}
                >
                  ${zone.price.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function LocationsStep() {
  return (
    <Card className="border-0">
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">
              Select Your Locations
            </h3>
            <p className="text-sm text-gray-600">
              Choose your pickup and drop-off locations to see the delivery
              price.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// NEW: Updated ReviewStep to handle payment status
function ReviewStep({
  calculation,
  isBooking,
  onBooking,
  onBack,
  paymentCompleted = false, // NEW: Payment status prop
}: {
  calculation: DeliveryCalculation;
  isBooking: boolean;
  onBooking: () => void;
  onBack: () => void;
  paymentCompleted?: boolean; // NEW: Optional payment status
}) {
  return (
    <div className="space-y-4">
      {/* Route Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">
            Delivery Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Route */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">PICKUP</p>
                <p className="text-sm text-gray-900 truncate">
                  {calculation.pickupLocation.address}
                </p>
              </div>
            </div>

            <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />

            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">DROP-OFF</p>
                <p className="text-sm text-gray-900 truncate">
                  {calculation.dropoffLocation.address}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {calculation.distance}km
              </div>
              <div className="text-xs text-gray-500">Distance</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {calculation.duration}
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                GH₵{calculation.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Total Price</div>
            </div>
          </div>

          {/* Matched Zone */}
          {calculation.matchedZone && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-900">
                  Pricing Zone
                </span>
              </div>
              <p className="text-xs text-blue-800">
                {calculation.matchedZone.startKm}km -{" "}
                {calculation.matchedZone.endKm}km zone
              </p>
            </div>
          )}

          {/* NEW: Payment Status Indicator */}
          {paymentCompleted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Payment Completed
                </span>
              </div>
              <p className="text-xs text-green-800 mt-1">
                Ready to confirm your booking
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
          disabled={isBooking} 
          className="flex-1"
        >
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {paymentCompleted ? "Confirming..." : "Processing..."}
            </>
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              {paymentCompleted ? "Confirm Booking" : "Choose Payment Method"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Existing CompleteStepWithTracking component remains the same
function CompleteStepWithTracking({
  bookingReference,
  calculation,
  riderProfile,
  onReset,
  bookId,
  isTrackingActive,
  onStartTracking,
  onStopTracking,
  isLoadingRoute,
}: {
  bookingReference: string | null;
  calculation: DeliveryCalculation | null;
  riderProfile: RiderProfile| undefined;
  
  onReset: () => void;
  bookId?: string;
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  isLoadingRoute?: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Success Message */}
      <Card className="border-0 bg-green-50">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-900 mb-1">
            Booking Confirmed!
          </h3>
          <p className="text-sm text-green-700">
            Your delivery request has been sent to {riderProfile?.name}.
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
              <h4 className="font-semibold text-blue-900 mb-1">Route Active</h4>
              <p className="text-sm text-blue-700">
                Delivery route is being tracked on the map.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      {calculation && (
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Distance</span>
              <span className="font-medium">{calculation.distance}km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{calculation.duration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zone</span>
              <span className="font-medium">
                {calculation.matchedZone?.startKm}km -{" "}
                {calculation.matchedZone?.endKm}km
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Total Price</span>
              <span className="font-semibold text-lg text-blue-600">
                GH₵{calculation.totalPrice.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

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
                  <p className="text-xs text-gray-500">Your delivery rider</p>
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
          <Package className="w-4 h-4 mr-2" />
          Book Another Delivery
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
                Loading Route...
              </>
            ) : isTrackingActive ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Track This Delivery
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function StepNavigation({
  currentStep,
  setCurrentStep,
  hasCalculation,
  isBookingComplete,
}: {
  currentStep: "locations" | "review" | "complete";
  setCurrentStep: (step: "locations" | "review" | "complete") => void;
  hasCalculation: boolean;
  isBookingComplete: boolean;
}) {
  const steps = [
    { id: "locations", label: "Locations", icon: MapPin },
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
            (step.id === "locations" && hasCalculation) ||
            (step.id === "review" && isBookingComplete) ||
            (step.id === "complete" && isBookingComplete);
          const isAccessible =
            step.id === "locations" ||
            (step.id === "review" && hasCalculation) ||
            (step.id === "complete" && isBookingComplete);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isAccessible && setCurrentStep(step.id)}
                disabled={!isAccessible}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
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