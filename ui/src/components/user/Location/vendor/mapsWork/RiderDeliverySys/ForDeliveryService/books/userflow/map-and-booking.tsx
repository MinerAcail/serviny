"use client"

import type React from "react"

import { useEffect } from "react"
import { MapPin, Navigation } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Location, DeliveryCalculation } from "./rider-booking-hooks"
// import type { google } from "google-maps"

interface MapAndBookingProps {
  // Map refs
  mapRef: React.RefObject<HTMLDivElement>
  mapInstance: any
  mapLoaded: boolean

  // Location state
  pickupLocation: Location | null
  dropoffLocation: Location | null
  updatePickupLocation: (location: Location | null) => void
  updateDropoffLocation: (location: Location | null) => void

  // Search state
  pickupSearch: string
  dropoffSearch: string
  setPickupSearch: (search: string) => void
  setDropoffSearch: (search: string) => void

  // Google services
  autocompleteServiceRef: React.RefObject<google.maps.places.AutocompleteService | null>
  placesServiceRef: React.RefObject<google.maps.places.PlacesService | null>
  geocoderRef: any
  isLoaded: boolean

  // Calculation state
  calculation: DeliveryCalculation | null
  isCalculating: boolean

  // UI state
  isOpenBookingMenu: boolean
  showZones: boolean
  onToggleZones: () => void

  // Loading and errors
  loading?: boolean
  error?: string | null
}

export function MapAndBooking({
  mapRef,
  mapLoaded,
  pickupLocation,
  dropoffLocation,
  calculation,
  isCalculating,
  loading,
  error,
}: MapAndBookingProps) {
  // Import CSS for maplibre-gl
  useEffect(() => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/maplibre-gl@3.3.1/dist/maplibre-gl.css"
    document.head.appendChild(link)

    return () => {
      document.head.removeChild(link)
    }
  }, [])

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Map Container */}
      <div ref={mapRef} className="absolute inset-0 bg-gray-100" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 p-4">
          <Card className="max-w-md p-4 text-center">
            <div className="text-red-500 text-xl mb-2">⚠️</div>
            <p className="text-gray-700 mb-2">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              Try Again
            </Button>
          </Card>
        </div>
      )}

      {/* Map Controls */}
      {mapLoaded && (
        <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-md">
            <Navigation className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 bg-white shadow-md">
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Map Attribution */}
      <div className="absolute bottom-1 right-1 z-10 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
        © MapTiler © OpenStreetMap contributors
      </div>
    </div>
  )
}
