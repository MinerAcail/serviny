"use client";

import { gql, useQuery, useMutation } from "@apollo/client";
import * as turf from "@turf/turf";
import { GoogleMap, useLoadScript, Polyline } from "@react-google-maps/api";
import {
  Package,
  Navigation,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Play,
  Route,
  Phone,
  X,
  Target,
  TrendingUp,
  List,
  
} from "lucide-react";
import { AdvancedMarker } from "@vis.gl/react-google-maps";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import type { google } from "googlemaps" // Declare the google variable

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
  coordinates: [number, number];
  isTracking: boolean;
  updatedAt: string;
  bearing?: number;
  previousCoordinates?: [number, number];
}

interface DeliveryItem {
  name: string;
  quantity: number;
  specialInstructions?: string;
}

interface DeliveryStop {
  id: string;
  address: string;
  coordinates: [number, number];
  status: "pending" | "en-route" | "delivered" | "failed";
  customerName: string;
  phoneNumber: string;
  items: DeliveryItem[];
  deliveryWindow: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedDuration: number;
  distance?: number;
}


// Default map center (Accra, Ghana)
const DEFAULT_CENTER = { lat: 5.6037, lng: -0.187 };

// Map container style
const mapContainerStyle = {
  width: "100%",
  height: "100vh",
};

// Google Maps options with iOS-style appearance
const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy" as const,
  scrollwheel: true,
  draggable: true,
  clickableIcons: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#c9d6ff" }],
    },
  ],
};

// Enhanced delivery stops with more realistic data
const mockDeliveryStops: DeliveryStop[] = [
  {
    id: "stop-1",
    address: "Oxford Street, Osu, Accra",
    coordinates: [-0.1652, 5.5563],
    status: "pending",
    customerName: "John Doe",
    phoneNumber: "+233501234567",
    items: [
      {
        name: "Pizza Margherita (Large)",
        quantity: 2,
        specialInstructions: "Extra hot, no olives",
      },
      { name: "Coca Cola (500ml)", quantity: 3 },
      { name: "Garlic Bread", quantity: 1 },
    ],
    deliveryWindow: "12:00 - 13:00",
    priority: "urgent",
    estimatedDuration: 12,
  },
  {
    id: "stop-2",
    address: "American House, East Legon, Accra",
    coordinates: [-0.1389, 5.65],
    status: "pending",
    customerName: "Jane Smith",
    phoneNumber: "+233507654321",
    items: [
      {
        name: "Jollof Rice with Chicken",
        quantity: 1,
        specialInstructions: "Spicy level 3, extra sauce",
      },
      { name: "Fried Plantain", quantity: 2 },
      { name: "Sobolo (Large)", quantity: 1 },
    ],
    deliveryWindow: "13:30 - 14:30",
    priority: "high",
    estimatedDuration: 15,
  },
  {
    id: "stop-3",
    address: "Airport Residential Area, Accra",
    coordinates: [-0.174, 5.6037],
    status: "pending",
    customerName: "Mike Johnson",
    phoneNumber: "+233509876543",
    items: [
      {
        name: "Burger Combo (Beef)",
        quantity: 1,
        specialInstructions: "No pickles, extra cheese",
      },
      { name: "Sweet Potato Fries", quantity: 2 },
      { name: "Milkshake (Chocolate)", quantity: 1 },
    ],
    deliveryWindow: "14:00 - 15:00",
    priority: "urgent",
    estimatedDuration: 10,
  },
  {
    id: "stop-4",
    address: "Liberation Road, Cantonments, Accra",
    coordinates: [-0.1815, 5.5736],
    status: "pending",
    customerName: "Sarah Wilson",
    phoneNumber: "+233502468135",
    items: [
      {
        name: "Grilled Tilapia",
        quantity: 1,
        specialInstructions: "Well grilled, with shito",
      },
      { name: "Banku", quantity: 1 },
      { name: "Palm Wine", quantity: 1 },
    ],
    deliveryWindow: "15:30 - 16:30",
    priority: "medium",
    estimatedDuration: 18,
  },
  {
    id: "stop-5",
    address: "Ring Road Central, Accra",
    coordinates: [-0.2056, 5.6037],
    status: "pending",
    customerName: "David Brown",
    phoneNumber: "+233505551234",
    items: [
      {
        name: "Waakye (Large)",
        quantity: 1,
        specialInstructions: "Extra stew, with gari",
      },
      { name: "Kelewele", quantity: 1, specialInstructions: "Very spicy" },
      { name: "Malt (Big)", quantity: 2 },
    ],
    deliveryWindow: "16:00 - 17:00",
    priority: "medium",
    estimatedDuration: 8,
  },
  {
    id: "stop-6",
    address: "Tema Station, Circle, Accra",
    coordinates: [-0.2167, 5.5564],
    status: "pending",
    customerName: "Grace Asante",
    phoneNumber: "+233558877441",
    items: [
      {
        name: "Fufu with Light Soup",
        quantity: 1,
        specialInstructions: "Goat meat, extra pepper",
      },
      { name: "Fried Fish", quantity: 1 },
    ],
    deliveryWindow: "17:00 - 18:00",
    priority: "high",
    estimatedDuration: 20,
  },
  {
    id: "stop-7",
    address: "Adabraka Market Area",
    coordinates: [-0.2056, 5.5736],
    status: "pending",
    customerName: "Emmanuel Osei",
    phoneNumber: "+233244556677",
    items: [
      { name: "Kenkey with Fish", quantity: 2 },
      { name: "Pepper Sauce", quantity: 1, specialInstructions: "Very hot" },
    ],
    deliveryWindow: "18:30 - 19:30",
    priority: "low",
    estimatedDuration: 14,
  },
];

