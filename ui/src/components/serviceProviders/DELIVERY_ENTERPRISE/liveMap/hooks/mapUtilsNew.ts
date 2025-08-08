// Fixed mapUtils.ts with ServiceData support
import maplibregl from "maplibre-gl"
import type { ServiceData, ProcessedRider, RouteData, ParsedRouteData } from "../serviceDataAndTypes"
import { ZONE_COLORS } from "@/components/config/map"

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
      if (service.type === 'REQUESTITEM' && service.requestItemData) {
      return service.requestItemData.isConfirmed === true
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
          requestItems: 0,
          rating: 4.5 + (Math.abs(riderId.split("").reduce((a, b) => a + b.charCodeAt(0), 0)) % 10) / 20,
          phone: service.rider.number,
          vehicle: Math.random() > 0.5 ? "Motorcycle" : "Bicycle",
          lastActive: "Active now",
          earnings: "GH₵0",
          currentOrders: [],
          currentBookings: [],
          currentRequestItems: [],
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
      } else if (service.type === 'REQUESTITEM') {
        // Add REQUEST_ITEM handling
        rider.currentRequestItems = rider.currentRequestItems || []
        rider.currentRequestItems.push(service)
        rider.requestItems = (rider.requestItems || 0) + 1

        // Calculate earnings from request item
        if (service.requestItemData?.deliveryFee) {
          const requestFee = parseFloat(service.requestItemData.deliveryFee)
          const currentEarnings = parseFloat(rider.earnings.replace("GH₵", ""))
          rider.earnings = `GH₵${(currentEarnings + requestFee).toFixed(2)}`
        }
        
        // Also calculate from item price if available
        if (service.requestItemData?.requestItem?.price) {
          const itemPrice = parseFloat(service.requestItemData.requestItem.price)
          const quantity = service.requestItemData.requestItem.quantity || 1
          const currentEarnings = parseFloat(rider.earnings.replace("GH₵", ""))
          rider.earnings = `GH₵${(currentEarnings + (itemPrice * quantity)).toFixed(2)}`
        }
      }


      // Update rider status based on current workload
           const allServices = [
        ...rider.currentOrders, 
        ...(rider.currentBookings || []),
        ...(rider.currentRequestItems || [])
      ]

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
      }else if (service.type === 'REQUESTITEM' && service.requestItemData?.routeData?.geojson) {
        // Add route handling for request items
        const parsedRoute = parseRouteGeoJSON(service.requestItemData.routeData.geojson)
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

  // Remove existing route layers (both Google and database routes)
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

  // Remove all database route layers (including multigroup routes)
  riders.forEach((rider) => {
    // Get all services for this rider to clean up all possible route layers
    const riderServices = serviceData.filter((service) => service.rider?.id === rider.id)
    
    // Clean up individual service route layers
    riderServices.forEach((service, index) => {
      const serviceLayerId = `db-route-${rider.id}-service-${index}`
      const serviceArrowLayerId = `db-route-arrows-${rider.id}-service-${index}`

      if (mapInstance.getLayer(serviceLayerId)) {
        mapInstance.removeLayer(serviceLayerId)
      }
      if (mapInstance.getSource(serviceLayerId)) {
        mapInstance.removeSource(serviceLayerId)
      }
      if (mapInstance.getLayer(serviceArrowLayerId)) {
        mapInstance.removeLayer(serviceArrowLayerId)
      }
      if (mapInstance.getSource(serviceArrowLayerId)) {
        mapInstance.removeSource(serviceArrowLayerId)
      }
    })

    // Also clean up the old single route layers
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

  // ENHANCED: Add routes from database - show ALL routes for multigroup bookings
  riders.forEach((rider) => {
    const riderServices = serviceData.filter((service) => service.rider?.id === rider.id)
    const servicesWithRoutes = riderServices.filter((service) => {
      if (service.type === 'ORDER') {
        return service.orderData?.routeData?.geojson
      } else if (service.type === 'BOOKING') {
        return service.bookingData?.routeData?.geojson
      }else if (service.type === 'REQUESTITEM') {
        return service.requestItemData?.routeData?.geojson
      }
      
      return false
    })

    if (servicesWithRoutes.length === 0) return

    // console.log(`Processing ${servicesWithRoutes.length} database routes for rider ${rider.name}`)

    // Check if we have multigroup bookings
    const multiGroupServices = servicesWithRoutes.filter(service => 
      service.type === 'BOOKING' && service.bookingData?.multiGroupId
    )

    const hasMultiGroup = multiGroupServices.length > 0
    
    if (hasMultiGroup) {
      console.log(`Rider ${rider.name} has ${multiGroupServices.length} multigroup bookings - showing all routes`)
      
      // For multigroup bookings, show ALL routes
      servicesWithRoutes.forEach((service, index) => {
        let routeGeoJSON = null
        let serviceType = service.type
        
        if (service.type === 'ORDER' && service.orderData?.routeData?.geojson) {
          routeGeoJSON = service.orderData.routeData.geojson
        } else if (service.type === 'BOOKING' && service.bookingData?.routeData?.geojson) {
          routeGeoJSON = service.bookingData.routeData.geojson
        }

        if (routeGeoJSON) {
          const parsedRoute = parseRouteGeoJSON(routeGeoJSON)

          if (parsedRoute) {
            console.log(`Adding database route ${index + 1}/${servicesWithRoutes.length} for rider ${rider.name}: ${parsedRoute.coordinates.length} points`)

            const serviceLayerId = `db-route-${rider.id}-service-${index}`

          
          
            const routeColor = serviceType === 'BOOKING' 
              ? ZONE_COLORS[index % ZONE_COLORS.length] 
              : getStatusColor(rider.status)

            const routeGeoJSONFeature = {
              type: "Feature",
              properties: {
                riderId: rider.id,
                riderName: rider.name,
                status: rider.status,
                distance: parsedRoute.distance,
                duration: parsedRoute.duration,
                source: "database",
                serviceType: serviceType,
                serviceIndex: index,
                isMultiGroup: hasMultiGroup,
                multiGroupId: service.type === 'BOOKING' ? service.bookingData?.multiGroupId : null,
                bookingId: service.type === 'BOOKING' ? service.bookingData?.bookingId : null,
                orderId: service.type === 'ORDER' ? service.orderData?.orderId : null,
                requestId: service.type === 'REQUESTITEM' ? service.requestItemData?.requestId : null,
                
              },
              geometry: {
                type: "LineString",
                coordinates: parsedRoute.coordinates,
              },
            }

            try {
              mapInstance.addSource(serviceLayerId, {
                type: "geojson",
                data: routeGeoJSONFeature,
              })

              // Different line styles for multigroup routes
              const lineWidth = selectedRider?.id === rider.id ? 5 : 3
              const lineOpacity = selectedRider?.id === rider.id ? 0.9 : 0.7
              
              // Use different dash patterns for each route in multigroup
              const dashPatterns = [
                [1, 0],     // Solid
                [5, 5],     // Dashed
                [2, 3],     // Dotted
                [8, 3, 2, 3], // Dash-dot
                [1, 2],     // Fine dotted
                [10, 5],    // Long dash
                [5, 5, 1, 5], // Dash-dot-dot
                [3, 3, 1, 3, 1, 3], // Complex pattern
              ]

              mapInstance.addLayer({
                id: serviceLayerId,
                type: "line",
                source: serviceLayerId,
                paint: {
                  "line-color": routeColor,
                  "line-width": lineWidth,
                  "line-opacity": lineOpacity,
                  "line-dasharray": hasMultiGroup 
                    ? dashPatterns[index % dashPatterns.length]
                    : (serviceType === 'BOOKING' ? [3, 3] : [2, 2]),
                },
              })

              console.log(`Successfully added database route layer ${serviceLayerId} with color ${routeColor}`)
            } catch (error) {
              console.error(`Error adding database route ${index} for rider ${rider.name}:`, error)
            }
          } else {
            console.warn(`Failed to parse database route ${index} for rider ${rider.name}`)
          }
        }
      })
      
    } else {
      // For non-multigroup services, show only the first route (original behavior)
      const firstServiceWithRoute = servicesWithRoutes[0]
      console.log(`Processing single database route for rider ${rider.name}, service ${firstServiceWithRoute.id}`)

      let routeGeoJSON = null
      if (firstServiceWithRoute.type === 'ORDER' && firstServiceWithRoute.orderData?.routeData?.geojson) {
        routeGeoJSON = firstServiceWithRoute.orderData.routeData.geojson
      } else if (firstServiceWithRoute.type === 'BOOKING' && firstServiceWithRoute.bookingData?.routeData?.geojson) {
        routeGeoJSON = firstServiceWithRoute.bookingData.routeData.geojson
      } else if (firstServiceWithRoute.type === 'REQUESTITEM' && firstServiceWithRoute.requestItemData?.routeData?.geojson) {
        routeGeoJSON = firstServiceWithRoute.requestItemData.routeData.geojson
      }

      if (routeGeoJSON) {
        const parsedRoute = parseRouteGeoJSON(routeGeoJSON)

        if (parsedRoute) {
          console.log(`Adding single database route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`)

          const dbLayerId = `db-route-${rider.id}`
          const routeColor = firstServiceWithRoute.type === 'BOOKING' ? '#8B5CF6' : getStatusColor(rider.status)


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

            console.log(`Successfully added single database route layer ${dbLayerId}`)
          } catch (error) {
            console.error(`Error adding single database route for rider ${rider.name}:`, error)
          }
        } else {
          console.warn(`Failed to parse single database route for rider ${rider.name}`)
        }
      }
    }
  })
}


// Updated createRiderMarkerElement to handle ServiceData
// Enhanced createRiderMarkerElement to show location names

const createEnhancedPopup = (markerData: {
  title: string;
  subtitle?: string;
  location?: string;
  coordinates?: [number, number];
  type: 'rider' | 'vendor' | 'customer' | 'pickup' | 'dropoff';
  extraInfo?: string;
  isFiltered?: boolean;
}) => {
  return new maplibregl.Popup({
    offset: 25,
    className: "custom-popup enhanced-popup",
    closeOnClick: true,
    closeButton: true,
  }).setHTML(`
    <div class="p-4 bg-white rounded-lg shadow-xl border max-w-xs">
      <div class="flex items-start gap-3 mb-3">
        <div class="flex-shrink-0">
          ${getMarkerIcon(markerData.type)}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-gray-900 text-sm leading-tight">
            ${markerData.title}
          </h3>
          ${markerData.subtitle ? `
            <p class="text-xs text-gray-600 mt-1">${markerData.subtitle}</p>
          ` : ''}
        </div>
      </div>
      
      ${markerData.location ? `
        <div class="bg-blue-50 rounded-lg p-3 mb-3">
          <div class="flex items-start gap-2">
            <span class="text-blue-600 text-sm">📍</span>
            <div class="flex-1">
              <div class="text-xs text-blue-600 font-medium mb-1">Location</div>
              <div class="text-sm text-blue-900 font-medium leading-relaxed">${markerData.location}</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${markerData.coordinates ? `
        <div class="bg-gray-50 rounded-lg p-3 mb-3">
          <div class="flex items-center gap-2">
            <span class="text-gray-600 text-sm">🗺️</span>
            <div class="flex-1">
              <div class="text-xs text-gray-500 font-medium mb-1">Coordinates</div>
              <div class="text-xs text-gray-700 font-mono">
                ${markerData.coordinates[1].toFixed(6)}, ${markerData.coordinates[0].toFixed(6)}
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${markerData.extraInfo ? `
        <div class="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-2">
          ${markerData.extraInfo}
        </div>
      ` : ''}
      
      <div class="flex items-center justify-between pt-2 border-t border-gray-100">
        <span class="text-xs font-medium px-2 py-1 rounded ${getTypeColor(markerData.type)}">
          ${markerData.type.charAt(0).toUpperCase() + markerData.type.slice(1)}
        </span>
        ${markerData.isFiltered ? `
          <span class="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
            🎯 Filtered
          </span>
        ` : ''}
      </div>
    </div>
  `);
};

// Helper function to get marker icons
const getMarkerIcon = (type: string): string => {
  switch (type) {
    case 'rider': return '<div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">R</div>';
    case 'vendor': return '<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">🏪</div>';
    case 'customer': return '<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-lg">👤</div>';
    case 'pickup': return '<div class="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-lg">📍</div>';
    case 'dropoff': return '<div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-lg">🎯</div>';
    default: return '<div class="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-lg">📍</div>';
  }
};

// Helper function to get type colors
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'rider': return 'bg-blue-100 text-blue-700';
    case 'vendor': return 'bg-green-100 text-green-700';
    case 'customer': return 'bg-red-100 text-red-700';
    case 'pickup': return 'bg-purple-100 text-purple-700';
    case 'dropoff': return 'bg-indigo-100 text-indigo-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};


export const createRiderMarkerElement = (
  rider: ProcessedRider,
  riderRoutes: Map<string, RouteData>,
  onRiderClick: (rider: ProcessedRider) => void,
  serviceData?: ServiceData[],
  showFilteredIndicator?: boolean,
): HTMLDivElement => {
  const markerContainer = document.createElement("div")
  markerContainer.className = "rider-marker-container"
  markerContainer.style.cssText = `
    position: relative;
    cursor: pointer;
    width: 40px;
    height: 40px;
    transform: translate(-50%, -50%);
  `

  // Main marker circle with vehicle icon
  const circleElement = document.createElement("div")
  const baseSize = showFilteredIndicator ? 32 : 28
  circleElement.style.cssText = `
    width: ${baseSize}px;
    height: ${baseSize}px;
    border-radius: 50%;
    background-color: ${getStatusColor(rider.status)};
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    ${showFilteredIndicator ? 'border-color: #3B82F6; border-width: 4px;' : ''}
  `

  // Add vehicle icon
  const vehicleIcon = rider.vehicle === "Motorcycle" ? "🏍️" : "🚲"
  circleElement.innerHTML = `<span style="font-size: ${showFilteredIndicator ? '14px' : '12px'};">${vehicleIcon}</span>`

  // Enhanced pulse for active riders
  if (rider.status === "On Delivery") {
    const pulseElement = document.createElement("div")
    pulseElement.style.cssText = `
      width: ${baseSize}px;
      height: ${baseSize}px;
      border-radius: 50%;
      background-color: ${getStatusColor(rider.status)};
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      opacity: 0.5;
      z-index: 5;
    `
    markerContainer.appendChild(pulseElement)
  }

  markerContainer.appendChild(circleElement)

  // Add hover effects
  markerContainer.addEventListener("mouseenter", () => {
    circleElement.style.transform = "translate(-50%, -50%) scale(1.1)"
  })

  markerContainer.addEventListener("mouseleave", () => {
    circleElement.style.transform = "translate(-50%, -50%) scale(1)"
  })

  // Click handler for detailed info
  markerContainer.addEventListener("click", (e) => {
    e.stopPropagation()
    onRiderClick(rider)
  })

  return markerContainer
}

// Function to create vendor/customer markers with enhanced popups
export const createServiceMarker = (
  coordinates: [number, number],
  markerData: {
    title: string;
    subtitle?: string;
    location?: string;
    type: 'vendor' | 'customer' | 'pickup' | 'dropoff';
    extraInfo?: string;
    color: string;
    scale?: number;
  },
  isFiltered: boolean = false
): maplibregl.Marker => {
  const popup = createEnhancedPopup({
    ...markerData,
    coordinates,
    isFiltered
  });

  return new maplibregl.Marker({
    color: markerData.color,
    scale: markerData.scale || (isFiltered ? 1.3 : 1.0),
  })
    .setLngLat(coordinates)
    .setPopup(popup);
};

// Updated markers creation function for your useEffect
export const createAllMarkersWithLocations = (
  mapInstance: maplibregl.Map,
  serviceData: ServiceData[],
  riders: ProcessedRider[],
  riderRoutes: Map<string, RouteData>,
  handleRiderClick: (rider: ProcessedRider) => void,
  showOnlyRelevant: boolean = false,
  selectedEntity: any = null
) => {
  const markers: maplibregl.Marker[] = [];

  // Determine what data to show
  let servicesToShow = serviceData;
  let ridersToShow = riders;

  if (showOnlyRelevant && selectedEntity) {
    servicesToShow = selectedEntity.relatedData.services || [];
    ridersToShow = selectedEntity.relatedData.riders || [];
  }

  const addedVendors = new Set();
  const addedPickupDropoff = new Set(); // Track pickup/dropoff to avoid duplicates

  // Add vendor/customer markers for relevant services
  servicesToShow.forEach((service, serviceIndex) => {
    if (service.type === "ORDER" && service.orderData) {
      const order = service.orderData;
      if (!service.vendor?.coordinates || !order.order?.coordinates) return;

      const vendorKey = `${service.vendor.id}-${service.vendor.coordinates[0]}-${service.vendor.coordinates[1]}`;
      if (!addedVendors.has(vendorKey)) {
        addedVendors.add(vendorKey);

        // Vendor marker with enhanced popup
        const vendorMarker = createServiceMarker(
          service.vendor.coordinates,
          {
            title: service.vendor.name,
            location: service.vendor.location,
            type: 'vendor',
            color: "#10B981",
            extraInfo: `Order #${service.orderData.orderId.slice(-6)} • ${service.customer.name}`
          },
          showOnlyRelevant
        );

        vendorMarker.addTo(mapInstance);
        markers.push(vendorMarker);

        // Customer marker with enhanced popup
        const customerMarker = createServiceMarker(
          order.order.coordinates,
          {
            title: service.customer.name,
            subtitle: `Order #${service.orderData.orderId.slice(-6)}`,
            location: order.order.deliveryAddress,
            type: 'customer',
            color: "#EF4444",
            extraInfo: `Distance: ${order.order.distance || 'N/A'} • Duration: ${order.order.duration || 'N/A'}`
          },
          showOnlyRelevant
        );

        customerMarker.addTo(mapInstance);
        markers.push(customerMarker);
      }
    } else if (service.type === "BOOKING" && service.bookingData) {
      const booking = service.bookingData;
      
      // Create unique keys for pickup/dropoff locations to handle multigroup properly
      const pickupKey = booking.pickupLocation 
        ? `pickup-${booking.pickupLocation[0]}-${booking.pickupLocation[1]}-${booking.bookingId}`
        : null;
      const dropoffKey = booking.dropoffLocation 
        ? `dropoff-${booking.dropoffLocation[0]}-${booking.dropoffLocation[1]}-${booking.bookingId}`
        : null;

      // Pickup marker (unique per booking)
      if (booking.pickupLocation && pickupKey && !addedPickupDropoff.has(pickupKey)) {
        addedPickupDropoff.add(pickupKey);
        
        // Enhanced popup info for multigroup
        let extraInfo = ` ${booking.tableSize}   ${booking.tableSize === 1 ? 'item' : 'items'} for
 • ${booking.day}`;
        if (booking.multiGroupId) {
          extraInfo += ` • Multi-Group #${booking.multiGroupId.slice(-6)}`;
        }

        const pickupMarker = createServiceMarker(
          booking.pickupLocation,
          {
            title: "Pickup Location",
            subtitle: `${service.customer.name} • Booking #${booking.bookingId.slice(-6)}`,
            location: booking.pickUpAddress || "Pickup location",
            type: 'pickup',
            color: "#8B5CF6",
            extraInfo: extraInfo,
            scale: booking.multiGroupId ? 1.2 : 1.0 // Slightly larger for multigroup
          },
          showOnlyRelevant || !!booking.multiGroupId
        );

        pickupMarker.addTo(mapInstance);
        markers.push(pickupMarker);
      }

      // Dropoff marker (unique per booking)
      if (booking.dropoffLocation && dropoffKey && !addedPickupDropoff.has(dropoffKey)) {
        addedPickupDropoff.add(dropoffKey);
        
        // Enhanced popup info for multigroup
        let extraInfo = `${booking.startTime ? new Date(booking.startTime).toLocaleTimeString() : ''} - ${booking.endTime ? new Date(booking.endTime).toLocaleTimeString() : ''}`;
        if (booking.multiGroupId) {
          extraInfo += ` • Multi-Group #${booking.multiGroupId.slice(-6)}`;
        }

        const dropoffMarker = createServiceMarker(
          booking.dropoffLocation,
          {
            title: "Dropoff Location",
            subtitle: `${service.customer.name} • Booking #${booking.bookingId.slice(-6)}`,
            location: booking.deliveryAddress || "Dropoff location",
            type: 'dropoff',
            color: "#7C3AED",
            extraInfo: extraInfo,
            scale: booking.multiGroupId ? 1.2 : 1.0 // Slightly larger for multigroup
          },
          showOnlyRelevant || !!booking.multiGroupId
        );

        dropoffMarker.addTo(mapInstance);
        markers.push(dropoffMarker);
      }
    }else if (service.type === "REQUESTITEM" && service.requestItemData) {
      // Handle REQUEST_ITEM markers
      const requestData = service.requestItemData;
      const requestItem = requestData.requestItem;
      
      // Create unique keys for request item pickup/dropoff locations
      const requestPickupKey = requestItem?.pickupLocation 
        ? `request-pickup-${requestItem.pickupLocation[0]}-${requestItem.pickupLocation[1]}-${requestData.requestId}`
        : null;
      const requestDropoffKey = requestItem?.dropoffLocation 
        ? `request-dropoff-${requestItem.dropoffLocation[0]}-${requestItem.dropoffLocation[1]}-${requestData.requestId}`
        : null;

      // Request item pickup marker
      if (requestItem?.pickupLocation && requestPickupKey && !addedPickupDropoff.has(requestPickupKey)) {
        addedPickupDropoff.add(requestPickupKey);
        
        let extraInfo = `📋 ${requestItem.quantity || 1} ${requestItem.quantity === 1 ? 'item' : 'items'}`;
        if (requestItem.name) {
          extraInfo += ` • ${requestItem.name}`;
        }
        if (requestItem.price) {
          extraInfo += ` • GH₵${requestItem.price}`;
        }

        const requestPickupMarker = createServiceMarker(
          requestItem.pickupLocation,
          {
            title: "Request Pickup",
            subtitle: `${service.customer.name} • Request #${requestData.requestId.slice(-6)}`,
            location: requestItem.pickUpAddress || "Pickup location",
            type: 'pickup',
            color: "#F59E0B", // Amber color for request items
            extraInfo: extraInfo
          },
          showOnlyRelevant
        );

        requestPickupMarker.addTo(mapInstance);
        markers.push(requestPickupMarker);
      }

      // Request item dropoff marker
      if (requestItem?.dropoffLocation && requestDropoffKey && !addedPickupDropoff.has(requestDropoffKey)) {
        addedPickupDropoff.add(requestDropoffKey);
        
        let extraInfo = '';
        if (requestItem.description) {
          extraInfo += requestItem.description;
        }
        if (requestData.estimatedDeliveryDate) {
          const deliveryDate = new Date(requestData.estimatedDeliveryDate);
          extraInfo += (extraInfo ? ' • ' : '') + `ETA: ${deliveryDate.toLocaleDateString()}`;
        }
        if (requestData.distance && requestData.duration) {
          extraInfo += (extraInfo ? ' • ' : '') + `${requestData.distance} • ${requestData.duration}`;
        }

        const requestDropoffMarker = createServiceMarker(
          requestItem.dropoffLocation,
          {
            title: "Request Dropoff",
            subtitle: `${service.customer.name} • Request #${requestData.requestId.slice(-6)}`,
            location: requestItem.deliveryAddress || "Delivery location",
            type: 'dropoff',
            color: "#D97706", // Darker amber for dropoff
            extraInfo: extraInfo || 'Request item delivery'
          },
          showOnlyRelevant
        );

        requestDropoffMarker.addTo(mapInstance);
        markers.push(requestDropoffMarker);
      }

      // If there's a vendor associated with the request item, add vendor marker
      if (service.vendor?.coordinates) {
        const vendorKey = `${service.vendor.id}-${service.vendor.coordinates[0]}-${service.vendor.coordinates[1]}`;
        if (!addedVendors.has(vendorKey)) {
          addedVendors.add(vendorKey);

          const vendorMarker = createServiceMarker(
            service.vendor.coordinates,
            {
              title: service.vendor.name,
              location: service.vendor.location,
              type: 'vendor',
              color: "#10B981",
              extraInfo: `Request #${requestData.requestId.slice(-6)} • ${service.customer.name}`
            },
            showOnlyRelevant
          );

          vendorMarker.addTo(mapInstance);
          markers.push(vendorMarker);
        }
      }
    }
  });

  // Add rider markers
  ridersToShow.forEach((rider) => {
    try {
      const markerElement = createRiderMarkerElement(
        rider,
        riderRoutes,
        handleRiderClick,
        servicesToShow,
        showOnlyRelevant
      );

      // Enhanced popup for riders with multigroup info
      let extraInfo = `📦 ${rider.currentOrders.length} orders • 📅 ${rider.currentBookings?.length || 0} bookings • ⭐ ${rider.rating}/5`;
      // Add request items info
      if (rider.currentRequestItems && rider.currentRequestItems.length > 0) {
        extraInfo += ` • 📋 ${rider.currentRequestItems.length} requests`;
      }
      extraInfo += ` • ⭐ ${rider.rating}/5`;
      // Check if rider has multigroup bookings
      const multiGroupBookings = rider.currentBookings?.filter(booking => 
        booking.type === 'BOOKING' && booking.bookingData?.multiGroupId
      ) || [];
      
      if (multiGroupBookings.length > 0) {
        const uniqueMultiGroups = [...new Set(multiGroupBookings.map(b => b.bookingData?.multiGroupId))];
        extraInfo += ` • 🔗 ${uniqueMultiGroups.length} multi-group${uniqueMultiGroups.length !== 1 ? 's' : ''}`;
      }

      const riderPopup = createEnhancedPopup({
        title: rider.name,
        subtitle: `${rider.status} • ${rider.vehicle}`,
        location: rider.location,
        coordinates: [rider.position.lng, rider.position.lat],
        type: 'rider',
        extraInfo: extraInfo,
        isFiltered: showOnlyRelevant
      });

      const marker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([rider.position.lng, rider.position.lat])
        .setPopup(riderPopup)
        .addTo(mapInstance);

      markers.push(marker);
    } catch (riderMarkerError) {
      console.error(`Error creating marker for rider ${rider.name}:`, riderMarkerError);
    }
  });

  return markers;
};

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

  // console.log(`Created route data: ${distanceNum}km, ${durationSeconds}s, ${parsedRoute.coordinates.length} points`)

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
      rider.currentOrders.forEach((service) => {
      

        if (service.type === "REQUESTITEM" && service.requestItemData) {
          // Pickup (request origin)
          if (service?.requestItemData?.requestItem?.pickupLocation) {
            waypoints.push({
              location: new google.maps.LatLng(
                service?.requestItemData?.requestItem?.pickupLocation[1],
                service?.requestItemData?.requestItem?.pickupLocation[0]
              ),
              stopover: true,
            });
          }

          // Dropoff
          if (service?.requestItemData?.requestItem?.dropoffLocation) {
            destination = new google.maps.LatLng(
              service?.requestItemData?.requestItem?.dropoffLocation[1],
              service?.requestItemData?.requestItem?.dropoffLocation[0]
            );
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