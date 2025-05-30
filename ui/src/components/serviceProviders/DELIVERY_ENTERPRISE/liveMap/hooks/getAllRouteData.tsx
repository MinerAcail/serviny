"use client"

import React, { useState, useRef, useEffect } from "react"
import { useQuery, gql } from "@apollo/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  MapPin, 
  Route, 
  Database, 
  RefreshCw, 
  Loader2, 
  Eye, 
  EyeOff,
  CheckCircle,
  XCircle,
  Navigation,
  Maximize2,
  Minimize2
} from "lucide-react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

// GraphQL Query
const GET_ALL_ROUTE_DATA = gql`
  query GetAllRouteData {
    getAllRouteData {
      id
      orderId
      userId
      geojson
      updatedAt
    }
  }
`

interface RouteData {
  id: string
  orderId: string
  userId: string
  geojson: string
  updatedAt: string
}

interface ParsedRoute {
  coordinates: [number, number][]
  distance: string
  duration: string
  summary: string
  isValid: boolean
  error?: string
}

const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

const AllRoutesDisplay: React.FC = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_ROUTE_DATA, {
    pollInterval: 30000,
    errorPolicy: "all",
    fetchPolicy: "cache-and-network"
  })

  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)
  const [showRoutes, setShowRoutes] = useState(true)
  const [mapExpanded, setMapExpanded] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [swapCoordinates, setSwapCoordinates] = useState(false) // New toggle for coordinate swapping
  const [routeColors] = useState<Map<string, string>>(new Map())

  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)

  const routes: RouteData[] = data?.getAllRouteData || []

  // Generate random colors for routes
  const getRouteColor = (routeId: string): string => {
    if (!routeColors.has(routeId)) {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
      ]
      const color = colors[Math.abs(routeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length]
      routeColors.set(routeId, color)
    }
    return routeColors.get(routeId)!
  }

  // Parse route GeoJSON
  const parseRouteGeoJSON = (geojsonString: string): ParsedRoute => {
    try {
      const geoJSON = JSON.parse(geojsonString)
      
      if (geoJSON.type !== "Feature" || geoJSON.geometry?.type !== "LineString") {
        return { 
          coordinates: [], 
          distance: "0 km", 
          duration: "0 min", 
          summary: "Invalid", 
          isValid: false, 
          error: "Invalid GeoJSON structure" 
        }
      }
      
      const coordinates = geoJSON.geometry.coordinates
      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        return { 
          coordinates: [], 
          distance: "0 km", 
          duration: "0 min", 
          summary: "No coordinates", 
          isValid: false, 
          error: "No coordinates found" 
        }
      }
      
      // Validate and ensure correct coordinate format
      const validCoordinates = coordinates.filter((coord: any) => {
        if (!Array.isArray(coord) || coord.length < 2) return false
        
        const firstVal = coord[0]
        const secondVal = coord[1]
        
        // Check if they're numbers
        if (typeof firstVal !== 'number' || typeof secondVal !== 'number' || isNaN(firstVal) || isNaN(secondVal)) {
          return false
        }
        
        return true
      }).map((coord: any) => {
        // Apply coordinate swapping if enabled
        if (swapCoordinates) {
          return [coord[1], coord[0]] // Swap lat/lng
        }
        return [coord[0], coord[1]] // Keep original order
      })
      
      // Validate bounds after potential swapping
      const validBoundsCoordinates = validCoordinates.filter((coord: [number, number]) => {
        const lng = coord[0]
        const lat = coord[1]
        
        // Basic bounds check for Ghana region (rough boundaries)
        // Ghana: Longitude: -3.5 to 1.5, Latitude: 4.5 to 11.5
        if (lng < -4 || lng > 2 || lat < 4 || lat > 12) {
          console.warn(`Coordinate outside Ghana bounds: [${lng}, ${lat}] ${swapCoordinates ? '(after swap)' : '(original)'}`)
          // Still include it, but warn
        }
        
        return true
      })
      
      if (validBoundsCoordinates.length === 0) {
        return { 
          coordinates: [], 
          distance: "0 km", 
          duration: "0 min", 
          summary: "Invalid coordinates", 
          isValid: false, 
          error: "No valid coordinates" 
        }
      }
      
      // Log first and last coordinates for debugging
      console.log(`Route coordinates ${swapCoordinates ? '(SWAPPED)' : '(ORIGINAL)'}: Start [${validBoundsCoordinates[0][0].toFixed(5)}, ${validBoundsCoordinates[0][1].toFixed(5)}], End [${validBoundsCoordinates[validBoundsCoordinates.length-1][0].toFixed(5)}, ${validBoundsCoordinates[validBoundsCoordinates.length-1][1].toFixed(5)}]`)
      
      return {
        coordinates: validBoundsCoordinates,
        distance: geoJSON.metadata?.distance || `${(validBoundsCoordinates.length * 0.1).toFixed(1)} km`,
        duration: geoJSON.metadata?.duration || `${Math.round(validBoundsCoordinates.length * 0.5)} min`,
        summary: geoJSON.metadata?.summary || `Route with ${validBoundsCoordinates.length} points`,
        isValid: true
      }
    } catch (error) {
      return { 
        coordinates: [], 
        distance: "0 km", 
        duration: "0 min", 
        summary: "Parse error", 
        isValid: false, 
        error: `Parse error: ${error.message}` 
      }
    }
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json"

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: [-0.187, 5.6037], // Accra, Ghana
      zoom: 11,
      attributionControl: false,
    })

    mapInstance.current = map
    map.addControl(new maplibregl.NavigationControl(), "top-right")

    map.on("load", () => {
      setMapLoaded(true)
      console.log("Map loaded successfully")
    })

    map.on("error", (e) => {
      console.error("Map error:", e)
    })

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [maptilerApiKey])

  // Update routes on map
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || routes.length === 0) return

    console.log(`Updating map with ${routes.length} routes (coordinates ${swapCoordinates ? 'SWAPPED' : 'ORIGINAL'})`)

    // Remove existing route layers and markers
    routes.forEach((route) => {
      const layerId = `route-${route.id}`
      if (mapInstance.current!.getLayer(layerId)) {
        mapInstance.current!.removeLayer(layerId)
      }
      if (mapInstance.current!.getSource(layerId)) {
        mapInstance.current!.removeSource(layerId)
      }
    })

    // Clear all markers
    const markers = document.querySelectorAll('.maplibregl-marker')
    markers.forEach(marker => marker.remove())

    if (!showRoutes) return

    // Add route layers
    const bounds = new maplibregl.LngLatBounds()
    let validRoutesCount = 0

    routes.forEach((route) => {
      const parsed = parseRouteGeoJSON(route.geojson)
      
      if (!parsed.isValid || parsed.coordinates.length === 0) {
        console.warn(`Skipping invalid route ${route.id}:`, parsed.error)
        return
      }

      const layerId = `route-${route.id}`
      const color = getRouteColor(route.id)
      const isSelected = selectedRoute === route.id

      console.log(`Adding route ${route.id} with ${parsed.coordinates.length} points`)
      console.log(`Route bounds: Start [${parsed.coordinates[0][0].toFixed(5)}, ${parsed.coordinates[0][1].toFixed(5)}], End [${parsed.coordinates[parsed.coordinates.length-1][0].toFixed(5)}, ${parsed.coordinates[parsed.coordinates.length-1][1].toFixed(5)}]`)

      try {
        const routeGeoJSON = {
          type: "Feature" as const,
          properties: {
            routeId: route.id,
            orderId: route.orderId,
            userId: route.userId
          },
          geometry: {
            type: "LineString" as const,
            coordinates: parsed.coordinates, // Already processed with potential swapping
          },
        }

        mapInstance.current!.addSource(layerId, {
          type: "geojson",
          data: routeGeoJSON,
        })

        mapInstance.current!.addLayer({
          id: layerId,
          type: "line",
          source: layerId,
          paint: {
            "line-color": color,
            "line-width": isSelected ? 6 : 3,
            "line-opacity": isSelected ? 1.0 : 0.7,
            "line-dasharray": isSelected ? [1, 0] : [2, 2],
          },
        })

        // Add start and end markers for debugging
        if (parsed.coordinates.length > 0) {
          const startCoord = parsed.coordinates[0]
          const endCoord = parsed.coordinates[parsed.coordinates.length - 1]
          
          // Start marker (green)
          new maplibregl.Marker({ color: '#22C55E', scale: 0.8 })
            .setLngLat(startCoord)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="text-xs">
                <strong>Route Start ${swapCoordinates ? '(SWAPPED)' : '(ORIGINAL)'}</strong><br/>
                ID: ${route.id.slice(-8)}<br/>
                Coords: [${startCoord[0].toFixed(5)}, ${startCoord[1].toFixed(5)}]<br/>
                Format: [${swapCoordinates ? 'Lat, Lng' : 'Lng, Lat'}]
              </div>
            `))
            .addTo(mapInstance.current!)
          
          // End marker (red)
          new maplibregl.Marker({ color: '#EF4444', scale: 0.8 })
            .setLngLat(endCoord)
            .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="text-xs">
                <strong>Route End ${swapCoordinates ? '(SWAPPED)' : '(ORIGINAL)'}</strong><br/>
                ID: ${route.id.slice(-8)}<br/>
                Coords: [${endCoord[0].toFixed(5)}, ${endCoord[1].toFixed(5)}]<br/>
                Format: [${swapCoordinates ? 'Lat, Lng' : 'Lng, Lat'}]
              </div>
            `))
            .addTo(mapInstance.current!)
        }

        // Add to bounds - coordinates are already processed
        parsed.coordinates.forEach((coord) => {
          bounds.extend(coord)
        })

        validRoutesCount++

        // Add click handler
        mapInstance.current!.on('click', layerId, () => {
          setSelectedRoute(selectedRoute === route.id ? null : route.id)
        })

        // Add hover effect
        mapInstance.current!.on('mouseenter', layerId, () => {
          mapInstance.current!.getCanvas().style.cursor = 'pointer'
        })

        mapInstance.current!.on('mouseleave', layerId, () => {
          mapInstance.current!.getCanvas().style.cursor = ''
        })

      } catch (error) {
        console.error(`Error adding route ${route.id} to map:`, error)
      }
    })

    // Fit map to show all routes
    if (validRoutesCount > 0 && !bounds.isEmpty()) {
      mapInstance.current!.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      })
    }

    console.log(`Successfully added ${validRoutesCount} routes to map`)
  }, [routes, mapLoaded, showRoutes, selectedRoute, swapCoordinates]) // Added swapCoordinates to dependencies

  // Calculate stats
  const stats = {
    totalRoutes: routes.length,
    validRoutes: routes.filter(route => parseRouteGeoJSON(route.geojson).isValid).length,
    invalidRoutes: routes.filter(route => !parseRouteGeoJSON(route.geojson).isValid).length,
    uniqueOrders: new Set(routes.map(r => r.orderId)).size,
    uniqueUsers: new Set(routes.map(r => r.userId)).size
  }

  if (loading && routes.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Routes</h3>
          <p className="text-gray-600">Fetching all route data...</p>
        </div>
      </div>
    )
  }

  if (error && routes.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Failed to Load Routes</h3>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{error.message}</p>
          <Button onClick={() => refetch()} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Route className="h-6 w-6 text-blue-600" />
              All Routes Display
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-600">
                <strong>{stats.totalRoutes}</strong> total routes
              </span>
              <span className="text-sm text-green-600">
                <strong>{stats.validRoutes}</strong> valid
              </span>
              <span className="text-sm text-red-600">
                <strong>{stats.invalidRoutes}</strong> invalid
              </span>
              <span className="text-sm text-blue-600">
                <strong>{stats.uniqueOrders}</strong> orders
              </span>
              <span className="text-sm text-purple-600">
                <strong>{stats.uniqueUsers}</strong> users
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={swapCoordinates ? "default" : "outline"}
              size="sm"
              onClick={() => setSwapCoordinates(!swapCoordinates)}
              className="rounded-lg"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {swapCoordinates ? "Lat,Lng" : "Lng,Lat"}
            </Button>
            <Button
              variant={showRoutes ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRoutes(!showRoutes)}
              className="rounded-lg"
            >
              {showRoutes ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              Routes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapExpanded(!mapExpanded)}
              className="rounded-lg"
            >
              {mapExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex ${mapExpanded ? 'flex-col' : 'flex-row'}`}>
        {/* Map */}
        <div className={`${mapExpanded ? 'flex-1' : 'flex-1'} relative`}>
          <div ref={mapRef} className="h-full w-full bg-gray-100">
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Controls */}
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-white rounded-lg shadow-lg p-3 space-y-2">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Routes Legend
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Click route to select</div>
                <div>• Hover for details</div>
                <div>• Green markers: Route start</div>
                <div>• Red markers: Route end</div>
                <div>• Toggle coordinate format above</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-blue-500 rounded"></div>
                  <span>Route path</span>
                </div>
                <div className="pt-1 border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700">
                    Current format: {swapCoordinates ? '[Lat, Lng]' : '[Lng, Lat]'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Route Info */}
          {selectedRoute && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs">
                {(() => {
                  const route = routes.find(r => r.id === selectedRoute)
                  const parsed = route ? parseRouteGeoJSON(route.geojson) : null
                  return route && parsed ? (
                    <div>
                      <div className="text-sm font-semibold text-gray-900 mb-2">
                        Selected Route
                      </div>
                      <div className="text-xs space-y-1">
                        <div><strong>Route ID:</strong> {route.id.slice(-8)}</div>
                        <div><strong>Order:</strong> {route.orderId.slice(-6)}</div>
                        <div><strong>Distance:</strong> {parsed.distance}</div>
                        <div><strong>Duration:</strong> {parsed.duration}</div>
                        <div><strong>Points:</strong> {parsed.coordinates.length}</div>
                        <div className="pt-1 border-t border-gray-200">
                          <div><strong>Start:</strong> [{parsed.coordinates[0][0].toFixed(4)}, {parsed.coordinates[0][1].toFixed(4)}]</div>
                          <div><strong>End:</strong> [{parsed.coordinates[parsed.coordinates.length-1][0].toFixed(4)}, {parsed.coordinates[parsed.coordinates.length-1][1].toFixed(4)}]</div>
                          <div className="text-xs text-gray-500 mt-1">
                            Format: {swapCoordinates ? '[Lat, Lng]' : '[Lng, Lat]'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedRoute(null)}
                        className="mt-2 w-full text-xs"
                      >
                        Deselect
                      </Button>
                    </div>
                  ) : null
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Route List */}
        {!mapExpanded && (
          <div className="w-96 bg-white border-l border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Route Data
                <Badge variant="outline" className="ml-auto">
                  {routes.length}
                </Badge>
              </h3>
            </div>
            
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-3">
                {routes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No route data found</p>
                  </div>
                ) : (
                  routes.map((route) => {
                    const parsed = parseRouteGeoJSON(route.geojson)
                    const isSelected = selectedRoute === route.id
                    const color = getRouteColor(route.id)
                    
                    return (
                      <div
                        key={route.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedRoute(isSelected ? null : route.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="font-medium text-sm">
                              #{route.id.slice(-8)}
                            </span>
                          </div>
                          {parsed.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-600 space-y-1">
                          <div><strong>Order:</strong> {route.orderId.slice(-6)}</div>
                          <div><strong>User:</strong> {route.userId.slice(-8)}</div>
                          <div><strong>Updated:</strong> {new Date(route.updatedAt).toLocaleDateString()}</div>
                          
                          {parsed.isValid ? (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-green-600">
                                ✓ {parsed.distance} • {parsed.duration}
                                <br />📍 {parsed.coordinates.length} points
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="text-red-600 text-xs">
                                ❌ {parsed.error}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && routes.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-3 border z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs text-gray-600">Updating...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AllRoutesDisplay