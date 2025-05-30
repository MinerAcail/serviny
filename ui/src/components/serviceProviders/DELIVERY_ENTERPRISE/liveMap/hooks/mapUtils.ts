// Fixed mapUtils.ts with correct coordinate handling
import maplibregl from "maplibre-gl"
import { OrderData, ProcessedRider, RouteData, ParsedRouteData } from "./types"

export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Available":
      return "#10B981"
    case "On Delivery":
      return "#3B82F6"
    case "On Break":
      return "#F59E0B"
    default:
      return "#6B7280"
  }
}

export const getStatusFromOrders = (orders: OrderData[]): "Available" | "On Delivery" | "On Break" => {
  const activeOrders = orders.filter(
    (order) => order.status === "CONFIRMED" || order.status === "PREPARING" || order.status === "OUT_FOR_DELIVERY",
  )

  if (activeOrders.length > 0) {
    return "On Delivery"
  }
  return "Available"
}

// Fixed: Parse route GeoJSON from database with better validation
export const parseRouteGeoJSON = (geojsonString: string): ParsedRouteData | null => {
  try {
    const geoJSON = JSON.parse(geojsonString)
    
    if (geoJSON.type === "Feature" && geoJSON.geometry?.type === "LineString") {
      const coordinates = geoJSON.geometry.coordinates
      
      // Validate coordinates array
      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn("Invalid coordinates array in GeoJSON")
        return null
      }
      
      // Validate each coordinate pair
      const validCoordinates = coordinates.filter((coord: any) => {
        return Array.isArray(coord) && 
               coord.length >= 2 && 
               typeof coord[0] === 'number' && 
               typeof coord[1] === 'number' &&
               !isNaN(coord[0]) && 
               !isNaN(coord[1])
      })
      
      if (validCoordinates.length === 0) {
        console.warn("No valid coordinates found in GeoJSON")
        return null
      }
      
      console.log(`Parsed route with ${validCoordinates.length} valid coordinates`)
      console.log("First coordinate:", validCoordinates[0])
      console.log("Last coordinate:", validCoordinates[validCoordinates.length - 1])
      
      return {
        coordinates: validCoordinates,
        distance: geoJSON.metadata?.distance || "0 km",
        duration: geoJSON.metadata?.duration || "0 min",
        summary: geoJSON.metadata?.summary || "Route"
      }
    }
    
    console.warn("Invalid GeoJSON structure - not a LineString Feature")
    return null
  } catch (error) {
    console.error("Error parsing route GeoJSON:", error)
    return null
  }
}

// Fixed: Create RouteData from parsed GeoJSON with better error handling
export const createRouteDataFromParsed = (parsedRoute: ParsedRouteData, rider: ProcessedRider): RouteData => {
  // Convert distance string to number (assuming format like "5.2 km")
  const distanceMatch = parsedRoute.distance.match(/(\d+\.?\d*)/);
  const distanceNum = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
  
  // Convert duration string to seconds (assuming format like "15 min" or "1h 30min")
  let durationSeconds = 0
  const durationStr = parsedRoute.duration.toLowerCase()
  
  if (durationStr.includes('h')) {
    const hoursMatch = durationStr.match(/(\d+)h/)
    const minutesMatch = durationStr.match(/(\d+)min/)
    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0
    const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0
    durationSeconds = (hours * 60 + minutes) * 60
  } else {
    const minutesMatch = durationStr.match(/(\d+\.?\d*)/)
    const minutes = minutesMatch ? parseFloat(minutesMatch[1]) : 0
    durationSeconds = minutes * 60
  }

  console.log(`Created route data: ${distanceNum}km, ${durationSeconds}s, ${parsedRoute.coordinates.length} points`)

  return {
    coordinates: parsedRoute.coordinates,
    distance: distanceNum,
    duration: durationSeconds,
    color: getStatusColor(rider.status),
    summary: parsedRoute.summary,
    legs: 1 // Default to 1 leg for database routes
  }
}

