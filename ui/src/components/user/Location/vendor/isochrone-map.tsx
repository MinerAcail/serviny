"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type TransportMode = "walking" | "bike" | "motorbike" | "car"
type RangeType = "time" | "distance"

interface IsochroneMapProps {
  vendorLocation: Location
  isochrones: any[] // GeoJSON Feature[]
  transportMode: TransportMode
  rangeType: RangeType
  ranges: number[] // in km or minutes
  activeZoneIndex?: number | null // New prop for showing only selected zone
  onZoneClick?: (index: number) => void // New callback for zone click
}

// The API key should be imported from environment variables
const envApiKey = import.meta.env.VITE_MAPTILER_API_KEY

export function IsochroneMap({ 
  vendorLocation, 
  isochrones, 
  transportMode,
  rangeType,
  ranges,
  activeZoneIndex = null,
  onZoneClick
}: IsochroneMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  // Define a color palette for zones (from green to yellow to red)
  const zoneColors = ["#4ade80", "#facc15", "#f87171"]

  // Get appropriate zoom level based on transportation mode
  const getInitialZoom = (mode: TransportMode, rangeValues: number[]): number => {
    // For time-based ranges, we need to estimate distance
    if (rangeType === "time") {
      const maxRange = Math.max(...rangeValues)
      
      // Rough distance estimation - using a simple heuristic
      if (mode === "walking") return maxRange > 60 ? 11 : 13
      if (mode === "bike") return maxRange > 60 ? 10 : 12
      if (mode === "motorbike") return maxRange > 60 ? 9 : 11
      return maxRange > 60 ? 8 : 10 // car
    } else {
      // For distance-based ranges
      const maxRange = Math.max(...rangeValues)
      
      if (maxRange > 50) return 8 // Far distances
      if (maxRange > 30) return 9
      if (maxRange > 20) return 10
      if (maxRange > 10) return 11
      if (maxRange > 5) return 12
      return 13 // Short distances
    }
  }

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up previous map instance
    if (mapInstance.current) {
      mapInstance.current.remove()
    }

    // Create a new map instance
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${envApiKey}`,
      center: [vendorLocation.lng, vendorLocation.lat],
      zoom: getInitialZoom(transportMode, ranges),
      attributionControl: false,
    })

    mapInstance.current = map

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right")

    // Add attribution
    map.addControl(new maplibregl.AttributionControl({
      compact: true
    }))

    map.on("load", () => {
      setMapLoaded(true)

      // Add vendor marker with popup
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`<strong>${vendorLocation.address}</strong>`)
      
      new maplibregl.Marker({ 
        color: "#0071E3",
        draggable: false,
      })
      .setLngLat([vendorLocation.lng, vendorLocation.lat])
      .setPopup(popup)
      .addTo(map)

      // Only add isochrones if we have them
      if (isochrones && isochrones.length > 0) {
        // Process the isochrones to ensure proper ordering
        // We need to reverse them so that smaller areas are drawn on top
        const sortedIsochrones = [...isochrones].reverse()

        // Add isochrone polygons as a source
        map.addSource("isochrones", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: activeZoneIndex !== null 
              ? [sortedIsochrones[activeZoneIndex]] 
              : sortedIsochrones,
          },
        })

        // Add a fill layer for the isochrones
        map.addLayer({
          id: "isochrone-fill",
          type: "fill",
          source: "isochrones",
          layout: {},
          paint: {
            // Use the range index for color selection
            "fill-color": [
              "case",
              // For active zone index view, always use the specific color
              ["==", ["literal", activeZoneIndex !== null], true],
              zoneColors[activeZoneIndex !== null ? activeZoneIndex % zoneColors.length : 0],
              // Otherwise, determine by the isochrone order
              ["match",
                ["to-number", ["get", "group_index"]], // Using group_index which should be 0, 1, 2, etc.
                // Map each group index to a color from our palette
                0, zoneColors[0],
                1, zoneColors[1],
                2, zoneColors[2],
                // Default color if no match
                zoneColors[0]]
            ],
            "fill-opacity": 0.4,
          },
        })

        // Add an outline layer for the isochrones
        map.addLayer({
          id: "isochrone-outline",
          type: "line",
          source: "isochrones",
          layout: {},
          paint: {
            "line-color": [
              "case",
              // For active zone index view, always use the specific color
              ["==", ["literal", activeZoneIndex !== null], true],
              zoneColors[activeZoneIndex !== null ? activeZoneIndex % zoneColors.length : 0],
              // Otherwise, determine by the isochrone order
              ["match",
                ["to-number", ["get", "group_index"]], // Using group_index which should be 0, 1, 2, etc.
                // Map each group index to a color from our palette
                0, zoneColors[0],
                1, zoneColors[1],
                2, zoneColors[2],
                // Default color if no match
                zoneColors[0]]
            ],
            "line-width": 2,
            "line-opacity": 0.8,
          },
        })

        // Add click interaction for zones
        if (onZoneClick) {
          map.on('click', 'isochrone-fill', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const groupIndex = feature.properties.group_index || 0;
              
              // Call the onZoneClick callback with the zone index
              onZoneClick(Number(groupIndex));
            }
          });
          
          // Change cursor when hovering over zones
          map.on('mouseenter', 'isochrone-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          
          map.on('mouseleave', 'isochrone-fill', () => {
            map.getCanvas().style.cursor = '';
          });
        }

        // Fit the map to show all isochrones plus some padding
        const bounds = new maplibregl.LngLatBounds()
        
        // Get the features to show
        const featuresToShow = activeZoneIndex !== null 
          ? [sortedIsochrones[activeZoneIndex]] 
          : sortedIsochrones;
          
        // Expand bounds to include all isochrone points
        featuresToShow.forEach(feature => {
          // Check for valid geometry
          if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0) {
            // For polygons
            if (feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
              feature.geometry.coordinates[0].forEach((coord: number[]) => {
                bounds.extend([coord[0], coord[1]])
              })
            }
            // For multipolygon support
            else if (feature.geometry.type === 'MultiPolygon') {
              feature.geometry.coordinates.forEach((polygon: any) => {
                polygon[0].forEach((coord: number[]) => {
                  bounds.extend([coord[0], coord[1]])
                })
              })
            }
          }
        })
        
        // Only fit bounds if we have a valid bounds object
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: { top: 40, bottom: 40, left: 40, right: 40 },
            maxZoom: getInitialZoom(transportMode, ranges)
          })
        }
      }
    })

    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [vendorLocation, isochrones, transportMode, rangeType, ranges, activeZoneIndex, onZoneClick])

  // Update isochrones when activeZoneIndex changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !isochrones || isochrones.length === 0) return

    const map = mapInstance.current
    const sortedIsochrones = [...isochrones].reverse()

    // Check if the source already exists
    if (map.getSource('isochrones')) {
      // Update the existing source data
      const source = map.getSource('isochrones') as maplibregl.GeoJSONSource
      source.setData({
        type: "FeatureCollection",
        features: activeZoneIndex !== null 
          ? [sortedIsochrones[activeZoneIndex]]
          : sortedIsochrones,
      })
    }
  }, [isochrones, mapLoaded, activeZoneIndex])

  return (
    <div ref={mapRef} className="w-full h-full relative rounded-lg">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0071E3]"></div>
        </div>
      )}
    </div>
  )
}