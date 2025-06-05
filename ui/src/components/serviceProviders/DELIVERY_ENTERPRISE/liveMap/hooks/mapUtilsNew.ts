// Fixed mapUtils.ts with ServiceData support
import type maplibregl from "maplibre-gl"
import type { ServiceData, ProcessedRider, RouteData, ParsedRouteData } from "../serviceDataAndTypes"

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

export const getStatusFromServices = (services: ServiceData[]): "Available" | "On Delivery" | "On Break" => {
  const activeServices = services.filter((service) => {
    if (service.type === 'ORDER' && service.orderData) {
      return service.orderData.status === "CONFIRMED" || service.orderData.status === "PREPARING" || service.orderData.status === "OUT_FOR_DELIVERY"
    }
    if (service.type === 'BOOKING' && service.bookingData) {
      return service.bookingData.isConfirmed === true
    }
    return false
  })

  if (activeServices.length > 0) {
    return "On Delivery"
  }
  return "Available"
}

// Updated processRiders function to handle ServiceData
export const processRiders = (serviceData: ServiceData[]): ProcessedRider[] => {
  const riderMap = new Map<string, ProcessedRider>()

  serviceData.forEach((service) => {
    if (service.rider) {
      const riderId = service.rider.id!

      if (!riderMap.has(riderId)) {
        let position: { lat: number; lng: number }

        if (service.rider.coordinates && service.rider.coordinates.length >= 2) {
          position = {
            lat: service.rider.coordinates[1],
            lng: service.rider.coordinates[0],
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
          name: service.rider.name,
          status: getStatusFromServices([service]),
          location: service.rider.location || "",
          orders: 0,
          bookings: 0,
          rating: 4.5 + (Math.abs(riderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 10) / 20,
          phone: service.rider.number,
          vehicle: Math.random() > 0.5 ? "Motorcycle" : "Bicycle",
          lastActive: "Active now",
          earnings: "GH₵0",
          currentOrders: [],
          currentBookings: [],
          position: position,
          direction: Math.abs(riderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 360,
        })
      }

      const rider = riderMap.get(riderId)!
      
      if (service.type === 'ORDER') {
        rider.currentOrders.push(service)
        rider.orders++

        // Calculate earnings from order
        if (service.orderData?.productInfor) {
          const orderTotal = service.orderData.productInfor.reduce((total, item) => {
            const productPrice = parseFloat(item.product[0]?.price || "0")
            return total + productPrice * item.quantity
          }, 0)
          const deliveryFee = service.orderData.deliveryMetaData?.price || 0
          const currentEarnings = parseFloat(rider.earnings.replace("GH₵", ""))
          rider.earnings = `GH₵${(currentEarnings + orderTotal + deliveryFee).toFixed(2)}`
        }
      } else if (service.type === 'BOOKING') {
        rider.currentBookings = rider.currentBookings || []
        rider.currentBookings.push(service)
        rider.bookings = (rider.bookings || 0) + 1

        // Calculate earnings from booking
        if (service.bookingData?.deliveryFee) {
          const bookingFee = parseFloat(service.bookingData.deliveryFee)
          const currentEarnings = parseFloat(rider.earnings.replace("GH₵", ""))
          rider.earnings = `GH₵${(currentEarnings + bookingFee).toFixed(2)}`
        }
      }

      // Update rider status based on current workload
      const allServices = [...rider.currentOrders, ...(rider.currentBookings || [])]
      rider.status = getStatusFromServices(allServices)

      // Extract route coordinates from service route data if available
      if (service.type === 'ORDER' && service.orderData?.routeData?.geojson) {
        const parsedRoute = parseRouteGeoJSON(service.orderData.routeData.geojson)
        if (parsedRoute && !rider.routeCoordinates) {
          rider.routeCoordinates = parsedRoute.coordinates
        }
      } else if (service.type === 'BOOKING' && service.bookingData?.routeData?.geojson) {
        const parsedRoute = parseRouteGeoJSON(service.bookingData.routeData.geojson)
        if (parsedRoute && !rider.routeCoordinates) {
          rider.routeCoordinates = parsedRoute.coordinates
        }
      }
    }
  })

  return Array.from(riderMap.values())
}

// Updated addIsochronesToMap to handle ServiceData
export const addIsochronesToMap = (
  mapInstance: maplibregl.Map | null,
  mapLoaded: boolean,
  showIsochrones: boolean,
  serviceData: ServiceData[],
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

  serviceData.forEach((service) => {
    // Only process isochrones from order data (deliveryMetaData)
    if (service.type === 'ORDER' && service.orderData?.deliveryMetaData?.geojson) {
      try {
        const geojsonData = JSON.parse(service.orderData.deliveryMetaData.geojson)
        if (geojsonData.features) {
          geojsonData.features.forEach((feature: any) => {
            allFeatures.push({
              ...feature,
              properties: {
                ...feature.properties,
                zone: service.orderData!.deliveryMetaData!.zone,
                price: service.orderData!.deliveryMetaData!.price,
                vendorName: service.vendor.name,
                color: `hsl(${(service.orderData!.deliveryMetaData!.zone * 60) % 360}, 70%, 60%)`,
              },
            })
          })
        }
      } catch (error) {
        console.warn("Failed to parse geojson for service:", service.id)
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

// Updated addRiderRoutesToMap to handle ServiceData
export const addRiderRoutesToMap = (
  mapInstance: maplibregl.Map | null,
  mapLoaded: boolean,
  showRoutes: boolean,
  riderRoutes: Map<string, RouteData>,
  riders: ProcessedRider[],
  selectedRider: ProcessedRider | null,
  serviceData: ServiceData[],
) => {
  if (!mapInstance || !mapLoaded) return

  console.log(`Adding routes to map: ${riderRoutes.size} Google routes, ${showRoutes ? "showing" : "hidden"}`)

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
        source: "google",
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
    const riderServices = serviceData.filter((service) => service.rider?.id === rider.id)
    const servicesWithRoutes = riderServices.filter((service) => {
      if (service.type === 'ORDER') {
        return service.orderData?.routeData?.geojson
      } else if (service.type === 'BOOKING') {
        return service.bookingData?.routeData?.geojson
      }
      return false
    })

    if (servicesWithRoutes.length > 0) {
      const firstServiceWithRoute = servicesWithRoutes[0]
      console.log(`Processing database route for rider ${rider.name}, service ${firstServiceWithRoute.id}`)

      let routeGeoJSON = null
      if (firstServiceWithRoute.type === 'ORDER' && firstServiceWithRoute.orderData?.routeData?.geojson) {
        routeGeoJSON = firstServiceWithRoute.orderData.routeData.geojson
      } else if (firstServiceWithRoute.type === 'BOOKING' && firstServiceWithRoute.bookingData?.routeData?.geojson) {
        routeGeoJSON = firstServiceWithRoute.bookingData.routeData.geojson
      }

      if (routeGeoJSON) {
        const parsedRoute = parseRouteGeoJSON(routeGeoJSON)

        if (parsedRoute) {
          console.log(`Adding database route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`)
          console.log("Route bounds:", {
            start: parsedRoute.coordinates[0],
            end: parsedRoute.coordinates[parsedRoute.coordinates.length - 1],
          })

          const dbLayerId = `db-route-${rider.id}`

          const routeGeoJSONFeature = {
            type: "Feature",
            properties: {
              riderId: rider.id,
              riderName: rider.name,
              status: rider.status,
              distance: parsedRoute.distance,
              duration: parsedRoute.duration,
              source: "database",
              serviceType: firstServiceWithRoute.type,
            },
            geometry: {
              type: "LineString",
              coordinates: parsedRoute.coordinates,
            },
          }

          try {
            mapInstance.addSource(dbLayerId, {
              type: "geojson",
              data: routeGeoJSONFeature,
            })

            // Different colors for different service types
            const routeColor = firstServiceWithRoute.type === 'BOOKING' ? '#8B5CF6' : getStatusColor(rider.status)

            mapInstance.addLayer({
              id: dbLayerId,
              type: "line",
              source: dbLayerId,
              paint: {
                "line-color": routeColor,
                "line-width": selectedRider?.id === rider.id ? 6 : 4,
                "line-opacity": selectedRider?.id === rider.id ? 1.0 : 0.8,
                "line-dasharray": firstServiceWithRoute.type === 'BOOKING' ? [3, 3] : [2, 2],
              },
            })

            console.log(`Successfully added database route layer ${dbLayerId}`)
          } catch (error) {
            console.error(`Error adding database route for rider ${rider.name}:`, error)
          }
        } else {
          console.warn(`Failed to parse database route for rider ${rider.name}`)
        }
      }
    }
  })
}

// Updated createRiderMarkerElement to handle ServiceData
export const createRiderMarkerElement = (
  rider: ProcessedRider,
  riderRoutes: Map<string, RouteData>,
  onRiderClick: (rider: ProcessedRider) => void,
  serviceData?: ServiceData[],
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
    padding: 2px 7px;
    min-width: fit-content;
    z-index: 20;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    backdrop-filter: blur(10px);
  `

  const routeInfo = riderRoutes.get(rider.id)
  let routeText = ""

  // Check for Google route data first
  if (routeInfo) {
    routeText = `📍 ${routeInfo.distance.toFixed(1)}km • ${Math.round(routeInfo.duration / 60)}min`
  } else if (serviceData) {
    // Check for database route data
    const riderServices = serviceData.filter((service) => service.rider?.id === rider.id)
    const serviceWithRoute = riderServices.find((service) => {
      if (service.type === 'ORDER') {
        return service.orderData?.routeData?.geojson
      } else if (service.type === 'BOOKING') {
        return service.bookingData?.routeData?.geojson
      }
      return false
    })

    if (serviceWithRoute) {
      let routeGeoJSON = null
      if (serviceWithRoute.type === 'ORDER' && serviceWithRoute.orderData?.routeData?.geojson) {
        routeGeoJSON = serviceWithRoute.orderData.routeData.geojson
      } else if (serviceWithRoute.type === 'BOOKING' && serviceWithRoute.bookingData?.routeData?.geojson) {
        routeGeoJSON = serviceWithRoute.bookingData.routeData.geojson
      }

      if (routeGeoJSON) {
        const parsedRoute = parseRouteGeoJSON(routeGeoJSON)
        if (parsedRoute) {
          const icon = serviceWithRoute.type === 'BOOKING' ? '📅' : '🗺️'
          routeText = `${icon} ${parsedRoute.distance} • ${parsedRoute.duration}`
        }
      }
    }
  }

  // Count total services
  const totalOrders = rider.currentOrders.length
  const totalBookings = rider.currentBookings?.length || 0
  const totalServices = totalOrders + totalBookings

  tooltipElement.innerHTML = `
    <div class="text-xs font-extralight text-gray-900 text-center ">
       ${rider.name}
    </div>
  
   
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

// Keep existing functions for parsing route data
export const parseRouteGeoJSON = (geojsonString: string): ParsedRouteData | null => {
  try {
    const geoJSON = JSON.parse(geojsonString)

    if (geoJSON.type === "Feature" && geoJSON.geometry?.type === "LineString") {
      const coordinates = geoJSON.geometry.coordinates

      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn("Invalid coordinates array in GeoJSON")
        return null
      }

      const validCoordinates = coordinates.filter((coord: any) => {
        return (
          Array.isArray(coord) &&
          coord.length >= 2 &&
          typeof coord[0] === "number" &&
          typeof coord[1] === "number" &&
          !isNaN(coord[0]) &&
          !isNaN(coord[1])
        )
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
        summary: geoJSON.metadata?.summary || "Route",
      }
    }

    console.warn("Invalid GeoJSON structure - not a LineString Feature")
    return null
  } catch (error) {
    console.error("Error parsing route GeoJSON:", error)
    return null
  }
}

export const createRouteDataFromParsed = (parsedRoute: ParsedRouteData, rider: ProcessedRider): RouteData => {
  const distanceMatch = parsedRoute.distance.match(/(\d+\.?\d*)/)
  const distanceNum = distanceMatch ? parseFloat(distanceMatch[1]) : 0

  let durationSeconds = 0
  const durationStr = parsedRoute.duration.toLowerCase()

  if (durationStr.includes("h")) {
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
    legs: 1,
  }
}

// Updated setupDirectionsRequest to handle both orders and bookings
export const setupDirectionsRequest = (
  rider: ProcessedRider,
  directionsService: google.maps.DirectionsService | null,
): Promise<RouteData | null> => {
  return new Promise((resolve) => {
    if (!directionsService || (!rider.currentOrders.length && !(rider.currentBookings?.length))) {
      resolve(null)
      return
    }

    try {
      const riderLat = rider.position.lat
      const riderLng = rider.position.lng

      if (!riderLat || !riderLng || isNaN(riderLat) || isNaN(riderLng)) {
        throw new Error(`Invalid rider coordinates: ${riderLat}, ${riderLng}`)
      }

      const waypoints: google.maps.DirectionsWaypoint[] = []
      let destination: google.maps.LatLng | null = null

      // Process orders
      rider.currentOrders.forEach((service) => {
        if (service.type === 'ORDER' && service.orderData) {
          // Add vendor location
          if (service.vendor?.coordinates) {
            waypoints.push({
              location: new google.maps.LatLng(service.vendor.coordinates[1], service.vendor.coordinates[0]),
              stopover: true,
            })
          }

          // Set customer location as potential destination
          if (service.orderData.order?.coordinates) {
            destination = new google.maps.LatLng(service.orderData.order.coordinates[1], service.orderData.order.coordinates[0])
          }
        }
      })

      // Process bookings
      rider.currentBookings?.forEach((service) => {
        if (service.type === 'BOOKING' && service.bookingData) {
          // Add pickup location
          if (service.bookingData.pickupLocation) {
            waypoints.push({
              location: new google.maps.LatLng(service.bookingData.pickupLocation[1], service.bookingData.pickupLocation[0]),
              stopover: true,
            })
          }

          // Set dropoff location as potential destination
          if (service.bookingData.dropoffLocation) {
            destination = new google.maps.LatLng(service.bookingData.dropoffLocation[1], service.bookingData.dropoffLocation[0])
          }
        }
      })

      if (!destination) {
        throw new Error("No valid destination found")
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

            route.legs.forEach((leg) => {
              leg.steps.forEach((step) => {
                step.path.forEach((point) => {
                  coordinates.push([point.lng(), point.lat()])
                })
              })
            })

            const totalDistance = route.legs.reduce((total, leg) => total + (leg.distance?.value || 0), 0) / 1000
            const totalDuration = route.legs.reduce((total, leg) => total + (leg.duration?.value || 0), 0)

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