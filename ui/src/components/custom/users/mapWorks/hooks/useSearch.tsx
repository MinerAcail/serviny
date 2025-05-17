import { useState, useRef, useCallback, useEffect } from "react"
import {  PointDeliveryInfo } from "../types"

interface UseSearchProps {
  isLoaded: boolean
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
  calculatePointDeliveryInfo: (point: [number, number]) => PointDeliveryInfo | null
  clearAllMarkersAndPopups: () => void
  createMarkerAtLocation: (lng: number, lat: number, pointInfo: PointDeliveryInfo) => void
}

interface Prediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface UseSearchReturn {
  searchValue: string
  predictions: Prediction[]
  isSearchLoading: boolean
  showPredictions: boolean
  searchInputRef: React.RefObject<HTMLInputElement>
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePredictionSelect: (place: Prediction) => void
  handleClearSearch: () => void
  setShowPredictions: React.Dispatch<React.SetStateAction<boolean>>
}

export const useSearch = ({
  isLoaded,
  mapInstance,
  calculatePointDeliveryInfo,
  clearAllMarkersAndPopups,
  createMarkerAtLocation
}: UseSearchProps): UseSearchReturn => {
  // Search state
  const [searchValue, setSearchValue] = useState("")
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [showPredictions, setShowPredictions] = useState(false)

  // Refs for Google Maps services
  const searchInputRef = useRef<HTMLInputElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const mapDivRef = useRef<HTMLDivElement | null>(null)

  // Initialize Google services when API is loaded
  useEffect(() => {
    if (!isLoaded) return

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
    geocoderRef.current = new google.maps.Geocoder()
    
    // Create a hidden div for PlacesService
    const serviceDiv = document.createElement("div")
    serviceDiv.style.display = "none"
    document.body.appendChild(serviceDiv)
    mapDivRef.current = serviceDiv
    
    placesServiceRef.current = new google.maps.places.PlacesService(serviceDiv)
    
    return () => {
      if (serviceDiv && document.body.contains(serviceDiv)) {
        document.body.removeChild(serviceDiv)
      }
    }
  }, [isLoaded])

  // Close predictions when clicking outside search input
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

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)

    if (value.length > 2 && autocompleteServiceRef.current) {
      setShowPredictions(true)
      fetchPredictions(value)
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }, [])

  // Fetch predictions from Google Places API
  const fetchPredictions = useCallback(async (input: string) => {
    if (!autocompleteServiceRef.current) return

    try {
      setIsSearchLoading(true)

      autocompleteServiceRef.current.getPlacePredictions({ input }, (predictions, status) => {
        setIsSearchLoading(false)

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
          }))
        )
      })
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setIsSearchLoading(false)
      setPredictions([])
    }
  }, [])

  // Handle prediction selection
  const handlePredictionSelect = useCallback(
    (place: Prediction) => {
      setSearchValue(place.description)
      setShowPredictions(false)

      if (!isLoaded) return

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

              // Clear previous markers and popups
              clearAllMarkersAndPopups()

              // Calculate delivery info
              const pointInfo = calculatePointDeliveryInfo([lng, lat])

              if (pointInfo) {
                // Create marker and show popup
                createMarkerAtLocation(lng, lat, pointInfo)

                // If the map is loaded, center on the location
                if (mapInstance.current) {
                  mapInstance.current.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    duration: 1000,
                  })
                }
              }
            } else {
              console.error("Error getting place details:", status)
            }
          }
        )
      } else if (geocoderRef.current) {
        // Fallback to geocoding if PlacesService isn't available
        geocoderRef.current.geocode({ address: place.description }, (results, status) => {
          if (status === "OK" && results && results[0] && results[0].geometry) {
            const lat = results[0].geometry.location.lat()
            const lng = results[0].geometry.location.lng()

            // Clear previous markers and popups
            clearAllMarkersAndPopups()

            // Calculate delivery info
            const pointInfo = calculatePointDeliveryInfo([lng, lat])

            if (pointInfo) {
              // Create marker and show popup
              createMarkerAtLocation(lng, lat, pointInfo)

              // If the map is loaded, center on the location
              if (mapInstance.current) {
                mapInstance.current.flyTo({
                  center: [lng, lat],
                  zoom: 14,
                  duration: 1000,
                })
              }
            }
          } else {
            console.error("Geocoding failed:", status)
          }
        })
      }
    },
    [
      isLoaded, 
      clearAllMarkersAndPopups, 
      calculatePointDeliveryInfo, 
      createMarkerAtLocation, 
      mapInstance
    ]
  )

  // Clear search input and selected location
  const handleClearSearch = useCallback(() => {
    setSearchValue("")
    clearAllMarkersAndPopups()
  }, [clearAllMarkersAndPopups])

  return {
    searchValue,
    predictions,
    isSearchLoading,
    showPredictions,
    searchInputRef,
    handleSearchChange,
    handlePredictionSelect,
    handleClearSearch,
    setShowPredictions
  }
}