// mapManager.ts - Functional Implementation with Better Error Handling
import maplibregl from "maplibre-gl"
import {simplify,length,lineString, along, bearing, polygon, area} from "@turf/turf"
import type { ServiceData, ViewMode } from "./types"
import { ZONE_COLORS } from "@/components/GLOBAL/format"
// Process route data
import type { Feature ,LineString} from "geojson"



// Interface for map manager state
export interface MapState {
  map: maplibregl.Map | null
  markers: maplibregl.Marker[]
  arrowImagesLoaded: Set<string>
  isInitialized: boolean
}

// Create map state
export function createMapState(): MapState {
  return {
    map: null,
    markers: [],
    arrowImagesLoaded: new Set(),
    isInitialized: false
  }
}

// Initialize map with better error handling
export function initializeMap(
  state: MapState,
  container: HTMLDivElement, 
  maptilerApiKey: string, 
  onLoad: () => void
): void {
  if (state.isInitialized) {
    console.warn("⚠️ Map already initialized")
    return
  }

  console.log("🗺️ Starting map initialization...")
  console.log("📍 Container:", container)
  console.log("🔑 API Key:", maptilerApiKey ? "Provided" : "Using demo tiles")

  const mapStyle = maptilerApiKey
    ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
    : "https://demotiles.maplibre.org/style.json"

  console.log("🎨 Map style URL:", mapStyle)

  try {
    state.map = new maplibregl.Map({
      container,
      style: mapStyle,
      center: [-0.187, 5.6037], // Accra, Ghana
      zoom: 11,
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

    state.map.on("error", (e) => {
      console.error("❌ Map error:", e)
      console.error("Error details:", e.error)
    })

    state.map.on("styledata", () => {
      console.log("🎨 Map style loaded")
    })

    state.map.on("sourcedata", (e) => {
      if (e.isSourceLoaded) {
        console.log("📊 Map source loaded:", e.sourceId)
      }
    })

    // Add navigation control
    // state.map.addControl(new maplibregl.NavigationControl(), "top-right")
    console.log("🧭 Navigation control added")

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
        initializeMap(state, container, "", onLoad)
      }, 1000)
    }
  }
}

// Debug function to check map state
export function debugMapState(state: MapState): void {
  console.log("🔍 Map Debug Info:")
  console.log("- Map instance:", state.map ? "✅ Created" : "❌ Null")
  console.log("- Is initialized:", state.isInitialized ? "✅ Yes" : "❌ No")
  console.log("- Markers count:", state.markers.length)
  console.log("- Arrow images loaded:", state.arrowImagesLoaded.size)
  
  if (state.map) {
    console.log("- Map loaded:", state.map.loaded() ? "✅ Yes" : "❌ No")
    console.log("- Map style loaded:", state.map.isStyleLoaded() ? "✅ Yes" : "❌ No")
    console.log("- Map center:", state.map.getCenter())
    console.log("- Map zoom:", state.map.getZoom())
  }
}

// Update map data with better error handling
export function updateMapData(
  state: MapState,
  serviceData: ServiceData[],
  filteredData: ServiceData[],
  selectedItem: ServiceData | null,
  viewMode: ViewMode,
): void {
  if (!state.map) {
    console.warn("⚠️ Cannot update map: map instance is null")
    debugMapState(state)
    return
  }

  if (!state.map.loaded()) {
    console.warn("⚠️ Cannot update map: map not yet loaded")
    debugMapState(state)
    return
  }

  if (!serviceData.length) {
    console.log("📭 No service data to display")
    return
  }

  console.log(`🔄 Updating map with ${filteredData.length} filtered items from ${serviceData.length} total`)

  try {
    // Clear existing markers and layers
    clearMap(state)

    const dataToShow = viewMode === "all" ? filteredData : selectedItem ? [selectedItem] : []
    if (dataToShow.length === 0) {
      console.log("📭 No data to show on map")
      return
    }

    const bounds = new maplibregl.LngLatBounds()
    const routeFeatures: Feature[] = []
    const isochroneFeatures: Feature[] = []

    dataToShow.forEach((item) => {
      const isSelected = selectedItem?.id === item.id

      // Add markers
      addServiceMarkers(state, item, isSelected, bounds)

      // Process routes with Turf.js
      processRouteData(item, isSelected, routeFeatures)

      // Process isochrones
      processIsochroneData(item, isSelected, isochroneFeatures)
    })

    // Add processed data to map
    addRoutesToMap(state, routeFeatures)
    addIsochronesToMap(state, isochroneFeatures)
    fitMapToBounds(state, bounds, dataToShow.length)

    console.log("✅ Map update completed successfully")
  } catch (error) {
    console.error("❌ Failed to update map:", error)
    debugMapState(state)
  }
}

