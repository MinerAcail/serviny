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
  MapPin,
  Eye, 
  EyeOff
} from "lucide-react";
import maplibregl from 'maplibre-gl';
import { gql, useMutation } from '@apollo/client';
import { GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA } from './LiveMap';

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
  enableServerSync?: boolean; // NEW: Option to enable/disable server sync
  refetchOnLocationUpdate?: boolean; // NEW: Option to refetch queries on location update
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

// Default options with real-time settings
const DEFAULT_OPTIONS: LocationTrackingOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 500, // Fresh data for real-time tracking
  updateInterval: 1000, // Update every second
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
          <h3 className="text-sm font-bold text-gray-900">Live Trackinddg</h3>
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
// Fixed Movement Status Card Component
// Add this to your LocationTrackingManagement.tsx file

// Enhanced MovementStatusCard with better direction visualization
// Replace your existing MovementStatusCard with this enhanced version:

// Enhanced MovementStatusCard with toggle button control


interface MovementStatusCardProps {
  isMoving: boolean;
  speed: number;
  bearingChange: number;
  currentLocation: RiderLocation;
  onClose: () => void;
  className?: string;
}

export const MovementStatusCard: React.FC<MovementStatusCardProps> = ({
  isMoving,
  speed,
  bearingChange,
  currentLocation,
  onClose,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getSpeedColor = (speed: number) => {
    if (speed < 5) return "text-yellow-600";
    if (speed < 20) return "text-green-600";
    if (speed < 50) return "text-blue-600";
    return "text-red-600";
  };

  const getSpeedIcon = (speed: number) => {
    if (speed < 5) return "🚶"; // Walking
    if (speed < 20) return "🚴"; // Cycling
    if (speed < 50) return "🛵"; // Motorcycle
    return "🚗"; // Car
  };

  const getDirectionData = (heading?: number) => {
    if (heading === undefined || heading === null) return null;
    
    const normalizedDegrees = ((heading % 360) + 360) % 360;
    const directions = [
      { name: 'North', short: 'N', icon: '🧭', emoji: '⬆️', color: '#EF4444', description: 'Heading North' },
      { name: 'Northeast', short: 'NE', icon: '📍', emoji: '↗️', color: '#F97316', description: 'Heading Northeast' },
      { name: 'East', short: 'E', icon: '📍', emoji: '➡️', color: '#EAB308', description: 'Heading East' },
      { name: 'Southeast', short: 'SE', icon: '📍', emoji: '↘️', color: '#22C55E', description: 'Heading Southeast' },
      { name: 'South', short: 'S', icon: '📍', emoji: '⬇️', color: '#06B6D4', description: 'Heading South' },
      { name: 'Southwest', short: 'SW', icon: '📍', emoji: '↙️', color: '#3B82F6', description: 'Heading Southwest' },
      { name: 'West', short: 'W', icon: '📍', emoji: '⬅️', color: '#8B5CF6', description: 'Heading West' },
      { name: 'Northwest', short: 'NW', icon: '📍', emoji: '↖️', color: '#EC4899', description: 'Heading Northwest' }
    ];
    const index = Math.round(normalizedDegrees / 45) % 8;
    return directions[index];
  };

  const getTurnDescription = (change: number) => {
    if (change < 5) return { text: "Going Straight", icon: "⬆️", color: "#22C55E" };
    if (change < 15) return { text: "Slight Turn", icon: "↗️", color: "#EAB308" };
    if (change < 45) return { text: "Moderate Turn", icon: "↗️", color: "#F97316" };
    if (change < 90) return { text: "Sharp Turn", icon: "➡️", color: "#EF4444" };
    if (change < 135) return { text: "U-Turn", icon: "🔄", color: "#DC2626" };
    return { text: "Complete Turn", icon: "🔄", color: "#991B1B" };
  };

  const currentDirection = getDirectionData(currentLocation.heading);
  const turnInfo = getTurnDescription(bearingChange);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${
          isMoving 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-pulse' 
            : 'bg-white/90 text-gray-600 hover:bg-white'
        } backdrop-blur-sm border border-white/20`}
        title={isVisible ? 'Hide Movement Status' : 'Show Movement Status'}
      >
        <div className="flex items-center gap-2">
          {isVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          {isMoving && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">{speed.toFixed(0)}</span>
            </div>
          )}
        </div>
      </button>

      {/* Movement Status Card */}
      {isVisible && (
        <div className={`fixed top-20 right-4 bg-gradient-to-r from-green-500/95 to-emerald-600/95 backdrop-blur-lg rounded-xl shadow-xl p-4 border border-white/20 z-40 max-w-sm text-white transform transition-all duration-300 ${className}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full shadow-lg ${isMoving ? 'bg-white animate-pulse' : 'bg-gray-300'}`}></div>
              <h3 className="text-sm font-bold">
                {isMoving ? '🏃 Movement Detected' : '⏸️ Stationary'}
              </h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Speed Display */}
            <div className="bg-white/20 rounded-lg p-3 border border-white/30">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getSpeedIcon(speed)}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">Current Speed</div>
                  <div className={`text-lg font-bold ${getSpeedColor(speed)} bg-white/90 px-2 py-1 rounded text-center`}>
                    {speed.toFixed(1)} km/h
                  </div>
                </div>
              </div>
            </div>

            {/* Current Direction with Visual Compass */}
            {currentDirection && currentLocation.heading !== undefined && (
              <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {/* Compass background */}
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center border-2 border-white/50">
                      <Navigation 
                        className="w-6 h-6 text-white transition-transform duration-300" 
                        style={{ 
                          transform: `rotate(${currentLocation.heading}deg)`,
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                        }} 
                      />
                    </div>
                    {/* Direction indicator */}
                    <div 
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: currentDirection.color }}
                    >
                      <span className="text-white font-bold">{currentDirection.short}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Current Direction</div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currentDirection.emoji}</span>
                      <div>
                        <div className="text-lg font-bold" style={{ color: currentDirection.color }}>
                          {currentDirection.name}
                        </div>
                        <div className="text-sm opacity-90">
                          {currentLocation.heading.toFixed(0)}°
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Turn Information */}
            {bearingChange > 3 && (
              <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-white/50"
                    style={{ backgroundColor: turnInfo.color }}
                  >
                    {turnInfo.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Turn Detection</div>
                    <div className="text-lg font-bold" style={{ color: turnInfo.color }}>
                      {turnInfo.text}
                    </div>
                    <div className="text-sm opacity-90">
                      {bearingChange.toFixed(0)}° change
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Movement Statistics */}
            <div className="bg-white/20 rounded-lg p-2 border border-white/30">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>GPS Accuracy:</span>
                  <span className="font-medium">±{currentLocation.accuracy?.toFixed(0) || "Unknown"}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Update:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
                {currentLocation.altitude && (
                  <div className="flex justify-between">
                    <span>Altitude:</span>
                    <span className="font-medium">{currentLocation.altitude.toFixed(0)}m</span>
                  </div>
                )}
              </div>
            </div>

            {/* Real-time Compass Display */}
            {currentLocation.heading !== undefined && (
              <div className="bg-white/20 rounded-lg p-3 border border-white/30">
                <div className="text-center">
                  <div className="text-sm font-medium mb-2">Live Compass</div>
                  <div className="relative w-16 h-16 mx-auto">
                    {/* Compass ring */}
                    <div className="w-16 h-16 border-4 border-white/50 rounded-full relative">
                      {/* Cardinal directions */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-red-400">N</div>
                      <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">E</div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-bold">S</div>
                      <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 text-xs font-bold">W</div>
                      
                      {/* Compass needle */}
                      <div className="absolute inset-2 flex items-center justify-center">
                        <div 
                          className="w-1 h-6 bg-gradient-to-t from-blue-400 to-red-500 rounded-full transition-transform duration-300"
                          style={{ transform: `rotate(${currentLocation.heading}deg)` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold mt-2" style={{ color: currentDirection?.color }}>
                    {currentLocation.heading.toFixed(0)}°
                  </div>
                </div>
              </div>
            )}

            {/* Status notice */}
            <div className="text-xs text-white/70 text-center border-t border-white/20 pt-2">
              Click the eye button to hide this panel
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// GraphQL Mutations
const UPDATE_RIDER_LOCATION = gql`
  mutation UpdateRiderLocation($coordinates: [Float!]!) {
    updateRiderLocation(coordinates: $coordinates) {
      id
      coordinates
      state
       lastSeen :updatedAt
    }
  }
`;

const UPDATE_RIDER_ONLINE_STATUS = gql`
          mutation UpdateRiderOnlineStatus($status: RiderStatus!) {
    updateRiderOnlineStatus(status: $status) {
      id
      state
      lastSeen :updatedAt

    }
  }
`;


export const useLocationTrackingNew = (
  mapInstance: React.RefObject<maplibregl.Map | null>,
  options: LocationTrackingOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
// Apollo mutations with refetchQueries
  const [updateLocationMutation] = useMutation(UPDATE_RIDER_LOCATION, {
    // Optionally refetch on location updates too
    refetchQueries: opts.refetchOnLocationUpdate ? [
      { query: GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA }
    ] : []
  });
  
  const [updateStatusMutation] = useMutation(UPDATE_RIDER_ONLINE_STATUS, {
    // Always refetch when status changes
    refetchQueries: [
      { query: GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA }
    ],
    awaitRefetchQueries: false // Don't wait for refetch to complete
  });
  
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

  // Movement detection state
  const [movementState, setMovementState] = useState({
    isMoving: false,
    lastMoveTime: Date.now(),
    speed: 0,
    bearingChange: 0,
  });

  // Server sync state
  const [serverSyncState, setServerSyncState] = useState({
    isOnline: false,
    lastSyncTime: null as number | null,
    syncError: null as string | null,
  });

  // Refs for tracking
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastLocationRef = useRef<RiderLocation | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const trackingStatsRef = useRef({
    totalDistance: 0,
    startTime: 0,
    positions: [] as RiderLocation[],
  });

  // Movement detection refs
  const lastBearingRef = useRef<number | null>(null);
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Movement counting and sync refs
  const movementCountRef = useRef<number>(0);
  const isFirstLocationUpdateRef = useRef<boolean>(true);
  const lastSyncedLocationRef = useRef<{ lat: number; lng: number } | null>(null);

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

  // Calculate bearing difference
  const calculateBearingDifference = useCallback((bearing1: number, bearing2: number): number => {
    let diff = Math.abs(bearing1 - bearing2);
    if (diff > 180) {
      diff = 360 - diff;
    }
    return diff;
  }, []);

  // NEW: Server sync functions
  const updateServerLocation = useCallback(async (coordinates: [number, number]) => {
    if (!opts.enableServerSync) return;

    try {
      console.log('📡 Updating rider location via Apollo:', coordinates);
      
      const { data } = await updateLocationMutation({
        variables: { coordinates },
        errorPolicy: 'all'
      });

      setServerSyncState(prev => ({
        ...prev,
        lastSyncTime: Date.now(),
        syncError: null,
      }));

      console.log('✅ Location updated successfully:', data?.updateRiderLocation);
      return data?.updateRiderLocation;
    } catch (error) {
      console.error('❌ Failed to update location:', error);
      setServerSyncState(prev => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Unknown sync error',
      }));
      throw error;
    }
  }, [updateLocationMutation, opts.enableServerSync]);

  const updateServerStatus = useCallback(async (status: 'ONLINE' | 'OFFLINE') => {
    if (!opts.enableServerSync) return;

    try {
      console.log('🟢 Updating rider status via Apollo:', status);
      
      const { data } = await updateStatusMutation({
        variables: { status },
        errorPolicy: 'all'
      });

      console.log('✅ Status updated successfully:', data?.updateRiderOnlineStatus);
      return data?.updateRiderOnlineStatus;
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      setServerSyncState(prev => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Unknown status error',
      }));
      throw error;
    }
  }, [updateStatusMutation, opts.enableServerSync]);

  // NEW: Handle server sync based on movement count
  const handleServerSync = useCallback(async (location: RiderLocation, isMoving: boolean) => {
    if (!opts.enableServerSync) return;

    const coordinates: [number, number] = [location.lng, location.lat];

    // First location update: send both location and status
    if (isFirstLocationUpdateRef.current) {
      console.log('🚀 First location update - sending location AND status');
      
      try {
        // Update location first
        await updateServerLocation(coordinates);
        
        // Update status to ONLINE
        await updateServerStatus('ONLINE');
        setServerSyncState(prev => ({ ...prev, isOnline: true }));
        
        lastSyncedLocationRef.current = { lat: location.lat, lng: location.lng };
        isFirstLocationUpdateRef.current = false;
        
        console.log('✅ First sync completed - location and status updated');
      } catch (error) {
        console.error('❌ Failed first sync:', error);
      }
      return;
    }

    // For subsequent updates: only sync location every 10 movements
    if (isMoving) {
      movementCountRef.current += 1;
      console.log(`🏃 Movement count: ${movementCountRef.current}/10`);

      if (movementCountRef.current >= 10) {
        console.log('📡 10 movements reached - updating location');
        
        try {
          await updateServerLocation(coordinates);
          lastSyncedLocationRef.current = { lat: location.lat, lng: location.lng };
          movementCountRef.current = 0; // Reset counter
          
          console.log('✅ Location sync completed after 10 movements');
        } catch (error) {
          console.error('❌ Failed movement-based sync:', error);
        }
      }
    }
  }, [opts.enableServerSync, updateServerLocation, updateServerStatus]);

  // NEW: Stop server sync
  const stopServerSync = useCallback(async () => {
    if (!opts.enableServerSync) return;

    console.log('🛑 Stopping server sync');

    // Set offline status
    try {
      await updateServerStatus('OFFLINE');
    } catch (error) {
      console.error('Failed to set offline status:', error);
    }

    setServerSyncState(prev => ({
      ...prev,
      isOnline: false,
      lastSyncTime: null,
    }));

    // Reset sync refs
    lastSyncedLocationRef.current = null;
    movementCountRef.current = 0;
    isFirstLocationUpdateRef.current = true;
  }, [opts.enableServerSync, updateServerStatus]);

  // Detect movement based on location changes
  const detectMovement = useCallback((newLocation: RiderLocation) => {
    const now = Date.now();
    let isMoving = false;
    let bearingChange = 0;
    let speed = newLocation.speed || 0;

    if (lastLocationRef.current) {
      const distance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        newLocation.lat,
        newLocation.lng
      );

      const timeDiff = (now - (lastLocationRef.current.timestamp || now)) / 1000;

      if (!newLocation.speed && timeDiff > 0) {
        speed = distance / timeDiff;
      }

      if (distance > 2) {
        isMoving = true;
      }

      if (lastBearingRef.current !== null && newLocation.heading !== undefined) {
        bearingChange = calculateBearingDifference(lastBearingRef.current, newLocation.heading);
        if (bearingChange > 5) {
          isMoving = true;
        }
      }

      if (speed > 0.5) {
        isMoving = true;
      }
    }

    setMovementState(prev => ({
      isMoving,
      lastMoveTime: isMoving ? now : prev.lastMoveTime,
      speed: speed * 3.6,
      bearingChange,
    }));

    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }

    if (isMoving) {
      movementTimeoutRef.current = setTimeout(() => {
        setMovementState(prev => ({ ...prev, isMoving: false }));
      }, 10000);
    }

    if (newLocation.heading !== undefined) {
      lastBearingRef.current = newLocation.heading;
    }

    console.log(`🏃 Movement detected: ${isMoving}, Speed: ${(speed * 3.6).toFixed(1)} km/h`);
    
    // NEW: Handle server sync based on movement
    handleServerSync(newLocation, isMoving);
    
    return isMoving;
  }, [calculateDistance, calculateBearingDifference, handleServerSync]);

  // Create location marker element with Navigation icon
  const createLocationMarkerElement = useCallback((location: RiderLocation): HTMLDivElement => {
    const markerElement = document.createElement('div');
    markerElement.className = 'rider-location-marker';
    
    const accuracyRadius = Math.min((location.accuracy || 10) * 2, 200);
    const hasHeading = opts.showBearing && location.heading !== undefined && location.heading !== null;
    const heading = location.heading || 0;
    
    const getCompassDirection = (degrees: number) => {
      const normalizedDegrees = ((degrees % 360) + 360) % 360;
      const directions = [
        { name: 'North', short: 'N', icon: '🧭', color: '#EF4444' },
        { name: 'Northeast', short: 'NE', icon: '↗️', color: '#F97316' },
        { name: 'East', short: 'E', icon: '➡️', color: '#EAB308' },
        { name: 'Southeast', short: 'SE', icon: '↘️', color: '#22C55E' },
        { name: 'South', short: 'S', icon: '⬇️', color: '#06B6D4' },
        { name: 'Southwest', short: 'SW', icon: '↙️', color: '#3B82F6' },
        { name: 'West', short: 'W', icon: '⬅️', color: '#8B5CF6' },
        { name: 'Northwest', short: 'NW', icon: '↖️', color: '#EC4899' }
      ];
      const index = Math.round(normalizedDegrees / 45) % 8;
      return directions[index];
    };

    const compassDir = hasHeading ? getCompassDirection(heading) : null;
    
    const compassNeedleSVG = `
      <svg class="compass-needle" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="13" y1="3" x2="13" y2="23" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <path d="M13 3 L17 9 L13 7 L9 9 Z" fill="#EF4444" stroke="white" stroke-width="1"/>
        <path d="M13 23 L17 17 L13 19 L9 17 Z" fill="#3B82F6" stroke="white" stroke-width="1"/>
        <circle cx="13" cy="13" r="2" fill="white" stroke="#1E40AF" stroke-width="1.5"/>
      </svg>
    `;
    
    markerElement.innerHTML = `
      <div class="location-dot" data-heading="${heading}">
        ${opts.showAccuracyCircle ? `
          <div class="location-accuracy-circle" style="width: ${accuracyRadius}px; height: ${accuracyRadius}px;"></div>
        ` : ''}
        <div class="location-pulse"></div>
        <div class="location-center ${hasHeading ? 'has-bearing' : ''}">
          <div class="bearing-container" style="transform: rotate(${hasHeading ? heading : 0}deg)">
            ${compassNeedleSVG}
          </div>
        </div>
        ${hasHeading && compassDir ? `
          <div class="bearing-info-display">
            <span class="bearing-degrees">${heading.toFixed(0)}°</span>
            <span class="bearing-compass" style="color: ${compassDir.color}">${compassDir.icon} ${compassDir.short}</span>
          </div>
        ` : ''}
      </div>
    `;

    return markerElement;
  }, [opts.showBearing, opts.showAccuracyCircle]);

  // Create popup content
  const createPopupContent = useCallback((location: RiderLocation): string => {
    return `
      <div class="p-4">
        <h3 class="font-bold text-blue-600 mb-3">📍 My Location</h3>
        <div class="text-sm space-y-2">
          <p><strong>Lat:</strong> ${location.lat.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${location.lng.toFixed(6)}</p>
          <p><strong>Accuracy:</strong> ±${location.accuracy?.toFixed(0) || "Unknown"}m</p>
          ${location.heading !== undefined ? `<p><strong>Heading:</strong> ${location.heading.toFixed(0)}°</p>` : ''}
          ${location.speed !== undefined ? `<p><strong>Speed:</strong> ${(location.speed * 3.6).toFixed(1)} km/h</p>` : ''}
          <p><strong>Last Update:</strong> ${new Date().toLocaleTimeString()}</p>
          ${opts.enableServerSync ? `
            <p><strong>Server Sync:</strong> ${serverSyncState.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
            <p><strong>Movement Count:</strong> ${movementCountRef.current}/10</p>
          ` : ''}
        </div>
      </div>
    `;
  }, [opts.enableServerSync, serverSyncState.isOnline]);

  // Update location marker with smooth animations
  const updateLocationMarker = useCallback((location: RiderLocation) => {
    if (!mapInstance.current) {
      console.log('❌ No map instance available');
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
      
      const markerElement = markerRef.current.getElement();
      if (markerElement) {
        const bearingContainer = markerElement.querySelector('.bearing-container') as HTMLElement;
        
        if (bearingContainer && location.heading !== undefined) {
          bearingContainer.style.transform = `rotate(${location.heading}deg)`;
        }
      }
      
      const popup = markerRef.current.getPopup();
      if (popup) {
        popup.setHTML(createPopupContent(location));
      }
    } else {
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

      markerRef.current = marker;
    }

    if (opts.autoCenter) {
      mapInstance.current.flyTo({
        center: [location.lng, location.lat],
        zoom: Math.max(mapInstance.current.getZoom(), 16),
        duration: 800,
        essential: true,
      });
    }
  }, [mapInstance, createLocationMarkerElement, createPopupContent, opts.autoCenter]);

  // Update tracking statistics
  const updateTrackingStats = useCallback((location: RiderLocation) => {
    if (!startTimeRef.current) return;

    let additionalDistance = 0;
    if (lastLocationRef.current) {
      additionalDistance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        location.lat,
        location.lng
      );
      
      if (additionalDistance < 1000) {
        trackingStatsRef.current.totalDistance += additionalDistance;
      }
    }

    trackingStatsRef.current.positions.push(location);
    if (trackingStatsRef.current.positions.length > 100) {
      trackingStatsRef.current.positions.shift();
    }

    lastLocationRef.current = location;
  }, [calculateDistance]);

  // Handle location updates with movement detection and server sync
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

    console.log('📡 Location update received:', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      heading: location.heading?.toFixed(0),
      speed: location.speed ? (location.speed * 3.6).toFixed(1) + ' km/h' : 'unknown',
      accuracy: location.accuracy?.toFixed(0) + 'm'
    });

    detectMovement(location);

    setState(prev => ({
      ...prev,
      currentLocation: location,
      error: null,
      isLoading: false,
    }));

    updateLocationMarker(location);
    updateTrackingStats(location);
  }, [updateLocationMarker, updateTrackingStats, detectMovement]);

  // Handle location error
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error('📍 Location error:', error);
    
    let errorMessage = 'Unknown location error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isPermissionGranted: error.code !== error.PERMISSION_DENIED,
      isLoading: false,
    }));
  }, []);

  // Check geolocation support
  const checkGeolocationSupport = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        isLoading: false,
      }));
      return false;
    }
    return true;
  }, []);

  // Request permission
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

  // Start tracking with server sync
  const startTracking = useCallback(async () => {
    console.log('🚀 STARTING location tracking with movement-based server sync');
    
    // Clean up existing markers
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (!checkGeolocationSupport()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

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
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    // Reset tracking stats and sync counters
    startTimeRef.current = Date.now();
    trackingStatsRef.current = {
      totalDistance: 0,
      startTime: Date.now(),
      positions: [],
    };
    lastLocationRef.current = null;
    lastBearingRef.current = null;
    
    // Reset sync refs
    movementCountRef.current = 0;
    isFirstLocationUpdateRef.current = true;
    lastSyncedLocationRef.current = null;

    setState(prev => ({
      ...prev,
      isTracking: true,
      trackingDuration: 0,
      totalDistance: 0,
      averageSpeed: 0,
    }));

    setMovementState({
      isMoving: false,
      lastMoveTime: Date.now(),
      speed: 0,
      bearingChange: 0,
    });

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
      {
        ...positionOptions,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = watchId;
    console.log('🚀 Location tracking started with movement-based server sync');
  }, [handleLocationSuccess, handleLocationError, checkGeolocationSupport, requestPermission]);

  // Stop tracking with complete cleanup
  const stopTracking = useCallback(async () => {
    console.log('🛑 STOPPING location tracking');
    
    // Stop geolocation watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Stop intervals
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }

    // Stop server sync
    await stopServerSync();

    // Remove marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Reset refs
    startTimeRef.current = null;
    lastLocationRef.current = null;
    lastBearingRef.current = null;

    // Reset state
    setState(prev => ({
      ...prev,
      isTracking: false,
      marker: null,
      error: null,
      isLoading: false,
      currentLocation: null,
    }));

    setMovementState({
      isMoving: false,
      lastMoveTime: Date.now(),
      speed: 0,
      bearingChange: 0,
    });
    
    console.log('🛑 Location tracking completely stopped');
  }, [stopServerSync]);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (state.isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

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

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    setServerSyncState(prev => ({ ...prev, syncError: null }));
  }, []);

  // Force location update to server
  const forceServerUpdate = useCallback(async () => {
    if (state.currentLocation && opts.enableServerSync) {
      try {
        await updateServerLocation([state.currentLocation.lng, state.currentLocation.lat]);
        lastSyncedLocationRef.current = { 
          lat: state.currentLocation.lat, 
          lng: state.currentLocation.lng 
        };
        // Reset movement counter after manual update
        movementCountRef.current = 0;
      } catch (error) {
        console.error('Failed to force server update:', error);
      }
    }
  }, [state.currentLocation, updateServerLocation, opts.enableServerSync]);

  // Duration and stats update
  useEffect(() => {
    if (state.isTracking && startTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const duration = Math.floor((now - startTimeRef.current!) / 1000);
        
        const averageSpeed = duration > 0 
          ? (trackingStatsRef.current.totalDistance / duration) * 3.6
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 useLocationTracking cleanup on unmount');
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return {
    // Location state
    isTracking: state.isTracking,
    isLoading: state.isLoading,
    currentLocation: state.currentLocation,
    error: state.error,
    isPermissionGranted: state.isPermissionGranted,
    trackingDuration: state.trackingDuration,
    totalDistance: state.totalDistance,
    averageSpeed: state.averageSpeed,

    // Movement state
    isMoving: movementState.isMoving,
    movementSpeed: movementState.speed,
    bearingChange: movementState.bearingChange,
    lastMoveTime: movementState.lastMoveTime,

    // Server sync state
    isOnline: serverSyncState.isOnline,
    lastSyncTime: serverSyncState.lastSyncTime,
    syncError: serverSyncState.syncError,
    movementCount: movementCountRef.current, // NEW: Expose movement count

    // Actions
    startTracking,
    stopTracking,
    toggleTracking,
    clearError,
    centerOnLocation,
    forceServerUpdate,

  }
}

// GraphQL Mutations
const UPDATE_RIDER_LOCATION_BY_SERVICE = gql`
  mutation UpdateRiderLocationByService($coordinates: [Float!]!) {
    updateRiderLocationByService(coordinates: $coordinates) {
      id
      coordinates
      state
       lastSeen :updatedAt
    }
  }
`;

const UPDATE_RIDER_ONLINE_STATUS_BY_SERVICE = gql`
          mutation UpdateRiderOnlineStatusByService($status: RiderStatus!) {
    updateRiderOnlineStatusByService(status: $status) {
      id
      state
      lastSeen :updatedAt

    }
  }
`;
export const useLocationTrackingServiceRider = (
  mapInstance: React.RefObject<maplibregl.Map | null>,
  options: LocationTrackingOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
// Apollo mutations with refetchQueries
  const [updateLocationMutation] = useMutation(UPDATE_RIDER_LOCATION_BY_SERVICE, {
    // Optionally refetch on location updates too
    refetchQueries: opts.refetchOnLocationUpdate ? [
      { query: GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA }
    ] : []
  });
  
  const [updateStatusMutation] = useMutation(UPDATE_RIDER_ONLINE_STATUS_BY_SERVICE, {
    // Always refetch when status changes
    refetchQueries: [
      { query: GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA }
    ],
    awaitRefetchQueries: false // Don't wait for refetch to complete
  });
  
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

  // Movement detection state
  const [movementState, setMovementState] = useState({
    isMoving: false,
    lastMoveTime: Date.now(),
    speed: 0,
    bearingChange: 0,
  });

  // Server sync state
  const [serverSyncState, setServerSyncState] = useState({
    isOnline: false,
    lastSyncTime: null as number | null,
    syncError: null as string | null,
  });

  // Refs for tracking
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastLocationRef = useRef<RiderLocation | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const trackingStatsRef = useRef({
    totalDistance: 0,
    startTime: 0,
    positions: [] as RiderLocation[],
  });

  // Movement detection refs
  const lastBearingRef = useRef<number | null>(null);
  const movementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Movement counting and sync refs
  const movementCountRef = useRef<number>(0);
  const isFirstLocationUpdateRef = useRef<boolean>(true);
  const lastSyncedLocationRef = useRef<{ lat: number; lng: number } | null>(null);

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

  // Calculate bearing difference
  const calculateBearingDifference = useCallback((bearing1: number, bearing2: number): number => {
    let diff = Math.abs(bearing1 - bearing2);
    if (diff > 180) {
      diff = 360 - diff;
    }
    return diff;
  }, []);

  // NEW: Server sync functions
  const updateServerLocation = useCallback(async (coordinates: [number, number]) => {
    if (!opts.enableServerSync) return;

    try {
      console.log('📡 Updating rider location via Apollo:', coordinates);
      
      const { data } = await updateLocationMutation({
        variables: { coordinates },
        errorPolicy: 'all'
      });

      setServerSyncState(prev => ({
        ...prev,
        lastSyncTime: Date.now(),
        syncError: null,
      }));

      console.log('✅ Location updated successfully:', data?.updateRiderLocationByService);
      return data?.updateRiderLocationByService;
    } catch (error) {
      console.error('❌ Failed to update location:', error);
      setServerSyncState(prev => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Unknown sync error',
      }));
      throw error;
    }
  }, [updateLocationMutation, opts.enableServerSync]);

  const updateServerStatus = useCallback(async (status: 'ONLINE' | 'OFFLINE') => {
    if (!opts.enableServerSync) return;

    try {
      console.log('🟢 Updating rider status via Apollo:', status);
      
      const { data } = await updateStatusMutation({
        variables: { status },
        errorPolicy: 'all'
      });

      console.log('✅ Status updated successfully:', data?.updateRiderOnlineStatusByService);
      return data?.updateRiderOnlineStatusByService;
    } catch (error) {
      console.error('❌ Failed to update status:', error);
      setServerSyncState(prev => ({
        ...prev,
        syncError: error instanceof Error ? error.message : 'Unknown status error',
      }));
      throw error;
    }
  }, [updateStatusMutation, opts.enableServerSync]);

  // NEW: Handle server sync based on movement count
  const handleServerSync = useCallback(async (location: RiderLocation, isMoving: boolean) => {
    if (!opts.enableServerSync) return;

    const coordinates: [number, number] = [location.lng, location.lat];

    // First location update: send both location and status
    if (isFirstLocationUpdateRef.current) {
      console.log('🚀 First location update - sending location AND status');
      
      try {
        // Update location first
        await updateServerLocation(coordinates);
        
        // Update status to ONLINE
        await updateServerStatus('ONLINE');
        setServerSyncState(prev => ({ ...prev, isOnline: true }));
        
        lastSyncedLocationRef.current = { lat: location.lat, lng: location.lng };
        isFirstLocationUpdateRef.current = false;
        
        console.log('✅ First sync completed - location and status updated');
      } catch (error) {
        console.error('❌ Failed first sync:', error);
      }
      return;
    }

    // For subsequent updates: only sync location every 10 movements
    if (isMoving) {
      movementCountRef.current += 1;
      console.log(`🏃 Movement count: ${movementCountRef.current}/10`);

      if (movementCountRef.current >= 10) {
        console.log('📡 10 movements reached - updating location');
        
        try {
          await updateServerLocation(coordinates);
          lastSyncedLocationRef.current = { lat: location.lat, lng: location.lng };
          movementCountRef.current = 0; // Reset counter
          
          console.log('✅ Location sync completed after 10 movements');
        } catch (error) {
          console.error('❌ Failed movement-based sync:', error);
        }
      }
    }
  }, [opts.enableServerSync, updateServerLocation, updateServerStatus]);

  // NEW: Stop server sync
  const stopServerSync = useCallback(async () => {
    if (!opts.enableServerSync) return;

    console.log('🛑 Stopping server sync');

    // Set offline status
    try {
      await updateServerStatus('OFFLINE');
    } catch (error) {
      console.error('Failed to set offline status:', error);
    }

    setServerSyncState(prev => ({
      ...prev,
      isOnline: false,
      lastSyncTime: null,
    }));

    // Reset sync refs
    lastSyncedLocationRef.current = null;
    movementCountRef.current = 0;
    isFirstLocationUpdateRef.current = true;
  }, [opts.enableServerSync, updateServerStatus]);

  // Detect movement based on location changes
  const detectMovement = useCallback((newLocation: RiderLocation) => {
    const now = Date.now();
    let isMoving = false;
    let bearingChange = 0;
    let speed = newLocation.speed || 0;

    if (lastLocationRef.current) {
      const distance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        newLocation.lat,
        newLocation.lng
      );

      const timeDiff = (now - (lastLocationRef.current.timestamp || now)) / 1000;

      if (!newLocation.speed && timeDiff > 0) {
        speed = distance / timeDiff;
      }

      if (distance > 2) {
        isMoving = true;
      }

      if (lastBearingRef.current !== null && newLocation.heading !== undefined) {
        bearingChange = calculateBearingDifference(lastBearingRef.current, newLocation.heading);
        if (bearingChange > 5) {
          isMoving = true;
        }
      }

      if (speed > 0.5) {
        isMoving = true;
      }
    }

    setMovementState(prev => ({
      isMoving,
      lastMoveTime: isMoving ? now : prev.lastMoveTime,
      speed: speed * 3.6,
      bearingChange,
    }));

    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
    }

    if (isMoving) {
      movementTimeoutRef.current = setTimeout(() => {
        setMovementState(prev => ({ ...prev, isMoving: false }));
      }, 10000);
    }

    if (newLocation.heading !== undefined) {
      lastBearingRef.current = newLocation.heading;
    }

    console.log(`🏃 Movement detected: ${isMoving}, Speed: ${(speed * 3.6).toFixed(1)} km/h`);
    
    // NEW: Handle server sync based on movement
    handleServerSync(newLocation, isMoving);
    
    return isMoving;
  }, [calculateDistance, calculateBearingDifference, handleServerSync]);

  // Create location marker element with Navigation icon
  const createLocationMarkerElement = useCallback((location: RiderLocation): HTMLDivElement => {
    const markerElement = document.createElement('div');
    markerElement.className = 'rider-location-marker';
    
    const accuracyRadius = Math.min((location.accuracy || 10) * 2, 200);
    const hasHeading = opts.showBearing && location.heading !== undefined && location.heading !== null;
    const heading = location.heading || 0;
    
    const getCompassDirection = (degrees: number) => {
      const normalizedDegrees = ((degrees % 360) + 360) % 360;
      const directions = [
        { name: 'North', short: 'N', icon: '🧭', color: '#EF4444' },
        { name: 'Northeast', short: 'NE', icon: '↗️', color: '#F97316' },
        { name: 'East', short: 'E', icon: '➡️', color: '#EAB308' },
        { name: 'Southeast', short: 'SE', icon: '↘️', color: '#22C55E' },
        { name: 'South', short: 'S', icon: '⬇️', color: '#06B6D4' },
        { name: 'Southwest', short: 'SW', icon: '↙️', color: '#3B82F6' },
        { name: 'West', short: 'W', icon: '⬅️', color: '#8B5CF6' },
        { name: 'Northwest', short: 'NW', icon: '↖️', color: '#EC4899' }
      ];
      const index = Math.round(normalizedDegrees / 45) % 8;
      return directions[index];
    };

    const compassDir = hasHeading ? getCompassDirection(heading) : null;
    
    const compassNeedleSVG = `
      <svg class="compass-needle" width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="13" y1="3" x2="13" y2="23" stroke="white" stroke-width="3" stroke-linecap="round"/>
        <path d="M13 3 L17 9 L13 7 L9 9 Z" fill="#EF4444" stroke="white" stroke-width="1"/>
        <path d="M13 23 L17 17 L13 19 L9 17 Z" fill="#3B82F6" stroke="white" stroke-width="1"/>
        <circle cx="13" cy="13" r="2" fill="white" stroke="#1E40AF" stroke-width="1.5"/>
      </svg>
    `;
    
    markerElement.innerHTML = `
      <div class="location-dot" data-heading="${heading}">
        ${opts.showAccuracyCircle ? `
          <div class="location-accuracy-circle" style="width: ${accuracyRadius}px; height: ${accuracyRadius}px;"></div>
        ` : ''}
        <div class="location-pulse"></div>
        <div class="location-center ${hasHeading ? 'has-bearing' : ''}">
          <div class="bearing-container" style="transform: rotate(${hasHeading ? heading : 0}deg)">
            ${compassNeedleSVG}
          </div>
        </div>
        ${hasHeading && compassDir ? `
          <div class="bearing-info-display">
            <span class="bearing-degrees">${heading.toFixed(0)}°</span>
            <span class="bearing-compass" style="color: ${compassDir.color}">${compassDir.icon} ${compassDir.short}</span>
          </div>
        ` : ''}
      </div>
    `;

    return markerElement;
  }, [opts.showBearing, opts.showAccuracyCircle]);

  // Create popup content
  const createPopupContent = useCallback((location: RiderLocation): string => {
    return `
      <div class="p-4">
        <h3 class="font-bold text-blue-600 mb-3">📍 My Location</h3>
        <div class="text-sm space-y-2">
          <p><strong>Lat:</strong> ${location.lat.toFixed(6)}</p>
          <p><strong>Lng:</strong> ${location.lng.toFixed(6)}</p>
          <p><strong>Accuracy:</strong> ±${location.accuracy?.toFixed(0) || "Unknown"}m</p>
          ${location.heading !== undefined ? `<p><strong>Heading:</strong> ${location.heading.toFixed(0)}°</p>` : ''}
          ${location.speed !== undefined ? `<p><strong>Speed:</strong> ${(location.speed * 3.6).toFixed(1)} km/h</p>` : ''}
          <p><strong>Last Update:</strong> ${new Date().toLocaleTimeString()}</p>
          ${opts.enableServerSync ? `
            <p><strong>Server Sync:</strong> ${serverSyncState.isOnline ? '🟢 Online' : '🔴 Offline'}</p>
            <p><strong>Movement Count:</strong> ${movementCountRef.current}/10</p>
          ` : ''}
        </div>
      </div>
    `;
  }, [opts.enableServerSync, serverSyncState.isOnline]);

  // Update location marker with smooth animations
  const updateLocationMarker = useCallback((location: RiderLocation) => {
    if (!mapInstance.current) {
      console.log('❌ No map instance available');
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLngLat([location.lng, location.lat]);
      
      const markerElement = markerRef.current.getElement();
      if (markerElement) {
        const bearingContainer = markerElement.querySelector('.bearing-container') as HTMLElement;
        
        if (bearingContainer && location.heading !== undefined) {
          bearingContainer.style.transform = `rotate(${location.heading}deg)`;
        }
      }
      
      const popup = markerRef.current.getPopup();
      if (popup) {
        popup.setHTML(createPopupContent(location));
      }
    } else {
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

      markerRef.current = marker;
    }

    if (opts.autoCenter) {
      mapInstance.current.flyTo({
        center: [location.lng, location.lat],
        zoom: Math.max(mapInstance.current.getZoom(), 16),
        duration: 800,
        essential: true,
      });
    }
  }, [mapInstance, createLocationMarkerElement, createPopupContent, opts.autoCenter]);

  // Update tracking statistics
  const updateTrackingStats = useCallback((location: RiderLocation) => {
    if (!startTimeRef.current) return;

    let additionalDistance = 0;
    if (lastLocationRef.current) {
      additionalDistance = calculateDistance(
        lastLocationRef.current.lat,
        lastLocationRef.current.lng,
        location.lat,
        location.lng
      );
      
      if (additionalDistance < 1000) {
        trackingStatsRef.current.totalDistance += additionalDistance;
      }
    }

    trackingStatsRef.current.positions.push(location);
    if (trackingStatsRef.current.positions.length > 100) {
      trackingStatsRef.current.positions.shift();
    }

    lastLocationRef.current = location;
  }, [calculateDistance]);

  // Handle location updates with movement detection and server sync
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

    console.log('📡 Location update received:', {
      lat: location.lat.toFixed(6),
      lng: location.lng.toFixed(6),
      heading: location.heading?.toFixed(0),
      speed: location.speed ? (location.speed * 3.6).toFixed(1) + ' km/h' : 'unknown',
      accuracy: location.accuracy?.toFixed(0) + 'm'
    });

    detectMovement(location);

    setState(prev => ({
      ...prev,
      currentLocation: location,
      error: null,
      isLoading: false,
    }));

    updateLocationMarker(location);
    updateTrackingStats(location);
  }, [updateLocationMarker, updateTrackingStats, detectMovement]);

  // Handle location error
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error('📍 Location error:', error);
    
    let errorMessage = 'Unknown location error';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location access denied. Please enable location permissions.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out.';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      isPermissionGranted: error.code !== error.PERMISSION_DENIED,
      isLoading: false,
    }));
  }, []);

  // Check geolocation support
  const checkGeolocationSupport = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        isLoading: false,
      }));
      return false;
    }
    return true;
  }, []);

  // Request permission
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

  // Start tracking with server sync
  const startTracking = useCallback(async () => {
    console.log('🚀 STARTING location tracking with movement-based server sync');
    
    // Clean up existing markers
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (!checkGeolocationSupport()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

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
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    };

    // Reset tracking stats and sync counters
    startTimeRef.current = Date.now();
    trackingStatsRef.current = {
      totalDistance: 0,
      startTime: Date.now(),
      positions: [],
    };
    lastLocationRef.current = null;
    lastBearingRef.current = null;
    
    // Reset sync refs
    movementCountRef.current = 0;
    isFirstLocationUpdateRef.current = true;
    lastSyncedLocationRef.current = null;

    setState(prev => ({
      ...prev,
      isTracking: true,
      trackingDuration: 0,
      totalDistance: 0,
      averageSpeed: 0,
    }));

    setMovementState({
      isMoving: false,
      lastMoveTime: Date.now(),
      speed: 0,
      bearingChange: 0,
    });

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
      {
        ...positionOptions,
        maximumAge: 5000,
      }
    );

    watchIdRef.current = watchId;
    console.log('🚀 Location tracking started with movement-based server sync');
  }, [handleLocationSuccess, handleLocationError, checkGeolocationSupport, requestPermission]);

  // Stop tracking with complete cleanup
  const stopTracking = useCallback(async () => {
    console.log('🛑 STOPPING location tracking');
    
    // Stop geolocation watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Stop intervals
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (movementTimeoutRef.current) {
      clearTimeout(movementTimeoutRef.current);
      movementTimeoutRef.current = null;
    }

    // Stop server sync
    await stopServerSync();

    // Remove marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Reset refs
    startTimeRef.current = null;
    lastLocationRef.current = null;
    lastBearingRef.current = null;

    // Reset state
    setState(prev => ({
      ...prev,
      isTracking: false,
      marker: null,
      error: null,
      isLoading: false,
      currentLocation: null,
    }));

    setMovementState({
      isMoving: false,
      lastMoveTime: Date.now(),
      speed: 0,
      bearingChange: 0,
    });
    
    console.log('🛑 Location tracking completely stopped');
  }, [stopServerSync]);

  // Toggle tracking
  const toggleTracking = useCallback(() => {
    if (state.isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [state.isTracking, startTracking, stopTracking]);

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

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    setServerSyncState(prev => ({ ...prev, syncError: null }));
  }, []);

  // Force location update to server
  const forceServerUpdate = useCallback(async () => {
    if (state.currentLocation && opts.enableServerSync) {
      try {
        await updateServerLocation([state.currentLocation.lng, state.currentLocation.lat]);
        lastSyncedLocationRef.current = { 
          lat: state.currentLocation.lat, 
          lng: state.currentLocation.lng 
        };
        // Reset movement counter after manual update
        movementCountRef.current = 0;
      } catch (error) {
        console.error('Failed to force server update:', error);
      }
    }
  }, [state.currentLocation, updateServerLocation, opts.enableServerSync]);

  // Duration and stats update
  useEffect(() => {
    if (state.isTracking && startTimeRef.current) {
      durationIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const duration = Math.floor((now - startTimeRef.current!) / 1000);
        
        const averageSpeed = duration > 0 
          ? (trackingStatsRef.current.totalDistance / duration) * 3.6
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 useLocationTracking cleanup on unmount');
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (movementTimeoutRef.current) {
        clearTimeout(movementTimeoutRef.current);
      }
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return {
    // Location state
    isTracking: state.isTracking,
    isLoading: state.isLoading,
    currentLocation: state.currentLocation,
    error: state.error,
    isPermissionGranted: state.isPermissionGranted,
    trackingDuration: state.trackingDuration,
    totalDistance: state.totalDistance,
    averageSpeed: state.averageSpeed,

    // Movement state
    isMoving: movementState.isMoving,
    movementSpeed: movementState.speed,
    bearingChange: movementState.bearingChange,
    lastMoveTime: movementState.lastMoveTime,

    // Server sync state
    isOnline: serverSyncState.isOnline,
    lastSyncTime: serverSyncState.lastSyncTime,
    syncError: serverSyncState.syncError,
    movementCount: movementCountRef.current, // NEW: Expose movement count

    // Actions
    startTracking,
    stopTracking,
    toggleTracking,
    clearError,
    centerOnLocation,
    forceServerUpdate,

  }
}
// Enhanced CSS styles for the directional marker
// Replace your locationTrackingStyles with this enhanced version:

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
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .location-pulse {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 70px;
    height: 70px;
    background: rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    animation: locationPulse 2s infinite;
    z-index: 1;
  }
  
  .location-center {
    position: relative;
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3B82F6, #1D4ED8);
    border: 4px solid white;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* Enhanced bearing container with smooth transitions */
  .bearing-container {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 1.5s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: center;
    will-change: transform;
  }
  
  /* Different marker styles based on bearing availability */
  .location-center.has-bearing {
    background: linear-gradient(135deg, #EF4444, #DC2626);
    border-color: white;
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4);
  }
  
  /* Directional arrow styles */
  .directional-arrow,
  .simple-arrow,
  .compass-needle {
    width: 28px;
    height: 28px;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    transition: all 0.3s ease;
  }
  
  /* Bearing info display - enhanced */
  .bearing-info-display {
    position: absolute;
    top: -45px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 6px 10px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: bold;
    text-align: center;
    white-space: nowrap;
    z-index: 7;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    animation: infoFadeIn 0.5s ease-out;
    transition: all 0.3s ease;
  }
  
  .bearing-degrees {
    display: block;
    color: #60A5FA;
    font-size: 12px;
    font-weight: bold;
    transition: all 0.3s ease;
  }
  
  .bearing-compass {
    display: block;
    font-size: 10px;
    margin-top: 2px;
    font-weight: bold;
    transition: all 0.3s ease;
  }
  
  /* NEW: Direction indicator below the marker */
  .direction-indicator {
    position: absolute;
    bottom: -35px;
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
    z-index: 6;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    animation: infoFadeIn 0.5s ease-out 0.2s both;
  }
  
  .direction-text {
    font-size: 9px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  /* Bearing update animation */
  .rider-location-marker.bearing-updated .location-center {
    animation: bearingUpdate 0.5s ease-out;
  }
  
  .rider-location-marker.bearing-updated .bearing-container {
    animation: rotationPulse 0.5s ease-out;
  }
  
  /* Movement-based animations */
  .rider-location-marker.moving .location-pulse {
    animation: movementPulse 1.5s infinite;
    background: rgba(34, 197, 94, 0.4);
  }
  
  .rider-location-marker.moving .location-center {
    background: linear-gradient(135deg, #22C55E, #16A34A);
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.4);
  }
  
  .rider-location-marker.moving.has-bearing .location-center {
    background: linear-gradient(135deg, #F59E0B, #D97706);
    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.5);
  }
  
  /* High-speed movement indicator */
  .rider-location-marker.high-speed .location-pulse {
    animation: highSpeedPulse 1s infinite;
    background: rgba(239, 68, 68, 0.4);
  }
  
  .rider-location-marker.high-speed .location-center {
    background: linear-gradient(135deg, #EF4444, #DC2626);
    box-shadow: 0 4px 20px rgba(239, 68, 68, 0.5);
  }
  
  /* Accuracy circle with enhanced styling */
  .location-accuracy-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 3px solid rgba(59, 130, 246, 0.4);
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.1);
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 0;
    animation: accuracyPulse 3s infinite;
    transition: width 0.5s ease, height 0.5s ease;
  }
  
  /* Animation keyframes */
  @keyframes locationPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 1;
    }
    70% {
      transform: translate(-50%, -50%) scale(1.4);
      opacity: 0.4;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.8);
      opacity: 0;
    }
  }
  
  @keyframes movementPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.9);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0.6;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
  }
  
  @keyframes highSpeedPulse {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.3);
      opacity: 0.8;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.6);
      opacity: 0;
    }
  }
  
  @keyframes bearingUpdate {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
  
  @keyframes rotationPulse {
    0% {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }
    50% {
      filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.6));
    }
    100% {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
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
  
  /* Enhanced popup styles */
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
      width: 50px;
      height: 50px;
    }
    
    .location-center {
      width: 32px;
      height: 32px;
      border: 3px solid white;
    }
    
    .directional-arrow,
    .simple-arrow,
    .compass-needle {
      width: 22px;
      height: 22px;
    }
    
    .location-pulse {
      width: 60px;
      height: 60px;
    }
    
    .bearing-info-display {
      top: -40px;
      padding: 4px 8px;
      font-size: 10px;
    }
    
    .direction-indicator {
      bottom: -30px;
      padding: 3px 6px;
      font-size: 9px;
    }
    
    .bearing-degrees {
      font-size: 11px;
    }
    
    .bearing-compass {
      font-size: 9px;
    }
    
    .location-popup .maplibregl-popup-content {
      max-width: 280px !important;
    }
  }
  
  /* Enhanced hover effects */
  .rider-location-marker:hover .directional-arrow,
  .rider-location-marker:hover .simple-arrow,
  .rider-location-marker:hover .compass-needle {
    transform: scale(1.1);
    filter: drop-shadow(0 4px 8px rgba(59, 130, 246, 0.5));
  }
  
  .rider-location-marker:hover .location-center {
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    transform: scale(1.05);
  }
  
  .rider-location-marker:hover .bearing-info-display {
    background: rgba(0, 0, 0, 0.95);
    border-color: rgba(59, 130, 246, 0.5);
  }
`;
// Export all components and hooks
export default {
  LocationTrackingButton,
  LocationStatusCard,
  LocationErrorCard,
  // useLocationTracking,
  useLocationTrackingServiceRider,
  locationTrackingStyles,
};