// Calculate bearing between two points using Turf.js
const calculateBearing = (
  prevCoords: [number, number],
  currentCoords: [number, number]
): number => {
  try {
    const bearing = turf.bearing(prevCoords, currentCoords);
    return bearing >= 0 ? bearing : bearing + 360;
  } catch (error) {
    console.error("Error calculating bearing:", error);
    return 0;
  }
};



// Enhanced route optimization with multiple algorithms
const optimizeRoute = (
  riderLocation: [number, number],
  stops: DeliveryStop[]
): DeliveryStop[] => {
  if (stops.length === 0) return stops;

  const stopsByHex = new Map<string, DeliveryStop[]>();


  const priorityWeight = { urgent: 1, high: 2, medium: 3, low: 4 };
  const statusWeight = { "en-route": 0, pending: 1, delivered: 2, failed: 3 };

  const getTimeWindowScore = (deliveryWindow: string): number => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    try {
      const [startTime] = deliveryWindow.split(" - ");
      const [hours, minutes] = startTime.split(":").map(Number);
      const windowStart = hours * 60 + minutes;
      const currentTime = currentHour * 60 + currentMinute;

      const timeDiff = Math.abs(windowStart - currentTime);

      if (timeDiff <= 30) return -10;
      if (timeDiff <= 60) return -5;
      return timeDiff / 60;
    } catch {
      return 12;
    }
  };

  const clusterCenters = Array.from(stopsByHex.entries()).map(
    ([hexId, hexStops]) => {
      const centerLat =
        hexStops.reduce((sum, stop) => sum + stop.coordinates[1], 0) /
        hexStops.length;
      const centerLng =
        hexStops.reduce((sum, stop) => sum + stop.coordinates[0], 0) /
        hexStops.length;
      const distanceToCluster = turf.distance(
        riderLocation,
        [centerLng, centerLat],
        { units: "meters" }
      );

      const urgentCount = hexStops.filter(
        (s) => s.priority === "urgent" && s.status === "pending"
      ).length;
      const highPriorityCount = hexStops.filter(
        (s) => s.priority === "high" && s.status === "pending"
      ).length;
      const totalPendingStops = hexStops.filter(
        (s) => s.status === "pending"
      ).length;

      const clusterScore =
        urgentCount * 100 +
        highPriorityCount * 50 +
        totalPendingStops * 10 -
        distanceToCluster / 100;

      return {
        hexId,
        center: [centerLng, centerLat] as [number, number],
        stops: hexStops,
        distanceToCluster,
        urgentCount,
        highPriorityCount,
        totalStops: totalPendingStops,
        clusterScore,
      };
    }
  );

  const sortedClusters = clusterCenters.sort(
    (a, b) => b.clusterScore - a.clusterScore
  );

  const optimizedStops: DeliveryStop[] = [];

  sortedClusters.forEach((cluster) => {
    const clusterStops = cluster.stops.sort((a, b) => {
      const statusDiff = statusWeight[a.status] - statusWeight[b.status];
      if (statusDiff !== 0) return statusDiff;

      if (a.status !== "pending" && b.status === "pending") return 1;
      if (a.status === "pending" && b.status !== "pending") return -1;

      if (a.priority === "urgent" && b.priority !== "urgent") return -1;
      if (a.priority !== "urgent" && b.priority === "urgent") return 1;

      const timeScoreDiff =
        getTimeWindowScore(a.deliveryWindow) -
        getTimeWindowScore(b.deliveryWindow);
      if (Math.abs(timeScoreDiff) > 2) return timeScoreDiff;

      const priorityDiff =
        priorityWeight[a.priority] - priorityWeight[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return (a.distance || 0) - (b.distance || 0);
    });

    optimizedStops.push(...clusterStops);
  });

  return optimizedStops;
};

