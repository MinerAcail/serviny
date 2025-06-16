// ==========================================
// Final RiderBookingMenu with Complete Payment Integration
// ==========================================

"use client";

import { useRef, useEffect, useCallback, useState } from "react";
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
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  RiderProfile,
  PricingZone,
  DeliveryCalculation,
} from "./riderBookingHooks";
import { ZONE_COLORS } from "@/components/config/map";
import { EnhancedReviewStep } from "./EnhancedReviewStep";
// import { EnhancedReviewStep } from "./FixedEnhancedReviewStep"; // Updated import to use fixed component
export interface Location {
  lng: number;
  lat: number;
  address: string;
}
interface RiderBookingMenuProps {
  // Rider data
  riderProfile: RiderProfile | null;
  riderZones: PricingZone[];

  // Booking flow
  currentStep: "locations" | "review" | "complete";
  calculation: DeliveryCalculation | null;
  isBooking: boolean;
  bookingComplete: boolean;
  bookingReference: string | null;

  // NEW: Payment props
  paymentReference?: string | null;
  onViewBookings?: () => void;

  // Handlers
  onBooking: (paymentReference?: string) => Promise<void>; // Updated to accept payment reference
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

  // Payment-related props
  userProfile?: {
    id: string;
    email: string;
    name: string;
    number?: string;
  };

  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  riderId?: string;
}

