import { useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import * as turf from "@turf/turf"
import { Coordinates, Location, TransportMode } from "../types"
import { SPEED_MAPPING } from "../constants"
import { removeRouteFromMap, addRouteToMap, fitMapToRoute } from "../utils/mapHelpers"

interface UseDirectionsProps {
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
  vendorLocation: Location | null
  transportMode: TransportMode
}

interface UseDirectionsReturn {
  showDirections: boolean
  directionsDistance: number | null
  directionsTime: string | null
  clearDirections: () => void
  createDirectRoute: (destination: Coordinates) => void
  handleShowDirectionsClick: (destination: Coordinates) => void
  setShowDirections: React.Dispatch<React.SetStateAction<boolean>>
}

export const useDirections = ({
  mapInstance,
  vendorLocation,
  transportMode
}: UseDirectionsProps): UseDirectionsReturn => {
  // Directions state
  const [showDirections, setShowDirections] = useState(false)
  const [directionsDistance, setDirectionsDistance] = useState<number | null>(null)
  const [directionsTime, setDirectionsTime] = useState<string | null>(null)
//   const [isLoadingDirections, setIsLoadingDirections] = useState(false)
//   const [directionsError, setDirectionsError] = useState<string | null>(null)

  // Clear directions from map
  const clearDirections = useCallback(() => {
    if (!mapInstance.current) return

    removeRouteFromMap(mapInstance.current)
    
    setShowDirections(false)
    setDirectionsDistance(null)
    setDirectionsTime(null)
    // setDirectionsError(null)
  }, [mapInstance])

  // Get route from OpenRouteService API
  const getRouteFromOpenRouteService = useCallback(
    async (destination: Coordinates) => {
      if (!mapInstance.current || !vendorLocation) return

      const map = mapInstance.current
    //   setIsLoadingDirections(true)
    //   setDirectionsError(null)

      try {
        // OpenRouteService API key - in a real app, use environment variables
        const orsApiKey = "5b3ce3597851110001cf6248a1e25ab0a5614c3c81f36aad59a33c7a"

        // Determine the profile based on transport mode
        let orsProfile
        switch (transportMode) {
          case "walking":
            orsProfile = "foot-walking"
            break
          case "bike":
            orsProfile = "cycling-regular"
            break
          case "motorbike":
          case "car":
            orsProfile = "driving-car"
            break
          default:
            orsProfile = "driving-car"
        }

        // Format coordinates for ORS API
        const coordinates = [
          [vendorLocation.lng, vendorLocation.lat],
          [destination.lng, destination.lat],
        ]

        // Call the OpenRouteService API
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/${orsProfile}/geojson`, {
          method: "POST",
          headers: {
            Authorization: orsApiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            coordinates: coordinates,
            format: "geojson",
          }),
        })

        if (!response.ok) {
          throw new Error(`OpenRouteService API error: ${response.status}`)
        }

        const routeData = await response.json()

        if (!routeData.features || routeData.features.length === 0) {
          throw new Error("No route found")
        }

        // Extract route information
        const route = routeData.features[0]
        const routeProperties = route.properties

        // Get distance and duration
        const distance = routeProperties.summary.distance / 1000 // Convert to km
        const duration = Math.round(routeProperties.summary.duration / 60) // Convert to minutes

        setDirectionsDistance(distance)
        setDirectionsTime(`${duration} min`)

        // Add the route to the map
        addRouteToMap(map, route, false)

        // Fit map to route
        fitMapToRoute(map, route.geometry.coordinates)

        setShowDirections(true)
      } catch (error) {
        console.error("Error fetching route:", error)
        // setDirectionsError("Failed to fetch route. Using direct line instead.")

        // Fallback to direct line
        createDirectFallbackRoute(destination)
      } finally {
        // setIsLoadingDirections(false)
      }
    },
    [vendorLocation, transportMode]
  )

  // Create a direct (straight line) route fallback
  const createDirectFallbackRoute = useCallback(
    (destination: Coordinates) => {
      if (!mapInstance.current || !vendorLocation) return

      const map = mapInstance.current

      // Create a GeoJSON LineString
      const route = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [vendorLocation.lng, vendorLocation.lat],
            [destination.lng, destination.lat],
          ],
        },
      }

      // Calculate straight-line distance
      const distance = turf.distance(
        turf.point([vendorLocation.lng, vendorLocation.lat]),
        turf.point([destination.lng, destination.lat]),
        { units: "kilometers" },
      )

      setDirectionsDistance(distance)

      // Calculate estimated time
      const timeInMinutes = Math.round((distance / SPEED_MAPPING[transportMode]) * 60)
      setDirectionsTime(`${timeInMinutes} min (estimated)`)

      // Add the route to the map
      addRouteToMap(map, route, true) // true for dashed line
      
      // Fit map bounds to route
      fitMapToRoute(map, route.geometry.coordinates)

      setShowDirections(true)
    },
    [vendorLocation, transportMode, mapInstance]
  )

  // Create route between vendor and destination point
  const createDirectRoute = useCallback(
    (destination: Coordinates) => {
      if (vendorLocation) {
        getRouteFromOpenRouteService(destination)
      }
    },
    [vendorLocation, getRouteFromOpenRouteService]
  )

  // Handle showing directions for clicked point
  const handleShowDirectionsClick = useCallback(
    (destination: Coordinates) => {
      if (destination && vendorLocation) {
        clearDirections()
        createDirectRoute(destination)
      }
    },
    [vendorLocation, clearDirections, createDirectRoute]
  )

  return {
    showDirections,
    directionsDistance,
    directionsTime,
    clearDirections,
    createDirectRoute,
    handleShowDirectionsClick,
    setShowDirections
  }
}