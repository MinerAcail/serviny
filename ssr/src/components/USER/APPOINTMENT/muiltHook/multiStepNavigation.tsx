import { CheckCircle, ChevronDown, Eye, EyeOff, FileText,  Layers2, Loader2, MapPin, Navigation, Package, Pin, Target, Truck } from "lucide-react";
import type { PricingZone } from "../BookingHooks";
import type { MultiDeliveryItem } from "../multiDeliveryRequest";
import {  useState } from "react";
import { useSearchParams } from "react-router";
import type { Location } from "../pinDropHook";
import {  distance, point } from "@turf/turf";
import type { totalCalculations } from "../multibookingMenu";
// import { ZONE_COLORS } from "@/components/GLOBAL/format";
export function MultiStepNavigation({
  currentStep,
  setCurrentStep,
  hasCalculations,
  isBookingComplete,
  isCargo = false,
}: {
  currentStep: "locations" | "review" | "complete";
  setCurrentStep: (step: "locations" | "review" | "complete") => void;
  hasCalculations: boolean;
  isBookingComplete: boolean;
  isCargo?: boolean;
}) {
  const steps = [
    { id: "locations", label: "Setup", icon: MapPin },
    { id: "review", label: "Review", icon: CheckCircle },
    { id: "complete", label: "Complete", icon: isCargo ? FileText : Package },
  ] as const;

  return (
    <div className="space-y-3">
      {/* Step Indicators */}
      <div className="flex items-center justify-center space-x-2">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted =
            (step.id === "locations" && hasCalculations) ||
            (step.id === "review" && isBookingComplete) ||
            (step.id === "complete" && isBookingComplete);
          const isAccessible =
            step.id === "locations" ||
            (step.id === "review" && hasCalculations) ||
            (step.id === "complete" && isBookingComplete);

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isAccessible && setCurrentStep(step.id)}
                disabled={!isAccessible}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive
                    ? isCargo 
                      ? "bg-orange-600 text-white" 
                      : "bg-blue-600 text-white"
                    : isCompleted
                    ? "bg-green-500 text-white"
                    : isAccessible
                    ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-0.5 mx-1 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Labels */}
      <div className="flex justify-center">
        <span className="text-sm font-medium text-gray-700">
          {steps.find((step) => step.id === currentStep)?.label}
          {isCargo && currentStep === "complete" && " (Invoice Pending)"}
        </span>
      </div>
    </div>
  );
}
interface MapAndMultiBookingProps {
  // Map refs
//   mapRef: RefObject<HTMLDivElement>;
  mapRef: React.RefObject<HTMLDivElement | null>;

  mapInstance: { current: maplibregl.Map | null };
  mapLoaded: boolean;

  // Location state
  pickupLocation: Location | null;
  deliveryItems: MultiDeliveryItem[];

  // Calculation state
  totalCalculations: {
    totalDistance: number;
    totalPrice: number;
    averageDuration: string;
    itemCalculations: Array<{
      id: string;
      distance: number;
      duration: string;
      price: number;
    }>;
  } | null;
  isCalculating: boolean;

  // UI state
  isOpenBookingMenu: boolean;
  showZones: boolean;
  onToggleZones: () => void;

  // Pin drop functionality
  isPinDropActive?: boolean;
  pinDropMode?: "pickup" | "dropoff" | null;
  onStartPinDrop?: () => void;
  hasPickup?: boolean;
  hasDeliveryItems?: boolean;

  // Loading and errors
  loading: boolean;
  error: string | null;
  riderZones: PricingZone[];
  
