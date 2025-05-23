import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-popup.css";

import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import {
  createMarkerAtLocation,
  clearAllMarkersAndPopups,
  clearDirections,
  createDirectRoute,
  updateMapIsochrones,
} from "./mapUtils";
import {
  processIsochroneData,
  calculateZoneDetails,
  calculatePointDeliveryInfo,
  TransportMode,
  Location,
  safeParseGeoJSON,
} from "./dataUtils";
import { MapAndSearch } from "./mapAndSearch";
import { useParams, useSearchParams } from "react-router";
import { DeliveryZoneVisualizerMenu } from "./integrationMenu";
import { toast } from "sonner";
import { useClosestIsochrone } from "./useClosestIsochrone";

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];

export function DeliveryZoneVisualizer() {
  const { riderId } = useParams<{ riderId: string }>(); // Get riderId from URL

  // ==========================================
  // Environment and API Keys
  // ==========================================
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // Add React Router hooks
  const [searchParams, setSearchParams] = useSearchParams();

  // ==========================================
  // State Management
  // ==========================================

  // Isochrone and zones state
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null);
  const [isochrones, setIsochrones] = useState<any[]>([]);
  const [zoneDetails, setZoneDetails] = useState<any[]>([]);
  const [vendorLocation, setVendorLocation] = useState<Location | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [ranges, setRanges] = useState<number[]>([]);

  // Map state
  const [mapLoaded, setMapLoaded] = useState(false);

  // Location state - initialize from URL if available
  const [clickedPoint, setClickedPoint] = useState<{
    lng: number;
    lat: number;
  } | null>(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");

    if (lat && lng) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    }

    return null;
  });

  const [showDirections, setShowDirections] = useState(false);
  const [directionsDistance, setDirectionsDistance] = useState<number | null>(
    null
  );
  const [directionsTime, setDirectionsTime] = useState<string | null>(null);
  const [directionsReady, setDirectionsReady] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search state
  const [searchValue, setSearchValue] = useState("");
  const [predictions, setPredictions] = useState<any[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // ==========================================
  // Refs for DOM elements and MapLibre instances
  // ==========================================
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);

  // Refs for markers and popups
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
  const [clickMarker, setClickMarker] = useState<maplibregl.Marker | null>(
    null
  );
  const [infoPopup, setInfoPopup] = useState<maplibregl.Popup | null>(null);

  // Pin dropper state
  const [isPinDropperActive, setIsPinDropperActive] = useState(false);
  // const [mapInteractionEnabled, setMapInteractionEnabled] = useState(true);
  const [
    isOpenDeliveryZoneVisualizerMenu,
    setIsOpenDeliveryZoneVisualizerMenu,
  ] = useState(true);

  // Refs for Google Maps services
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries,
  });
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // ==========================================
  // Use the closest isochrone hook with the GraphQL query
  // ==========================================
  // Initialize with location from URL if available
  const initialLocation = clickedPoint
    ? [clickedPoint.lng, clickedPoint.lat]
    : null;

  const {
    riderIsochrones,
    // closestIsochrone,
    isLoading: isochroneLoading,
    // error: isochroneError,
    selectedIsochroneIndex,
    setSelectedIsochroneIndex,
    updateLocation,
    // currentLocation,
  } = useClosestIsochrone(riderId, initialLocation);

  // ==========================================
  // URL State Management
  // ==========================================

  // Create URL-aware clicked point setter
  const handleSetClickedPoint = useCallback(
    (point: { lng: number; lat: number } | null) => {
      setClickedPoint(point);

      if (point) {
        // Update URL with new coordinates
        const newParams = new URLSearchParams(searchParams);
        newParams.set("lat", point.lat.toString());
        newParams.set("lng", point.lng.toString());
        setSearchParams(newParams);

        // Update location in the hook
        updateLocation([point.lng, point.lat]);
      } else {
        // Remove coordinates from URL if point is null
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("lat");
        newParams.delete("lng");
        setSearchParams(newParams);
      }
    },
    [setSearchParams, searchParams, updateLocation]
  );

  // ==========================================
  // Effect to process isochrone data when selected isochrone changes
  // ==========================================
  useEffect(() => {
    if (
      riderIsochrones &&
      riderIsochrones.length > 0 &&
      selectedIsochroneIndex < riderIsochrones.length
    ) {
      const selectedIsochrone = riderIsochrones[selectedIsochroneIndex];

      processIsochroneData(
        { getIsochroneResult: selectedIsochrone },
        setRanges,
        setTransportMode,
        setVendorLocation,
        setIsochrones,
        mapLoaded,
        mapInstance,
        updateMapIsochrones,
        (features, ranges) => {
          const details = calculateZoneDetails(
            features,
            ranges,
            "time",
            transportMode
          );
          setZoneDetails(details);
        },
        setError,
        setLoading,
        ranges
      );
    }
  }, [selectedIsochroneIndex, riderIsochrones, mapLoaded]);

  // ==========================================
  // Effect to restore location from URL params and create marker when map loads
  // ==========================================
  useEffect(() => {
    if (
      mapLoaded &&
      mapInstance.current &&
      clickedPoint &&
      vendorLocation &&
      isochrones.length > 0 &&
      zoneDetails.length > 0
    ) {
      // Restore the marker from URL params
      const pointInfo = calculatePointDeliveryInfo(
        [clickedPoint.lng, clickedPoint.lat],
        isochrones,
        vendorLocation,
        zoneDetails,
        transportMode
      );

      if (pointInfo) {
        createMarkerAtLocation(
          clickedPoint.lng,
          clickedPoint.lat,
          pointInfo,
          mapInstance,
          markersRef,
          setClickMarker,
          setDirectionsReady,
          zoneDetails,
          popupsRef,
          setInfoPopup
        );
      }
    }
  }, [mapLoaded, isochrones, vendorLocation, zoneDetails, clickedPoint]);

  // ==========================================
  // Google Places Search Functions
  // ==========================================
  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      if (value.length > 2 && autocompleteServiceRef.current) {
        setShowPredictions(true);
        fetchPredictions(value);
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    },
    []
  );

  // Fetch predictions from Google Places API
  const fetchPredictions = useCallback(async (input: string) => {
    if (!autocompleteServiceRef.current) return;

    try {
      setIsSearchLoading(true);

      autocompleteServiceRef.current.getPlacePredictions(
        { input },
        (predictions, status) => {
          setIsSearchLoading(false);

          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            console.error("Error fetching predictions:", status);
            setPredictions([]);
            return;
          }

          setPredictions(
            predictions.map((p) => ({
              description: p.description,
              place_id: p.place_id,
              structured_formatting: {
                main_text: p.structured_formatting?.main_text || p.description,
                secondary_text: p.structured_formatting?.secondary_text || "",
              },
            }))
          );
        }
      );
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setIsSearchLoading(false);
      setPredictions([]);
    }
  }, []);

  // Handle prediction selection
  const handlePredictionSelect = useCallback(
    (place: any) => {
      setSearchValue(place.description);
      setShowPredictions(false);

      if (!mapDivRef.current) return;

      // Initialize Places service if not already initialized
      if (!placesServiceRef.current && mapDivRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(
          mapDivRef.current
        );
      }

      if (placesServiceRef.current) {
        placesServiceRef.current.getDetails(
          {
            placeId: place.place_id,
            fields: ["geometry", "formatted_address"],
          },
          (result, status) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result &&
              result.geometry &&
              result.geometry.location
            ) {
              const lat = result.geometry.location.lat();
              const lng = result.geometry.location.lng();

              // Clear previous markers and popups
              clearAllMarkersAndPopups(
                markersRef,
                popupsRef,
                clickMarker,
                setClickMarker,
                infoPopup,
                setInfoPopup,
                () => {}, // Don't clear clickedPoint yet
                setDirectionsReady
              );

              // Update the clicked point (this will also update the hook)
              handleSetClickedPoint({ lng, lat });
            } else {
              console.error("Error getting place details:", status);
            }
          }
        );
      } else if (geocoderRef.current) {
        // Fallback to geocoding if PlacesService isn't available
        geocoderRef.current.geocode(
          { address: place.description },
          (results, status) => {
            if (
              status === "OK" &&
              results &&
              results[0] &&
              results[0].geometry
            ) {
              const lat = results[0].geometry.location.lat();
              const lng = results[0].geometry.location.lng();

              // Clear previous markers and popups
              clearAllMarkersAndPopups(
                markersRef,
                popupsRef,
                clickMarker,
                setClickMarker,
                infoPopup,
                setInfoPopup,
                () => {}, // Don't clear clickedPoint yet
                setDirectionsReady
              );

              // Update the clicked point (this will also update the hook)
              handleSetClickedPoint({ lng, lat });
            } else {
              console.error("Geocoding failed:", status);
            }
          }
        );
      }
    },
    [
      // isLoaded,
      clickMarker,
      infoPopup,
      handleSetClickedPoint,
    ]
  );

  // ==========================================
  // UI Event Handlers
  // ==========================================
  // Reload isochrone data
  const handleRefetch = useCallback(() => {
    setLoading(true);
    setError(null);
    // Use window.location.reload() as a simple way to refresh all data
    window.location.reload();
  }, []);

  // Handle showing directions for current clicked point
  const handleShowDirectionsClick = useCallback(() => {
    if (clickedPoint && vendorLocation) {
      clearDirections(mapInstance);
      createDirectRoute(
        clickedPoint,
        vendorLocation,
        setLoading,
        setError,
        setDirectionsDistance,
        setDirectionsTime,
        setShowDirections,
        mapInstance,
        transportMode
      );
    } else {
      setError("Please select a location first to show directions");
      setTimeout(() => setError(null), 3000);
    }
  }, [clickedPoint, vendorLocation, transportMode]);

  // Clear search input and selected location
  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    clearAllMarkersAndPopups(
      markersRef,
      popupsRef,
      clickMarker,
      setClickMarker,
      infoPopup,
      setInfoPopup,
      handleSetClickedPoint,
      setDirectionsReady
    );
  }, [clickMarker, infoPopup, handleSetClickedPoint]);

  // Toggle pin dropper mode
  const handleTogglePinDropper = useCallback(() => {
    // Clear existing markers and popups when entering pin dropper mode
    if (!isPinDropperActive) {
      clearAllMarkersAndPopups(
        markersRef,
        popupsRef,
        clickMarker,
        setClickMarker,
        infoPopup,
        setInfoPopup,
        () => {}, // Don't reset URL state until we have a new point
        setDirectionsReady
      );

      // Disable other map interactions
      // setMapInteractionEnabled(false);

      // If directions are shown, clear them
      if (showDirections) {
        clearDirections(mapInstance);
        setShowDirections(false);
      }
    } else {
      // Re-enable map interactions
      // setMapInteractionEnabled(true);
    }

    // Toggle pin dropper mode
    setIsPinDropperActive(!isPinDropperActive);
  }, [isPinDropperActive, clickMarker, infoPopup, showDirections]);

  // Handle location selection from pin dropper
  const handlePinDropperLocationSelected = useCallback(
    (coordinates: { lng: number; lat: number }) => {
      // Update URL state and hook location
      handleSetClickedPoint({ lng: coordinates.lng, lat: coordinates.lat });

      // Exit pin dropper mode
      setIsPinDropperActive(false);
      // setMapInteractionEnabled(true);
    },
    [handleSetClickedPoint]
  );

  // Handler for when the user cancels pin dropper mode
  const handlePinDropperCancel = useCallback(() => {
    // Exit pin dropper mode
    setIsPinDropperActive(false);

    // Re-enable map interactions
    // setMapInteractionEnabled(true);

    // Show toast notification for canceled pin dropping
    toast.info("Pin dropping canceled");
  }, []);

  // ==========================================
  // Effects
  // ==========================================
  // Initialize Google services when API is loaded
  useEffect(() => {
    if (!isLoaded) return;

    autocompleteServiceRef.current =
      new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();
  }, [isLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !vendorLocation) return;

    // Create map style URL
    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
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

    // Add vendor marker
    new maplibregl.Marker({ color: "#0071E3" })
      .setLngLat([vendorLocation.lng, vendorLocation.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>${vendorLocation.address}</strong>`
        )
      )
      .addTo(map);

    map.on("load", () => {
      setMapLoaded(true);

      // Create a hidden div for PlacesService
      const serviceDiv = document.createElement("div");
      serviceDiv.style.display = "none";
      document.body.appendChild(serviceDiv);

      if (isLoaded) {
        placesServiceRef.current = new google.maps.places.PlacesService(
          serviceDiv
        );
      }
    });

    // Cleanup
    return () => {
      map.remove();

      // Clear all markers and popups
      markersRef.current.forEach((marker) => marker.remove());
      popupsRef.current.forEach((popup) => popup.remove());

      // Reset refs and state
      markersRef.current = [];
      popupsRef.current = [];

      if (clickMarker) {
        clickMarker.remove();
        setClickMarker(null);
      }

      if (infoPopup) {
        infoPopup.remove();
        setInfoPopup(null);
      }

      // Clear any directions
      clearDirections(mapInstance);
    };
  }, [vendorLocation, isLoaded, maptilerApiKey]);

  // Update map isochrones when activeZoneIndex changes
  useEffect(() => {
    const map = mapInstance.current;

    if (
      map &&
      isochrones.length > 0 &&
      map.isStyleLoaded() // <-- ensure style is ready
    ) {
      updateMapIsochrones(isochrones, activeZoneIndex, mapInstance);
    } else if (map && isochrones.length > 0) {
      // If not ready, wait for style to load once and then update
      const handleStyleLoad = () => {
        updateMapIsochrones(isochrones, activeZoneIndex, mapInstance);
        map.off("styledata", handleStyleLoad); // Remove listener after use
      };
      map.on("styledata", handleStyleLoad);
    }
  }, [activeZoneIndex, mapLoaded, isochrones]);

  // Close predictions when clicking outside search input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Store the current isochrone index in URL params when it changes
  useEffect(() => {
    if (selectedIsochroneIndex !== undefined) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("isochroneIndex", selectedIsochroneIndex.toString());
      setSearchParams(newParams, { replace: true }); // Use replace to avoid adding to history
    }
  }, [selectedIsochroneIndex, searchParams, setSearchParams]);

  // Restore isochrone index from URL when component mounts
  useEffect(() => {
    const isochroneIndexParam = searchParams.get("isochroneIndex");
    if (isochroneIndexParam && !Number.isNaN(parseInt(isochroneIndexParam))) {
      const index = parseInt(isochroneIndexParam);
      if (
        index >= 0 &&
        riderIsochrones &&
        riderIsochrones.length > 0 &&
        index < riderIsochrones.length
      ) {
        setSelectedIsochroneIndex(index);
      }
    }
  }, [riderIsochrones, searchParams, setSelectedIsochroneIndex]);

  // Function to update map to show all rider isochrones at once
// Function to update map to show all rider isochrones at once
// FIXED showAllRiderIsochrones function implementation
  const showAllRiderIsochrones = useCallback(() => {
    console.log("showAllRiderIsochrones called");
    
    // Check if map is loaded first
    if (!mapLoaded || !mapInstance.current) {
      console.error("Map not loaded yet");
      toast.error("Map not loaded yet", { duration: 3000 });
      return;
    }
    
    // Check if we have isochrones data
    if (!riderIsochrones || riderIsochrones.length === 0 || selectedIsochroneIndex >= riderIsochrones.length) {
      console.error("No isochrones data available");
      toast.error("No isochrones data available", { duration: 3000 });
      return;
    }
    
    try {
      // First clear any active zone index to ensure all zones will be shown
      setActiveZoneIndex(null);
      
      // Direct approach - update the map with all isochrones if they're already processed
      if (isochrones.length > 0) {
        console.log("Using existing isochrones:", isochrones.length);
        updateMapIsochrones(isochrones, null, mapInstance);
        toast.success("Showing all delivery zones", { duration: 3000 });
        return;
      }
      
      // If we don't have processed isochrones yet, we need to process them from the selected isochrone
      const selectedIsochrone = riderIsochrones[selectedIsochroneIndex];
      console.log("Selected isochrone:", selectedIsochrone?.id);
      
      if (!selectedIsochrone || !selectedIsochrone.geojson) {
        console.error("No geojson data in selected isochrone");
        toast.error("No zone data available", { duration: 3000 });
        return;
      }
      
      // Parse the GeoJSON directly
      const parsedGeoJSON = safeParseGeoJSON(selectedIsochrone.geojson);
      
      if (!parsedGeoJSON || !parsedGeoJSON.features || !parsedGeoJSON.features.length) {
        console.error("Invalid GeoJSON data or no features");
        toast.error("Invalid zone data", { duration: 3000 });
        return;
      }
      
      console.log(`Found ${parsedGeoJSON.features.length} features in GeoJSON`);
      
      // Process the features directly
      const processedFeatures = parsedGeoJSON.features.map((feature, index) => {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            group_index: index,
            range: selectedIsochrone.range && selectedIsochrone.range[index] 
              ? selectedIsochrone.range[index] 
              : (index + 1) * 5, // Fallback value if range not provided
            color: ["#4ade80", "#facc15", "#f87171", "#60a5fa", "#a78bfa", "#f472b6"][index % 6],
          },
        };
      });
      
      // Store the processed features in state
      setIsochrones(processedFeatures);
      
      // Calculate zone details for these features
      const tempRanges = selectedIsochrone.range || [5, 10, 15, 20, 25, 30];
      const details = calculateZoneDetails(
        processedFeatures,
        tempRanges,
        "time",
        selectedIsochrone.transportMode || "car"
      );
      setZoneDetails(details);
      
      // Update the map with all zones (null activeZoneIndex)
      updateMapIsochrones(processedFeatures, null, mapInstance);
      
      toast.success("Showing all delivery zones", { duration: 3000 });
    } catch (error) {
      console.error("Error in showAllRiderIsochrones:", error);
      toast.error("Failed to display zones", { duration: 3000 });
    }
  }, [
    mapLoaded,
    mapInstance,
    riderIsochrones,
    selectedIsochroneIndex,
    isochrones,
    setActiveZoneIndex,
    setIsochrones,
    setZoneDetails,
  ]);



  // ==========================================
  // Render Component
  // ==========================================
  return (
    <div className="py-6 font-sans w-full min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Map and Search UI */}
        <MapAndSearch
          // Search related props
          handleSearchChange={handleSearchChange}
          searchValue={searchValue}
          searchInputRef={searchInputRef}
          showPredictions={showPredictions}
          predictions={predictions}
          isSearchLoading={isSearchLoading}
          handleClearSearch={handleClearSearch}
          handlePredictionSelect={handlePredictionSelect}
          // Map state props
          isLoaded={isLoaded}
          loading={loading}
          isPinDropperActive={isPinDropperActive}
          isochroneLoading={isochroneLoading}
          showDirections={showDirections}
          directionsReady={directionsReady}
          directionsDistance={directionsDistance}
          directionsTime={directionsTime}
          // URL-aware location state
          clickedPoint={clickedPoint}
          setClickedPoint={handleSetClickedPoint}
          // Map refs
          mapRef={mapRef}
          mapDivRef={mapDivRef}
          mapInstance={mapInstance}
          // Action handlers
          handleTogglePinDropper={handleTogglePinDropper}
          handleShowDirectionsClick={handleShowDirectionsClick}
          handleRefetch={handleRefetch}
          handlePinDropperLocationSelected={handlePinDropperLocationSelected}
          handlePinDropperCancel={handlePinDropperCancel}
          // Direction state modifiers
          setShowDirections={setShowDirections}
          clearDirections={clearDirections}
          // Error handling
          error={error}
          // Transport mode
          transportMode={transportMode}
          isOpenDeliveryZoneVisualizerMenu={isOpenDeliveryZoneVisualizerMenu}
        />

        {/* Delivery Zone Visualizer Menu with enhanced isochrone selection */}
        <DeliveryZoneVisualizerMenu
          riderIsochrones={riderIsochrones || []}
          selectedIsochroneIndex={selectedIsochroneIndex}
          zoneDetails={zoneDetails}
          activeZoneIndex={activeZoneIndex}
          setActiveZoneIndex={setActiveZoneIndex}
          setSelectedIsochroneIndex={setSelectedIsochroneIndex}
          isOpen={isOpenDeliveryZoneVisualizerMenu}
          setIsOpen={setIsOpenDeliveryZoneVisualizerMenu}
          showAllRiderIsochrones={showAllRiderIsochrones}
          setOpenDeliveryZoneVisualizerMenu={setIsOpenDeliveryZoneVisualizerMenu}
        />
      </div>
    </div>
  );
}
