import maplibregl from "maplibre-gl"
import * as turf from "@turf/turf"

// Create marker at a location

// Create marker at a location - updated for consistency
export const createMarkerAtLocation = (
  lng: number, 
  lat: number, 
  pointInfo: any,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>,
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  setClickMarker: (marker: maplibregl.Marker | null) => void,
  setDirectionsReady: (ready: boolean) => void,
  zoneDetails: any[],
  popupsRef: React.MutableRefObject<maplibregl.Popup[]>,
  setInfoPopup: (popup: maplibregl.Popup | null) => void
) => {
  if (!mapInstance.current) return

  // First clear any existing markers to ensure consistency
  clearAllMarkersAndPopups(
    markersRef,
    popupsRef,
    markersRef.current[0] || null,
    setClickMarker,
    popupsRef.current[0] || null,
    setInfoPopup,
    () => {}, // We don't want to reset clickedPoint here
    setDirectionsReady
  )

  // Create new marker
  const marker = new maplibregl.Marker({
    color: pointInfo.inZone ? zoneDetails[pointInfo.zoneIndex!].color : "#9CA3AF",
  })
    .setLngLat([lng, lat])
    .addTo(mapInstance.current)

  // Track this marker in our state arrays
  markersRef.current.push(marker)

  // Also set in the individual state for backward compatibility
  setClickMarker(marker)

  // Show info popup
  showPointInfoPopup({ lng, lat }, pointInfo, mapInstance, setInfoPopup, popupsRef)

  // Indicate that we have a point that can be used for directions
  setDirectionsReady(true)
  
  // Center the map on the marker
  mapInstance.current.flyTo({
    center: [lng, lat],
    zoom: 14,
    duration: 1000,
  })
}


// Show info popup for a point

// Show info popup for a point - unchanged
export const showPointInfoPopup = (
  point: { lng: number; lat: number }, 
  info: any,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>,
  setInfoPopup: (popup: maplibregl.Popup | null) => void,
  popupsRef: React.MutableRefObject<maplibregl.Popup[]>
) => {
  if (!mapInstance.current) return

  const map = mapInstance.current

  // Create popup content with iOS-style design
  let content = ""

  if (info.inZone) {
    content = `
      <div class="p-4 font-sans">
        <div class="flex items-center mb-2">
          <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${info.zone!.color}"></div>
          <h3 class="font-medium text-[15px] text-[#1D1D1F]">Zone ${info.zoneIndex! + 1}</h3>
        </div>
        <div class="space-y-2 text-[13px] text-[#1D1D1F]">
          <div class="flex justify-between">
            <span class="text-[#86868B]">Distance</span>
            <span class="font-medium">${info.distance} km</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#86868B]">Delivery Fee</span>
            <span class="font-medium">${info.deliveryFee === 0 ? "Free" : "$" + info.deliveryFee.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#86868B]">Estimated Time</span>
            <span class="font-medium">${info.estimatedTime}</span>
          </div>
       
        </div>
        <p class="mt-3 text-[12px] text-[#86868B]">${info.zone!.description}</p>
      </div>
    `
  } else {
    content = `
      <div class="p-4 font-sans">
        <div class="flex items-center mb-2">
          <div class="w-3 h-3 rounded-full mr-2 bg-[#9CA3AF]"></div>
          <h3 class="font-medium text-[15px] text-[#1D1D1F]">Outside Delivery Zones</h3>
        </div>
        <div class="space-y-2 text-[13px] text-[#1D1D1F]">
          <div class="flex justify-between">
            <span class="text-[#86868B]">Distance</span>
            <span class="font-medium">${info.distance} km</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#86868B]">Delivery Fee</span>
            <span class="font-medium">$${info.deliveryFee.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#86868B]">Estimated Time</span>
            <span class="font-medium">${info.estimatedTime}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-[#86868B]">Minimum Ordefdfdr</span>
            <span class="font-medium">$${info.minimumOrder.toFixed(2)}</span>
          </div>
        </div>
        <p class="mt-3 text-[12px] text-[#86868B]">Extended delivery fees apply to this location</p>
      </div>
    `
  }

  // Create and show popup with iOS-style design
  const popup = new maplibregl.Popup({
    closeButton: true,
    closeOnClick: false,
    maxWidth: "280px",
    className: "ios-style-popup",
  })
    .setLngLat([point.lng, point.lat])
    .setHTML(content)
    .addTo(map)

  // Track this popup
  popupsRef.current.push(popup)
  setInfoPopup(popup)
}


