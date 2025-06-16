// ==========================================
// Enhanced Booking Hooks with Complete Payment Integration
// ==========================================

import { useState, useCallback, useRef } from "react";
import { useMutation, gql } from "@apollo/client";
import { toast } from "sonner";

// ==========================================
// GraphQL Mutations
// ==========================================

// Enhanced mutation with payment fields
export const UPDATE_BOOKING_WITH_PAYMENT = gql`
  mutation UpdateBookingWithPayment($input: addBookCoordinateInput!) {
    updateMultipleBookingsWithLocation(input: $input) {
      id
      startTime
      endTime
      dropoffLocation
      pickupLocation
      estimatedDeliveryDate
      notes
      tableSize
      deliveryAddress
      item
      distance
      duration
      deliveryFee
      isConfirmed
      riderId
      serviceId
      updatedAt
      # Payment-related fields (if they exist in your schema)
      paymentReference
      paymentStatus
      paymentAmount
      customerEmail
      customerName
    }
  }
`;

// Check payment status query
export const CHECK_PAYMENT_STATUS = gql`
  query CheckPaymentStatus($orderID: String!) {
    successfulPaymentForOrder(orderID: $orderID) {
      id
      paystackReference
      amount
      status
      paidAt
      customerEmail
      customerName
    }
    isOrderPaid(orderID: $orderID)
  }
`;

// ==========================================
// Enhanced Types
// ==========================================

