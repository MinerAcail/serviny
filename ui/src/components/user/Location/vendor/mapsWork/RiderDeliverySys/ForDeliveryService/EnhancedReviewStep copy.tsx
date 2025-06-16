// ==========================================
// Fixed Enhanced Review Step with Payment Integration
// ==========================================

import React, { useState, useCallback } from "react";
import { PaystackConsumer } from "react-paystack";
import { toast } from "sonner";
import { CreditCard, Loader2, Package, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Types
interface PaymentCustomField {
    display_name: string;
    variable_name: string;
    value: string;
}

interface PaymentConfig {
    reference: string;
    email: string;
    amount: number;
    currency: string;
    publicKey: string;
    metadata: {
        booking_id?: string;
        rider_id?: string;
        pickup_address?: string;
        dropoff_address?: string;
        distance?: number;
        customer_name?: string;
        order_type?: string;
        custom_fields?: PaymentCustomField[];
    };
}

interface PaymentResponse {
  reference: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

// Generate payment reference function
const generatePaymentReference = (bookId: string): string => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY_${bookId}_${timestamp}_${randomSuffix}`;
};

// Enhanced Review Step with Payment Integration
export function EnhancedReviewStep({
  calculation,
  isBooking,
  onBooking,
  onBack,
  riderProfile,
  pickupLocation,
  dropoffLocation,
  bookId,
  riderId,
  userProfileData,
}: {
  calculation: any;
  isBooking: boolean;
  onBooking: (paymentReference: string) => Promise<void>;
  onBack: () => void;
  riderProfile?: any;
  pickupLocation?: any;
  dropoffLocation?: any;
  bookId?: string;
  riderId?: string;
  userProfileData?: {
    id: string;
    name: string;
    email: string;
    number?: string;
    type?: string;
    location?: string;
    dpfile?: string;
  };
}) {
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Payment configuration
  const paymentConfig: PaymentConfig = {
    reference: generatePaymentReference(bookId || "UNKNOWN"),
    email: userProfileData?.email || "customer@example.com",
    amount: Math.round(calculation.totalPrice * 100), // Convert to pesewas
    currency: "GHS",
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_87e7e8a9aa01c5a12d634eafd861e9736b2c4c80",
    metadata: {
      booking_id: bookId,
      rider_id: riderId,
      pickup_address: pickupLocation?.address,
      dropoff_address: dropoffLocation?.address,
      distance: calculation.distance,
      customer_name: userProfileData?.name,
      order_type: "delivery_booking",
      custom_fields: [
        {
          display_name: "Booking ID",
          variable_name: "booking_id",
          value: bookId || "",
        },
        {
          display_name: "Rider ID",
          variable_name: "rider_id",
          value: riderId || "",
        },
        {
          display_name: "Customer ID",
          variable_name: "customer_id",
          value: userProfileData?.id || "",
        },
        {
          display_name: "Customer Phone",
          variable_name: "customer_phone",
          value: userProfileData?.number || "",
        },
        {
          display_name: "Pickup Address",
          variable_name: "pickup_address",
          value: pickupLocation?.address || "",
        },
        {
          display_name: "Dropoff Address",
          variable_name: "dropoff_address",
          value: dropoffLocation?.address || "",
        },
        {
          display_name: "Distance (km)",
          variable_name: "distance",
          value: calculation.distance?.toString() || "",
        },
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: userProfileData?.name || "",
        },
      ],
    },
  };

  // Payment success handler
  const handlePaymentSuccess = useCallback(async (response: PaymentResponse) => {
    console.log("💳 Payment successful:", response);
    setIsProcessingPayment(true);

    try {
      // Call the booking function with payment reference
      await onBooking(response.reference);
      
      toast.success("Payment & Booking Confirmed!", {
        description: `Paid GHS ${calculation.totalPrice.toFixed(2)} • Booking confirmed`,
        duration: 5000,
      });
    } catch (error) {
      console.error("❌ Booking failed after payment:", error);
      toast.error("Payment successful but booking failed", {
        description: "Please contact support with reference: " + response.reference,
        duration: 10000,
      });
    } finally {
      setIsProcessingPayment(false);
      setShowPayment(false);
    }
  }, [onBooking, calculation.totalPrice]);

  // Payment cancellation handler
  const handlePaymentClose = useCallback(() => {
    console.log("❌ Payment cancelled by user");
    setShowPayment(false);
    toast.info("Payment cancelled", {
      description: "Your booking was not confirmed",
    });
  }, []);

  // Handle confirm booking button click
  const handleConfirmBooking = useCallback(() => {
    if (calculation.totalPrice <= 0) {
      // Free delivery - skip payment
      console.log("🆓 Free delivery - skipping payment");
      onBooking("");
      return;
    }
    
    // Check if user profile is available for payment
    if (!userProfileData?.email) {
      toast.error("User information required for payment", {
        description: "Please ensure you are logged in",
      });
      return;
    }
    
    // Show payment modal
    console.log("💳 Showing payment modal for GHS", calculation.totalPrice);
    setShowPayment(true);
  }, [calculation.totalPrice, onBooking, userProfileData]);

  if (showPayment) {
    return (
      <div className="space-y-4">
        {/* Payment Modal */}
        <PaymentModal
          config={paymentConfig}
          calculation={calculation}
          riderProfile={riderProfile}
          userProfileData={userProfileData}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
          onBack={() => setShowPayment(false)}
          isProcessing={isProcessingPayment}
        />
      </div>
    );
  }

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
                GHS {calculation.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Total Price</div>
            </div>
          </div>

          {/* Customer Info */}
          {userProfileData && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-xs font-medium text-gray-900">
                  Customer Details
                </span>
              </div>
              <p className="text-xs text-gray-800">
                {userProfileData.name} • {userProfileData.email}
              </p>
              {userProfileData.number && (
                <p className="text-xs text-gray-600 mt-0.5">
                  Phone: {userProfileData.number}
                </p>
              )}
            </div>
          )}

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

          {/* Payment Info */}
          {calculation.totalPrice > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CreditCard className="h-3 w-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-900">
                  Payment Required
                </span>
              </div>
              <p className="text-xs text-yellow-800">
                Secure payment via Paystack • GHS {calculation.totalPrice.toFixed(2)}
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
          disabled={isBooking || isProcessingPayment}
        >
          Back
        </Button>
        <Button 
          onClick={handleConfirmBooking} 
          disabled={isBooking || isProcessingPayment} 
          className="flex-1"
        >
          {isBooking || isProcessingPayment ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isProcessingPayment ? "Processing..." : "Booking..."}
            </>
          ) : calculation.totalPrice > 0 ? (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay & Confirm (GHS {calculation.totalPrice.toFixed(2)})
            </>
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              Confirm Booking (Free)
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// Payment Modal Component
function PaymentModal({
  config,
  calculation,
  riderProfile,
  userProfileData,
  onSuccess,
  onClose,
  onBack,
  isProcessing,
}: {
  config: PaymentConfig;
  calculation: any;
  riderProfile?: any;
  userProfileData?: any;
  onSuccess: (response: PaymentResponse) => void;
  onClose: () => void;
  onBack: () => void;
  isProcessing: boolean;
}) {
  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Complete Payment
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onBack}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Payment Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Amount</span>
            <span className="text-xl font-bold text-blue-600">
              GHS {calculation.totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Distance: {calculation.distance}km • Duration: {calculation.duration}
          </div>
        </div>

        {/* Customer Info */}
        {userProfileData && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {userProfileData.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{userProfileData.name}</p>
              <p className="text-xs text-gray-500">{userProfileData.email}</p>
            </div>
          </div>
        )}

        {/* Rider Info */}
        {riderProfile && (
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-green-600">
                {riderProfile.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{riderProfile.name}</p>
              <p className="text-xs text-gray-500">Your delivery rider</p>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method</span>
            <div className="flex items-center space-x-1">
              <CreditCard className="h-3 w-3 text-gray-500" />
              <span>Paystack</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Reference</span>
            <span className="font-mono text-xs">{config.reference.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Currency</span>
            <span>Ghana Cedis (GHS)</span>
          </div>
        </div>

        <Separator />

        {/* Payment Button */}
        {isProcessing ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Processing payment & booking...</p>
          </div>
        ) : (
          <PaystackConsumer {...config}>
            {({ initializePayment }) => (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    console.log("🚀 Initializing Paystack payment:", config);
                    initializePayment(onSuccess, onClose);
                  }}
                  className="w-full py-3"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay GHS {calculation.totalPrice.toFixed(2)} Now
                </Button>
                
                <p className="text-xs text-center text-gray-500">
                  Secure payment powered by Paystack
                </p>
              </div>
            )}
          </PaystackConsumer>
        )}

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-800">Secure Payment</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Your payment information is encrypted and secure
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced booking handler hook (to be used in parent component)
export const useEnhancedBookingWithPayment = () => {
  
  const handleBookingWithPayment = useCallback(async (
    paymentReference: string,
    calculation: any,
    pickupLocation: any,
    dropoffLocation: any,
    riderId: string,
    bookId: string,
    userProfile: { email: string; name: string } | undefined,
    updateBookingWithLocationMutation: (input: any) => Promise<any>
  ) => {
    if (!calculation || !pickupLocation || !dropoffLocation || !riderId || !bookId) {
      toast.error("Missing required booking information");
      throw new Error("Missing required booking information");
    }

    try {
      console.log("📦 Starting enhanced booking with payment:", {
        bookId,
        paymentReference,
        amount: calculation.totalPrice,
        hasPayment: !!paymentReference,
      });

      const input = {
        bookId,
        deliveryAddress: dropoffLocation.address,
        dropoffLocation: [dropoffLocation.lng, dropoffLocation.lat],
        pickupLocation: [pickupLocation.lng, pickupLocation.lat],
        ridersId: riderId,
        
        // Payment integration
        paymentReference: paymentReference || undefined,
        paymentStatus: paymentReference ? "paid" : "pending",
        paymentAmount: Math.round(calculation.totalPrice * 100), // Convert to pesewa
        customerEmail: userProfile?.email,
        customerName: userProfile?.name,
        
        // Range metadata if available
        ...(calculation.matchedZone?.id && {
          rangeMetaId: calculation.matchedZone.id,
        }),
      };

      console.log("📦 Enhanced booking input:", input);

      const updatedBooking = await updateBookingWithLocationMutation(input);

      console.log("✅ Enhanced booking successful:", updatedBooking);

      // Show appropriate success message based on payment
      if (paymentReference) {
        toast.success("Payment & Booking Confirmed!", {
          description: `Paid GHS ${calculation.totalPrice.toFixed(2)} • Booking confirmed`,
          duration: 5000,
        });
      } else {
        toast.success("Booking Confirmed!", {
          description: `Free delivery • Booking confirmed`,
          duration: 5000,
        });
      }

      return updatedBooking;
    } catch (error) {
      console.error("❌ Enhanced booking failed:", error);
      
      // Enhanced error handling
      let errorMessage = "Failed to complete booking. Please try again.";
      
      if (paymentReference) {
        errorMessage = "Payment successful but booking failed. Please contact support.";
        toast.error(errorMessage, {
          description: "Reference: " + paymentReference,
          duration: 10000,
        });
      } else {
        if (
          typeof error === "object" &&
          error !== null &&
          "graphQLErrors" in error &&
          Array.isArray((error as any).graphQLErrors) &&
          (error as any).graphQLErrors.length > 0
        ) {
          errorMessage = (error as any).graphQLErrors[0].message;
        } else if (
          typeof error === "object" &&
          error !== null &&
          "networkError" in error
        ) {
          errorMessage = "Network error - please check your connection";
        }
        
        toast.error(errorMessage, { duration: 5000 });
      }
      
      throw error;
    }
  }, []);

  // Handle free bookings (no payment required)
  const handleFreeBooking = useCallback(async (
    calculation: any,
    pickupLocation: any,
    dropoffLocation: any,
    riderId: string,
    bookId: string,
    userProfile: { email: string; name: string } | undefined,
    updateBookingWithLocationMutation: (input: any) => Promise<any>
  ) => {
    return handleBookingWithPayment(
      "", // Empty payment reference for free bookings
      calculation,
      pickupLocation,
      dropoffLocation,
      riderId,
      bookId,
      userProfile,
      updateBookingWithLocationMutation
    );
  }, [handleBookingWithPayment]);

  return {
    handleBookingWithPayment,
    handleFreeBooking,
  };
};