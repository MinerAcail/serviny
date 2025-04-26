import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { GET_ORDER_TRACKING, OrderTrackingData } from "@/components/custom/try";
import { ApolloError } from "@apollo/client/errors"; // Import Apollo's error type

// Define the expected structure of the context data
interface OrderTrackingContextType {
  data?: OrderTrackingData;
  error?: ApolloError;
  loading: boolean;
}

// Create context with default values
const OrderTrackingContext = createContext<OrderTrackingContextType | undefined>(undefined);

interface OrderTrackingProviderProps {
  children: ReactNode;
}

// Provider component
export const OrderTrackingProvider = ({ children }: OrderTrackingProviderProps) => {
  const { data, error, loading } = useQuery<OrderTrackingData>(GET_ORDER_TRACKING,{
    // pollInterval:1000
  });

  return (
    <OrderTrackingContext.Provider value={{ data, error, loading }}>
      {children}
    </OrderTrackingContext.Provider>
  );
};

// Custom hook for consuming the context
export const useOrderTracking = (): OrderTrackingContextType => {
  const context = useContext(OrderTrackingContext);
  if (!context) {
    throw new Error("useOrderTracking must be used within an OrderTrackingProvider");
  }
  return context;
};
