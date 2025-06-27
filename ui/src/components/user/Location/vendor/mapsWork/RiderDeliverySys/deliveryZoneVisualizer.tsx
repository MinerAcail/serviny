import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "../map-popup.css";

import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import {
  createMarkerAtLocation,
  clearAllMarkersAndPopups,
  clearDirections,
  createDirectRoute,
  updateMapIsochrones,
} from "../mapUtils";

import {
  processIsochroneData,
  calculateZoneDetails,
  calculatePointDeliveryInfo,
  TransportMode,
  Location,
  safeParseGeoJSON,
} from "./Hook/dataUtils";

import { MapAndSearch } from "../mapAndSearch";
import {  useParams, useSearchParams } from "react-router";
import { DeliveryZoneVisualizerMenu } from "./deliveryZoneVisualizerMenu";
import { toast } from "sonner";
import { useVendorIsochrones } from "./Hook/Isochrones";
// import { useVendorIsochrones } from "./useVendorIsochrones"; // New hook for vendor data
// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];



export default function DeliveryZoneVisualizerVendor() {
  const { vendorId } = useParams<{ vendorId: string }>(); // Changed from riderId to vendorId
  const { orderId } = useParams<{ orderId: string }>(); // Changed from riderId to vendorId
  console.log("Order from location state:", orderId);

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

  // Rider selection state
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  const [selectedIsochroneIndex, setSelectedIsochroneIndex] = useState(0);

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

  // SOLUTION 1: Add a state to track when we should auto-show directions
  const [shouldAutoShowDirections, setShouldAutoShowDirections] =
    useState(false);
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
  // Use the vendor isochrones hook with the GraphQL query
  // ==========================================
  // Initialize with location from URL if available
  const initialLocation = clickedPoint
    ? [clickedPoint.lng, clickedPoint.lat]
    : null;

  const {
    vendorMapData,
    allRiders,
    selectedRiderMapData,
    isLoading: isochroneLoading,
    error: isochroneError,
    selectRider,
    updateLocation,
  } = useVendorIsochrones(vendorId, selectedRiderId, initialLocation);

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
  // Effect to process isochrone data when selected rider changes
  // ==========================================
  useEffect(() => {
    if (
      selectedRiderMapData &&
      selectedRiderMapData.length > 0 &&
      selectedIsochroneIndex < selectedRiderMapData.length
    ) {
      const selectedIsochrone = selectedRiderMapData[selectedIsochroneIndex];

      processIsochroneData(
        { getIsochroneResult: selectedIsochrone },
        setRanges,
        setTransportMode,
        setVendorLocation,
        setIsochrones,
        mapLoaded,
        mapInstance,
        updateMapIsochrones,
        (features, ranges, metaData) => {
          const details = calculateZoneDetails(
            features,
            ranges,
            metaData,
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
  }, [selectedIsochroneIndex, selectedRiderMapData, mapLoaded, transportMode]);

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
  }, [
    mapLoaded,
    isochrones,
    vendorLocation,
    zoneDetails,
    clickedPoint,
    transportMode,
  ]);

  // ==========================================
  // Google Places Search Functions
  // ==========================================
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

  useEffect(() => {
    if (
      shouldAutoShowDirections &&
      clickedPoint &&
      vendorLocation &&
      mapLoaded &&
      !showDirections && // Only if directions aren't already showing
      !loading &&
      !isochroneLoading
    ) {
      console.log("Auto-showing directions...");
      handleShowDirectionsClick();
      setShouldAutoShowDirections(false); // Reset the flag
    }
  }, [
    shouldAutoShowDirections,
    clickedPoint,
    vendorLocation,
    mapLoaded,
    showDirections,
    loading,
    isochroneLoading,
    handleShowDirectionsClick,
  ]);

  const handlePredictionSelect = useCallback(
    (place: any) => {
      setSearchValue(place.description);
      setShowPredictions(false);

      if (!mapDivRef.current) return;

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

              clearAllMarkersAndPopups(
                markersRef,
                popupsRef,
                clickMarker,
                setClickMarker,
                infoPopup,
                setInfoPopup,
                () => {},
                setDirectionsReady
              );

              handleSetClickedPoint({ lng, lat });

              // CHANGED: Set flag to auto-show directions instead of setTimeout
              setShouldAutoShowDirections(true);
            } else {
              console.error("Error getting place details:", status);
            }
          }
        );
      } else if (geocoderRef.current) {
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

              clearAllMarkersAndPopups(
                markersRef,
                popupsRef,
                clickMarker,
                setClickMarker,
                infoPopup,
                setInfoPopup,
                () => {},
                setDirectionsReady
              );

              handleSetClickedPoint({ lng, lat });

              // CHANGED: Set flag to auto-show directions instead of setTimeout
              setShouldAutoShowDirections(true);
            } else {
              console.error("Geocoding failed:", status);
            }
          }
        );
      }
    },
    [clickMarker, infoPopup, handleSetClickedPoint] // Removed handleShowDirectionsClick from dependencies
  );

  // ==========================================
  // UI Event Handlers
  // ==========================================
  const handleRefetch = useCallback(() => {
    setLoading(true);
    setError(null);
    window.location.reload();
  }, []);

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

  const handleTogglePinDropper = useCallback(() => {
    if (!isPinDropperActive) {
      clearAllMarkersAndPopups(
        markersRef,
        popupsRef,
        clickMarker,
        setClickMarker,
        infoPopup,
        setInfoPopup,
        () => {},
        setDirectionsReady
      );

      if (showDirections) {
        clearDirections(mapInstance);
        setShowDirections(false);
      }
    }

    setIsPinDropperActive(!isPinDropperActive);
  }, [isPinDropperActive, clickMarker, infoPopup, showDirections]);

  const handlePinDropperLocationSelected = useCallback(
    (coordinates: { lng: number; lat: number }) => {
      handleSetClickedPoint({ lng: coordinates.lng, lat: coordinates.lat });
      setIsPinDropperActive(false);
      // ADDED: Auto-show directions for pin dropper too
      setShouldAutoShowDirections(true);
    },

    [handleSetClickedPoint]
  );

  const handlePinDropperCancel = useCallback(() => {
    setIsPinDropperActive(false);
    toast.info("Pin dropping canceled");
  }, []);

  // ==========================================
  // Rider Selection Handlers
  // ==========================================
  const handleRiderSelect = useCallback(
    (riderId: string) => {
      setSelectedRiderId(riderId);
      selectRider(riderId);
      setSelectedIsochroneIndex(0); // Reset to first isochrone of selected rider

      // Update URL with selected rider
      const newParams = new URLSearchParams(searchParams);
      newParams.set("riderId", riderId);
      setSearchParams(newParams);

      toast.success("Rider selected", {
        description: "Loading rider's delivery zones...",
        duration: 2000,
      });
    },
    [selectRider, searchParams, setSearchParams]
  );

  // ==========================================
  // Effects
  // ==========================================
  useEffect(() => {
    if (!isLoaded) return;

    autocompleteServiceRef.current =
      new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();
  }, [isLoaded]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || !vendorLocation) return;

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json";

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: [vendorLocation.lng, vendorLocation.lat],
      zoom: 12,
      attributionControl: false,
    });

    mapInstance.current = map;

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

      const serviceDiv = document.createElement("div");
      serviceDiv.style.display = "none";
      document.body.appendChild(serviceDiv);

      if (isLoaded) {
        placesServiceRef.current = new google.maps.places.PlacesService(
          serviceDiv
        );
      }
    });

    return () => {
      map.remove();
      markersRef.current.forEach((marker) => marker.remove());
      popupsRef.current.forEach((popup) => popup.remove());
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

      clearDirections(mapInstance);
    };
  }, [vendorLocation, isLoaded, maptilerApiKey]);

  // Update map isochrones when activeZoneIndex changes
  useEffect(() => {
    const map = mapInstance.current;

    if (map && isochrones.length > 0 && map.isStyleLoaded()) {
      updateMapIsochrones(isochrones, activeZoneIndex, mapInstance);
    } else if (map && isochrones.length > 0) {
      const handleStyleLoad = () => {
        updateMapIsochrones(isochrones, activeZoneIndex, mapInstance);
        map.off("styledata", handleStyleLoad);
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

  // Restore rider and isochrone index from URL
  useEffect(() => {
    const riderIdParam = searchParams.get("riderId");
    const isochroneIndexParam = searchParams.get("isochroneIndex");

    if (riderIdParam && riderIdParam !== selectedRiderId) {
      setSelectedRiderId(riderIdParam);
      selectRider(riderIdParam);
    }

    if (isochroneIndexParam && !Number.isNaN(parseInt(isochroneIndexParam))) {
      const index = parseInt(isochroneIndexParam);
      if (index >= 0) {
        setSelectedIsochroneIndex(index);
      }
    }
  }, [searchParams, selectedRiderId, selectRider]);

  // Function to show all isochrones for selected rider
  const showAllRiderIsochrones = useCallback(() => {
    console.log("showAllRiderIsochrones called");

    if (!mapLoaded || !mapInstance.current) {
      console.error("Map not loaded yet");
      toast.error("Map not loaded yet", { duration: 3000 });
      return;
    }

    if (!selectedRiderMapData || selectedRiderMapData.length === 0) {
      console.error("No isochrones data available");
      toast.error("No isochrones data available", { duration: 3000 });
      return;
    }

    try {
      setActiveZoneIndex(null);

      if (isochrones.length > 0) {
        console.log("Using existing isochrones:", isochrones.length);
        updateMapIsochrones(isochrones, null, mapInstance);
        toast.success("Showing all delivery zones", { duration: 3000 });
        return;
      }

      const selectedIsochrone = selectedRiderMapData[selectedIsochroneIndex];
      console.log("Selected isochrone:", selectedIsochrone?.id);

      if (!selectedIsochrone || !selectedIsochrone.geojson) {
        console.error("No geojson data in selected isochrone");
        toast.error("No zone data available", { duration: 3000 });
        return;
      }

      const parsedGeoJSON = safeParseGeoJSON(selectedIsochrone.geojson);

      if (
        !parsedGeoJSON ||
        !parsedGeoJSON.features ||
        !parsedGeoJSON.features.length
      ) {
        console.error("Invalid GeoJSON data or no features");
        toast.error("Invalid zone data", { duration: 3000 });
        return;
      }

      console.log(`Found ${parsedGeoJSON.features.length} features in GeoJSON`);

      const processedFeatures = parsedGeoJSON.features.map((feature, index) => {
        const metaData = selectedIsochrone.metaData?.[index];

        return {
          ...feature,
          properties: {
            ...feature.properties,
            group_index: index,
            range:
              selectedIsochrone.range && selectedIsochrone.range[index]
                ? selectedIsochrone.range[index]
                : (index + 1) * 5,
            color: [
              "#4ade80",
              "#facc15",
              "#f87171",
              "#60a5fa",
              "#a78bfa",
              "#f472b6",
            ][index % 6],
            // Add metadata
            price: metaData?.price || 0,
            duration: metaData?.duration || 0,
            distance: metaData?.distance || 0,
            zone: metaData?.zone || index,
          },
        };
      });

      setIsochrones(processedFeatures);

      const tempRanges = selectedIsochrone.range || [5, 10, 15, 20, 25, 30];
      const details = calculateZoneDetails(
        processedFeatures,
        tempRanges,
        selectedIsochrone.metaData,
        "time",
        selectedIsochrone.transportMode || "car"
      );
      setZoneDetails(details);

      updateMapIsochrones(processedFeatures, null, mapInstance);

      toast.success("Showing all delivery zones", { duration: 3000 });
    } catch (error) {
      console.error("Error in showAllRiderIsochrones:", error);
      toast.error("Failed to display zones", { duration: 3000 });
    }
  }, [
    mapLoaded,
    mapInstance,
    selectedRiderMapData,
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
          orderId={orderId ?? ""} // Pass orderId to the MapAndSearch component
          // selectedRiderId={orderId ?? ""} // Pass orderId to the MapAndSearch component
          selectedRiderId={selectedRiderId}
          isochrones={isochrones}
          vendorLocation={vendorLocation}
          zoneDetails={zoneDetails}
          geocoderRef={geocoderRef}
          calculatePointDeliveryInfo={calculatePointDeliveryInfo}

          
        />

        {/* Enhanced Delivery Zone Visualizer Menu with Riders tab */}
        <DeliveryZoneVisualizerMenu
          // Vendor data
          vendorMapData={vendorMapData || []}
          allRiders={allRiders || []}
          // Selected rider data
          selectedRiderMapData={selectedRiderMapData || []}
          selectedRiderId={selectedRiderId}
          selectedIsochroneIndex={selectedIsochroneIndex}
          // Zone data
          zoneDetails={zoneDetails}
          activeZoneIndex={activeZoneIndex}
          // Handlers
          setActiveZoneIndex={setActiveZoneIndex}
          setSelectedIsochroneIndex={setSelectedIsochroneIndex}
          onRiderSelect={handleRiderSelect}
          // UI state
          isOpen={isOpenDeliveryZoneVisualizerMenu}
          setIsOpen={setIsOpenDeliveryZoneVisualizerMenu}
          showAllRiderIsochrones={showAllRiderIsochrones}
          setOpenDeliveryZoneVisualizerMenu={
            setIsOpenDeliveryZoneVisualizerMenu
          }
        />
      </div>
    </div>
  );
}