// Map click handler
export const handleMapClick = (
  e: maplibregl.MapMouseEvent,
  calculatePointDeliveryInfo: (point: [number, number], isochrones: any[], vendorLocation: any, zoneDetails: any[], transportMode: string) => any,
  isochrones: any[],
  vendorLocation: any,
  zoneDetails: any[],
  transportMode: string,
  clearAllMarkersAndPopups: any,
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  popupsRef: React.MutableRefObject<maplibregl.Popup[]>,
  clickMarker: maplibregl.Marker | null,
  setClickMarker: (marker: maplibregl.Marker | null) => void,
  infoPopup: maplibregl.Popup | null,
  setInfoPopup: (popup: maplibregl.Popup | null) => void,
  setClickedPoint: (point: { lng: number; lat: number } | null) => void,
  setDirectionsReady: (ready: boolean) => void,
  setActiveZoneIndex: (index: number | null) => void,
  createMarkerAtLocation: any,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
) => {
  // Skip if click was on isochrone
  if (e.defaultPrevented) return

  // Get coordinates
  const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]

  // Clear ALL previous markers and popups
  clearAllMarkersAndPopups(markersRef, popupsRef, clickMarker, setClickMarker, infoPopup, setInfoPopup, setClickedPoint, setDirectionsReady)

  // Reset active zone when clicking elsewhere on the map
  setActiveZoneIndex(null)

  // Calculate delivery info
  const pointInfo = calculatePointDeliveryInfo(coordinates, isochrones, vendorLocation, zoneDetails, transportMode)

  if (!pointInfo) return

  // Store clicked point
  setClickedPoint({ lng: coordinates[0], lat: coordinates[1] })

  // Create marker and show popup
  createMarkerAtLocation(
    coordinates[0], 
    coordinates[1], 
    pointInfo,
    mapInstance, 
    markersRef, 
    setClickMarker, 
    setDirectionsReady,
    zoneDetails,
    popupsRef,
    setInfoPopup
  )
}


// Clear all markers and popups - unchanged
export const clearAllMarkersAndPopups = (
  markersRef: React.MutableRefObject<maplibregl.Marker[]>,
  popupsRef: React.MutableRefObject<maplibregl.Popup[]>,
  clickMarker: maplibregl.Marker | null,
  setClickMarker: (marker: maplibregl.Marker | null) => void,
  infoPopup: maplibregl.Popup | null,
  setInfoPopup: (popup: maplibregl.Popup | null) => void,
  setClickedPoint: (point: { lng: number; lat: number } | null) => void,
  setDirectionsReady: (ready: boolean) => void,
  setActiveZoneIndex?: (index: number | null) => void
) => {
  // Remove all markers
  markersRef.current.forEach((marker) => marker.remove())
  markersRef.current = []

  // Remove all popups
  popupsRef.current.forEach((popup) => popup.remove())
  popupsRef.current = []

  // Reset individual marker/popup state
  if (clickMarker) {
    clickMarker.remove()
    setClickMarker(null)
  }

  if (infoPopup) {
    infoPopup.remove()
    setInfoPopup(null)
  }

  // Use the URL-aware setClickedPoint (this will update the URL too)
  setClickedPoint(null)
  
  // Reset directions state
  setDirectionsReady(false)
  
  // Reset active zone index if provided
  if (setActiveZoneIndex) {
    setActiveZoneIndex(null)
  }
}

// Clear directions - unchanged
export const clearDirections = (
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
) => {
  if (!mapInstance.current) return;

  const map = mapInstance.current;

  // Check if the map is loaded and style is ready first
  if (!map.isStyleLoaded()) return;

  // Remove route layers if they exist
  if (map.getSource("route")) {
    // Remove layers first before removing source
    if (map.getLayer("route-arrows")) {
      map.removeLayer("route-arrows");
    }

    if (map.getLayer("route-line")) {
      map.removeLayer("route-line");
    }

    // Then remove the source
    map.removeSource("route");
  }
}






