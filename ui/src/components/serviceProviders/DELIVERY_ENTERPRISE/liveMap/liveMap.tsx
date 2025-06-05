"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useQuery, useLazyQuery, gql } from "@apollo/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Navigation,
  Search,
  RefreshCw,
  Loader2,
  XCircle,
  Eye,
  Route,
  Car,
  Bike,
  Users,
  TrendingUp,
  Database,
  Settings,
  Filter,
  Package,
  Calendar,
} from "lucide-react"
import { ActiveRiders } from "./active-riders"
import { RiderDetails } from "./rider-details"
import { useJsApiLoader, type Libraries } from "@react-google-maps/api"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
// Import the new unified types and query
import type { ServiceData, ProcessedRider, RouteData } from "./serviceDataAndTypes"
import { GET_ALL_RIDERS_SERVICE_DATA } from "./serviceDataAndTypes"
// Import types and utilities
// import type { OrderData, ProcessedRider, RouteData } from "./hooks/types";
import {
  processRiders,
  addIsochronesToMap,
  addRiderRoutesToMap,
  setupDirectionsRequest,
  parseRouteGeoJSON,
  createRouteDataFromParsed,
  createRiderMarkerElement,
} from "./hooks/mapUtilsNew"
import { ServiceManagement } from "./service-management"

// Separate query for route data
export const GET_ROUTE_DATA_FOR_EACH_ORDER = gql`
  query GetOrderRoute($orderId: String!) {
    getOrderRoute(orderId: $orderId) {
      id
      orderId
      geojson
      userId
      createdAt
    }
  }
`

const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY
const googleMapsApiKey = import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY

const libraries: Libraries = ["places"]

