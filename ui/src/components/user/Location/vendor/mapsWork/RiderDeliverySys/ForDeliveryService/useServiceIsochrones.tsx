// ==========================================
// 1. useRiderZones Hook - Fetches rider's pricing zones (NO ISOCHRONES)
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';

// GraphQL Queries - SIMPLIFIED to only use range-based zones
export const GET_RIDER_RANGES = gql`
  query getRiderRanges($riderId: String!) {
    getRiderRanges(riderId: $riderId) {
      id
      riderId
      startKm
      endKm
      price
      updatedAt
    }
  }
`;

export const GET_RIDER_PROFILE = gql`
  query getRiderProfile($riderId: String!) {
    getRiderProfile(riderId: $riderId) {
      id
      name
      email
      dpfile
      availability
      coordinates
      experience
      phone
      vehicleType
      rating
      isOnline
    }
  }
`;

export const CREATE_DELIVERY_REQUEST = gql`
  mutation createDeliveryRequest($input: DeliveryRequestInput!) {
    createDeliveryRequest(input: $input) {
      id
      riderId
      userId
      pickupLocation {
        address
        coordinates
      }
      dropoffLocation {
        address
        coordinates
      }
      distance
      duration
      totalPrice
      matchedZone {
        id
        startKm
        endKm
        price
      }
      status
      reference
      createdAt
      estimatedPickupTime
      estimatedDeliveryTime
    }
  }
`;

interface PricingZone {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
  updatedAt?: string;
}

interface RiderProfile {
  id: string;
  name: string;
  email: string;
  dpfile?: string;
  availability: boolean;
  coordinates?: number[];
  experience: string;
  phone?: string;
  vehicleType?: string;
  rating?: number;
  isOnline: boolean;
}

interface UseRiderZonesReturn {
  // Data - SIMPLIFIED (no isochrones)
  riderZones: PricingZone[];
  riderProfile: RiderProfile | undefined;
  
  // Loading states
  isLoading: boolean;
  isLoadingProfile: boolean;
  isLoadingZones: boolean;
  
  // Error states
  error: string | null;
  profileError: string | null;
  zonesError: string | null;
  
  // Mutation functions
  createDeliveryRequest: (input: any) => Promise<any>;
  isCreatingRequest: boolean;
  
  // Refresh functions
  refetchZones: () => void;
  refetchProfile: () => void;
}

export function useRiderZones(riderId: string | undefined): UseRiderZonesReturn {
  const [error, setError] = useState<string | null>(null);

  // Query rider's pricing zones ONLY
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
      toast.error('Failed to load rider pricing zones');
    },
  });

  // Query rider's profile
  const {
    data: profileData,
    loading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery(GET_RIDER_PROFILE, {
    variables: { riderId: riderId || '' },
    skip: !riderId,
    onError: (error) => {
      console.error('Error loading rider profile:', error);
      toast.error('Failed to load rider profile');
    },
  });

  // Mutation for creating delivery request
  const [createDeliveryRequestMutation, { loading: isCreatingRequest }] = useMutation(
    CREATE_DELIVERY_REQUEST,
    {
      onError: (error) => {
        console.error('Error creating delivery request:', error);
        toast.error('Failed to create delivery request');
      },
    }
  );

  const createDeliveryRequest = useCallback(async (input: any) => {
    try {
      const result = await createDeliveryRequestMutation({
        variables: { input },
      });
      
      if (result?.data?.createDeliveryRequest) {
        toast.success('Delivery request created successfully!', {
          description: `Reference: ${result.data.createDeliveryRequest.reference}`,
          duration: 5000,
        });
        return result.data.createDeliveryRequest;
      }
      
      throw new Error('No data returned from mutation');
    } catch (error: any) {
      console.error('Create delivery request error:', error);
      
      let errorMessage = 'Failed to create delivery request';
      if (error.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = 'Network error - please check your connection';
      }
      
      toast.error(errorMessage, { duration: 5000 });
      throw error;
    }
  }, [createDeliveryRequestMutation]);

  const isLoading = isLoadingZones || isLoadingProfile;

  return {
    // Data - SIMPLIFIED
    riderZones: zonesData?.getRiderRanges || [],
    riderProfile: profileData?.getRiderProfile,
    
    // Loading states
    isLoading,
    isLoadingProfile,
    isLoadingZones,
    
    // Error states
    error,
    profileError: profileError?.message || null,
    zonesError: zonesError?.message || null,
    
    // Mutation functions
    createDeliveryRequest,
    isCreatingRequest,
    
    // Refresh functions
    refetchZones,
    refetchProfile,
  };
}

