import { useState, useCallback, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  MapIcon,
  MapPin,
  Navigation,
  Search,
  X,
  Eye,
  EyeOff,
  Route,
  Target,
  Layers,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import { toast } from "sonner";
import { useLocationSearch, type Location, type DeliveryCalculation } from "./riderBookingHooks";

interface MapAndBookingProps {
  // Map refs
  mapRef: RefObject<HTMLDivElement>;
  mapInstance: { current: maplibregl.Map | null };
  mapLoaded: boolean;

  // Location state
  pickupLocation: Location | null;
  dropoffLocation: Location | null;
  updatePickupLocation: (location: Location | null) => void;
  updateDropoffLocation: (location: Location | null) => void;

  // Search state
  pickupSearch: string;
  dropoffSearch: string;
  setPickupSearch: (value: string) => void;
  setDropoffSearch: (value: string) => void;

  // Google services
  autocompleteServiceRef: RefObject<google.maps.places.AutocompleteService | null>;
  placesServiceRef: RefObject<google.maps.places.PlacesService | null>;
  geocoderRef: RefObject<google.maps.Geocoder | null>;
  isLoaded: boolean;

  // Calculation state
  calculation: DeliveryCalculation | null;
  isCalculating: boolean;

  // UI state
  isOpenBookingMenu: boolean;
  showZones: boolean;
  onToggleZones: () => void;

  // Loading and errors
  loading: boolean;
  error: string | null;
}

export function MapAndBooking({
  mapRef,
  mapInstance,
  mapLoaded,
  pickupLocation,
  dropoffLocation,
  updatePickupLocation,
  updateDropoffLocation,
  pickupSearch,
  dropoffSearch,
  setPickupSearch,
  setDropoffSearch,
  autocompleteServiceRef,
  placesServiceRef,
  geocoderRef,
  isLoaded,
  calculation,
  isCalculating,
  isOpenBookingMenu,
  showZones,
  onToggleZones,
  loading,
  error,
}: MapAndBookingProps) {
  // Search states
  const [showPickupPredictions, setShowPickupPredictions] = useState(false);
  const [showDropoffPredictions, setShowDropoffPredictions] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'pickup' | 'dropoff' | null>(null);

  // Use location search hook
  const {
    predictions,
    isLoading: isSearchLoading,
    error: searchError,
    searchLocations,
    getLocationDetails,
    clearPredictions,
  } = useLocationSearch(
    autocompleteServiceRef.current,
    placesServiceRef.current
  );

  // ==========================================
  // Search Handlers
  // ==========================================

  const handlePickupSearch = useCallback(async (value: string) => {
    setPickupSearch(value);
    setActiveSearchField('pickup');
    
    if (value.length > 2) {
      const results = await searchLocations(value);
      if (results.length > 0) {
        setShowPickupPredictions(true);
        setShowDropoffPredictions(false);
      }
    } else {
      setShowPickupPredictions(false);
      clearPredictions();
    }
  }, [searchLocations, setPickupSearch, clearPredictions]);

  const handleDropoffSearch = useCallback(async (value: string) => {
    setDropoffSearch(value);
    setActiveSearchField('dropoff');
    
    if (value.length > 2) {
      const results = await searchLocations(value);
      if (results.length > 0) {
        setShowDropoffPredictions(true);
        setShowPickupPredictions(false);
      }
    } else {
      setShowDropoffPredictions(false);
      clearPredictions();
    }
  }, [searchLocations, setDropoffSearch, clearPredictions]);

  const handlePredictionSelect = useCallback(async (place: any) => {
    const details = await getLocationDetails(place.place_id);
    
    if (details) {
      const location: Location = {
        lng: details.coordinates[0],
        lat: details.coordinates[1],
        address: details.address,
      };

      if (activeSearchField === 'pickup') {
        updatePickupLocation(location);
        setPickupSearch(details.address);
        setShowPickupPredictions(false);
        toast.success('Pickup location set', {
          description: 'Coverage zones will appear around this location',
        });
      } else if (activeSearchField === 'dropoff') {
        updateDropoffLocation(location);
        setDropoffSearch(details.address);
        setShowDropoffPredictions(false);
        toast.success('Drop-off location set');
      }
    }
    
    setActiveSearchField(null);
    clearPredictions();
  }, [activeSearchField, updatePickupLocation, updateDropoffLocation, setPickupSearch, setDropoffSearch, getLocationDetails, clearPredictions]);

  const clearPickupLocation = useCallback(() => {
    updatePickupLocation(null);
    setPickupSearch("");
    toast.info('Pickup location cleared', {
      description: 'Coverage zones hidden',
    });
  }, [updatePickupLocation, setPickupSearch]);

  const clearDropoffLocation = useCallback(() => {
    updateDropoffLocation(null);
    setDropoffSearch("");
    toast.info('Drop-off location cleared');
  }, [updateDropoffLocation, setDropoffSearch]);

  // ==========================================
  // Helper Functions
  // ==========================================

  const getMapStatusInfo = () => {
    if (pickupLocation && dropoffLocation) {
      return {
        icon: Route,
        text: `Route: ${calculation?.distance}km`,
        color: "text-blue-700",
        bgColor: "bg-blue-50",
      };
    } else if (pickupLocation && showZones) {
      return {
        icon: Target,
        text: "Coverage zones visible",
        color: "text-green-700",
        bgColor: "bg-green-50",
      };
    } else if (pickupLocation) {
      return {
        icon: MapPin,
        text: "Pickup location set",
        color: "text-orange-700",
        bgColor: "bg-orange-50",
      };
    }
    return null;
  };

  const mapStatus = getMapStatusInfo();

  // ==========================================
  // Render Component
  // ==========================================

  return (
    <div className="space-y-4">
      {/* Enhanced Location Search Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pickup Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            Pickup Location
            {pickupLocation && showZones && (
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                Coverage center
              </span>
            )}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Enter pickup address to see coverage zones..."
              className="pl-10 pr-10"
              value={pickupSearch}
              onChange={(e) => handlePickupSearch(e.target.value)}
            //   disabled={!isLoaded || loading}
            />
            {isSearchLoading && activeSearchField === 'pickup' && (
              <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
            {pickupLocation && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={clearPickupLocation}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Pickup Predictions */}
          {showPickupPredictions && predictions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {predictions.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => handlePredictionSelect(place)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {place.structured_formatting.main_text}
                      </div>
                      <div className="text-sm text-gray-500">
                        {place.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drop-off Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            Drop-off Location
            {pickupLocation && !dropoffLocation && (
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                Optional
              </span>
            )}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Enter delivery address..."
              className="pl-10 pr-10"
              value={dropoffSearch}
              onChange={(e) => handleDropoffSearch(e.target.value)}
            //   disabled={!isLoaded || loading || !pickupLocation}
            />
            {isSearchLoading && activeSearchField === 'dropoff' && (
              <div className="absolute inset-y-0 right-10 flex items-center pr-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
            {dropoffLocation && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={clearDropoffLocation}
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {/* Drop-off Predictions */}
          {showDropoffPredictions && predictions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {predictions.map((place) => (
                <button
                  key={place.place_id}
                  onClick={() => handlePredictionSelect(place)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-900">
                        {place.structured_formatting.main_text}
                      </div>
                      <div className="text-sm text-gray-500">
                        {place.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {(error || searchError) && (
        <div className="bg-red-50 p-4 rounded-xl text-red-700 border border-red-200">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error || searchError}</p>
        </div>
      )}

      {/* Calculation Loading */}
      {isCalculating && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center text-blue-700">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span className="font-medium">Calculating delivery details...</span>
          </div>
        </div>
      )}

      {/* Calculation Result */}
      {calculation && !isCalculating && (
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-green-700">
              <Route className="w-4 h-4 mr-2" />
              <span className="font-medium">
                {calculation.distance}km → {calculation.duration} → ${calculation.totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-green-600">
              Zone: {calculation.matchedZone?.startKm}km - {calculation.matchedZone?.endKm}km
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        className={`h-[500px] rounded-2xl overflow-hidden border shadow-sm bg-white relative ${
          isOpenBookingMenu ? "pointer-events-none blur-sm" : ""
        }`}
      >
        <div ref={mapRef} className="w-full h-full" />

        {/* Loading overlay */}
        {/* {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <p className="text-blue-600 font-medium">Loading map...</p>
            </div>
          </div>
        )} */}

        {/* Enhanced Map Badge with Status */}
        <div className="absolute top-3 left-3 z-10">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center shadow-sm">
            <MapIcon className="h-3 w-3 mr-1.5 text-blue-600" />
            <span className="font-medium text-gray-900">Coverage Map</span>
            {mapStatus && (
              <>
                <span className="mx-1.5 text-gray-300">•</span>
                <mapStatus.icon className="h-3 w-3 mr-1" />
                <span className={mapStatus.color}>{mapStatus.text}</span>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Map Controls */}
        <div className="absolute bottom-3 right-3 z-10 flex flex-col space-y-2">
          {/* Toggle Coverage Zones Button */}
          {pickupLocation && (
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleZones}
              className="bg-white/90 backdrop-blur-sm border-gray-200"
            >
              {showZones ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1.5" />
                  Hide Coverage
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1.5" />
                  Show Coverage
                </>
              )}
            </Button>
          )}
        </div>

        {/* Enhanced Location Status */}
        {(pickupLocation || dropoffLocation) && (
          <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-sm max-w-xs">
            <div className="space-y-1 text-xs">
              {pickupLocation && (
                <div className="flex items-center text-green-700">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                  <span className="truncate">
                    Pickup: {pickupLocation.address.split(',')[0]}
                    {showZones && <span className="ml-1 opacity-60">(coverage center)</span>}
                  </span>
                </div>
              )}
              {dropoffLocation && (
                <div className="flex items-center text-red-700">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                  <span className="truncate">Drop-off: {dropoffLocation.address.split(',')[0]}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coverage Zones Helper */}
        {pickupLocation && showZones && !dropoffLocation && (
          <div className="absolute top-3 right-3 z-10 bg-green-50/90 backdrop-blur-sm border border-green-200 rounded-xl p-3 shadow-sm max-w-xs">
            <div className="flex items-start space-x-2">
              <Layers className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-green-900">Coverage Zones Active</p>
                <p className="text-xs text-green-700 mt-1">
                  Colored circles show delivery areas from your pickup location
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}