// Calculate ETA for next delivery
const calculateETA = (
  riderLocation: [number, number],
  targetLocation: [number, number]
): string => {
  const distance = turf.distance(riderLocation, targetLocation, {
    units: "meters",
  });
  const avgSpeedKmh = 25;
  const timeMinutes = Math.ceil((distance / 1000 / avgSpeedKmh) * 60);

  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + timeMinutes);

  return eta.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Enhanced productivity metrics with trend analysis
const getProductivityMetrics = (
  stops: DeliveryStop[],
  riderLocation?: [number, number]
) => {
  const delivered = stops.filter((s) => s.status === "delivered");
  const pending = stops.filter((s) => s.status === "pending");
  const failed = stops.filter((s) => s.status === "failed");
  const urgent = pending.filter((s) => s.priority === "urgent");
  const high = pending.filter((s) => s.priority === "high");

  const totalDistance = stops.reduce(
    (sum, stop) => sum + (stop.distance || 0),
    0
  );
  const avgDeliveryTime =
    delivered.length > 0
      ? delivered.reduce((sum, stop) => sum + stop.estimatedDuration, 0) /
        delivered.length
      : 0;

  const nextUrgentDelivery = urgent.length > 0 ? urgent[0] : null;
  let timeToUrgent = 0;
  if (nextUrgentDelivery && riderLocation) {
    const distance = turf.distance(
      riderLocation,
      nextUrgentDelivery.coordinates,
      { units: "meters" }
    );
    timeToUrgent = Math.ceil((distance / 1000 / 25) * 60);
  }

  const hoursWorked = 1;
  const efficiencyScore = delivered.length / hoursWorked;

  const clusterOpportunities = pending.filter(
    (stop) => stop.distance && stop.distance < 500
  ).length;

  return {
    totalStops: stops.length,
    completed: delivered.length,
    pending: pending.length,
    failed: failed.length,
    completionRate:
      stops.length > 0 ? (delivered.length / stops.length) * 100 : 0,
    failureRate: stops.length > 0 ? (failed.length / stops.length) * 100 : 0,
    urgentRemaining: urgent.length,
    highPriorityRemaining: high.length,
    totalDistance: Math.round((totalDistance / 1000) * 10) / 10,
    avgDeliveryTime: Math.round(avgDeliveryTime),
    estimatedTimeRemaining: pending.reduce(
      (sum, stop) => sum + stop.estimatedDuration,
      0
    ),
    timeToNextUrgent: timeToUrgent,
    efficiencyScore: Math.round(efficiencyScore * 10) / 10,
    clusterOpportunities,
    nextDeliveryWindow:
      nextUrgentDelivery?.deliveryWindow ||
      pending[0]?.deliveryWindow ||
      "None",
  };
};

// Mock data for development
const useMockData = true;

const mockRiderData = (): RiderLocation => {
  const time = Date.now() / 10000;
  const baseCoords: [number, number] = [-0.187, 5.6037];
  const radius = 0.005;

  return {
    id: "current-rider",
    name: "You",
    coordinates: [
      baseCoords[0] + Math.cos(time) * radius,
      baseCoords[1] + Math.sin(time) * radius,
    ],
    isTracking: true,
    updatedAt: new Date().toISOString(),
  };
};

const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Arrow Marker Component
const ArrowMarker = ({
  position,
  bearing,
  name,
}: {
  position: [number, number];
  bearing: number;
  name: string;
}) => {
  return (
    <AdvancedMarker position={{ lat: position[1], lng: position[0] }}>
      <div
        className="relative flex items-center justify-center"
        style={{
          transform: `rotate(${bearing}deg)`,
          transition: "transform 0.5s ease-in-out",
        }}
      >
        <div className="w-8 h-8 bg-blue-500 rounded-full shadow-lg border-2 border-white flex items-center justify-center">
          <Navigation className="w-4 h-4 text-white" />
        </div>
        <div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg"
          style={{ transform: `translateX(-50%) rotate(${-bearing}deg)` }}
        >
          {name}
        </div>
      </div>
    </AdvancedMarker>
  );
};

