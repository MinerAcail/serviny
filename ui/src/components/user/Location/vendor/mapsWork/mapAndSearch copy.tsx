// Complete MapAndSearch component with CheckoutDialog and Payment integration

import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapIcon,
  MapPin,
  Navigation,
  Search,
  X,
  Share2,
  Copy,
  Info,
} from "lucide-react";
import { PinDropper } from "./PinDropper";
import { Input } from "@/components/ui/input";
import { RefObject, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { TransportMode } from "./dataUtils";
import { toast } from "sonner";
import { gql, useMutation } from "@apollo/client";
import CheckoutDialog from "@/components/custom/orders/checkout-dialog";
import { useNavigate } from "react-router";
import PaymentModal from "./RiderDeliverySys/ForDeliveryService/payment-modal";

const UPDATE_WITH_LOCATION = gql`
  mutation updateWithLocation($input: addCoordinateInput!) {
    updateWithLocation(input: $input) {
      id
      userId
      status
      estimatedDeliveryDate
      deliveryAddress
      coordinates
      createdAt
      deliveryFee
      duration
      distance
      isochroneMetaId
      items {
        id
        productId
        quantity
        itemType
        product {
          id
          name
          price
          imageUrls
        }
      }
    }
  }
`;

interface MapAndSearchProps {
  // Search related props
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchValue: string;
  searchInputRef: RefObject<HTMLInputElement>;
  showPredictions: boolean;
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  isSearchLoading: boolean;
  handleClearSearch: () => void;
  handlePredictionSelect: (place: any) => void;

  // Map state props
  isLoaded: boolean;
  loading: boolean;
  isPinDropperActive: boolean;
  isochroneLoading: boolean;
  showDirections: boolean;
  directionsReady: boolean;
  directionsDistance: number | null;
  directionsTime: string | null;

  // URL-aware location state
  clickedPoint: { lng: number; lat: number } | null;
  setClickedPoint: (point: { lng: number; lat: number } | null) => void;

  // Map refs
  mapRef: RefObject<HTMLDivElement>;
  mapDivRef: RefObject<HTMLDivElement>;
  mapInstance: { current: maplibregl.Map | null };

  // Action handlers
  handleTogglePinDropper: () => void;
  handleShowDirectionsClick: () => void;
  handleRefetch: () => void;
  handlePinDropperLocationSelected: (coordinates: {
    lng: number;
    lat: number;
  }) => void;
  handlePinDropperCancel: () => void;

  // Direction state modifiers
  setShowDirections: (show: boolean) => void;
  clearDirections: (mapInstance: { current: maplibregl.Map | null }) => void;

  // Error handling
  error: string | null;

  // Transport mode
  transportMode: TransportMode;

  // Delivery zone visualizer menu
  isOpenDeliveryZoneVisualizerMenu: boolean;
  orderId: string;

  // Additional props for enhanced checkout
  selectedRiderId?: string | null;
  isochrones?: any[];
  vendorLocation?: { lng: number; lat: number; address?: string } | null;
  zoneDetails?: any[];
  geocoderRef?: RefObject<google.maps.Geocoder | null>;
  calculatePointDeliveryInfo?: (
    coordinates: [number, number],
    isochrones: any[],
    vendorLocation: any,
    zoneDetails: any[],
    transportMode: TransportMode
  ) => any;
}

export function MapAndSearch({
  handleSearchChange,
  searchValue,
  searchInputRef,
  isLoaded,
  loading,
  isPinDropperActive,
  isSearchLoading,
  handleClearSearch,
  predictions,
  showPredictions,
  handlePredictionSelect,
  showDirections,
  directionsReady,
  isochroneLoading,
  handleShowDirectionsClick,
  handleTogglePinDropper,
  handleRefetch,
  error,
  mapInstance,
  mapRef,
  mapDivRef,
  handlePinDropperCancel,
  directionsDistance,
  directionsTime,
  handlePinDropperLocationSelected,
  setShowDirections,
  clearDirections,
  transportMode,
  clickedPoint,
  setClickedPoint,
  isOpenDeliveryZoneVisualizerMenu,
  orderId,
  calculatePointDeliveryInfo,
  selectedRiderId,
  isochrones = [],
  vendorLocation,
  zoneDetails = [],
  geocoderRef,
}: MapAndSearchProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  // Checkout Dialog States
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // NEW: Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState<any>(null);

  const [updateWithLocation] = useMutation(UPDATE_WITH_LOCATION);
  const navigate = useNavigate();

  // Effect to automatically show info panel when directions are available
  useEffect(() => {
    if (showDirections && directionsDistance !== null && directionsTime) {
      setShowInfoPanel(true);
    }
  }, [showDirections, directionsDistance, directionsTime]);

  // Function to copy the current URL to clipboard
  const copyUrlToClipboard = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast.success("URL copied!", {
          description: "You can now share this location with others.",
          duration: 3000,
        });
        setShowShareOptions(false);
      })
      .catch(() => {
        toast.error("Failed to copy URL", {
          description: "Please try again or copy the URL manually.",
          duration: 3000,
        });
      });
  };

  // Helper function to transform order data to checkout format
  const transformOrderToCheckoutData = (
    order: any,
    deliveryAddress: string
  ) => {
    const items =
      order.items?.map((item: any) => ({
        id: item.id,
        name: item.product?.name || "Unknown Product",
        description: item.product?.description || "",
        price: item.product?.price || 0,
        quantity: item.quantity,
        image: item.product?.imageUrls?.[0] || "",
        category: item.itemType || "General",
      })) || [];

    // Parse address components if possible
    const addressParts = deliveryAddress.split(",").map((part) => part.trim());
    let city = "",
      state = "",
      zipCode = "";

    if (addressParts.length >= 2) {
      // Try to extract city, state from the last parts
      const lastPart = addressParts[addressParts.length - 1];
      const secondLastPart = addressParts[addressParts.length - 2];

      // Simple regex to find zip code
      const zipMatch = lastPart.match(/\b\d{5}(-\d{4})?\b/);
      if (zipMatch) {
        zipCode = zipMatch[0];
        state = lastPart.replace(zipMatch[0], "").trim();
        city = secondLastPart;
      } else if (addressParts.length >= 3) {
        state = lastPart;
        city = secondLastPart;
      }
    }

    return {
      items,
      deliveryLocation: {
        address: deliveryAddress,
        city: city || "",
        state: state || "",
        zipCode: zipCode || "",
        coordinates: order.coordinates
          ? {
              lat: order.coordinates[1],
              lng: order.coordinates[0],
            }
          : clickedPoint
          ? {
              lat: clickedPoint.lat,
              lng: clickedPoint.lng,
            }
          : undefined,
        instructions: "",
      },
      rider: selectedRiderId
        ? {
            id: selectedRiderId,
            name: "Assigned Rider", // You might want to fetch rider details
            avatar: "",
            rating: 4.8,
            phone: "+1234567890",
            vehicleType: "Motorcycle",
            estimatedArrival: directionsTime || "30 min",
            isOnline: true,
          }
        : undefined,
      deliveryFee: order.deliveryFee,
      serviceFee: 2.99,
      tax: calculateTax(items),
      discount: 0,
      estimatedDeliveryTime:
        order.estimatedDeliveryDate || directionsTime || "30-45 min",
      orderNumber: order.id,
      status: order.status || "PENDING",
      deliveryDistance: order.distance,
      deliveryDuration: order.duration,
    };
  };

  const calculateTax = (items: any[]) => {
    const subtotal =
      items?.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      ) || 0;
    return subtotal * 0.08; // 8% tax
  };

  // NEW: Helper function to create payment order details
  const createPaymentOrderDetails = (order: any, deliveryAddress: string) => {
    const subtotal = order.items?.reduce(
      (sum: number, item: any) => sum + (item.product?.price || 0) * item.quantity,
      0
    ) || 0;

    const deliveryFee = order.deliveryFee || 0;
    const serviceFee = 2.99;
    const tax = subtotal * 0.08; // 8% tax
    const totalAmount = subtotal + deliveryFee + serviceFee + tax;

    return {
      id: order.id,
      amount: totalAmount,
      description: `Delivery from ${vendorLocation?.address?.split(',')[0] || 'Store'} to ${deliveryAddress.split(',')[0] || 'Your location'}`,
      vendor: selectedRiderId ? "Assigned Rider" : "Delivery Service",
    };
  };

  // NEW: Updated handleLocationCheckout to be called after payment
  const handleLocationCheckout = async () => {
    if (isUpdatingLocation) return;

    try {
      setIsUpdatingLocation(true);
      setCheckoutError(null);

      // Validation checks
      if (!orderId) {
        setCheckoutError("Order ID is required");
        toast.error("Order ID is required");
        return;
      }

      if (!clickedPoint) {
        setCheckoutError("Please select a delivery location first");
        toast.error("Please select a delivery location first");
        return;
      }

      // Get point delivery info to extract isochroneMetaId
      let isochroneMetaId: string | undefined = undefined;
      if (
        isochrones.length > 0 &&
        calculatePointDeliveryInfo &&
        vendorLocation
      ) {
        const pointInfo = calculatePointDeliveryInfo(
          [clickedPoint.lng, clickedPoint.lat],
          isochrones,
          vendorLocation,
          zoneDetails,
          transportMode
        );
        if (pointInfo) {
          console.log("Point delivery info:", pointInfo);
          isochroneMetaId = pointInfo.isochroneMetaId;
          console.log("Extracted isochroneMetaId:", isochroneMetaId);
        }
      }

      // Show loading state
      toast.loading("Processing order location...", { id: "location-checkout" });

      // Collect delivery address
      let deliveryAddress = "";

      if (
        searchValue &&
        searchValue.trim() !== "" &&
        !searchValue.includes("Unnamed")
      ) {
        deliveryAddress = searchValue.trim();
      } else if (isLoaded && geocoderRef?.current) {
        try {
          const geocodeResult = await new Promise<string>((resolve, reject) => {
            geocoderRef.current!.geocode(
              { location: { lat: clickedPoint.lat, lng: clickedPoint.lng } },
              (results, status) => {
                if (status === "OK" && results && results[0]) {
                  resolve(results[0].formatted_address);
                } else {
                  reject(new Error("Geocoding failed"));
                }
              }
            );
          });
          deliveryAddress = geocodeResult;
        } catch (geocodeError) {
          console.warn("Reverse geocoding failed:", geocodeError);
          deliveryAddress = `${clickedPoint.lat.toFixed(
            6
          )}, ${clickedPoint.lng.toFixed(6)}`;
        }
      } else {
        deliveryAddress = `${clickedPoint.lat.toFixed(
          6
        )}, ${clickedPoint.lng.toFixed(6)}`;
      }

      // Prepare mutation input
      const mutationInput = {
        orderId: orderId,
        deliveryAddress: deliveryAddress,
        coordinates: [clickedPoint.lng, clickedPoint.lat],
        ...(isochroneMetaId && { isochroneMetaId: isochroneMetaId }),
        ...(selectedRiderId && { ridersId: selectedRiderId }),
      };

      console.log("Updating order with location:", mutationInput);

      // Execute the mutation
      const result = await updateWithLocation({
        variables: { input: mutationInput },
      });

      // Handle successful response
      if (result?.data?.updateWithLocation) {
        const updatedOrder = result.data.updateWithLocation;

        // Show success message
        toast.success("Order completed successfully!", {
          id: "location-checkout",
          description: "Location added and payment processed",
          duration: 4000,
        });

        console.log("Order updated successfully:", updatedOrder);

        // Clear directions and selections
        if (showDirections) {
          clearDirections(mapInstance);
          setShowDirections(false);
        }
        setClickedPoint(null);

        // Let the payment modal handle redirect to /vob
      } else {
        throw new Error("No data returned from mutation");
      }
    } catch (error: any) {
      console.error("Error updating order with location:", error);

      let errorMessage = "Failed to add location to order";
      let errorDescription = "Please try again";

      if (error.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
        if (errorMessage.includes("not found")) {
          errorDescription = "Order not found or access denied";
        } else if (errorMessage.includes("coordinates")) {
          errorDescription = "Invalid coordinates provided";
        }
      } else if (error.networkError) {
        errorMessage = "Network error";
        errorDescription = "Please check your internet connection";
      }

      setCheckoutError(errorMessage);

      toast.error(errorMessage, {
        id: "location-checkout",
        description: errorDescription,
        duration: 5000,
      });
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // NEW: Show payment modal immediately when user clicks "Payment & Confirm"
  const handlePaymentAndConfirm = () => {
    if (!clickedPoint) {
      toast.error("Please select a delivery location first");
      return;
    }

    // Collect delivery address for payment details
    let deliveryAddress = "";
    if (searchValue && searchValue.trim() !== "" && !searchValue.includes("Unnamed")) {
      deliveryAddress = searchValue.trim();
    } else {
      deliveryAddress = `${clickedPoint.lat.toFixed(6)}, ${clickedPoint.lng.toFixed(6)}`;
    }

    // Create payment order details with estimated values
    const paymentDetails = {
      id: orderId,
      amount: 25.50, // You can calculate this based on delivery fee + service fee
      description: `Delivery from ${vendorLocation?.address?.split(',')[0] || 'Store'} to ${deliveryAddress.split(',')[0] || 'Your location'}`,
      vendor: selectedRiderId ? "Assigned Rider" : "Delivery Service",
    };

    setPaymentOrderDetails(paymentDetails);
    setShowPaymentModal(true);
  };

  // Checkout dialog handlers
  const handleCheckoutClose = () => {
    setShowCheckoutDialog(false);
    setCheckoutData(null);
    setCheckoutError(null);
  };

  // NEW: Updated handlePlaceOrder to show payment modal
  const handlePlaceOrder = async () => {
    try {
      if (!checkoutData) {
        toast.error("No checkout data available");
        return;
      }

      // Close checkout dialog
      setShowCheckoutDialog(false);

      // Create payment order details
      const paymentDetails = createPaymentOrderDetails(
        checkoutData,
        checkoutData.deliveryLocation.address
      );
      setPaymentOrderDetails(paymentDetails);

      // Show payment modal
      setShowPaymentModal(true);

      toast.info("Please complete payment to finalize your order");

    } catch (error) {
      toast.error("Failed to proceed to payment", {
        description: "Please try again.",
        duration: 3000,
      });
    }
  };

  // NEW: Updated payment completion handler to call handleLocationCheckout
  const handlePaymentComplete = (paymentData: any) => {
    console.log("Payment completed:", paymentData);
    
    toast.success("Payment successful!", {
      description: `Method: ${paymentData.method.toUpperCase()}`,
      duration: 3000,
    });

    // Close payment modal
    setShowPaymentModal(false);
    setPaymentOrderDetails(null);

    // Now process the location checkout
    handleLocationCheckout();
  };

  // NEW: Payment modal handlers
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentOrderDetails(null);
    // Optionally return to checkout dialog
    setShowCheckoutDialog(true);
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (!checkoutData) return;

    setCheckoutData({
      ...checkoutData,
      items: checkoutData.items.map((item: any) =>
        item.id === itemId ? { ...item, quantity } : item
      ),
    });
  };

  const handleRemoveItem = (itemId: string) => {
    if (!checkoutData) return;

    setCheckoutData({
      ...checkoutData,
      items: checkoutData.items.filter((item: any) => item.id !== itemId),
    });
  };

  const handleEditLocation = () => {
    setShowCheckoutDialog(false);
    toast.info("You can now select a new location on the map");
  };

  // Function to toggle info panel
  const toggleInfoPanel = () => {
    setShowInfoPanel(!showInfoPanel);
  };

  return (
    <>
      <div className="space-y-1">
        <div className="relative" ref={searchInputRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <Search className="h-5 w-5 text-[#86868B]" />
            </div>
            <Input
              type="text"
              placeholder="Search for a location to check delivery..."
              className="pl-12 pr-10 py-6 rounded-xl border-[#E5E5EA] bg-white focus-visible:ring-[#0071E3] text-[#1D1D1F]"
              value={searchValue}
              onChange={handleSearchChange}
              disabled={
                !isLoaded ||
                loading ||
                isPinDropperActive ||
                isochroneLoading ||
                isOpenDeliveryZoneVisualizerMenu
              }
            />
            {isSearchLoading && (
              <div className="absolute inset-y-0 right-10 flex items-center pr-3">
                <Loader2 className="h-4 w-4 text-[#86868B] animate-spin" />
              </div>
            )}
            {searchValue && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-4"
                onClick={handleClearSearch}
              >
                <X className="h-5 w-5 text-[#86868B] hover:text-[#1D1D1F]" />
              </button>
            )}
          </div>

          {/* Predictions dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-[#E5E5EA] overflow-hidden">
              <ul className="py-1">
                {predictions.map((place) => (
                  <li
                    key={place.place_id}
                    className="px-4 py-3 hover:bg-[#F5F5F7] cursor-pointer transition-colors"
                    onClick={() => handlePredictionSelect(place)}
                  >
                    <div className="font-medium text-[#1D1D1F]">
                      {place.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-[#86868B]">
                      {place.structured_formatting.secondary_text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Show error messages when they exist */}
        {(error || checkoutError) && (
          <div className="bg-[#FEF2F2] p-4 rounded-xl text-[#EF4444] border border-[#FEE2E2]">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error || checkoutError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefetch}
              className="mt-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Map with isochrones */}
        <div
          className={`h-[500px] rounded-2xl overflow-hidden border-0 shadow-sm bg-white relative ${
            isOpenDeliveryZoneVisualizerMenu
              ? "pointer-events-none blur-sm"
              : ""
          }`}
        >
          <div ref={mapRef} className="w-full h-full relative rounded-lg" />
          <div
            id="map-service"
            ref={mapDivRef}
            style={{ display: "none" }}
          ></div>

          {/* Pin Dropper Component */}
          {isPinDropperActive && mapInstance.current && (
            <PinDropper
              mapInstance={mapInstance}
              onLocationSelected={handlePinDropperLocationSelected}
              onCancel={handlePinDropperCancel}
            />
          )}

          {/* Loading overlay */}
          {(loading || isochroneLoading) && (
            <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#0071E3] mb-2" />
                <p className="text-[#0071E3] font-medium">
                  {isochroneLoading
                    ? "Loading delivery zones..."
                    : "Loading map..."}
                </p>
              </div>
            </div>
          )}

          {/* Map badge - shows vendor name */}
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center shadow-sm">
              <MapIcon className="h-3 w-3 mr-1.5 text-[#0071E3]" />
              <span className="font-medium text-[#1D1D1F]">WinneMart</span>
            </div>
          </div>

          {/* Pin dropper button */}
          <div className="absolute bottom-3 right-3 z-10">
            {showDirections && (
              <Button
                size="sm"
                variant={isPinDropperActive ? "default" : "outline"}
                className="rounded-full text-xs p bg-green-600 hover:bg-green-700 text-white"
                onClick={handlePaymentAndConfirm}
                disabled={isUpdatingLocation || !clickedPoint}
              >
                {isUpdatingLocation ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5" />
                    Payment & Confirm
                  </span>
                )}
              </Button>
            )}
            {!isPinDropperActive && directionsReady && !showDirections && (
              <Button
                size="sm"
                variant={isPinDropperActive ? "default" : "outline"}
                className="bg-[#0071E3] hover:bg-[#0062C3] text-white text-xs rounded-full px-4 shadow-sm"
                onClick={handleShowDirectionsClick}
              >
                <Navigation className="h-3 w-3 mr-1.5" />
                Show Directions
              </Button>
            )}
            <Button
              size="sm"
              variant={isPinDropperActive ? "default" : "outline"}
              className={`rounded-full text-xs px-4 ${
                isPinDropperActive
                  ? "bg-[#0071E3] text-white"
                  : "border-[#0071E3] text-[#0071E3]"
              }`}
              onClick={handleTogglePinDropper}
              disabled={loading || isochroneLoading}
            >
              <MapPin className="h-3 w-3 mr-1.5" />
              {isPinDropperActive ? "Exit Pin Mode" : "Drop Pin on Map"}
            </Button>
          </div>
        </div>
      </div>

      {/* Remove Checkout Dialog - we're going straight to payment */}
      
      {/* Payment Modal - shows immediately when user clicks "Payment & Confirm" */}
      {paymentOrderDetails && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={handlePaymentModalClose}
          orderDetails={paymentOrderDetails}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </>
  );
}