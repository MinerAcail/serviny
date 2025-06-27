"use client"

// RiderTrackingMap.tsx
import { useEffect, useRef, useState } from "react"
import { Clock, Loader2, MapPin, Navigation, Package, Phone, Store, User, DollarSign } from "lucide-react"
import type { OrderData } from "./types"
import {
  calculateTotalAmount,
  getTotalItemsCount,
  formatTime,
  formatDeliveryDuration,
  formatDeliveryDistance,
} from "./types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface RiderTrackingMapProps {
  order: OrderData
  maptilerApiKey?: string
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-orange-500"
    case "confirmed":
      return "bg-blue-500"
    case "preparing":
      return "bg-yellow-500"
    case "out_for_delivery":
      return "bg-purple-500"
    case "delivered":
      return "bg-green-500"
    case "cancelled":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export function RiderTrackingMap({ order, maptilerApiKey }: RiderTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [showDeliveryZone, setShowDeliveryZone] = useState(true)

  // Map style with MapTiler API key fallback
  const mapStyle = maptilerApiKey
    ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
    : "https://demotiles.maplibre.org/style.json"

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Initialize MapLibre GL map
    const initializeMap = async () => {
      try {
        // Dynamic import to handle potential loading issues
        const maplibregl = (await import("maplibre-gl")).default

        map.current = new maplibregl.Map({
          container: mapContainer.current!,
          style: mapStyle,
          center: order.vendor.coordinates,
          zoom: 10,
          attributionControl: false,
        })

        // Add attribution control
        map.current.addControl(
          new maplibregl.AttributionControl({
            compact: true,
          }),
        )

        map.current.on("load", async () => {
          try {
            setMapLoaded(true)

            // Add delivery zone isochrone if available and enabled
            if (order.deliveryMetaData?.geojson && showDeliveryZone) {
              try {
                const isochroneGeoJSON = JSON.parse(order.deliveryMetaData.geojson)

                // Add isochrone source
                map.current.addSource("delivery-zone", {
                  type: "geojson",
                  data: isochroneGeoJSON,
                })

                // Add isochrone fill layer
                map.current.addLayer({
                  id: "delivery-zone-fill",
                  type: "fill",
                  source: "delivery-zone",
                  paint: {
                    "fill-color": "#3B82F6",
                    "fill-opacity": 0.1,
                  },
                })

                // Add isochrone outline layer
                map.current.addLayer({
                  id: "delivery-zone-outline",
                  type: "line",
                  source: "delivery-zone",
                  paint: {
                    "line-color": "#3B82F6",
                    "line-width": 2,
                    "line-opacity": 0.6,
                    "line-dasharray": [5, 5],
                  },
                })

                console.log("Delivery zone added to map")
              } catch (geoJsonError) {
                console.warn("Failed to parse delivery zone GeoJSON:", geoJsonError)
              }
            }

            // Add vendor marker (green)
            const vendorMarker = new maplibregl.Marker({
              color: "#10B981",
              scale: 1.2,
            })
              .setLngLat(order.vendor.coordinates)
              .setPopup(
                new maplibregl.Popup({
                  offset: 25,
                  closeButton: false,
                  className: "custom-popup",
                }).setHTML(
                  `<div class="p-3 min-w-48">
                    <div class="flex items-center space-x-2 mb-2">
                      <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h3 class="font-semibold text-gray-900">Vendor</h3>
                    </div>
                    <p class="font-medium text-gray-800">${order.vendor.name}</p>
                    <p class="text-sm text-gray-600 mt-1">${order.vendor.location}</p>
                    ${
                      order.deliveryMetaData
                        ? `
                      <div class="mt-2 pt-2 border-t border-gray-200">
                        <p class="text-xs text-gray-500">Delivery Zone ${order.deliveryMetaData.zone}</p>
                        <p class="text-xs font-medium text-green-600">GH₵${order.deliveryMetaData.price.toFixed(2)} delivery fee</p>
                      </div>
                    `
                        : ""
                    }
                  </div>`,
                ),
              )
              .addTo(map.current)

            // Add customer marker (blue)
            const customerMarker = new maplibregl.Marker({
              color: "#3B82F6",
              scale: 1.2,
            })
              .setLngLat(order.order.coordinates)
              .setPopup(
                new maplibregl.Popup({
                  offset: 25,
                  closeButton: false,
                  className: "custom-popup",
                }).setHTML(
                  `<div class="p-3 min-w-48">
                    <div class="flex items-center space-x-2 mb-2">
                      <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h3 class="font-semibold text-gray-900">Customer</h3>
                    </div>
                    <p class="font-medium text-gray-800">${order.customer.name}</p>
                    <p class="text-sm text-gray-600 mt-1">${order.order.deliveryAddress}</p>
                    <p class="text-xs text-gray-500 mt-1">📞 ${order.customer.number}</p>
                    ${
                      order.deliveryMetaData
                        ? `
                      <div class="mt-2 pt-2 border-t border-gray-200">
                        <p class="text-xs text-gray-500">Est. delivery: ${formatDeliveryDuration(order.deliveryMetaData.duration)}</p>
                        <p class="text-xs text-gray-500">Distance: ${formatDeliveryDistance(order.deliveryMetaData.distance)}</p>
                      </div>
                    `
                        : ""
                    }
                  </div>`,
                ),
              )
              .addTo(map.current)

            // Add rider marker if available (purple)
            let riderMarker = null
            if (order.rider?.coordinates) {
              riderMarker = new maplibregl.Marker({
                color: "#8B5CF6",
                scale: 1.2,
              })
                .setLngLat(order.rider.coordinates)
                .setPopup(
                  new maplibregl.Popup({
                    offset: 25,
                    closeButton: false,
                    className: "custom-popup",
                  }).setHTML(
                    `<div class="p-3 min-w-48">
                      <div class="flex items-center space-x-2 mb-2">
                        <div class="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <h3 class="font-semibold text-gray-900">Rider</h3>
                      </div>
                      <p class="font-medium text-gray-800">${order.rider.name}</p>
                      <p class="text-sm text-gray-600 mt-1">${order.rider.location}</p>
                      <p class="text-xs text-gray-500 mt-1">📞 ${order.rider.number}</p>
                    </div>`,
                  ),
                )
                .addTo(map.current)
            }

            // Calculate bounds to fit all markers and isochrone
            const coordinates = [
              order.vendor.coordinates,
              order.order.coordinates,
              ...(order.rider?.coordinates ? [order.rider.coordinates] : []),
            ]

            if (coordinates.length > 0) {
              const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord)
              }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]))

              map.current.fitBounds(bounds, {
                padding: 80,
                maxZoom: 15,
              })
            }

            // Add route line if rider is available
            if (order.rider?.coordinates) {
              try {
                // const turf = await import("@turf/turf")

                // Create route from vendor to rider to customer
                const routeCoordinates = [order.vendor.coordinates, order.rider.coordinates, order.order.coordinates]

                const routeGeojson = {
                  type: "Feature" as const,
                  properties: {},
                  geometry: {
                    type: "LineString" as const,
                    coordinates: routeCoordinates,
                  },
                }

                // Add route source
                map.current.addSource("route", {
                  type: "geojson",
                  data: routeGeojson,
                })

                // Add route layer
                map.current.addLayer({
                  id: "route",
                  type: "line",
                  source: "route",
                  layout: {
                    "line-join": "round",
                    "line-cap": "round",
                  },
                  paint: {
                    "line-color": "#8B5CF6",
                    "line-width": 4,
                    "line-dasharray": [3, 3],
                    "line-opacity": 0.8,
                  },
                })

                // Add route animation
                const dashArraySequence = [
                  [0, 4, 3],
                  [0.5, 4, 2.5],
                  [1, 4, 2],
                  [1.5, 4, 1.5],
                  [2, 4, 1],
                  [2.5, 4, 0.5],
                  [3, 4, 0],
                ]
                let step = 0

                const animateRoute = () => {
                  if (map.current && map.current.getLayer("route")) {
                    map.current.setPaintProperty("route", "line-dasharray", dashArraySequence[step])
                    step = (step + 1) % dashArraySequence.length
                  }
                }

                const routeAnimation = setInterval(animateRoute, 100)

                // Cleanup animation on unmount
                return () => {
                  if (routeAnimation) {
                    clearInterval(routeAnimation)
                  }
                }
              } catch  {
                console.warn("Turf.js not available, skipping route visualization")
              }
            }
          } catch (loadError) {
            console.error("Error setting up map markers:", loadError)
            setMapError("Failed to load map markers")
          }
        })

        map.current.on("error", (e: any) => {
          console.error("Map error:", e)
          setMapError("Map failed to load")
        })
      } catch (error) {
        console.error("Error initializing map:", error)
        setMapError("Failed to initialize map")
      }
    }

    initializeMap()

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [order, mapStyle])

  // Handle delivery zone toggle
  useEffect(() => {
    if (!map.current || !mapLoaded) return

    if (order.deliveryMetaData?.geojson) {
      if (showDeliveryZone) {
        // Add delivery zone if not already present
        if (!map.current.getSource("delivery-zone")) {
          try {
            const isochroneGeoJSON = JSON.parse(order.deliveryMetaData.geojson)

            map.current.addSource("delivery-zone", {
              type: "geojson",
              data: isochroneGeoJSON,
            })

            map.current.addLayer({
              id: "delivery-zone-fill",
              type: "fill",
              source: "delivery-zone",
              paint: {
                "fill-color": "#3B82F6",
                "fill-opacity": 0.1,
              },
            })

            map.current.addLayer({
              id: "delivery-zone-outline",
              type: "line",
              source: "delivery-zone",
              paint: {
                "line-color": "#3B82F6",
                "line-width": 2,
                "line-opacity": 0.6,
                "line-dasharray": [5, 5],
              },
            })
          } catch (error) {
            console.warn("Failed to add delivery zone:", error)
          }
        } else {
          // Show existing layers
          if (map.current.getLayer("delivery-zone-fill")) {
            map.current.setLayoutProperty("delivery-zone-fill", "visibility", "visible")
          }
          if (map.current.getLayer("delivery-zone-outline")) {
            map.current.setLayoutProperty("delivery-zone-outline", "visibility", "visible")
          }
        }
      } else {
        // Hide delivery zone layers
        if (map.current.getLayer("delivery-zone-fill")) {
          map.current.setLayoutProperty("delivery-zone-fill", "visibility", "none")
        }
        if (map.current.getLayer("delivery-zone-outline")) {
          map.current.setLayoutProperty("delivery-zone-outline", "visibility", "none")
        }
      }
    }
  }, [showDeliveryZone, mapLoaded, order.deliveryMetaData])

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Fixed Map Container */}
      <div className="relative flex-shrink-0">
        <div
          ref={mapContainer}
          className="h-64 sm:h-80 bg-gray-100 rounded-2xl overflow-hidden relative"
          style={{ minHeight: "300px" }}
        >
          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Loading map...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait</p>
              </div>
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-700 mb-2">Map unavailable</p>
                <p className="text-xs text-gray-500">{mapError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Map Legend */}
        {mapLoaded && !mapError && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">Vendor</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-medium text-gray-700">Customer</span>
              </div>
              {order.rider && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">Rider</span>
                </div>
              )}
              {order.deliveryMetaData && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-1 bg-blue-500 opacity-30"></div>
                  <span className="text-xs font-medium text-gray-700">Delivery Zone</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 ml-1"
                    onClick={() => setShowDeliveryZone(!showDeliveryZone)}
                  >
                    {showDeliveryZone ? "👁️" : "👁️‍🗨️"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delivery Zone Info */}
        {order.deliveryMetaData && mapLoaded && !mapError && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Zone {order.deliveryMetaData.zone}
              </p>
              <p className="text-sm font-semibold text-gray-900">GH₵{order.deliveryMetaData.price.toFixed(2)}</p>
              <p className="text-xs text-gray-600">{formatDeliveryDuration(order.deliveryMetaData.duration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable Content Area - Fixed height and proper overflow */}
      <div className="flex-1 min-h-0 mt-4">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4 pb-6">
            {/* Delivery Zone Card */}
            {order.deliveryMetaData && (
              <Card className="border-0 shadow-sm rounded-2xl overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-500">
                          DELIVERY ZONE {order.deliveryMetaData.zone}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => setShowDeliveryZone(!showDeliveryZone)}
                        >
                          {showDeliveryZone ? "Hide Zone" : "Show Zone"}
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Fee</p>
                          <p className="text-sm font-semibold text-gray-900">
                            GH₵{order.deliveryMetaData.price.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Duration</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDeliveryDuration(order.deliveryMetaData.duration)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Distance</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatDeliveryDistance(order.deliveryMetaData.distance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

           

            {/* Delivery Summary */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Delivery Summary</h4>
                  <Badge className={`${getStatusColor(order.status)} text-white`}>
                    {order.status.toLowerCase().replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order Time</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">{formatTime(order.createdAt)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Items</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Package className="w-3 h-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {getTotalItemsCount(order.productInfor)} items
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <p className="text-lg font-bold text-gray-900">
                          GH₵{calculateTotalAmount(order.productInfor, order.deliveryMetaData).toFixed(2)}
                        </p>
                      </div>
                      {order.deliveryMetaData && (
                        <p className="text-xs text-gray-500 mt-1">
                          Includes GH₵{order.deliveryMetaData.price.toFixed(2)} delivery fee
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">ETA</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <p className="text-sm font-medium text-gray-900">
                          {order.deliveryMetaData ? formatDeliveryDuration(order.deliveryMetaData.duration) : "~45 min"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
