import React, { useCallback } from "react"
import { useJsApiLoader } from "@react-google-maps/api"
import { 
  DEFAULT_ISOCHRONE_UUID, 
  DEFAULT_CENTER, 
  GOOGLE_MAPS_LIBRARIES 
} from "./constants"
import { useMapInstance } from "./hooks/useMapInstance"
import { useIsochrones } from "./hooks/useIsochrones"
import { useZoneCalculations } from "./hooks/useZoneCalculations"
import { useMarkers } from "./hooks/useMarkers"
import { useDirections } from "./hooks/useDirections"
import { usePinDropper } from "./hooks/usePinDropper"
import { useSearch } from "./hooks/useSearch"
import { SearchBox } from "./components/SearchBox"
import { MapContainer } from "./components/MapContainer"
import { ZoneCards } from "./components/ZoneCards"
import { Button } from "@/components/ui/button"
import "maplibre-gl/dist/maplibre-gl.css"
import "./map-popup.css"

interface DeliveryZoneVisualizerProps {
  maptilerApiKey?: string
  googleMapsApiKey?: string
  isochroneUuid?: string
  initialLocation?: [number, number]
//   initialLocation?: number[]

}

export function DeliveryZoneVisualizer1() {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY
  //
  // const orsApiKey = import.meta.env.VITE_OPENROUTE_SERVICE_API_KEY;

  // Example UUID for isochrone data - would come from props in real app
  const isochroneUuid = "72bf2db2-dffc-46f8-86dc-edfbb6b960ef"
  const initialLocation = [-0.2649412, 5.5582733] // Default location
  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  // Initialize map
  const handleMapClick = useCallback((e: maplibregl.MapMouseEvent) => {
    // Skip if click was on isochrone or in pin dropper mode
    if (e.defaultPrevented || isPinDropperMode) return

    // Get coordinates
    const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]

    // Clear ALL previous markers and popups
    clearAllMarkersAndPopups()

    // Reset active zone when clicking elsewhere on the map
    setActiveZoneIndex(null)

    // Calculate delivery info
    const pointInfo = calculatePointDeliveryInfo(coordinates)

    if (!pointInfo) return

    // Create marker and show popup
    createMarkerAtLocation(coordinates[0], coordinates[1], pointInfo)
  }, [])

  const { 
    mapRef, 
    mapInstance, 
    mapLoaded,
    createVendorMarker 
  } = useMapInstance({
    maptilerApiKey,
    initialCenter: initialLocation,
    onMapClick: handleMapClick
  })

  // Fetch and process isochrones
  const { 
    isochrones, 
    zoneDetails, 
    vendorLocation, 
    activeZoneIndex, 
    loading, 
    error,
    setActiveZoneIndex,
    handleZoneCardClick,
    handleRefetch
  } = useIsochrones({
    mapInstance,
    mapLoaded,
    isochroneUuid,
    initialLocation,
    rangeType: "time",
    transportMode: "car"
  })

  // Initialize zone calculations
  const { calculatePointDeliveryInfo } = useZoneCalculations({
    isochrones,
    zoneDetails,
    vendorLocation,
    transportMode: "car"
  })

  // Initialize directions management
  const { 
    showDirections, 
    directionsDistance, 
    directionsTime, 
    clearDirections,
    createDirectRoute,
    handleShowDirectionsClick
  } = useDirections({
    mapInstance,
    vendorLocation,
    transportMode: "car"
  })

  // Initialize marker and popup management
  const { 
    clickMarker, 
    infoPopup, 
    clickedPoint, 
    directionsReady,
    createMarkerAtLocation,
    showPointInfoPopup,
    clearAllMarkersAndPopups
  } = useMarkers({
    mapInstance,
    clearDirections
  })

  // Initialize pin dropper
  const { 
    isPinDropperMode, 
    isMapMoving, 
    centerPoint, 
    centerPointInfo, 
    togglePinDropperMode, 
    handleMapMove, 
    handleMapMoveEnd, 
    confirmPinLocation 
  } = usePinDropper({
    mapInstance,
    calculatePointDeliveryInfo,
    clearAllMarkersAndPopups,
    createMarkerAtLocation
  })

  // Initialize search
  const { 
    searchValue, 
    predictions, 
    isSearchLoading, 
    showPredictions, 
    searchInputRef, 
    handleSearchChange, 
    handlePredictionSelect, 
    handleClearSearch 
  } = useSearch({
    isLoaded,
    mapInstance,
    calculatePointDeliveryInfo,
    clearAllMarkersAndPopups,
    createMarkerAtLocation
  })

  // Create vendor marker when vendor location is available
  React.useEffect(() => {
    if (vendorLocation) {
      createVendorMarker(vendorLocation)
    }
  }, [vendorLocation, createVendorMarker])

  return (
    <div className="py-6 font-sans w-full min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Google Places Search Input */}
        <SearchBox 
          searchValue={searchValue}
          isLoaded={isLoaded}
          loading={loading}
          isSearchLoading={isSearchLoading}
          predictions={predictions}
          showPredictions={showPredictions}
          searchInputRef={searchInputRef}
          handleSearchChange={handleSearchChange}
          handlePredictionSelect={handlePredictionSelect}
          handleClearSearch={handleClearSearch}
        />

        {/* Error messages */}
        {error && (
          <div className="bg-[#FEF2F2] p-4 rounded-xl text-[#EF4444] border border-[#FEE2E2]">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefetch}
              className="mt-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] hover:text-[#EF4444]"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Map with isochrones */}
        <MapContainer 
          mapRef={mapRef}
          mapDivRef={searchInputRef}
          loading={loading}
          isPinDropperMode={isPinDropperMode}
          isMapMoving={isMapMoving}
          clickedPoint={clickedPoint}
          centerPointInfo={centerPointInfo}
          showDirections={showDirections}
          directionsDistance={directionsDistance}
          directionsTime={directionsTime}
          transportMode="car"
          togglePinDropperMode={togglePinDropperMode}
          confirmPinLocation={confirmPinLocation}
          handleShowDirectionsClick={handleShowDirectionsClick}
          clearDirections={clearDirections}
        />

        {/* Zone cards */}
        {isochrones.length > 0 && !loading && (
          <ZoneCards 
            zoneDetails={zoneDetails}
            activeZoneIndex={activeZoneIndex}
            handleZoneCardClick={handleZoneCardClick}
          />
        )}
      </div>
    </div>
  )
}