  // Route dialog
  showRouteDialog: boolean;
  setShowRouteDialog: (show: boolean) => void;
}
// MAIN COMPONENT
export function MapAndMultiBooking({
  mapRef,
  pickupLocation,
  deliveryItems,
  totalCalculations,
  isCalculating,
  isOpenBookingMenu,
  showZones,
//   onToggleZones,
  loading,
  error,
  isPinDropActive = false,
  pinDropMode = null,
  onStartPinDrop,
  showRouteDialog,
  setShowRouteDialog,
}: MapAndMultiBookingProps) {



  return (
    <div className="space-y-4 w-full">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 p-4 rounded-xl text-red-700 border border-red-200">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Pin Drop Instructions for Multi-Delivery */}
      {isPinDropActive && pinDropMode && (
        <div className="bg-blue-50/90 backdrop-blur-sm border border-blue-200 rounded-xl shadow-sm overflow-hidden transition-all">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              {pinDropMode === "pickup" ? (
                <MapPin className="h-4 w-4 text-green-600" />
              ) : (
                <Package className="h-4 w-4 text-red-600" />
              )}
              <span className="font-medium text-sm text-blue-900">
                Pin Drop Mode: {pinDropMode === "pickup" ? "Pickup (Zone Center)" : "Delivery Destination"}
              </span>
            </div>
          </div>
          <div className="px-3 pb-3">
            <p className="text-xs text-blue-700">
              {pinDropMode === "pickup" 
                ? "Drop pin to set the center point for all delivery pricing zones"
                : "Drop pin to set a delivery destination (Note: Use the dialog to specify which delivery item)"
              }
            </p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        className={`h-[86vh] w-full rounded-2xl overflow-hidden border shadow-sm bg-white relative ${
          isOpenBookingMenu ? "pointer-events-none blur-sm" : ""
        } ${isPinDropActive ? "ring-2 ring-blue-300 ring-opacity-50" : ""}`}
      >
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-blue-600 font-medium">Loading multi-delivery map...</p>
            </div>
          </div>
        )}

        {/* iOS-style Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Zone Toggle Button */}
          {showRouteDialog && (
            <button
              onClick={() => setShowRouteDialog(!showRouteDialog)}
              className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
              title={showRouteDialog ? "Hide zones" : "Show zones"}
            >
              {showRouteDialog ? (
                <EyeOff className="h-5 w-5 text-gray-700" />
              ) : (
                <Eye className="h-5 w-5 text-gray-700" />
              )}
            </button>
          )}

          {/* Pin Drop Button */}
          {onStartPinDrop && (
            <button
              onClick={onStartPinDrop}
              className={`w-10 h-10 backdrop-blur-sm rounded-full shadow-lg border flex items-center justify-center transition-colors ${
                isPinDropActive
                  ? "bg-blue-500 border-blue-600 text-white"
                  : "bg-white/90 border-gray-200 text-gray-700 hover:bg-white"
              }`}
              title="Drop pin on map"
            >
              <Pin className="h-5 w-5" />
            </button>
          )}

          {/* Multi-Delivery Indicator */}
          {deliveryItems.length > 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-3 py-1 flex items-center space-x-1">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">
                {deliveryItems.filter(item => item.deliveryAddress).length}/{deliveryItems.length}
              </span>
            </div>
          )}
        </div>

        {/* Multi-Delivery Summary Card */}
        {(pickupLocation || deliveryItems.length > 0) && !isPinDropActive && (
          <div className="absolute top-3 left-3 z-10">
            <MultiDeliverySummaryCard
              pickupLocation={pickupLocation}
              deliveryItems={deliveryItems}
              totalCalculations={totalCalculations}
              isCalculating={isCalculating}
            />
          </div>
        )}

        {/* Route Overview Card */}
        {totalCalculations && !isPinDropActive && (
          <div className="absolute bottom-20 left-3 z-10">
            <MultiDeliveryRouteCard
              totalCalculations={totalCalculations}
              deliveryItems={deliveryItems}
            />
          </div>
        )}

        {/* Coverage Zones Helper */}
        <div className="absolute top-3 left-3 z-10">
          <MultiDeliveryCoverageHelper
            pickupLocation={pickupLocation}
            showZones={showZones}
            deliveryItemCount={deliveryItems.filter(item => item.deliveryAddress).length}
          />
        </div>
      </div>

      {/* Multi-Delivery Map Status */}
      <MultiDeliveryMapStatus
        pickupLocation={pickupLocation}
        deliveryItems={deliveryItems}
        // totalCalculations={totalCalculations}
        isCalculating={isCalculating}
      />
    </div>
  );
}