// Add service markers
function addServiceMarkers(
  state: MapState, 
  item: ServiceData, 
  isSelected: boolean, 
  bounds: maplibregl.LngLatBounds
): void {
  // Add vendor marker
  if (item.vendor.coordinates) {
    const vendorMarker = createVendorMarker(state, item, isSelected)
    state.markers.push(vendorMarker)
    bounds.extend(item.vendor.coordinates)
  }

  // Add destination marker
  const destinationCoords = getDestinationCoords(item)
  if (destinationCoords) {
    const destMarker = createDestinationMarker(state, item, destinationCoords, isSelected)
    state.markers.push(destMarker)
    bounds.extend(destinationCoords)
  }

  // Add pickup marker for bookings
  if (item.type === "BOOKING" && item.bookingData?.pickupLocation) {
    const pickupMarker = createPickupMarker(state, item, isSelected)
    state.markers.push(pickupMarker)
    // Ensure pickupLocation is [lng, lat], not a string
    const pickupLoc = item.bookingData.pickupLocation
    if (Array.isArray(pickupLoc) && pickupLoc.length === 2 && typeof pickupLoc[0] === "number" && typeof pickupLoc[1] === "number") {
      bounds.extend([pickupLoc[0], pickupLoc[1]])
    } else if (typeof pickupLoc === "string") {
      // Try to parse string "lng,lat" to [lng, lat]
      const parts = pickupLoc.split(",").map(Number)
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        bounds.extend([parts[0], parts[1]])
      } else {
        console.warn("Invalid pickupLocation format for bounds.extend:", pickupLoc)
      }
    } else {
      console.warn("pickupLocation is not a valid coordinate array or string:", pickupLoc)
    }
  }

  // Add rider marker
  if (item.rider?.coordinates) {
    const riderMarker = createRiderMarker(state, item, isSelected)
    state.markers.push(riderMarker)
    bounds.extend(item.rider.coordinates)
  }
}


