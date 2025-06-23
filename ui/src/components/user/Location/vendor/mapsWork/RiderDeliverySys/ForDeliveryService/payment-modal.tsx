"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CreditCard, Smartphone, Copy, Check, Clock, Shield, AlertCircle, Banknote, QrCode, Phone } from "lucide-react"
import { toast } from "sonner"
import { useNavigate } from "react-router"
import { gql, useMutation } from "@apollo/client"

interface PaymentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderDetails: {
    id: string
    amount: number
    description: string
    vendor: string
  }
  onPaymentComplete: (paymentData: PaymentResult) => void
}

// GraphQL Mutation for Bookings
const ORDER_OR_BOOKING_PAYMENT = gql`
  mutation OrderOrBookingPayment($entityId: String!, $entityType: String!, $method: String!, $reference: String!) {
    orderOrBookingPayment(entityId: $entityId, entityType: $entityType, method: $method, reference: $reference) {
      id
      method
      status
      entityId
      entityType
      reference
    }
  }
`

interface PaymentResult {
  method: "cash" | "momo"
  referenceCode?: string
  phoneNumber?: string
  amount: number
  orderId: string
  timestamp: string
  paymentId?: string
  status?: string
}

interface PaymentMutationResult {
  id: string
  method: string
  status: string
  entityId: string
  entityType: string
  reference?: string
}

type PaymentMethod = "cash" | "momo" | null

