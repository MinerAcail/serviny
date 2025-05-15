import type React from "react"
import { useState, useRef, useEffect } from "react"
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps"
import { useJsApiLoader, Libraries } from "@react-google-maps/api"
import { Search, MapPin, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"

interface LocationSelectorProps {
  apiKey?: string
  onLocationSelect?: (location: {
    address: string
    lat: number
    lng: number
    placeId?: string
  }) => void
  initialLocation?: {
    lat: number
    lng: number
  }
}

interface Place {
  description: string
  place_id: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

const libraries: Libraries = ["places"];
const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function LocationSelector({
  apiKey = envApiKey,
  onLocationSelect,
  initialLocation = { lat: 40.7128, lng: -74.006 }, // Default to New York City
}: LocationSelectorProps) {
  const [searchValue, setSearchValue] = useState("")
  const [predictions, setPredictions] = useState<Place[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    lat: number
    lng: number
    placeId?: string
  } | null>(null)
  const [mapCenter, setMapCenter] = useState(initialLocation)
  const [isLoading, setIsLoading] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)
  
  // Replace manual script loading with useJsApiLoader
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
  })

  // Services refs
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)

  // Initialize Google Maps services
  useEffect(() => {
    if (isLoaded && window.google) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
      geocoderRef.current = new google.maps.Geocoder()
      
      // Initialize PlacesService if mapDivRef is available
      if (mapDivRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(mapDivRef.current)
      }
    }
  }, [isLoaded])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (value.length > 2) {
      setShowPredictions(true)
      fetchPredictions(value)
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  const fetchPredictions = async (input: string) => {
    if (!isLoaded || !autocompleteServiceRef.current) return

    try {
      setIsLoading(true)
      
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input,
        },
        (predictions, status) => {
          setIsLoading(false)
          
          if (status !== google.maps.places.PlacesServiceStatus.OK || !predictions) {
            console.error("Error fetching predictions:", status)
            setPredictions([])
            return
          }
          
          setPredictions(predictions.map(p => ({
            description: p.description,
            place_id: p.place_id,
            structured_formatting: {
              main_text: p.structured_formatting?.main_text || p.description,
              secondary_text: p.structured_formatting?.secondary_text || ""
            }
          })))
        }
      )
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setIsLoading(false)
      setPredictions([])
    }
  }

  const handlePredictionSelect = (place: Place) => {
    setSearchValue(place.description)
    setShowPredictions(false)

    // Initialize PlacesService if not already done
    if (!placesServiceRef.current && mapDivRef.current && isLoaded) {
      placesServiceRef.current = new google.maps.places.PlacesService(mapDivRef.current)
    }

    // Get place details to get coordinates
    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: place.place_id,
          fields: ["geometry", "formatted_address"]
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result && result.geometry && result.geometry.location) {
            const lat = result.geometry.location.lat()
            const lng = result.geometry.location.lng()
            
            const newLocation = {
              address: result.formatted_address || place.description,
              lat,
              lng,
              placeId: place.place_id,
            }

            setSelectedLocation(newLocation)
            setMapCenter({ lat, lng })

            if (onLocationSelect) {
              onLocationSelect(newLocation)
            }
          } else {
            console.error("Error getting place details:", status)
          }
        }
      )
    } else {
      // Fallback to geocoding if PlacesService isn't available
      if (geocoderRef.current) {
        geocoderRef.current.geocode(
          { address: place.description },
          (results, status) => {
            if (status === "OK" && results && results[0] && results[0].geometry) {
              const lat = results[0].geometry.location.lat()
              const lng = results[0].geometry.location.lng()
              
              const newLocation = {
                address: place.description,
                lat,
                lng,
                placeId: place.place_id,
              }

              setSelectedLocation(newLocation)
              setMapCenter({ lat, lng })

              if (onLocationSelect) {
                onLocationSelect(newLocation)
              }
            } else {
              console.error("Geocoding failed:", status)
            }
          }
        )
      }
    }
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return

    const lat = e.latLng.lat()
    const lng = e.latLng.lng()

    // Use reverse geocoding to get the address
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const newLocation = {
              address: results[0].formatted_address || `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
              lat,
              lng,
              placeId: results[0].place_id,
            }

            setSelectedLocation(newLocation)
            setSearchValue(newLocation.address)

            if (onLocationSelect) {
              onLocationSelect(newLocation)
            }
          } else {
            // Fallback if geocoding fails
            const newLocation = {
              address: `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
              lat,
              lng,
            }

            setSelectedLocation(newLocation)
            setSearchValue(newLocation.address)

            if (onLocationSelect) {
              onLocationSelect(newLocation)
            }
          }
        }
      )
    } else {
      // Fallback if geocoder isn't available
      const newLocation = {
        address: `Selected location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
        lat,
        lng,
      }

      setSelectedLocation(newLocation)
      setSearchValue(newLocation.address)

      if (onLocationSelect) {
        onLocationSelect(newLocation)
      }
    }
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

  // Check if API key is missing
  const isApiKeyMissing = !apiKey || apiKey === "undefined" || apiKey === ""

  return (
    <div className="w-full space-y-4">
      {/* Hidden div for PlacesService initialization */}
      <div ref={mapDivRef} className="hidden"></div>
      
      <div className="relative" ref={searchInputRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search for a location..."
            className="pl-10 pr-4 py-2 rounded-xl border-gray-200 bg-white/90 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50"
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
          <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <ul className="py-1">
              {predictions.map((place) => (
                <li
                  key={place.place_id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePredictionSelect(place)}
                >
                  <div className="font-medium">
                    {place.structured_formatting?.main_text || place.description.split(",")[0]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {place.structured_formatting?.secondary_text || place.description.split(",").slice(1).join(",")}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="h-[400px] rounded-2xl overflow-hidden shadow-md border border-gray-100">
        {isApiKeyMissing ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
            <MapPin className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Google Maps API Key Required</h3>
            <p className="text-gray-500 mb-4 max-w-md">
              To use the map functionality, you need to add your Google Maps API key to the environment variables.
            </p>
            <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700 font-mono mb-4 max-w-md overflow-x-auto">
              VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
            </div>
            <p className="text-sm text-gray-500">
              Get your API key from the{" "}
              <a
                href="https://console.cloud.google.com/google/maps-apis/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>
        ) : (
          <APIProvider apiKey={apiKey}>
            <MapComponent 
              center={mapCenter} 
              onClick={handleMapClick} 
              selectedLocation={selectedLocation} 
              isLoaded={isLoaded} 
            />
          </APIProvider>
        )}
      </div>

      {selectedLocation && (
        <div className="p-4 bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
            <div>
              <h3 className="font-medium">Selected Location</h3>
              <p className="text-gray-600 text-sm">{selectedLocation.address}</p>
              <p className="text-gray-500 text-xs mt-1">
                Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Separate component for the map to handle Google Maps specific logic
function MapComponent({
  center,
  onClick,
  selectedLocation,
  isLoaded
}: {
  center: { lat: number; lng: number }
  onClick: (e: google.maps.MapMouseEvent) => void
  selectedLocation: { lat: number; lng: number } | null
  isLoaded: boolean
}) {
  const mapRef = useMap()

  useEffect(() => {
    if (mapRef && center) {
      mapRef.panTo(center)
    }
  }, [mapRef, center])

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
        <span className="ml-2 text-gray-500">Loading map...</span>
      </div>
    )
  }

  return (
    <Map
      mapId="location-selector-map"
      defaultCenter={center}
      defaultZoom={12}
      gestureHandling="greedy"
      disableDefaultUI={true}
      onClick={onClick}
      mapTypeId="roadmap"
      style={{ width: "100%", height: "100%" }}
    >
      {selectedLocation && (
        <AdvancedMarker position={selectedLocation}>
          <Pin background={"#3b82f6"} borderColor={"#2563eb"} glyphColor={"#ffffff"} scale={1.2} />
        </AdvancedMarker>
      )}
    </Map>
  )
}

export function MainLocationApp() {
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string
    lat: number
    lng: number
    placeId?: string
  } | null>(null)

  const handleLocationSelect = (location: {
    address: string
    lat: number
    lng: number
    placeId?: string
  }) => {
    setSelectedLocation(location)
    console.log("Selected location:", location)
  }

  return (
    <main className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Location Selector</h1>
      <p className="text-gray-600 mb-6">Search for a location or click on the map to select a specific point.</p>

      <LocationSelector onLocationSelect={handleLocationSelect} />

      {selectedLocation && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Selected Location Data</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(selectedLocation, null, 2)}
          </pre>
        </div>
      )}
    </main>
  )
}