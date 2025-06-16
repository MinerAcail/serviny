"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CreditCard,
  Smartphone,
  Copy,
  Check,
  Clock,
  Shield,
  AlertCircle,
  Banknote,
  QrCode,
  Phone,
  MapPin,
  Navigation,
  Package,
  User,
  Star,
  Truck,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

// Enhanced interfaces combining both components
interface CartItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
}

interface DeliveryLocation {
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: { lat: number; lng: number };
  instructions?: string;
}

interface Rider {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  phone: string;
  vehicleType: string;
  estimatedArrival: string;
  isOnline: boolean;
}

interface PaymentModalCheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderDetails: {
    id: string;
    amount: number;
    description: string;
    vendor: string;
  };
  // Enhanced checkout data (optional)
  checkoutData?: {
    items?: CartItem[];
    deliveryLocation?: DeliveryLocation;
    rider?: Rider;
    deliveryFee?: number;
    serviceFee?: number;
    tax?: number;
    discount?: number;
    estimatedDeliveryTime?: string;
    deliveryDistance?: string;
    deliveryDuration?: string;
  };
  onPaymentComplete: (paymentData: PaymentResult) => void;
  mode?: "simple" | "detailed"; // Simple = just payment, Detailed = full checkout view
  title?: string;
}

interface PaymentResult {
  method: "cash" | "momo";
  referenceCode?: string;
  phoneNumber?: string;
  amount: number;
  orderId: string;
  timestamp: string;
}

type PaymentMethod = "cash" | "momo" | null;