// ==========================================
// 2. useLocationSearch Hook - Google Places integration
// ==========================================

interface LocationSearchResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  coordinates?: [number, number]; // [lng, lat]
}

interface UseLocationSearchReturn {
  predictions: LocationSearchResult[];
  isLoading: boolean;
  error: string | null;
  searchLocations: (query: string) => Promise<LocationSearchResult[]>;
  getLocationDetails: (placeId: string) => Promise<{ coordinates: [number, number]; address: string } | null>;
  clearPredictions: () => void;
}

export function useLocationSearch(
  autocompleteService: google.maps.places.AutocompleteService | null,
  placesService: google.maps.places.PlacesService | null
): UseLocationSearchReturn {
  const [predictions, setPredictions] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchLocations = useCallback(async (query: string): Promise<LocationSearchResult[]> => {
    if (!autocompleteService || query.length < 3) {
      setPredictions([]);
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve) => {
        autocompleteService.getPlacePredictions(
          { 
            input: query,
            types: ['establishment', 'geocode'], // Include both places and addresses
          },
          (results, status) => {
            setIsLoading(false);

            if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
              console.error('Places search error:', status);
              setError('Failed to search locations');
              setPredictions([]);
              resolve([]);
              return;
            }

            const formattedResults = results.map((result) => ({
              description: result.description,
              place_id: result.place_id,
              structured_formatting: {
                main_text: result.structured_formatting?.main_text || result.description,
                secondary_text: result.structured_formatting?.secondary_text || '',
              },
            }));

            setPredictions(formattedResults);
            resolve(formattedResults);
          }
        );
      });
    } catch (error) {
      console.error('Location search error:', error);
      setError('Search failed');
      setIsLoading(false);
      setPredictions([]);
      return [];
    }
  }, [autocompleteService]);

  const getLocationDetails = useCallback(async (placeId: string) => {
    if (!placesService) return null;

    setIsLoading(true);

    try {
      return new Promise<{ coordinates: [number, number]; address: string } | null>((resolve) => {
        placesService.getDetails(
          {
            placeId,
            fields: ['geometry', 'formatted_address'],
          },
          (result, status) => {
            setIsLoading(false);

            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result &&
              result.geometry &&
              result.geometry.location
            ) {
              const lat = result.geometry.location.lat();
              const lng = result.geometry.location.lng();
              const address = result.formatted_address || '';

              resolve({
                coordinates: [lng, lat],
                address,
              });
            } else {
              console.error('Place details error:', status);
              setError('Failed to get location details');
              resolve(null);
            }
          }
        );
      });
    } catch (error) {
      console.error('Get location details error:', error);
      setError('Failed to get location details');
      setIsLoading(false);
      return null;
    }
  }, [placesService]);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
  }, []);

  return {
    predictions,
    isLoading,
    error,
    searchLocations,
    getLocationDetails,
    clearPredictions,
  };
}

// ==========================================
// 3. useDeliveryCalculation Hook - SIMPLIFIED distance and zone matching
// ==========================================

import * as turf from '@turf/turf';

interface Location {
  lng: number;
  lat: number;
  address: string;
}

interface DeliveryCalculation {
  distance: number;
  duration: string;
  matchedZone: PricingZone | null;
  totalPrice: number;
  pickupLocation: Location;
  dropoffLocation: Location;
}