export const processRiders = (orders: OrderData[]): ProcessedRider[] => {
  const riderMap = new Map<string, ProcessedRider>()

  orders.forEach((order) => {
    if (order.rider) {
      const riderId = order.rider.id

      if (!riderMap.has(riderId)) {
        let position: { lat: number; lng: number }

        if (order.rider.coordinates && order.rider.coordinates.length >= 2) {
          position = {
            lat: order.rider.coordinates[1],
            lng: order.rider.coordinates[0],
          }
        } else {
          const hash = riderId.split("").reduce((a, b) => {
            a = (a << 5) - a + b.charCodeAt(0)
            return a & a
          }, 0)

          const latOffset = Math.sin(hash) * 0.1
          const lngOffset = Math.cos(hash) * 0.1

          position = {
            lat: 5.6037 + latOffset,
            lng: -0.187 + lngOffset,
          }
        }

        riderMap.set(riderId, {
          id: riderId,
          name: order.rider.name,
          status: getStatusFromOrders([order]),
          location: order.rider.location,
          orders: 0,
          rating: 4.5 + (Math.abs(riderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 10) / 20,
          phone: order.rider.number,
          vehicle: Math.random() > 0.5 ? "Motorcycle" : "Bicycle",
          lastActive: "Active now",
          earnings: "GH₵0",
          currentOrders: [],
          position: position,
          direction: Math.abs(riderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360,
        })
      }

      const rider = riderMap.get(riderId)!
      rider.currentOrders.push(order)
      rider.orders++

      const orderTotal = order.productInfor.reduce((total, item) => {
        const productPrice = Number.parseFloat(item.product[0]?.price || "0")
        return total + productPrice * item.quantity
      }, 0)
      const deliveryFee = order.deliveryMetaData?.price || 0
      const currentEarnings = Number.parseFloat(rider.earnings.replace("GH₵", ""))
      rider.earnings = `GH₵${(currentEarnings + orderTotal + deliveryFee).toFixed(2)}`

      rider.status = getStatusFromOrders(rider.currentOrders)

      // Extract route coordinates from order route data if available
      if (order.order.routeData?.geojson) {
        const parsedRoute = parseRouteGeoJSON(order.order.routeData.geojson)
        if (parsedRoute && !rider.routeCoordinates) {
          rider.routeCoordinates = parsedRoute.coordinates
        }
      }
    }
  })

  return Array.from(riderMap.values())
}

// Fixed: Extract rider routes from database with better logging
export const extractRiderRoutesFromOrders = (orders: OrderData[], riders: ProcessedRider[]): Map<string, RouteData> => {
  const riderRoutes = new Map<string, RouteData>()

  console.log(`Extracting routes for ${riders.length} riders from ${orders.length} orders`)

  riders.forEach((rider) => {
    // Find orders for this rider that have route data
    const riderOrders = orders.filter(order => order.rider?.id === rider.id && order.order.routeData?.geojson)
    
    console.log(`Rider ${rider.name}: found ${riderOrders.length} orders with route data`)
    
    if (riderOrders.length > 0) {
      // Use the first order's route data (or combine multiple routes if needed)
      const firstOrderWithRoute = riderOrders[0]
      console.log(`Processing route for order ${firstOrderWithRoute.orderId}`)
      
      const parsedRoute = parseRouteGeoJSON(firstOrderWithRoute.order.routeData!.geojson)
      
      if (parsedRoute) {
        const routeData = createRouteDataFromParsed(parsedRoute, rider)
        riderRoutes.set(rider.id, routeData)
        console.log(`Successfully created route for rider ${rider.name}`)
      } else {
        console.warn(`Failed to parse route for rider ${rider.name}`)
      }
    }
  })

  console.log(`Successfully extracted ${riderRoutes.size} routes`)
  return riderRoutes
}

export const addIsochronesToMap = (
  mapInstance: maplibregl.Map | null,
  mapLoaded: boolean,
  showIsochrones: boolean,
  orders: OrderData[]
) => {
  if (!mapInstance || !mapLoaded) return
  
  // Remove existing isochrone layers
  ;["isochrone-fill", "isochrone-outline"].forEach((layerId) => {
    if (mapInstance.getLayer(layerId)) {
      mapInstance.removeLayer(layerId)
    }
  })
  if (mapInstance.getSource("isochrones")) {
    mapInstance.removeSource("isochrones")
  }

  if (!showIsochrones) return

  const allFeatures: any[] = []

  orders.forEach((order) => {
    if (order.deliveryMetaData && order.deliveryMetaData.geojson) {
      try {
        const geojsonData = JSON.parse(order.deliveryMetaData.geojson)
        if (geojsonData.features) {
          geojsonData.features.forEach((feature: any) => {
            allFeatures.push({
              ...feature,
              properties: {
                ...feature.properties,
                zone: order.deliveryMetaData!.zone,
                price: order.deliveryMetaData!.price,
                vendorName: order.vendor.name,
                color: `hsl(${(order.deliveryMetaData!.zone * 60) % 360}, 70%, 60%)`,
              },
            })
          })
        }
      } catch (error) {
        console.warn("Failed to parse geojson for order:", order.orderId)
      }
    }
  })

  if (allFeatures.length > 0) {
    const isochroneGeoJSON = {
      type: "FeatureCollection",
      features: allFeatures,
    }

    mapInstance.addSource("isochrones", {
      type: "geojson",
      data: isochroneGeoJSON,
    })

    mapInstance.addLayer({
      id: "isochrone-fill",
      type: "fill",
      source: "isochrones",
      paint: {
        "fill-color": ["get", "color"],
        "fill-opacity": 0.1,
      },
    })

    mapInstance.addLayer({
      id: "isochrone-outline",
      type: "line",
      source: "isochrones",
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-opacity": 0.6,
        "line-dasharray": [3, 3],
      },
    })
  }
}

// Fixed: Add routes with better coordinate validation and debugging
export const addRiderRoutesToMap = (
  mapInstance: maplibregl.Map | null,
  mapLoaded: boolean,
  showRoutes: boolean,
  riderRoutes: Map<string, RouteData>,
  riders: ProcessedRider[],
  selectedRider: ProcessedRider | null,
  orders: OrderData[]
) => {
  if (!mapInstance || !mapLoaded) return

  console.log(`Adding routes to map: ${riderRoutes.size} Google routes, ${showRoutes ? 'showing' : 'hidden'}`)

  // Remove existing route layers
  riderRoutes.forEach((_, riderId) => {
    const layerId = `route-${riderId}`
    const arrowLayerId = `route-arrows-${riderId}`
    
    if (mapInstance.getLayer(layerId)) {
      mapInstance.removeLayer(layerId)
    }
    if (mapInstance.getSource(layerId)) {
      mapInstance.removeSource(layerId)
    }
    if (mapInstance.getLayer(arrowLayerId)) {
      mapInstance.removeLayer(arrowLayerId)
    }
    if (mapInstance.getSource(arrowLayerId)) {
      mapInstance.removeSource(arrowLayerId)
    }
  })

  // Also remove database route layers
  riders.forEach((rider) => {
    const dbLayerId = `db-route-${rider.id}`
    const dbArrowLayerId = `db-route-arrows-${rider.id}`
    
    if (mapInstance.getLayer(dbLayerId)) {
      mapInstance.removeLayer(dbLayerId)
    }
    if (mapInstance.getSource(dbLayerId)) {
      mapInstance.removeSource(dbLayerId)
    }
    if (mapInstance.getLayer(dbArrowLayerId)) {
      mapInstance.removeLayer(dbArrowLayerId)
    }
    if (mapInstance.getSource(dbArrowLayerId)) {
      mapInstance.removeSource(dbArrowLayerId)
    }
  })

  if (!showRoutes) return

  // Add routes from Google Directions (existing functionality)
  riderRoutes.forEach((routeData, riderId) => {
    const rider = riders.find((r) => r.id === riderId)
    if (!rider || !routeData.coordinates || routeData.coordinates.length === 0) return

    console.log(`Adding Google route for rider ${rider.name}: ${routeData.coordinates.length} points`)

    const routeGeoJSON = {
      type: "Feature",
      properties: {
        riderId: riderId,
        riderName: rider.name,
        status: rider.status,
        distance: routeData.distance,
        duration: routeData.duration,
        source: "google"
      },
      geometry: {
        type: "LineString",
        coordinates: routeData.coordinates,
      },
    }

    const layerId = `route-${riderId}`
    mapInstance.addSource(layerId, {
      type: "geojson",
      data: routeGeoJSON,
    })

    mapInstance.addLayer({
      id: layerId,
      type: "line",
      source: layerId,
      paint: {
        "line-color": routeData.color,
        "line-width": selectedRider?.id === riderId ? 5 : 3,
        "line-opacity": selectedRider?.id === riderId ? 1.0 : 0.7,
        "line-dasharray": selectedRider?.id === riderId ? [1, 0] : [4, 4],
      },
    })
  })

  // Add routes from database with enhanced debugging
  riders.forEach((rider) => {
    const riderOrders = orders.filter(order => order.rider?.id === rider.id && order.order.routeData?.geojson)
    
    if (riderOrders.length > 0) {
      const firstOrderWithRoute = riderOrders[0]
      console.log(`Processing database route for rider ${rider.name}, order ${firstOrderWithRoute.orderId}`)
      
      const parsedRoute = parseRouteGeoJSON(firstOrderWithRoute.order.routeData!.geojson)
      
      if (parsedRoute) {
        console.log(`Adding database route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`)
        console.log("Route bounds:", {
          start: parsedRoute.coordinates[0],
          end: parsedRoute.coordinates[parsedRoute.coordinates.length - 1]
        })
        
        const dbLayerId = `db-route-${rider.id}`
        
        const routeGeoJSON = {
          type: "Feature",
          properties: {
            riderId: rider.id,
            riderName: rider.name,
            status: rider.status,
            distance: parsedRoute.distance,
            duration: parsedRoute.duration,
            source: "database"
          },
          geometry: {
            type: "LineString",
            coordinates: parsedRoute.coordinates,
          },
        }

        try {
          mapInstance.addSource(dbLayerId, {
            type: "geojson",
            data: routeGeoJSON,
          })

          mapInstance.addLayer({
            id: dbLayerId,
            type: "line",
            source: dbLayerId,
            paint: {
              "line-color": getStatusColor(rider.status),
              "line-width": selectedRider?.id === rider.id ? 6 : 4,
              "line-opacity": selectedRider?.id === rider.id ? 1.0 : 0.8,
              "line-dasharray": [2, 2], // Different dash pattern for database routes
            },
          })

          console.log(`Successfully added database route layer ${dbLayerId}`)

          // Add direction arrows for selected rider
          if (selectedRider?.id === rider.id && parsedRoute.coordinates.length > 1) {
            const arrowLayerId = `db-route-arrows-${rider.id}`

            // Create arrow points along the route
            const arrowPoints = []
            const totalPoints = parsedRoute.coordinates.length
            const step = Math.max(1, Math.floor(totalPoints / 8)) // Show ~8 arrows

            for (let i = 0; i < totalPoints - 1; i += step) {
              const [lng1, lat1] = parsedRoute.coordinates[i]
              const [lng2, lat2] = parsedRoute.coordinates[i + 1]

              // Calculate bearing
              const bearing = Math.atan2(lng2 - lng1, lat2 - lat1) * (180 / Math.PI)

              arrowPoints.push({
                type: "Feature",
                properties: { bearing },
                geometry: {
                  type: "Point",
                  coordinates: [lng1, lat1],
                },
              })
            }

            if (arrowPoints.length > 0) {
              mapInstance.addSource(arrowLayerId, {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: arrowPoints,
                },
              })

              mapInstance.addLayer({
                id: arrowLayerId,
                type: "symbol",
                source: arrowLayerId,
                layout: {
                  "icon-image": "triangle-15",
                  "icon-rotate": ["get", "bearing"],
                  "icon-rotation-alignment": "map",
                  "icon-size": 0.8,
                  "symbol-spacing": 100,
                },
                paint: {
                  "icon-color": getStatusColor(rider.status),
                  "icon-opacity": 0.8,
                },
              })
            }
          }
        } catch (error) {
          console.error(`Error adding database route for rider ${rider.name}:`, error)
        }
      } else {
        console.warn(`Failed to parse database route for rider ${rider.name}`)
      }
    }
  })
}

