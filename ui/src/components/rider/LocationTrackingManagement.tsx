import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Navigation, 
  MapPinHouse, 
  Loader2, 
  AlertTriangle, 
  X, 
  Clock, 
  Gauge, 
  Route, 
  AlertCircle, 
  RefreshCw,
  Crosshair,
  MapPin
} from "lucide-react";
import maplibregl from 'maplibre-gl';

// Types
export interface RiderLocation {
  lat: number;
  lng: number;
  heading?: number;
  accuracy?: number;
  timestamp?: number;
  speed?: number;
  altitude?: number;
}

export interface LocationTrackingOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  updateInterval?: number;
  autoCenter?: boolean;
  showAccuracyCircle?: boolean;
  showBearing?: boolean;
}

export interface LocationTrackingState {
  isTracking: boolean;
  currentLocation: RiderLocation | null;
  error: string | null;
  marker: maplibregl.Marker | null;
  isPermissionGranted: boolean;
  trackingDuration: number;
  totalDistance: number;
  averageSpeed: number;
  isLoading: boolean;
}

// Default options
const DEFAULT_OPTIONS: LocationTrackingOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
  updateInterval: 2000,
  autoCenter: true,
  showAccuracyCircle: true,
  showBearing: true,
};

// Location Tracking Button Component
interface LocationTrackingButtonProps {
  isTracking: boolean;
  hasError: boolean;
  isLoading?: boolean;
  onToggle: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LocationTrackingButton: React.FC<LocationTrackingButtonProps> = ({
  isTracking,
  hasError,
  isLoading = false,
  onToggle,
  className = "",
  size = "md",
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "h-10 w-10 sm:h-12 sm:w-12";
      case "lg":
        return "h-16 w-16 sm:h-18 sm:w-18";
      default:
        return "h-12 w-12 sm:h-14 sm:w-14";
    }
  };

  const getButtonClasses = () => {
    if (hasError) {
      return "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700";
    }
    if (isTracking) {
      return "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700";
    }
    return "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700";
  };

  const getTooltipText = () => {
    if (hasError) return "Location error - click to retry";
    if (isTracking) return "Stop location tracking";
    return "Start location tracking";
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (hasError) return <AlertTriangle className="h-4 w-4 animate-bounce" />;
    if (isTracking) return <Navigation className="h-4 w-4 animate-pulse" />;
    return <MapPinHouse className="h-4 w-4" />;
  };

  const getButtonText = () => {
    if (isLoading) return "Loading";
    if (hasError) return "Error";
    if (isTracking) return "Stop";
    return "Track";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onToggle}
          disabled={isLoading}
          className={`
            ${getButtonClasses()}
            ${getSizeClasses()}
            text-white rounded-full shadow-3xl transition-all duration-300 hover:scale-110 relative border-2 border-white/20
            ${className}
          `}
        >
          <div className="text-center">
            <div className="flex items-center justify-center">
              {getButtonIcon()}
            </div>
            <div className="text-xs opacity-90 mt-1 font-medium">{getButtonText()}</div>
          </div>