export const updateMapIsochrones = (
  isoFeatures: any[],
  activeZoneIndex: number | null,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
) => {
  const map = mapInstance.current;
  if (!map || !map.isStyleLoaded()) return;

  // Defensive: make sure source/layer ops are only attempted after style is ready
  const sourceExists = map.getSource("isochrones");
  
  // Generate the GeoJSON data based on activeZoneIndex
  const geojsonData = {
    type: "FeatureCollection",
    features: activeZoneIndex !== null 
      ? [isoFeatures[activeZoneIndex]] // Show only the selected zone
      : isoFeatures // Show all zones when activeZoneIndex is null
  };
  
  if (sourceExists) {
    // Update existing source
    const source = sourceExists as maplibregl.GeoJSONSource;
    source.setData(geojsonData);
    
    // Debug output
    console.log(`Updating isochrones source - showing ${activeZoneIndex !== null ? 'single zone' : 'all zones'}`);
    console.log(`Number of features: ${geojsonData.features.length}`);
  } else if (isoFeatures.length > 0) {
    // Add new source and layers
    map.addSource("isochrones", {
      type: "geojson",
      data: geojsonData,
    });

    // Debug output
    console.log(`Adding new isochrones source - showing ${activeZoneIndex !== null ? 'single zone' : 'all zones'}`);
    console.log(`Number of features: ${geojsonData.features.length}`);

    // Add fill layer
    map.addLayer({
      id: "isochrone-fill",
      type: "fill",
      source: "isochrones",
      paint: {
        "fill-color": [
          "match",
          ["to-number", ["get", "group_index"]],
          0, "#4ade80", // green
          1, "#facc15", // yellow
          2, "#f87171", // red
          3, "#60a5fa", // blue
          4, "#a78bfa", // purple
          5, "#f472b6", // pink
          "#4ade80", // default to green
        ],
        "fill-opacity": 0.1,
      },
    });

    // Add outline layer
    map.addLayer({
      id: "isochrone-outline",
      type: "line",
      source: "isochrones",
      paint: {
        "line-color": [
          "match",
          ["to-number", ["get", "group_index"]],
          0, "#4ade80", // green
          1, "#facc15", // yellow
          2, "#f87171", // red
          3, "#60a5fa", // blue
          4, "#a78bfa", // purple
          5, "#f472b6", // pink
          "#4ade80", // default to green
        ],
        "line-width": 5,
        "line-opacity": 0.6,
      },
    });
  }
};