export default function PaymentModal({ open, onOpenChange, orderDetails, onPaymentComplete }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [referenceCode, setReferenceCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStep, setPaymentStep] = useState<"select" | "details" | "processing" | "success" | "error" | "redirecting">("select")
  const [copied, setCopied] = useState(false)
  const [redirectProgress, setRedirectProgress] = useState(0)
  const [paymentError, setPaymentError] = useState<string>("")
  
  const navigate = useNavigate()

  // GraphQL Mutation Hook
  const [processPayment, { loading: mutationLoading, error: mutationError }] = useMutation<
    { orderOrBookingPayment: PaymentMutationResult },
    { entityId: string; entityType: string; method: string; reference: string }
  >(ORDER_OR_BOOKING_PAYMENT, {
    onCompleted: (data) => {
      console.log("Booking payment mutation completed:", data)
      handlePaymentSuccess(data.orderOrBookingPayment)
    },
    onError: (error) => {
      console.error("Booking payment mutation error:", error)
      handlePaymentError(error.message)
    }
  })

  // Generate reference code for payments
  const generateReferenceCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return selectedMethod === "momo" ? `MOMO${timestamp}${random}` : `BOOKING${timestamp}${random}`
  }

  // Reset modal state when opened
  useEffect(() => {
    if (open) {
      setSelectedMethod(null)
      setPhoneNumber("")
      setReferenceCode("")
      setIsProcessing(false)
      setPaymentStep("select")
      setCopied(false)
      setRedirectProgress(0)
      setPaymentError("")
    }
  }, [open])

  // Handle redirect with progress bar after success
  useEffect(() => {
    let progressInterval: NodeJS.Timeout

    if (paymentStep === "redirecting") {
      console.log("Redirecting state activated") // Debug log
      
      progressInterval = setInterval(() => {
        setRedirectProgress((prev) => {
          const newProgress = prev + 2
          console.log("Progress:", newProgress) // Debug log
          
          if (newProgress >= 100) {
            console.log("Redirecting to /vob") // Debug log
            // Only redirect when progress bar completes, don't close modal here
            navigate('/vob')
            // Close modal after navigation
            setTimeout(() => {
              onOpenChange(false)
            }, 100)
            return 100
          }
          return newProgress
        })
      }, 50)
    }

    return () => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }, [paymentStep, navigate, onOpenChange])

  // Handle payment method selection
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    if (method === "momo") {
      setReferenceCode(generateReferenceCode())
    } else if (method === "cash") {
      setReferenceCode(generateReferenceCode())
    }
    setPaymentStep("details")
  }

  // Handle payment processing
  const handlePayment = async () => {
    if (selectedMethod === "momo" && (!phoneNumber || phoneNumber.length < 10)) {
      toast.error("Please enter a valid phone number")
      return
    }

    setIsProcessing(true)
    setPaymentStep("processing")
    setPaymentError("")

    try {
      // Prepare mutation variables with correct method values
      const mutationVariables = {
        entityId: orderDetails.id,
        entityType: "BOOKING", // Always BOOKING for this component
        method: selectedMethod!, // Pass "cash" or "momo" directly
        reference: referenceCode
      }

      console.log("Processing booking payment with variables:", mutationVariables)

      // Execute the mutation
      await processPayment({
        variables: mutationVariables
      })

    } catch (error) {
      console.error("Booking payment processing error:", error)
      handlePaymentError("Payment processing failed. Please try again.")
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = (paymentData: PaymentMutationResult) => {
    const paymentResult: PaymentResult = {
      method: selectedMethod!,
      referenceCode: referenceCode,
      phoneNumber: selectedMethod === "momo" ? phoneNumber : undefined,
      amount: orderDetails.amount,
      orderId: orderDetails.id,
      timestamp: new Date().toISOString(),
      paymentId: paymentData.id,
      status: paymentData.status
    }

    // Complete payment callback first
    onPaymentComplete(paymentResult)

    // Show success state
    setPaymentStep("success")
    setIsProcessing(false)

    // Success toast
    toast.success(
      selectedMethod === "momo" 
        ? "Mobile money payment processed successfully!" 
        : "Cash on delivery booking confirmed!"
    )

    // Wait 2 seconds to show success message, then start redirecting
    setTimeout(() => {
      console.log("Starting redirect state") // Debug log
      setPaymentStep("redirecting")
      setRedirectProgress(0)
    }, 2000)
  }

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setPaymentError(errorMessage)
    setIsProcessing(false)
    setPaymentStep("error")
    toast.error(errorMessage)
  }

  // Retry payment
  const retryPayment = () => {
    setPaymentError("")
    setPaymentStep("details")
  }

  // Copy reference code to clipboard
  const copyReferenceCode = async () => {
    try {
      await navigator.clipboard.writeText(referenceCode)
      setCopied(true)
      toast.success("Reference code copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy reference code")
    }
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-3xl bg-white/70 border border-white/40 rounded-3xl p-0 w-[95vw] max-w-sm max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header with frosted glass effect */}
        <DialogHeader className="p-4 pb-3 backdrop-blur-2xl bg-white/80 border-b border-gray-200/30">
          <DialogTitle className="text-lg font-semibold text-center text-gray-900">Choose Payment Method</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="px-4 pb-4">
            {/* Booking Summary - Glass Card Style */}
            <div className="backdrop-blur-2xl bg-white/60 rounded-2xl p-4 mb-4 border border-gray-200/40 shadow-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium text-gray-900">#{orderDetails.id.slice(-6)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rider:</span>
                  <span className="font-medium text-gray-900">{orderDetails.vendor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Route:</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">{orderDetails.description}</span>
                </div>
                <div className="h-px bg-gray-300/50 my-2" />
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-900">Total Amount:</span>
                  <span className="text-green-600">{formatAmount(orderDetails.amount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {paymentStep === "select" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900 mb-3">Select Payment Method</h3>

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
                        <h4 className="font-semibold text-gray-900">Cash on Delivery</h4>
                        <p className="text-xs text-gray-600 mt-1">Pay with cash when delivery arrives</p>
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
                        <h4 className="font-semibold text-gray-900">Mobile Money</h4>
                        <p className="text-xs text-gray-600 mt-1">Pay instantly with MTN/Vodafone/AirtelTigo</p>
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
                  <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                </div>

                {/* Reference Code Display */}
                <div className="backdrop-blur-2xl bg-blue-50/70 rounded-2xl p-4 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium text-blue-800">Booking Reference</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyReferenceCode}
                      className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded-xl backdrop-blur-xl"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="font-mono text-sm font-bold text-blue-800 bg-white/60 rounded-xl p-3 text-center backdrop-blur-xl border border-gray-200/40 shadow-inner">
                    {referenceCode}
                  </div>
                  <p className="text-xs text-blue-700 mt-2 text-center">
                    Mention this reference during delivery
                  </p>
                </div>

                <div className="backdrop-blur-2xl bg-green-50/70 rounded-2xl p-4 border border-green-200/50 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100/80 rounded-lg flex items-center justify-center mt-1">
                      <AlertCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">Payment Instructions</h4>
                      <ul className="text-xs text-green-700 space-y-1.5 leading-relaxed">
                        <li>• Have exact change ready: {formatAmount(orderDetails.amount)}</li>
                        <li>• Payment will be collected upon delivery</li>
                        <li>• Ensure someone is available to receive the booking</li>
                        <li>• You'll receive a receipt after payment</li>
                        <li>• Booking reference: {referenceCode}</li>
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
                    disabled={isProcessing || mutationLoading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg h-11 font-medium disabled:opacity-50"
                  >
                    {isProcessing || mutationLoading ? "Processing..." : "Confirm Booking"}
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Details - MoMo */}
            {paymentStep === "details" && selectedMethod === "momo" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Mobile Money Payment</h3>
                </div>

                {/* Reference Code */}
                <div className="backdrop-blur-2xl bg-blue-50/70 rounded-2xl p-4 border border-blue-200/50 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium text-blue-800">Reference Code</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyReferenceCode}
                      className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50 rounded-xl backdrop-blur-xl"
                    >
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="font-mono text-lg font-bold text-blue-800 bg-white/60 rounded-xl p-3 text-center backdrop-blur-xl border border-gray-200/40 shadow-inner">
                    {referenceCode}
                  </div>
                  <p className="text-xs text-blue-700 mt-2 text-center">
                    Use this code for your mobile money transaction
                  </p>
                </div>

                {/* Phone Number Input */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-medium text-gray-900">
                    Mobile Money Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0XX XXX XXXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-10 backdrop-blur-2xl bg-white/60 border-gray-300/50 rounded-2xl h-12 text-gray-900 placeholder:text-gray-500 focus:border-blue-400/60 focus:bg-white/70"
                    />
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="backdrop-blur-2xl bg-yellow-50/70 rounded-2xl p-4 border border-yellow-200/50 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-yellow-100/80 rounded-lg flex items-center justify-center mt-1">
                      <QrCode className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Payment Steps</h4>
                      <ol className="text-xs text-yellow-700 space-y-1.5 leading-relaxed">
                        <li>1. Dial your mobile money code (*170# for MTN)</li>
                        <li>2. Select "Send Money" or "Transfer"</li>
                        <li>3. Enter reference: <strong className="text-yellow-800">{referenceCode}</strong></li>
                        <li>4. Enter amount: <strong className="text-yellow-800">{formatAmount(orderDetails.amount)}</strong></li>
                        <li>5. Confirm the transaction</li>
                      </ol>
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
                    disabled={!phoneNumber || phoneNumber.length < 10 || isProcessing || mutationLoading}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg h-11 font-medium disabled:opacity-50"
                  >
                    {isProcessing || mutationLoading ? "Processing..." : "Process Payment"}
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {selectedMethod === "momo"
                    ? "Verifying your mobile money transaction..."
                    : "Confirming your cash on delivery booking..."}
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

            {/* Error State */}
            {paymentStep === "error" && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-red-300/40 shadow-lg">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Failed</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {paymentError || "Something went wrong during payment processing."}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPaymentStep("select")}
                    className="flex-1 rounded-2xl backdrop-blur-xl bg-white/60 border-gray-300/50 text-gray-700 hover:bg-white/80 h-11 font-medium"
                  >
                    Change Method
                  </Button>
                  <Button
                    onClick={retryPayment}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg h-11 font-medium"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Success State - Always visible once reached */}
            {(paymentStep === "success" || paymentStep === "redirecting") && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-xl border border-green-300/40 shadow-lg">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                  {selectedMethod === "momo"
                    ? `Your mobile money payment has been confirmed.`
                    : "Your cash on delivery booking has been confirmed."}
                </p>
                {referenceCode && (
                  <div className="backdrop-blur-2xl bg-green-50/70 rounded-2xl p-3 border border-green-200/50 shadow-lg mb-4">
                    <p className="text-green-700 text-xs">
                      Reference: <span className="font-mono font-bold">{referenceCode}</span>
                    </p>
                  </div>
                )}
                <Badge className="bg-green-100/80 text-green-700 border-green-300/50 backdrop-blur-xl px-3 py-1 mb-4">
                  Booking #{orderDetails.id.slice(-6)} Confirmed
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
                    
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Redirecting...</h4>
                    <p className="text-gray-600 mb-4 text-sm">
                      Taking you to view all your bookings
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
  )
}