export const createRiderMarkerElement = (
  rider: ProcessedRider,
  riderRoutes: Map<string, RouteData>,
  onRiderClick: (rider: ProcessedRider) => void,
  orders?: OrderData[] // Optional orders parameter
): HTMLDivElement => {
  const markerContainer = document.createElement("div")
  markerContainer.className = "rider-marker-container"
  markerContainer.style.cssText = `
    position: relative;
    cursor: pointer;
    width: 180px;
    height: 90px;
    transform: translate(-50%, -100%);
  `

  // Direction arrow with enhanced design
  const arrowElement = document.createElement("div")
  arrowElement.style.cssText = `
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%) rotate(${rider.direction}deg);
    color: ${getStatusColor(rider.status)};
    z-index: 15;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  `
  arrowElement.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1">
      <path d="M12 2l8 10-8-3-8 3z" />
    </svg>
  `

  // Main marker circle with vehicle icon
  const circleElement = document.createElement("div")
  circleElement.style.cssText = `
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: ${getStatusColor(rider.status)};
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
  `

  // Add vehicle icon
  const vehicleIcon = rider.vehicle === "Motorcycle" ? "🏍️" : "🚲"
  circleElement.innerHTML = `<span style="font-size: 10px;">${vehicleIcon}</span>`

  // Enhanced pulse for active riders
  if (rider.status === "On Delivery") {
    const pulseElement = document.createElement("div")
    pulseElement.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background-color: ${getStatusColor(rider.status)};
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      opacity: 0.5;
      z-index: 5;
    `
    markerContainer.appendChild(pulseElement)
  }

  // Enhanced tooltip with better styling and database route info
  const tooltipElement = document.createElement("div")
  tooltipElement.style.cssText = `
    position: absolute;
    top: 40px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    border: 1px solid #e2e8f0;
    padding: 10px 14px;
    min-width: 140px;
    z-index: 20;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    backdrop-filter: blur(10px);
  `

  const routeInfo = riderRoutes.get(rider.id)
  let routeText = ""
  
  // Check for Google route data first
  if (routeInfo) {
    routeText = `📍 ${routeInfo.distance.toFixed(1)}km • ${Math.round(routeInfo.duration / 60)}min`
  } else if (orders) {
    // Check for database route data
    const riderOrders = orders.filter(order => order.rider?.id === rider.id && order.order.routeData?.geojson)
    if (riderOrders.length > 0) {
      const firstOrderWithRoute = riderOrders[0]
      const parsedRoute = parseRouteGeoJSON(firstOrderWithRoute.order.routeData!.geojson)
      if (parsedRoute) {
        routeText = `🗺️ ${parsedRoute.distance} • ${parsedRoute.duration}`
      }
    }
  }

  tooltipElement.innerHTML = `
    <div class="text-xs font-semibold text-gray-900 text-center mb-1">
      ${vehicleIcon} ${rider.name}
    </div>
    <div class="text-xs text-center mb-1">
      <span class="px-2 py-1 rounded-full text-white font-medium" style="background-color: ${getStatusColor(rider.status)}; font-size: 10px;">
        ${rider.status}
      </span>
    </div>
    ${
      rider.status === "On Delivery"
        ? `<div class="text-xs text-blue-600 text-center font-medium mb-1">
        ${rider.currentOrders.length} order${rider.currentOrders.length !== 1 ? "s" : ""}
      </div>`
        : ""
    }
    ${routeText ? `<div class="text-xs text-gray-500 text-center">${routeText}</div>` : ""}
  `

  // Enhanced tooltip arrow
  const tooltipArrow = document.createElement("div")
  tooltipArrow.style.cssText = `
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: linear-gradient(145deg, #ffffff, #f8fafc);
    border-left: 1px solid #e2e8f0;
    border-top: 1px solid #e2e8f0;
  `
  tooltipElement.appendChild(tooltipArrow)

  markerContainer.appendChild(arrowElement)
  markerContainer.appendChild(circleElement)
  markerContainer.appendChild(tooltipElement)

  markerContainer.addEventListener("click", (e) => {
    e.stopPropagation()
    onRiderClick(rider)
  })

  return markerContainer
}