// Get route from OpenRouteService API
export const getRouteFromOpenRouteService = async (
  destination: { lng: number; lat: number },
  vendorLocation: any,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setDirectionsDistance: (distance: number | null) => void,
  setDirectionsTime: (time: string | null) => void,
  setShowDirections: (show: boolean) => void,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>,
  transportMode: string
) => {
  if (!mapInstance.current || !vendorLocation) return

  const map = mapInstance.current
  setLoading(true)

  try {
    // OpenRouteService API key - in a real app, use environment variables
    const orsApiKey = "5b3ce3597851110001cf6248a1e25ab0a5614c3c81f36aad59a33c7a"

    // Determine the profile based on transport mode
    let orsProfile
    switch (transportMode) {
      case "walking":
        orsProfile = "foot-walking"
        break
      case "bike":
        orsProfile = "cycling-regular"
        break
      case "motorbike":
      case "car":
        orsProfile = "driving-car"
        break
      default:
        orsProfile = "driving-car"
    }

    // Format coordinates for ORS API
    const coordinates = [
      [vendorLocation.lng, vendorLocation.lat],
      [destination.lng, destination.lat],
    ]

    // Call the OpenRouteService API
    const response = await fetch(`https://api.openrouteservice.org/v2/directions/${orsProfile}/geojson`, {
      method: "POST",
      headers: {
        Authorization: orsApiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        coordinates: coordinates,
        format: "geojson",
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouteService API error: ${response.status}`)
    }

    const routeData = await response.json()

    if (!routeData.features || routeData.features.length === 0) {
      throw new Error("No route found")
    }

    // Extract route information
    const route = routeData.features[0]
    const routeProperties = route.properties

    // Get distance and duration
    const distance = routeProperties.summary.distance / 1000 // Convert to km
    const duration = Math.round(routeProperties.summary.duration / 60) // Convert to minutes

    setDirectionsDistance(distance)
    setDirectionsTime(`${duration} min`)

    // Add the route to the map
    if (map.getSource("route")) {
      // Update existing source
      const source = map.getSource("route") as maplibregl.GeoJSONSource
      source.setData(route)
    } else {
      // Add new source and layer
      map.addSource("route", {
        type: "geojson",
        data: route,
      })

      // Add the route line layer
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#0071E3",
          "line-width": 4,
        },
      })

      // Add direction arrows
      map.addLayer({
        id: "route-arrows",
        type: "symbol",
        source: "route",
        layout: {
          "symbol-placement": "line",
          "text-field": "▶",
          "text-size": 12,
          "text-keep-upright": true,
          "symbol-spacing": 120,
        },
        paint: {
          "text-color": "#0071E3",
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      })
    }

    // Adjust the map view to fit the route
    const bounds = new maplibregl.LngLatBounds()
    route.geometry.coordinates.forEach((coord: [number, number]) => {
      bounds.extend(coord)
    })

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 15,
      duration: 1000,
    })

    setShowDirections(true)
  } catch (error) {
    console.error("Error fetching route:", error)
    setError("Failed to fetch route. Using direct line instead.")

    // Fallback to direct line
    createDirectFallbackRoute(
      destination, 
      vendorLocation, 
      mapInstance, 
      setDirectionsDistance, 
      setDirectionsTime, 
      setShowDirections,
      transportMode
    )
  } finally {
    setLoading(false)
  }
}

// Create a direct route (fallback)
export const createDirectFallbackRoute = (
  destination: { lng: number; lat: number },
  vendorLocation: any,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>,
  setDirectionsDistance: (distance: number | null) => void,
  setDirectionsTime: (time: string | null) => void,
  setShowDirections: (show: boolean) => void,
  transportMode: string
) => {
  if (!mapInstance.current || !vendorLocation) return

  const map = mapInstance.current
  const SPEED_MAPPING: Record<string, number> = {
    walking: 5,
    bike: 15,
    motorbike: 30,
    car: 60,
  }

  // Create a GeoJSON LineString
  const route = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [vendorLocation.lng, vendorLocation.lat],
        [destination.lng, destination.lat],
      ],
    },
  }

  // Calculate straight-line distance
  const distance = turf.distance(
    turf.point([vendorLocation.lng, vendorLocation.lat]),
    turf.point([destination.lng, destination.lat]),
    { units: "kilometers" },
  )

  setDirectionsDistance(distance)

  // Calculate estimated time
  const timeInMinutes = Math.round((distance / SPEED_MAPPING[transportMode]) * 60)
  setDirectionsTime(`${timeInMinutes} min (estimated)`)

  // Add the route to the map
  if (map.getSource("route")) {
    // Update existing source
    const source = map.getSource("route") as maplibregl.GeoJSONSource
    source.setData(route as any)
  } else {
    // Add new source and layer
    map.addSource("route", {
      type: "geojson",
      data: route as any,
    })

    // Add the route line layer
    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#0071E3",
        "line-width": 4,
        "line-dasharray": [2, 2], // Dashed line for direct route
      },
    })

    // Add direction arrows
    map.addLayer({
      id: "route-arrows",
      type: "symbol",
      source: "route",
      layout: {
        "symbol-placement": "line",
        "text-field": "▶",
        "text-size": 15,
        "text-keep-upright": true,
        "symbol-spacing": 60,
      },
      paint: {
        "text-color": "#0071E3",
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
    })
  }

  setShowDirections(true)
}


// Create a direct route (now the primary method)
export const createDirectRoute = (
  destination: { lng: number; lat: number },
  vendorLocation: any,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setDirectionsDistance: (distance: number | null) => void,
  setDirectionsTime: (time: string | null) => void,
  setShowDirections: (show: boolean) => void,
  mapInstance: React.MutableRefObject<maplibregl.Map | null>,
  transportMode: string
) => {
  if (!mapInstance.current || !vendorLocation) return

  const map = mapInstance.current
  setLoading(true)
  
  try {
    const SPEED_MAPPING: Record<string, number> = {
      walking: 5,
      bike: 15,
      motorbike: 30,
      car: 60,
    }

    // Create a GeoJSON LineString
    const route = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [vendorLocation.lng, vendorLocation.lat],
          [destination.lng, destination.lat],
        ],
      },
    }

    // Calculate straight-line distance
    const distance = turf.distance(
      turf.point([vendorLocation.lng, vendorLocation.lat]),
      turf.point([destination.lng, destination.lat]),
      { units: "kilometers" },
    )

    setDirectionsDistance(distance)

    // Calculate estimated time
    const timeInMinutes = Math.round((distance / SPEED_MAPPING[transportMode]) * 60)
    setDirectionsTime(`${timeInMinutes} min`)

    // Add the route to the map
    if (map.getSource("route")) {
      // Update existing source
      const source = map.getSource("route") as maplibregl.GeoJSONSource
      source.setData(route as any)
    } else {
      // Add new source and layer
      map.addSource("route", {
        type: "geojson",
        data: route as any,
      })

      // Add the route line layer
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#0071E3",
          "line-width": 4,
        },
      })

      // Add direction arrows
      map.addLayer({
        id: "route-arrows",
        type: "symbol",
        source: "route",
        layout: {
          "symbol-placement": "line",
          "text-field": "▶",
          "text-size": 15,
          "text-keep-upright": true,
          "symbol-spacing": 60,
        },
        paint: {
          "text-color": "#0071E3",
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      })
    }

    // Adjust the map view to fit the route
    const bounds = new maplibregl.LngLatBounds()
    bounds.extend([vendorLocation.lng, vendorLocation.lat])
    bounds.extend([destination.lng, destination.lat])

    map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 15,
      duration: 1000,
    })

    setShowDirections(true)
  } catch (error) {
    console.error("Error creating route:", error)
    setError("Failed to create direction route.")
  } finally {
    setLoading(false)
  }
}