"use client";

import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";
import { useQuery, gql } from "@apollo/client";
import {
  MapPin,
  Bike,
  Car,
  Clock,
  Truck,
  ChevronLeft,
  Info,
  Maximize,
  Map as MapIcon,
  Loader2,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// GraphQL query for isochrones
const GET_ISOCHRONE_RESULT = gql`
  query GetIsochroneResult($uuid: String!, $location: [Float!]!) {
    getIsochroneResult(uuid: $uuid, location: $location) {
      geojson
      range
      transportMode
      address
      uuid
      locations
    }
  }
`;

// Types
type Location = {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
};

type TransportMode = "walking" | "bike" | "motorbike" | "car";
type RangeType = "time" | "distance";

// Enhanced zone details type
interface ZoneDetail {
  deliveryFee: number;
  estimatedDeliveryTime: string;
  description: string;
  minimumOrder: number;
  color: string;
  area: number;
  rangeValue: number;
}

// Conversion speeds in km/h
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60,
};

// Zone colors from green (closest) to red (farthest)
const ZONE_COLORS = [
  "#4ade80", // green
  "#facc15", // yellow
  "#f87171", // red
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
];

export function DeliveryZoneVisualizer() {
  // State
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);
  const [isochrones, setIsochrones] = useState<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExtendingEnabled, setIsExtendingEnabled] = useState(false);
  const [clickedPoint, setClickedPoint] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [clickMarker, setClickMarker] = useState<maplibregl.Marker | null>(
    null
  );
  const [infoPopup, setInfoPopup] = useState<maplibregl.Popup | null>(null);
  const [vendorLocation, setVendorLocation] = useState<Location | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [rangeType, setRangeType] = useState<RangeType>("time");
  const [ranges, setRanges] = useState<number[]>([]);
  const [showDirections, setShowDirections] = useState(false);
  const [directionsDistance, setDirectionsDistance] = useState<number | null>(null);
  const [directionsTime, setDirectionsTime] = useState<string | null>(null);

  // Change this from a single marker/popup to arrays of markers and popups
  const [markers, setMarkers] = useState<maplibregl.Marker[]>([]);
  const [popups, setPopups] = useState<maplibregl.Popup[]>([]);
  
  const envApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const extendedMode = false;

  // GraphQL query hook
  const {
    loading: isochroneLoading,
    error: isochroneError,
    data,
    refetch,
  } = useQuery(GET_ISOCHRONE_RESULT, {
    variables: {
      uuid: "72bf2db2-dffc-46f8-86dc-edfbb6b960ef",
      location: [-0.2649412, 5.5582733],
    },
    onError: (err) => {
      console.error("Error fetching isochrone:", err);
      setError("Failed to fetch isochrone data. Please try again.");
      setLoading(false);
    },
    onCompleted: (data) => {
      processIsochroneData(data);
    },
  });

  // Process isochrone data
  const processIsochroneData = (data: any) => {
    try {
      if (data?.getIsochroneResult?.geojson) {
        // Parse the GeoJSON - handle potential double encoding
        let geojsonData;
        const geojsonString = data.getIsochroneResult.geojson;

        try {
          geojsonData = JSON.parse(geojsonString);
          // Check if it's a string (double-encoded)
          if (typeof geojsonData === "string") {
            geojsonData = JSON.parse(geojsonData);
          }
        } catch (err) {
          console.error("Failed to parse GeoJSON:", err);
          setError("Failed to parse GeoJSON data.");
          return;
        }

        // Extract data from GraphQL response
        if (data.getIsochroneResult.range) {
          setRanges(data.getIsochroneResult.range);
        }

        if (data.getIsochroneResult.transportMode) {
          setTransportMode(
            data.getIsochroneResult.transportMode as TransportMode
          );
        }

        // Extract locations
        if (
          data.getIsochroneResult.locations &&
          data.getIsochroneResult.locations.length > 0
        ) {
          const location = data.getIsochroneResult.locations[0];
          setVendorLocation({
            lng: location[0],
            lat: location[1],
            address: data.getIsochroneResult.address || "Vendor Location",
          });
        } else if (geojsonData.metadata?.query?.locations) {
          // Fallback to GeoJSON metadata
          const location = geojsonData.metadata.query.locations[0];
          setVendorLocation({
            lng: location[0],
            lat: location[1],
            address: data.getIsochroneResult.address || "Vendor Location",
          });
        }

        if (geojsonData.features && geojsonData.features.length > 0) {
          // Process the features
          const processedFeatures = geojsonData.features.map(
            (feature: any, index: number) => {
              return {
                ...feature,
                properties: {
                  ...feature.properties,
                  group_index: index,
                  range:
                    ranges[index < ranges.length ? index : ranges.length - 1],
                  color: ZONE_COLORS[index % ZONE_COLORS.length],
                },
              };
            }
          );

          setIsochrones(processedFeatures);

          // Calculate zone details
          calculateZoneDetails(processedFeatures);

          // Update map if already loaded
          if (mapLoaded && mapInstance.current) {
            updateMapIsochrones(processedFeatures);
          }
        } else {
          setError("No isochrone data available for this location.");
        }
      } else {
        setError("Failed to fetch isochrone data.");
      }
    } catch (err) {
      console.error("Error processing isochrones:", err);
      setError("An error occurred while processing delivery zones.");
    } finally {
      setLoading(false);
    }
  };

  // Create a direct route from vendor to clicked point
  const createDirectRoute = (destination: { lng: number; lat: number }) => {
    if (!mapInstance.current || !vendorLocation) return;
    
    const map = mapInstance.current;
    
    // Create a GeoJSON LineString for the direct route
    const route = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [vendorLocation.lng, vendorLocation.lat],
          [destination.lng, destination.lat]
        ]
      }
    };
    
    // Calculate straight-line distance
    const distance = turf.distance(
      turf.point([vendorLocation.lng, vendorLocation.lat]),
      turf.point([destination.lng, destination.lat]),
      { units: "kilometers" }
    );
    
    setDirectionsDistance(distance);
    
    // Calculate estimated time based on transport mode
    const timeInMinutes = Math.round((distance / SPEED_MAPPING[transportMode]) * 60);
    setDirectionsTime(`${timeInMinutes} min`);
    
    // Add the route to the map
    if (map.getSource("route")) {
      // Update existing source
      const source = map.getSource("route") as maplibregl.GeoJSONSource;
      source.setData(route as any);
    } else {
      // Add new source and layer
      map.addSource("route", {
        type: "geojson",
        data: route as any
      });
      
      // Add the route line layer
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: {
          "line-join": "round",
          "line-cap": "round"
        },
        paint: {
          "line-color": "#0071E3",
          "line-width": 4,
          "line-dasharray": [0, 2]
        }
      });
      
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
          "symbol-spacing": 60
        },
        paint: {
          "text-color": "#0071E3",
          "text-halo-color": "#fff",
          "text-halo-width": 1
        }
      });
    }
    
    setShowDirections(true);
  };

  // This function should be added to properly clear all markers and popups
  // Update the clear function to remove ALL markers and popups
  const clearAllMarkersAndPopups = () => {
    // Remove all markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);
    
    // Remove all popups
    popups.forEach(popup => popup.remove());
    setPopups([]);
    
    // Reset the individual marker/popup state too
    if (clickMarker) {
      clickMarker.remove();
      setClickMarker(null);
    }
    
    if (infoPopup) {
      infoPopup.remove();
      setInfoPopup(null);
    }
    
    setClickedPoint(null);
    
    // Clear directions
    clearDirections();
  };
  
  // Clear directions
  const clearDirections = () => {
    if (mapInstance.current) {
      const map = mapInstance.current;
      
      // Remove route layers and source if they exist
      if (map.getLayer("route-arrows")) {
        map.removeLayer("route-arrows");
      }
      
      if (map.getLayer("route-line")) {
        map.removeLayer("route-line");
      }
      
      if (map.getSource("route")) {
        map.removeSource("route");
      }
      
      setShowDirections(false);
      setDirectionsDistance(null);
      setDirectionsTime(null);
    }
  };

  // Calculate zone details based on isochrones
  const calculateZoneDetails = (isoFeatures: any[]) => {
    if (!isoFeatures.length) return;

    const details = isoFeatures.map((feature, index) => {
      // Calculate area in square kilometers
      const area = turf.area(feature) / 1000000;

      // Calculate delivery fee (first zone often free)
      const deliveryFee = index === 0 ? 0 : 3 + index * 2;

      // Estimate delivery time
      let baseTime: number;
      if (rangeType === "time") {
        baseTime = ranges[index < ranges.length ? index : ranges.length - 1]; // Already in minutes
      } else {
        baseTime = Math.round(
          (ranges[index < ranges.length ? index : ranges.length - 1] /
            SPEED_MAPPING[transportMode]) *
            60
        );
      }

      const bufferTime = 5 + index * 5;
      const estimatedDeliveryTime = `${baseTime}-${baseTime + bufferTime} min`;

      // Zone description
      const description =
        index === 0
          ? "Prime delivery zone with fastest service and no additional fees"
          : index === 1
          ? "Standard delivery zone with moderate delivery times"
          : "Extended delivery zone with longer delivery times";

      // Minimum order
      const minimumOrder = 15 + index * 5;

      return {
        deliveryFee,
        estimatedDeliveryTime,
        description,
        minimumOrder,
        color: ZONE_COLORS[index % ZONE_COLORS.length],
        area,
        rangeValue: ranges[index < ranges.length ? index : ranges.length - 1],
      };
    });

    setZoneDetails(details);
  };

  // Update isochrones on the map
  const updateMapIsochrones = (isoFeatures: any[]) => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;

    // Check if source already exists
    if (map.getSource("isochrones")) {
      // Update existing source
      const source = map.getSource("isochrones") as maplibregl.GeoJSONSource;
      source.setData({
        type: "FeatureCollection",
        features:
          activeZoneIndex !== null
            ? [isoFeatures[activeZoneIndex]]
            : isoFeatures,
      });
    } else if (isoFeatures.length > 0) {
      // Add new source and layers
      map.addSource("isochrones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features:
            activeZoneIndex !== null
              ? [isoFeatures[activeZoneIndex]]
              : isoFeatures,
        },
      });

      // Add fill layer
      map.addLayer({
        id: "isochrone-fill",
        type: "fill",
        source: "isochrones",
        paint: {
          "fill-color": [
            "match",
            ["to-number", ["get", "group_index"]],
            0,
            ZONE_COLORS[0],
            1,
            ZONE_COLORS[1],
            2,
            ZONE_COLORS[2],
            3,
            ZONE_COLORS[3],
            4,
            ZONE_COLORS[4],
            5,
            ZONE_COLORS[5],
            ZONE_COLORS[0],
          ],
          "fill-opacity": 0.4,
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
            0,
            ZONE_COLORS[0],
            1,
            ZONE_COLORS[1],
            2,
            ZONE_COLORS[2],
            3,
            ZONE_COLORS[3],
            4,
            ZONE_COLORS[4],
            5,
            ZONE_COLORS[5],
            ZONE_COLORS[0],
          ],
          "line-width": 2,
          "line-opacity": 0.8,
        },
      });

      // Add click handler for zones
      map.on("click", "isochrone-fill", (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          const groupIndex = feature.properties.group_index || 0;
          // Clear any existing markers and popups
          clearAllMarkersAndPopups();
          
          // Toggle active zone
          setActiveZoneIndex(
            activeZoneIndex === groupIndex ? null : groupIndex
          );

          // Prevent event from triggering map click
          e.preventDefault();
        }
      });

      // Change cursor on hover
      map.on("mouseenter", "isochrone-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "isochrone-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    }
  };

  // Calculate delivery info for a clicked point
  const calculatePointDeliveryInfo = (point: [number, number]) => {
    if (!isochrones.length || !vendorLocation) return null;

    // Create a GeoJSON point
    const clickedPoint = turf.point(point);

    // Calculate distance from center (vendor location)
    const distance = turf.distance(
      turf.point([vendorLocation.lng, vendorLocation.lat]),
      clickedPoint,
      { units: "kilometers" }
    );

    // Find which zone contains the point - iterate from smallest to largest
    // We need to reverse-check the zones since larger zones contain smaller ones
    for (let i = 0; i < isochrones.length; i++) {
      if (turf.booleanPointInPolygon(clickedPoint, isochrones[i])) {
        return {
          inZone: true,
          zoneIndex: i,
          zone: zoneDetails[i],
          deliveryFee: zoneDetails[i].deliveryFee,
          estimatedTime: zoneDetails[i].estimatedDeliveryTime,
          minimumOrder: zoneDetails[i].minimumOrder,
          distance: distance.toFixed(2), // Add distance info even for in-zone points
        };
      }
    }

    // If not in any zone, calculate out-of-zone info
    const travelTime = Math.round(
      (distance / SPEED_MAPPING[transportMode]) * 60
    );
    const deliveryFee = Math.round((3 + distance * 0.5) * 100) / 100;
    const estimatedTime = `${travelTime}-${travelTime + 15} min`;
    const minimumOrder = 25 + Math.round(distance * 2);

    return {
      inZone: false,
      distance: distance.toFixed(2),
      travelTime,
      deliveryFee,
      estimatedTime,
      minimumOrder,
    };
  };

  // Show info popup for clicked point
  const showPointInfoPopup = (
    point: { lng: number; lat: number },
    info: any
  ) => {
    if (!mapInstance.current) return;

    // Remove existing popup
    if (infoPopup) {
      infoPopup.remove();
    }

    const map = mapInstance.current;

    // Create popup content
    let content = "";

    if (info.inZone) {
      content = `
        <div class="p-3">
          <h3 class="font-medium text-sm">Zone ${info.zoneIndex + 1}</h3>
          <div class="mt-2 space-y-1 text-xs">
            <p>Distance from vendor: ${info.distance} km</p>
            <p>Delivery Fee: ${
              info.deliveryFee === 0
                ? "Free"
                : "$" + info.deliveryFee.toFixed(2)
            }</p>
            <p>Estimated Delivery: ${info.estimatedTime}</p>
            <p>Minimum Order: $${info.minimumOrder.toFixed(2)}</p>
          </div>
          <p class="mt-2 text-xs text-gray-500">${info.zone.description}</p>
          <button id="show-directions-btn" class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded flex items-center">
            <span class="mr-1">Show Directions</span>
          </button>
        </div>
      `;
    } else {
      content = `
        <div class="p-3">
          <h3 class="font-medium text-sm">Outside Delivery Zones</h3>
          <div class="mt-2 space-y-1 text-xs">
            <p>Distance from vendor: ${info.distance} km</p>
            <p>Delivery Fee: $${info.deliveryFee.toFixed(2)}</p>
            <p>Estimated Delivery: ${info.estimatedTime}</p>
            <p>Minimum Order: $${info.minimumOrder.toFixed(2)}</p>
          </div>
          <p class="mt-2 text-xs text-gray-500">Extended delivery fees apply</p>
          <button id="show-directions-btn" class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded flex items-center">
            <span class="mr-1">Show Directions</span>
          </button>
        </div>
      `;
    }

    // Create and show popup
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: "200px",
    })
      .setLngLat([point.lng, point.lat])
      .setHTML(content)
      .addTo(map);

    // Track this popup in our state arrays
    setPopups(prev => [...prev, popup]);

    // Also set in the individual state for backward compatibility
    setInfoPopup(popup);

    // Add event listener to the directions button after popup is added to the map
    popup.on('open', () => {
      const directionsButton = document.getElementById('show-directions-btn');
      if (directionsButton) {
        directionsButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Clear existing directions before creating new ones
          clearDirections();
          
          // Create a route from vendor to clicked point
          createDirectRoute(point);
        });
      }
    });
  };

  // Update the map click handler
  const handleMapClick = (e: maplibregl.MapMouseEvent) => {
    // Skip if click was on isochrone
    if (e.defaultPrevented) return;
    
    // Get coordinates
    const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    
    // Clear ALL previous markers and popups
    clearAllMarkersAndPopups();
    
    // Reset active zone when clicking elsewhere on the map
    setActiveZoneIndex(null);
    
    // Calculate delivery info
    const pointInfo = calculatePointDeliveryInfo(coordinates);
    
    if (!pointInfo) return;
    
    // Store clicked point
    setClickedPoint({ lng: coordinates[0], lat: coordinates[1] });
    
    // Create new marker
    const marker = new maplibregl.Marker({
      color: pointInfo.inZone
        ? zoneDetails[pointInfo.zoneIndex].color
        : "#9CA3AF",
    })
      .setLngLat(coordinates)
      .addTo(mapInstance.current);
    
    // Track this marker in our state arrays
    setMarkers(prev => [...prev, marker]);
    
    // Also set in the individual state for backward compatibility
    setClickMarker(marker);
    
    // Show info popup
    showPointInfoPopup(
      { lng: coordinates[0], lat: coordinates[1] },
      pointInfo
    );
  };

  // Toggle extend mode
  const toggleExtendMode = () => {
    setIsExtendingEnabled(!isExtendingEnabled);

    // Reset active zone
    setActiveZoneIndex(null);

    // Clear markers and popups
    clearAllMarkersAndPopups();
  };

  // Format range label
  const formatRangeLabel = (index: number) => {
    if (!zoneDetails[index]) return "";

    if (index === 0) {
      // First zone: 0-X range
      return `0-${zoneDetails[index].rangeValue} ${
        rangeType === "distance" ? "km" : "min"
      }`;
    } else {
      // Other zones: prevRange-currentRange
      const prevRange = zoneDetails[index - 1].rangeValue;
      const currentRange = zoneDetails[index].rangeValue;

      return `${prevRange}-${currentRange} ${
        rangeType === "distance" ? "km" : "min"
      }`;
    }
  };

  // Get transport icon
  const getTransportIcon = () => {
    switch (transportMode) {
      case "walking":
        return <Clock className="h-5 w-5 text-gray-500 mr-2" />;
      case "bike":
        return <Bike className="h-5 w-5 text-gray-500 mr-2" />;
      case "motorbike":
        return <Truck className="h-5 w-5 text-gray-500 mr-2" />;
      default:
        return <Car className="h-5 w-5 text-gray-500 mr-2" />;
    }
  };

  // Handle zone card click
  const handleZoneCardClick = (index: number) => {
    // Toggle active zone index
    setActiveZoneIndex(activeZoneIndex === index ? null : index);
    // Clear any existing markers and popups
    clearAllMarkersAndPopups();
  };

  // Reload isochrone data
  const handleRefetch = () => {
    setLoading(true);
    setError(null);
    refetch().catch((err) => {
      console.error("Error refetching isochrone data:", err);
      setError("Failed to refresh isochrone data.");
      setLoading(false);
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !vendorLocation) return;

    // Create map style URL
    const mapStyle = envApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${envApiKey}`
      : "https://demotiles.maplibre.org/style.json";

    // Create new map
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: [vendorLocation.lng, vendorLocation.lat],
      zoom: 12,
      attributionControl: false,
    });

    mapInstance.current = map;

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add attribution
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      })
    );

    // Add vendor marker
    new maplibregl.Marker({ color: "#0071E3" })
      .setLngLat([vendorLocation.lng, vendorLocation.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>${vendorLocation.address}</strong>`
        )
      )
      .addTo(map);
  
    // Add click handler for map using our enhanced function
    map.on("click", handleMapClick);

    map.on("load", () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      map.remove();
      clearAllMarkersAndPopups();
    };
  }, [vendorLocation]);

  // Update map when active zone changes
  useEffect(() => {
    if (mapLoaded && mapInstance.current && isochrones.length > 0) {
      updateMapIsochrones(isochrones);
    }
  }, [activeZoneIndex, mapLoaded, isochrones]);

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delivery Zones
            </h2>
            <p className="text-gray-500 mt-1">
              {rangeType === "distance"
                ? `${
                    transportMode.charAt(0).toUpperCase() +
                    transportMode.slice(1)
                  } travel distance`
                : `${
                    transportMode.charAt(0).toUpperCase() +
                    transportMode.slice(1)
                  } travel time`}
            </p>
          </div>

          {extendedMode && (
            <Button
              variant={isExtendingEnabled ? "default" : "outline"}
              onClick={toggleExtendMode}
              className={`rounded-full px-4 py-1 ${
                isExtendingEnabled
                  ? "bg-purple-600 hover:bg-purple-700 text-white"
                  : ""
              }`}
              disabled={loading}
            >
              <Maximize className="h-4 w-4 mr-1" />
              {isExtendingEnabled ? "Exit Extend Mode" : "Extend Coverage"}
            </Button>
          )}
        </div>

        <Card className="bg-white border-gray-200 p-4">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-gray-900">Vendor Location</h3>
              <p className="text-sm text-gray-600">{vendorLocation?.address}</p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                {getTransportIcon()}
                <span>
                  {rangeType === "distance"
                    ? `Zones based on ${transportMode} distance (km)`
                    : `Zones based on ${transportMode} travel time (min)`}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefetch}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Map with isochrones */}
        <div className="h-[500px] rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
          <div ref={mapRef} className="w-full h-full relative rounded-lg" />

          {(loading || isochroneLoading) && (
            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                <p className="text-blue-600 font-medium">Loading zones...</p>
              </div>
            </div>
          )}

          {/* Map badge */}
          <div className="absolute top-2 left-2 z-10">
            <div className="bg-white/80 px-2 py-1 rounded-md text-xs flex items-center">
              <MapIcon className="h-3 w-3 mr-1" />
              <span>winneMart</span>
            </div>
          </div>
          
          {/* Directions info card */}
          {showDirections && directionsDistance !== null && directionsTime && (
            <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-md p-3 max-w-xs">
              <div className="flex items-center mb-2">
                <Navigation className="h-4 w-4 text-blue-500 mr-2" />
                <h3 className="font-medium text-sm">Direction to Point</h3>
              </div>
              <div className="space-y-1 text-xs">
                <p>Distance: {directionsDistance.toFixed(2)} km</p>
                <p>Est. Travel Time: {directionsTime}</p>
                <p>Transport Mode: {transportMode}</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="mt-2 text-xs w-full" 
                onClick={clearDirections}
              >
                Hide Directions
              </Button>
            </div>
          )}
        </div>

        {!isExtendingEnabled &&
          isochrones.length > 0 &&
          !loading &&
          !isochroneLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {zoneDetails.map((zone, index) => (
                <div
                  key={index}
                  className={`border-t-4 rounded-lg shadow-sm transition-shadow hover:shadow-md cursor-pointer ${
                    activeZoneIndex === index
                      ? "ring-2 ring-blue-500 shadow-md"
                      : ""
                  }`}
                  style={{
                    borderTopColor: zone.color,
                  }}
                  onClick={() => handleZoneCardClick(index)}
                >
                  <div className="p-4 bg-white">
                    <h3 className="font-medium text-gray-900">
                      Zone {index + 1}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatRangeLabel(index)}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-lg font-semibold">
                        {zone.deliveryFee === 0
                          ? "Free Delivery"
                          : `${zone.deliveryFee.toFixed(2)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Min. ${zone.minimumOrder}
                      </p>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        {zone.description}
                      </p>
                      <div className="flex justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          Est. delivery: {zone.estimatedDeliveryTime}
                        </p>
                        <p className="text-xs text-gray-500">
                          {zone.area.toFixed(1)} km²
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
          <div className="flex items-start">
            <Info className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">How to use this visualization:</p>
              <p className="mt-1">
                Click on any zone card or area on the map to focus on that
                specific delivery zone. Click anywhere on the map to see
                delivery information for that location. Click "Show Directions" in the popup 
                to display a route from the vendor to your selected point.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            // onClick={onBack}
            className="rounded-full px-5 border-gray-200 text-gray-600"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 font-medium"
            onClick={() => {
              clearAllMarkersAndPopups();
              setActiveZoneIndex(null);
            }}
            disabled={
              loading ||
              isochroneLoading ||
              Boolean(error) ||
              isochrones.length === 0
            }
          >
           Clean
          </Button>
        </div>
      </div>
    </div>
  )}