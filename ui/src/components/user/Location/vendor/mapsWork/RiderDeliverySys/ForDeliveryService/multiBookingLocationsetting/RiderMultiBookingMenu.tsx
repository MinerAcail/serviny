// ==========================================
// RiderMultiBookingMenu - Dialog Component
// ==========================================

"use client";

import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/middleware/context/authContext";

// Import simplified cargo hook
import {
  useCargoData,
  getCargoTypeLabel,
  useCargoParams,
} from "../cargoDataQuery";

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
  OrderDetails,
  GetRequestItem,
} from "../riderBookingHooks";

// Import multi-delivery types
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest";
import { default as OrderPaymentModal } from "../../../payment-modal";
import PaymentModal from "../payment-modal";
import { vendorData } from "./MultiLocationInputDialog";

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
  onOrder: () => void;
  onRequest: () => void;

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
  orderData?: OrderDetails | null; // NEW: Order data for orders
  isOrder?: boolean; // NEW: Optional prop to indicate if this is an order
  vendorData?: vendorData;
  requestData?: GetRequestItem;
  isRequest?: boolean;
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
  onOrder,
  onRequest,
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
  orderData = null,
  isOrder = false, // NEW: Optional prop to indicate if this is an order
  vendorData, // NEW: Vendor data for orders
  isRequest,
  requestData,
}: RiderMultiBookingMenuProps) {
  const { user } = useAuth();

  // Get cargo parameters from URL
  const { isCargo, cargoType: urlCargoType, splitCargo } = useCargoParams();

  // Fetch actual cargo data from database
  const {
    cargoData,
    isLoading: cargoLoading,
    error: cargoError,
    primaryTransportType,
    allTransportTypes,
    hasMultipleVehicleTypes,
    totalCargoCount,
  } = useCargoData(bookId);

  // Use database cargo type if available, otherwise fall back to URL parameter
  const actualCargoType = primaryTransportType || urlCargoType;
  // console.log("Actual Cargo Type:", actualCargoType);

  // Payment modal state - but don't show for cargo
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState<any>(null);

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
          return "Setup Delivery";
        case "review":
          return "Review Delivery";
        case "complete":
          return "Delivery Complete";
        default:
          return "Delivery Booking";
      }
    }
  };

  // Calculate completed items for display
  const completedItems = deliveryItems.filter(
    (item) =>
      item.deliveryAddress &&
      item.itemDescription &&
      item.dropoffLocation[0] !== 0 &&
      item.dropoffLocation[1] !== 0
  );

  // Handle payment completion (for non-cargo only)
  const handlePaymentComplete = (paymentData: any) => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);

    toast.success(
      `Payment successful! Method: ${paymentData.method.toUpperCase()}`,
      {
        description: `Amount: GH₵${paymentData.amount.toFixed(2)}`,
      }
    );

    // Proceed with booking after payment
    setTimeout(() => {
      if (isOrder) {
        onOrder();
      } else if (isRequest) {
        // Handle requests
        onRequest();
      } else {
        // Handle regular bookings
        onBooking();
      }
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
    const description =
      completedItems.length === 1
        ? `Delivery: ${firstItem?.itemDescription || "Item"}`
        : `Multi-delivery: ${completedItems.length} destinations`;

    return {
      id: bookId,
      amount: totalCalculations.totalPrice,
      description,
      vendor: riderProfile.name || "Multi-Delivery Service",
    };
  };

  const calculateOrderDataTotalPrice = () => {
    if (!orderData || !orderData.items) return 0;
    return orderData.items.reduce((total, item) => {
      return total + (item.product?.price || 0) * item.quantity;
    }, 0);
  };
  // calculateOrderDataItemsCount
  const calculateOrderDataItemsCount = () => {
    if (!orderData || !orderData.items) return 0;
    return orderData.items.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  };
  const calculateRequestDataTotalPrice = () => {
    if (!requestData) return 0;

    const price =
      typeof requestData.price === "string"
        ? parseFloat(requestData.price)
        : requestData.price;
    const quantity =
      typeof requestData.quantity === "string"
        ? parseInt(requestData.quantity)
        : requestData.quantity;

    //      return parseFloat(
    //   (
    //     Number(requestData?.price) *
    //     Number(requestData?.quantity || 0)
    //   ).toFixed(2)
    // );
    return price * quantity;
  };

  // const calculateSelectedRequestItemTotalPrice = (selectedItem:ServiceData) => {
  //   if (
  //     !selectedItem ||
  //     selectedItem.type !== "REQUESTITEM" ||
  //     !selectedItem.requestItemData
  //   )
  //     return 0;

  //   const requestItemData = selectedItem.requestItemData;
  //   if (!requestItemData.requestItem) return 0;

  // return parseFloat(
  //   (
  //     Number(requestItemData?.requestItem?.price) *
  //     Number(requestItemData?.requestItem?.quantity || 0)
  //   ).toFixed(2)
  // );
  // };
  const totalItemsPrice = isRequest
    ? calculateRequestDataTotalPrice()
    : calculateOrderDataTotalPrice();
  // FIXED: Payment and confirm handler based on working version
  const handlePaymentAndConfirm = () => {
    // Calculate totals
    // const { zonePriceCalculated } = getDeliveryZonePriceAndOrderDetails();
    // const itemsTotal = calculateItemsTotal();
    // const totalAmount = itemsTotal + zonePriceCalculated;

    // Create payment order details
    const paymentDetails = {
      id: !isRequest ? orderData?.id : requestData?.id,
      amount: totalItemsPrice + (totalCalculations?.totalPrice || 0),
      description: `Order delivery from ${
        vendorData?.location.split(",")[0] || "Store"
      } to ${
        deliveryItems[0].deliveryAddress.split(",")[0] || "Your location"
      }`,
      vendor: vendorData?.name,
      itemsTotal: totalItemsPrice,
      deliveryFee: totalCalculations?.totalPrice || 0,
    };

    setPaymentOrderDetails(paymentDetails);
    setShowPaymentModal(true);
  };
  return (
    <div className="w-full h-full">
      {/* Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full h-full max-h-none max-w-none flex flex-col p-0 gap-0">
          {/* Enhanced Header with cargo info */}
          <DialogHeader
            className={`p-4 border-b border-gray-100 ${
              isCargo
                ? "bg-gradient-to-r from-orange-50 to-amber-50"
                : "bg-gradient-to-r from-blue-50 to-indigo-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCargo ? "bg-orange-100" : "bg-blue-100"
                  }`}
                >
                  {isCargo ? (
                    <Truck className="h-4 w-4 text-orange-600" />
                  ) : (
                    <Package className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    {getStepTitle()}
                  </DialogTitle>
                  {deliveryItems.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {completedItems.length}/{deliveryItems.length}{" "}
                      destinations ready
                      {isCargo &&
                        actualCargoType &&
                        ` • ${getCargoTypeLabelForDisplay(actualCargoType)}`}
                      {isCargo &&
                        hasMultipleVehicleTypes &&
                        ` • ${allTransportTypes.length} vehicle types`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isTrackingActive && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Tracking
                  </Badge>
                )}
                {/* Cargo delivery indicator */}
                {isCargo && (
                  <Badge
                    variant="default"
                    className="bg-orange-100 text-orange-800 border-orange-200"
                  >
                    <Truck className="w-3 h-3 mr-1" />
                    Cargo
                  </Badge>
                )}
                {/* Payment status indicator (non-cargo only) */}
                {!isCargo && paymentCompleted && currentStep === "review" && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Paid
                  </Badge>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Content area with scrolling */}
          <div className="flex-1 overflow-y-auto p4 min-h-0 w-full h-full">
            {/* Rider Profile Section - Always visible */}
            {riderProfile && (
              <div className="mb-6">
                <RiderProfileCard
                  riderProfile={riderProfile}
                  isCargo={isCargo}
                />
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
                    <MultiLocationStep
                      isCargo={isCargo}
                      cargoType={actualCargoType}
                    />
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
                      onBooking={handlePaymentAndConfirm}
                      onBack={() => setCurrentStep("locations")}
                      paymentCompleted={paymentCompleted}
                      isCargo={isCargo}
                      cargoType={actualCargoType}
                      splitCargo={splitCargo}
                      userPhone={user?.number || ""}
                      cargoLoading={cargoLoading}
                      hasMultipleVehicleTypes={hasMultipleVehicleTypes}
                      allTransportTypes={allTransportTypes}
                      orderData={orderData}
                      isOrder={isOrder}
                      requestData={requestData}
                      isRequest={isRequest}
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
          <div className="border-t border-gray-100 p-1 bg-white/95">
            <MultiStepNavigation
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              hasCalculations={!!totalCalculations}
              isBookingComplete={bookingComplete}
              isCargo={isCargo}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal for non-cargo deliveries only */}
      {!isOrder && createOrderDetails() && !isRequest && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderDetails={createOrderDetails()!}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
      {(isOrder || isRequest) && (
        <OrderPaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          orderDetails={paymentOrderDetails}
          onPaymentComplete={handlePaymentComplete}
          vendorData={vendorData}
          isRequest={isRequest}
          // requestData={requestData}
        />
      )}
    </div>
  );
}