export function RiderBookingMenu({
  riderProfile,
  riderZones,
  currentStep,
  calculation,
  isBooking,
  bookingComplete,
  bookingReference,
  paymentReference,
  onViewBookings,
  onBooking,
  onReset,
  setCurrentStep,
  isOpen,
  setIsOpen,
  handleEditLocations,
  handleStartPinDrop,
  // Tracking props
  isTrackingActive = false,
  onStartTracking,
  onStopTracking,
  isLoadingRoute = false,
  bookId,
  // Payment props
  userProfile,
  pickupLocation,
  dropoffLocation,
  riderId,
}: RiderBookingMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

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

  // UPDATED: Enhanced step titles with payment status
  const getStepTitle = () => {
    switch (currentStep) {
      case "locations":
        return "Select Locations";
      case "review":
        return (calculation?.totalPrice ?? 0) > 0
          ? "Review & Pay"
          : "Review Booking";
      case "complete":
        return paymentReference ? "Payment Complete" : "Booking Complete";
      default:
        return "Book Delivery";
    }
  };

  const getButtonText = () => {
    if (!riderProfile) return "Select Area";
    if (currentStep === "locations") return "Select Locations";
    if (currentStep === "review") {
      return (calculation?.totalPrice ?? 0) > 0
        ? "Review & Pay"
        : "Review Booking";
    }
    if (currentStep === "complete") return "Booking Complete";
    return "Book Delivery";
  };

  // UPDATED: Enhanced booking handler that integrates payment
   const handleEnhancedBooking = useCallback(async (paymentRef: string = "") => {
    console.log("🎯 RiderBookingMenu: Handling booking with payment reference:", paymentRef);
    
    try {
      await onBooking(paymentRef);
      
      // If we reach here, booking was successful
      console.log("✅ Booking completed successfully");
      
    } catch (error) {
      console.error("❌ RiderBookingMenu: Enhanced booking failed:", error);
      // Re-throw the error so the EnhancedReviewStep can handle it
      throw error;
    }
  }, [onBooking]);

  // UPDATED: Enhanced data validation check
  const isDataComplete = () => {
    return !!(
      bookId &&
      riderId &&
      pickupLocation &&
      dropoffLocation &&
      userProfile?.email
    );
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
                {currentStep === "review" &&
                !!calculation &&
                calculation.totalPrice > 0 ? (
                  <CreditCard className="h-4 w-4 text-blue-600" />
                ) : currentStep === "complete" && paymentReference ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Package className="h-4 w-4 text-blue-600" />
                )}
                <span>{getButtonText()}</span>
                {/* UPDATED: Show data completeness indicator */}
                {!isDataComplete() && currentStep === "review" && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>

              <div className="h-5 w-px bg-gray-200 mx-1" />

              {/* Tracking button */}
              {bookId && onStartTracking && onStopTracking && (
                <>
                  <button
                    onClick={
                      isTrackingActive ? onStopTracking : onStartTracking
                    }
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
                        : "Track"}
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

              {/* View Bookings button for completed bookings */}
              {currentStep === "complete" && onViewBookings && (
                <>
                  <div className="h-5 w-px bg-gray-200 mx-1" />
                  <button
                    onClick={onViewBookings}
                    className="flex items-center gap-2 text-[12px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View All</span>
                  </button>
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
            className="absolute right-[-10px] transform -translate-x-1/2 bottom-4 sm:left-4 sm:transform-none sm:translate-x-0 z-20 w-[350px] max-w-[90vw] h-[85vh] flex flex-col rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border-0 ring-1 ring-black/5"
          >
            <div className="flex flex-col h-full min-h-0">
              {/* UPDATED: Header with enhanced status badges */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {getStepTitle()}
                  </h2>

                  {/* Enhanced status badges */}
                  {isTrackingActive && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                      Tracking
                    </Badge>
                  )}

                  {currentStep === "review" &&
                    !!calculation &&
                    calculation.totalPrice > 0 && (
                      <Badge
                        variant="default"
                        className="bg-blue-100 text-blue-800 border-blue-200"
                      >
                        <CreditCard className="w-3 h-3 mr-1" />
                        Payment
                      </Badge>
                    )}

                  {currentStep === "complete" && paymentReference && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid
                    </Badge>
                  )}

                  {/* UPDATED: Data completeness indicator */}
                  {currentStep === "review" && !isDataComplete() && (
                    <Badge
                      variant="destructive"
                      className="bg-red-100 text-red-800 border-red-200"
                    >
                      Incomplete
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

                {/* UPDATED: Data validation warning */}
                {currentStep === "review" && !isDataComplete() && (
                  <div className="mb-4">
                    <Card className="border-0 bg-red-50">
                      <CardContent className="p-3">
                        <div className="text-center">
                          <div className="text-red-600 text-sm font-medium mb-1">
                            Missing Information
                          </div>
                          <div className="text-xs text-red-700 space-y-1">
                            {!bookId && <p>• Booking ID missing</p>}
                            {!riderId && <p>• Rider not selected</p>}
                            {!pickupLocation && (
                              <p>• Pickup location not set</p>
                            )}
                            {!dropoffLocation && (
                              <p>• Dropoff location not set</p>
                            )}
                            {!userProfile?.email && (
                              <p>• User profile incomplete</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                        <EnhancedReviewStep
                          calculation={calculation}
                          isBooking={isBooking}
                          onBooking={handleEnhancedBooking}
                          onBack={() => setCurrentStep("locations")}
                          riderProfile={riderProfile}
                          pickupLocation={{
                            address: pickupLocation?.address || "",
                            lat: pickupLocation?.lat || 0,
                            lng: pickupLocation?.lng || 0,
                          }}
                          dropoffLocation={{
                            address: dropoffLocation?.address || "",
                            lat: pickupLocation?.lat || 0,
                            lng: pickupLocation?.lng || 0,
                          }}
                          bookId={bookId}
                          riderId={riderId}
                          userProfileData={userProfile}
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
                          paymentReference={paymentReference}
                          calculation={calculation}
                          riderProfile={riderProfile}
                          onReset={onReset}
                          onViewBookings={onViewBookings}
                          bookId={bookId}
                          isTrackingActive={isTrackingActive}
                          onStartTracking={onStartTracking}
                          onStopTracking={onStopTracking}
                          isLoadingRoute={isLoadingRoute}
                          userProfile={userProfile}
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
                  GHS {zone.price.toFixed(2)}
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

// Enhanced Complete Step with user profile and payment info
function CompleteStepWithTracking({
  bookingReference,
  paymentReference,
  calculation,
  riderProfile,
  onReset,
  onViewBookings,
  bookId,
  isTrackingActive,
  onStartTracking,
  onStopTracking,
  isLoadingRoute,
  userProfile,
}: {
  bookingReference: string | null;
  paymentReference?: string | null;
  calculation: DeliveryCalculation| null ;
  riderProfile: RiderProfile| null ;
  onReset: () => void;
  onViewBookings?: () => void;
  bookId?: string;
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  isLoadingRoute?: boolean;
  userProfile?: {
    id: string;
    email: string;
    name: string;
    number?: string;
    type?: string;
    location?: string;
    dpfile?: string;
  };
}) {
  const [countdown, setCountdown] = useState(5);
  const [showCountdown, setShowCountdown] = useState(true);

  // Countdown effect for success redirect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showCountdown && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showCountdown && countdown === 0) {
      // Auto-redirect after countdown
      handleViewBookings();
    }
    return () => clearTimeout(timer);
  }, [showCountdown, countdown]);

  // Navigation handlers
  const handleViewBookings = useCallback(() => {
    if (onViewBookings) {
      onViewBookings();
    } else {
      window.location.href = '/vob';
    }
  }, [onViewBookings]);

  const handleStopCountdown = useCallback(() => {
    setShowCountdown(false);
    setCountdown(0);
  }, []);

  return (
    <div className="space-y-4">
      {/* Success Animation */}
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-green-900 mb-2">
          🎉 Booking Confirmed!
        </h3>
        <p className="text-sm text-green-700 mb-4">
          {paymentReference 
            ? "Your payment has been processed and booking confirmed successfully!"
            : "Your booking has been confirmed successfully!"
          }
        </p>
      </div>

      {/* Booking Reference */}
      {bookingReference && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="text-center">
              <p className="text-green-600 font-medium text-xs mb-1">Booking Reference</p>
              <p className="font-mono text-sm font-semibold text-green-900 break-all">
                {bookingReference.length > 12 ? bookingReference.slice(0, 12) + "..." : bookingReference}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary (if payment was made) */}
      {paymentReference && (calculation?.totalPrice ?? 0) > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 text-sm">Payment Successful</h4>
              <p className="text-blue-700 font-bold">
                GHS {calculation?.totalPrice.toFixed(2)}
              </p>
              <p className="text-blue-600 text-xs font-mono break-all">
                Ref: {paymentReference.length > 16 ? paymentReference.slice(0, 16) + "..." : paymentReference}
              </p>
              {userProfile?.email && (
                <p className="text-blue-600 text-xs">
                  Receipt sent to {userProfile.email}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Countdown Progress */}
      {showCountdown && countdown > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-3">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Navigation className="h-3 w-3 text-purple-600" />
                <span className="text-purple-800 font-medium text-xs">
                  Redirecting to bookings in {countdown}s...
                </span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-1.5">
                <div 
                  className="bg-purple-600 h-1.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${(5 - countdown) * 20}%` }}
                ></div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleViewBookings}
                  className="text-purple-600 hover:text-purple-700 text-xs px-2 py-1"
                >
                  Go Now
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleStopCountdown}
                  className="text-purple-600 hover:text-purple-700 text-xs px-2 py-1"
                >
                  Stay
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      {calculation && (
        <Card className="border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-900">
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Distance</span>
              <span className="font-medium">{calculation.distance}km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{calculation.duration}</span>
            </div>
            {calculation.matchedZone && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Zone</span>
                <span className="font-medium">
                  {calculation.matchedZone.startKm}km - {calculation.matchedZone.endKm}km
                </span>
              </div>
            )}
            
            <Separator />
            
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-900">Total Price</span>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg text-blue-600">
                  GHS {calculation.totalPrice.toFixed(2)}
                </span>
                {paymentReference && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    Paid
                  </Badge>
                )}
              </div>
            </div>
            
            {calculation.totalPrice === 0 && (
              <p className="text-xs text-center text-green-600 font-medium">
                🎉 Free Delivery!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {riderProfile && (
        <Card className="border-0">
          <CardContent className="p-3">
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
                      .map((n: string) => n[0])
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
      <div className="space-y-2">
        <Button onClick={onReset} className="w-full" size="sm">
          <Package className="w-4 h-4 mr-2" />
          Book Another Delivery
        </Button>

        {/* View All Bookings Button */}
        {onViewBookings && (
          <Button variant="outline" onClick={onViewBookings} className="w-full" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View All Bookings
          </Button>
        )}

        {/* Tracking Button */}
        {bookId && onStartTracking && onStopTracking && (
          <Button
            variant={isTrackingActive ? "destructive" : "outline"}
            className="w-full"
            onClick={isTrackingActive ? onStopTracking : onStartTracking}
            disabled={isLoadingRoute}
            size="sm"
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
