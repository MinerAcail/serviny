"use client"

import type React from "react"

import type { RefObject } from "react"
import { Loader2, Target, Layers, Pin, Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react"
import type maplibregl from "maplibre-gl"
import { type Location, type DeliveryCalculation, type PricingZone, useLocationAutocomplete } from "./riderBookingHooks"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface MapAndBookingProps {
  // Map refs
  mapRef: RefObject<HTMLDivElement>
  mapInstance: { current: maplibregl.Map | null }
  mapLoaded: boolean

  // Location state
  pickupLocation: Location | null
  dropoffLocation: Location | null

  // Calculation state
  calculation: DeliveryCalculation | null
  isCalculating: boolean

  // UI state
  isOpenBookingMenu: boolean
  showZones: boolean
  onToggleZones: () => void

  // Loading and errors
  loading: boolean
  error: string | null

  // Pin drop functionality
  isPinDropActive?: boolean
  pinDropMode?: "pickup" | "dropoff" | null
  onStartPinDrop?: () => void
  hasPickup?: boolean
  hasDropoff?: boolean
  riderZones: PricingZone[]
    showRouteDialog: boolean;
  setShowRouteDialog: (show: boolean) => void;
}

// Collapsible Info Card Component
function CollapsibleInfoCard({
  icon,
  title,
  content,
  variant = "blue",
}: {
  icon: React.ReactNode
  title: string
  content: string
  variant?: "blue" | "green" | "gray"
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  const bgColor = {
    blue: "bg-blue-50/90 border-blue-200",
    green: "bg-green-50/90 border-green-200",
    gray: "bg-gray-50/90 border-gray-200",
  }[variant]

  const titleColor = {
    blue: "text-blue-900",
    green: "text-green-900",
    gray: "text-gray-900",
  }[variant]

  const contentColor = {
    blue: "text-blue-700",
    green: "text-green-700",
    gray: "text-gray-700",
  }[variant]

  return (
    <div className={`backdrop-blur-sm border rounded-xl shadow-sm overflow-hidden transition-all ${bgColor}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          {icon}
          <span className={`font-medium text-sm ${titleColor}`}>{title}</span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <p className={`text-xs ${contentColor}`}>{content}</p>
        </div>
      )}
    </div>
  )
}

// Location Status Card Component
function LocationStatusCard({
  pickupLocation,
  dropoffLocation,
  calculation,
}: {
  pickupLocation: Location | null
  dropoffLocation: Location | null
  calculation: DeliveryCalculation | null
}) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all">
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center mr-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <span className="font-medium text-sm">Location Details</span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {pickupLocation && (
            <div className="flex items-center text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <span className="truncate text-xs">Zone Center: {pickupLocation.address.split(",")[0]}</span>
            </div>
          )}
          {dropoffLocation && (
            <div className="flex items-center text-red-700">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
              <span className="truncate text-xs">Destination: {dropoffLocation.address.split(",")[0]}</span>
            </div>
          )}
          {calculation && (
            <div className="grid grid-cols-2 mt-2 pt-2 border-t border-gray-100">
              <div className="text-base font-bold text-green-600">${calculation.totalPrice.toFixed(2)}</div>
              <div className="text-sm text-gray-500 text-right">{calculation.distance}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MapAndBooking({
  mapRef,
  pickupLocation,
  dropoffLocation,
  calculation,
  isOpenBookingMenu,
  showZones,
  onToggleZones,
  loading,
  error,
  isPinDropActive = false,
  pinDropMode = null,
  onStartPinDrop,
  showRouteDialog,
   setShowRouteDialog
}: MapAndBookingProps) {
  return (
    <div className="space-y-4 w-full">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 p-4 rounded-xl text-red-700 border border-red-200">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Pin Drop Instructions */}
      {isPinDropActive && pinDropMode && (
        <CollapsibleInfoCard
          icon={pinDropMode === "pickup" ? <span>📍</span> : <span>🎯</span>}
          title={`Pin Drop Mode: ${pinDropMode === "pickup" ? "Pickup (Zone Center)" : "Dropoff (Destination)"}`}
          content={`Drag the pin on the map to your desired ${pinDropMode} location`}
          variant={pinDropMode === "pickup" ? "green" : "blue"}
        />
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
              <p className="text-blue-600 font-medium">Loading map...</p>
            </div>
          </div>
        )}

        {/* iOS-style Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          {/* Zone Toggle Button */}

          {showRouteDialog&&(

          <button
            onClick={()=>setShowRouteDialog(!showRouteDialog)}
            className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:bg-white transition-colors"
            title={showRouteDialog ? "Hide zones" : "Show zones"}
          >
            {showRouteDialog ? <EyeOff className="h-5 w-5 text-gray-700" /> : <Eye className="h-5 w-5 text-gray-700" />}
          </button>
          ) }

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
        </div>

        {/* Enhanced Location Status Card */}
        {(pickupLocation || dropoffLocation) && !isPinDropActive && (
          <div className="absolute top-3 left-3 z-10 max-w-xs">
            <LocationStatusCard
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              calculation={calculation}
            />
          </div>
        )}

        {/* Coverage Zones Helper */}
        {pickupLocation && showZones && !dropoffLocation && !isPinDropActive && (
          <div className="absolute top-3 left-3 z-10 max-w-xs">
            <CollapsibleInfoCard
              icon={<Layers className="h-4 w-4 text-green-600" />}
              title="Coverage Zones Active"
              content="Colored circles show delivery areas from your pickup location (zone center)"
              variant="green"
            />
          </div>
        )}
      </div>

      {/* No Pickup Location Helper */}
      {!pickupLocation && !isPinDropActive && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Set Your Zone Center</h4>
              <p className="text-sm text-gray-600 mb-2">
                Use the location dialog or pin drop to set your pickup location and see coverage zones.
              </p>
              <p className="text-xs text-gray-500">
                The pickup location becomes the center of all delivery zones, and pricing is calculated from this center
                to your destination.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// Location Input Dialog Component
export function LocationInputDialog({
  isOpen,
  onClose,
  onComplete,
  initialPickup = null,
  initialDropoff = null,
  autocompleteServiceRef,
  placesServiceRef,
  isLoaded
}: {
  isOpen: boolean
  onClose: () => void
  onComplete: (pickup: Location, dropoff: Location) => void
  initialPickup?: Location | null
  initialDropoff?: Location | null
  autocompleteServiceRef: React.RefObject<google.maps.places.AutocompleteService | null>
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>
  isLoaded: boolean
}) {
  const [pickupLocation, setPickupLocation] = useState<Location | null>(initialPickup)
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(initialDropoff)
  const [pickupSearch, setPickupSearch] = useState(initialPickup?.address || "")
  const [dropoffSearch, setDropoffSearch] = useState(initialDropoff?.address || "")
  const [showPickupPredictions, setShowPickupPredictions] = useState(false)
  const [showDropoffPredictions, setShowDropoffPredictions] = useState(false)
  const [activeSearchField, setActiveSearchField] = useState<"pickup" | "dropoff" | null>(null)
  const [showHowItWorks, setShowHowItWorks] = useState(false)

  // Use your real autocomplete hook
  const {
    pickupPredictions,
    dropoffPredictions,
    isSearching,
    searchPickupLocations,
    searchDropoffLocations,
    getLocationFromPlaceId,
    clearPickupPredictions,
    clearDropoffPredictions,
  } = useLocationAutocomplete(autocompleteServiceRef.current, placesServiceRef.current)

  // Search handlers using your real hooks
  const handlePickupSearch = useCallback((value: string) => {
    setPickupSearch(value)
    setActiveSearchField("pickup")
    
    if (value.length >= 3) {
      searchPickupLocations(value)
      setShowPickupPredictions(true)
      setShowDropoffPredictions(false)
    } else {
      clearPickupPredictions()
      setShowPickupPredictions(false)
    }
  }, [searchPickupLocations, clearPickupPredictions])

  const handleDropoffSearch = useCallback((value: string) => {
    setDropoffSearch(value)
    setActiveSearchField("dropoff")
    
    if (value.length >= 3) {
      searchDropoffLocations(value)
      setShowDropoffPredictions(true)
      setShowPickupPredictions(false)
    } else {
      clearDropoffPredictions()
      setShowDropoffPredictions(false)
    }
  }, [searchDropoffLocations, clearDropoffPredictions])

  const handlePredictionSelect = useCallback(async (prediction: any) => {
    console.log(`📍 Selecting ${activeSearchField} location:`, prediction.description)
    
    const location = await getLocationFromPlaceId(prediction.place_id)
    if (location) {
      if (activeSearchField === "pickup") {
        setPickupLocation(location)
        setPickupSearch(location.address)
        clearPickupPredictions()
        setShowPickupPredictions(false)
        
        toast.success("Pickup location set as zone center!", {
          description: location.address,
        })
      } else if (activeSearchField === "dropoff") {
        setDropoffLocation(location)
        setDropoffSearch(location.address)
        clearDropoffPredictions()
        setShowDropoffPredictions(false)
        
        toast.success("Dropoff location set!", {
          description: location.address,
        })
      }
    } else {
      toast.error("Failed to get location details")
    }

    setActiveSearchField(null)
  }, [activeSearchField, getLocationFromPlaceId, clearPickupPredictions, clearDropoffPredictions])

  const handleComplete = () => {
    if (pickupLocation && dropoffLocation) {
      onComplete(pickupLocation, dropoffLocation)
      onClose()
    }
  }

  const clearPickup = () => {
    setPickupLocation(null)
    setPickupSearch("")
    clearPickupPredictions()
  }

  const clearDropoff = () => {
    setDropoffLocation(null)
    setDropoffSearch("")
    clearDropoffPredictions()
  }

  const canProceed = pickupLocation && dropoffLocation

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">
              {initialPickup ? "Edit Delivery Locations" : "Set Delivery Locations"}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowHowItWorks(!showHowItWorks)}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How it works
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* How It Works Section */}
            {showHowItWorks && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  How the Zone System Works
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-green-600">📍</span>
                    </div>
                    <h4 className="font-medium text-green-900 mb-1">1. Zone Center</h4>
                    <p className="text-sm text-green-700">Your pickup becomes the center of all pricing zones</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600">🗺️</span>
                    </div>
                    <h4 className="font-medium text-blue-900 mb-1">2. Distance Zones</h4>
                    <p className="text-sm text-blue-700">Colored circles show different pricing tiers</p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-purple-600">🎯</span>
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
              </div>
            )}

            {/* Location Input Section */}
            <div className="space-y-4">
              {/* Pickup Location */}
              <div className="space-y-2 relative">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                  Pickup Location (Zone Center)
                  {pickupLocation && (
                    <svg className="h-4 w-4 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter pickup address to set zone center..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Pickup Predictions */}
                {showPickupPredictions && pickupPredictions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {pickupPredictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        onClick={() => handlePredictionSelect(prediction)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">📍</span>
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
                    <svg className="h-4 w-4 text-green-600 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    type="text"
                    placeholder="Enter delivery destination..."
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    value={dropoffSearch}
                    onChange={(e) => handleDropoffSearch(e.target.value)}
                    disabled={!isLoaded || !pickupLocation}
                  />
                  {isSearching && activeSearchField === "dropoff" && (
                    <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                      <svg className="h-4 w-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                  {dropoffLocation && (
                    <button className="absolute inset-y-0 right-0 flex items-center pr-3" onClick={clearDropoff}>
                      <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Dropoff Predictions */}
                {showDropoffPredictions && dropoffPredictions.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {dropoffPredictions.map((prediction) => (
                      <button
                        key={prediction.place_id}
                        onClick={() => handlePredictionSelect(prediction)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-red-500">🎯</span>
                          <div>
                            <div className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
                            <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
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
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={!canProceed}
                className={`min-w-[120px] px-6 py-2 rounded-lg font-medium ${
                  canProceed
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {canProceed ? (
                  <span className="flex items-center">
                    Continue
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                ) : (
                  "Set Locations"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