          {/* Status indicators */}
          {isTracking && !hasError && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse border-2 border-white shadow-lg"></div>
          )}

          {hasError && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-white shadow-lg animate-bounce"></div>
          )}

          {isLoading && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-white shadow-lg animate-spin"></div>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-gray-900 text-white border-gray-700">
        <p className="text-sm">{getTooltipText()}</p>
        {hasError && (
          <p className="text-xs opacity-75 mt-1">Check location permissions</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};

// Location Status Card Component
interface LocationStatusCardProps {
  currentLocation: RiderLocation;
  trackingDuration: number;
  totalDistance: number;
  averageSpeed: number;
  onClose: () => void;
  onCenterLocation?: () => void;
  className?: string;
  variant?: "minimal" | "detailed";
}

export const LocationStatusCard: React.FC<LocationStatusCardProps> = ({
  currentLocation,
  trackingDuration,
  totalDistance,
  averageSpeed,
  onClose,
  onCenterLocation,
  className = "",
  variant = "detailed",
}) => {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatSpeed = (speed?: number) => {
    if (speed === undefined || speed === null) return "0";
    return `${(speed * 3.6).toFixed(1)}`;
  };

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return "bg-gray-100 text-gray-700";
    if (accuracy <= 10) return "bg-green-100 text-green-700";
    if (accuracy <= 30) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getCompassDirection = (degrees?: number) => {
    if (degrees === undefined || degrees === null) return null;
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const directions = [
      { name: 'North', short: 'N', icon: '🧭', color: 'text-red-600' },
      { name: 'Northeast', short: 'NE', icon: '🔄', color: 'text-orange-600' },
      { name: 'East', short: 'E', icon: '➡️', color: 'text-yellow-600' },
      { name: 'Southeast', short: 'SE', icon: '↘️', color: 'text-green-600' },
      { name: 'South', short: 'S', icon: '⬇️', color: 'text-emerald-600' },
      { name: 'Southwest', short: 'SW', icon: '↙️', color: 'text-cyan-600' },
      { name: 'West', short: 'W', icon: '⬅️', color: 'text-blue-600' },
      { name: 'Northwest', short: 'NW', icon: '↖️', color: 'text-purple-600' }
    ];
    const index = Math.round(normalizedDegrees / 45) % 8;
    return directions[index];
  };

  const getDirectionGuidance = (heading?: number) => {
    if (heading === undefined || heading === null) return '';
    
    const direction = getCompassDirection(heading);
    if (!direction) return '';
    
    const guidance = {
      'N': 'Heading North',
      'NE': 'Turn Slightly Right',
      'E': 'Turn Right',
      'SE': 'Turn Sharp Right',
      'S': 'Turn Around',
      'SW': 'Turn Sharp Left',
      'W': 'Turn Left',
      'NW': 'Turn Slightly Left'
    };
    
    return guidance[direction.short as keyof typeof guidance] || '';
  };

  const direction = getCompassDirection(currentLocation.heading);
  const guidance = getDirectionGuidance(currentLocation.heading);

  if (variant === "minimal") {
    return (
      <div className={`fixed top-20 left-4 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl p-3 border border-white/20 z-50 max-w-sm ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
            {direction ? (
              <span className={`text-lg ${direction.color}`}>{direction.icon}</span>
            ) : (
              <Navigation className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
              Location Active
              {direction && (
                <span className={`text-xs px-2 py-0.5 rounded ${direction.color} bg-opacity-20`}>
                  {direction.short}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-600">
              Accuracy: <span className={`px-1 py-0.5 rounded text-xs ${getAccuracyColor(currentLocation.accuracy)}`}>
                ±{currentLocation.accuracy?.toFixed(0) || "Unknown"}m
              </span>
              {currentLocation.heading !== undefined && (
                <span className="ml-2 bg-blue-100 px-1 py-0.5 rounded text-blue-700">
                  {currentLocation.heading.toFixed(0)}°
                </span>
              )}
            </div>
            {guidance && (
              <div className="text-xs text-blue-600 font-medium mt-1">
                🧭 {guidance}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {onCenterLocation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCenterLocation}
                className="h-6 w-6 p-0 hover:bg-blue-100"
              >
                <Crosshair className="h-3 w-3 text-blue-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-red-100"
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-20 left-4 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-white/20 z-50 max-w-sm ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg"></div>
          <h3 className="text-sm font-bold text-gray-900">Live Tracking</h3>
          {direction && (
            <span className={`text-lg ${direction.color}`}>{direction.icon}</span>
          )}
        </div>
        <div className="flex gap-1">
          {onCenterLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCenterLocation}
              className="h-6 w-6 p-0 hover:bg-blue-100"
              title="Center on my location"
            >
              <Crosshair className="h-3 w-3 text-blue-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Navigation Direction Display */}
        {direction && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Navigation</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl ${direction.color}`}>{direction.icon}</span>
                  <div>
                    <div className="font-bold text-gray-900">{direction.name}</div>
                    <div className="text-gray-600">{currentLocation.heading?.toFixed(0)}°</div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-blue-900">{guidance}</div>
                <div className="text-xs text-blue-600">Direction</div>
              </div>
            </div>
          </div>
        )}

        {/* Current Position */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-900">Current Position</span>
          </div>
          <div className="text-xs text-blue-800 space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div><strong>Lat:</strong> {currentLocation.lat.toFixed(6)}</div>
              <div><strong>Lng:</strong> {currentLocation.lng.toFixed(6)}</div>
            </div>
            
            <div className="flex items-center justify-between">
              <span><strong>Accuracy:</strong></span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getAccuracyColor(currentLocation.accuracy)}`}>
                ±{currentLocation.accuracy?.toFixed(0) || "Unknown"}m
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span><strong>Speed:</strong></span>
              <span className="bg-blue-200 px-2 py-0.5 rounded text-blue-900 font-medium">
                {formatSpeed(currentLocation.speed)} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Tracking Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 text-center border border-green-200">
            <div className="flex items-center justify-center mb-1">
              <Clock className="w-3 h-3 text-green-600" />
            </div>
            <div className="text-xs font-bold text-green-900">
              {formatDuration(trackingDuration)}
            </div>
            <div className="text-xs text-green-600 font-medium">Duration</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 text-center border border-purple-200">
            <div className="flex items-center justify-center mb-1">
              <Route className="w-3 h-3 text-purple-600" />
            </div>
            <div className="text-xs font-bold text-purple-900">
              {formatDistance(totalDistance)}
            </div>
            <div className="text-xs text-purple-600 font-medium">Distance</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-2 text-center border border-orange-200">
            <div className="flex items-center justify-center mb-1">
              <Gauge className="w-3 h-3 text-orange-600" />
            </div>
            <div className="text-xs font-bold text-orange-900">
              {averageSpeed.toFixed(1)}
            </div>
            <div className="text-xs text-orange-600 font-medium">km/h avg</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center py-1 border-t border-gray-200">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// Location Error Card Component
interface LocationErrorCardProps {
  error: string;
  onRetry?: () => void;
  onDismiss: () => void;
  className?: string;
}

export const LocationErrorCard: React.FC<LocationErrorCardProps> = ({
  error,
  onRetry,
  onDismiss,
  className = "",
}) => {
  const getErrorType = (errorMessage: string) => {
    if (errorMessage.toLowerCase().includes('denied') || errorMessage.toLowerCase().includes('permission')) {
      return { type: 'permission', icon: AlertCircle, color: 'red' };
    }
    if (errorMessage.toLowerCase().includes('unavailable') || errorMessage.toLowerCase().includes('gps')) {
      return { type: 'unavailable', icon: AlertTriangle, color: 'orange' };
    }
    if (errorMessage.toLowerCase().includes('timeout')) {
      return { type: 'timeout', icon: Clock, color: 'yellow' };
    }
    return { type: 'unknown', icon: AlertCircle, color: 'red' };
  };

  const errorInfo = getErrorType(error);
  const IconComponent = errorInfo.icon;

  return (
    <div className={`fixed top-20 left-4 bg-white/95 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-${errorInfo.color}-200 z-50 max-w-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`bg-${errorInfo.color}-100 p-2 rounded-full`}>
          <IconComponent className={`w-4 h-4 text-${errorInfo.color}-600`} />
        </div>
        <div className="flex-1">
          <div className={`text-sm font-bold text-${errorInfo.color}-900 mb-1`}>
            Location Error
          </div>
          <div className={`text-xs text-${errorInfo.color}-700 mb-3`}>
            {error}
          </div>
          
          {errorInfo.type === 'permission' && (
            <div className="bg-blue-50 p-2 rounded-lg mb-3">
              <div className="text-xs text-blue-800">
                <strong>How to fix:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>Click the location icon in your browser</li>
                  <li>Select "Allow" for location access</li>
                  <li>Refresh the page if needed</li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className={`h-7 px-3 text-xs bg-${errorInfo.color}-50 border-${errorInfo.color}-200 text-${errorInfo.color}-700 hover:bg-${errorInfo.color}-100`}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-7 px-3 text-xs hover:bg-gray-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-6 w-6 p-0 hover:bg-red-100 flex-shrink-0"
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    </div>
  );
};

// Enhanced Location Tracking Hook
export const useLocationTracking = (
  mapInstance: React.RefObject<maplibregl.Map | null>,
  options: LocationTrackingOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State management
  const [state, setState] = useState<LocationTrackingState>({
    isTracking: false,
    currentLocation: null,
    error: null,
    marker: null,
    isPermissionGranted: false,
    trackingDuration: 0,
    totalDistance: 0,
    averageSpeed: 0,
    isLoading: false,
  });

  // Refs for tracking
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastLocationRef = useRef<RiderLocation | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackingStatsRef = useRef({
    totalDistance: 0,
    startTime: 0,
    positions: [] as RiderLocation[],
  });

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Create location marker element with enhanced bearing indicator
  const createLocationMarkerElement = useCallback((location: RiderLocation): HTMLDivElement => {
    const markerElement = document.createElement('div');
    markerElement.className = 'rider-location-marker';
    
    const accuracyRadius = Math.min((location.accuracy || 10) * 2, 200); // Cap at 200px
    const hasHeading = opts.showBearing && location.heading !== undefined && location.heading !== null;
    const heading = location.heading || 0;
    
    // Calculate compass direction
    const getCompassDirection = (degrees: number) => {
      const normalizedDegrees = ((degrees % 360) + 360) % 360;
      const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
      const index = Math.round(normalizedDegrees / 45) % 8;
      return directions[index];
    };

    const compassDir = hasHeading ? getCompassDirection(heading) : '';
    
    markerElement.innerHTML = `
      <div class="location-dot">
        <div class="location-pulse"></div>
        <div class="location-center">
          ${hasHeading ? `
            <div class="location-compass">${compassDir}</div>
          ` : ''}
        </div>
        ${hasHeading ? `
          <div class="location-bearing-container" style="transform: rotate(${heading}deg)">
            <div class="location-navigation-arrow">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L12 22M12 2L18 8M12 2L6 8" stroke="#EF4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="2" fill="#EF4444"/>
              </svg>
            </div>
            <div class="bearing-direction-indicator">
              <div class="direction-line"></div>
              <div class="direction-arrow-head"></div>
            </div>
          </div>
        ` : ''}
        ${hasHeading ? `
          <div class="bearing-info-display">
            <span class="bearing-degrees">${heading.toFixed(0)}°</span>
            <span class="bearing-compass">${compassDir}</span>
          </div>
        ` : ''}
      </div>
      ${opts.showAccuracyCircle ? `
        <div class="location-accuracy" style="width: ${accuracyRadius}px; height: ${accuracyRadius}px;"></div>
      ` : ''}
    `;

    return markerElement;
  }, [opts.showBearing, opts.showAccuracyCircle]);

  // Create popup content with enhanced bearing information
  const createPopupContent = useCallback((location: RiderLocation): string => {
    const formatTime = (timestamp?: number) => {
      if (!timestamp) return new Date().toLocaleTimeString();
      return new Date(timestamp).toLocaleTimeString();
    };

    const formatSpeed = (speed?: number) => {
      if (speed === undefined || speed === null) return 'Unknown';
      return `${(speed * 3.6).toFixed(1)} km/h`;
    };

    const getCompassDirection = (degrees?: number) => {
      if (degrees === undefined || degrees === null) return 'Unknown';
      const normalizedDegrees = ((degrees % 360) + 360) % 360;
      const directions = [
        { name: 'North', short: 'N', icon: '🧭' },
        { name: 'Northeast', short: 'NE', icon: '🔄' },
        { name: 'East', short: 'E', icon: '➡️' },
        { name: 'Southeast', short: 'SE', icon: '↘️' },
        { name: 'South', short: 'S', icon: '⬇️' },
        { name: 'Southwest', short: 'SW', icon: '↙️' },
        { name: 'West', short: 'W', icon: '⬅️' },
        { name: 'Northwest', short: 'NW', icon: '↖️' }
      ];
      const index = Math.round(normalizedDegrees / 45) % 8;
      return directions[index];
    };

    const getDirectionGuidance = (heading?: number) => {
      if (heading === undefined || heading === null) return '';
      
      const direction = getCompassDirection(heading);
      const guidance = {
        'N': 'Moving North - Straight ahead',
        'NE': 'Moving Northeast - Slight right turn',
        'E': 'Moving East - Turn right',
        'SE': 'Moving Southeast - Sharp right turn',
        'S': 'Moving South - Turn around',
        'SW': 'Moving Southwest - Sharp left turn',
        'W': 'Moving West - Turn left',
        'NW': 'Moving Northwest - Slight left turn'
      };
      
      return guidance[direction.short as keyof typeof guidance] || 'Direction unknown';
    };

    const direction = location.heading !== undefined ? getCompassDirection(location.heading) : null;
    const guidance = getDirectionGuidance(location.heading);

    return `
      <div class="p-4">
        <h3 class="font-bold text-blue-600 flex items-center gap-2 mb-3">
          <span class="animate-pulse">📍</span>
          My Current Location
          ${direction ? `<span class="text-lg">${direction.icon}</span>` : ''}
        </h3>
        
        <div class="space-y-3 text-sm">
          <div class="bg-blue-50 p-3 rounded-lg">
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div><strong>Latitude:</strong><br/>${location.lat.toFixed(6)}</div>
              <div><strong>Longitude:</strong><br/>${location.lng.toFixed(6)}</div>
            </div>
          </div>
          
          ${location.heading !== undefined ? `
            <div class="bg-gradient-to-r from-red-50 to-orange-50 p-3 rounded-lg border border-red-200">
              <div class="flex items-center gap-2 mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L12 22M12 2L18 8M12 2L6 8" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="2" fill="#EF4444"/>
                </svg>
                <strong class="text-red-800">Direction & Navigation</strong>
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between items-center">
                  <span>Heading:</span>
                  <span class="bg-red-100 px-2 py-1 rounded font-bold text-red-800">
                    ${location.heading.toFixed(0)}° ${direction ? direction.short : ''}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Direction:</span>
                  <span class="bg-orange-100 px-2 py-1 rounded font-medium text-orange-800">
                    ${direction ? direction.name : 'Unknown'}
                  </span>
                </div>
                <div class="bg-yellow-50 p-2 rounded border border-yellow-200">
                  <div class="text-yellow-800 font-medium text-center">
                    🧭 ${guidance}
                  </div>
                </div>
              </div>
            </div>
          ` : ''}
          
          <div class="grid grid-cols-2 gap-2 text-xs">
            ${location.accuracy !== undefined ? `
              <div class="bg-yellow-50 p-2 rounded text-center border border-yellow-200">
                <strong>Accuracy</strong><br/>
                <span class="text-lg text-yellow-800">±${location.accuracy.toFixed(0)}m</span>
              </div>
            ` : ''}
            
            <div class="bg-purple-50 p-2 rounded text-center border border-purple-200">
              <strong>Speed</strong><br/>
              <span class="text-lg text-purple-800">${formatSpeed(location.speed)}</span>
            </div>
          </div>
          
          <div class="bg-gray-50 p-2 rounded text-center border border-gray-200">
            <strong>Last Updated:</strong> ${formatTime(location.timestamp)}
          </div>
          
          ${location.altitude !== undefined ? `
            <div class="bg-indigo-50 p-2 rounded text-center border border-indigo-200">
              <strong>Altitude:</strong> <span class="text-indigo-800">${location.altitude.toFixed(1)}m</span>
            </div>
          ` : ''}
        </div>
        
        <div class="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-600">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <div class="font-bold text-green-600">${(state.totalDistance / 1000).toFixed(2)} km</div>
              <div>Distance</div>
            </div>
            <div>
              <div class="font-bold text-blue-600">${state.averageSpeed.toFixed(1)} km/h</div>
              <div>Avg Speed</div>
            </div>
            <div>
              <div class="font-bold text-purple-600">${Math.floor(state.trackingDuration / 60)}:${(state.trackingDuration % 60).toString().padStart(2, '0')}</div>
              <div>Duration</div>
            </div>
          </div>
        </div>
        
        ${location.heading !== undefined ? `
          <div class="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
            <div class="text-xs text-blue-800 text-center">
              <strong>Navigation Tip:</strong> The red arrow shows where you're facing. 
              Use this to orient yourself and navigate accurately.
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }, [state.totalDistance, state.averageSpeed, state.trackingDuration]);

  // Update location marker on map
  const updateLocationMarker = useCallback((location: RiderLocation) => {
    if (!mapInstance.current) return;

    // Remove existing marker
    if (state.marker) {
      state.marker.remove();
    }

    // Create new marker
    const markerElement = createLocationMarkerElement(location);
    const marker = new maplibregl.Marker({
      element: markerElement,
      anchor: 'center'
    })
      .setLngLat([location.lng, location.lat])
      .setPopup(new maplibregl.Popup({ 
        offset: 25,
        className: "location-popup",
        closeOnClick: false,
        closeButton: true,
        maxWidth: '320px',
      }).setHTML(createPopupContent(location)))
      .addTo(mapInstance.current);

    // Update state with new marker
    setState(prev => ({ ...prev, marker }));

    // Auto-center map if enabled
    if (opts.autoCenter) {
      mapInstance.current.flyTo({
        center: [location.lng, location.lat],
        zoom: Math.max(mapInstance.current.getZoom(), 16),
        duration: 1500,
        essential: true,
      });
    }
  }, [mapInstance, state.marker, createLocationMarkerElement, createPopupContent, opts.autoCenter]);

  // Center map on current location
  const centerOnLocation = useCallback(() => {
    if (!mapInstance.current || !state.currentLocation) return;
    
    mapInstance.current.flyTo({
      center: [state.currentLocation.lng, state.currentLocation.lat],
      zoom: Math.max(mapInstance.current.getZoom(), 16),
      duration: 1500,
      essential: true,
    });
  }, [mapInstance, state.currentLocation]);

  // Update tracking statistics
  const updateTrackingStats = useCallback((location: RiderLocation) => {
    if (!startTimeRef.current) return;

    // Calculate distance if we have a previous location
    let additionalDistance = 0;
    if (lastLocationRef.current) {
      additionalDistance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        location.lat,
        location.lng
      );
      
      // Only add distance if it's reasonable (less than 1km per update to filter out GPS jumps)
      if (additionalDistance < 1000) {
        trackingStatsRef.current.totalDistance += additionalDistance;
      }
    }

    // Add to positions array (keep last 100 for performance)
    trackingStatsRef.current.positions.push(location);
    if (trackingStatsRef.current.positions.length > 100) {
      trackingStatsRef.current.positions.shift();
    }

    lastLocationRef.current = location;
  }, [calculateDistance]);

  // Update duration and stats periodically
  useEffect(() => {
    if (state.isTracking && startTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const duration = Math.floor((now - startTimeRef.current!) / 1000);
        
        // Calculate average speed
        const averageSpeed = duration > 0 
          ? (trackingStatsRef.current.totalDistance / duration) * 3.6 // Convert to km/h
          : 0;

        setState(prev => ({
          ...prev,
          trackingDuration: duration,
          totalDistance: trackingStatsRef.current.totalDistance,
          averageSpeed,
        }));
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [state.isTracking]);

  // Handle successful location update
  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude, heading, accuracy, speed, altitude } = position.coords;
    const location: RiderLocation = {
      lat: latitude,
      lng: longitude,
      heading: heading || undefined,
      accuracy,
      speed: speed || undefined,
      altitude: altitude || undefined,
      timestamp: Date.now(),
    };

    setState(prev => ({
      ...prev,
      currentLocation: location,
      error: null,
      isLoading: false,
    }));

    updateLocationMarker(location);
    updateTrackingStats(location);

    console.log('Location updated:', location);
  }, [updateLocationMarker, updateTrackingStats]);

  // Handle location error
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error('Location error:', error);
    
    let errorMessage = 'Unknown location error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please check your GPS settings and try again.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please check your connection and try again.';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isPermissionGranted: error.code !== error.PERMISSION_DENIED,
      isLoading: false,
    }));
  }, []);

  // Check if geolocation is supported
  const checkGeolocationSupport = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser. Please use a modern browser with location support.',
        isLoading: false,
      }));
      return false;
    }
    return true;
  }, []);

  // Request permission explicitly
  const requestPermission = useCallback(async () => {
    if (!navigator.permissions) return true;

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      
      setState(prev => ({
        ...prev,
        isPermissionGranted: result.state === 'granted',
      }));

      return result.state !== 'denied';
    } catch (error) {
      console.warn('Could not check geolocation permission:', error);
      return true;
    }
  }, []);

  // Start location tracking
  const startTracking = useCallback(async () => {
    if (!checkGeolocationSupport()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Check permissions first
    const permissionOk = await requestPermission();
    if (!permissionOk) {
      setState(prev => ({
        ...prev,
        error: 'Location permission is required for tracking.',
        isLoading: false,
      }));
      return;
    }

    const positionOptions: PositionOptions = {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: opts.maximumAge,
    };

    // Reset tracking stats
    startTimeRef.current = Date.now();
    trackingStatsRef.current = {
      totalDistance: 0,
      startTime: Date.now(),
      positions: [],
    };
    lastLocationRef.current = null;

    setState(prev => ({
      ...prev,
      isTracking: true,
      trackingDuration: 0,
      totalDistance: 0,
      averageSpeed: 0,
    }));

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      positionOptions
    );

    // Start continuous tracking
    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      positionOptions
    );

    watchIdRef.current = watchId;
    console.log('Location tracking started with watch ID:', watchId);
  }, [opts, handleLocationSuccess, handleLocationError, checkGeolocationSupport, requestPermission]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      console.log('Location tracking stopped');
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Remove location marker
    if (state.marker) {
      state.marker.remove();
    }

    // Reset refs
    startTimeRef.current = null;
    lastLocationRef.current = null;

    setState(prev => ({
      ...prev,
      isTracking: false,
      marker: null,
      error: null,
      isLoading: false,
    }));
  }, [state.marker]);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (state.isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Get tracking summary
  const getTrackingSummary = useCallback(() => {
    return {
      isActive: state.isTracking,
      duration: state.trackingDuration,
      distance: state.totalDistance,
      averageSpeed: state.averageSpeed,
      currentLocation: state.currentLocation,
      positionCount: trackingStatsRef.current.positions.length,
      hasError: !!state.error,
    };
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (state.marker) {
        state.marker.remove();
      }
    };
  }, [state.marker]);

  return {
    // State
    isTracking: state.isTracking,
    isLoading: state.isLoading,
    currentLocation: state.currentLocation,
    error: state.error,
    isPermissionGranted: state.isPermissionGranted,
    trackingDuration: state.trackingDuration,
    totalDistance: state.totalDistance,
    averageSpeed: state.averageSpeed,
    
    // Actions
    startTracking,
    stopTracking,
    toggleTracking,
    clearError,
    centerOnLocation,
    
    // Utils
    getTrackingSummary,
  };
};

