import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client";
import { AlertCircle, CreditCard, CheckCircle, XCircle, Clock, Clipboard, FileText, Truck, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { GET_BOOKING_ORDER_PAYMENT_STATUS } from "./types";
import { useNavigate } from "react-router";

interface PaymentStatus {
  id: string;
  method: string;
  status: "COMPLETED" | "FAILED" | "PROCESSING" | "PENDING";
  reference: string;
  entityId: string;
  entityType: string;
  amount?: number;
  currency?: string;
}

interface ServiceData {
  id: string;
  type: "ORDER" | "BOOKING";
  orderData?: {
    orderId?: string;
  };
  bookingData?: {
    bookingId?: string;
    cargoId?: string;
  };
}

interface PaymentStatusProps {
  selectedItem: ServiceData | null;
  onPayNow?: () => void;
  onViewInvoice?: (cargoId: string) => void;
}

export function PaymentStatusSection({
  selectedItem,
  onPayNow,
  onViewInvoice,
}: PaymentStatusProps) {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const navigate = useNavigate();

  // GraphQL query for payment status
  const [getPaymentStatus, { loading: paymentLoading }] = useLazyQuery(
    GET_BOOKING_ORDER_PAYMENT_STATUS,
    {
      onCompleted: (data) => {
        setPaymentStatus(data.getBookingOrderPaymentStatusByUser);
      },
      onError: (error) => {
        console.error("Failed to fetch payment status:", error);
        toast.error("Failed to load payment status");
      },
    }
  );

  // Fetch payment status when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      const entityId =
        selectedItem.type === "ORDER"
          ? selectedItem.orderData?.orderId
          : selectedItem.bookingData?.bookingId;

      if (entityId) {
        getPaymentStatus({
          variables: {
            entityId,
            entityType: selectedItem.type === "ORDER" ? "ORDER" : "BOOKING",
          },
        });
      }
    } else {
      setPaymentStatus(null);
    }
  }, [selectedItem, getPaymentStatus]);

  // Don't render if no selected item
  if (!selectedItem) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-yellow-600 animate-bounce" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "text-green-600";
      case "FAILED":
        return "text-red-600";
      case "PROCESSING":
        return "text-yellow-600";
      default:
        return "text-gray-600";
    }
  };

  const handleViewInvoice = () => {
    if (selectedItem?.bookingData?.cargoId && onViewInvoice) {
      onViewInvoice(selectedItem.bookingData.cargoId);
    }
    navigate(`/invoice/${selectedItem?.bookingData?.cargoId}`);
  };

  const isCargoBooking = selectedItem.type === "BOOKING" && selectedItem.bookingData?.cargoId;

  return (
    <div className="mt-4 pt-4 border-t border-white/20">
      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4" />
        Payment Status
      </h4>

      {/* Loading State */}
      {paymentLoading && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
          <Clock className="h-3 w-3 animate-spin" />
          Loading payment status...
        </div>
      )}

      {/* Payment Status Summary - Always Visible */}
      {paymentStatus && (
        <div className="mb-4">
          {/* Status Overview */}
          <div className="flex items-center justify-between p-3 bg-gray-50/80 backdrop-blur-xl rounded-lg">
            <div className="flex items-center gap-2">
              {getStatusIcon(paymentStatus.status)}
              <span className={`font-medium ${getStatusColor(paymentStatus.status)}`}>
                {paymentStatus.status}
              </span>
              <span className="text-sm text-gray-500">• {paymentStatus.method}</span>
            </div>
            {paymentStatus.amount && (
              <span className="font-medium text-gray-900">
                {paymentStatus.currency || "$"}{paymentStatus.amount.toFixed(2)}
              </span>
            )}
          </div>

          {/* Critical Alerts - Always Visible */}
          {paymentStatus.status === "FAILED" && (
            <Alert className="mt-3 border-red-200 bg-red-50/80 backdrop-blur-xl">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="font-medium mb-1">Payment Failed</div>
                <div className="text-sm">
                  There was an issue processing your payment. Please try again or contact support.
                </div>
              </AlertDescription>
              {onPayNow && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-3"
                  onClick={onPayNow}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Retry Payment
                </Button>
              )}
            </Alert>
          )}

          {paymentStatus.status === "COMPLETED" && (
            <Alert className="mt-3 border-green-200 bg-green-50/80 backdrop-blur-xl">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="font-medium">Payment Successful</div>
                <div className="text-sm">
                  Your payment has been processed and the vendor can now fulfill your {selectedItem.type.toLowerCase()}.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus.status === "PROCESSING" && (
            <Alert className="mt-3 border-yellow-200 bg-yellow-50/80 backdrop-blur-xl">
              <Clock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {paymentStatus.method === "momo" ? (
                  <>
                    <div className="font-medium">Payment Processing</div>
                    <div className="text-sm">
                      Your payment is being processed. This usually takes a few minutes.
                      Please make sure you have completed the payment.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">Payment Processing</div>
                    <div className="text-sm">
                      Your payment will be processed when the rider confirms that you have given them the cash.
                    </div>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Accordion for Additional Details */}
      <Accordion type="single" collapsible className="w-full">
        {/* Cargo Invoice Section */}
        {isCargoBooking && (
          <AccordionItem value="cargo-invoice" className="border-blue-200/50">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                <span>Cargo Booking Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card className="backdrop-blur-xl bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border-blue-200/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/80 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">Cargo Booking</h5>
                        <p className="text-sm text-gray-600">
                          Cargo ID: #{selectedItem.bookingData?.cargoId?.slice(-6)}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleViewInvoice}
                      className="bg-blue-500/80 hover:bg-blue-600/80 text-white border-0 backdrop-blur-xl"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                  </div>
                  <div className="mt-3 p-2 bg-blue-100/60 rounded-lg">
                    <p className="text-xs text-blue-800">
                      💡 Click "View Invoice" to see detailed billing information for this cargo shipment
                    </p>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Payment Details Section */}
        {paymentStatus && (
          <AccordionItem value="payment-details">
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Payment Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-gray-50/80 backdrop-blur-xl rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium text-gray-900">
                    {paymentStatus.method}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(paymentStatus.status)}
                    <span className={`font-medium ${getStatusColor(paymentStatus.status)}`}>
                      {paymentStatus.status}
                    </span>
                  </div>
                </div>

                {paymentStatus.amount && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium text-gray-900">
                      {paymentStatus.currency || "$"}
                      {paymentStatus.amount.toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Reference:</span>
                  <span
                    className="font-mono flex flex-row gap-2 text-gray-900 text-sm cursor-pointer hover:underline"
                    title="Click to copy"
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(paymentStatus.reference);
                        toast.success("Reference copied to clipboard!");
                      }
                    }}
                  >
                    <Clipboard className="h-4 w-4" />
                    {paymentStatus.reference.slice(-8)}...
                  </span>
                </div>

                {/* Processing Status Additional Info */}
                {paymentStatus.status === "PROCESSING" && (
                  <div className="mt-3 p-2 bg-yellow-50/80 backdrop-blur-xl border border-yellow-200 rounded text-sm text-yellow-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                      <span>Waiting for payment confirmation...</span>
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}