"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useQuery, useLazyQuery, gql } from "@apollo/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Navigation,
  Search,
  RefreshCw,
  MapPin,
  Loader2,
  XCircle,
  Eye,
  EyeOff,
  Route,
  Car,
  Bike,
  Users,
  TrendingUp,
  Database,
} from "lucide-react"
import { ActiveRiders } from "./active-riders"
import { RiderDetails } from "./rider-details"
import { useJsApiLoader, type Libraries } from "@react-google-maps/api"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// Import types and utilities
import type { OrderData, ProcessedRider, RouteData } from "./hooks/types"
import {
  getStatusColor,
  processRiders,
  addIsochronesToMap,
  addRiderRoutesToMap,
  createRiderMarkerElement,
  setupDirectionsRequest,
  parseRouteGeoJSON,
  createRouteDataFromParsed,
} from "./hooks/mapUtils"

// Updated GraphQL Query without routeData
const GET_ALL_RIDERS_ORDER_ITEMS_BY_SERVICE = gql`
  query GetAllRidersOrderItemsByService {
    getAllRidersOrderItemsByService {
      orderId
      createdAt
      status
      deliveryMetaData {
        id
        price
        duration
        distance
        zone
        geojson
        isochroneId
      }
      vendor {
        id
        name
        location
        coordinates
      }
      productInfor {
        product {
          id
          name
          price
          state
        }
        quantity
      }
      customer {
        name
        dpfile
        number
      }
      rider {
        id
        name
        number
        location
        coordinates
      }
      order {
        id
        coordinates
        deliveryAddress
        distance
        duration
        items {
          id
          orderId
          quantity
          itemType
          product {
            id
            name
          }
        }
      }
    }
  }
`

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

const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;
const googleMapsApiKey = import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY;

const libraries: Libraries = ["places"]