export interface EnhancedBookingInput {
  bookId: string;
  deliveryAddress?: string;
  dropoffLocation?: number[];
  pickupLocation?: number[];
  rangeMetaId?: string;
  ridersId?: string;
  // Payment fields
  paymentReference?: string;
  paymentStatus?: "pending" | "paid" | "failed";
  paymentAmount?: number; // in pesewa
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentVerificationResult {
  isValid: boolean;
  amount?: number;
  reference?: string;
  status?: string;
  error?: string;
}

// ==========================================
// Enhanced Booking Management Hook
// ==========================================

export function useEnhancedBookingManagement(bookId?: string) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastPaymentReference, setLastPaymentReference] = useState<string>('');
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation for updating booking with payment
  const [updateBookingMutation, { loading: isUpdatingBooking }] = useMutation(
    UPDATE_BOOKING_WITH_PAYMENT,
    {
      onError: (error) => {
        console.error("❌ Enhanced booking mutation error:", error);
      },
    }
  );

  // Enhanced booking handler with payment verification
  const handleBookingWithPayment = useCallback(async (
    paymentReference: string,
    calculation: any,
    pickupLocation: any,
    dropoffLocation: any,
    riderId: string,
    bookingId: string,
    userProfile: { email: string; name: string } | undefined
  ) => {
    if (!calculation || !pickupLocation || !dropoffLocation || !riderId || !bookingId) {
      const error = "Missing required booking information";
      toast.error(error);
      throw new Error(error);
    }

    setIsProcessing(true);
    setLastPaymentReference(paymentReference);

    try {
      console.log("📦 Starting enhanced booking with payment:", {
        bookingId,
        paymentReference,
        amount: calculation.totalPrice,
        hasPayment: !!paymentReference,
      });

      // For paid bookings, add a small delay to ensure payment webhook has processed
      if (paymentReference) {
        console.log("⏳ Waiting for payment webhook to process...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      const input: EnhancedBookingInput = {
        bookId: bookingId,
        deliveryAddress: dropoffLocation.address,
        dropoffLocation: [dropoffLocation.lng, dropoffLocation.lat],
        pickupLocation: [pickupLocation.lng, pickupLocation.lat],
        ridersId: riderId,
        
        // Payment integration
        paymentReference: paymentReference || undefined,
        paymentStatus: paymentReference ? "paid" : "pending",
        paymentAmount: paymentReference ? Math.round(calculation.totalPrice * 100) : undefined,
        customerEmail: userProfile?.email,
        customerName: userProfile?.name,
        
        // Range metadata if available
        ...(calculation.matchedZone?.id && {
          rangeMetaId: calculation.matchedZone.id,
        }),
      };

      console.log("📦 Enhanced booking input:", input);

      const result = await updateBookingMutation({
        variables: { input },
      });

      if (!result?.data?.updateMultipleBookingsWithLocation) {
        throw new Error("No data returned from booking mutation");
      }

      const updatedBooking = result.data.updateMultipleBookingsWithLocation;
      console.log("✅ Enhanced booking successful:", updatedBooking);

      // Show appropriate success message based on payment
      if (paymentReference) {
        toast.success("Payment & Booking Confirmed!", {
          description: `Paid GHS ${calculation.totalPrice.toFixed(2)} • Booking ID: ${updatedBooking.id.slice(0, 8)}`,
          duration: 5000,
        });
      } else {
        toast.success("Free Booking Confirmed!", {
          description: `Booking ID: ${updatedBooking.id.slice(0, 8)}`,
          duration: 5000,
        });
      }

      return updatedBooking;

    } catch (error: any) {
      console.error("❌ Enhanced booking failed:", error);
      
      // Enhanced error handling with specific messages
      let errorMessage = "Failed to complete booking. Please try again.";
      let shouldRetry = false;
      
      if (paymentReference) {
        // Payment was successful but booking failed
        if (error.networkError) {
          errorMessage = "Network error during booking. Payment successful - will retry automatically.";
          shouldRetry = true;
        } else if (error.graphQLErrors?.length > 0) {
          const gqlError = error.graphQLErrors[0];
          if (gqlError.message.includes("timeout") || gqlError.message.includes("connection")) {
            errorMessage = "Booking timeout. Payment successful - will retry automatically.";
            shouldRetry = true;
          } else {
            errorMessage = `Booking failed: ${gqlError.message}. Payment successful.`;
          }
        } else {
          errorMessage = "Payment successful but booking failed. Please contact support.";
        }
        
        // For paid bookings, show payment reference
        toast.error(errorMessage, {
          description: `Payment Reference: ${paymentReference}`,
          duration: shouldRetry ? 5000 : 10000,
        });
      } else {
        // Free booking failed
        if (error.graphQLErrors?.length > 0) {
          errorMessage = error.graphQLErrors[0].message;
        } else if (error.networkError) {
          errorMessage = "Network error - please check your connection";
          shouldRetry = true;
        }
        
        toast.error(errorMessage, { 
          duration: shouldRetry ? 3000 : 5000 
        });
      }
      
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [updateBookingMutation]);

  // Auto-retry mechanism for network failures
  const retryBookingWithBackoff = useCallback(async (
    paymentReference: string,
    calculation: any,
    pickupLocation: any,
    dropoffLocation: any,
    riderId: string,
    bookingId: string,
    userProfile: { email: string; name: string } | undefined,
    retryCount: number = 1
  ) => {
    const maxRetries = 3;
    const baseDelay = 2000; // 2 seconds
    
    if (retryCount > maxRetries) {
      toast.error("Maximum retry attempts reached", {
        description: `Payment Reference: ${paymentReference}`,
        duration: 10000,
      });
      throw new Error("Maximum retry attempts exceeded");
    }

    const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
    
    console.log(`🔄 Retry attempt ${retryCount} in ${delay}ms`);
    toast.info(`Retrying booking... (Attempt ${retryCount}/${maxRetries})`, {
      duration: 3000,
    });

    return new Promise((resolve, reject) => {
      retryTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await handleBookingWithPayment(
            paymentReference,
            calculation,
            pickupLocation,
            dropoffLocation,
            riderId,
            bookingId,
            userProfile
          );
          resolve(result);
        } catch (error) {
          // If it's still a network error, try again
          if (error instanceof Error && 
              (error.message.includes("network") || 
               error.message.includes("timeout") || 
               error.message.includes("connection"))) {
            try {
              const nextResult = await retryBookingWithBackoff(
                paymentReference,
                calculation,
                pickupLocation,
                dropoffLocation,
                riderId,
                bookingId,
                userProfile,
                retryCount + 1
              );
              resolve(nextResult);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(error);
          }
        }
      }, delay);
    });
  }, [handleBookingWithPayment]);

  // Handle free bookings (no payment required)
  const handleFreeBooking = useCallback(async (
    calculation: any,
    pickupLocation: any,
    dropoffLocation: any,
    riderId: string,
    bookingId: string,
    userProfile: { email: string; name: string } | undefined
  ) => {
    return handleBookingWithPayment(
      "", // Empty payment reference for free bookings
      calculation,
      pickupLocation,
      dropoffLocation,
      riderId,
      bookingId,
      userProfile
    );
  }, [handleBookingWithPayment]);

  // Verify payment status (useful for debugging)
  const verifyPaymentStatus = useCallback(async (
    paymentReference: string
  ): Promise<PaymentVerificationResult> => {
    try {
      // This would typically call your backend to verify with Paystack
      // For now, we'll assume the payment is valid if we have a reference
      if (!paymentReference) {
        return { isValid: false, error: "No payment reference provided" };
      }

      // In a real implementation, you might call:
      // const response = await fetch(`/api/verify-payment/${paymentReference}`);
      // const data = await response.json();
      
      return {
        isValid: true,
        reference: paymentReference,
        status: "success"
      };
    } catch (error) {
      console.error("❌ Payment verification failed:", error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : "Verification failed" 
      };
    }
  }, []);

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  return {
    // Main functions
    handleBookingWithPayment,
    handleFreeBooking,
    retryBookingWithBackoff,
    verifyPaymentStatus,
    
    // State
    isProcessing: isProcessing || isUpdatingBooking,
    lastPaymentReference,
    
    // Utility
    cleanup,
  };
}