function processRouteData(item: ServiceData, isSelected: boolean, routeFeatures: Feature[]): void {
  let routeGeoJSON = null
  if (item.type === "ORDER" && item.orderData?.routeData?.geojson) {
    routeGeoJSON = item.orderData.routeData.geojson
  } else if (item.type === "BOOKING" && item.bookingData?.routeData?.geojson) {
    routeGeoJSON = item.bookingData.routeData.geojson
  }

  if (routeGeoJSON) {
    try {
      const parsedRoute = JSON.parse(routeGeoJSON)

      let coordinates = null
      let routeLength = 0
      let routeDistance = "0 km"
      let routeDuration = "0 min"

      if (parsedRoute.geometry?.coordinates) {
        coordinates = parsedRoute.geometry.coordinates

        if (parsedRoute.metadata) {
          routeDistance = parsedRoute.metadata.distance || "0 km"
          routeDuration = parsedRoute.metadata.duration || "0 min"
        }

        const routeLine = lineString(coordinates)
        routeLength = length(routeLine, { units: "kilometers" })
        const simplifiedRoute = simplify(routeLine, { tolerance: 0.0001, highQuality: true })

        // Generate unique color for each route using zone colors
        const routeColor = getRouteColor(item)
        
        const directionPoints = isSelected ? generateDirectionArrows(routeLine) : []

        routeFeatures.push({
          type: "Feature",
          properties: {
            serviceId: item.id,
            serviceType: item.type,
            color: routeColor,
            opacity: isSelected ? 1.0 : 0.7,
            width: isSelected ? 6 : 3,
            dashArray: item.type === "BOOKING" ? [10, 5] : [1, 0],
            routeLength: routeLength.toFixed(2),
            routeDistance: routeDistance,
            routeDuration: routeDuration,
            isSelected,
          },
          geometry: simplifiedRoute.geometry,
        })

        // Add direction arrows with the same color as the route
        if (isSelected && directionPoints.length > 0) {
          // Instead of arrows, create a dashed direction line
          const directionLine = lineString(coordinates)
          
          routeFeatures.push({
            type: "Feature",
            properties: {
              serviceId: `${item.id}-direction`,
              isDirection: true,
              color: routeColor,
              opacity: 0.8,
              width: 3,
              dashArray: [8, 4], // Dashed pattern: 8px line, 4px gap
            },
            geometry: directionLine.geometry,
          })
        }

        console.log(`✅ Processed route for ${item.type} ${item.id}:`, {
          calculatedLength: `${routeLength.toFixed(2)}km`,
          apiDistance: routeDistance,
          apiDuration: routeDuration,
          coordinateCount: coordinates.length,
          arrows: directionPoints.length,
          color: routeColor,
        })
      }
    } catch (error) {
      console.warn(`❌ Failed to parse route data for ${item.type} ${item.id}:`, error)
    }
  }
}



function generateDirectionArrows(routeLine: Feature<LineString>): Feature[] {
  try {
    const arrows: Feature[] = []
    const lineLength = length(routeLine, { units: "kilometers" })

    // More arrows for longer routes, fewer for shorter ones
    const arrowCount = Math.min(Math.max(Math.floor(lineLength / 3), 3), 12)
    const arrowInterval = lineLength / (arrowCount + 1)

    for (let i = 1; i <= arrowCount; i++) {
      const distance = arrowInterval * i
      const point = along(routeLine, distance, { units: "kilometers" })
      const nextDistance = Math.min(distance + 0.1, lineLength)
      const nextPoint = along(routeLine, nextDistance, { units: "kilometers" })

      // Calculate bearing for arrow direction
      const bearingS = bearing(point, nextPoint)

      arrows.push({
        type: "Feature",
        properties: { bearingS },
        geometry: point.geometry,
      })
    }

    console.log(`🎯 Generated ${arrows.length} direction arrows for ${lineLength.toFixed(1)}km route`)
    return arrows
  } catch (error) {
    console.warn("Failed to generate direction arrows:", error)
    return []
  }
}

// Process isochrone data
function processIsochroneData(item: ServiceData, isSelected: boolean, isochroneFeatures: Feature[]): void {
  if (item.type === "ORDER" && item.orderData?.deliveryMetaData?.geojson) {
    try {
      const isochroneData = JSON.parse(item.orderData.deliveryMetaData.geojson)
      if (isochroneData.features) {
        isochroneData.features.forEach((feature: Feature) => {
          // Use Turf.js to enhance isochrone
          const polygonS = polygon((feature.geometry as GeoJSON.Polygon).coordinates)
          const areaS = area(polygonS) / 1000000 // Convert to km²

          isochroneFeatures.push({
            ...feature,
            properties: {
              ...feature.properties,
              serviceId: item.id,
              zone: item.orderData?.deliveryMetaData?.zone,
              price: item.orderData?.deliveryMetaData?.price,
              vendorName: item.vendor.name,
              area: areaS.toFixed(2),
              color: `hsl(${(typeof item?.orderData?.deliveryMetaData?.zone === "number" ? (item.orderData.deliveryMetaData.zone * 60) % 360 : 0)}, 70%, 60%)`,
              opacity: isSelected ? 0.4 : 0.2,
            },
          })
        })
      }
    } catch (error) {
      console.warn("Failed to parse isochrone data:", error)
    }
  }
}

