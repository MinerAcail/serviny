"use client"

import { useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import * as extendedUtils from "./extendedIsochroneUtils"
import { Button } from "@/components/ui/button"
import { PlusCircle, Loader2, Map as MapIcon, Info, History } from "lucide-react"

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
  activeZoneIndex?: number | null // Prop for showing only selected zone
  onZoneClick?: (index: number) => void // Callback for zone click
  extendedMode?: boolean // Whether extended mode is enabled
  allowExtending?: boolean // Whether to allow adding new zones
  onExtendGenerated?: (extendedData: any) => void // Callback when extended data is generated
  generateZoneForPoint?: (point: [number, number]) => Promise<any> // Function to generate isochrone for a point
  suggestedPoints?: [number, number][] // Optional suggested points for extending coverage
  showSavedIsochrones?: boolean // Whether to show saved isochrones
}
const envApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

export function IsochroneMap({ 
  vendorLocation, 
  isochrones, 
  transportMode,
  rangeType,
  ranges,
  activeZoneIndex = null,
  onZoneClick,
  extendedMode = false,
  allowExtending = false,
  onExtendGenerated,
  generateZoneForPoint,
  suggestedPoints = [],
  showSavedIsochrones = false
}: IsochroneMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [extendModeActive, setExtendModeActive] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<[number, number] | null>(null)
  const [tempMarker, setTempMarker] = useState<maplibregl.Marker | null>(null)
  const [isGeneratingExtension, setIsGeneratingExtension] = useState(false)
  const [extendedZones, setExtendedZones] = useState<extendedUtils.IsochroneZone[]>([])
  const [mergedCoverage, setMergedCoverage] = useState<any>(null)
  const [suggestedMarkers, setSuggestedMarkers] = useState<maplibregl.Marker[]>([])
  const [infoPopup, setInfoPopup] = useState<maplibregl.Popup | null>(null)
  const [savedFeaturePopups, setSavedFeaturePopups] = useState<{[key: string]: maplibregl.Popup}>({})

  // Define a color palette for zones (from green to yellow to red)
  const zoneColors = ["#4ade80", "#facc15", "#f87171", "#60a5fa", "#a78bfa", "#f472b6"]

  // Get appropriate zoom level based on transportation mode
  const getInitialZoom = (mode: TransportMode, rangeValues: number[]): number => {
    // For time-based ranges, we need to estimate distance
    if (rangeType === "time") {
      const maxRange = Math.max(...rangeValues)
      
      // If in extended mode, adjust zoom levels for larger areas
      if (extendedMode && maxRange > 60) {
        if (mode === "walking") return 9 // Lower zoom for extended walking
        if (mode === "bike") return 8    // Lower zoom for extended biking
        if (mode === "motorbike") return 7 // Lower zoom for extended motorbike
        return 6 // Even lower zoom for extended car trips
      }
      
      // Standard zoom calculations for regular ranges
      if (mode === "walking") return maxRange > 60 ? 11 : 13
      if (mode === "bike") return maxRange > 60 ? 10 : 12
      if (mode === "motorbike") return maxRange > 60 ? 9 : 11
      return maxRange > 60 ? 8 : 10 // car
    } else {
      // For distance-based ranges
      const maxRange = Math.max(...rangeValues)
      
      // If in extended mode, adjust zoom levels
      if (extendedMode && maxRange > 30) {
        if (maxRange > 100) return 6 // Very far distances
        if (maxRange > 50) return 7
        return 8
      }
      
      // Standard zoom calculations
      if (maxRange > 50) return 8 // Far distances
      if (maxRange > 30) return 9
      if (maxRange > 20) return 10
      if (maxRange > 10) return 11
      if (maxRange > 5) return 12
      return 13 // Short distances
    }
  }

  // Handle generating an extension for the currently selected point
  const handleGenerateExtension = async () => {
    if (!selectedPoint || !generateZoneForPoint || !mapInstance.current) return;
    
    setIsGeneratingExtension(true);
    
    try {
      // Generate isochrone for the selected point
      const newIsochroneData = await generateZoneForPoint(selectedPoint);
      
      // Process the new isochrone
      const result = extendedUtils.processNewIsochroneZone(
        newIsochroneData,
        extendedZones,
        selectedPoint,
        ranges[0] * 60, // Convert first range to seconds
        transportMode,
        false // Not the original isochrone
      );
      
      // Update state with new zones and merged coverage
      setExtendedZones(result.allZones);
      setMergedCoverage(result.mergedCoverage);
      
      // Call the callback if provided
      if (onExtendGenerated) {
        onExtendGenerated(result);
      }
      
      // Visualize the result on the map
      const vizData = extendedUtils.createVisualizationData(
        result.allZones,
        result.mergedCoverage,
        true // Show additional areas
      );
      
      updateMapVisualization(vizData);
      
      // Show statistics popup
      showStatisticsPopup(result);
      
      // Exit extend mode after generating
      cancelExtendMode();
    } catch (error) {
      console.error("Error generating extension:", error);
    } finally {
      setIsGeneratingExtension(false);
    }
  };
  
  // Show a popup with statistics about the new extension
  const showStatisticsPopup = (result: any) => {
    if (!mapInstance.current || !result.newZone) return;
    
    const map = mapInstance.current;
    
    // Calculate how much area this point added
    const additionalAreaKm2 = result.newZone.additionalCoverage 
      ? extendedUtils.calculateArea(result.newZone.additionalCoverage)
      : 0;
    
    // Calculate total area now
    const totalAreaKm2 = extendedUtils.calculateArea(result.mergedCoverage);
    
    // Create popup content
    const popupContent = `
      <div class="p-2">
        <h3 class="font-medium text-sm">Coverage Extended</h3>
        <p class="text-xs mt-1">Added: ${additionalAreaKm2.toFixed(1)} km²</p>
        <p class="text-xs">Total: ${totalAreaKm2.toFixed(1)} km²</p>
      </div>
    `;
    
    // Create and show popup
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '200px'
    })
    .setLngLat(result.newZone.sourcePoint)
    .setHTML(popupContent)
    .addTo(map);
    
    // Store popup reference
    setInfoPopup(popup);
    
    // Remove popup after a few seconds
    setTimeout(() => {
      popup.remove();
      setInfoPopup(null);
    }, 5000);
  };

  // Update map visualization with new data
  const updateMapVisualization = (vizData: any) => {
    if (!mapInstance.current) return;
    
    const map = mapInstance.current;
    
    // Check if the source already exists
    if (map.getSource('extended-isochrones')) {
      // Update the existing source
      const source = map.getSource('extended-isochrones') as maplibregl.GeoJSONSource;
      source.setData(vizData);
    } else {
      // Add the source and layers for extended isochrones
      map.addSource('extended-isochrones', {
        type: 'geojson',
        data: vizData
      });
      
      // Add merged coverage fill layer
      map.addLayer({
        id: 'merged-coverage-fill',
        type: 'fill',
        source: 'extended-isochrones',
        filter: ['==', ['get', 'isMergedCoverage'], true],
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': ['get', 'fillOpacity']
        }
      });
      
      // Add merged coverage outline
      map.addLayer({
        id: 'merged-coverage-line',
        type: 'line',
        source: 'extended-isochrones',
        filter: ['==', ['get', 'isMergedCoverage'], true],
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-width': ['get', 'strokeWidth'],
          'line-opacity': 0.8
        }
      });
      
      // Add additional coverage layer
      map.addLayer({
        id: 'additional-coverage-fill',
        type: 'fill',
        source: 'extended-isochrones',
        filter: ['==', ['get', 'isAdditionalCoverage'], true],
        paint: {
          'fill-color': ['get', 'fillColor'],
          'fill-opacity': ['get', 'fillOpacity']
        }
      });
      
      // Add additional coverage outline
      map.addLayer({
        id: 'additional-coverage-line',
        type: 'line',
        source: 'extended-isochrones',
        filter: ['==', ['get', 'isAdditionalCoverage'], true],
        paint: {
          'line-color': ['get', 'strokeColor'],
          'line-width': ['get', 'strokeWidth'],
          'line-opacity': 0.8
        }
      });
      
      // Add source points layer
      map.addLayer({
        id: 'source-points',
        type: 'circle',
        source: 'extended-isochrones',
        filter: ['==', ['get', 'isSourcePoint'], true],
        paint: {
          'circle-radius': ['get', 'pointSize'],
          'circle-color': ['get', 'pointColor'],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      
      // Add suggested points layer
      map.addLayer({
        id: 'suggested-points',
        type: 'circle',
        source: 'extended-isochrones',
        filter: ['==', ['get', 'isSuggestedPoint'], true],
        paint: {
          'circle-radius': ['get', 'pointSize'],
          'circle-color': ['get', 'pointColor'],
          'circle-opacity': 0.6,
          'circle-stroke-width': ['get', 'pointStrokeWidth'],
          'circle-stroke-color': ['get', 'pointStrokeColor']
        }
      });
    }
  };

  // Add saved isochrones to the map
  const addSavedIsochrones = () => {
    if (!mapInstance.current || !isochrones || isochrones.length === 0) return;
    
    const map = mapInstance.current;
    
    // Clear any existing saved isochrone popups
    Object.values(savedFeaturePopups).forEach(popup => popup.remove());
    setSavedFeaturePopups({});
    
    // Create a GeoJSON source for saved isochrones
    map.addSource("saved-isochrones", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: isochrones,
      },
    });
    
    // Add fill layer for saved isochrones
    map.addLayer({
      id: "saved-isochrone-fill",
      type: "fill",
      source: "saved-isochrones",
      layout: {},
      paint: {
        "fill-color": [
          "match",
          ["to-number", ["get", "group_index"]], // Using group_index which should be 0, 1, 2, etc.
          // Map each group index to a color from our palette
          0, zoneColors[0],
          1, zoneColors[1],
          2, zoneColors[2],
          3, zoneColors[3],
          4, zoneColors[4],
          5, zoneColors[5],
          // Default color if no match
          zoneColors[0]
        ],
        "fill-opacity": 0.4,
        "fill-outline-color": "#ffffff"
      }
    });
    
    // Add outline layer for saved isochrones
    map.addLayer({
      id: "saved-isochrone-outline",
      type: "line",
      source: "saved-isochrones",
      layout: {},
      paint: {
        "line-color": [
          "match",
          ["to-number", ["get", "group_index"]], // Using group_index which should be 0, 1, 2, etc.
          // Map each group index to a color from our palette
          0, zoneColors[0],
          1, zoneColors[1],
          2, zoneColors[2],
          3, zoneColors[3],
          4, zoneColors[4],
          5, zoneColors[5],
          // Default color if no match
          zoneColors[0]
        ],
        "line-width": 2,
        "line-opacity": 0.8
      }
    });
    
    // Add click interaction to show popups for saved isochrones
    map.on('click', 'saved-isochrone-fill', (e) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const props = feature.properties || {};
        
        // Create popup content with information about the saved isochrone
        const popupContent = `
          <div class="p-3">
            <h3 class="font-medium text-sm mb-1">Saved Delivery Zone</h3>
            <p class="text-xs"><strong>Location:</strong> ${props.address || 'Unknown location'}</p>
            <p class="text-xs"><strong>Transport:</strong> ${props.transportMode || transportMode}</p>
            <p class="text-xs"><strong>Range:</strong> ${props.range || 'Unknown'} ${props.rangeType || rangeType}</p>
            <p class="text-xs"><strong>Area:</strong> ${(props.areaInSqKm || 0).toFixed(1)} km²</p>
            <p class="text-xs text-gray-500 mt-1">Saved: ${new Date(props.created_at).toLocaleDateString()}</p>
          </div>
        `;
        
        // Create popup
        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          maxWidth: '300px',
          className: 'saved-isochrone-popup'
        })
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
        
        // Store popup reference
        const featureId = props.isochrone_id || `feature-${Object.keys(savedFeaturePopups).length}`;
        setSavedFeaturePopups(prevPopups => ({
          ...prevPopups,
          [featureId]: popup
        }));
        
        // Remove popup from state when closed
        popup.on('close', () => {
          setSavedFeaturePopups(prevPopups => {
            const { [featureId]: _, ...rest } = prevPopups;
            return rest;
          });
        });
      }
    });
    
    // Change cursor when hovering over saved isochrones
    map.on('mouseenter', 'saved-isochrone-fill', () => {
      map.getCanvas().style.cursor = 'pointer';
    });
    
    map.on('mouseleave', 'saved-isochrone-fill', () => {
      map.getCanvas().style.cursor = '';
    });
    
    // Fit bounds to show all saved isochrones
    const bounds = new maplibregl.LngLatBounds();
    
    // Expand bounds to include all isochrone points
    isochrones.forEach(feature => {
      // Check for valid geometry
      if (feature.geometry && feature.geometry.coordinates && feature.geometry.coordinates.length > 0) {
        // For polygons
        if (feature.geometry.type === 'Polygon' && Array.isArray(feature.geometry.coordinates[0])) {
          feature.geometry.coordinates[0].forEach((coord: number[]) => {
            bounds.extend([coord[0], coord[1]]);
          });
        }
        // For multipolygon support
        else if (feature.geometry.type === 'MultiPolygon') {
          feature.geometry.coordinates.forEach((polygon: any) => {
            polygon[0].forEach((coord: number[]) => {
              bounds.extend([coord[0], coord[1]]);
            });
          });
        }
      }
    });
    
    // Only fit bounds if we have a valid bounds object
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: { top: 40, bottom: 40, left: 40, right: 40 },
        maxZoom: getInitialZoom(transportMode, ranges)
      });
    }
  };

  // Remove current isochrones from the map
  const removeCurrentIsochrones = () => {
    if (!mapInstance.current) return;
    
    const map = mapInstance.current;
    
    // Remove layers and source for current isochrones
    if (map.getLayer('isochrone-fill')) {
      map.removeLayer('isochrone-fill');
    }
    
    if (map.getLayer('isochrone-outline')) {
      map.removeLayer('isochrone-outline');
    }
    
    if (map.getSource('isochrones')) {
      map.removeSource('isochrones');
    }
  };
  
  // Remove saved isochrones from the map
  const removeSavedIsochrones = () => {
    if (!mapInstance.current) return;
    
    const map = mapInstance.current;
    
    // Remove layers and source for saved isochrones
    if (map.getLayer('saved-isochrone-fill')) {
      map.removeLayer('saved-isochrone-fill');
    }
    
    if (map.getLayer('saved-isochrone-outline')) {
      map.removeLayer('saved-isochrone-outline');
    }
    
    if (map.getSource('saved-isochrones')) {
      map.removeSource('saved-isochrones');
    }
    
    // Remove any popups
    Object.values(savedFeaturePopups).forEach(popup => popup.remove());
    setSavedFeaturePopups({});
  };

  // Start extend mode
  const startExtendMode = () => {
    if (!mapInstance.current) return;
    
    setExtendModeActive(true);
    
    // Change cursor to crosshair
    mapInstance.current.getCanvas().style.cursor = 'crosshair';
  };
  
  // Cancel extend mode
  const cancelExtendMode = () => {
    if (!mapInstance.current) return;
    
    setExtendModeActive(false);
    setSelectedPoint(null);
    
    // Remove temp marker if it exists
    if (tempMarker) {
      tempMarker.remove();
      setTempMarker(null);
    }
    
    // Restore cursor
    mapInstance.current.getCanvas().style.cursor = '';
  };

  // Add suggested points to the map
  const addSuggestedPointsToMap = () => {
    // Clear existing markers
    suggestedMarkers.forEach(marker => marker.remove());
    
    if (!mapInstance.current || !suggestedPoints || suggestedPoints.length === 0) {
      setSuggestedMarkers([]);
      return;
    }
    
    const map = mapInstance.current;
    const newMarkers: maplibregl.Marker[] = [];
    
    // Add markers for suggested points
    suggestedPoints.forEach((point, index) => {
      // Create popup with suggestion info
      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 15,
        className: 'suggestion-popup'
      }).setHTML(`
        <div class="p-2">
          <p class="text-xs font-medium">Suggested Point ${index + 1}</p>
          <p class="text-xs text-gray-500">Click to add coverage</p>
        </div>
      `);
      
      // Create marker
      const marker = new maplibregl.Marker({
        color: '#f97316', // Orange
        scale: 0.8,
        draggable: false
      })
      .setLngLat(point)
      .setPopup(popup)
      .addTo(map);
      
      // Add click handler to select this suggested point
      marker.getElement().addEventListener('click', () => {
        if (tempMarker) {
          tempMarker.remove();
        }
        
        // Set as selected point
        setSelectedPoint(point);
        
        // Create new temp marker
        const selectedMarker = new maplibregl.Marker({
          color: '#8b5cf6', // Purple
          draggable: false
        })
        .setLngLat(point)
        .addTo(map);
        
        setTempMarker(selectedMarker);
        
        // Close popup
        marker.getPopup().remove();
      });
      
      newMarkers.push(marker);
    });
    
    setSuggestedMarkers(newMarkers);
  };

  useEffect(() => {
    if (!mapRef.current) return

    // Clean up previous map instance
    if (mapInstance.current) {
      mapInstance.current.remove()
    }

    // Create a new map instance
    const mapStyle = envApiKey 
      ? `https://api.maptiler.com/maps/streets/style.json?key=${envApiKey}` 
      : 'https://demotiles.maplibre.org/style.json'; // Fallback style if no API key
    
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
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

    // Add click handler for map to place markers in extend mode
    map.on('click', (e) => {
      if (allowExtending && !isGeneratingExtension) {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat];
        
        // Remove previous temp marker if it exists
        if (tempMarker) {
          tempMarker.remove();
        }
        
        // Create new marker
        const marker = new maplibregl.Marker({
          color: '#8b5cf6', // Purple color for extension points
          draggable: false
        })
        .setLngLat(coordinates)
        .addTo(map);
        
        // Save the marker and point
        setTempMarker(marker);
        setSelectedPoint(coordinates);
      }
    });

    map.on("load", () => {
      setMapLoaded(true)

      // Handle saved isochrones if needed
      if (showSavedIsochrones && isochrones && isochrones.length > 0) {
        addSavedIsochrones();
        return; // Don't add current isochrones
      }

      // Process the original isochrone if available
      if (isochrones && isochrones.length > 0 && !showSavedIsochrones) {
        // Process the isochrones to ensure proper ordering
        // We need to reverse them so that smaller areas are drawn on top
        const sortedIsochrones = [...isochrones].reverse()

        // If we're in extend mode, process the isochrones as extended zones
        if (allowExtending && extendedZones.length === 0) {
          // For the first isochrone, process it as the original zone
          const mainIsochrone = sortedIsochrones[0];
          
          if (mainIsochrone) {
            const result = extendedUtils.processNewIsochroneZone(
              mainIsochrone,
              [], // No existing zones yet
              [vendorLocation.lng, vendorLocation.lat], // Original vendor location
              ranges[0] * 60, // Convert first range to seconds
              transportMode,
              true // This is the original isochrone
            );
            
            // Update state with zones and coverage
            setExtendedZones([result.newZone]);
            setMergedCoverage(result.mergedCoverage);
            
            // Create visualization data
            const vizData = extendedUtils.createVisualizationData(
              [result.newZone],
              result.mergedCoverage,
              true // Show additional areas
            );
            
            // Visualize on the map
            updateMapVisualization(vizData);
          }
        }
        
        // For standard view (not extending), use the regular layers
        if (!allowExtending) {
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
                  3, zoneColors[3],
                  4, zoneColors[4],
                  5, zoneColors[5],
                  // Default color if no match
                  zoneColors[0]]
              ],
              "fill-opacity": [
                "case",
                // If it's an extended isochrone, make it slightly more translucent
                ["==", ["get", "extended"], true],
                0.3,
                // Otherwise use standard opacity
                0.4
              ]
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
                  3, zoneColors[3],
                  4, zoneColors[4],
                  5, zoneColors[5],
                  // Default color if no match
                  zoneColors[0]]
              ],
              "line-width": [
                "case",
                // If it's an extended isochrone, use thicker line
                ["==", ["get", "extended"], true],
                3,
                // Otherwise use standard width
                2
              ],
              "line-opacity": 0.8,
              "line-dasharray": [
                "case",
                // If it's an extended isochrone, use dashed line
                ["==", ["get", "extended"], true],
                ["literal", [2, 2]],
                // Otherwise use solid line
                ["literal", [1, 0]]
              ]
            },
          })

          // Add click interaction for zones
          if (onZoneClick) {
            map.on('click', 'isochrone-fill', (e) => {
              if (e.features && e.features.length > 0) {
                const feature = e.features[0];
                const groupIndex = feature.properties?.group_index || 0;
                
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
      
      // Clean up markers
      suggestedMarkers.forEach(marker => marker.remove());
      
      if (tempMarker) {
        tempMarker.remove();
      }
      
      if (infoPopup) {
        infoPopup.remove();
      }
      
      // Clean up saved feature popups
      Object.values(savedFeaturePopups).forEach(popup => popup.remove());
    }
  }, [vendorLocation, isochrones, transportMode, rangeType, ranges, activeZoneIndex, onZoneClick, extendedMode, showSavedIsochrones]);

  // Update isochrones when activeZoneIndex changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current || !isochrones || isochrones.length === 0) return

    // Skip if we're in extend mode or showing saved isochrones
    if (allowExtending || showSavedIsochrones) return;

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
  }, [isochrones, mapLoaded, activeZoneIndex, allowExtending, showSavedIsochrones])

  // Add or update suggested points when they change
  useEffect(() => {
    if (mapLoaded && mapInstance.current && allowExtending && suggestedPoints.length > 0) {
      addSuggestedPointsToMap();
    }
  }, [mapLoaded, suggestedPoints, allowExtending]);

  // Set to extend mode when allowExtending changes
  useEffect(() => {
    if (allowExtending && mapLoaded && !extendModeActive) {
      startExtendMode();
    } else if (!allowExtending && extendModeActive) {
      cancelExtendMode();
    }
  }, [allowExtending, mapLoaded, extendModeActive]);
  
  // Toggle between saved and current isochrones
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    
    // Handle showing saved isochrones
    if (showSavedIsochrones) {
      // Remove current isochrones if they exist
      removeCurrentIsochrones();
      
      // Add saved isochrones
      if (isochrones && isochrones.length > 0) {
        addSavedIsochrones();
      }
    } else {
      // Remove saved isochrones if they exist
      removeSavedIsochrones();
      
      // Re-initialize map (to add current isochrones again)
      if (mapInstance.current) {
        const center = mapInstance.current.getCenter();
        const zoom = mapInstance.current.getZoom();
        
        mapInstance.current.remove();
        
        // Create a new map instance with the same center and zoom
        const mapStyle = envApiKey 
          ? `https://api.maptiler.com/maps/streets/style.json?key=${envApiKey}` 
          : 'https://demotiles.maplibre.org/style.json';
        
        const newMap = new maplibregl.Map({
          container: mapRef.current!,
          style: mapStyle,
          center: center,
          zoom: zoom,
          attributionControl: false,
        });
        
        mapInstance.current = newMap;
        
        // Add navigation controls
        newMap.addControl(new maplibregl.NavigationControl(), "top-right");
        
        // Add attribution
        newMap.addControl(new maplibregl.AttributionControl({
          compact: true
        }));
        
        // Add vendor marker with popup
        const popup = new maplibregl.Popup({ offset: 25 })
          .setHTML(`<strong>${vendorLocation.address}</strong>`);
        
        new maplibregl.Marker({ 
          color: "#0071E3",
          draggable: false,
        })
        .setLngLat([vendorLocation.lng, vendorLocation.lat])
        .setPopup(popup)
        .addTo(newMap);
        
        // Re-add click handlers and other logic
        newMap.on('load', () => {
          setMapLoaded(true);
          
          if (isochrones && isochrones.length > 0) {
            // Add isochrone polygons as a source
            newMap.addSource("isochrones", {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: activeZoneIndex !== null 
                  ? [isochrones[activeZoneIndex]] 
                  : isochrones,
              },
            });
            
            // Add a fill layer for the isochrones
            newMap.addLayer({
              id: "isochrone-fill",
              type: "fill",
              source: "isochrones",
              layout: {},
              paint: {
                "fill-color": [
                  "match",
                  ["to-number", ["get", "group_index"]], 
                  0, zoneColors[0],
                  1, zoneColors[1],
                  2, zoneColors[2],
                  3, zoneColors[3],
                  4, zoneColors[4],
                  5, zoneColors[5],
                  zoneColors[0]
                ],
                "fill-opacity": 0.4
              },
            });
            
            // Add an outline layer for the isochrones
            newMap.addLayer({
              id: "isochrone-outline",
              type: "line",
              source: "isochrones",
              layout: {},
              paint: {
                "line-color": [
                  "match",
                  ["to-number", ["get", "group_index"]], 
                  0, zoneColors[0],
                  1, zoneColors[1],
                  2, zoneColors[2],
                  3, zoneColors[3],
                  4, zoneColors[4],
                  5, zoneColors[5],
                  zoneColors[0]
                ],
                "line-width": 2,
                "line-opacity": 0.8
              },
            });
            
            // Add click interaction for zones
            if (onZoneClick) {
              newMap.on('click', 'isochrone-fill', (e) => {
                if (e.features && e.features.length > 0) {
                  const feature = e.features[0];
                  const groupIndex = feature.properties?.group_index || 0;
                  onZoneClick(Number(groupIndex));
                }
              });
              
              newMap.on('mouseenter', 'isochrone-fill', () => {
                newMap.getCanvas().style.cursor = 'pointer';
              });
              
              newMap.on('mouseleave', 'isochrone-fill', () => {
                newMap.getCanvas().style.cursor = '';
              });
            }
          }
        });
      }
    }
  }, [showSavedIsochrones, mapLoaded, isochrones]);