const LiveMap: React.FC = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_RIDERS_ORDER_ITEMS_BY_SERVICE, {
    pollInterval: 90000,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network"
  })

  // Lazy query for fetching route data
  const [getOrderRoute, { loading: routeLoading }] = useLazyQuery(GET_ROUTE_DATA_FOR_EACH_ORDER, {
    errorPolicy: "all"
  })

  // State management
  const [selectedRider, setSelectedRider] = useState<ProcessedRider | null>(null)
  const [showRidersList, setShowRidersList] = useState(false)
  const [showRiderDetails, setShowRiderDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [showIsochrones, setShowIsochrones] = useState(true)
  const [showRoutes, setShowRoutes] = useState(true)
  const [showDatabaseRoutes, setShowDatabaseRoutes] = useState(true)
  const [riderRoutes, setRiderRoutes] = useState<Map<string, RouteData>>(new Map())
  const [databaseRoutes, setDatabaseRoutes] = useState<Map<string, RouteData>>(new Map())
  const [loadingRoutes, setLoadingRoutes] = useState<Set<string>>(new Set())
  const [loadingDatabaseRoutes, setLoadingDatabaseRoutes] = useState<boolean>(false)
  const [orderRouteCache, setOrderRouteCache] = useState<Map<string, any>>(new Map())
  const [mapInitialized, setMapInitialized] = useState(false)
  const [routeFetchProgress, setRouteFetchProgress] = useState({ current: 0, total: 0 })

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null)
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const markerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Google Maps loader
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries,
  })

  // Memoized data processing
  const orders: OrderData[] = useMemo(() => data?.getAllRidersOrderItemsByService || [], [data])
  const riders = useMemo(() => processRiders(orders), [orders])
  const filteredRiders = useMemo(() => 
    riders.filter(
      (rider) =>
        rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.location.toLowerCase().includes(searchQuery.toLowerCase()),
    ), [riders, searchQuery]
  )

  // Memoized stats
  const stats = useMemo(() => ({
    activeRiders: riders.filter((r) => r.status === "On Delivery").length,
    availableRiders: riders.filter((r) => r.status === "Available").length,
    totalOrders: orders.length,
    ordersWithRoutes: orderRouteCache.size,
    routeFetchProgress: routeFetchProgress
  }), [riders, orders, orderRouteCache.size, routeFetchProgress])

  // Function to fetch route data for a specific order
  const fetchOrderRoute = useCallback(async (orderId: string) => {
    if (orderRouteCache.has(orderId)) {
      return orderRouteCache.get(orderId)
    }

    try {
      console.log(`Fetching route for order: ${orderId}`)
      const { data } = await getOrderRoute({ variables: { orderId } })
      
      if (data?.getOrderRoute) {
        console.log(`Successfully fetched route for order ${orderId}:`, {
          id: data.getOrderRoute.id,
          hasGeojson: !!data.getOrderRoute.geojson,
          geojsonLength: data.getOrderRoute.geojson?.length || 0
        })
        
        setOrderRouteCache(prev => new Map(prev).set(orderId, data.getOrderRoute))
        return data.getOrderRoute
      } else {
        console.warn(`No route data returned for order ${orderId}`)
      }
    } catch (error) {
      console.error(`Error fetching route for order ${orderId}:`, error)
    }
    return null
  }, [getOrderRoute, orderRouteCache])

  // Enhanced function to fetch all route data
  const fetchAllRoutesForOrders = useCallback(async () => {
    if (orders.length === 0) {
      console.log("No orders to fetch routes for")
      return
    }

    console.log(`Starting to fetch routes for ${orders.length} orders`)
    setLoadingDatabaseRoutes(true)
    
    const uniqueOrderIds = [...new Set(orders.map(order => order.orderId))]
    console.log(`Found ${uniqueOrderIds.length} unique order IDs`)
    
    setRouteFetchProgress({ current: 0, total: uniqueOrderIds.length })

    const routePromises = uniqueOrderIds.map(async (orderId, index) => {
      try {
        const routeData = await fetchOrderRoute(orderId)
        setRouteFetchProgress(prev => ({ ...prev, current: index + 1 }))
        
        if (routeData?.geojson) {
          console.log(`Route ${index + 1}/${uniqueOrderIds.length}: Success for order ${orderId}`)
          return { orderId, routeData }
        } else {
          console.log(`Route ${index + 1}/${uniqueOrderIds.length}: No data for order ${orderId}`)
          return { orderId, routeData: null }
        }
      } catch (error) {
        console.error(`Route ${index + 1}/${uniqueOrderIds.length}: Error for order ${orderId}:`, error)
        setRouteFetchProgress(prev => ({ ...prev, current: index + 1 }))
        return { orderId, routeData: null }
      }
    })

    try {
      const results = await Promise.all(routePromises)
      const successfulRoutes = results.filter(r => r.routeData !== null)
      
      console.log(`Completed route fetching: ${successfulRoutes.length}/${uniqueOrderIds.length} successful`)
      
      // Now process the routes into database routes
      processRoutesIntoMap(successfulRoutes)
      
    } catch (error) {
      console.error("Error in batch route fetching:", error)
    } finally {
      setLoadingDatabaseRoutes(false)
      setRouteFetchProgress({ current: 0, total: 0 })
    }
  }, [orders, fetchOrderRoute])

  // Process fetched routes into the database routes map
  const processRoutesIntoMap = useCallback((routeResults: Array<{orderId: string, routeData: any}>) => {
    const riderRouteMap = new Map<string, RouteData>()
    
    console.log(`Processing ${routeResults.length} route results into rider routes`)

    // Group routes by rider
    const riderOrderMap = new Map<string, Array<{orderId: string, routeData: any}>>()
    
    routeResults.forEach(({ orderId, routeData }) => {
      const order = orders.find(o => o.orderId === orderId)
      if (order?.rider?.id) {
        const riderId = order.rider.id
        if (!riderOrderMap.has(riderId)) {
          riderOrderMap.set(riderId, [])
        }
        riderOrderMap.get(riderId)!.push({ orderId, routeData })
      }
    })

    console.log(`Found routes for ${riderOrderMap.size} riders`)

    // Process each rider's routes
    riderOrderMap.forEach((riderRoutes, riderId) => {
      const rider = riders.find(r => r.id === riderId)
      if (!rider) {
        console.warn(`No rider found for ID: ${riderId}`)
        return
      }

      console.log(`Processing routes for rider ${rider.name}: ${riderRoutes.length} routes`)

      // Use the first route with valid data
      for (const { orderId, routeData } of riderRoutes) {
        if (routeData?.geojson) {
          try {
            console.log(`Parsing route for rider ${rider.name}, order ${orderId}`)
            const parsedRoute = parseRouteGeoJSON(routeData.geojson)
            
            if (parsedRoute) {
              const routeDataForMap = createRouteDataFromParsed(parsedRoute, rider)
              riderRouteMap.set(riderId, routeDataForMap)
              console.log(`Successfully created route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`)
              break // Use first valid route
            } else {
              console.warn(`Failed to parse route for rider ${rider.name}, order ${orderId}`)
            }
          } catch (error) {
            console.error(`Error processing route for rider ${rider.name}, order ${orderId}:`, error)
          }
        }
      }
    })

    console.log(`Successfully processed ${riderRouteMap.size} database routes`)
    setDatabaseRoutes(riderRouteMap)
  }, [orders, riders])

  // Fetch routes when orders change
  useEffect(() => {
    if (orders.length > 0 && !loadingDatabaseRoutes) {
      console.log(`Orders changed, starting route fetch for ${orders.length} orders`)
      
      // Clear any existing timeout
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current)
      }

      // Debounce the route fetching
      routeUpdateTimeoutRef.current = setTimeout(() => {
        fetchAllRoutesForOrders()
      }, 2000) // Wait 2 seconds after orders change
    }
    
    return () => {
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current)
      }
    }
  }, [orders, fetchAllRoutesForOrders, loadingDatabaseRoutes])

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

  // Improved fetch rider route with better error handling and debouncing
  const fetchRiderRoute = useCallback(
    async (rider: ProcessedRider) => {
      if (!isLoaded || loadError || !directionsServiceRef.current || !rider.currentOrders.length) {
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

  // Fetch routes for active riders with improved timing
  useEffect(() => {
    if (!isLoaded || loadError || !mapLoaded || !mapInitialized) {
      return
    }

    const timeoutId = setTimeout(() => {
      const activeRiders = riders.filter((rider) => rider.status === "On Delivery" && rider.currentOrders.length > 0)
      console.log(`Fetching Google routes for ${activeRiders.length} active riders`)

      // Batch process routes with staggered timing to avoid rate limits
      activeRiders.forEach((rider, index) => {
        setTimeout(() => {
          fetchRiderRoute(rider)
        }, index * 500) // Increased delay to prevent rate limiting
      })
    }, 2000) // Increased initial delay

    return () => clearTimeout(timeoutId)
  }, [riders, isLoaded, loadError, mapLoaded, mapInitialized, fetchRiderRoute])

  const handleRiderClick = useCallback((rider: ProcessedRider) => {
    setSelectedRider(rider)
    setShowRidersList(false)
    setShowRiderDetails(true)

    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [rider.position.lng, rider.position.lat],
        zoom: 44,
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

  // Initialize MapLibre map with better error handling
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
        minZoom: 8
      })

      mapInstance.current = map
      map.addControl(new maplibregl.NavigationControl(), "top-right")

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
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
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
        addIsochronesToMap(mapInstance.current, mapLoaded, showIsochrones, orders)
        
        // Combine Google routes and database routes for display
        const combinedRoutes = new Map(riderRoutes)
        if (showDatabaseRoutes) {
          databaseRoutes.forEach((route, riderId) => {
            if (!combinedRoutes.has(riderId)) {
              combinedRoutes.set(riderId, route)
            }
          })
        }
        
        addRiderRoutesToMap(mapInstance.current, mapLoaded, showRoutes, combinedRoutes, riders, selectedRider, orders)
      } catch (error) {
        console.error("Error updating map layers:", error)
      }
    }, 300) // Debounce map updates

    return () => clearTimeout(timeoutId)
  }, [mapLoaded, mapInitialized, showIsochrones, showRoutes, showDatabaseRoutes, orders, riderRoutes, databaseRoutes, selectedRider, riders])

  // Update markers with debouncing and better performance
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !mapInitialized) return

    // Clear existing timeout
    if (markerUpdateTimeoutRef.current) {
      clearTimeout(markerUpdateTimeoutRef.current)
    }

    markerUpdateTimeoutRef.current = setTimeout(() => {
      try {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove())
        markersRef.current = []

        // Add vendor and customer markers
        const addedVendors = new Set()
        orders.forEach((order) => {
          if (!order.vendor?.coordinates || !order.order?.coordinates) return

          const vendorKey = `${order.vendor.id}-${order.vendor.coordinates[0]}-${order.vendor.coordinates[1]}`
          if (!addedVendors.has(vendorKey)) {
            addedVendors.add(vendorKey)

            try {
              // Vendor marker
              const vendorMarker = new maplibregl.Marker({
                color: "#10B981",
                scale: 1.0,
              })
                .setLngLat(order.vendor.coordinates)
                .setPopup(
                  new maplibregl.Popup({
                    offset: 25,
                    className: "custom-popup",
                  }).setHTML(`
                  <div class="p-3 bg-white rounded-lg shadow-lg">
                    <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      🏪 ${order.vendor.name}
                    </h3>
                    <p class="text-sm text-gray-600">${order.vendor.location}</p>
                    <div class="mt-2 text-xs text-green-600 font-medium">Vendor Location</div>
                  </div>
                `),
                )
                .addTo(mapInstance.current!)

              markersRef.current.push(vendorMarker)

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
                    <p class="text-sm text-gray-600">${order.customer.name}</p>
                    <div class="mt-2 text-xs text-red-600 font-medium">Delivery Address</div>
                    <div class="text-xs text-gray-500">${order.order.deliveryAddress}</div>
                    ${order.order.distance ? `<div class="text-xs text-blue-600 mt-1">Distance: ${order.order.distance}</div>` : ''}
                    ${order.order.duration ? `<div class="text-xs text-blue-600">Duration: ${order.order.duration}</div>` : ''}
                  </div>
                `),
                )
                .addTo(mapInstance.current!)

              markersRef.current.push(customerMarker)
            } catch (markerError) {
              console.error("Error creating vendor/customer markers:", markerError)
            }
          }
        })

        // Add rider markers
        filteredRiders.forEach((rider) => {
          try {
            const markerElement = createRiderMarkerElement(rider, riderRoutes, handleRiderClick, orders)

            const marker = new maplibregl.Marker({
              element: markerElement,
              anchor: "bottom",
            })
              .setLngLat([rider.position.lng, rider.position.lat])
              .addTo(mapInstance.current!)

            markersRef.current.push(marker)
          } catch (riderMarkerError) {
            console.error(`Error creating marker for rider ${rider.name}:`, riderMarkerError)
          }
        })

        // Fit map to show all markers
        if (filteredRiders.length > 0 || orders.length > 0) {
          try {
            const bounds = new maplibregl.LngLatBounds()

            filteredRiders.forEach((rider) => {
              bounds.extend([rider.position.lng, rider.position.lat])
            })

            orders.forEach((order) => {
              if (order.vendor?.coordinates) bounds.extend(order.vendor.coordinates)
              if (order.order?.coordinates) bounds.extend(order.order.coordinates)
            })

            if (filteredRiders.length > 1 || orders.length > 0) {
              mapInstance.current?.fitBounds(bounds, {
                padding: 80,
                maxZoom: 15,
              })
            }
          } catch (boundsError) {
            console.error("Error fitting bounds:", boundsError)
          }
        }
      } catch (error) {
        console.error("Error updating markers:", error)
      }
    }, 500) // Debounce marker updates

    return () => {
      if (markerUpdateTimeoutRef.current) {
        clearTimeout(markerUpdateTimeoutRef.current)
      }
    }
  }, [filteredRiders, mapLoaded, mapInitialized, orders, riderRoutes, handleRiderClick])

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

  // Handle loading errors
  if (loadError) {
    return (
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
    )
  }

  if (loading && orders.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Rider Services</h3>
          <p className="text-gray-600">Please wait while we fetch live data...</p>
        </div>
      </div>
    )
  }

  if (error && orders.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Service Unavailable</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error.message}</p>
          <Button onClick={() => refetch()} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Enhanced CSS for animations */}
      <style>{`
        @keyframes ping {
          0% {
            transform: translateX(-50%) scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: translateX(-50%) scale(2);
            opacity: 0;
          }
        }
        
        .custom-popup .maplibregl-popup-content {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          border: none;
        }
        
        .rider-marker-container:hover {
          z-index: 1000;
        }
      `}</style>

      {/* Header with Stats */}
      <div className="bg-white border-b border-gray-200 p-4 relative z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🚚 Rider Services Live
              {!isLoaded && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {stats.availableRiders} Available
              </span>
              <span className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                {stats.activeRiders} On Delivery
              </span>
              <span className="text-sm text-gray-500">{stats.totalOrders} Total Orders</span>
              <span className="text-sm text-purple-600">{stats.ordersWithRoutes} w/ Routes</span>
              {loadingRoutes.size > 0 && (
                <span className="flex items-center gap-1 text-sm text-orange-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading {loadingRoutes.size} route{loadingRoutes.size !== 1 ? "s" : ""}
                </span>
              )}
              {loadingDatabaseRoutes && (
                <span className="flex items-center gap-1 text-sm text-purple-600 font-medium">
                  <Database className="w-3 h-3 animate-spin" />
                  Fetching DB routes {stats.routeFetchProgress.total > 0 && `(${stats.routeFetchProgress.current}/${stats.routeFetchProgress.total})`}
                </span>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="hidden md:flex gap-4">
            <div className="bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-medium">Database Routes</p>
                  <p className="text-sm font-bold text-green-700">{databaseRoutes.size}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-medium">Active Riders</p>
                  <p className="text-sm font-bold text-blue-700">{riders.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-medium">Google Routes</p>
                  <p className="text-sm font-bold text-purple-700">{riderRoutes.size}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-medium">Route Cache</p>
                  <p className="text-sm font-bold text-orange-700">{orderRouteCache.size}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Manual Route Fetch Button */}
            <Button 
              onClick={() => fetchAllRoutesForOrders()} 
              variant="outline" 
              className="rounded-xl" 
              disabled={loadingDatabaseRoutes || orders.length === 0}
            >
              <Database className={`h-4 w-4 mr-2 ${loadingDatabaseRoutes ? "animate-spin" : ""}`} />
              Fetch Routes
            </Button>
            
            <Button onClick={() => refetch()} variant="outline" className="rounded-xl" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="h-full w-full bg-gray-100" style={{ minHeight: "400px" }}>
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
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 left-4 right-4 z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search riders, locations, or orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white/95 backdrop-blur-sm border-gray-200 rounded-xl shadow-lg text-sm"
              />
              {searchQuery && (
                <div className="absolute right-3 top-3">
                  <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600">
                    <XCircle className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            <Button variant="outline" className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg h-12 px-4">
              <Navigation className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Map Toggle Controls */}
        <div className="absolute top-20 left-4 z-10 space-y-2">
          <Button
            variant={showIsochrones ? "default" : "outline"}
            size="sm"
            onClick={() => setShowIsochrones(!showIsochrones)}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-3 py-2 text-xs font-medium"
          >
            {showIsochrones ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            Delivery Zones
          </Button>
          <Button
            variant={showRoutes ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRoutes(!showRoutes)}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-3 py-2 text-xs font-medium"
            disabled={!isLoaded}
          >
            <Route className={`h-4 w-4 mr-2 ${showRoutes ? "text-white" : "text-gray-600"}`} />
            Google Routes ({riderRoutes.size})
            {!isLoaded && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
          </Button>
          <Button
            variant={showDatabaseRoutes ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDatabaseRoutes(!showDatabaseRoutes)}
            className="bg-white/95 backdrop-blur-sm shadow-lg rounded-xl px-3 py-2 text-xs font-medium"
          >
            <Database className={`h-4 w-4 mr-2 ${showDatabaseRoutes ? "text-white" : "text-gray-600"}`} />
            DB Routes ({databaseRoutes.size})
            {loadingDatabaseRoutes && <Loader2 className="h-3 w-3 ml-1 animate-spin" />}
          </Button>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-4 max-w-xs">
          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Map Legend
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
              <span className="text-xs text-gray-600">
                Vendors ({orders.reduce((acc, curr) => {
                  const key = curr.vendor.id
                  return acc.includes(key) ? acc : [...acc, key]
                }, [] as string[]).length})
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm">
                <div className="w-full h-full bg-blue-500 rounded-full animate-pulse opacity-50"></div>
              </div>
              <span className="text-xs text-gray-600">On Delivery ({stats.activeRiders})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
              <span className="text-xs text-gray-600">Available ({stats.availableRiders})</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div>
              <span className="text-xs text-gray-600">Customers ({orders.length})</span>
            </div>
            {showRoutes && isLoaded && (
              <div className="flex items-center gap-3 pt-1 border-t border-gray-200">
                <div className="w-4 h-1 bg-blue-500 opacity-70 rounded"></div>
                <span className="text-xs text-gray-600">Google Routes ({riderRoutes.size})</span>
              </div>
            )}
            {showDatabaseRoutes && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-1 bg-purple-500 opacity-70 rounded" style={{background: 'repeating-linear-gradient(90deg, #8B5CF6 0px, #8B5CF6 4px, transparent 4px, transparent 8px)'}}></div>
                <span className="text-xs text-gray-600">Database Routes ({databaseRoutes.size})</span>
              </div>
            )}
            {showIsochrones && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-1 bg-purple-500 opacity-30 rounded"></div>
                <span className="text-xs text-gray-600">Delivery Zones</span>
              </div>
            )}
          </div>

          {loadingDatabaseRoutes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 animate-spin text-purple-500" />
                <span className="text-xs text-purple-600">
                  Fetching database routes...
                  {stats.routeFetchProgress.total > 0 && ` (${stats.routeFetchProgress.current}/${stats.routeFetchProgress.total})`}
                </span>
              </div>
            </div>
          )}

          {!isLoaded && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-orange-500" />
                <span className="text-xs text-orange-600">Loading Google Maps...</span>
              </div>
            </div>
          )}

          {orderRouteCache.size > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Database className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-purple-600">
                  {orderRouteCache.size} cached routes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Floating Riders Button */}
        <div className="absolute bottom-6 right-6 z-20">
          <Button
            onClick={() => setShowRidersList(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-xl h-16 w-16 transition-all duration-300 hover:scale-110"
          >
            <div className="text-center">
              <div className="text-lg font-bold">{riders.length}</div>
              <div className="text-xs opacity-90">Riders</div>
            </div>
            {stats.activeRiders > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{stats.activeRiders}</span>
              </div>
            )}
          </Button>
        </div>

        {/* Selected Rider Indicator */}
        {selectedRider && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-3 max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm font-medium text-gray-900">Tracking: {selectedRider.name}</span>
              </div>
              <div className="text-xs text-gray-600">
                {selectedRider.currentOrders.length} active order{selectedRider.currentOrders.length !== 1 ? "s" : ""}
              </div>
              {/* Show Google route info if available */}
              {riderRoutes.has(selectedRider.id) && (
                <div className="text-xs text-blue-600 mt-1">
                  Google Route: {riderRoutes.get(selectedRider.id)!.distance.toFixed(1)}km •{" "}
                  {Math.round(riderRoutes.get(selectedRider.id)!.duration / 60)}min
                </div>
              )}
              {/* Show database route info if available */}
              {databaseRoutes.has(selectedRider.id) && (
                <div className="text-xs text-purple-600 mt-1">
                  DB Route: {databaseRoutes.get(selectedRider.id)!.distance.toFixed(1)}km •{" "}
                  {Math.round(databaseRoutes.get(selectedRider.id)!.duration / 60)}min
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheets */}
      <Sheet open={showRidersList} onOpenChange={setShowRidersList}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Riders
            </SheetTitle>
            <SheetDescription>
              {stats.availableRiders} available • {stats.activeRiders} on delivery •{" "}
              {riders.filter((r) => r.status === "On Break").length} on break •{" "}
              {orderRouteCache.size} cached routes
            </SheetDescription>
          </SheetHeader>
          <ActiveRiders riders={filteredRiders} onRiderClick={handleRiderClick} />
        </SheetContent>
      </Sheet>

      <Sheet open={showRiderDetails} onOpenChange={setShowRiderDetails}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Rider Details
            </SheetTitle>
            <SheetDescription>Live tracking and delivery information</SheetDescription>
          </SheetHeader>
          {selectedRider && (
            <RiderDetails 
              rider={selectedRider} 
              onBack={handleBackToMap} 
              riderRoutes={riderRoutes} 
              databaseRoutes={databaseRoutes}
              orders={orders}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Loading Indicator */}
      {(loading || loadingDatabaseRoutes) && riders.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-3 border z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs text-gray-600">
              {loadingDatabaseRoutes ? `Fetching routes...` : 'Syncing...'}
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
                    width: `${(stats.routeFetchProgress.current / stats.routeFetchProgress.total) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {riders.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/90 backdrop-blur-sm z-40">
          <div className="text-center py-16 px-4 max-w-md">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="text-center">
                <Car className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <Bike className="w-6 h-6 text-gray-400 mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Active Riders</h3>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Riders will appear here when they come online and start accepting orders. Check back in a few minutes or
              refresh to see updates.
            </p>
            <Button
              onClick={() => refetch()}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LiveMap