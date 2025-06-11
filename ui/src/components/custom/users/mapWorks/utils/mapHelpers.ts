import maplibregl from "maplibre-gl"
import { Coordinates } from "../types"
import { ZONE_COLORS } from "@/components/config/map"
// import { ZONE_COLORS } from "../constants"

/**
 * Create a map style URL from API key
 */
export const createMapStyleUrl = (maptilerApiKey?: string): string => {
  return maptilerApiKey
    ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
    : "https://demotiles.maplibre.org/style.json"
}

/**
 * Create a map instance
 */
export const createMapInstance = (
  container: HTMLElement,
  center: [number, number],
  zoom: number,
  styleUrl: string
): maplibregl.Map => {
  return new maplibregl.Map({
    container,
    style: styleUrl,
    center,
    zoom,
    attributionControl: false,
  })
}

/**
 * Add a marker to the map
 */
export const addMarker = (
  map: maplibregl.Map,
  coordinates: Coordinates,
  color: string,
  popupContent?: string
): maplibregl.Marker => {
  const marker = new maplibregl.Marker({ color })
    .setLngLat([coordinates.lng, coordinates.lat])
    .addTo(map)

  if (popupContent) {
    marker.setPopup(
      new maplibregl.Popup({ offset: 25 }).setHTML(popupContent)
    )
  }

  return marker
}

/**
 * Create layer for isochrones
 */
export const addIsochrones = (
  map: maplibregl.Map,
  features: any[],
  activeZoneIndex: number | null = null
): void => {
  if (!map.isStyleLoaded()) return

  const sourceExists = map.getSource("isochrones")
  
  if (sourceExists) {
    // Update existing source
    const source = sourceExists as maplibregl.GeoJSONSource
    source.setData({
      type: "FeatureCollection",
      features: activeZoneIndex !== null ? [features[activeZoneIndex]] : features,
    })
  } else if (features.length > 0) {
    // Add new source
    map.addSource("isochrones", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: activeZoneIndex !== null ? [features[activeZoneIndex]] : features,
      },
    })

    // Add isochrone fill layer
    map.addLayer({
      id: "isochrone-fill",
      type: "fill",
      source: "isochrones",
      paint: {
        "fill-color": [
          "match",
          ["to-number", ["get", "group_index"]],
          0, ZONE_COLORS[0],
          1, ZONE_COLORS[1],
          2, ZONE_COLORS[2],
          3, ZONE_COLORS[3],
          4, ZONE_COLORS[4],
          5, ZONE_COLORS[5],
          ZONE_COLORS[0],
        ],
        "fill-opacity": 0.4,
      },
    })

    // Add isochrone outline layer
    map.addLayer({
      id: "isochrone-outline",
      type: "line",
      source: "isochrones",
      paint: {
        "line-color": [
          "match",
          ["to-number", ["get", "group_index"]],
          0, ZONE_COLORS[0],
          1, ZONE_COLORS[1],
          2, ZONE_COLORS[2],
          3, ZONE_COLORS[3],
          4, ZONE_COLORS[4],
          5, ZONE_COLORS[5],
          ZONE_COLORS[0],
        ],
        "line-width": 2,
        "line-opacity": 0.8,
      },
    })
  }
}

/**
 * Create a route line on the map
 */
export const addRouteToMap = (
  map: maplibregl.Map,
  route: any,
  isDashed: boolean = false
): void => {
  if (!map.isStyleLoaded()) return

  if (map.getSource("route")) {
    // Update existing source
    const source = map.getSource("route") as maplibregl.GeoJSONSource
    source.setData(route)
  } else {
    // Add new source
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
        "line-dasharray": isDashed ? [2, 2] : [1, 0], // Dashed line for direct route
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
}

/**
 * Fit map bounds to a route
 */
export const fitMapToRoute = (
  map: maplibregl.Map,
  coordinates: Array<[number, number]>
): void => {
  const bounds = new maplibregl.LngLatBounds()
  
  coordinates.forEach(coord => {
    bounds.extend(coord)
  })

  map.fitBounds(bounds, {
    padding: 80,
    maxZoom: 15,
    duration: 1000,
  })
}

/**
 * Remove route layers and source from map
 */
export const removeRouteFromMap = (map: maplibregl.Map): void => {
  if (!map.isStyleLoaded()) return
  
  if (map.getSource("route")) {
    // Remove layers first
    if (map.getLayer("route-arrows")) {
      map.removeLayer("route-arrows")
    }
    
    if (map.getLayer("route-line")) {
      map.removeLayer("route-line")
    }
    
    // Then remove source
    map.removeSource("route")
  }
}