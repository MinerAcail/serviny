import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Navigation, DollarSign, Clock, User, Package, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as turf from "@turf/turf";

// Mock data for rider zones (normally fetched from GraphQL)
const mockRiderZones = [
  { id: "1", startKm: 0, endKm: 3, price: 5.00 },
  { id: "2", startKm: 3, endKm: 6, price: 8.00 },
  { id: "3", startKm: 6, endKm: 10, price: 12.00 },
  { id: "4", startKm: 10, endKm: 15, price: 18.00 }
];

// Mock rider data
const mockRider = {
  id: "rider_123",
  name: "Alex Johnson",
  avatar: "",
  rating: 4.8,
  vehicleType: "Motorcycle",
  phone: "+1234567890",
  isOnline: true,
  experience: "5+ years experience"
};

// Zone colors for map visualization
const ZONE_COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa"];

interface Location {
  address: string;
  coordinates: [number, number]; // [lng, lat]
  placeId: string;
}

interface PricingZone {
  id: string;
  startKm: number;
  endKm: number;
  price: number;
}

interface DeliveryCalculation {
  distance: number;
  duration: string;
  matchedZone: PricingZone | null;
  totalPrice: number;
}

export default function RiderBookingComponent() {
  // Location states
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null);
  
  // Search states
  const [pickupSearch, setPickupSearch] = useState("");
  const [dropoffSearch, setDropoffSearch] = useState("");
  const [pickupPredictions, setPickupPredictions] = useState<any[]>([]);
  const [dropoffPredictions, setDropoffPredictions] = useState<any[]>([]);
  const [showPickupPredictions, setShowPickupPredictions] = useState(false);
  const [showDropoffPredictions, setShowDropoffPredictions] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Calculation states
  const [calculation, setCalculation] = useState<DeliveryCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [riderZones, setRiderZones] = useState<PricingZone[]>(mockRiderZones);

  // Booking states
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  // UI states
  const [showZonesOnMap, setShowZonesOnMap] = useState(true);
  const [currentStep, setCurrentStep] = useState<'locations' | 'review' | 'complete'>('locations');

  // Mock Google Places search
  const searchPlaces = useCallback(async (query: string) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock predictions
    return [
      {
        place_id: `${query}_1`,
        description: `${query} Street, New York, NY`,
        structured_formatting: {
          main_text: `${query} Street`,
          secondary_text: "New York, NY"
        },
        coordinates: [
          -74.006 + Math.random() * 0.1,
          40.7128 + Math.random() * 0.1
        ]
      },
      {
        place_id: `${query}_2`, 
        description: `${query} Avenue, Brooklyn, NY`,
        structured_formatting: {
          main_text: `${query} Avenue`,
          secondary_text: "Brooklyn, NY"
        },
        coordinates: [
          -73.95 + Math.random() * 0.1,
          40.65 + Math.random() * 0.1
        ]
      }
    ];
  }, []);

  // Handle pickup search
  const handlePickupSearch = useCallback(async (value: string) => {
    setPickupSearch(value);
    if (value.length > 2) {
      setIsSearchLoading(true);
      const predictions = await searchPlaces(value);
      setPickupPredictions(predictions);
      setShowPickupPredictions(true);
      setIsSearchLoading(false);
    } else {
      setPickupPredictions([]);
      setShowPickupPredictions(false);
    }
  }, [searchPlaces]);

  // Handle dropoff search
  const handleDropoffSearch = useCallback(async (value: string) => {
    setDropoffSearch(value);
    if (value.length > 2) {
      setIsSearchLoading(true);
      const predictions = await searchPlaces(value);
      setDropoffPredictions(predictions);
      setShowDropoffPredictions(true);
      setIsSearchLoading(false);
    } else {
      setDropoffPredictions([]);
      setShowDropoffPredictions(false);
    }
  }, [searchPlaces]);

  // Select pickup location
  const selectPickupLocation = useCallback((place: any) => {
    const location: Location = {
      address: place.description,
      coordinates: place.coordinates,
      placeId: place.place_id
    };
    setPickupLocation(location);
    setPickupSearch(place.description);
    setShowPickupPredictions(false);
  }, []);

  // Select dropoff location
  const selectDropoffLocation = useCallback((place: any) => {
    const location: Location = {
      address: place.description,
      coordinates: place.coordinates,
      placeId: place.place_id
    };
    setDropoffLocation(location);
    setDropoffSearch(place.description);
    setShowDropoffPredictions(false);
  }, []);

  // Calculate delivery details
  const calculateDelivery = useCallback(() => {
    if (!pickupLocation || !dropoffLocation) return;

    setIsCalculating(true);
    
    setTimeout(() => {
      // Calculate distance using Turf.js
      const from = turf.point(pickupLocation.coordinates);
      const to = turf.point(dropoffLocation.coordinates);
      const distance = turf.distance(from, to, { units: 'kilometers' });
      
      // Find matching pricing zone
      const matchedZone = riderZones.find(zone => 
        distance >= zone.startKm && distance < zone.endKm
      ) || riderZones[riderZones.length - 1]; // Default to last zone if over max

      // Calculate estimated duration (assuming 30 km/h average speed)
      const durationMinutes = Math.round((distance / 30) * 60);
      const duration = durationMinutes < 60 
        ? `${durationMinutes} min`
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

      const calculation: DeliveryCalculation = {
        distance: Number(distance.toFixed(2)),
        duration,
        matchedZone,
        totalPrice: matchedZone?.price || 0
      };

      setCalculation(calculation);
      setCurrentStep('review');
      setIsCalculating(false);
    }, 1000);
  }, [pickupLocation, dropoffLocation, riderZones]);

  // Auto-calculate when both locations are set
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      calculateDelivery();
    }
  }, [pickupLocation, dropoffLocation, calculateDelivery]);

  // Handle booking confirmation
  const handleBooking = useCallback(async () => {
    if (!calculation || !pickupLocation || !dropoffLocation) return;

    setIsBooking(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsBooking(false);
    setBookingComplete(true);
    setCurrentStep('complete');
  }, [calculation, pickupLocation, dropoffLocation]);

  // Reset booking
  const resetBooking = useCallback(() => {
    setPickupLocation(null);
    setDropoffLocation(null);
    setPickupSearch("");
    setDropoffSearch("");
    setCalculation(null);
    setBookingComplete(false);
    setCurrentStep('locations');
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Book a Delivery</h1>
        <p className="text-gray-600">Get instant pricing based on distance and rider zones</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {['locations', 'review', 'complete'].map((step, index) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step 
                ? 'bg-blue-600 text-white' 
                : index < ['locations', 'review', 'complete'].indexOf(currentStep)
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}>
              {index < ['locations', 'review', 'complete'].indexOf(currentStep) ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            {index < 2 && (
              <div className={`w-16 h-1 mx-2 ${
                index < ['locations', 'review', 'complete'].indexOf(currentStep)
                  ? 'bg-green-600'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {currentStep === 'locations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Select Locations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pickup Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Pickup Location
                </label>
                <div className="relative">
                  <Input
                    placeholder="Enter pickup address..."
                    value={pickupSearch}
                    onChange={(e) => handlePickupSearch(e.target.value)}
                    className="pr-10"
                  />
                  {pickupLocation && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                  )}
                  
                  {/* Pickup Predictions */}
                  {showPickupPredictions && pickupPredictions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {pickupPredictions.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => selectPickupLocation(place)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {place.structured_formatting.main_text}
                          </div>
                          <div className="text-sm text-gray-500">
                            {place.structured_formatting.secondary_text}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dropoff Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Drop-off Location
                </label>
                <div className="relative">
                  <Input
                    placeholder="Enter delivery address..."
                    value={dropoffSearch}
                    onChange={(e) => handleDropoffSearch(e.target.value)}
                    className="pr-10"
                  />
                  {dropoffLocation && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-600" />
                  )}
                  
                  {/* Dropoff Predictions */}
                  {showDropoffPredictions && dropoffPredictions.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {dropoffPredictions.map((place) => (
                        <button
                          key={place.place_id}
                          onClick={() => selectDropoffLocation(place)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {place.structured_formatting.main_text}
                          </div>
                          <div className="text-sm text-gray-500">
                            {place.structured_formatting.secondary_text}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {isCalculating && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                  <span className="text-gray-600">Calculating delivery details...</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rider Info & Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Your Rider</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Rider Profile */}
              <div className="flex items-center space-x-3 mb-6">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={mockRider.avatar} alt={mockRider.name} />
                  <AvatarFallback>{mockRider.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{mockRider.name}</h3>
                    <Badge variant={mockRider.isOnline ? "default" : "secondary"} className="text-xs">
                      {mockRider.isOnline ? "Online" : "Offline"}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>⭐ {mockRider.rating}</span>
                    <span>{mockRider.vehicleType}</span>
                  </div>
                  <p className="text-xs text-gray-500">{mockRider.experience}</p>
                </div>
              </div>

              {/* Pricing Zones */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Pricing Zones</h4>
                <div className="space-y-2">
                  {riderZones.map((zone, index) => (
                    <div
                      key={zone.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length] }}
                        />
                        <span className="text-sm font-medium">
                          {zone.startKm}km - {zone.endKm}km
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ${zone.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'review' && calculation && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Review Your Delivery</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Route Summary */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 rounded-full bg-green-600 mt-1.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Pickup</p>
                  <p className="text-sm text-gray-600">{pickupLocation?.address}</p>
                </div>
              </div>
              
              <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-6" />
              
              <div className="flex items-start space-x-3">
                <div className="w-3 h-3 rounded-full bg-red-600 mt-1.5" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Drop-off</p>
                  <p className="text-sm text-gray-600">{dropoffLocation?.address}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Navigation className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Distance</p>
                <p className="font-semibold text-gray-900">{calculation.distance} km</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Est. Time</p>
                <p className="font-semibold text-gray-900">{calculation.duration}</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total Price</p>
                <p className="font-semibold text-gray-900">${calculation.totalPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Matched Zone */}
            {calculation.matchedZone && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Pricing Zone</span>
                </div>
                <p className="text-sm text-blue-800">
                  Your delivery falls within the {calculation.matchedZone.startKm}km - {calculation.matchedZone.endKm}km zone
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('locations')}
                className="flex-1"
              >
                Edit Locations
              </Button>
              <Button
                onClick={handleBooking}
                disabled={isBooking}
                className="flex-1"
              >
                {isBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 'complete' && (
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="py-12">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p className="text-gray-600 mb-6">
              Your delivery has been requested. {mockRider.name} will be notified shortly.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Booking Reference</p>
              <p className="font-mono text-lg font-semibold">#DEL{Date.now().toString().slice(-6)}</p>
            </div>

            <div className="space-y-3">
              <Button onClick={resetBooking} className="w-full">
                Book Another Delivery
              </Button>
              <Button variant="outline" className="w-full">
                Track This Delivery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}