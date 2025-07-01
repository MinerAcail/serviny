"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { X, MapPin, Search, Navigation } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { google } from "google-maps"

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
      console.log(`🎯 Selecting delivery address:`, prediction.description)

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

        toast.success("Delivery address selected!", {
          description: location.address,
        })
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

    toast.success("Delivery details saved!", {
      description: `Item ${itemIndex + 1} configured successfully`,
    })
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
              {itemIndex + 1}
            </div>
            Set Delivery Address - Item {itemIndex + 1}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Item Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Item Description *</label>
            <Input
              type="text"
              placeholder="What are you delivering? (e.g., Documents, Food order, Package)"
              value={editingItem.itemDescription}
              onChange={(e) => updateItemField("itemDescription", e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-gray-500">Describe what you're delivering to help the rider identify the item</p>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Delivery Address *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <MapPin className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Enter delivery address..."
                className="w-full pl-10 pr-10"
                value={addressSearch}
                onChange={(e) => handleAddressSearch(e.target.value)}
                disabled={!isLoaded}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                  <Search className="h-4 w-4 animate-pulse text-gray-400" />
                </div>
              )}
              {selectedLocation && (
                <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={clearAddress}>
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Address Predictions */}
            {showPredictions && dropoffPredictions.length > 0 && (
              <div className="border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto bg-white">
                {dropoffPredictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleAddressSelect(prediction)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Address Selected</p>
                    <p className="text-sm text-green-700">{selectedLocation.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Special Instructions (Optional)</label>
            <Textarea
              placeholder="Any special delivery instructions? (e.g., Ring doorbell, Leave at door, Call on arrival)"
              value={editingItem.notes || ""}
              onChange={(e) => updateItemField("notes", e.target.value)}
              className="w-full resize-none"
              rows={3}
            />
            <p className="text-xs text-gray-500">Help the rider deliver successfully with specific instructions</p>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Delivery Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Item:</span>
                <span className="font-medium">{editingItem.itemDescription || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium text-right max-w-xs truncate">
                  {editingItem.deliveryAddress || "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Instructions:</span>
                <span className="font-medium">{editingItem.notes || "None"}</span>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isValid ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm text-gray-600">{isValid ? "Ready to save" : "Complete required fields"}</span>
            </div>
            {isValid && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Valid
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="px-6 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className={`min-w-[120px] px-6 ${
              isValid ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isValid ? (
              <span className="flex items-center">
                Save Details
                <Navigation className="w-4 h-4 ml-2" />
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
