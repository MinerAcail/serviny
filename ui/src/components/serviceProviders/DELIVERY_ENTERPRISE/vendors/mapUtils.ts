// mapUtils.ts - Map utilities and helper functions

import { VendorMapData } from './types'
import maplibregl from "maplibre-gl"
import { toast } from "sonner"

// Move environment variable access to the top
const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY

export interface MapState {
  mapInstance: maplibregl.Map | null
  mapInitialized: boolean
  isMapLoading: boolean
}

export const getMapStyle = (): string => {
  return maptilerApiKey
    ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
    : "https://demotiles.maplibre.org/style.json"
}

export const getVendorCoordinates = (vendor: VendorMapData['vendor']): [number, number] => {
  let vendorCoords: [number, number] = [-74.006, 40.7128] // Default to NYC
  
  if (vendor.coordinates && Array.isArray(vendor.coordinates) && vendor.coordinates.length >= 2) {
    const [first, second] = vendor.coordinates
    
    // Validate coordinates are numbers
    if (typeof first === 'number' && typeof second === 'number') {
      // Check coordinate ranges to determine format
      if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
        vendorCoords = [first, second] // [lng, lat]
      } else if (Math.abs(second) <= 180 && Math.abs(first) <= 90) {
        vendorCoords = [second, first] // [lat, lng] -> convert to [lng, lat]
      }
    }
  }

  return vendorCoords
}

export const createVendorMarker = (
  map: maplibregl.Map,
  vendor: VendorMapData['vendor'],
  coordinates: [number, number]
): maplibregl.Marker => {
  const markerElement = document.createElement("div")
  markerElement.className = "w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center cursor-pointer"
  markerElement.innerHTML = '<div class="w-2 h-2 bg-white rounded-full"></div>'

  return new maplibregl.Marker({ element: markerElement })
    .setLngLat(coordinates)
    .setPopup(
      new maplibregl.Popup({ offset: 25, className: "ios-popup" }).setHTML(
        `<div class="p-3">
          <div class="font-semibold text-gray-900">${vendor.name}</div>
          <div class="text-sm text-gray-600 mt-1">${vendor.location || 'Vendor Location'}</div>
          <div class="text-xs text-gray-500 mt-1">${vendor.businessType || 'Business'}</div>
        </div>`
      )
    )
    .addTo(map)
}

export const processIsochroneData = (
  map: maplibregl.Map,
  selectedVendor: VendorMapData,
  onSuccess?: () => void
): void => {
  if (!selectedVendor.mapData || selectedVendor.mapData.length === 0) {
    console.warn('No map data available for vendor')
    toast.warning("No delivery zones found", {
      description: "This vendor doesn't have any delivery zones configured."
    })
    return
  }

  console.log('Processing map data:', selectedVendor.mapData.length, 'isochrones')
  
  selectedVendor.mapData.forEach((isochrone, isoIndex) => {
    console.log(`Processing isochrone ${isoIndex}:`, isochrone.id)
    
    try {
      // Parse GeoJSON safely
      let geoJSON
      if (typeof isochrone.geojson === 'string') {
        geoJSON = JSON.parse(isochrone.geojson)
      } else {
        geoJSON = isochrone.geojson
      }
      
      // Validate GeoJSON structure
      if (!geoJSON || !geoJSON.features || !Array.isArray(geoJSON.features)) {
        console.error(`Invalid GeoJSON structure for isochrone ${isoIndex}:`, geoJSON)
        return
      }

      if (geoJSON.features.length === 0) {
        console.warn(`No features found in isochrone ${isoIndex}`)
        return
      }

      // Zone colors matching the design system
      const colors = ["#34c759", "#ffcc00", "#ff3b30", "#007aff", "#af52de", "#ff2d55"]
      
      // Process each feature
      geoJSON.features.forEach((feature, featureIndex) => {
        // Validate feature geometry
        if (!feature.geometry || !feature.geometry.coordinates) {
          console.error(`Invalid feature geometry for feature ${featureIndex} of isochrone ${isoIndex}`)
          return
        }

        const color = colors[featureIndex % colors.length]
        const sourceId = `isochrone-${isoIndex}-${featureIndex}`
        const fillLayerId = `isochrone-fill-${isoIndex}-${featureIndex}`
        const lineLayerId = `isochrone-line-${isoIndex}-${featureIndex}`
        
        // Get metadata for this feature
        const metadata = isochrone.metaData && isochrone.metaData[featureIndex] 
          ? isochrone.metaData[featureIndex] 
          : null
        
        // Create enhanced feature with properties
        const enhancedFeature = {
          ...feature,
          properties: {
            ...feature.properties,
            zone: featureIndex + 1,
            color: color,
            isochroneIndex: isoIndex,
            featureIndex: featureIndex,
            price: metadata?.price || 0,
            duration: metadata?.duration || 0,
            distance: metadata?.distance || 0,
            vendorName: selectedVendor.vendor.name
          }
        }

        // Add source and layers
        try {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId)
          }

          map.addSource(sourceId, {
            type: "geojson",
            data: enhancedFeature
          })

          // Add fill layer
          map.addLayer({
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": color,
              "fill-opacity": 0.10
            }
          })

          // Add outline layer
          map.addLayer({
            id: lineLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": color,
              "line-width": 3,
              "line-opacity": 0.8
            }
          })

          console.log(`Successfully added layers for feature ${featureIndex} of isochrone ${isoIndex}`)

          // Add click event for zone info
          map.on('click', fillLayerId, (e) => {
            if (e.features && e.features[0]) {
              const feature = e.features[0]
              const props = feature.properties
              
              const popupContent = `
                <div class="p-3">
                  <div class="font-semibold text-gray-900 mb-2">Zone ${props.zone}</div>
                  <div class="space-y-1 text-sm">
                    ${props.price > 0 ? `<div>Delivery Fee: <span class="font-medium text-green-600">$${props.price}</span></div>` : ''}
                    ${props.duration > 0 ? `<div>Est. Time: <span class="font-medium">${Math.round(props.duration)} min</span></div>` : ''}
                    ${props.distance > 0 ? `<div>Distance: <span class="font-medium">${props.distance.toFixed(1)} km</span></div>` : ''}
                  </div>
                </div>
              `
              
              new maplibregl.Popup({ closeOnClick: true })
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(map)
            }
          })

          // Change cursor on hover
          map.on('mouseenter', fillLayerId, () => {
            map.getCanvas().style.cursor = 'pointer'
          })

          map.on('mouseleave', fillLayerId, () => {
            map.getCanvas().style.cursor = ''
          })

        } catch (layerError) {
          console.error(`Error adding layers for feature ${featureIndex} of isochrone ${isoIndex}:`, layerError)
        }
      })
      
    } catch (error) {
      console.error(`Error processing isochrone ${isoIndex}:`, error)
    }
  })

  if (onSuccess) {
    onSuccess()
  }
}

