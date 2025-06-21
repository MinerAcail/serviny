"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Plus, Minus, X, Trash2, ChevronDown, ChevronLeft, Edit3, Share, Download } from "lucide-react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { gql, useQuery, useMutation } from "@apollo/client"
import { useParams } from "react-router"
import { useAuth } from "@/middleware/context/authContext"
import { cn } from "@/lib/utils"

export const GET_PROVIDER = gql`
  query getProvider($serviceId: String!) {
    getProvider(ServiceId: $serviceId) {
      id
      dpfile
      name  
      number
      email
      profession
      categories
      aboutMe
      location
      createdAt
      businessType
      coordinates
    }
  }
`

export const GENERATE_ISOCHRONE = gql`
  mutation GenerateIsochrone($input: IsochroneInput!) {
    generateIsochrone(input: $input) {
      geojson
      id
      locations
      range
      metaData {
        zone
        id
        price
        duration
        distance
      }
    }
  }
`

// Types based on your existing code
type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"

interface DeliveryZoneCreatorProps {
  vendor: Location
  riderId: string
  onSave?: (data: any) => void
  maptilerApiKey?: string
}

// Map state interface for better state management
interface MapState {
  map: maplibregl.Map | null
  isInitialized: boolean
  isStyleLoaded: boolean
  container: HTMLDivElement | null
}

// Conversion speeds in km/h (same as your backend)
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60
}

// Map initialization function similar to the UserServiceViewer pattern
function initializeMap(
  state: MapState,
  container: HTMLDivElement,
  maptilerApiKey: string,
  vendor: Location,
  onLoad: () => void
): void {
  if (state.isInitialized) {
    console.warn("⚠️ Map already initialized")
    return
  }

  console.log("🗺️ Starting delivery zone map initialization...")
  console.log("📍 Container:", container)
  console.log("🔑 API Key:", maptilerApiKey ? "Provided" : "Using demo tiles")
  console.log("📍 Vendor location:", vendor)

  const mapStyle = maptilerApiKey
    ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
    : "https://demotiles.maplibre.org/style.json"

  console.log("🎨 Map style URL:", mapStyle)

  try {
    state.map = new maplibregl.Map({
      container,
      style: mapStyle,
      center: [vendor.lng, vendor.lat],
      zoom: 12,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 8,
    })

    console.log("✅ Map instance created successfully")

    // Set up event listeners
    state.map.on("load", () => {
      console.log("🎯 Map loaded successfully!")
      state.isInitialized = true
      onLoad()
    })

    state.map.on("style.load", () => {
      console.log("🎨 Map style loaded successfully!")
      state.isStyleLoaded = true
      
      // Add vendor marker after style is loaded
      if (state.map) {
        addVendorMarker(state.map, vendor)
      }
    })

    state.map.on("error", (e) => {
      console.error("❌ Map error:", e)
      console.error("Error details:", e.error)
    })

    state.map.on("styledata", () => {
      console.log("🎨 Map style data loaded")
    })

    state.map.on("sourcedata", (e) => {
      if (e.isSourceLoaded) {
        console.log("📊 Map source loaded:", e.sourceId)
      }
    })

    // Force a resize after a short delay to ensure proper rendering
    setTimeout(() => {
      if (state.map) {
        state.map.resize()
        console.log("📐 Map resized")
      }
    }, 100)

  } catch (error) {
    console.error("💥 Failed to initialize map:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    
    // Try to fallback to demo tiles if using custom tiles failed
    if (maptilerApiKey && mapStyle.includes('maptiler.com')) {
      console.log("🔄 Falling back to demo tiles...")
      setTimeout(() => {
        initializeMap(state, container, "", vendor, onLoad)
      }, 1000)
    } else {
      // Force callback after error to show UI
      setTimeout(() => {
        console.log("🔄 Force calling onLoad after error")
        onLoad()
      }, 3000)
    }
  }
}

// Add vendor marker function
function addVendorMarker(map: maplibregl.Map, vendor: Location): void {
  try {
    const markerElement = document.createElement("div")
    markerElement.className =
      "w-8 h-8 bg-[#007aff] rounded-full border-4 border-white shadow-lg flex items-center justify-center"
    markerElement.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>'

    new maplibregl.Marker({ element: markerElement })
      .setLngLat([vendor.lng, vendor.lat])
      .setPopup(
        new maplibregl.Popup({
          offset: 25,
          className: "ios-popup",
        }).setHTML(`
          <div class="p-2">
            <div class="font-semibold text-[#1d1d1f]">${vendor.address}</div>
            <div class="text-xs text-[#86868b] mt-1">Vendor Location</div>
          </div>
        `),
      )
      .addTo(map)
    
    console.log("📍 Vendor marker added successfully")
  } catch (error) {
    console.error("❌ Failed to add vendor marker:", error)
  }
}

// Update map with isochrones function
function updateMapWithIsochrones(
  state: MapState,
  isochrones: any[],
  vendor: Location,
  ranges: any[]
): void {
  if (!state.map || !state.isStyleLoaded || !isochrones.length) {
    console.log("⏳ Map not ready for isochrone update", {
      map: !!state.map,
      styleLoaded: state.isStyleLoaded,
      isochrones: isochrones.length
    })
    return
  }

  const map = state.map

  try {
    // Remove existing isochrone layers if they exist
    if (map.getSource("isochrones")) {
      const layersToRemove = ["isochrone-fill", "isochrone-outline"]
      layersToRemove.forEach((layer) => {
        if (map.getLayer(layer)) {
          map.removeLayer(layer)
        }
      })
      map.removeSource("isochrones")
    }

    // Create GeoJSON collection from isochrones
    const geojsonData = {
      type: "FeatureCollection",
      features: isochrones.map((iso, index) => ({
        ...iso.geojson,
        properties: {
          ...iso.geojson.properties,
          zone: index + 1,
          color: iso.color,
        }
      })),
    }

    map.addSource("isochrones", {
      type: "geojson",
      data: geojsonData,
    })

    // Add fill layer
    map.addLayer({
      id: "isochrone-fill",
      type: "fill",
      source: "isochrones",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.25,
      },
    })

    // Add outline layer
    map.addLayer({
      id: "isochrone-outline",
      type: "line",
      source: "isochrones",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 3,
        "line-opacity": 0.8,
      },
    })

    // Fit bounds to show all isochrones
    if (isochrones.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([vendor.lng, vendor.lat])

      const maxDistance = Math.max(...ranges.map((r) => r.distance))
      const latOffset = maxDistance / 111
      const lngOffset = maxDistance / (111 * Math.cos((vendor.lat * Math.PI) / 180))

      bounds.extend([vendor.lng - lngOffset, vendor.lat - latOffset])
      bounds.extend([vendor.lng + lngOffset, vendor.lat + latOffset])

      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 1500,
      })
    }

    console.log("✅ Isochrones updated successfully")
  } catch (error) {
    console.error("❌ Failed to update isochrones:", error)
  }
}

