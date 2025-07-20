"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { X, MapPin, Search, Navigation, Package, FileText, MessageSquare } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
// import type { google } from "google-maps"

// Import types and hooks
import { useLocationAutocomplete, type Location } from "../riderBookingHooks"
import type { MultiDeliveryItem } from "./riderBookingMultiDeliveryRequest"

interface DeliveryAddressDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (updatedItem: MultiDeliveryItem) => void
  item: MultiDeliveryItem | null
  itemIndex: number
  autocompleteServiceRef: React.RefObject<google.maps.places.AutocompleteService | null>
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>
  isLoaded: boolean
}

export function DeliveryAddressDialog({
  isOpen,
  onClose,
  onSave,
  item,
  itemIndex,
  autocompleteServiceRef,
  placesServiceRef,
  isLoaded,
}: DeliveryAddressDialogProps) {
  // Local state for editing
  const [editingItem, setEditingItem] = useState<MultiDeliveryItem | null>(null)
  const [addressSearch, setAddressSearch] = useState("")
  const [showPredictions, setShowPredictions] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  
  // Ref for the address input to focus
  const addressInputRef = useRef<HTMLInputElement>(null)

  // Location autocomplete hook
  const { dropoffPredictions, isSearching, searchDropoffLocations, getLocationFromPlaceId, clearDropoffPredictions } =
    useLocationAutocomplete(autocompleteServiceRef.current, placesServiceRef.current)

  // Initialize editing state when item changes
  useEffect(() => {
    if (item && isOpen) {
      setEditingItem({ ...item })
      setAddressSearch(item.deliveryAddress || "")

      // If item has a valid location, set it as selected
      if (item.deliveryAddress && item.dropoffLocation[0] !== 0 && item.dropoffLocation[1] !== 0) {
        setSelectedLocation({
          address: item.deliveryAddress,
          lat: item.dropoffLocation[0],
          lng: item.dropoffLocation[1],
        })
      } else {
        setSelectedLocation(null)
      }
    }
  }, [item, isOpen])

  // Focus on address input when dialog opens
  useEffect(() => {
    if (isOpen && addressInputRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        addressInputRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setEditingItem(null)
      setAddressSearch("")
      setShowPredictions(false)
      setSelectedLocation(null)
      clearDropoffPredictions()
    }
  }, [isOpen, clearDropoffPredictions])

  // Handle address search
  const handleAddressSearch = useCallback(
    (value: string) => {
      setAddressSearch(value)

      if (value.length >= 3) {
        searchDropoffLocations(value)
        setShowPredictions(true)
      } else {
        clearDropoffPredictions()
        setShowPredictions(false)
      }
    },
    [searchDropoffLocations, clearDropoffPredictions],
  )

  // Handle address selection
  const handleAddressSelect = useCallback(
    async (prediction: any) => {
      const location = await getLocationFromPlaceId(prediction.place_id)
      if (location) {
        setSelectedLocation(location)
        setAddressSearch(location.address)

        // Update editing item
        if (editingItem) {
          setEditingItem({
            ...editingItem,
            deliveryAddress: location.address,
            dropoffLocation: [location.lat, location.lng],
          })
        }

        clearDropoffPredictions()
        setShowPredictions(false)
      } else {
        toast.error("Failed to get address details")
      }
    },
    [getLocationFromPlaceId, clearDropoffPredictions, editingItem],
  )

  // Clear address
  const clearAddress = () => {
    setSelectedLocation(null)
    setAddressSearch("")
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        deliveryAddress: "",
        dropoffLocation: [0, 0],
      })
    }
    clearDropoffPredictions()
    setShowPredictions(false)
  }

  // Update item field
  const updateItemField = (field: keyof MultiDeliveryItem, value: any) => {
    if (editingItem) {
      setEditingItem({
        ...editingItem,
        [field]: value,
      })
    }
  }

  // Validate and save
  const handleSave = () => {
    if (!editingItem) return

    // Validation
    if (!editingItem.itemDescription.trim()) {
      toast.error("Please enter an item description")
      return
    }

    if (!editingItem.deliveryAddress.trim()) {
      toast.error("Please set a delivery address")
      return
    }

    if (editingItem.dropoffLocation[0] === 0 && editingItem.dropoffLocation[1] === 0) {
      toast.error("Please select a valid delivery address")
      return
    }

    // Save the item
    onSave(editingItem)
    onClose()
  }

  // Check if form is valid
  const isValid =
    editingItem &&
    editingItem.itemDescription.trim() &&
    editingItem.deliveryAddress.trim() &&
    editingItem.dropoffLocation[0] !== 0 &&
    editingItem.dropoffLocation[1] !== 0

  if (!editingItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {itemIndex + 1}
            </div>
            {/* <div>
              <h2 className="text-xl font-semibold text-gray-900">Configure Delivery Item</h2>
            </div> */}
              <Button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-8 py-3 text-base font-medium min-w-[160px] transition-all ${
              isValid 
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isValid ? (
              <span className="flex items-center gap-2">
                Save Details
                <Navigation className="w-5 h-5" />
              </span>
            ) : (
              "Complete Form"
            )}
          </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Delivery Address - First Priority */}
          <Card className="border-2 border-blue-100 bg-blue-50/30">
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <label className="text-base font-semibold text-gray-900">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    ref={addressInputRef}
                    type="text"
                    placeholder="Enter delivery address..."
                    className="w-full pl-12 pr-12 h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    value={addressSearch}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    disabled={!isLoaded}
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-12 flex items-center pr-2">
                      <Search className="h-5 w-5 animate-pulse text-blue-500" />
                    </div>
                  )}
                  {selectedLocation && (
                    <button 
                      className="absolute inset-y-0 right-0 flex items-center pr-4 hover:bg-gray-100 rounded-r-lg transition-colors" 
                      onClick={clearAddress}
                    >
                      <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>

                {/* Address Predictions */}
                {showPredictions && dropoffPredictions.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto bg-white relative z-10">
                    {dropoffPredictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        onClick={() => handleAddressSelect(prediction)}
                        className="w-full text-left px-4 py-4 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {prediction.structured_formatting.main_text}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {prediction.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Address Confirmation */}
                {selectedLocation && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900">✓ Address Selected</p>
                        <p className="text-sm text-green-700 mt-1">{selectedLocation.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Item Description */}
          <Card className="border border-gray-200">
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-600" />
                  <label className="text-base font-semibold text-gray-900">
                    Item Description <span className="text-red-500">*</span>
                  </label>
                </div>
                <Input
                  type="text"
                  placeholder="What are you delivering? (e.g., Documents, Food order, Package)"
                  value={editingItem.itemDescription}
                  onChange={(e) => updateItemField("itemDescription", e.target.value)}
                  className="w-full h-12 text-base border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Describe what you're delivering to help the rider identify the item
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card className="border border-gray-200">
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-600" />
                  <label className="text-base font-semibold text-gray-900">Special Instructions</label>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <Textarea
                  placeholder="Any special delivery instructions? (e.g., Ring doorbell, Leave at door, Call on arrival)"
                  value={editingItem.notes || ""}
                  onChange={(e) => updateItemField("notes", e.target.value)}
                  className="w-full resize-none min-h-[100px] border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  rows={4}
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Help the rider deliver successfully with specific instructions
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-2 border-gray-200 bg-gray-50/50">
            <CardContent className="py-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Delivery Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span className="text-sm text-gray-500 font-medium">Item</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {editingItem.itemDescription || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500 font-medium">Address</span>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {editingItem.deliveryAddress || "Not set"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm text-gray-500 font-medium">Instructions</span>
                  <p className="text-sm font-semibold text-gray-900">
                    {editingItem.notes || "None"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Validation Status */}
          <Card className={`border-2 ${isValid ? 'border-green-200 bg-green-50/50' : 'border-yellow-200 bg-yellow-50/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isValid ? "bg-green-500" : "bg-yellow-500"}`} />
                  <span className="text-sm font-medium text-gray-700">
                    {isValid ? "✓ Ready to save" : "⚠ Complete required fields"}
                  </span>
                </div>
                {isValid && (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Valid
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t-2 border-gray-100">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="px-8 py-3 text-base font-medium border-2 border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-8 py-3 text-base font-medium min-w-[160px] transition-all ${
              isValid 
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl" 
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isValid ? (
              <span className="flex items-center gap-2">
                Save Details
                <Navigation className="w-5 h-5" />
              </span>
            ) : (
              "Complete Form"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}