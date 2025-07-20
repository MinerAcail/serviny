"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { X, MapPin, Package, Trash2,  } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Import the new delivery address dialog
import { DeliveryAddressDialog } from "./deliveryAddressDialog"

// REUSE: Import existing location autocomplete hook
import { useLocationAutocomplete, type Location } from "../riderBookingHooks"

// Import the multi-delivery item type
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest"

interface MultiLocationInputDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (pickup: Location, deliveryItems: MultiDeliveryItem[]) => void
  initialPickup?: Location | null
  initialDeliveryItems?: MultiDeliveryItem[]
  autocompleteServiceRef: React.RefObject<google.maps.places.AutocompleteService | null>
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>
  isLoaded: boolean
}

// Generate a simple UUID for new delivery items
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

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
  const [pickupLocation, setPickupLocation] = useState<Location | null>(initialPickup)
  const [pickupSearch, setPickupSearch] = useState(initialPickup?.address || "")
  const [showPickupPredictions, setShowPickupPredictions] = useState(false)

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
        ],
  )

  // UI state
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [accordionValue, setAccordionValue] = useState<string[]>([])

  // NEW: Delivery address dialog state
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MultiDeliveryItem | null>(null)
  const [editingItemIndex, setEditingItemIndex] = useState(-1)

  // ==========================================
  // REUSE: Location Autocomplete Hook
  // ==========================================

  const { pickupPredictions, isSearching, searchPickupLocations, getLocationFromPlaceId, clearPickupPredictions } =
    useLocationAutocomplete(autocompleteServiceRef.current, placesServiceRef.current)

  // ==========================================
  // Initialize accordion items from existing items
  // ==========================================
  useEffect(() => {
    if (initialDeliveryItems.length > 0) {
      const openItems = initialDeliveryItems.map(item => item.id)
      setAccordionValue(openItems)
    }
  }, [initialDeliveryItems])

  // ==========================================
  // Pickup Location Handlers (REUSE existing logic)
  // ==========================================
  const handlePickupSearch = useCallback(
    (value: string) => {
      setPickupSearch(value)

      if (value.length >= 3) {
        searchPickupLocations(value)
        setShowPickupPredictions(true)
      } else {
        clearPickupPredictions()
        setShowPickupPredictions(false)
      }
    },
    [searchPickupLocations, clearPickupPredictions],
  )

  const handlePickupSelect = useCallback(
    async (prediction: any) => {
      console.log("📍 Selecting pickup location:", prediction.description)

      const location = await getLocationFromPlaceId(prediction.place_id)
      if (location) {
        setPickupLocation(location)
        setPickupSearch(location.address)
        clearPickupPredictions()
        setShowPickupPredictions(false)

        // toast.success("Pickup location set as zone center!", {
        //   description: location.address,
        // })
      } else {
        toast.error("Failed to get pickup location details")
      }
    },
    [getLocationFromPlaceId, clearPickupPredictions],
  )

  const clearPickup = () => {
    setPickupLocation(null)
    setPickupSearch("")
    clearPickupPredictions()
    setShowPickupPredictions(false)
  }

  // ==========================================
  // Delivery Items Management
  // ==========================================

  const addDeliveryItem = () => {
    if (deliveryItems.length >= 10) {
      toast.error("Maximum of 10 delivery destinations allowed")
      return
    }

    const newItem: MultiDeliveryItem = {
      id: generateUUID(),
      itemDescription: "",
      deliveryAddress: "",
      dropoffLocation: [0, 0],
      notes: "",
    }

    setDeliveryItems((prev) => [...prev, newItem])
    setAccordionValue((prev) => [...prev, newItem.id])
    toast.success("New delivery destination added")
  }

  const removeDeliveryItem = (itemId: string) => {
    if (deliveryItems.length <= 1) {
      toast.error("You need at least one delivery destination")
      return
    }

    setDeliveryItems((prev) => prev.filter((item) => item.id !== itemId))
    setAccordionValue((prev) => prev.filter(id => id !== itemId))
    toast.success("Delivery destination removed")
  }

  // NEW: Open delivery address dialog
  const openDeliveryDialog = (item: MultiDeliveryItem, index: number) => {
    setEditingItem(item)
    setEditingItemIndex(index)
    setDeliveryDialogOpen(true)
  }

  // NEW: Handle delivery item save from dialog
  const handleDeliveryItemSave = (updatedItem: MultiDeliveryItem) => {
    setDeliveryItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setDeliveryDialogOpen(false)
    setEditingItem(null)
    setEditingItemIndex(-1)
  }

  // ==========================================
  // Validation and Completion
  // ==========================================
  const validateAndComplete = () => {
    // Validate pickup
    if (!pickupLocation) {
      toast.error("Please set a pickup location")
      return
    }

    // Validate delivery items
    const validItems = deliveryItems.filter(
      (item) =>
        item.itemDescription.trim() &&
        item.deliveryAddress.trim() &&
        item.dropoffLocation[0] !== 0 &&
        item.dropoffLocation[1] !== 0,
    )

    if (validItems.length === 0) {
      toast.error("Please add at least one complete delivery destination")
      return
    }

    if (validItems.length !== deliveryItems.length) {
      const incompleteCount = deliveryItems.length - validItems.length
      toast.error(`${incompleteCount} delivery destination(s) are incomplete`)
      return
    }

    // Complete the setup
    onComplete(pickupLocation, validItems)
    onClose()
  }

  // Check if can proceed
  const canProceed =
    pickupLocation &&
    deliveryItems.some(
      (item) =>
        item.itemDescription.trim() &&
        item.deliveryAddress.trim() &&
        item.dropoffLocation[0] !== 0 &&
        item.dropoffLocation[1] !== 0,
    )

  // ==========================================
  // Render Component
  // ==========================================

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        {/* Dialog */}
        <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Delivery Setup</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="hidden sm:flex text-blue-600 hover:text-blue-700 text-sm items-center px-3 py-1.5 rounded-lg hover:bg-blue-100"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  How it works
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* How It Works Section */}
              {showHowItWorks && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-4 flex items-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    How Multi-Delivery Works
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <h4 className="font-medium text-green-900 mb-1 sm:mb-2 text-sm sm:text-base">1. One Pickup Point</h4>
                      <p className="text-xs sm:text-sm text-green-700">
                        Set a single pickup location that becomes the center for all deliveries
                      </p>
                    </div>

                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-blue-900 mb-1 sm:mb-2 text-sm sm:text-base">2. Multiple Items</h4>
                      <p className="text-xs sm:text-sm text-blue-700">
                        Add multiple items, each with its own delivery address and details
                      </p>
                    </div>

                    <div className="text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm sm:col-span-2 lg:col-span-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                        <span className="text-purple-600 font-bold text-sm sm:text-base">$</span>
                      </div>
                      <h4 className="font-medium text-purple-900 mb-1 sm:mb-2 text-sm sm:text-base">3. Smart Pricing</h4>
                      <p className="text-xs sm:text-sm text-purple-700">
                        Each delivery is priced separately based on distance from pickup
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-lg border border-blue-200">
                    <p className="text-xs sm:text-sm text-blue-800">
                      <strong>Perfect for:</strong> Multiple packages to different addresses, restaurant orders to
                      various locations, or any scenario where you need one pickup point but multiple delivery
                      destinations.
                    </p>
                  </div>
                </div>
              )}

              {/* Mobile How It Works Button */}
              <div className="block sm:hidden">
                <button
                  onClick={() => setShowHowItWorks(!showHowItWorks)}
                  className="w-full text-blue-600 hover:text-blue-700 text-sm flex items-center justify-center px-3 py-2 rounded-lg hover:bg-blue-100 border border-blue-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  How it works
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Pickup Location Section */}
                <div className="space-y-4 order-1">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-3 sm:mb-4 flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 mr-2 sm:mr-3" />
                      Pickup Location
                      {pickupLocation && (
                        <svg
                          className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </h3>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Enter pickup address..."
                        className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 text-sm sm:text-base h-9 sm:h-10"
                        value={pickupSearch}
                        onChange={(e) => handlePickupSearch(e.target.value)}
                        disabled={!isLoaded}
                      />
                      {isSearching && (
                        <div className="absolute inset-y-0 right-8 sm:right-10 flex items-center pr-2">
                          <svg className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      )}
                      {pickupLocation && (
                        <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={clearPickup}>
                          <X className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>

                    {/* Pickup Predictions */}
                    {showPickupPredictions && pickupPredictions.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                        {pickupPredictions.map((prediction) => (
                          <button
                            key={prediction.place_id}
                            onClick={() => handlePickupSelect(prediction)}
                            className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                  {prediction.structured_formatting.main_text}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500 truncate">
                                  {prediction.structured_formatting.secondary_text}
                                </div>
                                <div className="text-xs text-green-600 mt-1">Will become zone center</div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {pickupLocation && (
                      <div className="text-xs sm:text-sm text-green-600 bg-green-100 p-2 sm:p-3 rounded-lg mt-3">
                        ✅ Zone center set: {pickupLocation.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Items Section */}
                <div className="space-y-4 order-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
                      Destinations ({deliveryItems.length})
                    </h3>
                    
                  </div>

                  <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                    <Accordion type="multiple" value={accordionValue} onValueChange={setAccordionValue}>
                      {deliveryItems.map((item, index) => (
                        <AccordionItem key={item.id} value={item.id} className="bg-white border border-gray-200 rounded-xl">
                          <AccordionTrigger className="px-3 sm:px-4 py-2 sm:py-3 hover:no-underline">
                            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                              <div className="w-5 h-5 sm:w-6 sm:h-6 bg-red-100 rounded-full flex items-center justify-center text-xs font-medium text-red-600 flex-shrink-0">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                  {item.itemDescription.length > 20
                                      ? item.itemDescription.slice(0, 20) + "…"
                                      : item.itemDescription || `Delivery ${index + 1}`}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">
                                  {item.deliveryAddress
                                    ? item.deliveryAddress.length > 20
                                      ? item.deliveryAddress.slice(0, 20) + "…"
                                      : item.deliveryAddress
                                    : "No address set"}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                                {item.deliveryAddress && item.itemDescription && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-1 sm:px-2 py-0.5">
                                    ✓
                                  </Badge>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    openDeliveryDialog(item, index)
                                  }}
                                  className="flex items-center gap-1 h-7 sm:h-8 px-2 text-xs"
                                >
                                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                  <span className="">{`${item.deliveryAddress ? "Edit" : "Location"}`}</span>
                                </Button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    removeDeliveryItem(item.id)
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 hover:text-red-500" />
                                </button>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0">
                            <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm border-t border-gray-100 pt-3">
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <span className="text-gray-600 font-medium">Item:</span>
                                  <span className="ml-2 text-gray-900">{item.itemDescription || "Not specified"}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600 font-medium">Address:</span>
                                  <span className="ml-2 text-gray-900 break-words">{item.deliveryAddress || "Not set"}</span>
                                </div>
                                {item.notes && (
                                  <div>
                                    <span className="text-gray-600 font-medium">Notes:</span>
                                    <span className="ml-2 text-gray-900 break-words">{item.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  {deliveryItems.length >= 10 && (
                    <div className="text-xs sm:text-sm text-gray-500 text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                      Maximum of 10 delivery destinations reached
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Summary */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center space-x-3 sm:space-x-6">
                    <div className={`flex items-center ${pickupLocation ? "text-green-600" : "text-gray-400"}`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${pickupLocation ? "bg-green-500" : "bg-gray-300"}`} />
                      Pickup
                    </div>
                    <div
                      className={`flex items-center ${
                        deliveryItems.some((item) => item.deliveryAddress && item.itemDescription)
                          ? "text-green-600"
                          : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          deliveryItems.some((item) => item.deliveryAddress && item.itemDescription)
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      />
                      Items ({deliveryItems.filter((item) => item.deliveryAddress && item.itemDescription).length}/
                      {deliveryItems.length})
                    </div>
                  </div>

                  <div className="text-gray-500 text-xs sm:text-sm">
                    {canProceed ? "Ready to proceed" : "Complete setup"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4">
                <Button variant="outline" onClick={onClose} className="px-4 sm:px-6 bg-transparent order-2 sm:order-1">
                  Cancel
                </Button>
                <Button
                  onClick={validateAndComplete}
                  disabled={!canProceed}
                  className={`min-w-[140px] px-4 sm:px-6 order-1 sm:order-2 ${
                    canProceed
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {canProceed ? (
                    <span className="flex items-center text-sm sm:text-base">
                      Continue Setup
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
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

      {/* NEW: Delivery Address Dialog */}
      <DeliveryAddressDialog
        isOpen={deliveryDialogOpen}
        onClose={() => {
          setDeliveryDialogOpen(false)
          setEditingItem(null)
          setEditingItemIndex(-1)
        }}
        onSave={handleDeliveryItemSave}
        item={editingItem}
        itemIndex={editingItemIndex}
        autocompleteServiceRef={autocompleteServiceRef}
        placesServiceRef={placesServiceRef}
        isLoaded={isLoaded}
      />
    </>
  )
}