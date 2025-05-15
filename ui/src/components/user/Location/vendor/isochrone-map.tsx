"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

type Location = {
  address: string
  lat: number
  lng: number
  placeId?: string
}

type IsochroneMapProps = {
  vendorLocation: Location
  isochrones: any[] // GeoJSON Feature[]
}
const envApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

export function IsochroneMap({ vendorLocation, isochrones }: IsochroneMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up previous map instance
    if (mapInstance.current) {
      mapInstance.current.remove()
    }

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${envApiKey}`,
      center: [vendorLocation.lng, vendorLocation.lat],
      zoom: 12,
    })

    mapInstance.current = map

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right")

    map.on("load", () => {
      // Add vendor marker
      new maplibregl.Marker({ color: "#0071E3" }).setLngLat([vendorLocation.lng, vendorLocation.lat]).addTo(map)

      // Add isochrone polygons as a source and layer
      map.addSource("isochrones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: isochrones,
        },
      })

      map.addLayer({
        id: "isochrone-fill",
        type: "fill",
        source: "isochrones",
        paint: {
          "fill-color": [
            "step",
            ["get", "value"], 
            "#4ade80",
            0,
            "#facc15",
            1,
            "#f87171",
          ],
          "fill-opacity": 0.4,
        },
      })

      map.addLayer({
        id: "isochrone-outline",
        type: "line",
        source: "isochrones",
        paint: {
          "line-color": "#000",
          "line-width": 1,
        },
      })
    })

   
  }, [vendorLocation, isochrones])

  return <div ref={mapRef} className="w-full h-full rounded-md" />
}
