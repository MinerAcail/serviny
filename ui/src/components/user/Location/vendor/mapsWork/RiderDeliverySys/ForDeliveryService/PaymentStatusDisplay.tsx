import React, { useState, useEffect, useCallback } from "react";
import { PaystackConsumer } from "react-paystack";
import { toast } from "sonner";
import { 
  CreditCard, 
  Loader2, 
  Package, 
  CheckCircle, 
  X, 
  AlertCircle, 
  RefreshCw,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Enhanced Payment Status Component
function PaymentStatusDisplay({ 
  status, 
  paymentReference, 
  bookingReference, 
  calculation, 
  error, 
  countdown, 
  onRetry, 
  onViewBookings,
  onNewBooking 
}) {
  if (status === "success") {
    return (
      <div className="space-y-4">
        {/* Success Animation */}
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-green-700 mb-4">
            Your booking has been confirmed and payment processed successfully.
          </p>
        </div>

        {/* Payment Details */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600 font-medium">Amount Paid</p>
                <p className="text-green-900 font-bold text-lg">
                  GHS {(calculation?.totalPrice || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-green-600 font-medium">Payment Method</p>
                <p className="text-green-900">Paystack</p>
              </div>
              {paymentReference && (
                <div className="col-span-2">
                  <p className="text-green-600 font-medium">Payment Reference</p>
                  <p className="text-green-900 font-mono text-xs break-all">
                    {paymentReference}
                  </p>
                </div>
              )}
              {bookingReference && (
                <div className="col-span-2">
                  <p className="text-green-600 font-medium">Booking ID</p>
                  <p className="text-green-900 font-mono text-xs break-all">
                    {bookingReference}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Countdown Progress */}
        {countdown > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800 font-medium">
                    Redirecting to your bookings in {countdown} seconds...
                  </span>
                </div>
                <Progress 
                  value={(5 - countdown) * 20} 
                  className="w-full h-2"
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onViewBookings}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Go Now
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={onNewBooking}
            className="w-full"
          >
            <Package className="w-4 h-4 mr-2" />
            New Booking
          </Button>
          <Button 
            onClick={onViewBookings}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            View All Bookings
          </Button>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="space-y-4">
        {/* Failure Display */}
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-red-700 mb-4">
            We couldn't process your payment. Please try again.
          </p>
        </div>

        {/* Error Details */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium mb-1">Error Details</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Booking Details (still valid) */}
        {calculation && (
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-900">
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance</span>
                  <span className="font-medium">{calculation.distance}km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{calculation.duration}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span className="text-blue-600">GHS {calculation.totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Retry Actions */}
        <div className="space-y-3">
          <Button 
            onClick={onRetry} 
            className="w-full"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Payment Again
          </Button>
          <Button 
            variant="outline" 
            onClick={onNewBooking}
            className="w-full"
          >
            Start Over
          </Button>
        </div>

        {/* Help Text */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium mb-2">Need Help?</p>
              <p>
                If you continue to experience issues, please check your card details 
                or try a different payment method.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Enhanced Review Step with Payment Status Management
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
}) {
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  
  // Enhanced state management
  const [paymentStatus, setPaymentStatus] = useState("pending"); // "pending", "processing", "success", "failed"
  const [paymentReference, setPaymentReference] = useState(null);
  const [bookingReference, setBookingReference] = useState(null);
  const [countdown, setCountdown] = useState(0);

  // Check if payment is required
  const requiresPayment = calculation?.totalPrice > 0;

  // Payment configuration
  const paymentConfig = {
    reference: generatePaymentReference(bookId || "UNKNOWN"),
    email: userProfileData?.email || "customer@example.com",
    amount: Math.round((calculation?.totalPrice || 0) * 100),
    currency: "GHS",
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_87e7e8a9aa01c5a12d634eafd861e9736b2c4c80",
    metadata: {
      booking_id: bookId,
      rider_id: riderId,
      pickup_address: pickupLocation?.address,
      dropoff_address: dropoffLocation?.address,
      distance: calculation?.distance,
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
          display_name: "Delivery Address",
          variable_name: "delivery_address",
          value: dropoffLocation?.address || "",
        },
        {
          display_name: "Range Meta ID",
          variable_name: "range_meta_id",
          value: calculation?.matchedZone?.id || "",
        },
        {
          display_name: "Pickup Location",
          variable_name: "pickup_location",
          value: pickupLocation ? JSON.stringify([pickupLocation.lng, pickupLocation.lat]) : "",
        },
        {
          display_name: "Dropoff Location", 
          variable_name: "dropoff_location",
          value: dropoffLocation ? JSON.stringify([dropoffLocation.lng, dropoffLocation.lat]) : "",
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
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: userProfileData?.name || "",
        },
        {
          display_name: "Distance",
          variable_name: "distance",
          value: calculation?.distance?.toString() || "",
        },
      ],
    },
  };

  // Countdown effect for success redirect
  useEffect(() => {
    let timer;
    if (paymentStatus === "success" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (paymentStatus === "success" && countdown === 0) {
      // Auto-redirect after countdown
      handleViewBookings();
    }
    return () => clearTimeout(timer);
  }, [paymentStatus, countdown]);

  // Payment success handler
  const handlePaymentSuccess = useCallback(async (response) => {
    console.log("💳 Payment successful:", response);
    setIsProcessingPayment(true);
    setPaymentError(null);
    setPaymentStatus("processing");

    try {
      // Call the booking function with payment reference
      await onBooking(response.reference);
      
      // Set success state
      setPaymentStatus("success");
      setPaymentReference(response.reference);
      setBookingReference(bookId);
      setCountdown(5); // Start 5-second countdown
      
      toast.success("Payment & Booking Confirmed!", {
        description: `Paid GHS ${calculation.totalPrice.toFixed(2)} • Booking confirmed`,
        duration: 5000,
      });

      // Close payment modal
      setShowPayment(false);
    } catch (error) {
      console.error("❌ Booking failed after payment:", error);
      setPaymentStatus("failed");
      setPaymentError("Payment successful but booking failed. Please contact support.");
      toast.error("Payment successful but booking failed", {
        description: "Please contact support with reference: " + response.reference,
        duration: 10000,
      });
    } finally {
      setIsProcessingPayment(false);
    }
  }, [onBooking, calculation?.totalPrice, bookId]);

  // Payment cancellation handler
  const handlePaymentClose = useCallback(() => {
    console.log("❌ Payment cancelled by user");
    setShowPayment(false);
    setPaymentError(null);
    setPaymentStatus("pending");
    toast.info("Payment cancelled", {
      description: "Your booking was not confirmed",
    });
  }, []);

  // Handle confirm booking button click
  const handleConfirmBooking = useCallback(() => {
    setPaymentError(null);
    setPaymentStatus("pending");

    if (!requiresPayment) {
      // Free delivery - skip payment
      console.log("🆓 Free delivery - skipping payment");
      handleFreeBooking();
      return;
    }
    
    // Validation checks...
    if (!userProfileData?.email) {
      setPaymentError("User information required for payment. Please ensure you are logged in.");
      toast.error("User information required for payment");
      return;
    }

    if (!bookId || !riderId || !pickupLocation || !dropoffLocation) {
      setPaymentError("Missing required booking information.");
      toast.error("Missing booking information");
      return;
    }

    if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
      setPaymentError("Payment system not configured. Please contact support.");
      toast.error("Payment system not configured");
      return;
    }
    
    // Show payment modal
    console.log("💳 Showing payment modal for GHS", calculation.totalPrice);
    setShowPayment(true);
  }, [requiresPayment, userProfileData, bookId, riderId, pickupLocation, dropoffLocation, calculation?.totalPrice]);

  // Handle free booking
  const handleFreeBooking = useCallback(async () => {
    setIsProcessingPayment(true);
    try {
      await onBooking("");
      setPaymentStatus("success");
      setBookingReference(bookId);
      setCountdown(5);
      toast.success("Free Booking Confirmed!");
    } catch (error) {
      setPaymentStatus("failed");
      setPaymentError("Failed to confirm booking. Please try again.");
      toast.error("Booking failed");
    } finally {
      setIsProcessingPayment(false);
    }
  }, [onBooking, bookId]);

  // Retry handler for failed payments
  const handleRetry = useCallback(() => {
    setPaymentError(null);
    setPaymentStatus("pending");
    setShowPayment(false);
    setPaymentReference(null);
    setBookingReference(null);
    setCountdown(0);
  }, []);

  // Navigation handlers
  const handleViewBookings = useCallback(() => {
    window.location.href = "/books";
  }, []);

  const handleNewBooking = useCallback(() => {
    window.location.reload();
  }, []);

  // If we have a definitive status, show the status display
  if (paymentStatus === "success" || paymentStatus === "failed") {
    return (
      <div className="space-y-4">
        <PaymentStatusDisplay
          status={paymentStatus}
          paymentReference={paymentReference}
          bookingReference={bookingReference}
          calculation={calculation}
          error={paymentError}
          countdown={countdown}
          onRetry={handleRetry}
          onViewBookings={handleViewBookings}
          onNewBooking={handleNewBooking}
        />
      </div>
    );
  }

  // Show payment modal
  if (showPayment) {
    return (
      <div className="space-y-4">
        <PaymentModal
          config={paymentConfig}
          calculation={calculation}
          riderProfile={riderProfile}
          userProfileData={userProfileData}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentClose}
          onBack={() => setShowPayment(false)}
          isProcessing={isProcessingPayment}
          error={paymentError}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Show main review interface
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
                  {calculation?.pickupLocation?.address || pickupLocation?.address}
                </p>
              </div>
            </div>

            <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />

            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">DROP-OFF</p>
                <p className="text-sm text-gray-900 truncate">
                  {calculation?.dropoffLocation?.address || dropoffLocation?.address}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {calculation?.distance || 0}km
              </div>
              <div className="text-xs text-gray-500">Distance</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">
                {calculation?.duration || "N/A"}
              </div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">
                GHS {(calculation?.totalPrice || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Total Price</div>
            </div>
          </div>

          {/* Payment Status Info */}
          {requiresPayment ? (
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
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium text-green-900">
                  Free Delivery
                </span>
              </div>
              <p className="text-xs text-green-800">
                No payment required for this delivery
              </p>
            </div>
          )}

          {/* Error Display */}
          {paymentError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span className="text-xs font-medium text-red-900">
                  Error
                </span>
              </div>
              <p className="text-xs text-red-800">{paymentError}</p>
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
          disabled={isBooking || isProcessingPayment || paymentStatus === "processing"}
        >
          Back
        </Button>
        <Button 
          onClick={handleConfirmBooking} 
          disabled={
            isBooking || 
            isProcessingPayment || 
            paymentStatus === "processing" ||
            !bookId || 
            !riderId || 
            !pickupLocation || 
            !dropoffLocation
          } 
          className="flex-1"
        >
          {isBooking || isProcessingPayment || paymentStatus === "processing" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {paymentStatus === "processing" ? "Processing..." : "Booking..."}
            </>
          ) : requiresPayment ? (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay & Confirm (GHS {calculation?.totalPrice?.toFixed(2) || "0.00"})
            </>
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              Confirm Booking (Free)
            </>
          )}
        </Button>
      </div>

      {/* Retry Button for Payment Errors */}
      {paymentError && paymentStatus === "pending" && (
        <Button 
          variant="outline" 
          onClick={handleRetry}
          className="w-full"
          disabled={isBooking || isProcessingPayment}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

// Generate payment reference function
const generatePaymentReference = (bookId) => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY_${bookId}_${timestamp}_${randomSuffix}`;
};

// Payment Modal Component (keeping the existing one but with small enhancements)
function PaymentModal({
  config,
  calculation,
  riderProfile,
  userProfileData,
  onSuccess,
  onClose,
  onBack,
  isProcessing,
  error,
  onRetry,
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
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Payment Error</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2"
              >
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Payment Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Total Amount</span>
            <span className="text-xl font-bold text-blue-600">
              GHS {(calculation?.totalPrice || 0).toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-gray-600">
            Distance: {calculation?.distance || 0}km • Duration: {calculation?.duration || "N/A"}
          </div>
          <div className="text-xs text-blue-600 mt-1 font-mono">
            Ref: {config.reference.slice(-12)}
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

        <Separator />

        {/* Payment Button or Processing State */}
        {isProcessing ? (
          <div className="text-center py-4">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600">Processing payment & booking...</p>
            <p className="text-xs text-gray-500 mt-1">Please do not close this window</p>
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
                  disabled={!!error}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay GHS {(calculation?.totalPrice || 0).toFixed(2)} Now
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
            Your payment information is encrypted and secure. We never store your card details.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}