export default function PaymentModalCheckoutDialog({
  open,
  onOpenChange,
  orderDetails,
  checkoutData,
  onPaymentComplete,
  mode = "simple",
  title,
}: PaymentModalCheckoutDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referenceCode, setReferenceCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<
    "select" | "details" | "processing" | "success" | "redirecting"
  >("select");
  const [copied, setCopied] = useState(false);
  const [redirectProgress, setRedirectProgress] = useState(0);

  const navigate = useNavigate();

  // Generate reference code for MoMo payments
  const generateReferenceCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MOMO${timestamp}${random}`;
  };

  // Reset modal state when opened
  useEffect(() => {
    if (open) {
      setSelectedMethod(null);
      setPhoneNumber("");
      setReferenceCode("");
      setIsProcessing(false);
      setPaymentStep("select");
      setCopied(false);
      setRedirectProgress(0);
    }
  }, [open]);

  // Handle redirect with progress bar after success
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (paymentStep === "redirecting") {
      console.log("Redirecting state activated");

      progressInterval = setInterval(() => {
        setRedirectProgress((prev) => {
          const newProgress = prev + 2;
          console.log("Progress:", newProgress);

          if (newProgress >= 100) {
            console.log("Redirecting to /vob");
            navigate("/vob");
            setTimeout(() => {
              onOpenChange(false);
            }, 100);
            return 100;
          }
          return newProgress;
        });
      }, 50);
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [paymentStep, navigate, onOpenChange]);

  // Handle payment method selection
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method === "momo") {
      setReferenceCode(generateReferenceCode());
    }
    setPaymentStep("details");
  };

  // Handle payment processing
  const handlePayment = async () => {
    if (
      selectedMethod === "momo" &&
      (!phoneNumber || phoneNumber.length < 10)
    ) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsProcessing(true);
    setPaymentStep("processing");

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const paymentResult: PaymentResult = {
        method: selectedMethod!,
        referenceCode: selectedMethod === "momo" ? referenceCode : undefined,
        phoneNumber: selectedMethod === "momo" ? phoneNumber : undefined,
        amount: orderDetails.amount,
        orderId: orderDetails.id,
        timestamp: new Date().toISOString(),
      };

      // Complete payment callback first
      onPaymentComplete(paymentResult);

      // Show success state
      setPaymentStep("success");
      setIsProcessing(false);

      // Wait 2 seconds to show success message, then start redirecting
      setTimeout(() => {
        console.log("Starting redirect state");
        setPaymentStep("redirecting");
        setRedirectProgress(0);
      }, 2000);
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      setPaymentStep("select");
      toast.error("Payment failed. Please try again.");
    }
  };

  // Copy reference code to clipboard
  const copyReferenceCode = async () => {
    try {
      await navigator.clipboard.writeText(referenceCode);
      setCopied(true);
      toast.success("Reference code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy reference code");
    }
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate totals if detailed mode
  const calculateTotals = () => {
    if (!checkoutData?.items)
      return { subtotal: 0, total: orderDetails.amount };

    const subtotal = checkoutData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryFee = checkoutData.deliveryFee || 0;
    const serviceFee = checkoutData.serviceFee || 0;
    const tax = checkoutData.tax || 0;
    const discount = checkoutData.discount || 0;
    const total = subtotal + deliveryFee + serviceFee + tax - discount;

    return { subtotal, deliveryFee, serviceFee, tax, discount, total };
  };

  const { subtotal, deliveryFee, serviceFee, tax, discount, total } =
    calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-3xl bg-white/70 border border-white/40 rounded-3xl p-0 w-[95vw] max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header with frosted glass effect */}
        <DialogHeader className="p-4 pb-3 backdrop-blur-2xl bg-white/80 border-b border-gray-200/30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title ||
                  (mode === "detailed"
                    ? "Order Checkout & Payment"
                    : "Choose Payment Method")}
              </DialogTitle>
              {mode === "detailed" && (
                <p className="text-sm text-gray-600 mt-0.5">
                  Review order and complete payment
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="px-4 pb-4">
            {/* Success Alert for confirmation */}
            {mode === "detailed" && paymentStep === "select" && (
              <Alert className="bg-green-50 border-green-200 py-2 mb-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm font-medium">
                  Order location updated successfully! Complete payment to
                  finalize.
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Order Items (only in detailed mode) */}
            {mode === "detailed" &&
              checkoutData?.items &&
              checkoutData.items.length > 0 &&
              paymentStep === "select" && (
                <div className="space-y-3 mb-4">
                  <div className="space-y-2">
                    {checkoutData.items.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-gray-50/70 rounded-lg border border-gray-100/50 backdrop-blur-sm"
                      >
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={
                              item.image ||
                              "/placeholder.svg?height=40&width=40"
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-sm">
                            {formatAmount(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {checkoutData.items.length > 3 && (
                      <div className="text-center py-2">
                        <p className="text-xs text-gray-500">
                          +{checkoutData.items.length - 3} more items
                        </p>
                      </div>
                    )}
                  </div>
                  <Separator className="bg-gray-200" />
                </div>
              )}

            {/* Delivery Information (detailed mode only) */}
            {mode === "detailed" &&
              checkoutData?.deliveryLocation &&
              paymentStep === "select" && (
                <div className="space-y-3 mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-gray-600" />
                    </div>
                    Delivery Information
                  </h3>
                  <div className="p-3 bg-gray-50/70 rounded-lg border border-gray-100/50 backdrop-blur-sm">
                    <p className="font-medium text-gray-900 text-sm">
                      {checkoutData.deliveryLocation.address}
                    </p>
                    <div className="flex items-center gap-4 text-xs mt-2">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>
                          Est.{" "}
                          {checkoutData.estimatedDeliveryTime || "30-45 min"}
                        </span>
                      </div>
                      {checkoutData.deliveryDistance && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Navigation className="h-3 w-3" />
                          <span>{checkoutData.deliveryDistance}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator className="bg-gray-200" />
                </div>
              )}

            {/* Order Summary Card - Enhanced for both modes */}
            <div className="backdrop-blur-2xl bg-white/60 rounded-2xl p-4 mb-4 border border-gray-200/40 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">
                {mode === "detailed" ? "Payment Summary" : "Booking Summary"}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {mode === "detailed" ? "Order ID:" : "Booking ID:"}
                  </span>
                  <span className="font-medium text-gray-900">
                    #{orderDetails.id.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {mode === "detailed" ? "Service:" : "Rider:"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {orderDetails.vendor}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    {mode === "detailed" ? "Description:" : "Route:"}
                  </span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">
                    {orderDetails.description}
                  </span>
                </div>

                {/* Detailed breakdown for detailed mode */}
                {mode === "detailed" && checkoutData?.items && (
                  <>
                    <Separator className="bg-gray-200 my-2" />
                    <div className="flex justify-between text-gray-600 text-sm">
                      <span>Subtotal ({checkoutData.items.length} items)</span>
                      <span>{formatAmount(subtotal)}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-gray-600 text-sm">
                        <span>Delivery Fee</span>
                        <span>{formatAmount(deliveryFee)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="h-px bg-gray-300/50 my-2" />
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-green-600">
                    {formatAmount(
                      mode === "detailed" ? total : orderDetails.amount
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {paymentStep === "select" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Select Payment Method
                </h3>

                {/* Cash on Delivery Card */}
                <div
                  onClick={() => handleMethodSelect("cash")}
                  className={`backdrop-blur-2xl bg-white/60 rounded-2xl border cursor-pointer transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] active:scale-[0.98] ${
                    selectedMethod === "cash"
                      ? "border-green-400/60 shadow-xl shadow-green-500/10 bg-green-50/60"
                      : "border-gray-200/40 shadow-lg"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center backdrop-blur-xl border border-green-300/40 shadow-lg">
                        <Banknote className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          Cash on Delivery
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Pay with cash when delivery arrives
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-green-100/80 text-green-700 border-green-300/50 text-xs backdrop-blur-xl">
                          <Shield className="h-3 w-3 mr-1" />
                          Secure
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Money Card */}
                <div
                  onClick={() => handleMethodSelect("momo")}
                  className={`backdrop-blur-2xl bg-white/60 rounded-2xl border cursor-pointer transition-all duration-300 hover:bg-white/70 hover:scale-[1.02] active:scale-[0.98] ${
                    selectedMethod === "momo"
                      ? "border-blue-400/60 shadow-xl shadow-blue-500/10 bg-blue-50/60"
                      : "border-gray-200/40 shadow-lg"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center backdrop-blur-xl border border-blue-300/40 shadow-lg">
                        <Smartphone className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          Mobile Money
                        </h4>
                        <p className="text-xs text-gray-600 mt-1">
                          Pay instantly with MTN/Vodafone/AirtelTigo
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-blue-100/80 text-blue-700 border-blue-300/50 text-xs backdrop-blur-xl">
                          <Clock className="h-3 w-3 mr-1" />
                          Instant
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details - Cash */}
            {paymentStep === "details" && selectedMethod === "cash" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    Cash on Delivery
                  </h3>
                </div>

                <div className="backdrop-blur-2xl bg-green-50/70 rounded-2xl p-4 border border-green-200/50 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100/80 rounded-lg flex items-center justify-center mt-1">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">
                        Payment Instructions
                      </h4>
                      <ul className="text-xs text-green-700 space-y-1.5 leading-relaxed">
                        <li>
                          • Have exact change ready:{" "}
                          {formatAmount(
                            mode === "detailed" ? total : orderDetails.amount
                          )}
                        </li>
                        <li>• Payment will be collected upon delivery</li>
                        <li>
                          • Ensure someone is available to receive the{" "}
                          {mode === "detailed" ? "order" : "booking"}
                        </li>
                        <li>• You'll receive a receipt after payment</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentStep("select")}
                    className="flex-1 rounded-2xl backdrop-blur-xl bg-white/60 border-gray-300/50 text-gray-700 hover:bg-white/80 h-11 font-medium"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={!phoneNumber || phoneNumber.length < 10}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg h-11 font-medium disabled:opacity-50"
                  >
                    Process Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Processing State */}
            {paymentStep === "processing" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse backdrop-blur-xl border border-gray-300/40 shadow-lg">
                  <CreditCard className="h-8 w-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing Payment
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {selectedMethod === "momo"
                    ? "Verifying your mobile money transaction..."
                    : `Confirming your cash on delivery ${
                        mode === "detailed" ? "order" : "booking"
                      }...`}
                </p>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce shadow-lg" />
                  <div
                    className="w-2 h-2 bg-gray-600 rounded-full animate-bounce shadow-lg"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-600 rounded-full animate-bounce shadow-lg"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            )}

            {/* Success State - Always visible once reached */}
            {(paymentStep === "success" || paymentStep === "redirecting") && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-green-300/40 shadow-lg">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Payment Successful!
                </h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {selectedMethod === "momo"
                    ? `Your mobile money payment has been confirmed.`
                    : `Your cash on delivery ${
                        mode === "detailed" ? "order" : "booking"
                      } has been confirmed.`}
                </p>
                {selectedMethod === "momo" && (
                  <div className="backdrop-blur-2xl bg-green-50/70 rounded-2xl p-3 border border-green-200/50 shadow-lg mb-4">
                    <p className="text-green-700 text-xs">
                      Reference:{" "}
                      <span className="font-mono font-bold">
                        {referenceCode}
                      </span>
                    </p>
                  </div>
                )}
                <Badge className="bg-green-100/80 text-green-700 border-green-300/50 backdrop-blur-xl px-3 py-1 mb-4">
                  {mode === "detailed" ? "Order" : "Booking"} #
                  {orderDetails.id.slice(-6)} Confirmed
                </Badge>

                {/* Show redirecting section when in redirecting state */}
                {paymentStep === "redirecting" && (
                  <div className="mt-6 pt-6 border-t border-gray-200/50">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-blue-300/40 shadow-lg">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-md font-semibold text-gray-900 mb-2">
                      Redirecting...
                    </h4>
                    <p className="text-gray-600 mb-4 text-sm">
                      Taking you to view all your{" "}
                      {mode === "detailed" ? "orders" : "bookings"}
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-xs mx-auto mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Loading</span>
                        <span>{Math.round(redirectProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200/50 rounded-full h-2 backdrop-blur-xl">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-100 ease-out shadow-lg"
                          style={{ width: `${redirectProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Loading animation dots */}
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-lg" />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-lg"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-lg"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
