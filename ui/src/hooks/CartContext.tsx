import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  CREATE_ORDER_ITEMS,
  OrderInput,
  OrderItem,
} from "@/middleware/api/createorder";
import { toast } from "sonner";
const APPLY_PROMOCODE = gql`
mutation ApplyPromoCode($orderID:String!,$promoCode:String!){
  applyPromoCode(orderID:$orderID,promoCode:$promoCode){
    id
    orderID
  }
}
`
export interface Item {
  id: string;
  name: string;
  price: number;
  commission?: number;
  categories: string[];
  imageUrls: string[];
  VendorId?: string;

}

export interface HostelDetails {
  hostelName: string;
  phoneNumber: string;
}

export interface OrderDate {
  timestamp: string;
  formattedDate: string;
}

interface CartContextType {
  cart: Item[];
  hostelDetails: HostelDetails;
  lastOrderDate: OrderDate | null;
  addToCart: (item: Item) => void;
  removeFromCart: (index: number) => void;
  setHostelDetails: React.Dispatch<React.SetStateAction<HostelDetails>>;
  placeOrder: () => Promise<void>;
  clearCart: () => void;
}

const STORAGE_KEYS = {
  CART: 'foodie_cart',
  HOSTEL_DETAILS: 'foodie_hostel_details',
  LAST_ORDER_DATE: 'foodie_last_order_date'
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Helper functions for localStorage
const getStorageItem = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setStorageItem = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Use lazy initial state to avoid localStorage calls during server-side rendering
  const [cart, setCart] = useState<Item[]>(() => getStorageItem(STORAGE_KEYS.CART, []));
  const [hostelDetails, setHostelDetails] = useState<HostelDetails>(() => 
    getStorageItem(STORAGE_KEYS.HOSTEL_DETAILS, { hostelName: "", phoneNumber: "" })
  );
  const [lastOrderDate, setLastOrderDate] = useState<OrderDate | null>(() => 
    getStorageItem(STORAGE_KEYS.LAST_ORDER_DATE, null)
  );

  // Flag to track if component is mounted (prevent memory leaks)
  const isMounted = useRef(false);

  const [createOrder] = useMutation(CREATE_ORDER_ITEMS, {
    refetchQueries: ["useGetordertracking"],
  });
  const [applyPromoCode] = useMutation(APPLY_PROMOCODE);
  // Set mounted flag on component mount
  useEffect(() => {
    isMounted.current = true;
    
    // Setup storage event listener to sync state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (!isMounted.current) return;
      
      if (e.key === STORAGE_KEYS.CART && e.newValue) {
        try {
          setCart(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Failed to parse cart from storage event:", error);
        }
      }
      else if (e.key === STORAGE_KEYS.HOSTEL_DETAILS && e.newValue) {
        try {
          setHostelDetails(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Failed to parse hostel details from storage event:", error);
        }
      }
      else if (e.key === STORAGE_KEYS.LAST_ORDER_DATE && e.newValue) {
        try {
          setLastOrderDate(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Failed to parse last order date from storage event:", error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      isMounted.current = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Persist cart to localStorage when it changes
  useEffect(() => {
    if (isMounted.current) {
      setStorageItem(STORAGE_KEYS.CART, cart);
    }
  }, [cart]);

  // Persist hostel details to localStorage when they change
  useEffect(() => {
    if (isMounted.current) {
      setStorageItem(STORAGE_KEYS.HOSTEL_DETAILS, hostelDetails);
    }
  }, [hostelDetails]);

  // Persist last order date to localStorage when it changes
  useEffect(() => {
    if (isMounted.current && lastOrderDate) {
      setStorageItem(STORAGE_KEYS.LAST_ORDER_DATE, lastOrderDate);
    }
  }, [lastOrderDate]);

  const addToCart = (item: Item): void => {
    setCart((prevCart) => [...prevCart, item]);
  };

  const removeFromCart = (index: number): void => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const clearCart = (): void => {
    setCart([]);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const placeOrder = async (): Promise<void> => {
    if (cart.length === 0) return;

    // Group cart items by product ID and sum quantities
    const groupedItems = cart.reduce((acc: { [key: string]: number }, item) => {
      acc[item.id] = (acc[item.id] || 0) + 1;
      return acc;
    }, {});

    const orderItems: OrderItem[] = Object.entries(groupedItems).map(
      ([productId, quantity]) => ({
        ProductID: productId,
        quantity: quantity,
      })
    );

    const orderInput: OrderInput = {
      customerNumber: hostelDetails.phoneNumber,
      deliveryAddress: hostelDetails.hostelName,
      item: orderItems,
    };

    try {
      const { data } = await createOrder({
        variables: {
          input: orderInput,
        },
      });

      if (data?.createOrderItems) {
        const orderId = data.createOrderItems.id;
        // Save order date details
        const now = new Date();
        const orderDate: OrderDate = {
          timestamp: now.toISOString(),
          formattedDate: formatDate(now)
        };
        
        setLastOrderDate(orderDate);
        setCart([]);
        
        // Save order ID to localStorage
        setStorageItem('foodie_last_order_id', data.createOrderItems.id);
          // Check if a promo code exists
          const appliedPromoCode = localStorage.getItem("appliedPromoCode") || "";


      if (appliedPromoCode) {
        await applyPromoCode({
          variables: {
            orderID: orderId,
            promoCode: appliedPromoCode,
          },
        });
        toast.success(`Promo code "${appliedPromoCode}" applied successfully!`);
      }
        
        toast.success(
          `Order placed successfully! Your order ID is: ${data.createOrderItems.id.slice(
        0,
        5
          )}`
        );
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        hostelDetails,
        lastOrderDate,
        addToCart,
        removeFromCart,
        setHostelDetails,
        placeOrder,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};