// Delivery Stop Marker Component
const DeliveryStopMarker = ({
  stop,
  isNext,
  onClick,
}: {
  stop: DeliveryStop;
  isNext: boolean;
  onClick: () => void;
}) => {
  const getStatusColor = () => {
    switch (stop.status) {
      case "delivered":
        return "bg-green-500";
      case "en-route":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return isNext ? "bg-purple-500" : "bg-gray-500";
    }
  };

  const getPriorityRing = () => {
    switch (stop.priority) {
      case "urgent":
        return "border-red-500";
      case "high":
        return "border-yellow-500";
      case "medium":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  return (
    <AdvancedMarker
      position={{ lat: stop.coordinates[1], lng: stop.coordinates[0] }}
      onClick={onClick}
    >
      <div className="relative cursor-pointer transform hover:scale-110 transition-transform">
        <div
          className={`absolute -inset-2 rounded-full border-2 opacity-60 ${getPriorityRing()}`}
        />
        <div
          className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${getStatusColor()}`}
        >
          {stop.status === "delivered" ? (
            <CheckCircle className="w-4 h-4 text-white" />
          ) : stop.status === "failed" ? (
            <AlertCircle className="w-4 h-4 text-white" />
          ) : (
            <Package className="w-4 h-4 text-white" />
          )}
        </div>
        {isNext && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white animate-pulse">
            <Navigation className="w-2 h-2 text-white ml-0.5 mt-0.5" />
          </div>
        )}
        {stop.distance && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded-full whitespace-nowrap">
            {stop.distance < 1000
              ? `${Math.round(stop.distance)}m`
              : `${(stop.distance / 1000).toFixed(1)}km`}
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};

export default function DeliveryTrackingMap() {
  const [rider, setRider] = useState<RiderLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [deliveryStops, setDeliveryStops] = useState<DeliveryStop[]>([]);
  const [selectedStop, setSelectedStop] = useState<DeliveryStop | null>(null);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  //  setMiniMenu state
  const [showMiniMenu, setShowMiniMenu] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: envApiKey || "",
    libraries: [],
  });

  // GraphQL queries (simplified for mock data)
  const {  startPolling, stopPolling } = useQuery(
    GET_RIDER_LOCATION,
    {
      pollInterval: useMockData ? 0 : 5000,
      errorPolicy: "all",
      skip: useMockData || !isTracking,
    }
  );

  const [updateRiderLocationMutation] = useMutation(UPDATE_RIDER_LOCATION, {
    errorPolicy: "all",
  });

  // Initialize delivery stops
  useEffect(() => {
    if (useMockData) {
      setDeliveryStops(mockDeliveryStops);
    }
  }, []);

  // Mock data polling for development
  useEffect(() => {
    if (!useMockData || !isTracking) return;

    const interval = setInterval(() => {
      const newRiderData = mockRiderData();
      updateRiderData(newRiderData);
    }, 3000);

    updateRiderData(mockRiderData());
    return () => clearInterval(interval);
  }, [isTracking]);

  // Update rider data with bearing calculation
  const updateRiderData = useCallback((newRiderData: RiderLocation) => {
    setRider((prevRider) => {
      if (!prevRider) {
        return { ...newRiderData, bearing: 0 };
      }

      const prevCoords = prevRider.coordinates;
      const currentCoords = newRiderData.coordinates;

      let bearing = prevRider.bearing || 0;
      let previousCoordinates = prevRider.coordinates;

      try {
        const distance = turf.distance(prevCoords, currentCoords, {
          units: "meters",
        });
        if (distance > 10) {
          bearing = calculateBearing(prevCoords, currentCoords);
          previousCoordinates = prevCoords;
        }
      } catch (error) {
        console.error("Error calculating distance:", error);
      }

      return { ...newRiderData, bearing, previousCoordinates };
    });
  }, []);

  // Optimize route when rider location changes
  useEffect(() => {
    if (rider && deliveryStops.length > 0) {
      const optimizedStops = optimizeRoute(rider.coordinates, deliveryStops);
      setDeliveryStops(optimizedStops);
    }
  }, [rider]); // Updated dependency to rider

  // Auto-follow effect
  useEffect(() => {
    if (!rider || !autoFollow || !mapRef.current) return;

    const now = Date.now();
    if (now - lastUpdateRef.current > 2000) {
      lastUpdateRef.current = now;
      const newCenter = {
        lat: rider.coordinates[1],
        lng: rider.coordinates[0],
      };
      mapRef.current.panTo(newCenter);
    }
  }, [rider, autoFollow]);

  // Get next delivery stop
  const getNextStop = (): DeliveryStop | null => {
    return deliveryStops.find((stop) => stop.status === "pending") || null;
  };

  // Generate route path
  const getRoutePath = (): [number, number][] => {
    if (!rider || !showOptimizedRoute) return [];

    const pendingStops = deliveryStops.filter(
      (stop) => stop.status === "pending"
    );
    const path: [number, number][] = [rider.coordinates];

    pendingStops.forEach((stop) => {
      path.push(stop.coordinates);
    });

    return path;
  };

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      return;
    }

    setIsTracking(true);
    setAutoFollow(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        if (!useMockData) {
          updateRiderLocationMutation({
            variables: { coordinates: coords },
          }).catch(console.error);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    if (!useMockData) {
      startPolling(5000);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (!useMockData) {
      stopPolling();
    }
  };

  // Center map on rider
  const centerOnRider = useCallback(() => {
    if (rider && mapRef.current) {
      const center = { lat: rider.coordinates[1], lng: rider.coordinates[0] };
      setAutoFollow(true);
      mapRef.current.panTo(center);
      mapRef.current.setZoom(17);
    }
  }, [rider]);

  // Navigate to next stop
  const navigateToNext = () => {
    const nextStop = getNextStop();
    if (nextStop && mapRef.current) {
      mapRef.current.panTo({
        lat: nextStop.coordinates[1],
        lng: nextStop.coordinates[0],
      });
      mapRef.current.setZoom(16);
      setSelectedStop(nextStop);
    }
  };

  // Handle map load
  const handleMapLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      let isDragging = false;

      map.addListener("dragstart", () => {
        isDragging = true;
      });

      map.addListener("dragend", () => {
        if (isDragging && isTracking && autoFollow) {
          setAutoFollow(false);
          isDragging = false;
        }
      });

      map.addListener("zoom_changed", () => {
        if (!isDragging && isTracking && autoFollow) {
          setTimeout(() => {
            if (map.getZoom() !== 17) {
              setAutoFollow(false);
            }
          }, 100);
        }
      });
    },
    [isTracking, autoFollow]
  );

  // Mark stop as delivered
  const markAsDelivered = (stopId: string) => {
    setDeliveryStops((prev) =>
      prev.map((stop) =>
        stop.id === stopId ? { ...stop, status: "delivered" as const } : stop
      )
    );
    setSelectedStop(null);

    setTimeout(() => {
      const nextStop = getNextStop();
      if (nextStop && mapRef.current && autoFollow) {
        mapRef.current.panTo({
          lat: nextStop.coordinates[1],
          lng: nextStop.coordinates[0],
        });
      }
    }, 1500);
  };

  const markAsFailed = (stopId: string, reason: string) => {
    setDeliveryStops((prev) =>
      prev.map((stop) =>
        stop.id === stopId
          ? { ...stop, status: "failed" as const, failureReason: reason }
          : stop
      )
    );
    setSelectedStop(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopTracking();
  }, []);

  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Map Load Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">Failed to load Google Maps</p>
            <p className="text-sm text-gray-500">Error: {loadError.message}</p>
            <p className="text-sm text-gray-500 mt-2">
              API Key: {envApiKey ? "Present" : "Missing"}
            </p>
            {useMockData && (
              <Badge variant="secondary" className="mt-2">
                Running in mock mode
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Google Maps...</p>
              <p className="text-sm text-gray-500 mt-2">
                API Key: {envApiKey ? "Present" : "Missing"}
              </p>
              {!envApiKey && (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Missing Google Maps API Key. Please set
                    VITE_GOOGLE_MAPS_API_KEY in your environment variables.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextStop = getNextStop();
  const routePath = getRoutePath();
  const metrics = getProductivityMetrics(deliveryStops, rider?.coordinates);

  return (
    <div className="h-screen w-full relative bg-gray-50">
      {/* iOS-style Control Panel */}

      <DeliveryTrackingPanel
        isTracking={isTracking}
        deliveryStops={deliveryStops}
        rider={rider}
        metrics={metrics}
        nextStop={nextStop}
        selectedStop={selectedStop}
        showAllRoutes={showAllRoutes}
        showOptimizedRoute={showOptimizedRoute}
        autoFollow={autoFollow}
        onStartTracking={startTracking}
        onStopTracking={stopTracking}
        onShowAllRoutesChange={setShowAllRoutes}
        onShowOptimizedRouteChange={setShowOptimizedRoute}
        onAutoFollowChange={setAutoFollow}
        onNavigateToNext={navigateToNext}
        onCenterOnRider={centerOnRider}
        onStopSelect={setSelectedStop}
        onPriorityFilter={(priority) => {
          setDeliveryStops((prev) =>
            prev.map((stop) => ({
              ...stop,
              isFiltered: stop.priority !== priority,
            }))
          );
        }}
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsExpanded((prev) => !prev)}
        onStatusFilter={(status) => {
          setDeliveryStops((prev) =>
            prev.map((stop) => ({
              ...stop,
              isFiltered: stop.status !== status,
            }))
          );
        }}
      />
      {/* Next Stop Quick Actions - Mobile Optimized */}
      {showMiniMenu && isTracking && nextStop && (
        <Card className="absolute bottom-4 right-4 z-10  backdrop-blur-xl bg-white/95 border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {nextStop.customerName}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {nextStop.address}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant={
                        nextStop.priority === "urgent"
                          ? "destructive"
                          : nextStop.priority === "high"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {nextStop.priority.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {nextStop.deliveryWindow}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowMiniMenu((prev) => !prev)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full ml-2"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    window.open(`tel:${nextStop.phoneNumber}`, "_self");
                  }}
                  size="sm"
                  variant="outline"
                  className="flex-1 rounded-full"
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => {
                    const address = encodeURIComponent(nextStop.address);
                    window.open(
                      `https://maps.google.com/maps?daddr=${address}`,
                      "_blank"
                    );
                  }}
                  size="sm"
                  className="flex-1 rounded-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Navigate
                </Button>
                <Button
                  onClick={() => setSelectedStop(nextStop)}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <Package className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini Menu */}
      {!showMiniMenu && (
        <div className="fixed bottom-3  right-0 pr-5 z-20">
          <Button
            onClick={() => setShowMiniMenu(!showMiniMenu)}
            variant="destructive"
            className="rounded-full"
            disabled={!isTracking && !!nextStop}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Stops List Drawer */}

      {/* Selected Stop Details Sheet */}
      {selectedStop && (
        <Sheet
          open={!!selectedStop}
          onOpenChange={(open) => !open && setSelectedStop(null)}
        >
          <SheetContent
            side="bottom"
            className="h-[80vh] pb-20 sm:h-auto sm:max-h-[80vh]"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                <span>{selectedStop.customerName}</span>
                <Button
                  onClick={() => setSelectedStop(null)}
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="h-full mt-6">
              <div className="space-y-6">
                <div>
                  <p className="text-gray-600 mb-2">{selectedStop.address}</p>
                  <a
                    href={`tel:${selectedStop.phoneNumber}`}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedStop.phoneNumber}
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedStop.items.map((item, idx) => (
                        <Card key={idx}>
                          <CardContent className="p-3">
                            <div className="font-medium">
                              {item.quantity}x {item.name}
                            </div>
                            {item.specialInstructions && (
                              <div className="text-sm text-orange-600 mt-1 italic">
                                ⚠️ {item.specialInstructions}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Delivery Window</span>
                        </div>
                        <p>{selectedStop.deliveryWindow}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                              Duration:
                            </span>
                            <span>{selectedStop.estimatedDuration} min</span>
                          </div>
                          {selectedStop.distance && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Distance:
                              </span>
                              <span>
                                {selectedStop.distance < 1000
                                  ? `${Math.round(selectedStop.distance)}m`
                                  : `${(selectedStop.distance / 1000).toFixed(
                                      1
                                    )}km`}
                              </span>
                            </div>
                          )}
                          {rider && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                ETA:
                              </span>
                              <span className="font-medium text-purple-600">
                                {calculateETA(
                                  rider.coordinates,
                                  selectedStop.coordinates
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    onClick={() => {
                      window.open(`tel:${selectedStop.phoneNumber}`, "_self");
                    }}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Customer
                  </Button>
                  <Button
                    onClick={() => {
                      const address = encodeURIComponent(selectedStop.address);
                      window.open(
                        `https://maps.google.com/maps?daddr=${address}`,
                        "_blank"
                      );
                    }}
                    variant="outline"
                    className="rounded-full"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Navigate
                  </Button>
                <div >
                    <Button
                    onClick={() => markAsDelivered(selectedStop.id)}
                    className="rounded-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark Delivered
                  </Button>
                  <Button
                  onClick={() =>
                    markAsFailed(selectedStop.id, "Customer not available")
                  }
                  variant="destructive"
                  className=" rounded-full "
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Mark as Failed
                </Button>
                </div>
                </div>

                
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Google Map */}
      <div className="h-screen w-full">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={DEFAULT_CENTER}
          zoom={15}
          options={mapOptions}
          onLoad={handleMapLoad}
        >
          {/* Rider marker */}
          {rider && rider.isTracking && (
            <ArrowMarker
              position={rider.coordinates}
              bearing={rider.bearing || 0}
              name={rider.name}
            />
          )}

          {/* Delivery stop markers */}
          {showAllRoutes &&
            deliveryStops.map((stop) => (
              <DeliveryStopMarker
                key={stop.id}
                stop={stop}
                isNext={nextStop?.id === stop.id}
                onClick={() => setSelectedStop(stop)}
              />
            ))}

          {/* Optimized route path */}
          {showOptimizedRoute && routePath.length > 1 && (
            <Polyline
              path={routePath.map((coord) => ({
                lat: coord[1],
                lng: coord[0],
              }))}
              options={{
                strokeColor: "#8b5cf6",
                strokeOpacity: 0.8,
                strokeWeight: 4,
                geodesic: true,
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeliveryTrackingPanelProps {
  isTracking: boolean;
  deliveryStops: DeliveryStop[];
  rider: RiderLocation | null;
  metrics: ReturnType<typeof getProductivityMetrics>;
  nextStop: DeliveryStop | null;
  selectedStop: DeliveryStop | null;
  showAllRoutes: boolean;
  showOptimizedRoute: boolean;
  autoFollow: boolean;
  onStartTracking: () => void;
  onStopTracking: () => void;
  onShowAllRoutesChange: (checked: boolean) => void;
  onShowOptimizedRouteChange: (checked: boolean) => void;
  onAutoFollowChange: (checked: boolean) => void;
  onNavigateToNext: () => void;
  onCenterOnRider: () => void;
  onStopSelect: (stop: DeliveryStop) => void;
  onPriorityFilter?: (priority: string) => void;
  onStatusFilter?: (status: string) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

function DeliveryTrackingPanel({
  isTracking,
  deliveryStops,
  rider,
  metrics,
  nextStop,
  selectedStop,
  showAllRoutes,
  showOptimizedRoute,
  autoFollow,
  onStartTracking,
  onStopTracking,
  onShowAllRoutesChange,
  onShowOptimizedRouteChange,
  onAutoFollowChange,
  onNavigateToNext,
  onCenterOnRider,
  onStopSelect,
  onPriorityFilter,
  onStatusFilter,
  isExpanded,
  onToggleExpanded,
}: DeliveryTrackingPanelProps) {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showStopsList, setShowStopsList] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isExpanded &&
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onToggleExpanded();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded, onToggleExpanded]);

  const calculateETA = (from: [number, number], to: [number, number]) => {
    // Simple distance calculation for demo
    const distance = Math.sqrt(
      Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2)
    );
    const estimatedMinutes = Math.round(distance * 100); // Simplified calculation
    return `${estimatedMinutes} min`;
  };

  const filteredStops = deliveryStops.filter((stop) => {
    const priorityMatch =
      priorityFilter === "all" || stop.priority === priorityFilter;
    const statusMatch = statusFilter === "all" || stop.status === statusFilter;
    return priorityMatch && statusMatch;
  });

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    onPriorityFilter?.(value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    onStatusFilter?.(value);
  };

  return (
    <div ref={panelRef}>
      {!isExpanded ? (
        // Collapsed state - just show toggle button
        <Button
          onClick={onToggleExpanded}
          className="absolute botto left-4 z-10 rounded-full shadow-xl backdrop-blur-xl"
          size="lg"
        >
          <Package className="w-5 h-5 mr-2" />
        </Button>
      ) : (
        // Expanded state - show full card
        <Card className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] backdrop-blur-xl bg-white/95 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  }`}
                />
                <CardTitle className="text-lg">
                  {isTracking ? "Live Tracking" : "Tracking Off"}
                </CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={isTracking ? onStopTracking : onStartTracking}
                  variant={isTracking ? "destructive" : "default"}
                  size="sm"
                  className="rounded-full"
                >
                  {isTracking ? "Stop" : "Start"}
                </Button>
                <Button
                  onClick={onToggleExpanded}
                  variant="ghost"
                  size="sm"
                  className="rounded-full"
                >
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          {/* Rest of the existing CardContent remains the same */}
          <CardContent className="space-y-4">
            {/* Quick Stats */}
            {isTracking && deliveryStops.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics.completed}
                  </div>
                  <div className="text-xs text-green-700">Completed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.pending}
                  </div>
                  <div className="text-xs text-blue-700">Pending</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">
                    {metrics.urgentRemaining}
                  </div>
                  <div className="text-xs text-red-700">Urgent</div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isTracking && deliveryStops.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">
                    {metrics.completionRate.toFixed(0)}%
                  </span>
                </div>
                <Progress value={metrics.completionRate} className="h-2" />
              </div>
            )}

            {/* Control Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Show Stops</span>
                </div>
                <Switch
                  checked={showAllRoutes}
                  onCheckedChange={onShowAllRoutesChange}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Route className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Show Route</span>
                </div>
                <Switch
                  checked={showOptimizedRoute}
                  onCheckedChange={onShowOptimizedRouteChange}
                />
              </div>
              {isTracking && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Auto-follow</span>
                  </div>
                  <Switch
                    checked={autoFollow}
                    onCheckedChange={onAutoFollowChange}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {nextStop && (
                <Button
                  onClick={onNavigateToNext}
                  size="sm"
                  className="rounded-full"
                  variant="default"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Next Stop
                </Button>
              )}
              {rider && (
                <Button
                  onClick={onCenterOnRider}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Center
                </Button>
              )}
            </div>

            {/* Sheet Triggers */}
            <div className="grid grid-cols-2 gap-2">
              <Sheet open={showAnalytics} onOpenChange={setShowAnalytics}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Delivery Analytics</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-green-600">
                            {metrics.totalDistance}km
                          </div>
                          <p className="text-sm text-gray-600">
                            Total Distance
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-blue-600">
                            {metrics.estimatedTimeRemaining}min
                          </div>
                          <p className="text-sm text-gray-600">
                            Time Remaining
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {metrics.efficiencyScore}/hr
                        </div>
                        <p className="text-sm text-gray-600">
                          Efficiency Score
                        </p>
                      </CardContent>
                    </Card>

                    {nextStop && rider && (
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Next ETA:
                              </span>
                              <span className="font-medium">
                                {calculateETA(
                                  rider.coordinates,
                                  nextStop.coordinates
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">
                                Window:
                              </span>
                              <span className="font-medium">
                                {nextStop.deliveryWindow}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={showStopsList} onOpenChange={setShowStopsList}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Package className="w-4 h-4 mr-2" />
                    Stops ({deliveryStops.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Delivery Stops</SheetTitle>
                  </SheetHeader>

                  {/* Filters */}
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Priority
                        </label>
                        <Select
                          value={priorityFilter}
                          onValueChange={handlePriorityFilterChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Status
                        </label>
                        <Select
                          value={statusFilter}
                          onValueChange={handleStatusFilterChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
                    <div className="space-y-3">
                      {filteredStops.map((stop) => (
                        <Card
                          key={stop.id}
                          className={`cursor-pointer transition-colors ${
                            selectedStop?.id === stop.id
                              ? "ring-2 ring-blue-500"
                              : ""
                          }`}
                          onClick={() => onStopSelect(stop)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">
                                    {stop.customerName}
                                  </span>
                                  <Badge
                                    variant={
                                      stop.priority === "urgent"
                                        ? "destructive"
                                        : stop.priority === "high"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {stop.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {stop.address}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {stop.deliveryWindow}
                                  </span>
                                  {stop.distance && (
                                    <span>
                                      {stop.distance < 1000
                                        ? `${Math.round(stop.distance)}m`
                                        : `${(stop.distance / 1000).toFixed(
                                            1
                                          )}km`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge
                                  variant={
                                    stop.status === "delivered"
                                      ? "default"
                                      : stop.status === "failed"
                                      ? "destructive"
                                      : "outline"
                                  }
                                >
                                  {stop.status}
                                </Badge>
                                {nextStop?.id === stop.id && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Next
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