interface UseDeliveryCalculationReturn {
  calculation: DeliveryCalculation | null;
  isCalculating: boolean;
  error: string | null;
  calculateDelivery: (pickup: Location, dropoff: Location, zones: PricingZone[]) => Promise<DeliveryCalculation | null>;
  clearCalculation: () => void;
}

export function useDeliveryCalculation(): UseDeliveryCalculationReturn {
  const [calculation, setCalculation] = useState<DeliveryCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDelivery = useCallback(async (
    pickup: Location,
    dropoff: Location,
    zones: PricingZone[]
  ): Promise<DeliveryCalculation | null> => {
    if (!pickup || !dropoff || !zones.length) {
      setError('Missing required data for calculation');
      return null;
    }

    setIsCalculating(true);
    setError(null);

    try {
      // Simulate calculation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      // Calculate straight-line distance using Turf.js
      const from = turf.point([pickup.lng, pickup.lat]);
      const to = turf.point([dropoff.lng, dropoff.lat]);
      const distance = turf.distance(from, to, { units: 'kilometers' });

      console.log('Calculated distance:', distance, 'km');
      console.log('Available zones:', zones);

      // Find matching pricing zone - SIMPLE ZONE MATCHING
      const matchedZone = zones.find(zone => {
        const inRange = distance >= zone.startKm && distance < zone.endKm;
        console.log(`Zone ${zone.startKm}-${zone.endKm}km: ${inRange ? 'MATCH' : 'no match'}`);
        return inRange;
      }) || zones[zones.length - 1]; // Default to last/highest zone if over max

      if (!matchedZone) {
        setError('No pricing zone found for this distance');
        return null;
      }

      console.log('Matched zone:', matchedZone);

      // Calculate estimated duration (configurable speed)
      const averageSpeed = 25; // km/h - slower for city driving
      const durationMinutes = Math.round((distance / averageSpeed) * 60);
      const duration = durationMinutes < 60 
        ? `${durationMinutes} min`
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

      const result: DeliveryCalculation = {
        distance: Number(distance.toFixed(2)),
        duration,
        matchedZone,
        totalPrice: matchedZone.price,
        pickupLocation: pickup,
        dropoffLocation: dropoff,
      };

      console.log('Final calculation:', result);
      setCalculation(result);
      
      // Show success toast with zone info
      toast.success('Delivery calculated!', {
        description: `${result.distance}km → Zone ${matchedZone.startKm}-${matchedZone.endKm}km → $${result.totalPrice.toFixed(2)}`,
        duration: 3000,
      });

      return result;

    } catch (error) {
      console.error('Delivery calculation error:', error);
      setError('Failed to calculate delivery details');
      toast.error('Failed to calculate delivery details');
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const clearCalculation = useCallback(() => {
    setCalculation(null);
    setError(null);
  }, []);

  return {
    calculation,
    isCalculating,
    error,
    calculateDelivery,
    clearCalculation,
  };
}

// ==========================================
// 4. useURLStateManager Hook - Manages URL state for locations
// ==========================================

interface URLLocation {
  lat: number;
  lng: number;
  address: string;
}

interface UseURLStateManagerReturn {
  pickupLocation: URLLocation | null;
  dropoffLocation: URLLocation | null;
  updatePickupLocation: (location: URLLocation | null) => void;
  updateDropoffLocation: (location: URLLocation | null) => void;
  clearAllLocations: () => void;
}

export function useURLStateManager(): UseURLStateManagerReturn {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get initial state from URL
  const getInitialLocation = useCallback((prefix: 'pickup' | 'dropoff'): URLLocation | null => {
    const lat = searchParams.get(`${prefix}Lat`);
    const lng = searchParams.get(`${prefix}Lng`);
    const address = searchParams.get(`${prefix}Address`);

    if (lat && lng && address) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: decodeURIComponent(address),
      };
    }
    return null;
  }, [searchParams]);

  const [pickupLocation, setPickupLocation] = useState<URLLocation | null>(() => 
    getInitialLocation('pickup')
  );
  
  const [dropoffLocation, setDropoffLocation] = useState<URLLocation | null>(() => 
    getInitialLocation('dropoff')
  );

  // Update URL params
  const updateURLParams = useCallback((pickup: URLLocation | null, dropoff: URLLocation | null) => {
    const newParams = new URLSearchParams(searchParams);

    // Handle pickup location
    if (pickup) {
      newParams.set('pickupLat', pickup.lat.toString());
      newParams.set('pickupLng', pickup.lng.toString());
      newParams.set('pickupAddress', encodeURIComponent(pickup.address));
    } else {
      newParams.delete('pickupLat');
      newParams.delete('pickupLng');
      newParams.delete('pickupAddress');
    }

    // Handle dropoff location
    if (dropoff) {
      newParams.set('dropoffLat', dropoff.lat.toString());
      newParams.set('dropoffLng', dropoff.lng.toString());
      newParams.set('dropoffAddress', encodeURIComponent(dropoff.address));
    } else {
      newParams.delete('dropoffLat');
      newParams.delete('dropoffLng');
      newParams.delete('dropoffAddress');
    }

    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const updatePickupLocation = useCallback((location: URLLocation | null) => {
    setPickupLocation(location);
    updateURLParams(location, dropoffLocation);
  }, [dropoffLocation, updateURLParams]);

  const updateDropoffLocation = useCallback((location: URLLocation | null) => {
    setDropoffLocation(location);
    updateURLParams(pickupLocation, location);
  }, [pickupLocation, updateURLParams]);

  const clearAllLocations = useCallback(() => {
    setPickupLocation(null);
    setDropoffLocation(null);
    updateURLParams(null, null);
  }, [updateURLParams]);

  return {
    pickupLocation,
    dropoffLocation,
    updatePickupLocation,
    updateDropoffLocation,
    clearAllLocations,
  };
}

// ==========================================
// 5. useMapManager Hook - SIMPLIFIED for pickup/dropoff only
// ==========================================

import maplibregl from 'maplibre-gl';
import { useSearchParams } from 'react-router';

interface UseMapManagerReturn {
  mapInstance: React.MutableRefObject<maplibregl.Map | null>;
  mapLoaded: boolean;
  pickupMarker: maplibregl.Marker | null;
  dropoffMarker: maplibregl.Marker | null;
  initializeMap: (container: HTMLDivElement, apiKey?: string) => void;
  updateMarkers: (pickup?: Location, dropoff?: Location) => void;
  fitMapToMarkers: () => void;
  clearMarkers: () => void;
  drawRoute: (pickup: Location, dropoff: Location) => void;
  clearRoute: () => void;
}

export function useMapManager(): UseMapManagerReturn {
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pickupMarker, setPickupMarker] = useState<maplibregl.Marker | null>(null);
  const [dropoffMarker, setDropoffMarker] = useState<maplibregl.Marker | null>(null);

  const initializeMap = useCallback((container: HTMLDivElement, maptilerApiKey?: string) => {
    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : 'https://demotiles.maplibre.org/style.json';

    const map = new maplibregl.Map({
      container,
      style: mapStyle,
      center: [-74.006, 40.7128], // NYC default
      zoom: 11,
      attributionControl: false,
    });

    mapInstance.current = map;

    map.on('load', () => {
      setMapLoaded(true);
    });

    map.on('error', (e) => {
      console.error('Map error:', e);
      if (maptilerApiKey && e.error?.status === 401) {
        map.setStyle('https://demotiles.maplibre.org/style.json');
      }
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
  }, []);

  const clearMarkers = useCallback(() => {
    if (pickupMarker) {
      pickupMarker.remove();
      setPickupMarker(null);
    }
    if (dropoffMarker) {
      dropoffMarker.remove();
      setDropoffMarker(null);
    }
  }, [pickupMarker, dropoffMarker]);

  const updateMarkers = useCallback((pickup?: Location, dropoff?: Location) => {
    if (!mapInstance.current || !mapLoaded) return;

    clearMarkers();

    // Create pickup marker (GREEN)
    if (pickup) {
      const marker = new maplibregl.Marker({ color: '#22c55e' })
        .setLngLat([pickup.lng, pickup.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="font-medium">📍 Pickup Location</div><div class="text-sm text-gray-600">${pickup.address}</div>`
          )
        )
        .addTo(mapInstance.current);
      
      setPickupMarker(marker);
    }

    // Create dropoff marker (RED)
    if (dropoff) {
      const marker = new maplibregl.Marker({ color: '#ef4444' })
        .setLngLat([dropoff.lng, dropoff.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="font-medium">🎯 Drop-off Location</div><div class="text-sm text-gray-600">${dropoff.address}</div>`
          )
        )
        .addTo(mapInstance.current);
      
      setDropoffMarker(marker);
    }
  }, [mapLoaded, clearMarkers]);

  const fitMapToMarkers = useCallback(() => {
    if (!mapInstance.current || !mapLoaded) return;

    const markers = [];
    if (pickupMarker) markers.push(pickupMarker.getLngLat());
    if (dropoffMarker) markers.push(dropoffMarker.getLngLat());

    if (markers.length === 0) return;

    if (markers.length === 1) {
      mapInstance.current.flyTo({
        center: markers[0],
        zoom: 13,
        duration: 1000,
      });
    } else {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach(marker => bounds.extend(marker));
      
      mapInstance.current.fitBounds(bounds, {
        padding: 80,
        maxZoom: 14,
        duration: 1000,
      });
    }
  }, [mapLoaded, pickupMarker, dropoffMarker]);

  const drawRoute = useCallback((pickup: Location, dropoff: Location) => {
    if (!mapInstance.current || !mapLoaded) return;

    // Draw a simple straight line between pickup and dropoff
    const routeData = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [pickup.lng, pickup.lat],
          [dropoff.lng, dropoff.lat]
        ]
      }
    };

    // Add route source if it doesn't exist
    if (!mapInstance.current.getSource('route')) {
      mapInstance.current.addSource('route', {
        type: 'geojson',
        data: routeData
      });

      mapInstance.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
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
    } else {
      // Update existing route
      (mapInstance.current.getSource('route') as maplibregl.GeoJSONSource).setData(routeData);
    }
  }, [mapLoaded]);

  const clearRoute = useCallback(() => {
    if (!mapInstance.current || !mapLoaded) return;

    if (mapInstance.current.getLayer('route-line')) {
      mapInstance.current.removeLayer('route-line');
    }
    if (mapInstance.current.getSource('route')) {
      mapInstance.current.removeSource('route');
    }
  }, [mapLoaded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
      clearRoute();
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [clearMarkers, clearRoute]);

  return {
    mapInstance,
    mapLoaded,
    pickupMarker,
    dropoffMarker,
    initializeMap,
    updateMarkers,
    fitMapToMarkers,
    clearMarkers,
    drawRoute,
    clearRoute,
  };
}

// ==========================================
// 6. Type Definitions - SIMPLIFIED
// ==========================================

export interface DeliveryRequestInput {
  riderId: string;
  userId?: string;
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    address: string;
    coordinates: [number, number];
  };
  distance: number;
  duration: string;
  totalPrice: number;
  matchedZoneId: string;
  notes?: string;
  scheduledPickupTime?: string;
  packageDetails?: {
    weight?: number;
    dimensions?: string;
    description?: string;
    value?: number;
  };
}

export interface DeliveryRequest {
  id: string;
  riderId: string;
  userId: string;
  pickupLocation: {
    address: string;
    coordinates: [number, number];
  };
  dropoffLocation: {
    address: string;
    coordinates: [number, number];
  };
  distance: number;
  duration: string;
  totalPrice: number;
  matchedZone: PricingZone;
  status: 'PENDING' | 'ACCEPTED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  reference: string;
  createdAt: string;
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  notes?: string;
  packageDetails?: {
    weight?: number;
    dimensions?: string;
    description?: string;
    value?: number;
  };
}

// Export all types and interfaces
export type {
  PricingZone,
  RiderProfile,
  Location,
  DeliveryCalculation,
  URLLocation,
  DeliveryRequestInput,
  DeliveryRequest,
};