// Cleanup function
function destroyMap(state: MapState): void {
  if (state.map) {
    console.log("🧹 Cleaning up map...")
    state.map.remove()
    state.map = null
    state.isInitialized = false
    state.isStyleLoaded = false
  }
}

//
export function MainDeliveryZoneCreator({serviceId}: {serviceId: string}) {
  const { user } = useAuth()
  const riderId = user?.id
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY

  const { data, loading, error } = useQuery(GET_PROVIDER, {
    variables: { serviceId },
  })

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full border-3 border-[#007aff] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#1d1d1f] font-medium">Loading vendor information...</p>
          <p className="text-xs text-[#86868b]">Please wait while we fetch your details</p>
        </div>
      </div>
    )

  if (error)
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-sm border border-[#ff3b30]/20 p-6 text-center">
          <div className="w-12 h-12 bg-[#ff3b30]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-[#ff3b30]" />
          </div>
          <h3 className="font-semibold text-[#1d1d1f] mb-2">Unable to Load Vendor</h3>
          <p className="text-[#ff3b30] text-sm">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#007aff] text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )

  const provider = data.getProvider

  // Handle provider coordinates
  let lat = 0,
    lng = 0
  if (Array.isArray(provider.coordinates) && provider.coordinates.length === 2) {
    ;[lng, lat] = provider.coordinates
  } else if (provider.coordinates && typeof provider.coordinates === "object") {
    lat = provider.coordinates.lat ?? 0
    lng = provider.coordinates.lng ?? 0
  }

  const vendor = {
    address: provider.location || "Unknown address",
    lat,
    lng,
    placeId: provider.id || "vendor_unknown",
  }

  const handleSave = (data: any) => {
    // Show iOS-style success alert
    const alertDiv = document.createElement("div")
    alertDiv.className =
      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#34c759] text-white px-6 py-3 rounded-2xl shadow-lg z-50 font-medium text-sm"
    alertDiv.textContent = "Delivery zones saved successfully!"
    document.body.appendChild(alertDiv)

    setTimeout(() => {
      alertDiv.remove()
    }, 3000)

    console.log("Delivery zones saved:", data)
  }

  return (
    <DeliveryZoneCreator
      vendor={vendor}
      riderId={riderId || "unknown_rider"}
      onSave={handleSave}
      maptilerApiKey={maptilerApiKey}
    />
  )
}

export function DeliveryZoneCreator({ vendor, riderId, onSave, maptilerApiKey }: DeliveryZoneCreatorProps) {
  const [step, setStep] = useState<"setup" | "zones" | "review" | "success">("setup")
  const [ranges, setRanges] = useState<any[]>([])
  const [currentRange, setCurrentRange] = useState(3)
  const [currentPrice, setCurrentPrice] = useState(5.0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isochrones, setIsochrones] = useState<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [transportMode, setTransportMode] = useState<TransportMode>("car")
  const [error, setError] = useState<string | null>(null)
  const [showZoneDetails, setShowZoneDetails] = useState(false)
  const [editingZone, setEditingZone] = useState<number | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [generatedData, setGeneratedData] = useState<any>(null)

  // Map state using similar pattern to UserServiceViewer
  const mapStateRef = useRef<MapState>({
    map: null,
    isInitialized: false,
    isStyleLoaded: false,
    container: null
  })
  const [setupMapContainer, setSetupMapContainer] = useState<HTMLDivElement | null>(null)
  const [reviewMapContainer, setReviewMapContainer] = useState<HTMLDivElement | null>(null)

  // Callback refs for different steps
  const setupMapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log("📍 Setup map container is now available:", node)
      setSetupMapContainer(node)
    } else {
      console.log("📍 Setup map container removed")
      setSetupMapContainer(null)
    }
  }, [])

  const reviewMapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log("📍 Review map container is now available:", node)
      setReviewMapContainer(node)
    } else {
      console.log("📍 Review map container removed")
      setReviewMapContainer(null)
    }
  }, [])

  // Get current active container based on step
  const currentMapContainer = step === "setup" ? setupMapContainer : step === "review" ? reviewMapContainer : null

  // GraphQL mutation hook
  const [generateIsochrone] = useMutation(GENERATE_ISOCHRONE)

  // Predefined distance options
  const distanceOptions = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30]

  // Zone colors with iOS-style pastel colors
  const zoneColors = [
    "#34c759", // green
    "#ffcc00", // yellow
    "#ff3b30", // red
    "#007aff", // blue
    "#af52de", // purple
    "#ff2d55", // pink
  ]

  const transportModes = [
    { value: "car" as TransportMode, label: "Car", icon: "🚗", speed: "60 km/h" },
    { value: "motorbike" as TransportMode, label: "Motorbike", icon: "🏍️", speed: "30 km/h" },
    { value: "bike" as TransportMode, label: "Bicycle", icon: "🚲", speed: "15 km/h" },
    { value: "walking" as TransportMode, label: "Walking", icon: "🚶", speed: "5 km/h" },
  ]

  // Initialize map when container becomes available
  useEffect(() => {
    if (!currentMapContainer || !vendor) {
      console.log("⏳ Waiting for map container or vendor data...", { 
        container: !!currentMapContainer, 
        vendor: !!vendor,
        step 
      })
      return
    }

    // Reset map state when switching steps or if already initialized
    if (mapStateRef.current.isInitialized) {
      console.log("🔄 Resetting map for new step:", step)
      destroyMap(mapStateRef.current)
      setMapLoaded(false)
    }

    // Check if container has dimensions
    const containerRect = currentMapContainer.getBoundingClientRect()
    console.log("📐 Container dimensions:", {
      width: containerRect.width,
      height: containerRect.height,
      top: containerRect.top,
      left: containerRect.left,
      step
    })

    if (containerRect.width === 0 || containerRect.height === 0) {
      console.warn("⚠️ Container has no dimensions, waiting...")
      
      const retryTimeout = setTimeout(() => {
        const newRect = currentMapContainer.getBoundingClientRect()
        if (newRect.width > 0 && newRect.height > 0) {
          console.log("✅ Container now has dimensions, retrying initialization")
          setSetupMapContainer(currentMapContainer === setupMapContainer ? currentMapContainer : setupMapContainer)
          setReviewMapContainer(currentMapContainer === reviewMapContainer ? currentMapContainer : reviewMapContainer)
        }
      }, 1000)

      return () => clearTimeout(retryTimeout)
    }

    console.log(`🗺️ Initializing delivery zone map for ${step} step...`)

    try {
      // Reset the map state
      mapStateRef.current = {
        map: null,
        isInitialized: false,
        isStyleLoaded: false,
        container: currentMapContainer
      }

      initializeMap(
        mapStateRef.current,
        currentMapContainer,
        maptilerApiKey || "",
        vendor,
        () => {
          console.log(`✅ Map loaded successfully for ${step} step - setting mapLoaded to true`)
          setMapLoaded(true)
        }
      )

      // Debug timeout
      const debugTimeout = setTimeout(() => {
        if (!mapLoaded) {
          console.log(`🐛 Map still loading after 5 seconds for ${step} step, debugging...`)
          console.log("Map state:", mapStateRef.current)
        }
      }, 5000)

      return () => clearTimeout(debugTimeout)
    } catch (error) {
      console.error("💥 Failed to initialize map:", error)
      setTimeout(() => {
        console.log("🔄 Force setting map loaded after error")
        setMapLoaded(true)
      }, 3000)
    }
  }, [currentMapContainer, vendor, maptilerApiKey, step]) // Add step dependency

  // Cleanup effect
  useEffect(() => {
    return () => {
      destroyMap(mapStateRef.current)
      setMapLoaded(false)
    }
  }, [])

  // Update map with isochrones when they change
  useEffect(() => {
    if (mapStateRef.current && mapLoaded && isochrones.length > 0) {
      console.log(`🔄 Updating map with ${isochrones.length} isochrones`)
      updateMapWithIsochrones(mapStateRef.current, isochrones, vendor, ranges)
    }
  }, [isochrones, vendor, ranges, mapLoaded])

  const handleAddRange = () => {
    if (ranges.find((r) => r.distance === currentRange)) {
      showError("This distance range already exists!")
      return
    }

    const newRange = {
      id: Date.now(),
      distance: currentRange,
      price: currentPrice,
      color: zoneColors[ranges.length % zoneColors.length],
    }

    setRanges([...ranges, newRange])

    // Auto-increment for next range
    const nextDistance = distanceOptions.find((d) => d > currentRange) || currentRange + 5
    setCurrentRange(nextDistance)
    setCurrentPrice(Math.round((currentPrice + 2.0) * 100) / 100)

    showSuccess("Zone added successfully!")
  }

  const handleRemoveRange = (id: number) => {
    setRanges(ranges.filter((r) => r.id !== id))
    showSuccess("Zone removed")
  }

  const handleEditZone = (id: number, newPrice: number) => {
    setRanges(ranges.map((r) => (r.id === id ? { ...r, price: newPrice } : r)))
    setEditingZone(null)
    showSuccess("Zone updated")
  }

  const showError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 4000)
  }

  const showSuccess = (message: string) => {
    const alertDiv = document.createElement("div")
    alertDiv.className =
      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#34c759] text-white px-4 py-2 rounded-xl shadow-lg z-50 font-medium text-sm transition-all duration-300"
    alertDiv.textContent = message
    document.body.appendChild(alertDiv)

    setTimeout(() => {
      alertDiv.style.opacity = "0"
      alertDiv.style.transform = "translate(-50%, -20px)"
      setTimeout(() => alertDiv.remove(), 300)
    }, 2000)
  }

  const handleGenerateZones = async () => {
    if (ranges.length === 0) {
      showError("Please add at least one delivery zone")
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const sortedRanges = [...ranges].sort((a, b) => a.distance - b.distance)
      const speed = SPEED_MAPPING[transportMode]
      const timeRanges = sortedRanges.map((range) => {
        const timeInMinutes = Math.round((range.distance / speed) * 60)
        return Math.min(timeInMinutes * 60, 3600)
      })

      const metaData = sortedRanges.map((range) => ({
        price: range.price
      }))

      // Map transport modes to OpenRouteService profiles
      const profileMapping = {
        'walking': 'foot-walking',
        'bike': 'cycling-regular', 
        'motorbike': 'driving-car', // Use car profile for motorbike
        'car': 'driving-car'
      }

      const openRouteProfile = profileMapping[transportMode] || 'driving-car'
      
      console.log(`🚗 Using transport mode: ${transportMode} -> OpenRoute profile: ${openRouteProfile}`)

      const response = await generateIsochrone({
        variables: {
          input: {
            locations: [[vendor.lng, vendor.lat]],
            range: timeRanges,
            transportMode: openRouteProfile, // Use mapped profile instead of raw transportMode
            address: vendor.address,
            vendorId: vendor.placeId,
            metaData: metaData
          }
        }
      })

      if (response?.data?.generateIsochrone?.geojson) {
        const geojsonData = JSON.parse(response.data.generateIsochrone.geojson)
        
        if (geojsonData?.features) {
          const processedIsochrones = geojsonData.features.map((feature: any, index: number) => {
            const range = sortedRanges[index]
            return {
              id: `iso_${range.id}`,
              distance: range.distance,
              price: range.price,
              color: range.color,
              geojson: feature,
              properties: feature.properties || {}
            }
          })

          setIsochrones(processedIsochrones)
          setGeneratedData(response.data.generateIsochrone)
          setStep("review")
          showSuccess("Zones generated successfully!")
        } else {
          throw new Error("Invalid GeoJSON format received")
        }
      } else {
        throw new Error("No valid isochrone data received")
      }
    } catch (error: any) {
      console.error("Error generating zones:", error)
      
      let errorMessage = "Failed to generate delivery zones. Please try again."
      
      if (error?.message?.includes("Parameter 'profile' has incorrect value")) {
        errorMessage = `Invalid transport mode for mapping service. Please try a different transport option.`
      } else if (error?.message?.includes("Service Unavailable") || error?.message?.includes("503")) {
        errorMessage = "The mapping service is temporarily unavailable. Please try again in a few moments."
      } else if (error?.networkError) {
        errorMessage = "Network error. Please check your connection and try again."
      } else if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message
      }
      
      showError(errorMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveZones = () => {
    if (generatedData && onSave) {
      const deliveryZoneData = {
        riderId: riderId,
        vendorId: vendor.placeId || `vendor_${Date.now()}`,
        vendorLocation: {
          lat: vendor.lat,
          lng: vendor.lng,
          address: vendor.address,
        },
        ranges: ranges.map((r) => ({
          distance: r.distance,
          price: r.price,
          color: r.color,
        })),
        transportMode,
        geojson: generatedData.geojson,
        id: generatedData.id,
        locations: generatedData.locations,
        range: generatedData.range,
        metaData: generatedData.metaData,
        createdAt: new Date().toISOString(),
      }

      onSave(deliveryZoneData)
    }
    
    setStep("success")
    showSuccess("Delivery zones saved successfully!")
  }

  const handleShareZones = () => {
    const shareData = {
      title: "Delivery Zones",
      text: `Delivery zones for ${vendor.address}`,
      url: window.location.href,
    }

    if (navigator.share) {
      navigator.share(shareData)
    } else {
      navigator.clipboard.writeText(window.location.href)
      showSuccess("Link copied to clipboard!")
    }
    setShowShareMenu(false)
  }

  const handleExportZones = () => {
    const exportData = {
      vendor: vendor,
      zones: isochrones,
      transportMode: transportMode,
      generatedData: generatedData,
      createdAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `delivery-zones-${vendor.placeId}.json`
    a.click()
    URL.revokeObjectURL(url)

    showSuccess("Zones exported successfully!")
    setShowShareMenu(false)
  }

  const handleStartOver = () => {
    setRanges([])
    setIsochrones([])
    setGeneratedData(null)
    setStep("setup")
    setCurrentRange(3)
    setCurrentPrice(5.0)
    setError(null)
    setEditingZone(null)
    showSuccess("Starting fresh setup")
  }

  const totalCoverage = ranges.length > 0 ? Math.max(...ranges.map((r) => r.distance)) : 0

  return (
    <div className="min-h-screen bg-[#f2f2f7] font-sans text-[#1d1d1f]">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-[#e5e5e7]/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {step !== "setup" && (
              <button
                onClick={() => {
                  if (step === "zones") setStep("setup")
                  else if (step === "review") setStep("zones")
                  else if (step === "success") setStep("review")
                }}
                className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5e7] flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-[#007aff]" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-semibold">Delivery Zones</h1>
              <p className="text-sm text-[#86868b] truncate max-w-[200px] md:max-w-none">{vendor.address}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-1">
              <div
                className={cn(
                  "h-2 w-8 rounded-full transition-all duration-300",
                  step === "setup" || step === "zones" || step === "review" || step === "success"
                    ? "bg-[#007aff]"
                    : "bg-[#e5e5e7]",
                )}
              />
              <div
                className={cn(
                  "h-2 w-8 rounded-full transition-all duration-300",
                  step === "zones" || step === "review" || step === "success" ? "bg-[#007aff]" : "bg-[#e5e5e7]",
                )}
              />
              <div
                className={cn(
                  "h-2 w-8 rounded-full transition-all duration-300",
                  step === "review" || step === "success" ? "bg-[#007aff]" : "bg-[#e5e5e7]",
                )}
              />
              <div
                className={cn(
                  "h-2 w-8 rounded-full transition-all duration-300",
                  step === "success" ? "bg-[#007aff]" : "bg-[#e5e5e7]",
                )}
              />
            </div>

            {/* Actions menu */}
            {(step === "review" || step === "success") && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-8 h-8 rounded-full bg-[#f5f5f7] hover:bg-[#e5e5e7] flex items-center justify-center transition-colors"
                >
                  <Share className="h-4 w-4 text-[#007aff]" />
                </button>

                {showShareMenu && (
                  <div className="absolute right-0 top-10 bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-[#e5e5e7] p-2 min-w-[160px] z-30">
                    <button
                      onClick={handleShareZones}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f5f5f7] rounded-xl transition-colors"
                    >
                      <Share className="h-4 w-4 text-[#007aff]" />
                      <span className="text-sm">Share Zones</span>
                    </button>
                    <button
                      onClick={handleExportZones}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#f5f5f7] rounded-xl transition-colors"
                    >
                      <Download className="h-4 w-4 text-[#007aff]" />
                      <span className="text-sm">Export Data</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step indicator for mobile */}
            <div className="md:hidden">
              <span className="text-sm font-medium text-[#007aff]">
                {step === "setup" && "Setup"}
                {step === "zones" && "Add Zones"}
                {step === "review" && "Review"}
                {step === "success" && "Complete"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-[#fff1f0] border border-[#ff3b30]/20 rounded-2xl p-4 text-[#ff3b30] flex items-center animate-in slide-in-from-top duration-300">
            <div className="w-6 h-6 bg-[#ff3b30]/10 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
              <X className="h-3 w-3" />
            </div>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Setup Step */}
        {step === "setup" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold mb-2">Create Delivery Zones</h2>
                    <p className="text-[#86868b] mb-6">Set up delivery pricing based on distance from your location</p>

                    <div className="flex items-center gap-3 mb-8 p-4 bg-[#f5f5f7] rounded-xl">
                      <div className="w-10 h-10 bg-[#007aff]/10 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-[#007aff]" />
                      </div>
                      <div>
                        <p className="font-medium">Vendor Location</p>
                        <p className="text-sm text-[#86868b]">{vendor.address}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-3">Choose Transport Mode</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {transportModes.map((mode) => (
                            <button
                              key={mode.value}
                              onClick={() => setTransportMode(mode.value)}
                              className={cn(
                                "p-4 rounded-xl text-left transition-all duration-200 border-2",
                                transportMode === mode.value
                                  ? "bg-[#007aff] text-white border-[#007aff] shadow-lg scale-[1.02]"
                                  : "bg-[#f5f5f7] text-[#1d1d1f] border-[#e5e5e7] hover:bg-[#e5e5e7] hover:border-[#d1d1d6]",
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{mode.icon}</span>
                                <div>
                                  <p className="font-medium">{mode.label}</p>
                                  <p
                                    className={cn(
                                      "text-xs",
                                      transportMode === mode.value ? "text-white/80" : "text-[#86868b]",
                                    )}
                                  >
                                    Avg. speed: {mode.speed}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 bg-[#f5f5f7] rounded-xl p-4 md:p-6">
                    <div className="relative h-[200px] md:h-[300px] rounded-lg overflow-hidden">
                      <div ref={setupMapRefCallback} className="w-full h-full" />

                      {!mapLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f7]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 relative">
                              <div className="absolute inset-0 rounded-full border-2 border-[#007aff] border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-sm text-[#86868b]">Loading map...</p>
                            
                            {/* Debug info in development */}
                            {process.env.NODE_ENV === "development" && (
                              <div className="text-xs text-gray-400 space-y-1 mt-2">
                                <p>API Key: {maptilerApiKey ? "✅ Provided" : "❌ Using Demo"}</p>
                                <p>Container: {setupMapContainer ? "✅ Ready" : "❌ Not Ready"}</p>
                                <p>State: {mapStateRef.current.isInitialized ? "✅ Init" : "❌ Waiting"}</p>
                                <p>Step: {step}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e5e5e7] p-4 flex justify-end">
                <button
                  onClick={() => setStep("zones")}
                  className="bg-[#007aff] hover:bg-[#0071e3] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zones Step */}
        {step === "zones" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Add Delivery Zones</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-[#f5f5f7] rounded-xl p-5">
                      <h3 className="font-medium mb-4">Create New Zone</h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Distance (km)</label>
                          <div className="flex items-center bg-white rounded-xl border border-[#e5e5e7]">
                            <button
                              onClick={() => setCurrentRange(Math.max(1, currentRange - 1))}
                              className="h-12 w-12 flex items-center justify-center hover:bg-[#f5f5f7] rounded-l-xl transition-colors"
                            >
                              <Minus className="h-4 w-4 text-[#007aff]" />
                            </button>
                            <select
                              value={currentRange}
                              onChange={(e) => setCurrentRange(Number(e.target.value))}
                              className="flex-1 h-12 appearance-none bg-transparent px-4 focus:outline-none text-center font-medium"
                            >
                              {distanceOptions.map((distance) => (
                                <option key={distance} value={distance}>
                                  {distance} km
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const index = distanceOptions.indexOf(currentRange)
                                if (index < distanceOptions.length - 1) {
                                  setCurrentRange(distanceOptions[index + 1])
                                }
                              }}
                              className="h-12 w-12 flex items-center justify-center hover:bg-[#f5f5f7] rounded-r-xl transition-colors"
                            >
                              <Plus className="h-4 w-4 text-[#007aff]" />
                            </button>
                          </div>
                          <p className="text-xs text-[#86868b] mt-1">Maximum distance for this zone</p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">Price (GHS)</label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.50"
                              value={currentPrice}
                              onChange={(e) => setCurrentPrice(Number(e.target.value))}
                              className="w-full h-12 px-4 bg-white border border-[#e5e5e7] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#007aff] focus:border-transparent font-medium"
                            />
                          </div>
                          <p className="text-xs text-[#86868b] mt-1">Delivery fee for this distance</p>
                        </div>

                        <button
                          onClick={handleAddRange}
                          className="w-full bg-[#34c759] hover:bg-[#30b753] text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Zone</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Your Zones ({ranges.length})</h3>
                      {ranges.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-[#007aff]/10 text-[#007aff] px-2 py-1 rounded-full">
                            {ranges.length} zone{ranges.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs bg-[#34c759]/10 text-[#34c759] px-2 py-1 rounded-full">
                            {totalCoverage}km max
                          </span>
                        </div>
                      )}
                    </div>

                    {ranges.length === 0 ? (
                      <div className="bg-[#f5f5f7] rounded-xl p-8 text-center">
                        <div className="w-12 h-12 bg-[#86868b]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <MapPin className="h-6 w-6 text-[#86868b]" />
                        </div>
                        <p className="text-[#86868b] font-medium">No zones added yet</p>
                        <p className="text-xs text-[#86868b] mt-1">Add at least one delivery zone to continue</p>
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-auto pr-1">
                        <div className="space-y-3">
                          {ranges
                            .sort((a, b) => a.distance - b.distance)
                            .map((range, index) => {
                              const prevDistance =
                                index === 0 ? 0 : ranges.sort((a, b) => a.distance - b.distance)[index - 1].distance
                              return (
                                <div
                                  key={range.id}
                                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#e5e5e7] hover:border-[#d1d1d6] transition-all duration-200"
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                                      style={{ backgroundColor: range.color }}
                                    />
                                    <div>
                                      <span className="font-medium">
                                        Zone {index + 1}: {prevDistance}-{range.distance} km
                                      </span>
                                      <div className="flex items-center gap-2 mt-1">
                                        {editingZone === range.id ? (
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.50"
                                            defaultValue={range.price}
                                            onBlur={(e) => handleEditZone(range.id, Number(e.target.value))}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                handleEditZone(range.id, Number(e.currentTarget.value))
                                              }
                                            }}
                                            className="w-20 px-2 py-1 text-xs border border-[#e5e5e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007aff]"
                                            autoFocus
                                          />
                                        ) : (
                                          <span className="text-xs text-[#86868b]">GHS {range.price.toFixed(2)}</span>
                                        )}
                                        <button
                                          onClick={() => setEditingZone(editingZone === range.id ? null : range.id)}
                                          className="text-[#007aff] hover:bg-[#007aff]/10 rounded-full p-1 transition-colors"
                                        >
                                          <Edit3 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveRange(range.id)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#ff3b30] hover:bg-[#ff3b30]/10 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#e5e5e7] p-4 flex justify-between">
                <button
                  onClick={() => setStep("setup")}
                  className="text-[#007aff] font-medium py-3 px-5 rounded-xl hover:bg-[#007aff]/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateZones}
                  disabled={isGenerating || ranges.length === 0}
                  className={cn(
                    "font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm flex items-center gap-2",
                    ranges.length === 0 || isGenerating
                      ? "bg-[#86868b] text-white opacity-70 cursor-not-allowed"
                      : "bg-[#007aff] hover:bg-[#0071e3] text-white hover:shadow-md transform hover:scale-[1.02]",
                  )}
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 relative">
                        <div className="absolute inset-0 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                      </div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <span>Generate Zones</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Review Delivery Zones</h2>

                <div className="relative h-[300px] md:h-[450px] rounded-xl overflow-hidden mb-6 border border-[#e5e5e7]">
                  <div ref={reviewMapRefCallback} className="w-full h-full" />
                  
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f7]">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 relative">
                          <div className="absolute inset-0 rounded-full border-2 border-[#007aff] border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-sm text-[#86868b]">Loading map...</p>
                        
                        {/* Debug info in development */}
                        {process.env.NODE_ENV === "development" && (
                          <div className="text-xs text-gray-400 space-y-1 mt-2">
                            <p>API Key: {maptilerApiKey ? "✅ Provided" : "❌ Using Demo"}</p>
                            <p>Container: {reviewMapContainer ? "✅ Ready" : "❌ Not Ready"}</p>
                            <p>State: {mapStateRef.current.isInitialized ? "✅ Init" : "❌ Waiting"}</p>
                            <p>Step: {step}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium flex items-center gap-2">
                    Zone Details
                    <button
                      onClick={() => setShowZoneDetails(!showZoneDetails)}
                      className="text-[#007aff] hover:bg-[#007aff]/5 rounded-full p-1 transition-colors"
                    >
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          showZoneDetails ? "transform rotate-180" : "",
                        )}
                      />
                    </button>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-[#007aff]/10 text-[#007aff] px-2 py-1 rounded-full font-medium">
                      {isochrones.length} zone{isochrones.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs bg-[#34c759]/10 text-[#34c759] px-2 py-1 rounded-full font-medium capitalize">
                      {transportMode}
                    </span>
                  </div>
                </div>

                {showZoneDetails && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 animate-in slide-in-from-top duration-300">
                    {isochrones
                      .sort((a, b) => a.distance - b.distance)
                      .map((zone, index) => {
                        const prevDistance =
                          index === 0 ? 0 : isochrones.sort((a, b) => a.distance - b.distance)[index - 1].distance
                        return (
                          <div
                            key={zone.id}
                            className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-xl border border-[#e5e5e7]"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded-full border border-white shadow-sm"
                                style={{ backgroundColor: zone.color }}
                              />
                              <span className="text-sm font-medium">
                                {prevDistance}-{zone.distance} km
                              </span>
                            </div>
                            <span className="text-sm font-semibold">GHS {zone.price.toFixed(2)}</span>
                          </div>
                        )
                      })}
                  </div>
                )}

                <div className="bg-[#f5f5f7] rounded-xl p-5 border border-[#e5e5e7]">
                  <h4 className="font-medium mb-4">Delivery Zone Summary</h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Vendor Location</p>
                      <p className="text-sm font-medium truncate">{vendor.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Transport Mode</p>
                      <p className="text-sm font-medium capitalize">{transportMode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Max Coverage</p>
                      <p className="text-sm font-medium">{totalCoverage} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Total Zones</p>
                      <p className="text-sm font-medium">{isochrones.length}</p>
                    </div>
                  </div>
                </div>

                {generatedData && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-4">
                    <h4 className="font-medium mb-2 text-blue-900">Generated Data Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-700 mb-1">ID</p>
                        <p className="text-blue-900 font-mono text-xs">{generatedData.id}</p>
                      </div>
                      <div>
                        <p className="text-blue-700 mb-1">Locations</p>
                        <p className="text-blue-900 text-xs">{generatedData.locations?.length || 0} points</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#e5e5e7] p-4 flex justify-between">
                <button
                  onClick={() => setStep("zones")}
                  className="text-[#007aff] font-medium py-3 px-5 rounded-xl hover:bg-[#007aff]/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveZones}
                  className="bg-[#007aff] hover:bg-[#0071e3] text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                >
                  Save Zones
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden">
              <div className="p-6 md:p-8 text-center">
                <div className="w-20 h-20 bg-[#34c759] rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-2xl font-semibold mb-3">Delivery Zones Created!</h2>
                <p className="text-[#86868b] mb-8 max-w-md mx-auto">
                  Your delivery zones have been successfully created and are now active for this location. Customers can
                  now see pricing for different delivery distances.
                </p>

                <div className="bg-[#f5f5f7] rounded-xl p-6 mb-8 max-w-lg mx-auto border border-[#e5e5e7]">
                  <h4 className="font-medium mb-4 text-left">Zone Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Vendor Location</p>
                      <p className="text-sm font-medium truncate">{vendor.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Transport Mode</p>
                      <p className="text-sm font-medium capitalize">{transportMode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Max Coverage</p>
                      <p className="text-sm font-medium">{totalCoverage} km</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#86868b] mb-1">Total Zones</p>
                      <p className="text-sm font-medium">{isochrones.length}</p>
                    </div>
                  </div>

                  {generatedData && (
                    <div className="mt-4 pt-4 border-t border-[#e5e5e7]">
                      <p className="text-xs text-[#86868b] mb-1">Generated ID</p>
                      <p className="text-sm font-mono bg-white px-2 py-1 rounded border text-[#1d1d1f]">
                        {generatedData.id}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                  <button
                    onClick={handleStartOver}
                    className="flex-1 bg-[#f5f5f7] hover:bg-[#e5e5e7] text-[#1d1d1f] font-medium py-3 px-5 rounded-xl transition-all duration-200 border border-[#e5e5e7]"
                  >
                    Create New Zones
                  </button>
                  <button
                    onClick={() => (window.location.href = "/dashboard")}
                    className="flex-1 bg-[#007aff] hover:bg-[#0071e3] text-white font-medium py-3 px-5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-[1.02]"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Click outside to close share menu */}
      {showShareMenu && <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />}
    </div>
  )
}