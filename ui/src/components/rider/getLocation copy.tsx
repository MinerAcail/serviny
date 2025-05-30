import React, { useState, useEffect, useRef, useCallback } from 'react';
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { DeckGL } from '@deck.gl/react';
import { ScatterplotLayer, IconLayer, TextLayer } from '@deck.gl/layers';
import * as turf from '@turf/turf';
import { gql, useQuery, useMutation } from '@apollo/client';

// GraphQL queries and mutations
const GET_RIDER_LOCATION = gql`
  query getRidersLocations {
    getRidersLocations {
      id
      name
      coordinates
      isTracking
      updatedAt
    }
  }
`;

const UPDATE_RIDER_LOCATION = gql`
  mutation UpdateRiderLocation($coordinates: [Float!]!) {
    updateRiderLocation(coordinates: $coordinates) {
      id
      updatedAt
      name
      coordinates
    }
  }
`;

// Types
interface RiderLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  isTracking: boolean;
  updatedAt: string;
  bearing?: number;
  previousCoordinates?: [number, number];
}

interface RiderMarkerData {
  id: string;
  name: string;
  position: [number, number];
  bearing: number;
  color: [number, number, number];
  isActive: boolean;
}

// Default map center (Accra, Ghana)
const DEFAULT_CENTER = { lat: 5.6037, lng: -0.187 };

// Calculate bearing between two points using Turf.js
const calculateBearing = (prevCoords: [number, number], currentCoords: [number, number]): number => {
  try {
    const bearing = turf.bearing(prevCoords, currentCoords);
    // Convert to 0-360 degrees
    return bearing >= 0 ? bearing : bearing + 360;
  } catch (error) {
    console.error('Error calculating bearing:', error);
    return 0;
  }
};

// Mock data for development (remove in production)
const useMockData = false; // Set to false when using real GraphQL

const mockRiderData = (): RiderLocation => {
  const time = Date.now() / 10000;
  const baseCoords: [number, number] = [-0.45487, 5.6037];
  const radius = 0.005;
  
  return {
    id: "current-rider",
    name: "You",
    coordinates: [
      baseCoords[0] + Math.cos(time) * radius,
      baseCoords[1] + Math.sin(time) * radius
    ],
    isTracking: true,
    updatedAt: new Date().toISOString()
  };
};