export const fitMapBounds = (
  map: maplibregl.Map,
  selectedVendor: VendorMapData,
  vendorCoords: [number, number]
): void => {
  setTimeout(() => {
    try {
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend(vendorCoords)

      let hasBounds = false
      
      selectedVendor.mapData.forEach((isochrone) => {
        try {
          let geoJSON
          if (typeof isochrone.geojson === 'string') {
            geoJSON = JSON.parse(isochrone.geojson)
          } else {
            geoJSON = isochrone.geojson
          }
          
          if (geoJSON && geoJSON.features) {
            geoJSON.features.forEach((feature) => {
              if (feature.geometry && feature.geometry.coordinates) {
                // Handle different geometry types
                if (feature.geometry.type === 'Polygon') {
                  feature.geometry.coordinates[0].forEach((coord) => {
                    if (Array.isArray(coord) && coord.length >= 2) {
                      bounds.extend([coord[0], coord[1]])
                      hasBounds = true
                    }
                  })
                } else if (feature.geometry.type === 'MultiPolygon') {
                  feature.geometry.coordinates.forEach((polygon) => {
                    polygon[0].forEach((coord) => {
                      if (Array.isArray(coord) && coord.length >= 2) {
                        bounds.extend([coord[0], coord[1]])
                        hasBounds = true
                      }
                    })
                  })
                }
              }
            })
          }
        } catch (boundsError) {
          console.error('Error calculating bounds for isochrone:', boundsError)
        }
      })

      // Fit bounds with proper fallback
      if (hasBounds) {
        map.fitBounds(bounds, {
          padding: 60,
          maxZoom: 14,
          duration: 1500,
        })
        console.log('Map bounds fitted successfully')
      } else {
        // Fallback bounds calculation
        console.log('Using fallback bounds calculation')
        const fallbackBounds = new maplibregl.LngLatBounds()
        const offset = 0.01 // roughly 1km
        fallbackBounds.extend([vendorCoords[0] - offset, vendorCoords[1] - offset])
        fallbackBounds.extend([vendorCoords[0] + offset, vendorCoords[1] + offset])
        
        map.fitBounds(fallbackBounds, {
          padding: 60,
          maxZoom: 14,
          duration: 1500,
        })
      }
    } catch (boundsError) {
      console.error('Error fitting bounds:', boundsError)
    }
  }, 1500) // Increased delay to ensure layers are loaded
}

export const cleanupMap = (mapInstance: maplibregl.Map | null): void => {
  if (mapInstance) {
    console.log('Cleaning up map instance')
    try {
      mapInstance.remove()
    } catch (error) {
      console.error('Error cleaning up map:', error)
    }
  }
}