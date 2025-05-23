// Modified MapAndSearch component
// Removes map click for location selection, uses only Google autocomplete and pin dropper

import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapIcon,
  MapPin,
  Navigation,
  Search,
  X,
  Share2,
  Copy,
  Info,
} from "lucide-react";
import { PinDropper } from "./PinDropper";
import { Input } from "@/components/ui/input";
import { RefObject, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import { TransportMode } from "./dataUtils";
import { toast } from "sonner";

interface MapAndSearchProps {
  // Search related props
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchValue: string;
  searchInputRef: RefObject<HTMLInputElement>;
  showPredictions: boolean;
  predictions: Array<{
    place_id: string;
    description: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
  isSearchLoading: boolean;
  handleClearSearch: () => void;
  handlePredictionSelect: (place: any) => void;

  // Map state props
  isLoaded: boolean;
  loading: boolean;
  isPinDropperActive: boolean;
  isochroneLoading: boolean;
  showDirections: boolean;
  directionsReady: boolean;
  directionsDistance: number | null;
  directionsTime: string | null;

  // URL-aware location state
  clickedPoint: { lng: number; lat: number } | null;
  setClickedPoint: (point: { lng: number; lat: number } | null) => void;

  // Map refs
  mapRef: RefObject<HTMLDivElement>;
  mapDivRef: RefObject<HTMLDivElement>;
  mapInstance: { current: maplibregl.Map | null };

  // Action handlers
  handleTogglePinDropper: () => void;
  handleShowDirectionsClick: () => void;
  handleRefetch: () => void;
  handlePinDropperLocationSelected: (coordinates: {
    lng: number;
    lat: number;
  }) => void;
  handlePinDropperCancel: () => void;

  // Direction state modifiers
  setShowDirections: (show: boolean) => void;
  clearDirections: (mapInstance: { current: maplibregl.Map | null }) => void;

  // Error handling
  error: string | null;

  // Transport mode
  transportMode: TransportMode;
  // Delivery zone visualizer menu
  isOpenDeliveryZoneVisualizerMenu: boolean;
}

export function MapAndSearch({
  handleSearchChange,
  searchValue,
  searchInputRef,
  isLoaded,
  loading,
  isPinDropperActive,
  isSearchLoading,
  handleClearSearch,
  predictions,
  showPredictions,
  handlePredictionSelect,
  showDirections,
  directionsReady,
  isochroneLoading,
  handleShowDirectionsClick,
  handleTogglePinDropper,
  handleRefetch,
  error,
  mapInstance,
  mapRef,
  mapDivRef,
  handlePinDropperCancel,
  directionsDistance,
  directionsTime,
  handlePinDropperLocationSelected,
  setShowDirections,
  clearDirections,
  transportMode,
  clickedPoint,
  setClickedPoint,
  isOpenDeliveryZoneVisualizerMenu,
}: MapAndSearchProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Effect to automatically show info panel when directions are available
  useEffect(() => {
    if (showDirections && directionsDistance !== null && directionsTime) {
      setShowInfoPanel(true);
    }
  }, [showDirections, directionsDistance, directionsTime]);

  // Function to copy the current URL to clipboard
  const copyUrlToClipboard = () => {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        toast.success("URL copied!", {
          description: "You can now share this location with others.",
          duration: 3000,
        });
        setShowShareOptions(false);
      })
      .catch(() => {
        toast.error("Failed to copy URL", {
          description: "Please try again or copy the URL manually.",
          duration: 3000,
        });
      });
  };

  // Function to toggle info panel
  const toggleInfoPanel = () => {
    setShowInfoPanel(!showInfoPanel);
  };

  return (
    <div className="space-y-1">
      <div className="relative" ref={searchInputRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-[#86868B]" />
          </div>
          <Input
            type="text"
            placeholder="Search for a location to check delivery..."
            className="pl-12 pr-10 py-6 rounded-xl border-[#E5E5EA] bg-white focus-visible:ring-[#0071E3] text-[#1D1D1F]"
            value={searchValue}
            onChange={handleSearchChange}
            disabled={!isLoaded || loading || isPinDropperActive || isochroneLoading || isOpenDeliveryZoneVisualizerMenu}
          />
          {isSearchLoading && (
            <div className="absolute inset-y-0 right-10 flex items-center pr-3">
              <Loader2 className="h-4 w-4 text-[#86868B] animate-spin" />
            </div>
          )}
          {searchValue && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-4"
              onClick={handleClearSearch}
            >
              <X className="h-5 w-5 text-[#86868B] hover:text-[#1D1D1F]" />
            </button>
          )}
        </div>

        {/* Predictions dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-[#E5E5EA] overflow-hidden">
            <ul className="py-1">
              {predictions.map((place) => (
                <li
                  key={place.place_id}
                  className="px-4 py-3 hover:bg-[#F5F5F7] cursor-pointer transition-colors"
                  onClick={() => handlePredictionSelect(place)}
                >
                  <div className="font-medium text-[#1D1D1F]">
                    {place.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-[#86868B]">
                    {place.structured_formatting.secondary_text}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Button row with Pin Dropper, Directions, and Share button */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex space-x-2">
          {/* Share button - only show when a location is selected */}
          {clickedPoint && (
            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-xs px-4 border-[#0071E3] text-[#0071E3]"
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
                <Share2 className="h-3 w-3 mr-1.5" />
                Share Location
              </Button>

              {/* Share options dropdown */}
              {showShareOptions && (
                <div className="absolute z-20 mt-2 bg-white rounded-xl shadow-lg border border-[#E5E5EA] overflow-hidden w-48">
                  <ul className="py-1">
                    <li
                      className="px-4 py-3 hover:bg-[#F5F5F7] cursor-pointer transition-colors flex items-center"
                      onClick={copyUrlToClipboard}
                    >
                      <Copy className="h-4 w-4 mr-2 text-[#86868B]" />
                      <span>Copy Link</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add directions button here, only show when directionsReady */}
        {!isPinDropperActive && directionsReady && !showDirections && (
          <Button
            size="sm"
            className="bg-[#0071E3] hover:bg-[#0062C3] text-white text-xs rounded-full px-4 shadow-sm"
            onClick={handleShowDirectionsClick}
          >
            <Navigation className="h-3 w-3 mr-1.5" />
            Show Directions
          </Button>
        )}

        {/* Clear directions button when showing directions */}
        {showDirections && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full text-xs px-4 border-[#0071E3] text-[#0071E3]"
            onClick={() => {
              clearDirections(mapInstance);
              setShowDirections(false);
            }}
          >
            <X className="h-3 w-3 mr-1.5" />
            Clear Directions
          </Button>
        )}
      </div>

      {/* Show error messages when they exist */}
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
      <div
        className={`h-[500px] rounded-2xl overflow-hidden border-0 shadow-sm bg-white relative ${
          isOpenDeliveryZoneVisualizerMenu ? "pointer-events-none blur-sm" : ""
        }`}
      >
        <div ref={mapRef} className="w-full h-full relative rounded-lg" />
        <div id="map-service" ref={mapDivRef} style={{ display: "none" }}></div>

        {/* Pin Dropper Component */}
        {isPinDropperActive && mapInstance.current && (
          <PinDropper
            mapInstance={mapInstance}
            onLocationSelected={handlePinDropperLocationSelected}
            onCancel={handlePinDropperCancel}
          />
        )}

        {/* Loading overlay */}
        {(loading || isochroneLoading) && (
          <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#0071E3] mb-2" />
              <p className="text-[#0071E3] font-medium">
                {isochroneLoading ? "Loading delivery zones..." : "Loading map..."}
              </p>
            </div>
          </div>
        )}

        {/* Map badge - shows vendor name */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center shadow-sm">
            <MapIcon className="h-3 w-3 mr-1.5 text-[#0071E3]" />
            <span className="font-medium text-[#1D1D1F]">Delivery Zones</span>
          </div>
        </div>

        {/* Pin dropper button */}
        <div className="absolute bottom-3 right-3 z-10">
          <Button
            size="sm"
            variant={isPinDropperActive ? "default" : "outline"}
            className={`rounded-full text-xs px-4 ${
              isPinDropperActive
                ? "bg-[#0071E3] text-white"
                : "border-[#0071E3] text-[#0071E3]"
            }`}
            onClick={handleTogglePinDropper}
            disabled={loading || isochroneLoading}
          >
            <MapPin className="h-3 w-3 mr-1.5" />
            {isPinDropperActive ? "Exit Pin Mode" : "Drop Pin on Map"}
          </Button>
        </div>
        
        {/* Directions info card */}
        {showDirections && directionsDistance !== null && directionsTime && (
          <div 
            className={`absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-4 max-w-xs border border-[#E5E5EA] transition-all duration-300 ${
              showInfoPanel ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-[#0071E3] flex items-center justify-center mr-2">
                  <Navigation className="h-3 w-3 text-white" />
                </div>
                <h3 className="font-medium text-[#1D1D1F]">Route Details</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 rounded-full"
                onClick={toggleInfoPanel}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#86868B]">Distance</span>
                <span className="font-medium">
                  {directionsDistance.toFixed(2)} km
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Est. Travel Time</span>
                <span className="font-medium">{directionsTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">Transport Mode</span>
                <span className="font-medium capitalize">
                  {transportMode}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Collapsed info toggle button */}
        {showDirections && directionsDistance !== null && directionsTime && !showInfoPanel && (
          <button
            onClick={toggleInfoPanel}
            className="absolute bottom-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-sm cursor-pointer hover:bg-white transition-colors"
          >
            <Info className="h-4 w-4 text-[#0071E3]" />
          </button>
        )}
      </div>
    </div>
  );
}