const envApiKey = import.meta.env.VITE_MAPTILER_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function SingleRiderTrackingMap() {
  const [rider, setRider] = useState<RiderLocation | null>(null);
  const [viewState, setViewState] = useState({
    longitude: DEFAULT_CENTER.lng,
    latitude: DEFAULT_CENTER.lat,
    zoom: 15,
    pitch: 0,
    bearing: 0
  });
  const [isTracking, setIsTracking] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const deckRef = useRef<any>(null);

  // Create map style URL
  const mapStyle = envApiKey 
    ? `https://api.maptiler.com/maps/streets/style.json?key=${envApiKey}` 
    : 'https://demotiles.maplibre.org/style.json'; // Fallback style if no API key

  // GraphQL query for rider location (polling every 5 seconds)
  const { data, loading, error, startPolling, stopPolling } = useQuery(GET_RIDER_LOCATION, {
    pollInterval: useMockData ? 0 : 5000,
    errorPolicy: 'all',
    skip: useMockData || !isTracking
  });

  // Mutation for updating rider location
  const [updateRiderLocationMutation] = useMutation(UPDATE_RIDER_LOCATION, {
    errorPolicy: 'all'
  });

  // Initialize MapLibre GL map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log('Initializing MapLibre GL map...');
    console.log('Map style:', mapStyle);

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: [viewState.longitude, viewState.latitude],
        zoom: viewState.zoom,
        pitch: viewState.pitch,
        bearing: viewState.bearing,
        antialias: true
      });

      map.on('load', () => {
        console.log('Map loaded successfully');
        setIsMapLoaded(true);
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
        setMapError(`Map failed to load: ${e.error?.message || 'Unknown error'}`);
        
        // Try fallback to demo style if MapTiler fails
        if (mapStyle.includes('maptiler.com')) {
          console.log('Falling back to demo style...');
          try {
            map.setStyle('https://demotiles.maplibre.org/style.json');
          } catch (fallbackError) {
            console.error('Fallback style also failed:', fallbackError);
            setMapError('Both primary and fallback map styles failed to load');
          }
        }
      });

      map.on('style.load', () => {
        console.log('Map style loaded');
        setIsMapLoaded(true);
      });

      // Add navigation controls
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      // Add geolocate control
      try {
        const geolocateControl = new maplibregl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: false,
          showUserHeading: false
        });
        map.addControl(geolocateControl, 'top-right');
      } catch (geoError) {
        console.warn('Could not add geolocate control:', geoError);
      }

      // Handle map move events
      const handleMapMove = () => {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const pitch = map.getPitch();
        const bearing = map.getBearing();

        setViewState({
          longitude: center.lng,
          latitude: center.lat,
          zoom,
          pitch,
          bearing
        });

        // Disable auto-follow if user manually moves map significantly
        if (isTracking && rider && autoFollow) {
          try {
            const distance = turf.distance(
              [rider.coordinates[0], rider.coordinates[1]],
              [center.lng, center.lat],
              { units: 'meters' }
            );
            
            if (distance > 100) {
              setAutoFollow(false);
            }
          } catch (error) {
            console.error('Error calculating distance:', error);
          }
        }
      };

      // Throttle map move events
      let moveTimeout: NodeJS.Timeout;
      const throttledHandleMapMove = () => {
        clearTimeout(moveTimeout);
        moveTimeout = setTimeout(handleMapMove, 100);
      };

      map.on('move', throttledHandleMapMove);

      mapRef.current = map;

      // Cleanup
      return () => {
        clearTimeout(moveTimeout);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError(`MapLibre GL initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsMapLoaded(true); // Show error state
    }
  }, [mapStyle]);

  // Mock data polling for development
  useEffect(() => {
    if (!useMockData || !isTracking) return;

    const interval = setInterval(() => {
      const newRiderData = mockRiderData();
      updateRiderData(newRiderData);
    }, 3000);

    // Initial data
    updateRiderData(mockRiderData());

    return () => clearInterval(interval);
  }, [isTracking]);

  // Update rider data with bearing calculation
  const updateRiderData = useCallback((newRiderData: RiderLocation) => {
    setRider(prevRider => {
      if (!prevRider) {
        return { ...newRiderData, bearing: 0 };
      }

      const prevCoords = prevRider.coordinates;
      const currentCoords = newRiderData.coordinates;

      let bearing = prevRider.bearing || 0;
      let previousCoordinates = prevRider.coordinates;

      // Calculate bearing if position has changed significantly
      try {
        const distance = turf.distance(prevCoords, currentCoords, { units: 'meters' });
        if (distance > 10) { // Only update bearing if moved more than 10 meters
          bearing = calculateBearing(prevCoords, currentCoords);
          previousCoordinates = prevCoords;
        }
      } catch (error) {
        console.error('Error calculating distance:', error);
      }

      return {
        ...newRiderData,
        bearing,
        previousCoordinates
      };
    });

    // Update map center to follow rider only if auto-follow is enabled
    if (autoFollow && mapRef.current) {
      mapRef.current.easeTo({
        center: [newRiderData.coordinates[0], newRiderData.coordinates[1]],
        duration: 1000
      });
    }
  }, [autoFollow]);

  // Update rider data when GraphQL query returns new data
  useEffect(() => {
    if (!useMockData && data?.getRidersLocations) {
      updateRiderData(data.getRidersLocations);
    }
  }, [data, updateRiderData]);

  // Start location tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setAutoFollow(true);

    // Start GPS watching
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude
        ];
        
        // Update location via GraphQL mutation
        if (!useMockData) {
          updateRiderLocationMutation({
            variables: { coordinates: coords }
          }).catch(console.error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    // Start GraphQL polling
    if (!useMockData) {
      startPolling(5000);
    }
  }, [updateRiderLocationMutation, startPolling]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!useMockData) {
      stopPolling();
    }
  }, [stopPolling]);

  // Center map on rider
  const centerOnRider = useCallback(() => {
    if (rider && mapRef.current) {
      setAutoFollow(true);
      mapRef.current.easeTo({
        center: [rider.coordinates[0], rider.coordinates[1]],
        zoom: 16,
        duration: 1500
      });
    }
  }, [rider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Prepare data for Deck.gl layers
  const riderMarkerData: RiderMarkerData[] = rider && rider.isTracking ? [{
    id: rider.id,
    name: rider.name,
    position: rider.coordinates,
    bearing: rider.bearing || 0,
    color: [59, 130, 246], // Blue color
    isActive: true
  }] : [];

  // Create Deck.gl layers
  const layers = [
    // Directional arrow layer using IconLayer
    new IconLayer({
      id: 'rider-arrow',
      data: riderMarkerData,
      pickable: true,
      iconAtlas: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <path d="M32 8 L48 52 L32 44 L16 52 Z" fill="#3b82f6" stroke="#ffffff" stroke-width="3"/>
        </svg>
      `),
      iconMapping: {
        arrow: {
          x: 0,
          y: 0,
          width: 64,
          height: 64,
          anchorX: 32,
          anchorY: 32
        }
      },
      getIcon: () => 'arrow',
      getPosition: (d: RiderMarkerData) => d.position,
      getSize: 40,
      getAngle: (d: RiderMarkerData) => -d.bearing, // Negative because deck.gl rotation is clockwise
      getColor: (d: RiderMarkerData) => d.color,
      updateTriggers: {
        getAngle: riderMarkerData.map(d => d.bearing),
        getPosition: riderMarkerData.map(d => d.position)
      }
    }),

    // Fallback circular marker
    new ScatterplotLayer({
      id: 'rider-circle',
      data: riderMarkerData,
      pickable: true,
      opacity: 0.8,
      stroked: true,
      filled: true,
      radiusScale: 1,
      radiusMinPixels: 12,
      radiusMaxPixels: 16,
      lineWidthMinPixels: 3,
      getPosition: (d: RiderMarkerData) => d.position,
      getRadius: 12,
      getFillColor: (d: RiderMarkerData) => [...d.color, 200],
      getLineColor: [255, 255, 255],
      updateTriggers: {
        getPosition: riderMarkerData.map(d => d.position)
      }
    }),

    // Username label
    new TextLayer({
      id: 'rider-label',
      data: riderMarkerData,
      pickable: false,
      getPosition: (d: RiderMarkerData) => [d.position[0], d.position[1] + 0.0001], // Slightly above marker
      getText: (d: RiderMarkerData) => d.name,
      getSize: 16,
      getAngle: 0,
      getTextAnchor: 'middle',
      getAlignmentBaseline: 'bottom',
      getColor: [255, 255, 255],
      getBackgroundColor: [59, 130, 246, 180],
      backgroundPadding: [4, 2],
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      updateTriggers: {
        getPosition: riderMarkerData.map(d => d.position)
      }
    })
  ];

  // Handle layer click
  const handleLayerClick = (info: any) => {
    if (info.object) {
      console.log('Clicked rider:', info.object);
    }
  };

  // Handle view state change
  const handleViewStateChange = useCallback(({ viewState: newViewState }) => {
    setViewState(newViewState);
    
    // Update MapLibre map if it exists
    if (mapRef.current) {
      mapRef.current.jumpTo({
        center: [newViewState.longitude, newViewState.latitude],
        zoom: newViewState.zoom,
        bearing: newViewState.bearing,
        pitch: newViewState.pitch
      });
    }
  }, []);

  return (
    <div className="h-screen w-full relative">
      {/* Header Controls */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="font-semibold text-gray-800 text-sm">
              {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
            </span>
          </div>
          
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isTracking 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isTracking ? 'Stop' : 'Start'} Tracking
          </button>

          {/* Center on Rider Button */}
          {rider && isTracking && (
            <button
              onClick={centerOnRider}
              className="px-3 py-1.5 rounded text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            >
              📍 Center
            </button>
          )}
        </div>
        
        {/* Auto-follow indicator */}
        {isTracking && (
          <div className="mt-2 flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${autoFollow ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-600">
              Auto-follow: {autoFollow ? 'On' : 'Off'}
            </span>
          </div>
        )}
        
        {useMockData && (
          <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            Mock Mode - Set useMockData to false for production
          </div>
        )}
        
        {!envApiKey && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            Using demo tiles - Add VITE_MAPTILER_API_KEY for better maps
          </div>
        )}
        
        {loading && (
          <div className="flex items-center space-x-2 text-blue-600 mt-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <span className="text-xs">Updating location...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center space-x-2 text-red-600 mt-2">
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
            <span className="text-xs">GraphQL Error: {error.message}</span>
          </div>
        )}
      </div>

      {/* Rider Info Panel */}
      {rider && (
        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border">
          <h3 className="font-semibold text-sm mb-2 text-gray-800">Your Location</h3>
          <div className="space-y-1 text-xs text-gray-600">
            <div>Lat: {rider.coordinates[1].toFixed(6)}</div>
            <div>Lng: {rider.coordinates[0].toFixed(6)}</div>
            <div>Bearing: {Math.round(rider.bearing || 0)}°</div>
            <div>Zoom: {viewState.zoom.toFixed(1)}</div>
            <div className="text-gray-500 pt-1 border-t border-gray-200">
              Updated: {new Date(rider.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0 w-full h-full"
        style={{ 
          minHeight: '100vh',
          minWidth: '100vw'
        }}
      />

      {/* Loading overlay */}
      {!isMapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading MapLibre GL map...</p>
            <p className="text-xs text-gray-500 mt-2">
              {envApiKey ? 'Using MapTiler tiles' : 'Using demo tiles'}
            </p>
          </div>
        </div>
      )}

      {/* Map Error Display */}
      {mapError && isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-30">
          <div className="text-center max-w-md mx-4 p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Map Loading Failed</h3>
            <p className="text-red-600 text-sm mb-4">{mapError}</p>
            <div className="space-y-2 text-xs text-gray-600">
              <p>Possible solutions:</p>
              <ul className="list-disc list-inside text-left">
                <li>Check your internet connection</li>
                <li>Verify VITE_MAPTILER_API_KEY in .env file</li>
                <li>Install maplibre-gl: npm install maplibre-gl</li>
                <li>Check browser console for errors</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      )}

      {/* Debug info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-20 left-4 z-20 bg-black/80 text-white text-xs p-2 rounded max-w-xs">
          <div>Map Loaded: {isMapLoaded ? 'Yes' : 'No'}</div>
          <div>Style: {mapStyle.substring(0, 50)}...</div>
          <div>API Key: {envApiKey ? 'Set' : 'Not set'}</div>
        </div>
      )}

      {/* Deck.GL Overlay */}
      {isMapLoaded && (
        <DeckGL
          ref={deckRef}
          viewState={viewState}
          onViewStateChange={handleViewStateChange}
          controller={true}
          layers={layers}
          onClick={handleLayerClick}
          style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }}
          getTooltip={({ object }) => 
            object && {
              html: `<div class="p-3 bg-white rounded-lg shadow-lg border">
                       <div class="font-semibold text-gray-800">${object.name}</div>
                       <div class="text-sm text-gray-600 mt-1">
                         Direction: ${Math.round(object.bearing)}°<br/>
                         Lat: ${object.position[1].toFixed(6)}<br/>
                         Lng: ${object.position[0].toFixed(6)}
                       </div>
                     </div>`,
              style: {
                fontSize: '12px',
                fontFamily: 'Arial, sans-serif'
              }
            }
          }
        />
      )}

      {/* No Tracking Message */}
      {!rider?.isTracking && !loading && isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-6 py-8 shadow-lg text-center max-w-md mx-4 pointer-events-auto">
            <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Location Tracking Disabled</h3>
            <p className="text-gray-600 mb-4">Click "Start Tracking" to see your real-time location with directional arrow on the map.</p>
          </div>
        </div>
      )}

      {/* Bottom Info Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center space-x-4">
            <div>
              <span className="font-semibold text-gray-800">Real-time GPS Tracking</span>
              <span className="text-gray-600 ml-2">MapLibre GL • Updates every 5 seconds</span>
            </div>
            {isTracking && (
              <div className="flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs">Live</span>
              </div>
            )}
          </div>
          <div className="text-gray-600 text-xs">
            {rider && `Last: ${new Date(rider.updatedAt).toLocaleTimeString()}`}
          </div>
        </div>
        
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {isTracking 
              ? "🧭 Blue arrow shows movement direction • Smooth map interactions • Drag/zoom/rotate supported"
              : "📍 Enable tracking to see your position with directional bearing on the map"
            }
          </div>
        </div>
      </div>
    </div>
  );
}