// ==========================================
// Booking Status Hook
// ==========================================

export function useBookingStatus(bookId?: string) {
  const [bookingStatus, setBookingStatus] = useState<{
    isComplete: boolean;
    isPaid: boolean;
    paymentReference?: string;
    error?: string;
  }>({
    isComplete: false,
    isPaid: false,
  });

  const checkBookingStatus = useCallback(async () => {
    if (!bookId) return;

    try {
      // This would typically query your backend for booking status
      // For now, we'll simulate it
      console.log("🔍 Checking booking status for:", bookId);
      
      // You might implement this with a GraphQL query or REST call
      // const result = await client.query({
      //   query: CHECK_PAYMENT_STATUS,
      //   variables: { orderID: bookId }
      // });
      
      setBookingStatus({
        isComplete: true,
        isPaid: false, // This would come from your actual check
      });
    } catch (error) {
      console.error("❌ Failed to check booking status:", error);
      setBookingStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Status check failed"
      }));
    }
  }, [bookId]);

  return {
    bookingStatus,
    checkBookingStatus,
  };
}

// ==========================================
// Navigation Hook for Bookings
// ==========================================

export function useBookingNavigation() {
  const navigateToBookings = useCallback((state?: {
    paymentSuccess?: boolean;
    paymentReference?: string;
    amount?: number;
    bookingId?: string;
  }) => {
    // This would use your router's navigation
    // For React Router v6:
    // navigate('/bookings', { state });
    
    // For now, we'll use window.location
    const baseUrl = '/bookings';
    const searchParams = new URLSearchParams();
    
    if (state?.paymentSuccess) {
      searchParams.set('payment', 'success');
    }
    if (state?.paymentReference) {
      searchParams.set('ref', state.paymentReference);
    }
    if (state?.bookingId) {
      searchParams.set('booking', state.bookingId);
    }
    
    const finalUrl = searchParams.toString() 
      ? `${baseUrl}?${searchParams.toString()}`
      : baseUrl;
    
    console.log("🔗 Navigating to:", finalUrl);
    
    // Show success message before navigation
    if (state?.paymentSuccess && state?.amount) {
      toast.success("Redirecting to your bookings...", {
        description: `Payment of GHS ${state.amount.toFixed(2)} confirmed`,
        duration: 3000,
      });
    }
    
    // Navigate after a short delay
    setTimeout(() => {
      window.location.href = finalUrl;
    }, 1000);
  }, []);

  const navigateToBookingDetails = useCallback((bookingId: string, state?: {
    paymentSuccess?: boolean;
    paymentReference?: string;
  }) => {
    const baseUrl = `/bookings/${bookingId}`;
    const searchParams = new URLSearchParams();
    
    if (state?.paymentSuccess) {
      searchParams.set('payment', 'success');
    }
    if (state?.paymentReference) {
      searchParams.set('ref', state.paymentReference);
    }
    
    const finalUrl = searchParams.toString() 
      ? `${baseUrl}?${searchParams.toString()}`
      : baseUrl;
    
    console.log("🔗 Navigating to booking details:", finalUrl);
    window.location.href = finalUrl;
  }, []);

  return {
    navigateToBookings,
    navigateToBookingDetails,
  };
}

// ==========================================
// Payment State Management Hook
// ==========================================

export function usePaymentState() {
  const [paymentState, setPaymentState] = useState<{
    status: 'idle' | 'processing' | 'success' | 'failed' | 'booking_processing' | 'booking_failed' | 'completed';
    reference?: string;
    amount?: number;
    error?: string;
    retryCount: number;
  }>({
    status: 'idle',
    retryCount: 0,
  });

  const updatePaymentStatus = useCallback((
    status: typeof paymentState.status,
    data?: Partial<typeof paymentState>
  ) => {
    setPaymentState(prev => ({
      ...prev,
      status,
      ...data,
    }));
  }, []);

  const incrementRetryCount = useCallback(() => {
    setPaymentState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
    }));
  }, []);

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      status: 'idle',
      retryCount: 0,
    });
  }, []);

  return {
    paymentState,
    updatePaymentStatus,
    incrementRetryCount,
    resetPaymentState,
  };
}

// ==========================================
// Export all hooks
// ==========================================

export {
  useEnhancedBookingManagement as useEnhancedBookingWithPayment,
};