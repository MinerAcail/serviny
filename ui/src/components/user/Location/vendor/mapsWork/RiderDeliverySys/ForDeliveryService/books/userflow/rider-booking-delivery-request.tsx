"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
// import { google } from "googlemaps"
import { MapAndBooking } from "./map-and-booking"
import { RiderBookingMenu } from "./rider-booking-menu"
import {
  useRiderZones,
  useDeliveryCalculation,
  useSimpleLocationManager,
  useSimpleMapManager,
  useLocationAutocomplete,
} from "./rider-booking-hooks"
import { ZONE_COLORS } from "@/components/config/map"


export function RiderBookingDeliveryRequest() {
  const riderId = "rider-123" // In a real app, this would come from the URL or props

  // ==========================================
  // Environment and API Keys
  // ==========================================
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const maptilerApiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || ""

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const lastPickupRef = useRef<string | null>(null)
  const lastDropoffRef = useRef<string | null>(null)
  const lastCalculationRef = useRef<string | null>(null)

  // ==========================================
  // SIMPLIFIED Hooks
  // ==========================================

  // Fetch rider data and zones
  const {
    riderZones,
    riderProfile,
    isLoading: zonesLoading,
    error: zonesError,
    createDeliveryRequest,
    isCreatingRequest,
  } = useRiderZones(riderId)

  // SIMPLIFIED: Simple location state (no URL)
  const { pickupLocation, dropoffLocation, updatePickupLocation, updateDropoffLocation, clearAllLocations } =
    useSimpleLocationManager()

  // Delivery calculation
  const {
    calculation,
    isCalculating,
    error: calculationError,
    calculateDelivery,
    clearCalculation,
  } = useDeliveryCalculation()

  // SIMPLIFIED: Map manager
  const {
    mapInstance,
    mapLoaded,
    mapInitialized,
    initializeMapWithPickup,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
    clearMap,
  } = useSimpleMapManager()

  // Google Places API loading state
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Google Maps API
  useEffect(() => {
    if (!googleMapsApiKey || typeof window === "undefined") return

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      setIsLoaded(true)
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [googleMapsApiKey])

  // Google Places autocomplete
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

  // ==========================================
  // State Management
  // ==========================================

  const [currentStep, setCurrentStep] = useState<"locations" | "review" | "complete">("locations")
  const [isBooking, setIsBooking] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingReference, setBookingReference] = useState<string | null>(null)
  const [isOpenBookingMenu, setIsOpenBookingMenu] = useState(true)

  // Search states
  const [pickupSearch, setPickupSearch] = useState("")
  const [dropoffSearch, setDropoffSearch] = useState("")

  // ==========================================
  // SIMPLIFIED Effects
  // ==========================================

  // Initialize Google Places services
  useEffect(() => {
    if (!isLoaded) return

    console.log("🔧 Initializing Google Places services...")
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService()

    const serviceDiv = document.createElement("div")
    const dummyMap = new google.maps.Map(serviceDiv)
    placesServiceRef.current = new google.maps.places.PlacesService(dummyMap)

    console.log("✅ Google Places services initialized")
  }, [isLoaded])

  // SIMPLIFIED: Initialize map ONLY when pickup is set
  useEffect(() => {
    if (!mapRef.current || !pickupLocation || mapInitialized) {
      return
    }

    console.log("🗺️ Pickup location set - initializing map:", pickupLocation.address)

    const timer = setTimeout(() => {
      initializeMapWithPickup(mapRef.current!, pickupLocation, maptilerApiKey)
    }, 200)

    return () => clearTimeout(timer)
  }, [pickupLocation, mapInitialized, initializeMapWithPickup, maptilerApiKey])

  // SIMPLIFIED: Update map when locations change
  useEffect(() => {
    if (!mapLoaded || !pickupLocation) {
      return
    }

    // Create unique keys for locations to prevent duplicate operations
    const pickupKey = `${pickupLocation.lat}-${pickupLocation.lng}`
    const dropoffKey = dropoffLocation ? `${dropoffLocation.lat}-${dropoffLocation.lng}` : null

    // Check if we've already processed these exact locations
    if (lastPickupRef.current === pickupKey && lastDropoffRef.current === dropoffKey) {
      console.log("⏭️ Skipping duplicate map update for same locations")
      return
    }

    console.log("📍 Updating map with locations")

    // Update our tracking refs
    lastPickupRef.current = pickupKey
    lastDropoffRef.current = dropoffKey

    // Update markers
    updateMarkers(pickupLocation, dropoffLocation)

    // Draw coverage zones around pickup
    if (riderZones.length > 0) {
      setTimeout(() => {
        drawCoverageZones(pickupLocation, riderZones)
      }, 100)
    }

    // Draw route if both locations exist
    if (dropoffLocation) {
      setTimeout(() => {
        drawRoute(pickupLocation, dropoffLocation)

        // Fit map to show both locations
        setTimeout(() => {
          fitMapToMarkers()
        }, 200)
      }, 300)
    }
  }, [
    mapLoaded,
    pickupLocation,
    dropoffLocation,
    riderZones,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
  ])

  // SIMPLIFIED: Auto-calculate when both locations are set
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation || riderZones.length === 0 || isCalculating) {
      return
    }

    // Create unique key for this calculation to prevent duplicates
    const calculationKey = `${pickupLocation.lat}-${pickupLocation.lng}-${dropoffLocation.lat}-${dropoffLocation.lng}-${riderZones.length}`

    // Check if we've already calculated for these exact same parameters
    if (lastCalculationRef.current === calculationKey) {
      console.log("⏭️ Skipping duplicate calculation for same locations and zones")
      return
    }

    console.log("💰 Auto-calculating delivery pricing...")
    lastCalculationRef.current = calculationKey

    // Call calculateDelivery directly without depending on the function reference
    calculateDelivery(pickupLocation, dropoffLocation, riderZones)
  }, [pickupLocation, dropoffLocation, riderZones, isCalculating, calculateDelivery])

  // Update step when calculation is ready
  useEffect(() => {
    if (calculation && currentStep === "locations") {
      setCurrentStep("review")
    }
  }, [calculation, currentStep])

  // Update search fields when locations change
  useEffect(() => {
    setPickupSearch(pickupLocation?.address || "")
  }, [pickupLocation?.address])

  useEffect(() => {
    setDropoffSearch(dropoffLocation?.address || "")
  }, [dropoffLocation?.address])

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      lastPickupRef.current = null
      lastDropoffRef.current = null
      lastCalculationRef.current = null
    }
  }, [])

  // ==========================================
  // Event Handlers
  // ==========================================

  // Handle pickup search input
  const handlePickupSearch = useCallback(
    (query: string) => {
      setPickupSearch(query)
      if (query.length >= 3) {
        searchPickupLocations(query)
      } else {
        clearPickupPredictions()
      }
    },
    [searchPickupLocations, clearPickupPredictions],
  )

  // Handle dropoff search input
  const handleDropoffSearch = useCallback(
    (query: string) => {
      setDropoffSearch(query)
      if (query.length >= 3) {
        searchDropoffLocations(query)
      } else {
        clearDropoffPredictions()
      }
    },
    [searchDropoffLocations, clearDropoffPredictions],
  )

  // Handle pickup location selection
  const handlePickupSelect = useCallback(
    async (prediction: any) => {
      console.log("📍 Selecting pickup location:", prediction.description)

      const location = await getLocationFromPlaceId(prediction.place_id)
      if (location) {
        updatePickupLocation(location)
        setPickupSearch(location.address)
        clearPickupPredictions()

        toast.success("Pickup location set!", {
          description: location.address,
        })
      } else {
        toast.error("Failed to get location details")
      }
    },
    [getLocationFromPlaceId, updatePickupLocation, clearPickupPredictions],
  )

  // Handle dropoff location selection
  const handleDropoffSelect = useCallback(
    async (prediction: any) => {
      console.log("🎯 Selecting dropoff location:", prediction.description)

      const location = await getLocationFromPlaceId(prediction.place_id)
      if (location) {
        updateDropoffLocation(location)
        setDropoffSearch(location.address)
        clearDropoffPredictions()

        toast.success("Dropoff location set!", {
          description: location.address,
        })
      } else {
        toast.error("Failed to get location details")
      }
    },
    [getLocationFromPlaceId, updateDropoffLocation, clearDropoffPredictions],
  )

  const handleBooking = useCallback(async () => {
    if (!calculation || !pickupLocation || !dropoffLocation || !riderId) return

    setIsBooking(true)

    try {
      const deliveryRequest = await createDeliveryRequest({
        riderId,
        pickupLocation: {
          address: pickupLocation.address,
          coordinates: [pickupLocation.lng, pickupLocation.lat],
        },
        dropoffLocation: {
          address: dropoffLocation.address,
          coordinates: [dropoffLocation.lng, dropoffLocation.lat],
        },
        distance: calculation.distance,
        duration: calculation.duration,
        totalPrice: calculation.totalPrice,
        matchedZoneId: calculation.matchedZone?.id || "",
      })

      setBookingReference(deliveryRequest.reference)
      setBookingComplete(true)
      setCurrentStep("complete")

      toast.success("Delivery booked successfully!", {
        description: `Distance: ${calculation.distance}km from pickup center to destination`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Booking error:", error)
      toast.error("Failed to book delivery. Please try again.")
    } finally {
      setIsBooking(false)
    }
  }, [calculation, pickupLocation, dropoffLocation, riderId, createDeliveryRequest])

  const resetBooking = useCallback(() => {
    clearAllLocations()
    clearCalculation()
    clearMap()
    setCurrentStep("locations")
    setBookingComplete(false)
    setBookingReference(null)
    setPickupSearch("")
    setDropoffSearch("")

    // Reset tracking refs
    lastPickupRef.current = null
    lastDropoffRef.current = null
    lastCalculationRef.current = null

    toast.info("Booking reset", {
      description: "Ready to set new pickup location",
    })
  }, [clearAllLocations, clearCalculation, clearMap])

  // ==========================================
  // Loading State
  // ==========================================

  if (!isLoaded || zonesLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading rider information...</p>
          <p className="text-xs text-gray-400 mt-2">Setting up zone calculations...</p>
        </div>
      </div>
    )
  }

  if (zonesError) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-gray-700 mb-4">{zonesError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ==========================================
  // Render Component
  // ==========================================
  return (
    <div className="py-6 font-sans w-full min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Map and Booking Interface */}
        {pickupLocation && (
          <MapAndBooking
            // Map refs
            mapRef={mapRef}
            mapInstance={mapInstance}
            mapLoaded={mapLoaded}
            // Location state
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            updatePickupLocation={updatePickupLocation}
            updateDropoffLocation={updateDropoffLocation}
            // Search state
            pickupSearch={pickupSearch}
            dropoffSearch={dropoffSearch}
            setPickupSearch={setPickupSearch}
            setDropoffSearch={setDropoffSearch}
            // Google services
            autocompleteServiceRef={autocompleteServiceRef}
            placesServiceRef={placesServiceRef}
            geocoderRef={null}
            isLoaded={isLoaded}
            // Calculation state
            calculation={calculation}
            isCalculating={isCalculating}
            // UI state
            isOpenBookingMenu={isOpenBookingMenu}
            showZones={true}
            onToggleZones={() => {}}
            // Loading and errors
            loading={zonesLoading}
            error={zonesError || calculationError}
          />
        )}

        {/* Location Inputs with Autocomplete */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pickup Input */}
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-gray-700">📍 Pickup Location (Zone Center)</label>
            <input
              type="text"
              value={pickupSearch}
              onChange={(e) => handlePickupSearch(e.target.value)}
              placeholder="Search for pickup location..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Pickup Predictions Dropdown */}
            {pickupPredictions.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {pickupPredictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handlePickupSelect(prediction)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
                    <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                  </button>
                ))}
              </div>
            )}

            {pickupLocation && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                ✅ {pickupLocation.address}
                <button
                  onClick={() => {
                    updatePickupLocation(null)
                    setPickupSearch("")
                    clearPickupPredictions()
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Dropoff Input */}
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-gray-700">🎯 Dropoff Location</label>
            <input
              type="text"
              value={dropoffSearch}
              onChange={(e) => handleDropoffSearch(e.target.value)}
              placeholder="Search for dropoff location..."
              disabled={!pickupLocation}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />

            {/* Dropoff Predictions Dropdown */}
            {dropoffPredictions.length > 0 && (
              <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {dropoffPredictions.map((prediction) => (
                  <button
                    key={prediction.place_id}
                    onClick={() => handleDropoffSelect(prediction)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{prediction.structured_formatting.main_text}</div>
                    <div className="text-sm text-gray-500">{prediction.structured_formatting.secondary_text}</div>
                  </button>
                ))}
              </div>
            )}

            {dropoffLocation && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                ✅ {dropoffLocation.address}
                <button
                  onClick={() => {
                    updateDropoffLocation(null)
                    setDropoffSearch("")
                    clearDropoffPredictions()
                  }}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Booking Menu */}
        {pickupLocation && (
          <RiderBookingMenu
            // Rider data
            riderProfile={riderProfile}
            riderZones={riderZones}
            // Booking flow
            currentStep={currentStep}
            calculation={calculation}
            isBooking={isBooking}
            bookingComplete={bookingComplete}
            bookingReference={bookingReference}
            // Handlers
            onBooking={handleBooking}
            onReset={resetBooking}
            setCurrentStep={setCurrentStep}
            // UI state
            isOpen={isOpenBookingMenu}
            setIsOpen={setIsOpenBookingMenu}
          />
        )}

        {/* Pricing Zones */}
        {pickupLocation && riderZones.length > 0 && (
          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-semibold text-gray-900 mb-3">📍 Pricing Zones (Centered on Pickup)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {riderZones.map((zone, index) => (
                <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length],
                      }}
                    />
                    <span className="text-sm font-medium">
                      {zone.startKm}km - {zone.endKm}km
                    </span>
                  </div>
                  <span className="font-semibold text-gray-900">${zone.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calculation Result */}
        {calculation && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">💰 Delivery Pricing</h3>
                <p className="text-sm text-gray-600">{calculation.distance}km from pickup center to destination</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">${calculation.totalPrice}</div>
                <div className="text-sm text-gray-500">{calculation.duration}</div>
              </div>
            </div>
            {calculation.matchedZone && (
              <div className="mt-2 pt-2 border-t border-green-200">
                <p className="text-xs text-gray-600">
                  Zone: {calculation.matchedZone.startKm}km - {calculation.matchedZone.endKm}km
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reset Button */}
        {(pickupLocation || dropoffLocation) && (
          <div className="text-center">
            <button
              onClick={resetBooking}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              🗑️ Reset All
            </button>
          </div>
        )}

        {/* How It Works */}
        {!pickupLocation && (
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">🎯</span>
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-xl">
                <div className="text-2xl mb-2">📍</div>
                <h4 className="font-medium text-green-900 mb-1">1. Set Pickup</h4>
                <p className="text-sm text-green-700">Your pickup becomes the zone center</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl">
                <div className="text-2xl mb-2">🗺️</div>
                <h4 className="font-medium text-blue-900 mb-1">2. See Zones</h4>
                <p className="text-sm text-blue-700">Map shows pricing zones around pickup</p>
              </div>
              <div className="text-center p-4 bg-white rounded-xl">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-purple-900 mb-1">3. Set Destination</h4>
                <p className="text-sm text-purple-700">Add dropoff to get instant pricing</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
