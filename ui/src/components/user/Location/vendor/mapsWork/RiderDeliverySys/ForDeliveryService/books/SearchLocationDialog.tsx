// SearchLocationDialog.tsx - Location search dialog component

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  MapPin,
  Loader2,
  CheckCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { SearchLocationDialogProps, Location } from "./types";

export function SearchLocationDialog({
  isOpen,
  onOpenChange,
  onLocationSelect,
  isLoaded,
  currentLocation
}: SearchLocationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // Google Places services
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize Google Places services
  useEffect(() => {
    if (!isLoaded) return;

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();

    const serviceDiv = document.createElement("div");
    serviceDiv.style.display = "none";
    document.body.appendChild(serviceDiv);
    placesServiceRef.current = new google.maps.places.PlacesService(serviceDiv);

    return () => {
      if (serviceDiv.parentNode) {
        serviceDiv.parentNode.removeChild(serviceDiv);
      }
    };
  }, [isLoaded]);

  // Auto-focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Set current location in search when dialog opens
  useEffect(() => {
    if (isOpen && currentLocation) {
      setSearchQuery(currentLocation.address);
    }
  }, [isOpen, currentLocation]);

  // Search implementation
  const searchWithGooglePlaces = useCallback(async (query: string) => {
    if (!isLoaded || !autocompleteServiceRef.current) {
      setIsSearching(false);
      toast.error("Search service not ready. Please wait a moment and try again.");
      return;
    }

    setIsSearching(true);
    
    try {
      const request = {
        input: query,
        types: ['geocode'], 
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          setIsSearching(false);
          
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            const formattedPredictions = predictions.map((prediction) => ({
              placeId: prediction.place_id,
              description: prediction.description,
              structured_formatting: {
                main_text: prediction.structured_formatting?.main_text || prediction.description,
                secondary_text: prediction.structured_formatting?.secondary_text || '',
              },
              coordinates: null,
              address: prediction.description,
            }));
            
            setPredictions(formattedPredictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
            
            // Handle different status codes
            switch (status) {
              case google.maps.places.PlacesServiceStatus.ZERO_RESULTS:
                toast.error("No results found for your search.");
                break;
              case google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT:
                toast.error("Search quota exceeded. Please try again later.");
                break;
              case google.maps.places.PlacesServiceStatus.REQUEST_DENIED:
                toast.error("Search request denied. Please check your API key.");
                break;
              case google.maps.places.PlacesServiceStatus.INVALID_REQUEST:
                toast.error("Invalid search request.");
                break;
              default:
                toast.error("Search service temporarily unavailable.");
            }
          }
        }
      );
    } catch (error) {
      console.error("Google Places search error:", error);
      setIsSearching(false);
      toast.error("Search service error. Please try again.");
      setPredictions([]);
      setShowPredictions(false);
    }
  }, [isLoaded]);

  // Enhanced location selection handler
  const handleLocationSelection = useCallback(async (prediction: any) => {
    if (!placesServiceRef.current || !geocoderRef.current) {
      toast.error("Location service not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setShowPredictions(false);

    try {
      const placeDetails = await new Promise<google.maps.places.PlaceResult>((resolve, reject) => {
        const request = {
          placeId: prediction.placeId,
          fields: ['geometry', 'formatted_address', 'name', 'types'],
        };

        placesServiceRef.current!.getDetails(request, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error(`Failed to get place details: ${status}`));
          }
        });
      });

      if (!placeDetails.geometry?.location) {
        throw new Error('No location data available for this place');
      }

      const lat = placeDetails.geometry.location.lat();
      const lng = placeDetails.geometry.location.lng();
      const coordinates: [number, number] = [lng, lat];

      const location: Location = {
        coordinates: coordinates,
        address: placeDetails.formatted_address || prediction.address,
        placeId: prediction.placeId,
      };

      setSearchQuery(location.address);
      onLocationSelect(location);
      onOpenChange(false);
      
      toast.success("Location selected successfully!");
      
    } catch (error) {
      console.error("Error selecting location:", error);
      toast.error("Failed to select location. Please try another search.");
    } finally {
      setIsLoading(false);
    }
  }, [onLocationSelect, onOpenChange]);

  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 2) {
      setShowPredictions(true);
      const timeoutId = setTimeout(() => {
        searchWithGooglePlaces(value);
      }, 300);
      
      return () => clearTimeout(timeoutId);
    } else {
      setPredictions([]);
      setShowPredictions(false);
      setIsSearching(false);
    }
  }, [searchWithGooglePlaces]);

  // Current location handler
  const handleCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setIsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates: [number, number] = [longitude, latitude];

        try {
          if (geocoderRef.current) {
            const geocodeResult = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
              geocoderRef.current!.geocode(
                { location: { lat: latitude, lng: longitude } },
                (results, status) => {
                  if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                    resolve(results[0]);
                  } else {
                    reject(new Error(`Geocoding failed: ${status}`));
                  }
                }
              );
            });

            const location: Location = {
              coordinates,
              address: geocodeResult.formatted_address,
              placeId: geocodeResult.place_id,
            };

            setSearchQuery(location.address);
            onLocationSelect(location);
            onOpenChange(false);

            toast.success("Current location detected!");
          }
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error("Could not get address for current location.");
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        console.error("Geolocation error:", error);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out.");
            break;
          default:
            toast.error("An unknown error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, [onLocationSelect, onOpenChange]);

  // Clear search and close dialog
  const handleClose = useCallback(() => {
    // Only allow closing if location is selected
    if (!currentLocation) {
      toast.error("Please select a service location first");
      return;
    }
    
    setSearchQuery("");
    setPredictions([]);
    setShowPredictions(false);
    setIsSearching(false);
    onOpenChange(false);
  }, [onOpenChange, currentLocation]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center justify-between">
            <span>Set Your Service Location</span>
            {/* Only show close button if location is already selected */}
            {currentLocation && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentLocation 
              ? "Update your service location or close to continue with zone setup"
              : "Choose your service center location to start creating delivery zones"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search for your service location..."
              className="w-full pl-12 pr-16 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 transition-all duration-200 text-base"
              disabled={isLoading || !isLoaded}
            />
            
            {/* Loading indicator */}
            {(isSearching || isLoading) && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            )}
            
            {/* Current location button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCurrentLocation}
                  disabled={isLoading || !isLoaded}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full hover:bg-gray-100"
                >
                  <MapPin className="w-4 h-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use current location</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Google Places API status indicator */}
          {!isLoaded && (
            <div className="mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading Google Places API...
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {/* Predictions dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Search Results</h4>
                {predictions.map((prediction, index) => (
                  <button
                    key={prediction.placeId || index}
                    onClick={() => handleLocationSelection(prediction)}
                    disabled={isLoading}
                    className="w-full text-left p-4 hover:bg-gray-50 border border-gray-200 rounded-2xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {prediction.structured_formatting.main_text}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {prediction.structured_formatting.secondary_text}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* No results message */}
            {showPredictions && predictions.length === 0 && !isSearching && searchQuery.length > 2 && (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 font-medium">No results found</p>
                <p className="text-sm text-gray-400">Try a different search term</p>
              </div>
            )}

            {/* Instructions when empty */}
            {!showPredictions && searchQuery.length <= 2 && (
              <div className="text-center py-8">
                <div className="bg-blue-50 rounded-2xl p-6">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900 mb-2">
                    {currentLocation ? "Update Service Location" : "Set Your Service Location"}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {currentLocation 
                      ? "Search for a new address to update your service location"
                      : "Search for your business address or service center location to start creating delivery zones"
                    }
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Search className="w-3 h-3 mr-1" />
                      <span>Type to search</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>Use current location</span>
                    </div>
                  </div>
                  {!currentLocation && (
                    <div className="mt-4 p-3 bg-blue-100 rounded-xl">
                      <p className="text-xs text-blue-700 font-medium">
                        💡 You must select a location before creating delivery zones
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Current Location Display */}
          {currentLocation && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-green-900">Current Service Location</h4>
                  <p className="text-sm text-green-700 mt-1">{currentLocation.address}</p>
                  <div className="mt-3">
                    <Button 
                      onClick={() => onOpenChange(false)}
                      className="w-full rounded-xl"
                    >
                      Continue to Zone Setup
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}