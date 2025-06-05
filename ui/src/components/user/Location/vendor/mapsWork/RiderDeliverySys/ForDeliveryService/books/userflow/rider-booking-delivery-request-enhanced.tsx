"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
// import { MapAndBookingEnhanced } from "./map-and-booking-enhanced"
import { RiderBookingMenu } from "./rider-booking-menu"
import {
  useRiderZones,
  useDeliveryCalculation,
  useSimpleLocationManager,
  useSimpleMapManager,
} from "./rider-booking-hooks"
// import { google } from "google-maps"

// Zone colors for map visualization
const ZONE_COLORS = [
  "#4ade80", // green
  "#facc15", // yellow
  "#f87171", // red
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
]

export function RiderBookingDeliveryRequestEnhanced() {
  const riderId = "rider-123" // In a real app, this would come from props or URL

  // ==========================================
  // Environment and API Keys
  // ==========================================
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null)
  const autocompleteServiceRef = useRef<any | null>(null)
  const placesServiceRef = useRef<any | null>(null)
  const lastPickupRef = useRef<string | null>(null)
  const lastDropoffRef = useRef<string | null>(null)
  const lastCalculationRef = useRef<string | null>(null)

  // ==========================================
  // Hooks
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

  // Location state
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

  // Map manager
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

  // Google Maps API loading state
  const [isLoaded, setIsLoaded] = useState(false)

  // ==========================================
  // State Management
  // ==========================================

  const [currentStep, setCurrentStep] = useState<"locations" | "review" | "complete">("locations")
  const [isBooking, setIsBooking] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingReference, setBookingReference] = useState<string | null>(null)
  const [isOpenBookingMenu, setIsOpenBookingMenu] = useState(false)
  const [showZones, setShowZones] = useState(true)

  // ==========================================
  // Effects
  // ==========================================

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
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [googleMapsApiKey])

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

  // Initialize map when pickup is set
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

  // Update map when locations change
  useEffect(() => {
    if (!mapLoaded || !pickupLocation) {
      return
    }

    const pickupKey = `${pickupLocation.lat}-${pickupLocation.lng}`
    const dropoffKey = dropoffLocation ? `${dropoffLocation.lat}-${dropoffLocation.lng}` : null

    if (lastPickupRef.current === pickupKey && lastDropoffRef.current === dropoffKey) {
      console.log("⏭️ Skipping duplicate map update for same locations")
      return
    }

    console.log("📍 Updating map with locations")

    lastPickupRef.current = pickupKey
    lastDropoffRef.current = dropoffKey

    updateMarkers(pickupLocation, dropoffLocation)

    if (riderZones.length > 0 && showZones) {
      setTimeout(() => {
        drawCoverageZones(pickupLocation, riderZones)
      }, 100)
    }

    if (dropoffLocation) {
      setTimeout(() => {
        drawRoute(pickupLocation, dropoffLocation)
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
    showZones,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
  ])

  // Auto-calculate when both locations are set
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation || riderZones.length === 0 || isCalculating) {
      return
    }

    const calculationKey = `${pickupLocation.lat}-${pickupLocation.lng}-${dropoffLocation.lat}-${dropoffLocation.lng}-${riderZones.length}`

    if (lastCalculationRef.current === calculationKey) {
      console.log("⏭️ Skipping duplicate calculation for same locations and zones")
      return
    }

    console.log("💰 Auto-calculating delivery pricing...")
    lastCalculationRef.current = calculationKey

    calculateDelivery(pickupLocation, dropoffLocation, riderZones)
  }, [pickupLocation, dropoffLocation, riderZones, isCalculating, calculateDelivery])

  // Update step when calculation is ready
  useEffect(() => {
    if (calculation && currentStep === "locations") {
      setCurrentStep("review")
      setIsOpenBookingMenu(true)
    }
  }, [calculation, currentStep])

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
    setIsOpenBookingMenu(false)

    lastPickupRef.current = null
    lastDropoffRef.current = null
    lastCalculationRef.current = null

    toast.info("Booking reset", {
      description: "Ready to set new locations",
    })
  }, [clearAllLocations, clearCalculation, clearMap])

  const toggleZones = useCallback(() => {
    setShowZones(!showZones)
    if (pickupLocation && mapLoaded) {
      if (!showZones) {
        // Show zones
        setTimeout(() => {
          drawCoverageZones(pickupLocation, riderZones)
        }, 100)
      } else {
        // Hide zones - would need a clearZones function in the map manager
        toast.info(showZones ? "Zones hidden" : "Zones shown")
      }
    }
  }, [showZones, pickupLocation, mapLoaded, drawCoverageZones, riderZones])

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
        {/* Enhanced Map and Booking Interface */}
        <MapAndBookingEnhanced
          mapRef={mapRef}
          mapInstance={mapInstance}
          mapLoaded={mapLoaded}
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          updatePickupLocation={updatePickupLocation}
          updateDropoffLocation={updateDropoffLocation}
          autocompleteServiceRef={autocompleteServiceRef}
          placesServiceRef={placesServiceRef}
          isLoaded={isLoaded}
          calculation={calculation}
          isCalculating={isCalculating}
          showZones={showZones}
          onToggleZones={toggleZones}
          loading={zonesLoading}
          error={zonesError || calculationError}
        />

        {/* Booking Menu */}
        {pickupLocation && dropoffLocation && (
          <RiderBookingMenu
            riderProfile={riderProfile}
            riderZones={riderZones}
            currentStep={currentStep}
            calculation={calculation}
            isBooking={isBooking}
            bookingComplete={bookingComplete}
            bookingReference={bookingReference}
            onBooking={handleBooking}
            onReset={resetBooking}
            setCurrentStep={setCurrentStep}
            isOpen={isOpenBookingMenu}
            setIsOpen={setIsOpenBookingMenu}
          />
        )}

        {/* Pricing Zones Display */}
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
      </div>
    </div>
  )
}