// Add routes to map with dashed direction lines
function addRoutesToMap(state: MapState, routeFeatures: Feature[]): void {
  if (!state.map || routeFeatures.length === 0) return

  const routes = routeFeatures.filter((f) => f.properties && !f.properties.isDirection)
  const directionLines = routeFeatures.filter((f) => f.properties && f.properties.isDirection)

  console.log(`🗺️ Adding ${routes.length} routes and ${directionLines.length} direction lines to map`)

  // Add route lines
  if (routes.length > 0) {
    state.map.addSource("routes", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: routes,
      },
    })

    // Route outline for better visibility
    state.map.addLayer({
      id: "routes-outline",
      type: "line",
      source: "routes",
      paint: {
      "line-color": "#3B82F6", // blue
      "line-width": ["+", ["get", "width"], 2],
      "line-opacity": 0.8,
      },
    })

    // Main route line
    state.map.addLayer({
      id: "routes",
      type: "line",
      source: "routes",
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "width"],
        "line-opacity": ["get", "opacity"],
        "line-dasharray": ["get", "dashArray"],
      },
    })

    // Add click interaction for routes
    state.map.on("click", "routes", (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0]
        const props = feature.properties

        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-3 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30">
              <h3 class="font-semibold text-gray-900 mb-2">Route Information</h3>
              <div class="space-y-1 text-sm">
                <p><span class="text-gray-500">Type:</span> ${props.serviceType}</p>
                <p><span class="text-gray-500">Calculated Distance:</span> ${props.routeLength}km</p>
                ${props.routeDistance ? `<p><span class="text-gray-500">API Distance:</span> ${props.routeDistance}</p>` : ""}
                ${props.routeDuration ? `<p><span class="text-gray-500">Duration:</span> ${props.routeDuration}</p>` : ""}
              </div>
              <div class="mt-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  props.serviceType === "ORDER" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
                }">
                  ${props.serviceType === "ORDER" ? "Delivery Route" : "Booking Route"}
                </span>
              </div>
            </div>
          `)
          .addTo(state.map!)
      }
    })

    // Change cursor on hover
    state.map.on("mouseenter", "routes", () => {
      state.map!.getCanvas().style.cursor = "pointer"
    })

    state.map.on("mouseleave", "routes", () => {
      state.map!.getCanvas().style.cursor = ""
    })
  }

  // Add dashed direction lines
  if (directionLines.length > 0) {
    state.map.addSource("direction-lines", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: directionLines,
      },
    })

    // Direction line layer with dashes
    state.map.addLayer({
      id: "direction-lines",
      type: "line",
      source: "direction-lines",
      paint: {
        "line-color": ["get", "color"],
        "line-width": ["get", "width"],
        "line-opacity": ["get", "opacity"],
        "line-dasharray": ["get", "dashArray"], // This creates the - - - - pattern
      },
    })

    console.log(`✅ Added ${directionLines.length} dashed direction lines`)
  }

  console.log(`✅ Successfully added routes and direction lines to map`)
}

// Add isochrones to map
function addIsochronesToMap(state: MapState, isochroneFeatures: Feature[]): void {
  if (!state.map || isochroneFeatures.length === 0) return

  const isochroneGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: isochroneFeatures,
  }

  state.map.addSource("isochrones", {
    type: "geojson",
    data: isochroneGeoJSON,
  })

  state.map.addLayer({
    id: "isochrone-fill",
    type: "fill",
    source: "isochrones",
    paint: {
      "fill-color": ["get", "color"],
      "fill-opacity": ["get", "opacity"],
    },
  })

  state.map.addLayer({
    id: "isochrones",
    type: "line",
    source: "isochrones",
    paint: {
      "line-color": ["get", "color"],
      "line-width": 2,
      "line-opacity": 0.8,
      "line-dasharray": [5, 5],
    },
  })
}

// Create vendor marker
function createVendorMarker(state: MapState, item: ServiceData, isSelected: boolean): maplibregl.Marker {
  return new maplibregl.Marker({
    color: item.type === "ORDER" ? "#10B981" : "#8B5CF6",
    scale: isSelected ? 1.3 : 1.0,
  })
    .setLngLat(item.vendor.coordinates)
    .setPopup(
      new maplibregl.Popup({
        offset: 25,
        className: "custom-popup",
      }).setHTML(`
        <div class="p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-xs border border-white/30">
          <div class="flex items-center gap-2 mb-2">
            ${
              item.type === "ORDER"
                ? '<div class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center"><span class="text-xs">🏪</span></div>'
                : '<div class="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center"><span class="text-xs">🏨</span></div>'
            }
            <h3 class="font-semibold text-gray-900">${item.vendor.name}</h3>
          </div>
          <p class="text-sm text-gray-600 mb-2">${item.vendor.location}</p>
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              item.type === "ORDER" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"
            }">
              ${item.type === "ORDER" ? "PickUp" : "Venue"}
            </span>
          </div>
        </div>
      `),
    )
    .addTo(state.map!)
}

// Create destination marker
function createDestinationMarker(state: MapState, item: ServiceData, coords: [number, number], isSelected: boolean): maplibregl.Marker {
  const destinationAddress = getDestinationAddress(item)

  return new maplibregl.Marker({
    color: "#EF4444",
    scale: isSelected ? 1.3 : 1.0,
  })
    .setLngLat(coords)
    .setPopup(
      new maplibregl.Popup({
        offset: 25,
        className: "custom-popup",
      }).setHTML(`
        <div class="p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-xs border border-white/30">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
              <span class="text-xs">🎯</span>
            </div>
            <h3 class="font-semibold text-gray-900">Destination</h3>
          </div>
          <p class="text-sm text-gray-600 mb-1">${item.customer.name}</p>
          <p class="text-xs text-gray-500">${destinationAddress}</p>
          <div class="mt-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ${item.type === "ORDER" ? "Delivery" : "Dropoff"}
            </span>
          </div>
        </div>
      `),
    )
    .addTo(state.map!)
}

// Create pickup marker
function createPickupMarker(state: MapState, item: ServiceData, isSelected: boolean): maplibregl.Marker {
  // Normalize pickupLocation to [lng, lat] array
  let pickupLngLat: [number, number] | null = null;
  const pickupLoc = item.bookingData?.pickupLocation;
  if (Array.isArray(pickupLoc) && pickupLoc.length === 2 && typeof pickupLoc[0] === "number" && typeof pickupLoc[1] === "number") {
    pickupLngLat = [pickupLoc[0], pickupLoc[1]];
  } else if (typeof pickupLoc === "string") {
    const parts = pickupLoc.split(",").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      pickupLngLat = [parts[0], parts[1]];
    }
  }

  if (!pickupLngLat) {
    throw new Error("Invalid pickupLocation for marker");
  }

  return new maplibregl.Marker({
    color: "#F59E0B",
    scale: isSelected ? 1.3 : 1.0,
  })
    .setLngLat(pickupLngLat)
    .setPopup(
      new maplibregl.Popup({
        offset: 25,
        className: "custom-popup",
      }).setHTML(`
        <div class="p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-xs border border-white/30">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span class="text-xs">📍</span>
            </div>
            <h3 class="font-semibold text-gray-900">Pickup Location</h3>
          </div>
          <p class="text-sm text-gray-600">${item.customer.name}</p>
          <div class="mt-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pickup Point
            </span>
          </div>
        </div>
      `),
    )
    .addTo(state.map!)
}

// Create rider marker
function createRiderMarker(state: MapState, item: ServiceData, isSelected: boolean): maplibregl.Marker {
  return new maplibregl.Marker({
    color: "#3B82F6",
    scale: isSelected ? 1.3 : 1.0,
  })
    .setLngLat(item.rider!.coordinates!)
    .setPopup(
      new maplibregl.Popup({
        offset: 25,
        className: "custom-popup",
      }).setHTML(`
        <div class="p-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-xs border border-white/30">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-xs">🏍️</span>
            </div>
            <h3 class="font-semibold text-gray-900">${item.rider!.name}</h3>
          </div>
          <p class="text-sm text-gray-600 mb-1">Assigned Rider</p>
          <p class="text-xs text-gray-500">${item.rider!.number}</p>
          <div class="mt-2">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Active
            </span>
          </div>
        </div>
      `),
    )
    .addTo(state.map!)
}

// Get destination coordinates
function getDestinationCoords(item: ServiceData): [number, number] | null {
  if (item.type === "ORDER" && item.orderData?.order?.coordinates) {
    return item.orderData.order.coordinates
  } else if (item.type === "BOOKING" && item.bookingData?.dropoffLocation) {
    const dropoffLoc = item.bookingData.dropoffLocation
    if (Array.isArray(dropoffLoc) && dropoffLoc.length === 2 && typeof dropoffLoc[0] === "number" && typeof dropoffLoc[1] === "number") {
      return [dropoffLoc[0], dropoffLoc[1]]
    } else if (typeof dropoffLoc === "string") {
      const parts = dropoffLoc.split(",").map(Number)
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return [parts[0], parts[1]]
      }
    }
  }
  return null
}

// Get destination address
function getDestinationAddress(item: ServiceData): string {
  if (item.type === "ORDER") {
    return item.orderData?.deliveryAddress || item.orderData?.order?.deliveryAddress || ""
  } else if (item.type === "BOOKING") {
    return item.bookingData?.deliveryAddress || ""
  }
  return ""
}

// Get route color using zone colors
function getRouteColor(item: ServiceData): string {
  // Create a hash from the item ID for consistent color assignment
  const hash = hashString(item.id)
  
  // Use type as primary differentiator, then ID for uniqueness
  const baseIndex = item.type === "ORDER" ? 0 : 2 // Different starting points for ORDER vs BOOKING
  const colorIndex = (baseIndex + hash) % ZONE_COLORS.length
  
  return ZONE_COLORS[colorIndex]
}

// Helper function to create a simple hash from string
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

// Fit map to bounds
function fitMapToBounds(state: MapState, bounds: maplibregl.LngLatBounds, dataLength: number): void {
  if (!state.map || dataLength === 0) return

  try {
    state.map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 15,
      duration: 1000,
    })
  } catch (error) {
    console.warn("Failed to fit bounds:", error)
  }
}

// Clear map
function clearMap(state: MapState): void {
  // Clear existing markers
  state.markers.forEach((marker) => marker.remove())
  state.markers = []

  if (!state.map) return

  // Clear existing route layers (including direction lines)
  const layersToRemove = ["routes", "routes-outline", "direction-lines", "isochrones", "isochrone-fill"]
  
  layersToRemove.forEach((layerId) => {
    if (state.map!.getLayer(layerId)) {
      state.map!.removeLayer(layerId)
    }
  })

  const sourcesToRemove = ["routes", "direction-lines", "isochrones"]
  
  sourcesToRemove.forEach((sourceId) => {
    if (state.map!.getSource(sourceId)) {
      state.map!.removeSource(sourceId)
    }
  })
}

// Destroy map
export function destroyMap(state: MapState): void {
  clearMap(state)
  if (state.map) {
    state.map.remove()
    state.map = null
  }
  state.arrowImagesLoaded.clear()
}

// Get map instance
export function getMap(state: MapState): maplibregl.Map | null {
  return state.map
}