// Enhanced location tracking styles with improved bearing indicators
export const locationTrackingStyles = `
  .rider-location-marker {
    position: relative;
    width: 60px;
    height: 60px;
    pointer-events: auto;
    cursor: pointer;
    z-index: 1000;
  }
  
  .location-dot {
    position: relative;
    width: 40px;
    height: 40px;
    margin: 10px;
    z-index: 3;
  }
  
  .location-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 50px;
    height: 50px;
    background: rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: locationPulse 2s infinite;
    z-index: 1;
  }
  
  .location-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    border: 4px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4);
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .location-compass {
    color: white;
    font-size: 8px;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    z-index: 6;
  }
  
  .location-bearing-container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 60px;
    height: 60px;
    transform-origin: center;
    pointer-events: none;
    z-index: 4;
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .location-navigation-arrow {
    position: absolute;
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 6;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    animation: arrowPulse 1.5s infinite;
  }
  
  .location-navigation-arrow svg {
    width: 24px;
    height: 24px;
  }
  
  .bearing-direction-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
  }
  
  .direction-line {
    width: 2px;
    height: 30px;
    background: linear-gradient(to top, transparent, #EF4444, #DC2626);
    margin: 0 auto;
    border-radius: 1px;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.6);
  }
  
  .direction-arrow-head {
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 12px solid #EF4444;
    margin: -2px auto 0;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
    position: relative;
  }
  
  .direction-arrow-head::after {
    content: '';
    position: absolute;
    top: 12px;
    left: -3px;
    width: 6px;
    height: 8px;
    background: #EF4444;
    border-radius: 0 0 3px 3px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }
  
  .bearing-info-display {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    white-space: nowrap;
    z-index: 7;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    animation: infoFadeIn 0.5s ease-out;
  }
  
  .bearing-degrees {
    display: block;
    color: #60A5FA;
    font-size: 11px;
  }
  
  .bearing-compass {
    display: block;
    color: #34D399;
    font-size: 9px;
    margin-top: 1px;
  }
  
  .location-accuracy {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 2px solid rgba(59, 130, 246, 0.4);
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.1);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 0;
    animation: accuracyPulse 3s infinite;
  }
  
  @keyframes locationPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    70% {
      transform: translate(-50%, -50%) scale(1.8);
      opacity: 0.3;
    }
    100% {
      transform: translate(-50%, -50%) scale(2.2);
      opacity: 0;
    }
  }
  
  @keyframes arrowPulse {
    0%, 100% {
      transform: translateX(-50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateX(-50%) scale(1.1);
      opacity: 0.8;
    }
  }
  
  @keyframes accuracyPulse {
    0%, 100% {
      opacity: 0.3;
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      opacity: 0.6;
      transform: translate(-50%, -50%) scale(1.05);
    }
  }
  
  @keyframes infoFadeIn {
    0% {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  .location-popup .maplibregl-popup-content {
    border-radius: 16px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    background: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(20px) !important;
    padding: 0 !important;
    max-width: 320px !important;
  }
  
  .location-popup .maplibregl-popup-close-button {
    color: #6b7280 !important;
    font-size: 20px !important;
    font-weight: bold !important;
    padding: 12px !important;
    right: 8px !important;
    top: 8px !important;
    border-radius: 50% !important;
    width: 32px !important;
    height: 32px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
  }
  
  .location-popup .maplibregl-popup-close-button:hover {
    color: #374151 !important;
    background-color: rgba(243, 244, 246, 0.9) !important;
    transform: scale(1.1) !important;
  }
  
  .location-popup .maplibregl-popup-tip {
    border-top-color: rgba(255, 255, 255, 0.98) !important;
    border-bottom-color: rgba(255, 255, 255, 0.98) !important;
  }
  
  /* Mobile responsive adjustments */
  @media (max-width: 768px) {
    .rider-location-marker {
      width: 50px;
      height: 50px;
    }
    
    .location-dot {
      width: 30px;
      height: 30px;
      margin: 10px;
    }
    
    .location-center {
      width: 16px;
      height: 16px;
      border: 3px solid white;
    }
    
    .location-compass {
      font-size: 7px;
    }
    
    .location-pulse {
      width: 40px;
      height: 40px;
    }
    
    .location-bearing-container {
      width: 50px;
      height: 50px;
    }
    
    .location-navigation-arrow svg {
      width: 20px;
      height: 20px;
    }
    
    .bearing-info-display {
      top: -30px;
      padding: 3px 6px;
      font-size: 9px;
    }
    
    .bearing-degrees {
      font-size: 10px;
    }
    
    .bearing-compass {
      font-size: 8px;
    }
    
    .location-popup .maplibregl-popup-content {
      max-width: 280px !important;
    }
  }
  
  /* Enhanced direction indicators for better visibility */
  .direction-indicator-n { color: #EF4444; }
  .direction-indicator-ne { color: #F97316; }
  .direction-indicator-e { color: #EAB308; }
  .direction-indicator-se { color: #84CC16; }
  .direction-indicator-s { color: #22C55E; }
  .direction-indicator-sw { color: #06B6D4; }
  .direction-indicator-w { color: #3B82F6; }
  .direction-indicator-nw { color: #8B5CF6; }
`;

// Export all components and hooks
export default {
  LocationTrackingButton,
  LocationStatusCard,
  LocationErrorCard,
  useLocationTracking,
  locationTrackingStyles,
};