const LiveMap: React.FC = () => {
  // Add a new state for the orders and bookings sheet
  const [showOrdersBookings, setShowOrdersBookings] = useState(false)
  // Updated to use the new unified query
  const { loading, error, data, refetch } = useQuery(GET_ALL_RIDERS_SERVICE_DATA, {
    pollInterval: 90000,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  })

  // Lazy query for fetching individual route data if needed
  const [getOrderRoute] = useLazyQuery(GET_ROUTE_DATA_FOR_EACH_ORDER, {
    errorPolicy: "all",
  })

  // State management
  const [selectedRider, setSelectedRider] = useState<ProcessedRider | null>(null)
  const [showRidersList, setShowRidersList] = useState(false)
  const [showRiderDetails, setShowRiderDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showIsochrones, setShowIsochrones] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [riderRoutes, setRiderRoutes] = useState<Map<string, RouteData>>(new Map())
  const [databaseRoutes, setDatabaseRoutes] = useState<Map<string, RouteData>>(new Map())
  const [loadingRoutes, setLoadingRoutes] = useState<Set<string>>(new Set())
  const [loadingDatabaseRoutes, setLoadingDatabaseRoutes] = useState<boolean>(false)
  const [orderRouteCache, setOrderRouteCache] = useState<Map<string, RouteData>>(new Map())
  const [mapInitialized, setMapInitialized] = useState(false)
  const [mapReadyToInit, setMapReadyToInit] = useState(false)
  const [initMapManually, setInitMapManually] = useState(false)
  const [routeFetchProgress, setRouteFetchProgress] = useState({
    current: 0,
    total: 0,
  })
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [vehicleFilter, setVehicleFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [isMobile, setIsMobile] = useState(false)

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const markerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Google Maps loader
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  })

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Updated memoized data processing for ServiceData
  const serviceData: ServiceData[] = useMemo(() => data?.getAllRidersServiceData || [], [data])

  const riders = useMemo(() => processRiders(serviceData), [serviceData])

  // Updated filtered riders with type filter
  const filteredRiders = useMemo(
    () =>
      riders.filter((rider) => {
        const matchesSearch =
          rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          rider.location.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || rider.status === statusFilter
        const matchesVehicle = vehicleFilter === "all" || rider.vehicle === vehicleFilter

        // For type filter, check if rider has the filtered type of service
        let matchesType = true
        if (typeFilter !== "all") {
          const hasOrderType = rider.currentOrders.some((order) => order.type === typeFilter)
          const hasBookingType = rider.currentBookings?.some((booking) => booking.type === typeFilter) || false
          matchesType = hasOrderType || hasBookingType
        }

        return matchesSearch && matchesStatus && matchesVehicle && matchesType
      }),
    [riders, searchQuery, statusFilter, vehicleFilter, typeFilter],
  )

  // Updated stats calculation
  const stats = useMemo(() => {
    const orderCount = serviceData.filter((s) => s.type === "ORDER").length
    const bookingCount = serviceData.filter((s) => s.type === "BOOKING").length

    return {
      activeRiders: riders.filter((r) => r.status === "On Delivery").length,
      availableRiders: riders.filter((r) => r.status === "Available").length,
      onBreakRiders: riders.filter((r) => r.status === "On Break").length,
      totalOrders: orderCount,
      totalBookings: bookingCount,
      totalServiceData: serviceData.length,
      ordersWithRoutes: orderRouteCache.size,
      routeFetchProgress: routeFetchProgress,
      motorcycles: riders.filter((r) => r.vehicle === "Motorcycle").length,
      bicycles: riders.filter((r) => r.vehicle === "Bicycle").length,
    }
  }, [riders, serviceData, orderRouteCache.size, routeFetchProgress])

  // Updated function to fetch route data for service items
  const fetchServiceRoute = useCallback(
    async (serviceId: string) => {
      if (orderRouteCache.has(serviceId)) {
        return orderRouteCache.get(serviceId)
      }

      try {
        console.log(`Fetching route for service item: ${serviceId}`)
        const { data } = await getOrderRoute({ variables: { orderId: serviceId } })

        if (data?.getOrderRoute) {
          console.log(`Successfully fetched route for service ${serviceId}:`, {
            id: data.getOrderRoute.id,
            hasGeojson: !!data.getOrderRoute.geojson,
            geojsonLength: data.getOrderRoute.geojson?.length || 0,
          })

          setOrderRouteCache((prev) => new Map(prev).set(serviceId, data.getOrderRoute))
          return data.getOrderRoute
        } else {
          console.warn(`No route data returned for service ${serviceId}`)
        }
      } catch (error) {
        console.error(`Error fetching route for service ${serviceId}:`, error)
      }
      return null
    },
    [getOrderRoute, orderRouteCache],
  )

  // Updated function to fetch all route data
  const fetchAllRoutesForServices = useCallback(async () => {
    if (serviceData.length === 0) {
      console.log("No service data to fetch routes for")
      return
    }

    console.log(`Starting to fetch routes for ${serviceData.length} service items`)
    setLoadingDatabaseRoutes(true)

    const uniqueServiceIds = [...new Set(serviceData.map((service) => service.id))]
    console.log(`Found ${uniqueServiceIds.length} unique service IDs`)

    setRouteFetchProgress({ current: 0, total: uniqueServiceIds.length })

    const routePromises = uniqueServiceIds.map(async (serviceId, index) => {
      try {
        const routeData = await fetchServiceRoute(serviceId)
        setRouteFetchProgress((prev) => ({ ...prev, current: index + 1 }))

        if (routeData?.geojson) {
          console.log(`Route ${index + 1}/${uniqueServiceIds.length}: Success for service ${serviceId}`)
          return { serviceId, routeData }
        } else {
          console.log(`Route ${index + 1}/${uniqueServiceIds.length}: No data for service ${serviceId}`)
          return { serviceId, routeData: null }
        }
      } catch (error) {
        console.error(`Route ${index + 1}/${uniqueServiceIds.length}: Error for service ${serviceId}:`, error)
        setRouteFetchProgress((prev) => ({ ...prev, current: index + 1 }))
        return { serviceId, routeData: null }
      }
    })

    try {
      const results = await Promise.all(routePromises)
      const successfulRoutes = results.filter((r) => r.routeData !== null)

      console.log(`Completed route fetching: ${successfulRoutes.length}/${uniqueServiceIds.length} successful`)

      // Process the routes into database routes
      processRoutesIntoMap(successfulRoutes)
    } catch (error) {
      console.error("Error in batch route fetching:", error)
    } finally {
      setLoadingDatabaseRoutes(false)
      setRouteFetchProgress({ current: 0, total: 0 })
    }
  }, [serviceData, fetchServiceRoute])

  // Updated process routes function for ServiceData
  const processRoutesIntoMap = useCallback(
    (routeResults: Array<{ serviceId: string; routeData: RouteData }>) => {
      const riderRouteMap = new Map<string, RouteData>()

      console.log(`Processing ${routeResults.length} route results into rider routes`)

      // Group routes by rider
      const riderServiceMap = new Map<string, Array<{ serviceId: string; routeData: RouteData }>>()

      routeResults.forEach(({ serviceId, routeData }) => {
        const service = serviceData.find((s) => s.id === serviceId)
        if (service?.rider?.id) {
          const riderId = service.rider.id
          if (!riderServiceMap.has(riderId)) {
            riderServiceMap.set(riderId, [])
          }
          riderServiceMap.get(riderId)!.push({ serviceId, routeData })
        }
      })

      console.log(`Found routes for ${riderServiceMap.size} riders`)

      // Process each rider's routes
      riderServiceMap.forEach((riderRoutes, riderId) => {
        const rider = riders.find((r) => r.id === riderId)
        if (!rider) {
          console.warn(`No rider found for ID: ${riderId}`)
          return
        }

        console.log(`Processing routes for rider ${rider.name}: ${riderRoutes.length} routes`)

        // Use the first route with valid data
        for (const { serviceId, routeData } of riderRoutes) {
          if (routeData?.geojson) {
            try {
              console.log(`Parsing route for rider ${rider.name}, service ${serviceId}`)
              const parsedRoute = parseRouteGeoJSON(routeData.geojson)

              if (parsedRoute) {
                const routeDataForMap = createRouteDataFromParsed(parsedRoute, rider)
                riderRouteMap.set(riderId, routeDataForMap)
                console.log(
                  `Successfully created route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`,
                )
                break // Use first valid route
              } else {
                console.warn(`Failed to parse route for rider ${rider.name}, service ${serviceId}`)
              }
            } catch (error) {
              console.error(`Error processing route for rider ${rider.name}, service ${serviceId}:`, error)
            }
          }
        }
      })

      console.log(`Successfully processed ${riderRouteMap.size} database routes`)
      setDatabaseRoutes(riderRouteMap)
    },
    [serviceData, riders],
  )

  // Updated fetch routes when data changes
  useEffect(() => {
    if (serviceData.length > 0 && !loadingDatabaseRoutes) {
      console.log(`Service data changed, starting route fetch for ${serviceData.length} items`)

      // Clear any existing timeout
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current)
      }

      // Debounce the route fetching
      routeUpdateTimeoutRef.current = setTimeout(() => {
        fetchAllRoutesForServices()
      }, 2000)
    }

    return () => {
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current)
      }
    }
  }, [serviceData, fetchAllRoutesForServices, loadingDatabaseRoutes])

  // Initialize Google Directions Service
  useEffect(() => {
    if (isLoaded && !loadError && !directionsServiceRef.current) {
      try {
        directionsServiceRef.current = new google.maps.DirectionsService()
        console.log("Google Directions Service initialized successfully")
      } catch (error) {
        console.error("Failed to initialize Google Directions Service:", error)
      }
    }
  }, [isLoaded, loadError])

  // Updated fetch rider route function
  const fetchRiderRoute = useCallback(
    async (rider: ProcessedRider) => {
      if (
        !isLoaded ||
        loadError ||
        !directionsServiceRef.current ||
        (!rider.currentOrders.length && !rider.currentBookings?.length)
      ) {
        return
      }

      const riderId = rider.id
      if (riderRoutes.has(riderId) || loadingRoutes.has(riderId)) {
        return
      }

      console.log(`Fetching Google route for rider: ${rider.name}`)
      setLoadingRoutes((prev) => new Set(prev).add(riderId))

      try {
        const routeData = await setupDirectionsRequest(rider, directionsServiceRef.current)

        if (routeData) {
          console.log(`Google route calculated for ${rider.name}:`, {
            distance: `${routeData.distance.toFixed(1)}km`,
            duration: `${Math.round(routeData.duration / 60)}min`,
            points: routeData.coordinates.length,
            legs: routeData.legs,
          })
          setRiderRoutes((prev) => new Map(prev).set(riderId, routeData))
        }
      } catch (error) {
        console.error(`Error fetching Google route for rider ${rider.name}:`, error)
      } finally {
        setLoadingRoutes((prev) => {
          const newSet = new Set(prev)
          newSet.delete(riderId)
          return newSet
        })
      }
    },
    [isLoaded, loadError, riderRoutes, loadingRoutes],
  )

  // Updated fetch routes for active riders
  useEffect(() => {
    if (!isLoaded || loadError || !mapLoaded || !mapInitialized) {
      return
    }

    const timeoutId = setTimeout(() => {
      const activeRiders = riders.filter(
        (rider) =>
          rider.status === "On Delivery" &&
          (rider.currentOrders.length > 0 || (rider.currentBookings?.length || 0) > 0),
      )
      console.log(`Fetching Delivery Routes for ${activeRiders.length} active riders`)

      // Batch process routes with staggered timing to avoid rate limits
      activeRiders.forEach((rider, index) => {
        setTimeout(() => {
          fetchRiderRoute(rider)
        }, index * 500)
      })
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [riders, isLoaded, loadError, mapLoaded, mapInitialized, fetchRiderRoute])

  const handleRiderClick = useCallback((rider: ProcessedRider) => {
    setSelectedRider(rider)
    setShowRidersList(false)
    setShowRiderDetails(true)

    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [rider.position.lng, rider.position.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }, [])

  const handleBackToMap = useCallback(() => {
    setShowRiderDetails(false)
    setSelectedRider(null)

    if (mapInstance.current && riders.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      riders.forEach((rider) => {
        bounds.extend([rider.position.lng, rider.position.lat])
      })
      if (riders.length > 1) {
        mapInstance.current.fitBounds(bounds, { padding: 50 })
      }
    }
  }, [riders])

  // Map initialization function
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) {
      console.log("Map container not ready or map already initialized")
      return
    }

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json"

    try {
      console.log("Initializing map...")
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: [-0.187, 5.6037],
        zoom: 12,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 8,
      })

      mapInstance.current = map

      map.on("load", () => {
        setMapLoaded(true)
        setMapInitialized(true)
        console.log("Map loaded successfully")
      })

      map.on("error", (e) => {
        console.error("Map error:", e)
      })

      // Add resize handler
      const handleResize = () => {
        if (mapInstance.current) {
          mapInstance.current.resize()
        }
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        if (mapInstance.current) {
          mapInstance.current.remove()
          mapInstance.current = null
        }
        setMapInitialized(false)
      }
    } catch (error) {
      console.error("Failed to initialize map:", error)
    }
  }, [maptilerApiKey])

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json"

    try {
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: [-0.187, 5.6037],
        zoom: 12,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 8,
      })

      mapInstance.current = map

      map.on("load", () => {
        setMapLoaded(true)
        setMapInitialized(true)
        console.log("Map loaded successfully")
      })

      map.on("error", (e) => {
        console.error("Map error:", e)
      })

      // Add resize handler
      const handleResize = () => {
        if (mapInstance.current) {
          mapInstance.current.resize()
        }
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        if (mapInstance.current) {
          mapInstance.current.remove()
          mapInstance.current = null
        }
        setMapInitialized(false)
      }
    } catch (error) {
      console.error("Failed to initialize map:", error)
    }
  }, [maptilerApiKey])

  // Update map with isochrones and routes - debounced
  useEffect(() => {
    if (!mapLoaded || !mapInitialized) return

    const timeoutId = setTimeout(() => {
      try {
        addIsochronesToMap(mapInstance.current, mapLoaded, showIsochrones, serviceData)

        // Combine Delivery Routes and database routes for display
        const combinedRoutes = new Map(riderRoutes)
        databaseRoutes.forEach((route, riderId) => {
          if (!combinedRoutes.has(riderId)) {
            combinedRoutes.set(riderId, route)
          }
        })

        addRiderRoutesToMap(
          mapInstance.current,
          mapLoaded,
          showRoutes,
          combinedRoutes,
          riders,
          selectedRider,
          serviceData,
        )
      } catch (error) {
        console.error("Error updating map layers:", error)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [
    mapLoaded,
    mapInitialized,
    showIsochrones,
    showRoutes,
    serviceData,
    riderRoutes,
    databaseRoutes,
    selectedRider,
    riders,
  ])
// Update markers with debouncing and better performance
useEffect(() => {
  if (!mapInstance.current || !mapLoaded || !mapInitialized) return;

  // Clear existing timeout
  if (markerUpdateTimeoutRef.current) {
    clearTimeout(markerUpdateTimeoutRef.current);
  }

  markerUpdateTimeoutRef.current = setTimeout(() => {
    try {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add vendor and customer markers
      const addedVendors = new Set();
      
      // Process service data for vendor/customer markers
      serviceData.forEach((service) => {
        if (service.type === 'ORDER' && service.orderData) {
          const order = service.orderData;
          if (!service.vendor?.coordinates || !order.order?.coordinates) return;

          const vendorKey = `${service.vendor.id}-${service.vendor.coordinates[0]}-${service.vendor.coordinates[1]}`;
          if (!addedVendors.has(vendorKey)) {
            addedVendors.add(vendorKey);

            try {
              // Vendor marker
              const vendorMarker = new maplibregl.Marker({
                color: "#10B981",
                scale: 1.0,
              })
                .setLngLat(service.vendor.coordinates)
                .setPopup(
                  new maplibregl.Popup({
                    offset: 25,
                    className: "custom-popup",
                  }).setHTML(`
                  <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      🏪 ${service.vendor.name}
                    </h3>
                    <p class="text-sm text-gray-600">${service.vendor.location}</p>
                    <div class="mt-2 text-xs text-green-600 font-medium">Vendor Location</div>
                  </div>
                `)
                )
                .addTo(mapInstance.current!);

              markersRef.current.push(vendorMarker);

              // Customer marker
              const customerMarker = new maplibregl.Marker({
                color: "#EF4444",
                scale: 1.0,
              })
                .setLngLat(order.order.coordinates)
                .setPopup(
                  new maplibregl.Popup({
                    offset: 25,
                    className: "custom-popup",
                  }).setHTML(`
                  <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      <span>👤</span> Customer
                    </h3>
                    <p class="text-sm text-gray-600">${service.customer.name}</p>
                    <div class="mt-2 text-xs text-red-600 font-medium">Delivery Address</div>
                    <div class="text-xs text-gray-500">${order.order.deliveryAddress}</div>
                    ${
                      order.order.distance
                        ? `<div class="text-xs text-blue-600 mt-1">Distance: ${order.order.distance}</div>`
                        : ""
                    }
                    ${
                      order.order.duration
                        ? `<div class="text-xs text-blue-600">Duration: ${order.order.duration}</div>`
                        : ""
                    }
                  </div>
                `)
                )
                .addTo(mapInstance.current!);

              markersRef.current.push(customerMarker);
            } catch (markerError) {
              console.error("Error creating vendor/customer markers:", markerError);
            }
          }
        } else if (service.type === 'BOOKING' && service.bookingData) {
          // Add booking pickup/dropoff markers
          const booking = service.bookingData;
          
          try {
            // Pickup marker
            if (booking.pickupLocation) {
              const pickupMarker = new maplibregl.Marker({
                color: "#8B5CF6",
                scale: 1.0,
              })
                .setLngLat(booking.pickupLocation)
                .setPopup(
                  new maplibregl.Popup({
                    offset: 25,
                    className: "custom-popup",
                  }).setHTML(`
                  <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      📍 Pickup Location
                    </h3>
                    <p class="text-sm text-gray-600">${service.customer.name}</p>
                    <div class="mt-2 text-xs text-purple-600 font-medium">Booking Pickup</div>
                  </div>
                `)
                )
                .addTo(mapInstance.current!);

              markersRef.current.push(pickupMarker);
            }

            // Dropoff marker
            if (booking.dropoffLocation) {
              const dropoffMarker = new maplibregl.Marker({
                color: "#7C3AED",
                scale: 1.0,
              })
                .setLngLat(booking.dropoffLocation)
                .setPopup(
                  new maplibregl.Popup({
                    offset: 25,
                    className: "custom-popup",
                  }).setHTML(`
                  <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      🎯 Dropoff Location
                    </h3>
                    <div class="mt-2 text-xs text-purple-600 font-medium">Booking Destination</div>
                  </div>
                `)
                )
                .addTo(mapInstance.current!);

              markersRef.current.push(dropoffMarker);
            }
          } catch (markerError) {
            console.error("Error creating booking markers:", markerError);
          }
        }
      });

      // Add rider markers
      filteredRiders.forEach((rider) => {
        try {
          const markerElement = createRiderMarkerElement(
            rider,
            riderRoutes,
            handleRiderClick,
            serviceData
          );

          const marker = new maplibregl.Marker({
            element: markerElement,
            anchor: "bottom",
          })
            .setLngLat([rider.position.lng, rider.position.lat])
            .addTo(mapInstance.current!);

          markersRef.current.push(marker);
        } catch (riderMarkerError) {
          console.error(`Error creating marker for rider ${rider.name}:`, riderMarkerError);
        }
      });

      // Fit map to show all markers
      if (filteredRiders.length > 0 || serviceData.length > 0) {
        try {
          const bounds = new maplibregl.LngLatBounds();

          filteredRiders.forEach((rider) => {
            bounds.extend([rider.position.lng, rider.position.lat]);
          });

          serviceData.forEach((service) => {
            if (service.type === 'ORDER') {
              if (service.vendor?.coordinates) bounds.extend(service.vendor.coordinates);
              if (service.orderData?.order?.coordinates) bounds.extend(service.orderData.order.coordinates);
            } else if (service.type === 'BOOKING' && service.bookingData) {
              if (service.bookingData.pickupLocation) bounds.extend(service.bookingData.pickupLocation);
              if (service.bookingData.dropoffLocation) bounds.extend(service.bookingData.dropoffLocation);
            }
          });

          if (filteredRiders.length > 1 || serviceData.length > 0) {
            mapInstance.current?.fitBounds(bounds, {
              padding: 80,
              maxZoom: 15,
            });
          }
        } catch (boundsError) {
          console.error("Error fitting bounds:", boundsError);
        }
      }
    } catch (error) {
      console.error("Error updating markers:", error);
    }
  }, 500); // Debounce marker updates

  return () => {
    if (markerUpdateTimeoutRef.current) {
      clearTimeout(markerUpdateTimeoutRef.current);
    }
  };
}, [
  filteredRiders,
  mapLoaded,
  mapInitialized,
  serviceData,
  riderRoutes,
  handleRiderClick,
]);
  // Check when everything is ready and set the flag
  useEffect(() => {
    const dataReady = serviceData.length > 0 && riders.length > 0
    const googleMapsReady = isLoaded && !loadError
    const componentsReady = true

    if (dataReady && googleMapsReady && componentsReady) {
      setMapReadyToInit(true)

      const autoInitTimeout = setTimeout(() => {
        if (!mapInstance.current) {
          console.log("Auto-initializing map after 4 seconds...")
          initializeMap()
        }
      }, 4000)

      return () => clearTimeout(autoInitTimeout)
    }
  }, [serviceData, riders, isLoaded, loadError, initializeMap])

  // Manual initialization effect
  useEffect(() => {
    if (initMapManually && mapReadyToInit) {
      initializeMap()
      setInitMapManually(false)
    }
  }, [initMapManually, mapReadyToInit, initializeMap])

  // Button handler for manual initialization
  const handleInitializeMap = useCallback(() => {
    if (mapReadyToInit && !mapInstance.current) {
      setInitMapManually(true)
    }
  }, [mapReadyToInit])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current)
      }
      if (markerUpdateTimeoutRef.current) {
        clearTimeout(markerUpdateTimeoutRef.current)
      }
    }
  }, [])

  // Manual initialization effect (replaces your current map initialization useEffect)
  useEffect(() => {
    if (initMapManually && mapReadyToInit) {
      initializeMap()
      setInitMapManually(false) // Reset the flag
    }
  }, [initMapManually, mapReadyToInit, initializeMap])

  // // Handle loading errors
  // if (loadError) {
  //   return (
  //     <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
  //       <div className="text-center max-w-md mx-auto px-4">
  //         <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
  //         <h3 className="text-xl font-semibold text-gray-900 mb-3">
  //           Google Maps Error
  //         </h3>
  //         <p className="text-gray-600 mb-6 text-sm leading-relaxed">
  //           Failed to load Google Maps API. Please check your API key and try
  //           again.
  //         </p>
  //         <p className="text-xs text-gray-500 mb-4">
  //           Error: {loadError.message}
  //         </p>
  //         <Button
  //           onClick={() => window.location.reload()}
  //           className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2"
  //         >
  //           <RefreshCw className="w-4 h-4 mr-2" />
  //           Reload Page
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <TooltipProvider>
      <div className="h-screen flex mt-12 rounded-lg flex-col bg-gray-50">
        {!isMobile && (
          <div className="bg-white border-b border-gray-200 p-3 md:p-4 relative z-50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 flex items-center gap-2 truncate">
                  🚚 Rider Services Live
                  {!isLoaded && <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-blue-500" />}
                </h1>
                <div className="flex items-center gap-2 md:gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs md:text-sm text-green-600 font-medium">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {stats.availableRiders} Available
                  </span>
                  <span className="flex items-center gap-1 text-xs md:text-sm text-blue-600 font-medium">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    {stats.activeRiders} On Delivery
                  </span>
                  {!isMobile && (
                    <>
                      <span className="flex items-center gap-1 text-xs md:text-sm text-orange-600 font-medium">
                        <Package className="w-3 h-3" />
                        {stats.totalOrders} Orders
                      </span>
                      <span className="flex items-center gap-1 text-xs md:text-sm text-purple-600 font-medium">
                        <Calendar className="w-3 h-3" />
                        {stats.totalBookings} Bookings
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">{stats.ordersWithRoutes} w/ Routes</span>
                    </>
                  )}
                  {loadingRoutes.size > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading {loadingRoutes.size} route
                      {loadingRoutes.size !== 1 ? "s" : ""}
                    </span>
                  )}
                  {loadingDatabaseRoutes && (
                    <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                      <Database className="w-3 h-3 animate-spin" />
                      Fetching DB routes{" "}
                      {stats.routeFetchProgress.total > 0 &&
                        `(${stats.routeFetchProgress.current}/${stats.routeFetchProgress.total})`}
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Stats Cards - Hidden on Mobile */}
              <div className="hidden lg:flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-green-600 font-medium">DB Routes</p>
                          <p className="text-sm font-bold text-green-700">{databaseRoutes.size}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Database stored routes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Active Riders</p>
                          <p className="text-sm font-bold text-blue-700">{riders.length}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total active riders</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-purple-600 font-medium">Delivery Routes</p>
                          <p className="text-sm font-bold text-purple-700">{riderRoutes.size}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Google Maps calculated routes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-orange-600 font-medium">Service Items</p>
                          <p className="text-sm font-bold text-orange-700">{stats.totalServiceData}</p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total orders and bookings</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size={isMobile ? "sm" : "default"} className="rounded-xl">
                      <Settings className="h-4 w-4" />
                      {!isMobile && <span className="ml-2">Settings</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={showIsochrones} onCheckedChange={setShowIsochrones}>
                      <Eye className="h-4 w-4 mr-2" />
                      Delivery Zones
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showRoutes} onCheckedChange={setShowRoutes} disabled={!isLoaded}>
                      <Route className="h-4 w-4 mr-2" />
                      Delivery Routes
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => fetchAllRoutesForServices()}
                      disabled={loadingDatabaseRoutes || serviceData.length === 0}
                    >
                      <Database className={`h-4 w-4 mr-2 ${loadingDatabaseRoutes ? "animate-spin" : ""}`} />
                      Fetch All Routes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        refetch()
                        handleInitializeMap()
                      }}
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className="rounded-xl"
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      {!isMobile && <span className="ml-2">Refresh</span>}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh service data</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative rounded-lg">
          <div ref={mapRef} className="h-[90%] w-full rounded-lg bg-gray-100" style={{ minHeight: "400px" }}>
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Live Map</h3>
                  <p className="text-sm text-gray-500">
                    {!isLoaded ? "Loading Google Maps..." : "Connecting to rider services..."}
                  </p>
                  <div className="mt-4 flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Map Controls */}
          <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 z-10">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={isMobile ? "Search riders..." : "Search riders, locations, orders, or bookings..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 md:h-12 bg-white/95 backdrop-blur-sm border-gray-200 rounded-xl shadow-lg text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Enhanced Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg h-10 md:h-12 px-3 md:px-4"
                  >
                    <Filter className="h-4 w-4" />
                    {!isMobile && <span className="ml-2">Filter</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Filter Riders</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {/* Service Type Filter */}
                  <DropdownMenuLabel className="text-xs text-gray-500">Service Type</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem checked={typeFilter === "all"} onCheckedChange={() => setTypeFilter("all")}>
                    All Types ({stats.totalServiceData})
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={typeFilter === "ORDER"}
                    onCheckedChange={() => setTypeFilter("ORDER")}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Orders ({stats.totalOrders})
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={typeFilter === "BOOKING"}
                    onCheckedChange={() => setTypeFilter("BOOKING")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Bookings ({stats.totalBookings})
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  {/* Status Filter */}
                  <DropdownMenuLabel className="text-xs text-gray-500">Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "all"}
                    onCheckedChange={() => setStatusFilter("all")}
                  >
                    All Status ({riders.length})
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "Available"}
                    onCheckedChange={() => setStatusFilter("Available")}
                  >
                    Available ({stats.availableRiders})
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "On Delivery"}
                    onCheckedChange={() => setStatusFilter("On Delivery")}
                  >
                    On Delivery ({stats.activeRiders})
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={statusFilter === "On Break"}
                    onCheckedChange={() => setStatusFilter("On Break")}
                  >
                    On Break ({stats.onBreakRiders})
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  {/* Vehicle Filter */}
                  <DropdownMenuLabel className="text-xs text-gray-500">Vehicle</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={vehicleFilter === "all"}
                    onCheckedChange={() => setVehicleFilter("all")}
                  >
                    All Vehicles
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={vehicleFilter === "Motorcycle"}
                    onCheckedChange={() => setVehicleFilter("Motorcycle")}
                  >
                    <Car className="h-4 w-4 mr-2" />
                    Motorcycles ({stats.motorcycles})
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={vehicleFilter === "Bicycle"}
                    onCheckedChange={() => setVehicleFilter("Bicycle")}
                  >
                    <Bike className="h-4 w-4 mr-2" />
                    Bicycles ({stats.bicycles})
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg h-10 md:h-12 px-3 md:px-4"
                    >
                      <Settings className="h-4 w-4" />
                      {!isMobile && <span className="ml-2">Settings</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex justify-between">
                      <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                      <div className="flex justify-between gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => refetch()}
                              variant="outline"
                              size={isMobile ? "sm" : "default"}
                              className="rounded-xl"
                              disabled={loading}
                            >
                              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                              {!isMobile && <span className="ml-2">Refresh</span>}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Refresh service data</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size={isMobile ? "sm" : "default"} className="rounded-xl" variant="outline">
                              <Navigation className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Center map on location</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={showIsochrones} onCheckedChange={setShowIsochrones}>
                      <Eye className="h-4 w-4 mr-2" />
                      Delivery Zones
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={showRoutes} onCheckedChange={setShowRoutes} disabled={!isLoaded}>
                      <Route className="h-4 w-4 mr-2" />
                      Delivery Routes
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => fetchAllRoutesForServices()}
                      disabled={loadingDatabaseRoutes || serviceData.length === 0}
                    >
                      <Database className={`h-4 w-4 mr-2 ${loadingDatabaseRoutes ? "animate-spin" : ""}`} />
                      Fetch All Routes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Enhanced Floating Riders Button */}
          <div className="absolute bottom-[140px] right-6 z-20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowRidersList(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl h-14 w-14 md:h-16 md:w-16 transition-all duration-300 hover:scale-110"
                >
                  <div className="text-center">
                    <div className="text-base md:text-lg font-bold">{filteredRiders.length}</div>
                    <div className="text-xs opacity-90">Riders</div>
                  </div>
                  {stats.activeRiders > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{stats.activeRiders}</span>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View all riders</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Orders & Bookings Button */}
          <div className="absolute bottom-[80px] right-6 z-20">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowOrdersBookings(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-full shadow-xl h-14 w-14 md:h-16 md:w-16 transition-all duration-300 hover:scale-110"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Package className="h-5 w-5 mr-1" />
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="text-xs opacity-90 mt-1">Services</div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">{stats.totalServiceData}</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View orders and bookings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Enhanced Bottom Sheets */}
        <Sheet open={showRidersList} onOpenChange={setShowRidersList}>
          <SheetContent side="bottom" className="h-[97%] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Riders
                {(statusFilter !== "all" || vehicleFilter !== "all" || typeFilter !== "all") && (
                  <span className="text-sm text-gray-500">
                    (Filtered: {filteredRiders.length}/{riders.length})
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>
                {stats.availableRiders} available • {stats.activeRiders} on delivery • {stats.onBreakRiders} on break •{" "}
                {stats.totalOrders} orders • {stats.totalBookings} bookings
              </SheetDescription>
            </SheetHeader>
            <ActiveRiders riders={filteredRiders} onRiderClick={handleRiderClick} />
          </SheetContent>
        </Sheet>

        <Sheet open={showRiderDetails} onOpenChange={setShowRiderDetails}>
          <SheetContent side="bottom" className="h-[97vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Rider Details
              </SheetTitle>
              <SheetDescription>Live tracking and service information</SheetDescription>
            </SheetHeader>
            {selectedRider && (
              <RiderDetails
                rider={selectedRider}
                onBack={handleBackToMap}
                riderRoutes={riderRoutes}
                databaseRoutes={databaseRoutes}
                serviceData={serviceData}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Enhanced Service Management Sheet */}
        <Sheet open={showOrdersBookings} onOpenChange={setShowOrdersBookings}>
          <SheetContent side="bottom" className="h-[97%] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                Service Management
              </SheetTitle>
              <SheetDescription>
                Comprehensive view of orders, bookings, customers, and service analytics
              </SheetDescription>
            </SheetHeader>

            <ServiceManagement
              serviceData={serviceData}
              riders={riders}
              stats={stats}
              onRiderClick={handleRiderClick}
            />
          </SheetContent>
        </Sheet>

        {/* Loading Indicator */}
        {(loading || loadingDatabaseRoutes) && riders.length > 0 && (
          <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-3 border z-50">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs text-gray-600">
                {loadingDatabaseRoutes ? `Fetching routes...` : "Syncing..."}
              </span>
            </div>
          </div>
        )}

        {/* Route Fetch Progress */}
        {loadingDatabaseRoutes && stats.routeFetchProgress.total > 0 && (
          <div className="fixed bottom-16 left-4 bg-white rounded-lg shadow-lg p-3 border z-50">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 animate-spin text-purple-600" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-900 mb-1">
                  Fetching Routes ({stats.routeFetchProgress.current}/{stats.routeFetchProgress.total})
                </div>
                <div className="w-24 h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-1 bg-purple-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.routeFetchProgress.current / stats.routeFetchProgress.total) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error States */}
        {loadError && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="text-center max-w-md mx-auto px-4">
              <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Google Maps Error</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Failed to load Google Maps API. Please check your API key and try again.
              </p>
              <p className="text-xs text-gray-500 mb-4">Error: {loadError.message}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        )}

        {loading && serviceData.length === 0 && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Rider Services</h3>
              <p className="text-gray-600">Please wait while we fetch live data...</p>
            </div>
          </div>
        )}

        {error && serviceData.length === 0 && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="text-center max-w-md mx-auto px-4">
              <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Unavailable</h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error.message}</p>
              <Button
                onClick={() => refetch()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredRiders.length === 0 && !loading && riders.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 backdrop-blur-sm z-40">
            <div className="text-center py-16 px-4 max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No Riders Match Filters</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">
                Try adjusting your search terms or filter settings to see more riders.
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("all")
                    setVehicleFilter("all")
                    setTypeFilter("all")
                  }}
                  variant="outline"
                  className="rounded-full px-6 py-2"
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={() => refetch()}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default LiveMap
