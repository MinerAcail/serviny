// PinDropper.tsx
import { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Button } from "@/components/ui/button";
import { MapPin, Check, X, Move, Map } from "lucide-react";
import "./pin-dropper.css";

interface PinDropperProps {
  mapInstance: React.MutableRefObject<maplibregl.Map | null>;
  onLocationSelected: (coordinates: { lng: number; lat: number }) => void;
  onCancel: () => void;
}

export function PinDropper({ 
  mapInstance, 
  onLocationSelected, 
  onCancel 
}: PinDropperProps) {
  const [centerCoordinates, setCenterCoordinates] = useState<{ lng: number; lat: number } | null>(null);
  const [addressInfo, setAddressInfo] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const tooltipTimerRef = useRef<number | null>(null);

  // Initialize geocoder
  useEffect(() => {
    if (!geocoderRef.current && window.google && window.google.maps) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, []);

  // Add pin-dropper-active class to map
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    
    map.getCanvas().classList.add('map-pin-dropper-active');
    
    return () => {
      map.getCanvas().classList.remove('map-pin-dropper-active');
    };
  }, [mapInstance]);

  // Show entry toast
  useEffect(() => {
    const toast = document.createElement('div');
    toast.className = 'pin-mode-toast';
    toast.innerHTML = `
      <MapPin class="h-4 w-4" />
      <span>Drag the map to position the pin</span>
    `;
    document.body.appendChild(toast);
    
    const timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, 10px)';
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
    
    return () => {
      clearTimeout(timeout);
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    };
  }, []);

  // Update center coordinates when map moves
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Get initial center coordinates
    const center = map.getCenter();
    setCenterCoordinates({ lng: center.lng, lat: center.lat });
    
    // Show tooltip briefly
    setShowTooltip(true);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = window.setTimeout(() => {
      setShowTooltip(false);
    }, 2000);

    // Try to get address for initial position
    fetchAddressForLocation(center.lat, center.lng);

    // Update coordinates when map movement ends
    const handleMoveEnd = () => {
      const center = map.getCenter();
      setCenterCoordinates({ lng: center.lng, lat: center.lat });
      
      // Show tooltip briefly
      setShowTooltip(true);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = window.setTimeout(() => {
        setShowTooltip(false);
      }, 2000);
      
      // Try to get address for new position
      fetchAddressForLocation(center.lat, center.lng);
    };

    map.on('moveend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, [mapInstance]);

  // Fetch address for coordinates using Google Geocoder
  const fetchAddressForLocation = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;
    
    geocoderRef.current.geocode({
      location: { lat, lng }
    }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        // Get the formatted address or the most specific component
        const address = results[0].formatted_address;
        setAddressInfo(address);
      } else {
        setAddressInfo(null);
      }
    });
  };

  // Handle confirm button click
  const handleConfirm = () => {
    if (centerCoordinates) {
      onLocationSelected(centerCoordinates);
    }
  };

  return (
    <>
      {/* Pulsing effect behind the pin */}
      <div className="pin-pulse"></div>
      
      {/* Fixed pin in center of screen */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none pin-marker-bounce">
        <MapPin className="h-8 w-8 text-[#0071E3] stroke-2" />
      </div>

      {/* Address tooltip near the pin */}
      <div className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-[calc(100%+45px)] z-20 position-tooltip ${showTooltip ? 'visible' : ''}`}>
        {addressInfo || 'Move map to select location'}
      </div>

      {/* Instruction card */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-3 max-w-xs text-center border border-[#E5E5EA]">
        <div className="flex items-center justify-center mb-1">
          <Move className="h-4 w-4 mr-1.5 text-[#0071E3]" />
          <h3 className="font-medium text-[#1D1D1F] text-sm">Pan the map to position the pin</h3>
        </div>
        <p className="text-xs text-[#86868B] mb-3">Drag the map to place the pin at your desired location</p>
        
        {/* Coordinates display */}
        {centerCoordinates && (
          <div className="text-xs text-[#86868B] bg-[#F5F5F7] rounded-lg p-2 mb-2 font-mono">
            {centerCoordinates.lat.toFixed(6)}, {centerCoordinates.lng.toFixed(6)}
          </div>
        )}
        
        {/* Address display if available */}
        {addressInfo && (
          <div className="text-xs text-[#1D1D1F] font-medium mb-1 truncate max-w-[220px] mx-auto">
            {addressInfo}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-white text-[#EF4444] border-[#EF4444] hover:bg-[#FEF2F2] button-press"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-full bg-[#0071E3] hover:bg-[#0062C3] text-white button-press"
          onClick={handleConfirm}
        >
          <Check className="h-4 w-4 mr-1" />
          Confirm Location
        </Button>
      </div>
    </>
  );
}