// Keep the existing setupDirectionsRequest function for Google Directions
export const setupDirectionsRequest = (
  rider: ProcessedRider,
  directionsService: google.maps.DirectionsService | null
): Promise<RouteData | null> => {
  return new Promise((resolve) => {
    if (!directionsService || !rider.currentOrders.length) {
      resolve(null)
      return
    }

    try {
      // Validate coordinates
      const riderLat = rider.position.lat
      const riderLng = rider.position.lng

      if (!riderLat || !riderLng || isNaN(riderLat) || isNaN(riderLng)) {
        throw new Error(`Invalid rider coordinates: ${riderLat}, ${riderLng}`)
      }

      // Create route waypoints - collect unique vendor locations
      const vendorLocations = new Map<string, { lat: number; lng: number }>()
      const customerLocations: { lat: number; lng: number; orderId: string }[] = []

      rider.currentOrders.forEach((order) => {
        // Add vendor location
        const vendorKey = order.vendor.id
        if (!vendorLocations.has(vendorKey)) {
          const vendorLat = order.vendor.coordinates[1]
          const vendorLng = order.vendor.coordinates[0]

          if (vendorLat && vendorLng && !isNaN(vendorLat) && !isNaN(vendorLng)) {
            vendorLocations.set(vendorKey, { lat: vendorLat, lng: vendorLng })
          }
        }

        // Add customer location
        const customerLat = order.order.coordinates[1]
        const customerLng = order.order.coordinates[0]

        if (customerLat && customerLng && !isNaN(customerLat) && !isNaN(customerLng)) {
          customerLocations.push({
            lat: customerLat,
            lng: customerLng,
            orderId: order.orderId,
          })
        }
      })

      if (vendorLocations.size === 0 && customerLocations.length === 0) {
        throw new Error("No valid waypoints found")
      }

      // Create waypoints array - vendors first, then customers
      const waypoints: google.maps.DirectionsWaypoint[] = []

      // Add vendor waypoints
      vendorLocations.forEach((location) => {
        waypoints.push({
          location: new google.maps.LatLng(location.lat, location.lng),
          stopover: true,
        })
      })

      // Add customer waypoints (except the last one which will be destination)
      const customerWaypoints = customerLocations.slice(0, -1)
      customerWaypoints.forEach((location) => {
        waypoints.push({
          location: new google.maps.LatLng(location.lat, location.lng),
          stopover: true,
        })
      })

      // Use last customer as destination, or first vendor if no customers
      let destination: google.maps.LatLng
      if (customerLocations.length > 0) {
        const lastCustomer = customerLocations[customerLocations.length - 1]
        destination = new google.maps.LatLng(lastCustomer.lat, lastCustomer.lng)
      } else {
        const firstVendor = Array.from(vendorLocations.values())[0]
        destination = new google.maps.LatLng(firstVendor.lat, firstVendor.lng)
      }

      const origin = new google.maps.LatLng(riderLat, riderLng)

      const request: google.maps.DirectionsRequest = {
        origin: origin,
        destination: destination,
        waypoints: waypoints.length > 0 ? waypoints : undefined,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: waypoints.length > 1,
        avoidHighways: false,
        avoidTolls: false,
      }

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          try {
            const route = result.routes[0]
            const coordinates: [number, number][] = []

            // Extract coordinates from all legs of the route
            route.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                step.path.forEach((point) => {
                  coordinates.push([point.lng(), point.lat()])
                })
              })
            })

            const totalDistance = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0) / 1000 // Convert to km
            const totalDuration = route.legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0) // In seconds

            const routeData: RouteData = {
              coordinates,
              distance: totalDistance,
              duration: totalDuration,
              color: getStatusColor(rider.status),
              summary: route.summary || `Route for ${rider.name}`,
              legs: route.legs.length,
            }

            resolve(routeData)
          } catch (error) {
            console.error(`Error processing route result for ${rider.name}:`, error)
            resolve(null)
          }
        } else {
          console.error(`Directions request failed for ${rider.name}:`, status)
          resolve(null)
        }
      })
    } catch (error) {
      console.error(`Error setting up directions request for rider ${rider.name}:`, error)
      resolve(null)
    }
  })
}