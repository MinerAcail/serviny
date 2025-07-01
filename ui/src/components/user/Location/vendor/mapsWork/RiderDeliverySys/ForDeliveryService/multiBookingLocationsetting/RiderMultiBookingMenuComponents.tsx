// ==========================================
// RiderMultiBookingMenu - Sub Components
// ==========================================

"use client";

import { useState } from "react";
import {
  MapPin,
  CheckCircle,
  Package,
  Star,
  Phone,
  Loader2,
  Plus,
  Truck,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  Navigation,
  StopCircle,
  Route,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Import cargo utilities
import { getCargoTypeLabel } from "../cargoDataQuery";

// REUSE: Import existing types
import type {
  RiderProfile,
  PricingZone,
} from "../riderBookingHooks";
import { ZONE_COLORS } from "@/components/config/map";

// Import multi-delivery types
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest";

// ==========================================
// RIDER PROFILE CARD
// ==========================================

export function RiderProfileCard({ 
  riderProfile, 
  isCargo 
}: { 
  riderProfile: RiderProfile; 
  isCargo: boolean 
}) {
  return (
    <Card className={`border-0 ${
      isCargo 
        ? "bg-gradient-to-r from-orange-50 to-amber-50" 
        : "bg-gradient-to-r from-blue-50 to-indigo-50"
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage
              src={riderProfile.dpfile || "/placeholder.svg"}
              alt={riderProfile.name}
            />
            <AvatarFallback className={`text-white text-sm font-medium ${
              isCargo ? "bg-orange-600" : "bg-blue-600"
            }`}>
              {riderProfile.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {riderProfile.name}
              </h3>
              <Badge
                variant="default"
                className="text-xs px-2 py-0 bg-green-100 text-green-800 border-green-200"
              >
                Available
              </Badge>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span>4.8</span>
              </div>
              <span>{isCargo ? "Cargo Vehicle" : "Motorcycle"}</span>
              <span className={`font-medium ${isCargo ? "text-orange-600" : "text-blue-600"}`}>
                {isCargo ? "Cargo Service" : "Multi-Delivery"}
              </span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              {isCargo 
                ? "Specializes in cargo and heavy item deliveries" 
                : "Specializes in multi-point deliveries"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// PRICING ZONES CARD (Non-cargo only)
// ==========================================

export function PricingZonesCard({ zones }: { zones: PricingZone[] }) {
  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-blue-600" />
          Pricing Zones (Per Delivery)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {zones.map((zone, index) => (
            <div
              key={zone.id}
              className="grid items-center justify-center p-3 rounded-lg bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length],
                  }}
                />
                <span className="text-[11px] font-medium">
                  {zone.startKm}km - {zone.endKm}km
                </span>
              </div>
              <span className="font-semibold text-[13px] text-center text-gray-900">
                GH₵{zone.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            Each delivery destination is priced separately based on distance from pickup center.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// CARGO INFORMATION CARD
// ==========================================

export function CargoInformationCard({ 
  cargoType, 
  splitCargo, 
  cargoLoading, 
  hasMultipleVehicleTypes, 
  allTransportTypes, 
  cargoError 
}: { 
  cargoType: string; 
  splitCargo: boolean; 
  cargoLoading: boolean;
  hasMultipleVehicleTypes: boolean;
  allTransportTypes: string[];
  cargoError: string | null;
}) {
  if (cargoLoading) {
    return (
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <Truck className="h-4 w-4 mr-2 text-orange-600" />
            Loading Cargo Details...
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
            <span className="ml-2 text-sm text-gray-600">Fetching cargo information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cargoError) {
    return (
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            <Truck className="h-4 w-4 mr-2 text-orange-600" />
            Cargo Service Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
         <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Invoice-Based Pricing</p>
                <p className="text-xs text-blue-700">
                  Pricing will be calculated based on actual cargo requirements and sent via invoice.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
          <Truck className="h-4 w-4 mr-2 text-orange-600" />
          Cargo Service Details
          {hasMultipleVehicleTypes && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {allTransportTypes.length} Vehicle Types
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Vehicle Type(s) */}
          {hasMultipleVehicleTypes ? (
            <div className="p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700 block mb-2">Vehicle Types:</span>
              <div className="flex flex-wrap gap-2">
                {allTransportTypes.map((type, index) => (
                  <Badge key={index} variant="outline" className="text-orange-800 border-orange-300">
                    {getCargoTypeLabel(type)}
                  </Badge>
                ))}
              </div>
            </div>
          ) : cargoType ? (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-sm text-gray-700">Vehicle Type:</span>
              <span className="font-medium text-orange-800">{getCargoTypeLabel(cargoType)}</span>
            </div>
          ) : null}
          
          {/* Split Cargo Strategy */}
          {splitCargo && (
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm text-gray-700">Strategy:</span>
              <span className="font-medium text-yellow-800">Separate Vehicles</span>
            </div>
          )}
          
          {/* Invoice Information */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 mb-1">Invoice-Based Pricing</p>
                <p className="text-xs text-blue-700">
                  Pricing will be calculated based on actual cargo requirements and sent via invoice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// MULTI-LOCATION SETUP STEP
// ==========================================

export function MultiLocationStep({ 
  isCargo, 
  cargoType 
}: { 
  isCargo: boolean; 
  cargoType: string 
}) {
  return (
    <Card className="border-0">
      <CardContent className="p-4">
        <div className="text-center space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
            isCargo ? "bg-orange-100" : "bg-blue-100"
          }`}>
            {isCargo ? (
              <Truck className="h-6 w-6 text-orange-600" />
            ) : (
              <Package className="h-6 w-6 text-blue-600" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">
              {isCargo ? "Setup Cargo Delivery" : "Setup Multi-Delivery"}
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              {isCargo 
                ? "Configure pickup and delivery locations for your cargo transportation needs."
                : "Configure one pickup location and multiple delivery destinations for efficient multi-point delivery."
              }
            </p>
            
            {isCargo && cargoType && (
              <div className="bg-orange-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">
                    Selected Vehicle: {getCargoTypeLabel(cargoType)}
                  </span>
                </div>
              </div>
            )}
            
            <div className={`rounded-lg p-3 text-left ${
              isCargo ? "bg-orange-50" : "bg-blue-50"
            }`}>
              <h4 className={`text-sm font-medium mb-2 ${
                isCargo ? "text-orange-900" : "text-blue-900"
              }`}>
                Perfect for:
              </h4>
              <ul className={`text-xs space-y-1 ${
                isCargo ? "text-orange-700" : "text-blue-700"
              }`}>
                {isCargo ? (
                  <>
                    <li>• Heavy items and furniture moving</li>
                    <li>• Business equipment transportation</li>
                    <li>• Large cargo requiring special vehicles</li>
                    <li>• Commercial delivery needs</li>
                  </>
                ) : (
                  <>
                    <li>• Multiple packages to different addresses</li>
                    <li>• Restaurant orders to various locations</li>
                    <li>• Business deliveries across the city</li>
                    <li>• Any multi-destination delivery needs</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// MULTI-DELIVERY REVIEW STEP
// ==========================================

export function MultiReviewStep({
  totalCalculations,
  deliveryItems,
  isBooking,
  onBooking,
  onBack,
  paymentCompleted = false,
  isCargo = false,
  cargoType = '',
  splitCargo = false,
  userPhone = '',
  cargoLoading = false,
  hasMultipleVehicleTypes = false,
  allTransportTypes = [],
  cargoError = null,
}: {
  totalCalculations: any;
  deliveryItems: MultiDeliveryItem[];
  isBooking: boolean;
  onBooking: () => void;
  onBack: () => void;
  paymentCompleted?: boolean;
  isCargo?: boolean;
  cargoType?: string;
  splitCargo?: boolean;
  userPhone?: string;
  cargoLoading?: boolean;
  hasMultipleVehicleTypes?: boolean;
  allTransportTypes?: string[];
  cargoError?: string | null;
}) {
  const [showItemDetails, setShowItemDetails] = useState(false);

  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="space-y-4">
      {/* Delivery Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            {isCargo ? (
              <Truck className="h-4 w-4 mr-2 text-orange-600" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isCargo ? "Cargo Delivery Summary" : "Multi-Delivery Summary"}
            {cargoLoading && (
              <Loader2 className="h-4 w-4 ml-2 animate-spin text-orange-600" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Metrics Grid - Different for cargo vs regular */}
          {isCargo ? (
            // Cargo metrics - no pricing, show vehicle info
            <div className="grid grid-cols-2 gap-3 text-center bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg p-3">
              <div>
                <div className="text-lg font-semibold text-orange-900">
                  {completedItems.length}
                </div>
                <div className="text-xs text-orange-700">Cargo Stops</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-900">
                  {cargoLoading ? "..." : hasMultipleVehicleTypes ? `${allTransportTypes.length} Types` : getCargoTypeLabel(cargoType)}
                </div>
                <div className="text-xs text-orange-700">
                  {hasMultipleVehicleTypes ? "Vehicle Types" : "Vehicle Type"}
                </div>
              </div>
            </div>
          ) : (
            // Regular delivery metrics - with pricing
            <div className="grid grid-cols-3 gap-3 text-center bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
              <div>
                <div className="text-lg font-semibold text-blue-900">
                  {completedItems.length}
                </div>
                <div className="text-xs text-blue-700">Deliveries</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-900">
                  {totalCalculations?.totalDistance || 0}km
                </div>
                <div className="text-xs text-blue-700">Total Distance</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-green-600">
                  GH₵{totalCalculations?.totalPrice?.toFixed(2) || '0.00'}
                </div>
                <div className="text-xs text-blue-700">Total Price</div>
              </div>
            </div>
          )}

          {/* Duration estimate - for both cargo and regular */}
          {totalCalculations?.averageDuration && (
            <div className="flex items-center justify-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                Estimated completion: {totalCalculations.averageDuration}
              </span>
            </div>
          )}

          {/* Cargo-specific information */}
          {isCargo && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-800 mb-2">Invoice Process</h4>
                  <p className="text-sm text-orange-700 mb-2">
                    This is a cargo delivery. An invoice will be sent to you shortly.
                  </p>
                  
                  {/* Show actual vehicle types from database */}
                  {!cargoLoading && hasMultipleVehicleTypes && (
                    <div className="mb-2">
                      <p className="text-sm font-medium text-orange-800 mb-1">Vehicle Types:</p>
                      <div className="flex flex-wrap gap-1">
                        {allTransportTypes.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-orange-700 border-orange-300">
                            {getCargoTypeLabel(type)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userPhone && (
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-800">
                        Your invoice will be sent to this number via WhatsApp or SMS:
                      </span>
                    </div>
                  )}
                  {userPhone && (
                    <div className="mt-1 font-mono text-orange-800 font-medium">
                      {userPhone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Items Toggle */}
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="w-full flex items-center justify-between p-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
          >
            <span className="font-medium">
              View {isCargo ? "Cargo" : "Delivery"} Details ({completedItems.length})
            </span>
            <div className="flex items-center space-x-2">
              {!isCargo && totalCalculations && (
                <Badge variant="secondary" className="text-xs">
                  GH₵{totalCalculations.totalPrice.toFixed(2)}
                </Badge>
              )}
              {isCargo && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                  Invoice Pending
                </Badge>
              )}
              <motion.div
                animate={{ rotate: showItemDetails ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isCargo ? (
                  <Truck className="h-4 w-4" />
                ) : (
                  <Package className="h-4 w-4" />
                )}
              </motion.div>
            </div>
          </button>

          {/* Expandable Item Details */}
          <AnimatePresence>
            {showItemDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                {completedItems.map((item, index) => {
                  const calculation = totalCalculations?.itemCalculations?.find((calc: any) => calc.id === item.id);
                  
                  return (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                      <div className="flex items-start space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 mt-1 ${
                          isCargo 
                            ? "bg-orange-100 text-orange-600" 
                            : "bg-red-100 text-red-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">
                            {item.itemDescription}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {item.deliveryAddress}
                          </p>
                          {!isCargo && calculation && (
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3 text-gray-500">
                                <span>{calculation.distance}km</span>
                                <span>{calculation.duration}</span>
                              </div>
                              <span className="font-medium text-green-600">
                                GH₵{calculation.price.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {isCargo && (
                            <div className="text-xs text-orange-600 font-medium">
                              Pricing via invoice
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Status for non-cargo */}
          {!isCargo && paymentCompleted && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900">
                  Payment Completed
                </span>
              </div>
              <p className="text-xs text-green-800 mt-1">
                Ready to confirm your multi-delivery booking
              </p>
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
          disabled={isBooking}
        >
          Back
        </Button>
        <Button 
          onClick={onBooking} 
          disabled={isBooking || completedItems.length === 0 || (isCargo && cargoLoading)} 
          className={`flex-1 ${
            isCargo 
              ? "bg-orange-500 hover:bg-orange-600" 
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isCargo ? "Submitting..." : paymentCompleted ? "Confirming..." : "Processing..."}
            </>
          ) : (
            <>
              {isCargo ? (
                <FileText className="w-4 h-4 mr-2" />
              ) : (
                <Truck className="w-4 h-4 mr-2" />
              )}
              {isCargo 
                ? cargoLoading ? "Loading..." : "Confirm Booking" 
                : paymentCompleted 
                ? "Confirm Multi-Delivery" 
                : "Choose Payment Method"
              }
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// MULTI-DELIVERY COMPLETE STEP
// ==========================================

export function MultiCompleteStep({
  bookingReference,
  totalCalculations,
  deliveryItems,
  riderProfile,
  onReset,
  bookId,
  isTrackingActive,
  onStartTracking,
  onStopTracking,
  isLoadingRoute,
  isCargo = false,
  cargoType = '',
}: {
  bookingReference: string | null;
  totalCalculations: any;
  deliveryItems: MultiDeliveryItem[];
  riderProfile: any;
  onReset: () => void;
  bookId?: string;
  isTrackingActive?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
  isLoadingRoute?: boolean;
  isCargo?: boolean;
  cargoType?: string;
}) {
  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription &&
    item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0
  );

  return (
    <div className="space-y-4">
      {/* Success Message */}
      <Card className={`border-0 ${
        isCargo 
          ? "bg-gradient-to-r from-orange-50 to-amber-50" 
          : "bg-gradient-to-r from-green-50 to-emerald-50"
      }`}>
        <CardContent className="p-4 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isCargo ? "bg-orange-100" : "bg-green-100"
          }`}>
            {isCargo ? (
              <FileText className="h-6 w-6 text-orange-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h3 className={`font-semibold mb-1 ${
            isCargo ? "text-orange-900" : "text-green-900"
          }`}>
            {isCargo ? "Cargo Booking Confirmed!" : "Multi-Delivery Confirmed!"}
          </h3>
          <p className={`text-sm ${
            isCargo ? "text-orange-700" : "text-green-700"
          }`}>
            {isCargo 
              ? `Your ${completedItems.length} cargo delivery request has been submitted to ${riderProfile?.name}. Invoice will be sent shortly.`
              : `Your ${completedItems.length} delivery requests have been sent to ${riderProfile?.name}.`
            }
          </p>
        </CardContent>
      </Card>

      {/* Booking Reference */}
      {bookingReference && (
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
              <p className="font-mono text-lg font-semibold text-gray-900">
                {bookingReference.slice(0, 8)}...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Status */}
      {isTrackingActive && (
        <Card className="border-0 bg-blue-50">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Route className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-1">
                {isCargo ? "Cargo Route Active" : "Multi-Route Active"}
              </h4>
              <p className="text-sm text-blue-700">
                {isCargo 
                  ? "All cargo delivery routes are being tracked on the map."
                  : "All delivery routes are being tracked on the map."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delivery Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            {isCargo ? (
              <Truck className="h-4 w-4 mr-2 text-orange-600" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isCargo ? "Cargo Delivery Summary" : "Multi-Delivery Summary"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={`text-center p-3 rounded-lg ${
              isCargo ? "bg-orange-50" : "bg-blue-50"
            }`}>
              <div className={`text-lg font-bold ${
                isCargo ? "text-orange-900" : "text-blue-900"
              }`}>
                {completedItems.length}
              </div>
              <div className={`text-xs ${
                isCargo ? "text-orange-700" : "text-blue-700"
              }`}>
                {isCargo ? "Cargo Stops" : "Deliveries"}
              </div>
            </div>
            <div className={`text-center p-3 rounded-lg ${
              isCargo ? "bg-yellow-50" : "bg-green-50"
            }`}>
              <div className={`text-lg font-bold ${
                isCargo ? "text-yellow-900" : "text-green-900"
              }`}>
                {isCargo 
                  ? getCargoTypeLabel(cargoType)
                  : `${totalCalculations?.totalDistance || 0}km`
                }
              </div>
              <div className={`text-xs ${
                isCargo ? "text-yellow-700" : "text-green-700"
              }`}>
                {isCargo ? "Vehicle Type" : "Total Distance"}
              </div>
            </div>
          </div>
          
          {totalCalculations?.averageDuration && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Time</span>
              <span className="font-medium">{totalCalculations.averageDuration}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between">
            <span className="font-medium text-gray-900">
              {isCargo ? "Invoice Amount" : "Total Price"}
            </span>
            <span className={`font-semibold text-lg ${
              isCargo ? "text-orange-600" : "text-green-600"
            }`}>
              {isCargo 
                ? "Pending Invoice" 
                : `GH₵${totalCalculations?.totalPrice?.toFixed(2) || '0.00'}`
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Delivery Items List */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
            {isCargo ? (
              <Truck className="h-4 w-4 mr-2 text-orange-600" />
            ) : (
              <Package className="h-4 w-4 mr-2 text-blue-600" />
            )}
            {isCargo ? "Cargo" : "Delivery"} Destinations ({completedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {completedItems.map((item, index) => {
              const calculation = totalCalculations?.itemCalculations?.find((calc: any) => calc.id === item.id);
              
              return (
                <div key={item.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                    isCargo 
                      ? "bg-orange-100 text-orange-600" 
                      : "bg-red-100 text-red-600"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.itemDescription}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.deliveryAddress.split(',')[0]}
                    </p>
                  </div>
                  {!isCargo && calculation ? (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        GH₵{calculation.price.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {calculation.distance}km
                      </p>
                    </div>
                  ) : isCargo ? (
                    <div className="text-right">
                      <p className="text-xs font-medium text-orange-600">
                        Invoice
                      </p>
                      <p className="text-xs text-gray-500">
                        Pending
                      </p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      {riderProfile && (
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={riderProfile.dpfile || "/placeholder.svg"}
                    alt={riderProfile.name}
                  />
                  <AvatarFallback className={`text-white text-xs ${
                    isCargo ? "bg-orange-600" : "bg-blue-600"
                  }`}>
                    {riderProfile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {riderProfile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isCargo ? "Cargo delivery specialist" : "Multi-delivery specialist"}
                  </p>
                </div>
              </div>
              {riderProfile.phone && (
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* <Button onClick={onReset} className={`w-full ${
          isCargo 
            ? "bg-orange-500 hover:bg-orange-600" 
            : "bg-blue-500 hover:bg-blue-600"
        }`}>
          <Plus className="w-4 h-4 mr-2" />
          {isCargo ? "Book Another Cargo Delivery" : "Book Another Multi-Delivery"}
        </Button> */}
        
        {/* Tracking Button */}
        {bookId && onStartTracking && onStopTracking && (
          <Button 
            variant={isTrackingActive ? "destructive" : "outline"} 
            className="w-full"
            onClick={isTrackingActive ? onStopTracking : onStartTracking}
            disabled={isLoadingRoute}
          >
            {isLoadingRoute ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Routes...
              </>
            ) : isTrackingActive ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                {isCargo ? "Stop Cargo Tracking" : "Stop Multi-Route Tracking"}
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                {isCargo ? "Track Cargo Deliveries" : "Track All Deliveries"}
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// STEP NAVIGATION COMPONENT
// ==========================================

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
    <div className="flex items-center justify-center rounded-md space-x-2">
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
  );
}