return (
    <div className="w-full h-full relative">
      <div ref={mapRef} className="w-full h-full relative rounded-lg">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0071E3]"></div>
          </div>
        )}
      </div>

      {/* Processing indicator */}
      {isGeneratingExtension && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10 rounded-lg">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 mb-2 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Generating Extended Coverage...</p>
          </div>
        </div>
      )}

      {/* Generate button for selected point */}
      {selectedPoint && !isGeneratingExtension && allowExtending && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <Button
            onClick={handleGenerateExtension}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-2 shadow-lg"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Generate Zone
          </Button>
        </div>
      )}
      
      {/* Map info badge */}
      <div className="absolute top-2 left-2 z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md text-xs flex items-center">
          <MapIcon className="h-3 w-3 mr-1" />
          <span>MapTiler</span>
        </div>
      </div>
      
      {/* Saved isochrones badge */}
      {showSavedIsochrones && (
        <div className="absolute bottom-2 right-2 z-10">
          <div className="bg-blue-600/90 text-white px-3 py-1 rounded-md text-xs flex items-center">
            <History className="h-3 w-3 mr-1" />
            <span>Viewing Saved Zones</span>
          </div>
        </div>
      )}

      {/* Suggested points info */}
      {allowExtending && suggestedPoints.length > 0 && (
        <div className="absolute top-2 right-12 z-10">
          <div className="bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded-md text-xs flex items-center">
            <Info className="h-3 w-3 mr-1" />
            <span>Orange dots suggest optimal extension points</span>
          </div>
        </div>
      )}
    </div>
  )
}
