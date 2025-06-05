import React, { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useJsApiLoader, type Libraries } from '@react-google-maps/api';
import { Search, MapPin, Loader2, X, Navigation, Target } from 'lucide-react';
import { gql, useQuery } from '@apollo/client';
import { useParams } from 'react-router';
import * as turf from '@turf/turf';

// GraphQL Query
export const GET_RIDER_RANGES = gql`
  query getARiderRanges($riderId: String!) {
    getARiderRanges(routeId: $riderId) {
      id
      riderId
      startKm
      endKm
      price
      updatedAt
    }
  }
`;

// Type definitions
export interface PricingZone {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
  updatedAt?: string;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat(): number;
      lng(): number;
    };
  };
  types: string[];
}

interface LocationMarker {
  id: string;
  position: [number, number]; // [lng, lat] for MapLibre
  name: string;
  address: string;
  types: string[];
  placeId: string;
}

// Libraries to load with the Google Maps API
const libraries: Libraries = ["places"];

const AutocompleteSearchMap: React.FC = () => {
  const { riderId } = useParams<{ riderId: string }>();
  
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;
  
  const { isLoaded: isGoogleLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries
  });

  // GraphQL Query for pricing zones
  const {
    data: zonesData,
    loading: isLoadingZones,
    error: zonesError,
    refetch: refetchZones,
  } = useQuery(GET_RIDER_RANGES, {
    variables: { riderId: riderId || '' },
    skip: !riderId,
    onError: (error) => {
      console.error('Error loading rider zones:', error);
      setError('Failed to load rider pricing zones');
    },
  });

  // Get pricing zones from GraphQL data
  const pricingZones = zonesData?.getARiderRanges || [];
  console.log("pricingZones",pricingZones);
  
  const zoneColors = ["#4ade80", "#facc15", "#f87171", "#60a5fa", "#a78bfa", "#f472b6"];

  const mapContainer = useRef<HTMLDivElement>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);
  const dropoffInputRef = useRef<HTMLInputElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pickupAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const dropoffAutocomplete = useRef<google.maps.places.Autocomplete | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  
  const [pickupQuery, setPickupQuery] = useState<string>('');
  const [dropoffQuery, setDropoffQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [pickupMarker, setPickupMarker] = useState<maplibregl.Marker | null>(null);
  const [dropoffMarker, setDropoffMarker] = useState<maplibregl.Marker | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationMarker | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationMarker | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [routeLineId] = useState<string>('route-line');
  const [error, setError] = useState<string>('');

  // Calculate distance between pickup and drop-off
  const calculateDistance = useCallback(() => {
    if (!pickupLocation || !dropoffLocation) return null;

    const [lng1, lat1] = pickupLocation.position;
    const [lng2, lat2] = dropoffLocation.position;

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance;
  }, [pickupLocation, dropoffLocation]);

  // Calculate price based on distance
  const calculatePrice = useCallback(() => {
    if (!pickupLocation || !dropoffLocation || pricingZones.length === 0) return null;

    const distance = calculateDistance();
    if (!distance) return null;

    // Find the appropriate pricing zone
    const applicableZone = pricingZones.find(zone => 
      distance >= zone.startKm && distance <= zone.endKm
    );

    return applicableZone || null;
  }, [pickupLocation, dropoffLocation, pricingZones, calculateDistance]);

  // Fit map to show both markers
  const fitMapToMarkers = useCallback(() => {
    if (!map.current) return;

    const markers = [];
    if (pickupLocation) markers.push(pickupLocation.position);
    if (dropoffLocation) markers.push(dropoffLocation.position);

    if (markers.length === 0) return;

    if (markers.length === 1) {
      // Only one marker, center on it
      map.current.flyTo({
        center: markers[0],
        zoom: 16,
        duration: 1500
      });
    } else {
      // Multiple markers, fit bounds
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach(marker => bounds.extend(marker));
      map.current.fitBounds(bounds, { padding: 80, duration: 1500 });
    }
  }, [pickupLocation, dropoffLocation]);

  // Initialize MapTiler map with useCallback for manual triggering
  const initializeMap = useCallback(() => {
    if (map.current || !mapContainer.current || !maptilerApiKey) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${maptilerApiKey}`,
        center: [-0.1870, 5.6037], // Accra, Ghana [lng, lat]
        zoom: 10,
      });

      // Add navigation control (zoom buttons)
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Add fullscreen control
      map.current.addControl(new maplibregl.FullscreenControl(), 'top-right');

      // Add load event listener to ensure map is fully loaded
      map.current.on('load', () => {
        console.log('MapTiler map loaded successfully');
        setMapLoaded(true);
        
        // Add route line source and layer when map loads
        if (map.current && !map.current.getSource(routeLineId)) {
          map.current.addSource(routeLineId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          map.current.addLayer({
            id: routeLineId,
            type: 'line',
            source: routeLineId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3b82f6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }

        // Add pricing zones circles when map loads
        if (map.current && pricingZones.length > 0) {
          pricingZones.forEach((zone, index) => {
            const zoneId = `pricing-zone-${zone.id}`;
            
            if (!map.current!.getSource(zoneId)) {
              map.current!.addSource(zoneId, {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[]]
                  }
                }
              });

              // Add fill layer
              map.current!.addLayer({
                id: `${zoneId}-fill`,
                type: 'fill',
                source: zoneId,
                paint: {
                  'fill-color': zoneColors[index % zoneColors.length],
                  'fill-opacity': 0.15
                }
              });

              // Add border layer
              map.current!.addLayer({
                id: `${zoneId}-border`,
                type: 'line',
                source: zoneId,
                paint: {
                  'line-color': zoneColors[index % zoneColors.length],
                  'line-width': 2,
                  'line-opacity': 0.8
                }
              });
            }
          });
        }
      });

      // Add error event listener
      map.current.on('error', (e) => {
        console.error('MapTiler map error:', e);
        setMapLoaded(false);
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }, [maptilerApiKey, pricingZones, routeLineId, zoneColors]);

  // Auto-initialize map with 4 second delay
  useEffect(() => {
    // Wait for 4 seconds before initializing the map
    const timer = setTimeout(() => {
      initializeMap();
    }, 4000);

    return () => {
      clearTimeout(timer);
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initializeMap]);

  // Handle pickup location selection
  const handlePickupSelect = useCallback(() => {
    if (!pickupAutocomplete.current || !placesService.current) return;

    const place = pickupAutocomplete.current.getPlace();
    
    if (!place.geometry || !place.geometry.location) {
      alert('No location data available for this pickup location');
      return;
    }

    setIsSearching(true);

    const request = {
      placeId: place.place_id!,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
    };

    placesService.current.getDetails(request, (result, status) => {
      setIsSearching(false);
      
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        const locationData: LocationMarker = {
          id: result.place_id!,
          position: [result.geometry!.location!.lng(), result.geometry!.location!.lat()],
          name: result.name || 'Pickup Location',
          address: result.formatted_address || '',
          types: result.types || [],
          placeId: result.place_id!
        };

        setPickupLocation(locationData);
        addPickupMarker(locationData);
        fitMapToMarkers();
      } else {
        alert('Could not retrieve pickup location details');
      }
    });
  }, [fitMapToMarkers]);

  // Handle drop-off location selection
  const handleDropoffSelect = useCallback(() => {
    if (!dropoffAutocomplete.current || !placesService.current) return;

    const place = dropoffAutocomplete.current.getPlace();
    
    if (!place.geometry || !place.geometry.location) {
      alert('No location data available for this drop-off location');
      return;
    }

    setIsSearching(true);

    const request = {
      placeId: place.place_id!,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
    };

    placesService.current.getDetails(request, (result, status) => {
      setIsSearching(false);
      
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        const locationData: LocationMarker = {
          id: result.place_id!,
          position: [result.geometry!.location!.lng(), result.geometry!.location!.lat()],
          name: result.name || 'Drop-off Location',
          address: result.formatted_address || '',
          types: result.types || [],
          placeId: result.place_id!
        };

        setDropoffLocation(locationData);
        addDropoffMarker(locationData);
        fitMapToMarkers();
      } else {
        alert('Could not retrieve drop-off location details');
      }
    });
  }, [fitMapToMarkers]);

  // Initialize Google Places Service and Autocomplete
  const initializeGoogleServices = useCallback(() => {
    if (!isGoogleLoaded || !map.current || !pickupInputRef.current || !dropoffInputRef.current) return;

    try {
      // Initialize Places Service
      if (!placesService.current) {
        const serviceDiv = document.createElement('div');
        const dummyMap = new google.maps.Map(serviceDiv);
        placesService.current = new google.maps.places.PlacesService(dummyMap);
      }

      // Initialize Pickup Autocomplete
      if (!pickupAutocomplete.current) {
        pickupAutocomplete.current = new google.maps.places.Autocomplete(
          pickupInputRef.current,
          {
            fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
            types: ['establishment', 'geocode']
          }
        );
        pickupAutocomplete.current.addListener('place_changed', handlePickupSelect);
      }

      // Initialize Drop-off Autocomplete
      if (!dropoffAutocomplete.current) {
        dropoffAutocomplete.current = new google.maps.places.Autocomplete(
          dropoffInputRef.current,
          {
            fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
            types: ['establishment', 'geocode']
          }
        );
        dropoffAutocomplete.current.addListener('place_changed', handleDropoffSelect);
      }
    } catch (error) {
      console.error('Failed to initialize Google services:', error);
    }
  }, [isGoogleLoaded, handlePickupSelect, handleDropoffSelect]);

  useEffect(() => {
    if (isGoogleLoaded && map.current) {
      initializeGoogleServices();
    }
  }, [isGoogleLoaded, map.current, initializeGoogleServices]);

  // Add pickup marker (green)
  const addPickupMarker = (location: LocationMarker): void => {
    // Clear existing pickup marker
    if (pickupMarker) {
      pickupMarker.remove();
    }

    if (!map.current) return;

    const [lng, lat] = location.position;
    
    // Create pickup marker element (green)
    const el = document.createElement('div');
    el.className = 'pickup-marker';
    el.style.cssText = `
      background-color: #10b981;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
      transition: all 0.3s ease;
    `;
    
    // Add pickup icon
    el.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    `;

    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)';
      el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });

    // Create popup content
    const popupContent = `
      <div style="padding: 15px; max-width: 300px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <div style="width: 20px; height: 20px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 12px; font-weight: bold;">P</span>
          </div>
          <h3 style="margin: 0; font-weight: bold; color: #1f2937; font-size: 16px;">
            Pickup Location
          </h3>
        </div>
        <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #10b981; font-size: 18px; line-height: 1.3;">
          ${location.name}
        </h4>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">
          ${location.address}
        </p>
        <div style="font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          <p style="margin: 3px 0;"><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
          <p style="margin: 3px 0;"><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
        </div>
      </div>
    `;

    // Create popup
    const popup = new maplibregl.Popup({ 
      offset: 30,
      closeButton: true,
      closeOnClick: false
    }).setHTML(popupContent);

    // Create marker
    const marker = new maplibregl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map.current!);

    setPickupMarker(marker);
  };

  // Add drop-off marker (red)
  const addDropoffMarker = (location: LocationMarker): void => {
    // Clear existing drop-off marker
    if (dropoffMarker) {
      dropoffMarker.remove();
    }

    if (!map.current) return;

    const [lng, lat] = location.position;
    
    // Create drop-off marker element (red)
    const el = document.createElement('div');
    el.className = 'dropoff-marker';
    el.style.cssText = `
      background-color: #ef4444;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 16px;
      transition: all 0.3s ease;
    `;
    
    // Add drop-off icon
    el.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
    `;

    // Add hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)';
      el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    });

    // Create popup content
    const popupContent = `
      <div style="padding: 15px; max-width: 300px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
          <div style="width: 20px; height: 20px; background-color: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 12px; font-weight: bold;">D</span>
          </div>
          <h3 style="margin: 0; font-weight: bold; color: #1f2937; font-size: 16px;">
            Drop-off Location
          </h3>
        </div>
        <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #ef4444; font-size: 18px; line-height: 1.3;">
          ${location.name}
        </h4>
        <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 1.4;">
          ${location.address}
        </p>
        <div style="font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          <p style="margin: 3px 0;"><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
          <p style="margin: 3px 0;"><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
        </div>
      </div>
    `;

    // Create popup
    const popup = new maplibregl.Popup({ 
      offset: 30,
      closeButton: true,
      closeOnClick: false
    }).setHTML(popupContent);

    // Create marker
    const marker = new maplibregl.Marker(el)
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(map.current!);

    setDropoffMarker(marker);
  };

  // Draw pricing zones around pickup location using Turf.js
  const drawPricingZones = useCallback(() => {
    if (!map.current || !pickupLocation || !mapLoaded || pricingZones.length === 0) return;

    try {
      pricingZones.forEach((zone, index) => {
        const zoneId = `pricing-zone-${zone.id}`;
        const center = turf.point(pickupLocation.position);
        const circle = turf.circle(center, zone.endKm, {
          steps: 64,
          units: 'kilometers'
        });

        const source = map.current!.getSource(zoneId);
        if (source && source.type === 'geojson') {
          source.setData(circle);
        }
      });
    } catch (error) {
      console.error('Error drawing pricing zones:', error);
    }
  }, [pickupLocation, mapLoaded, pricingZones]);

  // Clear pricing zones
  const clearPricingZones = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    try {
      pricingZones.forEach((zone) => {
        const zoneId = `pricing-zone-${zone.id}`;
        const source = map.current!.getSource(zoneId);
        if (source && source.type === 'geojson') {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[]]
            }
          });
        }
      });
    } catch (error) {
      console.error('Error clearing pricing zones:', error);
    }
  }, [mapLoaded, pricingZones]);

  // Update zones when pickup location changes
  useEffect(() => {
    if (pickupLocation && pricingZones.length > 0) {
      drawPricingZones();
    } else {
      clearPricingZones();
    }
  }, [pickupLocation, pricingZones, drawPricingZones, clearPricingZones]);

  // Draw direction line between pickup and drop-off
  const drawDirectionLine = useCallback(() => {
    if (!map.current || !pickupLocation || !dropoffLocation || !mapLoaded) return;

    try {
      const source = map.current.getSource(routeLineId);
      if (source && source.type === 'geojson') {
        const lineData = {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              pickupLocation.position, // [lng, lat]
              dropoffLocation.position  // [lng, lat]
            ]
          }
        };

        source.setData(lineData);
      }
    } catch (error) {
      console.error('Error drawing direction line:', error);
    }
  }, [pickupLocation, dropoffLocation, mapLoaded, routeLineId]);

  // Clear direction line
  const clearDirectionLine = useCallback(() => {
    if (!map.current || !mapLoaded) return;

    try {
      const source = map.current.getSource(routeLineId);
      if (source && source.type === 'geojson') {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        });
      }
    } catch (error) {
      console.error('Error clearing direction line:', error);
    }
  }, [mapLoaded, routeLineId]);

  // Update direction line when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      drawDirectionLine();
    } else {
      clearDirectionLine();
    }
  }, [pickupLocation, dropoffLocation, drawDirectionLine, clearDirectionLine]);

  const clearPickupMarker = (): void => {
    if (pickupMarker) {
      pickupMarker.remove();
      setPickupMarker(null);
    }
    setPickupLocation(null);
    setPickupQuery('');
    if (pickupInputRef.current) {
      pickupInputRef.current.value = '';
    }
    clearDirectionLine();
    clearPricingZones();
  };

  const clearDropoffMarker = (): void => {
    if (dropoffMarker) {
      dropoffMarker.remove();
      setDropoffMarker(null);
    }
    setDropoffLocation(null);
    setDropoffQuery('');
    if (dropoffInputRef.current) {
      dropoffInputRef.current.value = '';
    }
    clearDirectionLine();
  };

  const clearAllMarkers = (): void => {
    clearPickupMarker();
    clearDropoffMarker();
    clearDirectionLine();
    clearPricingZones();
  };

  if (!isGoogleLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Google Maps API...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Pickup & Drop-off Location Map
        </h1>
        <p className="text-gray-600">
          Search for pickup and drop-off locations with dynamic pricing zones
        </p>
      </div>

      {/* Search Controls */}
      <div className="mb-4 space-y-4">
        {/* Pickup Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <Navigation className="text-green-600 w-4 h-4" />
            </div>
            <input
              ref={pickupInputRef}
              type="text"
              value={pickupQuery}
              onChange={(e) => setPickupQuery(e.target.value)}
              placeholder="Enter pickup location..."
              className="w-full pl-16 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
              disabled={isSearching}
            />
            {pickupLocation && (
              <button
                onClick={clearPickupMarker}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Drop-off Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 z-10">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <Target className="text-red-600 w-4 h-4" />
            </div>
            <input
              ref={dropoffInputRef}
              type="text"
              value={dropoffQuery}
              onChange={(e) => setDropoffQuery(e.target.value)}
              placeholder="Enter drop-off location..."
              className="w-full pl-16 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
              disabled={isSearching}
            />
            {dropoffLocation && (
              <button
                onClick={clearDropoffMarker}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Status and Actions */}
        {(pickupLocation || dropoffLocation) && (
          <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              {pickupLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-800 font-medium">
                    Pickup set ({pricingZones.length} zones)
                  </span>
                </div>
              )}
              {dropoffLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-800 font-medium">Drop-off set</span>
                </div>
              )}
              {pickupLocation && dropoffLocation && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-800 font-medium">
                    Route: {calculateDistance()?.toFixed(2)} km
                    {calculatePrice() && (
                      <span className="ml-2 text-green-800 font-bold">
                        ${calculatePrice()!.price.toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={clearAllMarkers}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              type="button"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Manual Map Load Button */}
        {!mapLoaded && (
          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">Map is loading...</span>
            </div>
            <button
              onClick={initializeMap}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              type="button"
            >
              Reload Map
            </button>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg relative">
        <div 
          ref={mapContainer} 
          className="w-full h-96 md:h-[600px]"
        />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
              <p className="text-gray-600">Loading MapTiler...</p>
              <button
                onClick={initializeMap}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                type="button"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Location Details */}
      {(pickupLocation || dropoffLocation) && (
        <div className="mt-4 space-y-4">
          {/* Pricing Zones Display */}
          {pickupLocation && pricingZones.length > 0 && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                Pricing Zones
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {pricingZones.map((zone, index) => {
                  const isActiveZone = calculatePrice()?.id === zone.id;
                  return (
                    <div
                      key={zone.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isActiveZone 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: zoneColors[index % zoneColors.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {zone.startKm}km - {zone.endKm}km
                        </span>
                        {isActiveZone && (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        ${zone.price.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Route Summary */}
          {pickupLocation && dropoffLocation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <div className="w-4 h-2 bg-blue-500 rounded-full"></div>
                Route Summary
              </h3>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Distance:</span>
                  <span className="ml-2 text-blue-900">{calculateDistance()?.toFixed(2)} km</span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Price:</span>
                  <span className="ml-2 text-blue-900 font-bold">
                    {calculatePrice() ? `${calculatePrice()!.price.toFixed(2)}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Zone:</span>
                  <span className="ml-2 text-blue-900">
                    {calculatePrice() ? `${calculatePrice()!.startKm}-${calculatePrice()!.endKm}km` : 'Outside zones'}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Status:</span>
                  <span className="ml-2 text-blue-900">Route mapped</span>
                </div>
              </div>
            </div>
          )}

          {/* Pickup Zone Info */}
          {pickupLocation && !dropoffLocation && pricingZones.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full opacity-50"></div>
                Service Areas
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-700 font-medium">Zones:</span>
                  <span className="ml-2 text-green-900">{pricingZones.length} pricing areas</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Max range:</span>
                  <span className="ml-2 text-green-900">{Math.max(...pricingZones.map(z => z.endKm))} km</span>
                </div>
                <div>
                  <span className="text-green-700 font-medium">Status:</span>
                  <span className="ml-2 text-green-900">Zones active</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Location Details Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Pickup Details */}
            {pickupLocation && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Pickup Location
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-green-800">{pickupLocation.name}</p>
                  <p className="text-sm text-green-700">{pickupLocation.address}</p>
                  <div className="text-xs text-green-600">
                    <p>Lat: {pickupLocation.position[1].toFixed(6)}</p>
                    <p>Lng: {pickupLocation.position[0].toFixed(6)}</p>
                    <p>Pricing zones: {pricingZones.length}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Drop-off Details */}
            {dropoffLocation && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Drop-off Location
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-red-800">{dropoffLocation.name}</p>
                  <p className="text-sm text-red-700">{dropoffLocation.address}</p>
                  <div className="text-xs text-red-600">
                    <p>Lat: {dropoffLocation.position[1].toFixed(6)}</p>
                    <p>Lng: {dropoffLocation.position[0].toFixed(6)}</p>
                    {pickupLocation && calculateDistance() && (
                      <div className="mt-1">
                        {calculatePrice() ? (
                          <p className="font-medium text-green-600">
                            ✓ Zone: {calculatePrice()!.startKm}-{calculatePrice()!.endKm}km (${calculatePrice()!.price})
                          </p>
                        ) : (
                          <p className="font-medium text-red-600">
                            ✗ Outside service zones
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-red-800 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Loading Zones */}
      {isLoadingZones && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-blue-800">Loading pricing zones...</span>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <span className="text-green-600 font-medium">Green marker & zones:</span> Pickup location with multiple pricing zones</li>
          <li>• <span className="text-red-600 font-medium">Red marker:</span> Drop-off location - start typing in the second search box</li>
          <li>• <span className="text-blue-600 font-medium">Blue line:</span> Direct route appears when both locations are set</li>
          <li>• <span className="text-purple-600 font-medium">Colored circles:</span> Different pricing zones loaded from rider data</li>
          <li>• <span className="text-green-600 font-medium">Price calculation:</span> Automatic pricing based on distance and zones</li>
          <li>• Distance calculation shows straight-line distance and applicable pricing</li>
        </ul>
      </div>
    </div>
  );
};

export default AutocompleteSearchMap;