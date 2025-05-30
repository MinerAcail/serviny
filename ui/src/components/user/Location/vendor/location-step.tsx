"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Loader2, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";

type Location = {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
};

interface LocationStepProps {
  onLocationSelect: (location: Location) => void;
  selectedLocation: Location | null;
  onNext: () => void;
  vendorLocation?: Location | null;
}

const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];

export function LocationStep({
  onLocationSelect,
  selectedLocation,
  onNext,
  vendorLocation,
}: LocationStepProps) {

  const [mapCenter, setMapCenter] = useState({ lat: 5.6037, lng: -0.187 }); // Default to Accra
  const [mapZoom, setMapZoom] = useState(12); // default zoom
  const mapRef = useRef<google.maps.Map | null>(null);

  // Load the Google Maps JavaScript API with the places library
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: envApiKey || "",
    libraries,
  });

  // Services refs
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Initialize services when the API is loaded
  useEffect(() => {
    if (!isLoaded) return;

    autocompleteServiceRef.current =
      new google.maps.places.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();
  }, [isLoaded]);

  // Update map programmatically when locations change
  useEffect(() => {
    if (mapRef.current && vendorLocation) {
      mapRef.current.panTo({ lat: vendorLocation.lat, lng: vendorLocation.lng });
      mapRef.current.setZoom(15);
    }
  }, [vendorLocation]);

  useEffect(() => {
    if (mapRef.current && selectedLocation) {
      mapRef.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
      mapRef.current.setZoom(17);
    }
  }, [selectedLocation]);

  // Handle map load
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  if (loadError) {
    return (
      <div className="p-4 text-red-500">
        Error loading Google Maps API: {loadError.message}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Vendor location suggestion card */}
        {vendorLocation && (
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-900 dark:text-blue-100">
                      Your Vendor Location
                    </h3>
                    <p className="text-blue-700 dark:text-blue-200 text-sm mt-1">
                      {vendorLocation.address}
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">
                      Coordinates: {vendorLocation.lat.toFixed(6)},{" "}
                      {vendorLocation.lng.toFixed(6)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={onNext}
                  disabled={!selectedLocation}
                  className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Google Map */}
        <div className="h-[300px] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          {!isLoaded ? (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#2C2C2E]">
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mr-2" />
              <span className="text-gray-500 dark:text-gray-400">
                Loading map...
              </span>
            </div>
          ) : (
            <APIProvider apiKey={envApiKey || ""}>
              <Map
                defaultCenter={{ lat: 5.6037, lng: -0.187 }}
                defaultZoom={12}
                gestureHandling="greedy" // Allow normal map interaction
                disableDefaultUI={false}
                clickableIcons={false}
                mapId="7511843f6fb0f305d588791a"
                className="h-full w-full"
                onLoad={handleMapLoad}
                options={{
                  zoomControl: true,
                  mapTypeControl: false,
                  scaleControl: true,
                  streetViewControl: false,
                  rotateControl: false,
                  fullscreenControl: true,
                  scrollwheel: true,
                  draggable: true,
                  keyboardShortcuts: false,
                }}
              >
                {/* Selected location marker */}
                {selectedLocation && (
                  <AdvancedMarker
                    position={{
                      lat: selectedLocation.lat,
                      lng: selectedLocation.lng,
                    }}
                  >
                    <Pin
                      background={"#0071E3"}
                      glyphColor={"#FFFFFF"}
                      borderColor={"#FFFFFF"}
                    />
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          )}
        </div>
      </div>
    </div>
  );
}