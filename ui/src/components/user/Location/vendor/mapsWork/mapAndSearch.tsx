
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapIcon,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react";
import { PinDropper } from "./PinDropper";
import { Input } from "@/components/ui/input";
import PaymentModal from "./payment-modal";
import { RefObject, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { TransportMode } from "./dataUtils";
import { toast } from "sonner";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useNavigate } from "react-router";

// FIXED: Ensure CSS is imported
import "maplibre-gl/dist/maplibre-gl.css";

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

const GET_ORDER_DETAILS = gql`
  query GetOrderDetails($orderId: String!) {
    getOrderDetails(orderId: $orderId) {
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
          description
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

interface PaymentResult {
  method: "cash" | "momo";
  referenceCode?: string;
  phoneNumber?: string;
  amount: number;
  orderId: string;
  timestamp: string;
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
  // FIXED: Simplified state management based on working version
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [redirectProgress, setRedirectProgress] = useState(0);
  
  // NEW: Store final payment details for success modal
  const [finalPaymentDetails, setFinalPaymentDetails] = useState<{
    itemsTotal: number;
    deliveryFee: number;
    totalPaid: number;
  } | null>(null);

  const [updateWithLocation] = useMutation(UPDATE_WITH_LOCATION);
  const navigate = useNavigate();

  // Fetch order details
  const { data: orderData, loading: orderLoading, error: orderError } = useQuery(GET_ORDER_DETAILS, {
    variables: { orderId },
    fetchPolicy: 'cache-and-network',
  });

  // Calculate items total from order data
  const calculateItemsTotal = () => {
    if (!orderData?.getOrderDetails?.items) return 0;
    
    return orderData.getOrderDetails.items.reduce(
      (sum: number, item: any) => {
        const price = Number(item.product?.price) || 0;
        const quantity = item.quantity || 0;
        return sum + (price * quantity);
      },
      0
    );
  };

  // Enhanced delivery zone price calculation
  const getDeliveryZonePriceAndOrderDetails = () => {
    let zonePriceCalculated = 0;
    let isochroneMetaId: string | undefined = undefined;

    if (
      !clickedPoint ||
      !isochrones.length ||
      !calculatePointDeliveryInfo ||
      !vendorLocation ||
      !zoneDetails.length
    ) {
      return { zonePriceCalculated: 0, isochroneMetaId: undefined };
    }

    try {
      const pointInfo = calculatePointDeliveryInfo(
        [clickedPoint.lng, clickedPoint.lat],
        isochrones,
        vendorLocation,
        zoneDetails,
        transportMode
      );

      if (pointInfo) {
        if (pointInfo.inZone && pointInfo.zone) {
          zonePriceCalculated = pointInfo.zone.price || pointInfo.deliveryFee || 0;
          isochroneMetaId = pointInfo.isochroneMetaId;
        } else {
          zonePriceCalculated = pointInfo.deliveryFee || 0;
        }
      }
    } catch (error) {
      console.error("❌ Error calculating point delivery info:", error);
    }

    return { zonePriceCalculated, isochroneMetaId };
  };

  // FIXED: Payment and confirm handler based on working version
  const handlePaymentAndConfirm = () => {
    if (!clickedPoint) {
      toast.error("Please select a delivery location first");
      return;
    }

    if (orderLoading) {
      toast.error("Order data is still loading, please wait...");
      return;
    }

    if (orderError || !orderData?.getOrderDetails) {
      toast.error("Failed to load order details");
      return;
    }

    // Collect delivery address for payment details
    let deliveryAddress = "";
    if (searchValue && searchValue.trim() !== "" && !searchValue.includes("Unnamed")) {
      deliveryAddress = searchValue.trim();
    } else {
      deliveryAddress = `${clickedPoint.lat.toFixed(6)}, ${clickedPoint.lng.toFixed(6)}`;
    }

    // Calculate totals
    const { zonePriceCalculated } = getDeliveryZonePriceAndOrderDetails();
    const itemsTotal = calculateItemsTotal();
    const totalAmount = itemsTotal + zonePriceCalculated;

    // Create payment order details
    const paymentDetails = {
      id: orderId,
      amount: totalAmount,
      description: `Order delivery from ${vendorLocation?.address?.split(',')[0] || 'Store'} to ${deliveryAddress.split(',')[0] || 'Your location'}`,
      vendor: "WinneMart",
      itemsTotal: itemsTotal,
      deliveryFee: zonePriceCalculated,
    };

    setPaymentOrderDetails(paymentDetails);
    setShowPaymentModal(true);
  };

  // FIXED: Location checkout after payment based on working version
  const handleLocationCheckout = async () => {
    if (isUpdatingLocation) return;

    try {
      setIsUpdatingLocation(true);
      setCheckoutError(null);

      // Get point delivery info to extract isochroneMetaId
      let isochroneMetaId: string | undefined = undefined;
      if (
        isochrones.length > 0 &&
        calculatePointDeliveryInfo &&
        vendorLocation
      ) {
        const pointInfo = calculatePointDeliveryInfo(
          [clickedPoint!.lng, clickedPoint!.lat],
          isochrones,
          vendorLocation,
          zoneDetails,
          transportMode
        );
        if (pointInfo) {
          isochroneMetaId = pointInfo.isochroneMetaId;
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
              { location: { lat: clickedPoint!.lat, lng: clickedPoint!.lng } },
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
          deliveryAddress = `${clickedPoint!.lat.toFixed(
            6
          )}, ${clickedPoint!.lng.toFixed(6)}`;
        }
      } else {
        deliveryAddress = `${clickedPoint!.lat.toFixed(
          6
        )}, ${clickedPoint!.lng.toFixed(6)}`;
      }

      // Prepare mutation input
      const mutationInput = {
        orderId: orderId,
        deliveryAddress: deliveryAddress,
        coordinates: [clickedPoint!.lng, clickedPoint!.lat],
        ...(isochroneMetaId && { isochroneMetaId: isochroneMetaId }),
        ...(selectedRiderId && { ridersId: selectedRiderId }),
      };

      // Execute the mutation
      const result = await updateWithLocation({
        variables: { input: mutationInput },
      });

      // Handle successful response
      if (result?.data?.updateWithLocation) {
        // Show success message
        toast.success("Order completed successfully!", {
          id: "location-checkout",
          description: "Location added and payment processed",
          duration: 4000,
        });

        // Clear directions and selections
        if (showDirections) {
          clearDirections(mapInstance);
          setShowDirections(false);
        }
        setClickedPoint(null);

        // Show success modal and start redirect
        setShowSuccessMessage(true);
        setRedirectProgress(0);
      } else {
        throw new Error("No data returned from mutation");
      }
    } catch (error: any) {
      console.error("Error updating order with location:", error);

      let errorMessage = "Failed to add location to order";
      let errorDescription = "Please try again";

      if (error.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
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

  // Payment completion handler
  const handlePaymentComplete = (paymentData: PaymentResult) => {
    console.log("Payment completed:", paymentData);
    
    toast.success("Payment successful!", {
      description: `Method: ${paymentData.method.toUpperCase()}`,
      duration: 3000,
    });

    // FIXED: Store payment details before clearing modal
    if (paymentOrderDetails) {
      setFinalPaymentDetails({
        itemsTotal: paymentOrderDetails.itemsTotal || 0,
        deliveryFee: paymentOrderDetails.deliveryFee || 0,
        totalPaid: paymentOrderDetails.amount || 0,
      });
    }

    // Close payment modal
    setShowPaymentModal(false);
    setPaymentOrderDetails(null);

    // Now process the location checkout
    handleLocationCheckout();
  };

  // Payment modal handlers
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentOrderDetails(null);
  };

  // Redirect effect
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    if (showSuccessMessage) {
      progressInterval = setInterval(() => {
        setRedirectProgress((prev) => {
          const newProgress = prev + 2;
          if (newProgress >= 100) {
            window.location.href = '/vob';
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
  }, [showSuccessMessage]);

  // Show loading if order data is still loading
  if (orderLoading) {
    return (
      <div className="space-y-1">
        <div className="h-[500px] rounded-2xl overflow-hidden border-0 shadow-sm bg-white relative">
          <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0071E3] mb-2" />
              <p className="text-[#0071E3] font-medium">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if order failed to load
  if (orderError) {
    return (
      <div className="space-y-1">
        <div className="bg-[#FEF2F2] p-4 rounded-xl text-[#EF4444] border border-[#FEE2E2]">
          <p className="font-medium">Failed to load order details</p>
          <p className="text-sm">{orderError.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefetch}
            className="mt-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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

          {/* Action buttons */}
          <div className="absolute bottom-3 right-3 z-10 flex gap-2">
            {/* FIXED: Payment & Confirm button */}
            {showDirections && (
              <Button
                size="sm"
                className="rounded-full text-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={handlePaymentAndConfirm}
                disabled={isUpdatingLocation || !clickedPoint || orderLoading}
              >
                {isUpdatingLocation ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Processing...
                  </span>
                ) : orderLoading ? (
                  <span className="flex items-center">
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Loading Order...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1.5" />
                    Payment & Confirm
                  </span>
                )}
              </Button>
            )}

            {/* Show Directions button */}
            {!isPinDropperActive && directionsReady && !showDirections && (
              <Button
                size="sm"
                className="bg-[#0071E3] hover:bg-[#0062C3] text-white text-xs rounded-full px-4 shadow-sm"
                onClick={handleShowDirectionsClick}
              >
                <Navigation className="h-3 w-3 mr-1.5" />
                Show Directions
              </Button>
            )}

            {/* Pin Dropper button */}
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

          {/* Order summary overlay */}
          {orderData?.getOrderDetails && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl text-xs shadow-sm border border-gray-200/50">
                <div className="text-gray-600 mb-1">Order Total</div>
                <div className="font-bold text-green-600">
                  GH₵{calculateItemsTotal().toFixed(2)}
                </div>
                <div className="text-gray-500 text-[10px]">
                  {orderData.getOrderDetails.items?.length || 0} items
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {paymentOrderDetails && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={handlePaymentModalClose}
          orderDetails={paymentOrderDetails}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* Success Message with Redirect Progress */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-[90vw] shadow-2xl">
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-green-300/40 shadow-lg">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              {/* Success Message */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Updated Successfully!</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Your delivery location has been added and payment confirmed.
              </p>
              
              {/* Order Details */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600">Items Total:</span>
                  <span className="font-medium">GH₵{finalPaymentDetails?.itemsTotal?.toFixed(2) || calculateItemsTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-medium">GH₵{finalPaymentDetails?.deliveryFee?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between items-center font-bold">
                  <span className="text-gray-900">Total Paid:</span>
                  <span className="text-green-600">GH₵{finalPaymentDetails?.totalPaid?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              {/* Redirect Section */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center border border-blue-300/40 shadow-lg">
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>
                
                <h4 className="text-md font-semibold text-gray-900 mb-2">Redirecting...</h4>
                <p className="text-gray-600 mb-4 text-sm">
                  Taking you to view all your orders
                </p>
                
                {/* Progress Bar */}
                <div className="w-full max-w-xs mx-auto mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                    <span>Loading</span>
                    <span>{Math.round(redirectProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
            </div>
          </div>
        </div>
      )}
    </>
  );
}