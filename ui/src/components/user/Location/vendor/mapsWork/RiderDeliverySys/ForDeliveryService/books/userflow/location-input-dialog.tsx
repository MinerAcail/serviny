"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, X, Target, MapPin, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react'
import { toast } from "sonner"
import { useLocationSearch, type Location } from "../../riderBookingHooks"
// import { google } from "google-maps"

interface LocationInputDialogProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (pickup: Location, dropoff: Location) => void
  autocompleteServiceRef: React.RefObject<google.maps.places.AutocompleteService | null>
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>
  isLoaded: boolean
}

export function LocationInputDialog({
  isOpen,
  onClose,
  onComplete,
  autocompleteServiceRef,
  placesServiceRef,
  isLoaded,
}: LocationInputDialogProps) {
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null)
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null)
  const [pickupSearch, setPickupSearch] = useState("")
  const [dropoffSearch, setDropoffSearch] = useState("")
  const [showPickupPredictions, setShowPickupPredictions] = useState(false)
  const [showDropoffPredictions, setShowDropoffPredictions] = useState(false)
  const [activeSearchField, setActiveSearchField] = useState<"pickup" | "dropoff" | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  // Use location search hook
  const {
    predictions,
    isLoading: isSearchLoading,
    error: searchError,
    searchLocations,
    getLocationDetails,
    clearPredictions,
  } = useLocationSearch(autocompleteServiceRef.current, placesServiceRef.current)

  // Search handlers
  const handlePickupSearch = useCallback(
    async (value: string) => {
      setPickupSearch(value)
      setActiveSearchField("pickup")

      if (value.length > 2) {
        const results = await searchLocations(value)
        if (results.length > 0) {
          setShowPickupPredictions(true)
          setShowDropoffPredictions(false)
        }
      } else {
        setShowPickupPredictions(false)
        clearPredictions()
      }
    },
    [searchLocations, clearPredictions],
  )

  const handleDropoffSearch = useCallback(
    async (value: string) => {
      setDropoffSearch(value)
      setActiveSearchField("dropoff")

      if (value.length > 2) {
        const results = await searchLocations(value)
        if (results.length > 0) {
          setShowDropoffPredictions(true)
          setShowPickupPredictions(false)
        }
      } else {
        setShowDropoffPredictions(false)
        clearPredictions()
      }
    },
    [searchLocations, clearPredictions],
  )

  const handlePredictionSelect = useCallback(
    async (place: any) => {
      const details = await getLocationDetails(place.place_id)

      if (details) {
        const location: Location = {
          lng: details.coordinates[0],
          lat: details.coordinates[1],
          address: details.address,
        }

        if (activeSearchField === "pickup") {
          setPickupLocation(location)
          setPickupSearch(details.address)
          setShowPickupPredictions(false)
          toast.success("Pickup location set as zone center")
        } else if (activeSearchField === "dropoff") {
          setDropoffLocation(location)
          setDropoffSearch(details.address)
          setShowDropoffPredictions(false)
          toast.success("Drop-off location set")
        }
      }

      setActiveSearchField(null)
      clearPredictions()
    },
    [activeSearchField, getLocationDetails, clearPredictions],
  )

  const handleComplete = () => {
    if (pickupLocation && dropoffLocation) {
      onComplete(pickupLocation, dropoffLocation)
      onClose()
    }
  }

  const clearPickup = () => {
    setPickupLocation(null)
    setPickupSearch("")
  }

  const clearDropoff = () => {
    setDropoffLocation(null)
    setDropoffSearch("")
  }

  const canProceed = pickupLocation && dropoffLocation

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Set Delivery Locations</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="text-blue-600 hover:text-blue-700"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              How it works
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* How It Works Section */}
          {showHowItWorks && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-900 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  How the Zone System Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Target className="h-4 w-4 text-green-600" />
                    </div>
                    <h4 className="font-medium text-green-900 mb-1">1. Zone Center</h4>
                    <p className="text-sm text-green-700">Your pickup becomes the center of all pricing zones</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-blue-900 mb-1">2. Distance Zones</h4>
                    <p className="text-sm text-blue-700">Colored circles show different pricing tiers</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <ArrowRight className="h-4 w-4 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-purple-900 mb-1">3. Calculate Price</h4>
                    <p className="text-sm text-purple-700">Price based on distance from pickup to dropoff</p>
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Example:</strong> If your pickup is at "Mall A" and dropoff is 3km away, you'll pay the
                    2-5km zone price. The pickup location stays as the center for all calculations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Location Input Section */}
          <div className="space-y-4">
            {/* Pickup Location */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                Pickup Location (Zone Center)
                {pickupLocation && (
                  <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter pickup address to set zone center..."
                  className="pl-10 pr-10"
                  value={pickupSearch}
                  onChange={(e) => handlePickupSearch(e.target.value)}
                  disabled={!isLoaded}
                />
                {isSearchLoading && activeSearchField === "pickup" && (
                  <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {pickupLocation && (
                  <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={clearPickup}>
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Pickup Predictions */}
              {showPickupPredictions && predictions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {predictions.map((place) => (
                    <button
                      key={place.place_id}
                      onClick={() => handlePredictionSelect(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{place.structured_formatting.main_text}</div>
                          <div className="text-sm text-gray-500">{place.structured_formatting.secondary_text}</div>
                          <div className="text-xs text-green-600 mt-1">Will become zone center</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {pickupLocation && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✅ Zone center set: {pickupLocation.address}
                </div>
              )}
            </div>

            {/* Dropoff Location */}
            <div className="space-y-2 relative">
              <label className="text-sm font-medium text-gray-700 flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                Drop-off Location (Destination)
                {dropoffLocation && (
                  <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Enter delivery destination..."
                  className="pl-10 pr-10"
                  value={dropoffSearch}
                  onChange={(e) => handleDropoffSearch(e.target.value)}
                  disabled={!isLoaded || !pickupLocation}
                />
                {isSearchLoading && activeSearchField === "dropoff" && (
                  <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
                {dropoffLocation && (
                  <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={clearDropoff}>
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>

              {/* Dropoff Predictions */}
              {showDropoffPredictions && predictions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {predictions.map((place) => (
                    <button
                      key={place.place_id}
                      onClick={() => handlePredictionSelect(place)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{place.structured_formatting.main_text}</div>
                          <div className="text-sm text-gray-500">{place.structured_formatting.secondary_text}</div>
                          <div className="text-xs text-red-600 mt-1">Delivery destination</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {dropoffLocation && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  ✅ Destination set: {dropoffLocation.address}
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {searchError && (
            <div className="bg-red-50 p-3 rounded-lg text-red-700 border border-red-200">
              <p className="text-sm">{searchError}</p>
            </div>
          )}

          {/* Progress Indicator */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center ${pickupLocation ? "text-green-600" : "text-gray-400"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${pickupLocation ? "bg-green-500" : "bg-gray-300"}`} />
                  Pickup Location
                </div>
                <div className={`flex items-center ${dropoffLocation ? "text-green-600" : "text-gray-400"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${dropoffLocation ? "bg-green-500" : "bg-gray-300"}`} />
                  Drop-off Location
                </div>
              </div>
              <div className="text-gray-500">
                {pickupLocation && dropoffLocation ? "Ready to proceed" : "Complete both locations"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={!canProceed} className="min-w-[120px]">
              {canProceed ? (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              ) : (
                "Set Locations"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
