import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-popup.css";
import { useQuery } from "@apollo/client";

import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import {
  createMarkerAtLocation,
  handleMapClick,
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
  // RangeType,
  Location,
  GET_ISOCHRONE_RESULT,
} from "./dataUtils";
import { ZoneCard } from "./ZoneCard";
import { MapAndSearch } from "./mapAndSearch";
import { useNavigate, useSearchParams } from "react-router";

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];

export function DeliveryZoneVisualizer() {
  // ==========================================
  // Environment and API Keys
  // ==========================================
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // Example UUID for isochrone data - would come from props in real app
  const isochroneUuid = "72bf2db2-dffc-46f8-86dc-edfbb6b960ef";
  const initialLocation = [-0.2649412, 5.5582733]; // Default location

  // Add React Router hooks
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
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
  const [directionsDistance, setDirectionsDistance] = useState<number | null>(null);
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
  const [clickMarker, setClickMarker] = useState<maplibregl.Marker | null>(null);
  const [infoPopup, setInfoPopup] = useState<maplibregl.Popup | null>(null);

  // Pin dropper state
  const [isPinDropperActive, setIsPinDropperActive] = useState(false);
  const [mapInteractionEnabled, setMapInteractionEnabled] = useState(true);

  // Refs for Google Maps services
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // ==========================================
  // Google Maps API Loading
  // ==========================================
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries,
  });

  // ==========================================
  // URL State Management
  // ==========================================
  
  // Create URL-aware clicked point setter
  const handleSetClickedPoint = useCallback((point: { lng: number; lat: number } | null) => {
    setClickedPoint(point);
    
    if (point) {
      // Update URL with new coordinates
      const newParams = new URLSearchParams(searchParams);
      newParams.set("lat", point.lat.toString());
      newParams.set("lng", point.lng.toString());
      setSearchParams(newParams);
    } else {
      // Remove coordinates from URL if point is null
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("lat");
      newParams.delete("lng");
      setSearchParams(newParams);
    }
  }, [setSearchParams, searchParams]);

  // ==========================================
  // Data Fetching - Isochrone API
  // ==========================================
  const {
    loading: isochroneLoading,
    refetch,
  } = useQuery(GET_ISOCHRONE_RESULT, {
    variables: {
      uuid: isochroneUuid,
      location: initialLocation,
    },
    onError: (err) => {
      console.error("Error fetching isochrone:", err);
      setError("Failed to fetch isochrone data. Please try again.");
      setLoading(false);
    },
    onCompleted: (data) => {
      processIsochroneData(
        data,
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
    },
  });

  // Load point from URL when map is ready
  useEffect(() => {
    if (
      mapLoaded &&
      mapInstance.current &&
      clickedPoint &&
      vendorLocation &&
      isochrones.length > 0
    ) {
      // Calculate point info for the location from URL
      const pointInfo = calculatePointDeliveryInfo(
        [clickedPoint.lng, clickedPoint.lat],
        isochrones,
        vendorLocation,
        zoneDetails,
        transportMode
      );

      if (pointInfo) {
        // Create marker and popup for the loaded point
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

        // Center map on the loaded point
        mapInstance.current.flyTo({
          center: [clickedPoint.lng, clickedPoint.lat],
          zoom: 14,
          duration: 1000,
        });
      }
    }
  }, [mapLoaded, isochrones, vendorLocation, zoneDetails, transportMode, clickedPoint]);

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

      if (!isLoaded || !mapDivRef.current) return;

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
                handleSetClickedPoint,
                setDirectionsReady
              );

              // Set the clicked point using URL-aware setter
              handleSetClickedPoint({ lng, lat });

              // Calculate delivery info
              const pointInfo = calculatePointDeliveryInfo(
                [lng, lat],
                isochrones,
                vendorLocation,
                zoneDetails,
                transportMode
              );

              if (pointInfo) {
                // Create marker and show popup
                createMarkerAtLocation(
                  lng,
                  lat,
                  pointInfo,
                  mapInstance,
                  markersRef,
                  setClickMarker,
                  setDirectionsReady,
                  zoneDetails,
                  popupsRef,
                  setInfoPopup
                );

                // If the map is loaded, center on the location
                if (mapInstance.current) {
                  mapInstance.current.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    duration: 1000,
                  });
                }
              }
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
                handleSetClickedPoint,
                setDirectionsReady
              );

              // Set the clicked point using URL-aware setter
              handleSetClickedPoint({ lng, lat });

              // Calculate delivery info
              const pointInfo = calculatePointDeliveryInfo(
                [lng, lat],
                isochrones,
                vendorLocation,
                zoneDetails,
                transportMode
              );

              if (pointInfo) {
                // Create marker and show popup
                createMarkerAtLocation(
                  lng,
                  lat,
                  pointInfo,
                  mapInstance,
                  markersRef,
                  setClickMarker,
                  setDirectionsReady,
                  zoneDetails,
                  popupsRef,
                  setInfoPopup
                );

                // If the map is loaded, center on the location
                if (mapInstance.current) {
                  mapInstance.current.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    duration: 1000,
                  });
                }
              }
            } else {
              console.error("Geocoding failed:", status);
            }
          }
        );
      }
    },
    [
      isLoaded,
      isochrones,
      vendorLocation,
      zoneDetails,
      transportMode,
      clickMarker,
      infoPopup,
      handleSetClickedPoint,
    ]
  );

  // ==========================================
  // UI Event Handlers
  // ==========================================

  // Handle zone card click
  const handleZoneCardClick = useCallback(
    (index: number) => {
      // Toggle active zone index
      setActiveZoneIndex(activeZoneIndex === index ? null : index);
      // Clear any existing markers and popups
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
    },
    [activeZoneIndex, clickMarker, infoPopup, handleSetClickedPoint]
  );

  // Reload isochrone data
  const handleRefetch = useCallback(() => {
    setLoading(true);
    setError(null);
    refetch().catch((err) => {
      console.error("Error refetching isochrone data:", err);
      setError("Failed to refresh isochrone data.");
      setLoading(false);
    });
  }, [refetch]);

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
        handleSetClickedPoint,
        setDirectionsReady
      );

      // Disable other map interactions
      setMapInteractionEnabled(false);

      // If directions are shown, clear them
      if (showDirections) {
        clearDirections(mapInstance);
        setShowDirections(false);
      }
    } else {
      // Re-enable map interactions
      setMapInteractionEnabled(true);
    }

    // Toggle pin dropper mode
    setIsPinDropperActive(!isPinDropperActive);
  }, [isPinDropperActive, clickMarker, infoPopup, showDirections, handleSetClickedPoint]);

  // Handle location selection from pin dropper
  const handlePinDropperLocationSelected = useCallback(
    (coordinates: { lng: number; lat: number }) => {
      // Calculate delivery info for the selected point
      const pointInfo = calculatePointDeliveryInfo(
        [coordinates.lng, coordinates.lat],
        isochrones,
        vendorLocation,
        zoneDetails,
        transportMode
      );

      if (pointInfo) {
        // Create marker and show popup
        createMarkerAtLocation(
          coordinates.lng,
          coordinates.lat,
          pointInfo,
          mapInstance,
          markersRef,
          setClickMarker,
          setDirectionsReady,
          zoneDetails,
          popupsRef,
          setInfoPopup
        );

        // Store clicked point with URL-aware setter
        handleSetClickedPoint({ lng: coordinates.lng, lat: coordinates.lat });
      }

      // Exit pin dropper mode
      setIsPinDropperActive(false);
      setMapInteractionEnabled(true);
    },
    [isochrones, vendorLocation, zoneDetails, transportMode, handleSetClickedPoint]
  );

  // Handler for when the user cancels pin dropper mode
  const handlePinDropperCancel = useCallback(() => {
    // Exit pin dropper mode
    setIsPinDropperActive(false);

    // Re-enable map interactions
    setMapInteractionEnabled(true);

    // Optional: You can provide feedback to the user that pin dropping was canceled
    // For example, you could show a brief toast notification
    const toast = document.createElement("div");
    toast.className = "pin-mode-toast";
    toast.style.backgroundColor = "#6B7280"; // Gray color for cancelation
    toast.innerHTML = `
    <span class="flex items-center">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1.5">
    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>Pin dropping canceled
    </span>
  `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translate(-50%, 10px)";
      toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";

      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 2000);
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

    // Add navigation controls
    // map.addControl(new maplibregl.NavigationControl(), "top-right");

    // Add attribution
    // map.addControl(
    //   new maplibregl.AttributionControl({
    //     compact: true,
    //   })
    // );

    // Add vendor marker
    new maplibregl.Marker({ color: "#0071E3" })
      .setLngLat([vendorLocation.lng, vendorLocation.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<strong>${vendorLocation.address}</strong>`
        )
      )
      .addTo(map);

    // Add click handler for map
    map.on("click", (e) => {
      if (!mapInteractionEnabled || isPinDropperActive) return;
      
      // Get clicked coordinates
      const { lng, lat } = e.lngLat;
      
      // Clear existing markers and popups
      clearAllMarkersAndPopups(
        markersRef,
        popupsRef,
        clickMarker,
        setClickMarker,
        infoPopup,
        setInfoPopup,
        handleSetClickedPoint,
        setDirectionsReady,
        setActiveZoneIndex
      );
      
      // Calculate delivery info for the clicked point
      const pointInfo = calculatePointDeliveryInfo(
        [lng, lat],
        isochrones,
        vendorLocation,
        zoneDetails,
        transportMode
      );
      
      if (pointInfo) {
        // Create marker and show popup
        createMarkerAtLocation(
          lng,
          lat,
          pointInfo,
          mapInstance,
          markersRef,
          setClickMarker,
          setDirectionsReady,
          zoneDetails,
          popupsRef,
          setInfoPopup
        );
        
        // Set clicked point with URL-aware setter
        handleSetClickedPoint({ lng, lat });
      }
    });

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
  }, [vendorLocation, isLoaded, maptilerApiKey, transportMode, mapInteractionEnabled, isPinDropperActive, isochrones, zoneDetails, handleSetClickedPoint]);

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

  // ==========================================
  // Render Component
  // ==========================================
  return (
    <div className="py-6 font-sans w-full min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Replace your existing search and map UI with the MapAndSearch component */}
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
        />

        {/* Zone cards */}
        {isochrones.length > 0 && !loading && !isochroneLoading && (
          <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
            {zoneDetails.map((zone, index) => (
              <ZoneCard
                key={index}
                index={index}
                zone={zone}
                activeZoneIndex={activeZoneIndex}
                onClick={() => handleZoneCardClick(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}