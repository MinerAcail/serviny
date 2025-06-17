// ==========================================
// NEW: MultiLocationInputDialog Component
// ==========================================

"use client";

import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Plus, X, MapPin, Package, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// REUSE: Import existing location autocomplete hook
import { useLocationAutocomplete, type Location } from "../riderBookingHooks";

// Import the multi-delivery item type
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest";

interface MultiLocationInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (pickup: Location, deliveryItems: MultiDeliveryItem[]) => void;
  initialPickup?: Location | null;
  initialDeliveryItems?: MultiDeliveryItem[];
  autocompleteServiceRef: React.RefObject<google.maps.places.AutocompleteService | null>;
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>;
  isLoaded: boolean;
}

// Generate a simple UUID for new delivery items
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export function MultiLocationInputDialog({
  isOpen,
  onClose,
  onComplete,
  initialPickup = null,
  initialDeliveryItems = [],
  autocompleteServiceRef,
  placesServiceRef,
  isLoaded,
}: MultiLocationInputDialogProps) {
  // ==========================================
  // State Management
  // ==========================================
  
  // Pickup location state
  const [pickupLocation, setPickupLocation] = useState<Location | null>(initialPickup);
  const [pickupSearch, setPickupSearch] = useState(initialPickup?.address || "");
  const [showPickupPredictions, setShowPickupPredictions] = useState(false);

  // Delivery items state
  const [deliveryItems, setDeliveryItems] = useState<MultiDeliveryItem[]>(
    initialDeliveryItems.length > 0 
      ? initialDeliveryItems 
      : [
          {
            id: generateUUID(),
            itemDescription: "",
            deliveryAddress: "",
            dropoffLocation: [0, 0],
            notes: "",
          },
        ]
  );

  // Search state for delivery items
  const [deliverySearches, setDeliverySearches] = useState<Record<string, string>>({});
  const [showDeliveryPredictions, setShowDeliveryPredictions] = useState<Record<string, boolean>>({});
  const [activeSearchField, setActiveSearchField] = useState<string | null>(null);

  // UI state
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // ==========================================
  // REUSE: Location Autocomplete Hook
  // ==========================================
  const {
    pickupPredictions,
    dropoffPredictions,
    isSearching,
    searchPickupLocations,
    searchDropoffLocations,
    getLocationFromPlaceId,
    clearPickupPredictions,
    clearDropoffPredictions,
  } = useLocationAutocomplete(autocompleteServiceRef.current, placesServiceRef.current);

  // ==========================================
  // Initialize delivery searches from existing items
  // ==========================================
  useEffect(() => {
    if (initialDeliveryItems.length > 0) {
      const searches: Record<string, string> = {};
      const expanded: Record<string, boolean> = {};
      
      initialDeliveryItems.forEach((item) => {
        searches[item.id] = item.deliveryAddress;
        expanded[item.id] = true; // Expand existing items by default
      });
      
      setDeliverySearches(searches);
      setExpandedItems(expanded);
    }
  }, [initialDeliveryItems]);

  // ==========================================
  // Pickup Location Handlers (REUSE existing logic)
  // ==========================================
  const handlePickupSearch = useCallback((value: string) => {
    setPickupSearch(value);
    setActiveSearchField("pickup");
    
    if (value.length >= 3) {
      searchPickupLocations(value);
      setShowPickupPredictions(true);
    } else {
      clearPickupPredictions();
      setShowPickupPredictions(false);
    }
  }, [searchPickupLocations, clearPickupPredictions]);

  const handlePickupSelect = useCallback(async (prediction: any) => {
    console.log("📍 Selecting pickup location:", prediction.description);
    
    const location = await getLocationFromPlaceId(prediction.place_id);
    if (location) {
      setPickupLocation(location);
      setPickupSearch(location.address);
      clearPickupPredictions();
      setShowPickupPredictions(false);
      
      toast.success("Pickup location set as zone center!", {
        description: location.address,
      });
    } else {
      toast.error("Failed to get pickup location details");
    }

    setActiveSearchField(null);
  }, [getLocationFromPlaceId, clearPickupPredictions]);

  const clearPickup = () => {
    setPickupLocation(null);
    setPickupSearch("");
    clearPickupPredictions();
    setShowPickupPredictions(false);
  };

  // ==========================================
  // NEW: Delivery Items Management
  // ==========================================

  const addDeliveryItem = () => {
    const newItem: MultiDeliveryItem = {
      id: generateUUID(),
      itemDescription: "",
      deliveryAddress: "",
      dropoffLocation: [0, 0],
      notes: "",
    };

    setDeliveryItems(prev => [...prev, newItem]);
    setExpandedItems(prev => ({ ...prev, [newItem.id]: true }));
    
    toast.success("New delivery destination added", {
      description: "Fill in the details below",
    });
  };

  const removeDeliveryItem = (itemId: string) => {
    if (deliveryItems.length <= 1) {
      toast.error("You need at least one delivery destination");
      return;
    }

    setDeliveryItems(prev => prev.filter(item => item.id !== itemId));
    setDeliverySearches(prev => {
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });
    setShowDeliveryPredictions(prev => {
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });
    setExpandedItems(prev => {
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });

    toast.success("Delivery destination removed");
  };

  const toggleItemExpanded = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const updateDeliveryItem = (itemId: string, field: keyof MultiDeliveryItem, value: any) => {
    setDeliveryItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  // ==========================================
  // NEW: Delivery Address Search Handlers
  // ==========================================
  const handleDeliveryAddressSearch = useCallback((itemId: string, value: string) => {
    setDeliverySearches(prev => ({ ...prev, [itemId]: value }));
    setActiveSearchField(itemId);
    
    if (value.length >= 3) {
      searchDropoffLocations(value);
      setShowDeliveryPredictions(prev => ({ ...prev, [itemId]: true }));
      
      // Hide other predictions
      Object.keys(showDeliveryPredictions).forEach(id => {
        if (id !== itemId) {
          setShowDeliveryPredictions(prev => ({ ...prev, [id]: false }));
        }
      });
    } else {
      clearDropoffPredictions();
      setShowDeliveryPredictions(prev => ({ ...prev, [itemId]: false }));
    }
  }, [searchDropoffLocations, clearDropoffPredictions, showDeliveryPredictions]);

  const handleDeliveryAddressSelect = useCallback(async (itemId: string, prediction: any) => {
    console.log(`🎯 Selecting delivery address for item ${itemId}:`, prediction.description);
    
    const location = await getLocationFromPlaceId(prediction.place_id);
    if (location) {
      // Update delivery item with location
      updateDeliveryItem(itemId, "deliveryAddress", location.address);
      updateDeliveryItem(itemId, "dropoffLocation", [location.lat, location.lng]);
      
      // Update search state
      setDeliverySearches(prev => ({ ...prev, [itemId]: location.address }));
      clearDropoffPredictions();
      setShowDeliveryPredictions(prev => ({ ...prev, [itemId]: false }));
      
      toast.success("Delivery address set!", {
        description: location.address,
      });
    } else {
      toast.error("Failed to get delivery address details");
    }

    setActiveSearchField(null);
  }, [getLocationFromPlaceId, clearDropoffPredictions]);

  const clearDeliveryAddress = (itemId: string) => {
    updateDeliveryItem(itemId, "deliveryAddress", "");
    updateDeliveryItem(itemId, "dropoffLocation", [0, 0]);
    setDeliverySearches(prev => ({ ...prev, [itemId]: "" }));
    setShowDeliveryPredictions(prev => ({ ...prev, [itemId]: false }));
  };

  // ==========================================
  // Validation and Completion
  // ==========================================
  const validateAndComplete = () => {
    // Validate pickup
    if (!pickupLocation) {
      toast.error("Please set a pickup location");
      return;
    }

    // Validate delivery items
    const validItems = deliveryItems.filter(item => 
      item.itemDescription.trim() && 
      item.deliveryAddress.trim() &&
      item.dropoffLocation[0] !== 0 && 
      item.dropoffLocation[1] !== 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least one complete delivery destination");
      return;
    }

    if (validItems.length !== deliveryItems.length) {
      const incompleteCount = deliveryItems.length - validItems.length;
      toast.error(`${incompleteCount} delivery destination(s) are incomplete`);
      return;
    }

    // Complete the setup
    onComplete(pickupLocation, validItems);
    onClose();
    
    toast.success("Multi-delivery setup complete!", {
      description: `1 pickup + ${validItems.length} deliveries configured`,
    });
  };

  // Check if can proceed
  const canProceed = pickupLocation && deliveryItems.some(item => 
    item.itemDescription.trim() && 
    item.deliveryAddress.trim() &&
    item.dropoffLocation[0] !== 0 && 
    item.dropoffLocation[1] !== 0
  );

  // ==========================================
  // Render Component
  // ==========================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
           
            <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center px-3 py-1.5 rounded-lg hover:bg-blue-100"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
          </div>

          <div className="p-6 space-y-6">
            {/* How It Works Section */}
            {showHowItWorks && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  How Multi-Delivery Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="font-medium text-green-900 mb-2">1. One Pickup Point</h4>
                    <p className="text-sm text-green-700">Set a single pickup location that becomes the center for all deliveries</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-blue-900 mb-2">2. Multiple Items</h4>
                    <p className="text-sm text-blue-700">Add multiple items, each with its own delivery address and details</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold">$</span>
                    </div>
                    <h4 className="font-medium text-purple-900 mb-2">3. Smart Pricing</h4>
                    <p className="text-sm text-purple-700">Each delivery is priced separately based on distance from pickup</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Perfect for:</strong> Multiple packages to different addresses, restaurant orders to various locations, 
                    or any scenario where you need one pickup point but multiple delivery destinations.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pickup Location Section */}
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-3" />
                    Pickup Location (Zone Center)
                    {pickupLocation && (
                      <svg className="h-4 w-4 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </h3>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter pickup address..."
                      className="w-full pl-10 pr-10"
                      value={pickupSearch}
                      onChange={(e) => handlePickupSearch(e.target.value)}
                      disabled={!isLoaded}
                    />
                    {isSearching && activeSearchField === "pickup" && (
                      <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                        <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    {pickupLocation && (
                      <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={clearPickup}>
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>

                  {/* Pickup Predictions */}
                  {showPickupPredictions && pickupPredictions.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {pickupPredictions.map((prediction) => (
                        <button
                          key={prediction.place_id}
                          onClick={() => handlePickupSelect(prediction)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
                              <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                              <div className="text-xs text-green-600 mt-1">Will become zone center</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {pickupLocation && (
                    <div className="text-xs text-green-600 bg-green-100 p-3 rounded-lg mt-3">
                      ✅ Zone center set: {pickupLocation.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Items Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    Destinations ({deliveryItems.length})
                  </h3>
                  
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deliveryItems.map((item, index) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl">
                      {/* Item Header */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleItemExpanded(item.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-medium text-red-600">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.itemDescription || `Delivery ${index + 1}`}
                            </h4>
                            <p className="text-sm text-gray-500 truncate max-w-48">
                              {item.deliveryAddress || "No address set"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.deliveryAddress && item.itemDescription && (
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); removeDeliveryItem(item.id); }}>
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </button>
                          {expandedItems[item.id] ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {expandedItems[item.id] && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                         

                          {/* Delivery Address */}
                          <div className="space-y-2 relative">
                            <label className="text-sm font-medium text-gray-700">Delivery Address</label>
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Enter delivery address..."
                                value={deliverySearches[item.id] || ""}
                                onChange={(e) => handleDeliveryAddressSearch(item.id, e.target.value)}
                                disabled={!isLoaded || !pickupLocation}
                              />
                              {isSearching && activeSearchField === item.id && (
                                <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                                  <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </div>
                              )}
                              {item.deliveryAddress && (
                                <button 
                                  className="absolute inset-y-0 right-0 flex items-center pr-3" 
                                  onClick={() => clearDeliveryAddress(item.id)}
                                >
                                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                </button>
                              )}
                            </div>

                            {/* Delivery Predictions */}
                            {showDeliveryPredictions[item.id] && dropoffPredictions.length > 0 && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {dropoffPredictions.map((prediction) => (
                                  <button
                                    key={prediction.place_id}
                                    onClick={() => handleDeliveryAddressSelect(item.id, prediction)}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span className="text-red-500">🎯</span>
                                      <div>
                                        <div className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
                                        <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {deliveryItems.length >= 10 && (
                  <div className="text-sm text-gray-500 text-center p-3 bg-gray-50 rounded-lg">
                    Maximum of 10 delivery destinations reached
                  </div>
                )}
              </div>
            </div>

            {/* Progress Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-6">
                  <div className={`flex items-center ${pickupLocation ? "text-green-600" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${pickupLocation ? "bg-green-500" : "bg-gray-300"}`} />
                    Pickup
                  </div>
                  <div className={`flex items-center ${deliveryItems.some(item => item.deliveryAddress && item.itemDescription) ? "text-green-600" : "text-gray-400"}`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${deliveryItems.some(item => item.deliveryAddress && item.itemDescription) ? "bg-green-500" : "bg-gray-300"}`} />
                     Items ({deliveryItems.filter(item => item.deliveryAddress && item.itemDescription).length}/{deliveryItems.length})
                  </div>
                </div>
                <div className="text-gray-500">
                  {canProceed ? "Ready to proceed" : "Complete setup"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                onClick={validateAndComplete}
                disabled={!canProceed}
                className={`min-w-[140px] px-6 ${
                  canProceed
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canProceed ? (
                  <span className="flex items-center">
                    Continue Setup
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}