function MultiDeliverySummaryCard({
  pickupLocation,
  deliveryItems,
  totalCalculations,
  isCalculating,
}: {
  pickupLocation: Location | null;
  deliveryItems: MultiDeliveryItem[];
  totalCalculations:  totalCalculations | null;
  isCalculating: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [searchParams] = useSearchParams()
  const isCargo = searchParams.get('cargo') === 'true'

  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all max-w-sm">
      {/* Header with toggle */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Multi-Delivery</h3>
            <p className="text-xs text-gray-600">
              {completedItems.length}/{deliveryItems.length} destinations ready
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isCargo && totalCalculations && (
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                GH₵{totalCalculations.totalPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Pickup Location */}
          {pickupLocation && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-900">Pickup Center</span>
              </div>
              <p className="text-xs text-green-700 truncate">
                {pickupLocation.address.split(",")[0]}
              </p>
            </div>
          )}

          {/* Calculation Summary */}
          {totalCalculations && !isCalculating && (
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    {completedItems.length}
                  </div>
                  <div className="text-xs text-blue-700">Items</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    {totalCalculations.totalDistance}km
                  </div>
                  <div className="text-xs text-blue-700">Total</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-900">
                    {totalCalculations.averageDuration}
                  </div>
                  <div className="text-xs text-blue-700">Est. Time</div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isCalculating && (
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">Calculating prices...</span>
            </div>
          )}

          {/* Delivery Items Toggle */}
          {deliveryItems.length > 0 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowItemDetails(!showItemDetails);
                }}
                className="w-full flex items-center justify-between p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>Delivery Details ({completedItems.length})</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showItemDetails ? 'rotate-180' : ''}`} />
              </button>

              {/* Item Details */}
              {showItemDetails && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {deliveryItems.map((item, index) => {
                    const calculation = totalCalculations?.itemCalculations.find(calc => calc.id === item.id);
                    const isComplete = item.deliveryAddress && item.itemDescription && 
                                     item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0;

                    return (
                      <div 
                        key={item.id} 
                        className={`p-3 rounded-lg border ${
                          isComplete ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                            isComplete ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {item.itemDescription || `Item ${index + 1}`}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-600 truncate mb-2">
                          {item.deliveryAddress || "No address set"}
                        </p>

                        {calculation && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">{calculation.distance}km</span>
                            {!isCargo && (
                              <span className="font-medium text-green-600">GH₵{calculation.price.toFixed(2)}</span>

                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


// ==========================================
// HELPER: Convert Delivery Items to Update Inputs
// ==========================================
export interface UpdateBookingLocationInput {
  bookId: string;
  deliveryAddress?: string;
  dropoffLocation?: number[]; // [lng, lat]
  pickupLocation?: number[]; // [lng, lat]
  rangeMetaId?: string;
  ridersId?: string;
}

export function ConvertDeliveryItemsToUpdateInputs(
  deliveryItems: MultiDeliveryItem[],
  pickupLocation: Location,
  riderId?: string,
  zones?: PricingZone[] // Add zones parameter to calculate rangeMetaId per item
): UpdateBookingLocationInput[] {
  return deliveryItems.map((item) => {
    let rangeMetaId: string | undefined;

    // Calculate rangeMetaId for this specific item if zones are provided
    if (zones && zones.length > 0) {
      // Use existing calculated data if available
      if (item.calculated && item.calculated.distance) {
        const distance = item.calculated.distance;
        const matchedZone =
          zones.find(
            (zone) => distance >= zone.startKm && distance < zone.endKm
          ) || zones[zones.length - 1];

        rangeMetaId = matchedZone?.id;
      } else {
        // Calculate distance and find zone
        const dropoffLocation: Location = {
          lat: item.dropoffLocation[0],
          lng: item.dropoffLocation[1],
          address: item.deliveryAddress,
        };

        // Calculate distance using turf (you'll need to import turf)
        const from = point([pickupLocation.lng, pickupLocation.lat]);
        const to = point([dropoffLocation.lng, dropoffLocation.lat]);
        const distances = distance(from, to, { units: "kilometers" });

        const matchedZone =
          zones.find(
            (zone) => distances >= zone.startKm && distances < zone.endKm
          ) || zones[zones.length - 1];

        rangeMetaId = matchedZone?.id;
      }
    }

    return {
      bookId: item.id,
      deliveryAddress: item.deliveryAddress,
      pickUpAddress: pickupLocation.address,
      dropoffLocation: [item.dropoffLocation[1], item.dropoffLocation[0]], // Convert lat,lng to lng,lat
      pickupLocation: [pickupLocation.lng, pickupLocation.lat],
      ...(riderId && { ridersId: riderId }),
      ...(rangeMetaId && { rangeMetaId }), // Now each item gets its own rangeMetaId
    };
  });
}
export interface MultiGroupBooking {
  id: string;
  startTime: string;
  endTime: string;
  dropoffLocation?: number[];
  pickupLocation?: number[];
  deliveryAddress?: string;
  item?: string;
  notes?: string;
  tableSize: number;
  multiGroupId?: string;
  serviceId: string;
  riderId?: string;
  isConfirmed?: boolean;
  distance?: string;
  duration?: string;
  deliveryFee?: string;
  updatedAt: string;
}
// ==========================================
// HELPER: Convert Multi-Group Bookings to Delivery Items
// ==========================================
export function ConvertBookingsToDeliveryItems(
  bookings: MultiGroupBooking[]
): MultiDeliveryItem[] {
 

  return bookings.map((booking, index) => {


    // Validate dropoffLocation
    let dropoffLocation: [number, number] = [0, 0];
    if (booking.dropoffLocation && Array.isArray(booking.dropoffLocation)) {
      if (booking.dropoffLocation.length >= 2) {
        const [lng, lat] = booking.dropoffLocation;
        dropoffLocation = [lat, lng]; // Convert lng,lat to lat,lng
        
      } 
    } 

 



    const convertedItem: MultiDeliveryItem = {
      id: booking.id,
      itemDescription: booking.item || `Item ${index + 1}`,
      deliveryAddress: booking.deliveryAddress || "",
      dropoffLocation,
      notes: booking.notes || "",
      // Add calculated data if available
      calculated:
        booking.distance && booking.deliveryFee
          ? {
              distance: parseFloat(booking.distance),
              duration: booking.duration || "Unknown",
              price: parseFloat(booking.deliveryFee),
            }
          : undefined,
    };

    // console.log(`✅ Converted booking ${index} result:`, convertedItem);
    return convertedItem;
  });
}
// NEW: Multi-Delivery Route Info Card
function MultiDeliveryRouteCard({
  totalCalculations,
  deliveryItems,
}: {
  totalCalculations: totalCalculations;
  deliveryItems: MultiDeliveryItem[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchParams] = useSearchParams()
  const isCargo = searchParams.get('cargo') === 'true'

  if (!totalCalculations) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Navigation className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-sm text-gray-900">Route Overview</span>
        </div>
        <div className="flex items-center space-x-2">
            {!isCargo && (
          <div className="text-right">
            <div className="text-sm font-bold text-blue-600">
              GH₵{totalCalculations.totalPrice.toFixed(2)}
            </div>
          </div>
                              
                            )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-sm font-bold text-blue-900">
                {totalCalculations.totalDistance}km
              </div>
              <div className="text-xs text-blue-700">Total Distance</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2">
              <div className="text-sm font-bold text-green-900">
                {deliveryItems.length}
              </div>
              <div className="text-xs text-green-700">Deliveries</div>
            </div>
          </div>

          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
            <div className="flex items-center">
              <Truck className="h-3 w-3 mr-1" />
              <span>Estimated total delivery time: {totalCalculations.averageDuration}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// NEW: Coverage Zones Helper for Multi-Delivery
function MultiDeliveryCoverageHelper({
  pickupLocation,
  showZones,
  deliveryItemCount,
}: {
  pickupLocation: Location | null;
  showZones: boolean;
  deliveryItemCount: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!pickupLocation || !showZones || deliveryItemCount > 0) return null;

  return (
    <div className="bg-green-50/90 backdrop-blur-sm border border-green-200 rounded-xl shadow-sm overflow-hidden transition-all">
      <div 
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <Layers2 className="h-4 w-4 text-green-600" />
          <span className="font-medium text-sm text-green-900">Coverage Zones Active</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-green-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-3 pb-3">
          <p className="text-xs text-green-700">
            Colored circles show delivery pricing zones from your pickup center. 
            Each delivery destination will be priced based on its distance from this center.
          </p>
        </div>
      )}
    </div>
  );
}

// NEW: Multi-Delivery Map Status Component
function MultiDeliveryMapStatus({
  pickupLocation,
  deliveryItems,
 
}: {
  pickupLocation: Location | null;
  deliveryItems: MultiDeliveryItem[];
  totalCalculations?: totalCalculations;
  isCalculating?: boolean;
}) {
 

  if (!pickupLocation && deliveryItems.length === 0) {
    return (
      <div className="bg-gray-50/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <Target className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-gray-700 mb-1">Setup Multi-Delivery</h4>
            <p className="text-sm text-gray-600 mb-2">
              Set one pickup location and multiple delivery destinations to see pricing and routes.
            </p>
            <p className="text-xs text-gray-500">
              Perfect for multiple packages, restaurant orders, or any scenario with one pickup point 
              but multiple delivery addresses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}