"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { APIProvider, Map, AdvancedMarker, Pin, useMap, type MapMouseEvent } from "@vis.gl/react-google-maps"
import { useJsApiLoader, type Libraries } from "@react-google-maps/api"
// import { google } from "googlemaps"

type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

interface LocationStepProps {
  onLocationSelect: (location: Location) => void
  selectedLocation: Location | null
  onNext: () => void
}
const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"]

export function LocationStep({ onLocationSelect, selectedLocation, onNext }: LocationStepProps) {
  const [searchValue, setSearchValue] = useState("")
  const [predictions, setPredictions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 5.6037, lng: -0.187 }) // Default to Accra

  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)

  // Load the Google Maps JavaScript API with the places library
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: envApiKey || "",
    libraries,
  })

  // Services refs
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  // Initialize services when the API is loaded
  useEffect(() => {
    if (!isLoaded) return

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
    geocoderRef.current = new google.maps.Geocoder()
  }, [isLoaded])

  // Update map center when location is selected
  useEffect(() => {
    if (selectedLocation) {
      setMapCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng })
    }
  }, [selectedLocation])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (value.length > 2 && autocompleteServiceRef.current) {
      setShowPredictions(true)
      fetchPredictions(value)
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  const fetchPredictions = async (input: string) => {
    if (!autocompleteServiceRef.current) return

    try {
      setIsLoading(true)

      autocompleteServiceRef.current.getPlacePredictions({ input }, (predictions, status) => {
        setIsLoading(false)

        if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
          console.error("Error fetching predictions:", status)
          setPredictions([])
          return
        }

        setPredictions(
          predictions.map((p) => ({
            description: p.description,
            place_id: p.place_id,
            structured_formatting: {
              main_text: p.structured_formatting?.main_text || p.description,
              secondary_text: p.structured_formatting?.secondary_text || "",
            },
          })),
        )
      })
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setIsLoading(false)
      setPredictions([])
    }
  }

  const handlePredictionSelect = (place: any) => {
    setSearchValue(place.description)
    setShowPredictions(false)

    if (!isLoaded || !mapDivRef.current) return

    // Initialize Places service if not already initialized
    if (!placesServiceRef.current && mapDivRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(mapDivRef.current)
    }

    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: place.place_id,
          fields: ["geometry", "formatted_address"],
        },
        (result, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            result &&
            result.geometry &&
            result.geometry.location
          ) {
            const lat = result.geometry.location.lat()
            const lng = result.geometry.location.lng()

            const newLocation = {
              address: result.formatted_address || place.description,
              lat,
              lng,
              placeId: place.place_id,
            }

            onLocationSelect(newLocation)
          } else {
            console.error("Error getting place details:", status)
          }
        },
      )
    } else if (geocoderRef.current) {
      // Fallback to geocoding if PlacesService isn't available
      geocoderRef.current.geocode({ address: place.description }, (results, status) => {
        if (status === "OK" && results && results[0] && results[0].geometry) {
          const lat = results[0].geometry.location.lat()
          const lng = results[0].geometry.location.lng()

          const newLocation = {
            address: place.description,
            lat,
            lng,
            placeId: place.place_id,
          }

          onLocationSelect(newLocation)
        } else {
          console.error("Geocoding failed:", status)
        }
      })
    }
  }

  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.latLng || !geocoderRef.current) return

    const lat = e.latLng.lat
    const lng = e.latLng.lng

    // Use reverse geocoding to get the address
    geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const newLocation = {
          address: results[0].formatted_address || `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          lat,
          lng,
          placeId: results[0].place_id,
        }

        onLocationSelect(newLocation)
        setSearchValue(newLocation.address)
      } else {
        // Fallback if geocoding fails
        const newLocation = {
          address: `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          lat,
          lng,
        }

        onLocationSelect(newLocation)
        setSearchValue(newLocation.address)
      }
    })
  }

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowPredictions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // MapComponent to handle map interactions
  const MapComponent = () => {
    const { map } = useMap()

    // Initialize PlacesService after map is available
    useEffect(() => {
      if (map && !placesServiceRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(map)
      }
    }, [map])

    // Exposed empty div for PlacesService (needed for initialization)
    return <div ref={mapDivRef} style={{ display: "none" }}></div>
  }

  if (loadError) {
    return <div className="p-4 text-red-500">Error loading Google Maps API: {loadError.message}</div>
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Select Your Location</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Enter your business address or select a location on the map
          </p>
        </div>

        <div className="relative" ref={searchInputRef}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search for a location..."
              className="pl-10 pr-4 py-6 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-[#3A3A3C] focus-visible:ring-[#0071E3]"
              value={searchValue}
              onChange={handleSearchChange}
              disabled={!isLoaded}
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
              </div>
            )}
          </div>

          {/* Predictions dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#3A3A3C] rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
              <ul className="py-1">
                {predictions.map((place) => (
                  <li
                    key={place.place_id}
                    className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2C2C2E] cursor-pointer transition-colors"
                    onClick={() => handlePredictionSelect(place)}
                  >
                    <div className="font-medium text-[#1D1D1F] dark:text-white">
                      {place.structured_formatting.main_text}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {place.structured_formatting.secondary_text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Google Map */}
        <div className="h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#2C2C2E]">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mr-2" />
              <span className="text-gray-500 dark:text-gray-400">Loading map...</span>
            </div>
          ) : (
            <APIProvider apiKey={envApiKey || ""}>
              <Map
                defaultCenter={mapCenter}
                center={mapCenter}
                defaultZoom={12}
                gestureHandling="greedy"
                disableDefaultUI={true}

                mapId="map"
                onClick={handleMapClick}
                className="h-full w-full"
              >
                {selectedLocation && (
                  <AdvancedMarker position={{ lat: selectedLocation.lat, lng: selectedLocation.lng }}>
                    <Pin background={"#0071E3"} glyphColor={"#FFFFFF"} borderColor={"#FFFFFF"} />
                  </AdvancedMarker>
                )}
                <MapComponent />
              </Map>
            </APIProvider>
          )}
        </div>

        {selectedLocation && (
          <Card className="bg-[#F5F5F7] dark:bg-[#2C2C2E] border-gray-100 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-[#0071E3] mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-[#1D1D1F] dark:text-white">Selected Location</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedLocation.address}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button
            onClick={onNext}
            disabled={!selectedLocation}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
