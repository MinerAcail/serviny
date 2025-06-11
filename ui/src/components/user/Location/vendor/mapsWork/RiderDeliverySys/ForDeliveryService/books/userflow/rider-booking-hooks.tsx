"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import * as turf from "@turf/turf"
import { ZONE_COLORS } from "@/components/config/map"
// import { google } from "googlemaps"

// ==========================================
// Types
// ==========================================

export interface PricingZone {
  id: string
  riderId: string
  startKm: number
  endKm: number
  price: number
  updatedAt?: string
}

export interface RiderProfile {
  id: string
  name: string
  email: string
  dpfile?: string
  availability?: boolean
  coordinates?: number[]
  experience?: string
  phone?: string
  vehicleType?: string
  rating?: number
  isOnline?: boolean
}

export interface Location {
  lng: number
  lat: number
  address: string
}

export interface DeliveryCalculation {
  distance: number
  duration: string
  matchedZone: PricingZone | null
  totalPrice: number
  pickupLocation: Location
  dropoffLocation: Location
}

// ==========================================
// 1. useRiderZones Hook - MOCK DATA VERSION
// ==========================================

export function useRiderZones(riderId: string | undefined) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [riderZones, setRiderZones] = useState<PricingZone[]>([])
  const [riderProfile, setRiderProfile] = useState<RiderProfile | undefined>(undefined)
  const [isCreatingRequest, setIsCreatingRequest] = useState(false)

  // Fetch rider data (mock)
  useEffect(() => {
    if (!riderId) {
      setError("No rider ID provided")
      setIsLoading(false)
      return
    }

    // Simulate API call
    const timer = setTimeout(() => {
      // Mock rider profile
      setRiderProfile({
        id: riderId,
        name: "John Rider",
        email: "john@example.com",
        dpfile: "/placeholder.svg?height=100&width=100",
        experience: "3+ years",
        phone: "+233 20 123 4567",
        rating: 4.8,
        isOnline: true,
      })

      // Mock pricing zones
      setRiderZones([
        { id: "zone1", riderId, startKm: 0, endKm: 2, price: 5.0 },
        { id: "zone2", riderId, startKm: 2, endKm: 5, price: 8.5 },
        { id: "zone3", riderId, startKm: 5, endKm: 10, price: 12.0 },
        { id: "zone4", riderId, startKm: 10, endKm: 15, price: 18.0 },
        { id: "zone5", riderId, startKm: 15, endKm: 25, price: 25.0 },
      ])

      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [riderId])

  // Create delivery request (mock)
  const createDeliveryRequest = useCallback(async (input: any) => {
    setIsCreatingRequest(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate random reference
      const reference = `DEL-${Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0")}`

      toast.success("Delivery request created successfully!", {
        description: `Reference: ${reference}`,
        duration: 5000,
      })

      return {
        id: `req-${Math.random().toString(36).substring(2, 9)}`,
        riderId: input.riderId,
        reference,
        status: "pending",
        totalPrice: input.totalPrice,
      }
    } catch (error) {
      console.error("Create delivery request error:", error)
      toast.error("Failed to create delivery request")
      throw error
    } finally {
      setIsCreatingRequest(false)
    }
  }, [])

  return {
    riderZones,
    riderProfile,
    isLoading,
    error,
    createDeliveryRequest,
    isCreatingRequest,
  }
}

// ==========================================
// 2. useDeliveryCalculation Hook
// ==========================================

export function useDeliveryCalculation() {
  const [calculation, setCalculation] = useState<DeliveryCalculation | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastCalculationParamsRef = useRef<string | null>(null)

  const calculateDelivery = useCallback(
    async (pickup: Location, dropoff: Location, zones: PricingZone[]) => {
      if (!pickup || !dropoff || !zones.length) {
        setError("Missing required data for calculation")
        return null
      }

      // Create unique key for these calculation parameters
      const paramsKey = `${pickup.lat}-${pickup.lng}-${dropoff.lat}-${dropoff.lng}-${zones.length}-${zones.map((z) => `${z.id}-${z.price}`).join(",")}`

      // Skip if we already calculated for these exact parameters
      if (lastCalculationParamsRef.current === paramsKey) {
        console.log("⏭️ Skipping duplicate calculation - same parameters")
        return calculation
      }

      setIsCalculating(true)
      setError(null)
      lastCalculationParamsRef.current = paramsKey

      try {
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Calculate distance FROM pickup location (zone center) TO dropoff location
        const from = turf.point([pickup.lng, pickup.lat]) // Pickup is the center
        const to = turf.point([dropoff.lng, dropoff.lat]) // Dropoff is the destination
        const distance = turf.distance(from, to, { units: "kilometers" })

        console.log(`💰 Calculating delivery: ${distance.toFixed(2)}km from pickup (zone center) to dropoff`)

        // Find matching pricing zone based on distance from pickup
        const matchedZone =
          zones.find((zone) => distance >= zone.startKm && distance < zone.endKm) || zones[zones.length - 1]

        if (!matchedZone) {
          setError("No pricing zone found for this distance")
          return null
        }

        // Calculate duration
        const averageSpeed = 25 // km/h
        const durationMinutes = Math.round((distance / averageSpeed) * 60)
        const duration =
          durationMinutes < 60
            ? `${durationMinutes} min`
            : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`

        const result: DeliveryCalculation = {
          distance: Number(distance.toFixed(2)),
          duration,
          matchedZone,
          totalPrice: matchedZone.price,
          pickupLocation: pickup, // This is the zone center
          dropoffLocation: dropoff, // This is the destination
        }

        setCalculation(result)

        toast.success("Delivery calculated!", {
          description: `${result.distance}km from pickup center → ${result.totalPrice.toFixed(2)}`,
          duration: 3000,
        })

        return result
      } catch (error) {
        console.error("Delivery calculation error:", error)
        setError("Failed to calculate delivery details")
        lastCalculationParamsRef.current = null // Reset on error
        return null
      } finally {
        setIsCalculating(false)
      }
    },
    [calculation],
  )

  const clearCalculation = useCallback(() => {
    setCalculation(null)
    setError(null)
    lastCalculationParamsRef.current = null
  }, [])

  return {
    calculation,
    isCalculating,
    error,
    calculateDelivery,
    clearCalculation,
  }
}

// ==========================================
// 3. useSimpleLocationManager Hook
// ==========================================

export function useSimpleLocationManager() {
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null)
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null)

  const updatePickupLocation = useCallback((location: Location | null) => {
    console.log("📍 Setting pickup location:", location?.address || "null")
    setPickupLocation(location)
  }, [])

  const updateDropoffLocation = useCallback((location: Location | null) => {
    console.log("🎯 Setting dropoff location:", location?.address || "null")
    setDropoffLocation(location)
  }, [])

  const clearAllLocations = useCallback(() => {
    console.log("🗑️ Clearing all locations")
    setPickupLocation(null)
    setDropoffLocation(null)
  }, [])

  return {
    pickupLocation,
    dropoffLocation,
    updatePickupLocation,
    updateDropoffLocation,
    clearAllLocations,
  }
}

// ==========================================
// 4. useSimpleMapManager Hook
// ==========================================

export function useSimpleMapManager() {
  const mapInstance = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [pickupMarker, setPickupMarker] = useState<any | null>(null)
  const [dropoffMarker, setDropoffMarker] = useState<any | null>(null)

  // Initialize map only when pickup is set  setDropoffMarker] = useState<any | null>(null)

  // Initialize map only when pickup is set
  const initializeMapWithPickup = useCallback(
    (container: HTMLDivElement, pickupLocation: Location, maptilerApiKey?: string) => {
      console.log("🗺️ Initializing map centered on pickup:", pickupLocation.address)

      // Clean up existing map
      if (mapInstance.current) {
        console.log("🗑️ Removing existing map instance")
        mapInstance.current.remove()
        mapInstance.current = null
        setMapLoaded(false)
      }

      try {
        // We'll use a dynamic import for maplibre-gl to avoid SSR issues
        import("maplibre-gl")
          .then((maplibregl) => {
            let mapStyle

            if (maptilerApiKey) {
              mapStyle = `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerApiKey}`
            } else {
              mapStyle = {
                version: 8,
                name: "Basic",
                sources: {
                  osm: {
                    type: "raster",
                    tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                    tileSize: 256,
                    attribution: "© OpenStreetMap contributors",
                  },
                },
                layers: [{ id: "osm", type: "raster", source: "osm" }],
              }
            }

            // ALWAYS center on pickup location
            const initialCenter: [number, number] = [pickupLocation.lng, pickupLocation.lat]
            const initialZoom = 13

            console.log("🎯 Initializing map with PICKUP center:", initialCenter)

            const map = new maplibregl.default.Map({
              container,
              style: mapStyle,
              center: initialCenter,
              zoom: initialZoom,
              attributionControl: true,
              maxZoom: 18,
              minZoom: 2,
            })

            mapInstance.current = map

            map.on("load", () => {
              console.log("✅ Map loaded successfully centered on pickup:", initialCenter)
              setMapLoaded(true)
              setMapInitialized(true)
            })

            map.on("error", (e: any) => {
              console.error("❌ Map error:", e)
            })

            // Add navigation controls
            map.addControl(new maplibregl.default.NavigationControl(), "top-right")
            map.addControl(new maplibregl.default.FullscreenControl(), "top-left")
          })
          .catch((error) => {
            console.error("Failed to load maplibre-gl:", error)
          })
      } catch (error) {
        console.error("❌ Failed to initialize map:", error)
        setMapLoaded(false)
      }
    },
    [],
  )

  // Create markers
  const createMarker = useCallback(
    (location: Location, type: "pickup" | "dropoff") => {
      if (!mapInstance.current || !mapLoaded) return null

      const isPickup = type === "pickup"
      const color = isPickup ? "#22c55e" : "#ef4444"
      const icon = isPickup ? "📍" : "🎯"
      const title = isPickup ? "Pickup Location (Zone Center)" : "Drop-off Location"

      try {
        // We need to dynamically import maplibre-gl
        import("maplibre-gl")
          .then((maplibregl) => {
            const marker = new maplibregl.default.Marker({
              color,
              scale: 1.2,
            })
              .setLngLat([location.lng, location.lat])
              .setPopup(
                new maplibregl.default.Popup({ offset: 25 }).setHTML(`
                <div style="padding: 8px; font-family: system-ui;">
                  <strong style="color: ${color};">${icon} ${title}</strong><br/>
                  <small style="color: #666;">${location.address}</small>
                  ${isPickup ? '<br/><small style="color: #22c55e; font-weight: 500;">🎯 All zones center here</small>' : ""}
                </div>
              `),
              )
              .addTo(mapInstance.current)

            console.log(`✅ Created ${type} marker:`, location.address)

            if (isPickup) {
              setPickupMarker(marker)
            } else {
              setDropoffMarker(marker)
            }

            return marker
          })
          .catch((error) => {
            console.error(`Failed to load maplibre-gl for marker:`, error)
            return null
          })
      } catch (error) {
        console.error(`❌ Error creating ${type} marker:`, error)
        return null
      }
    },
    [mapLoaded],
  )

  // Update markers
  const updateMarkers = useCallback(
    (pickup?: Location | null, dropoff?: Location | null) => {
      if (!mapInstance.current || !mapLoaded) {
        console.log("⏳ Cannot update markers: map not ready")
        return
      }

      console.log("📍 Updating markers:", { pickup: !!pickup, dropoff: !!dropoff })

      // Clear existing markers
      if (pickupMarker) {
        pickupMarker.remove()
        setPickupMarker(null)
      }
      if (dropoffMarker) {
        dropoffMarker.remove()
        setDropoffMarker(null)
      }

      // Create new markers
      if (pickup) {
        createMarker(pickup, "pickup")
      }

      if (dropoff) {
        createMarker(dropoff, "dropoff")
      }
    },
    [mapLoaded, createMarker, pickupMarker, dropoffMarker],
  )

  // Draw coverage zones around pickup
  const drawCoverageZones = useCallback(
    (pickupLocation: Location, riderZones: PricingZone[]) => {
      if (!mapInstance.current || !mapLoaded || !riderZones.length) return

      console.log("🟢 Drawing coverage zones centered on pickup:", pickupLocation.address)

      const map = mapInstance.current
      const centerPoint: [number, number] = [pickupLocation.lng, pickupLocation.lat]

      try {
        // Clear existing zones - PROPER ORDER: layers first, then sources
        for (let i = 0; i < 10; i++) {
          const fillId = `zone-${i}`
          const outlineId = `zone-outline-${i}`

          // Remove layers first
          if (map.getLayer(fillId)) map.removeLayer(fillId)
          if (map.getLayer(outlineId)) map.removeLayer(outlineId)
        }

        // Remove center marker layer
        if (map.getLayer("pickup-center")) map.removeLayer("pickup-center")

        // Now remove sources
        for (let i = 0; i < 10; i++) {
          const fillId = `zone-${i}`
          if (map.getSource(fillId)) map.removeSource(fillId)
        }

        // Remove center marker source
        if (map.getSource("pickup-center")) map.removeSource("pickup-center")


        // Draw zones from largest to smallest
        const sortedZones = [...riderZones].sort((a, b) => b.endKm - a.endKm)

        sortedZones.forEach((zone, index) => {
          try {
            const outerCircle = turf.circle(centerPoint, zone.endKm, {
              units: "kilometers",
              steps: 64,
            })

            let zonePolygon = outerCircle

            if (zone.startKm > 0) {
              const innerCircle = turf.circle(centerPoint, zone.startKm, {
                units: "kilometers",
                steps: 64,
              })

              try {
                const difference = turf.difference(
                  turf.feature(outerCircle.geometry),
                  turf.feature(innerCircle.geometry),
                )
                if (difference) zonePolygon = difference
              } catch {
                // Use full circle if difference fails
              }
            }

            const layerId = `zone-${index}`
            const outlineId = `zone-outline-${index}`
            const color = ZONE_COLORS[index % ZONE_COLORS.length]

            map.addSource(layerId, {
              type: "geojson",
              data: zonePolygon,
            })

            map.addLayer({
              id: layerId,
              type: "fill",
              source: layerId,
              paint: {
                "fill-color": color,
                "fill-opacity": 0.3,
              },
            })

            map.addLayer({
              id: outlineId,
              type: "line",
              source: layerId,
              paint: {
                "line-color": color,
                "line-width": 2,
                "line-opacity": 0.8,
              },
            })

            console.log(`✅ Zone ${index + 1}: ${zone.startKm}-${zone.endKm}km, $${zone.price}`)
          } catch (error) {
            console.error(`❌ Error creating zone ${index}:`, error)
          }
        })

        // Add center marker
        const centerMarkerId = "pickup-center"

        map.addSource(centerMarkerId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: centerPoint,
            },
          },
        })

        map.addLayer({
          id: centerMarkerId,
          type: "circle",
          source: centerMarkerId,
          paint: {
            "circle-radius": 8,
            "circle-color": "#22c55e",
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        })

        console.log("✅ Coverage zones drawn successfully")
      } catch (error) {
        console.error("❌ Error drawing coverage zones:", error)
      }
    },
    [mapLoaded],
  )

  // Draw route
  const drawRoute = useCallback(
    (pickup: Location, dropoff: Location) => {
      if (!mapInstance.current || !mapLoaded) return

      console.log("🛣️ Drawing route from pickup to dropoff")

      const map = mapInstance.current

      try {
        // Clear existing route
        if (map.getLayer("route")) map.removeLayer("route")
        if (map.getSource("route")) map.removeSource("route")

        const routeData = {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [pickup.lng, pickup.lat],
              [dropoff.lng, dropoff.lat],
            ],
          },
        }

        map.addSource("route", {
          type: "geojson",
          data: routeData,
        })

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3b82f6",
            "line-width": 4,
            "line-opacity": 0.8,
          },
        })

        console.log("✅ Route drawn successfully")
      } catch (error) {
        console.error("❌ Error drawing route:", error)
      }
    },
    [mapLoaded],
  )

  // Fit map to show both markers
  const fitMapToMarkers = useCallback(() => {
    if (!mapInstance.current || !mapLoaded) return

    try {
      import("maplibre-gl")
        .then((maplibregl) => {
          const coordinates = []
          if (pickupMarker) coordinates.push(pickupMarker.getLngLat())
          if (dropoffMarker) coordinates.push(dropoffMarker.getLngLat())

          if (coordinates.length === 0) return

          if (coordinates.length === 1) {
            // Only pickup - already centered
            return
          } else {
            // Both pickup and dropoff - fit to show both
            const bounds = new maplibregl.default.LngLatBounds()
            coordinates.forEach((coord) => bounds.extend(coord))

            mapInstance.current.fitBounds(bounds, {
              padding: 80,
              duration: 1000,
              maxZoom: 15,
            })

            console.log("✅ Map fitted to show both locations")
          }
        })
        .catch((error) => {
          console.error("Failed to load maplibre-gl for fitting map:", error)
        })
    } catch (error) {
      console.error("❌ Error fitting map:", error)
    }
  }, [mapLoaded, pickupMarker, dropoffMarker])

  // Clear everything
  const clearMap = useCallback(() => {
    if (!mapInstance.current) return

    try {
      // Clear markers
      if (pickupMarker) pickupMarker.remove()
      if (dropoffMarker) dropoffMarker.remove()

      setPickupMarker(null)
      setDropoffMarker(null)

      console.log("✅ Map cleared")
    } catch (error) {
      console.error("❌ Error clearing map:", error)
    }
  }, [pickupMarker, dropoffMarker])

  // Cleanup
  useEffect(() => {
    return () => {
      try {
        if (pickupMarker) pickupMarker.remove()
        if (dropoffMarker) dropoffMarker.remove()
        if (mapInstance.current) {
          mapInstance.current.remove()
          mapInstance.current = null
        }
      } catch (error) {
        console.warn("Cleanup error:", error)
      }
      setMapLoaded(false)
      setMapInitialized(false)
    }
  }, [])

  return {
    mapInstance,
    mapLoaded,
    mapInitialized,
    pickupMarker,
    dropoffMarker,
    initializeMapWithPickup,
    updateMarkers,
    drawCoverageZones,
    drawRoute,
    fitMapToMarkers,
    clearMap,
  }
}

// ==========================================
// 5. useLocationAutocomplete Hook
// ==========================================

export function useLocationAutocomplete(
  autocompleteService: google.maps.places.AutocompleteService | null,
  placesService: google.maps.places.PlacesService | null,
) {
  const [pickupPredictions, setPickupPredictions] = useState<any[]>([])
  const [dropoffPredictions, setDropoffPredictions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Search for pickup locations
  const searchPickupLocations = useCallback(
    async (query: string) => {
      if (!autocompleteService || query.length < 3) {
        setPickupPredictions([])
        return
      }

      setIsSearching(true)

      try {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "gh" }, // Restrict to Ghana
          },
          (results, status) => {
            setIsSearching(false)

            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
              setPickupPredictions([])
              return
            }

            const formattedResults = results.map((result) => ({
              description: result.description,
              place_id: result.place_id,
              structured_formatting: {
                main_text: result.structured_formatting?.main_text || result.description,
                secondary_text: result.structured_formatting?.secondary_text || "",
              },
            }))

            setPickupPredictions(formattedResults)
          },
        )
      } catch (error) {
        console.error("Pickup search error:", error)
        setIsSearching(false)
        setPickupPredictions([])
      }
    },
    [autocompleteService],
  )

  // Search for dropoff locations
  const searchDropoffLocations = useCallback(
    async (query: string) => {
      if (!autocompleteService || query.length < 3) {
        setDropoffPredictions([])
        return
      }

      setIsSearching(true)

      try {
        autocompleteService.getPlacePredictions(
          {
            input: query,
            types: ["establishment", "geocode"],
            componentRestrictions: { country: "gh" }, // Restrict to Ghana
          },
          (results, status) => {
            setIsSearching(false)

            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
              setDropoffPredictions([])
              return
            }

            const formattedResults = results.map((result) => ({
              description: result.description,
              place_id: result.place_id,
              structured_formatting: {
                main_text: result.structured_formatting?.main_text || result.description,
                secondary_text: result.structured_formatting?.secondary_text || "",
              },
            }))

            setDropoffPredictions(formattedResults)
          },
        )
      } catch (error) {
        console.error("Dropoff search error:", error)
        setIsSearching(false)
        setDropoffPredictions([])
      }
    },
    [autocompleteService],
  )

  // Get location details from place ID
  const getLocationFromPlaceId = useCallback(
    async (placeId: string): Promise<Location | null> => {
      if (!placesService) {
        console.error("Places service not available")
        return null
      }

      return new Promise((resolve) => {
        placesService.getDetails(
          {
            placeId,
            fields: ["geometry", "formatted_address", "name"],
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
              const address = result.formatted_address || result.name || ""

              console.log("✅ Location details retrieved:", address)

              resolve({
                lat,
                lng,
                address,
              })
            } else {
              console.error("Failed to get location details:", status)
              resolve(null)
            }
          },
        )
      })
    },
    [placesService],
  )

  // Clear predictions
  const clearPickupPredictions = useCallback(() => {
    setPickupPredictions([])
  }, [])

  const clearDropoffPredictions = useCallback(() => {
    setDropoffPredictions([])
  }, [])

  return {
    // Predictions
    pickupPredictions,
    dropoffPredictions,
    isSearching,

    // Search functions
    searchPickupLocations,
    searchDropoffLocations,

    // Get location details
    getLocationFromPlaceId,

    // Clear functions
    clearPickupPredictions,
    clearDropoffPredictions,
  }
}
