// Complete Updated RiderDetails.tsx with database route support
import React, { useRef, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MapPin, 
  Phone, 
  Star, 
  Package, 
  Route, 
  Navigation, 
  ArrowLeft,
  Clock,
  User,
  DollarSign,
  CheckCircle,
  Circle,
  PlayCircle,
  Car,
  Bike,
  TrendingUp,
  Timer,
  MapIcon,
  Maximize2,
  Minimize2,
  Database,
  Globe
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Import types
interface Product {
  id: string
  name: string
  price: string
  state: string
}

interface ProductInfo {
  product: Product[]
  quantity: number
}

interface Vendor {
  id: string
  name: string
  location: string
  coordinates: [number, number]
}

interface Customer {
  name: string
  dpfile: string | null
  number: string
}

interface RiderInfo {
  id: string
  name: string
  number: string
  location: string
  coordinates?: [number, number]
}

interface OrderItem {
  id: string
  orderId: string
  quantity: number
  itemType: string
  product: Product | null
}

interface RouteInfo {
  id: string
  orderId: string
  geojson: string
  userId: string
  createdAt?: string
}

interface Order {
  id: string
  coordinates: [number, number]
  deliveryAddress: string
  items: OrderItem[]
  distance?: string
  duration?: string
  routeData?: RouteInfo | null
}

interface ZoneMetaData {
  id: string
  price: number
  duration: number
  distance: number
  zone: number
  geojson?: string
  isochroneId?: string
}

interface OrderData {
  orderId: string
  createdAt: string
  status: string
  vendor: Vendor
  productInfor: ProductInfo[]
  customer: Customer
  rider: RiderInfo | null
  order: Order
  deliveryMetaData?: ZoneMetaData | null
}

interface ProcessedRider {
  id: string
  name: string
  status: "Available" | "On Delivery" | "On Break"
  location: string
  orders: number
  rating: number
  phone: string
  vehicle: string
  lastActive: string
  earnings: string
  currentOrders: OrderData[]
  position: { lat: number; lng: number }
  direction: number
  routeCoordinates?: [number, number][]
}

interface RouteData {
  coordinates: [number, number][]
  distance: number
  duration: number
  color: string
  summary: string
  legs: number
}

interface ParsedRouteData {
  coordinates: [number, number][]
  distance: string
  duration: string
  summary: string
}

interface RiderDetailsProps {
  rider: ProcessedRider;
  onBack: () => void;
  riderRoutes: Map<string, RouteData>; // Google routes
  databaseRoutes: Map<string, RouteData>; // Database routes
  orders: OrderData[];
}

// Utility functions
const getStatusColor = (status: string): string => {
  switch (status) {
    case "Available":
      return "#10B981"
    case "On Delivery":
      return "#3B82F6"
    case "On Break":
      return "#F59E0B"
    default:
      return "#6B7280"
  }
}

const parseRouteGeoJSON = (geojsonString: string): ParsedRouteData | null => {
  try {
    const geoJSON = JSON.parse(geojsonString)
    
    if (geoJSON.type === "Feature" && geoJSON.geometry?.type === "LineString") {
      return {
        coordinates: geoJSON.geometry.coordinates,
        distance: geoJSON.metadata?.distance || "0 km",
        duration: geoJSON.metadata?.duration || "0 min",
        summary: geoJSON.metadata?.summary || "Route"
      }
    }
    
    return null
  } catch (error) {
    console.error("Error parsing route GeoJSON:", error)
    return null
  }
}

export function RiderDetails({ rider, onBack, riderRoutes, databaseRoutes, orders }: RiderDetailsProps) {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showGoogleRoute, setShowGoogleRoute] = useState(true);
  const [showDatabaseRoute, setShowDatabaseRoute] = useState(true);
  
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // Get route data for this rider
  const googleRouteData = riderRoutes.get(rider.id);
  const databaseRouteData = databaseRoutes.get(rider.id);
  const hasRoutes = googleRouteData || databaseRouteData;

  // Initialize map when component mounts or when expanded
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json";

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: [rider.position.lng, rider.position.lat],
      zoom: 13,
      attributionControl: false,
    });

    mapInstance.current = map;

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on("load", () => {
      setMapLoaded(true);
      updateMapContent();
    });

    map.on("error", (e) => {
      console.error("Rider details map error:", e);
    });

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [rider.position, maptilerApiKey]);

  // Update map content when data changes
  const updateMapContent = () => {
    if (!mapInstance.current || !mapLoaded) return;

    // Clear existing markers and layers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Remove existing route layers
    ['google-route', 'database-route', 'google-route-arrows', 'database-route-arrows'].forEach(layerId => {
      if (mapInstance.current!.getLayer(layerId)) {
        mapInstance.current!.removeLayer(layerId);
      }
      if (mapInstance.current!.getSource(layerId)) {
        mapInstance.current!.removeSource(layerId);
      }
    });

    // Add rider marker
    const riderMarker = new maplibregl.Marker({ 
      color: getStatusColor(rider.status), 
      scale: 1.2 
    })
      .setLngLat([rider.position.lng, rider.position.lat])
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 bg-white rounded-lg shadow-lg">
          <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            ${rider.vehicle === "Motorcycle" ? "🏍️" : "🚲"} ${rider.name}
          </h3>
          <p class="text-sm text-gray-600">${rider.location}</p>
          <div class="mt-2 text-xs font-medium" style="color: ${getStatusColor(rider.status)}">
            ${rider.status}
          </div>
        </div>
      `))
      .addTo(mapInstance.current!);
    
    markersRef.current.push(riderMarker);

    // Add markers for current orders
    rider.currentOrders.forEach((order) => {
      // Vendor marker
      const vendorMarker = new maplibregl.Marker({ 
        color: "#10B981", 
        scale: 1.0 
      })
        .setLngLat(order.vendor.coordinates)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-3 bg-white rounded-lg shadow-lg">
            <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              🏪 ${order.vendor.name}
            </h3>
            <p class="text-sm text-gray-600">${order.vendor.location}</p>
            <div class="mt-2 text-xs text-green-600 font-medium">Pickup Location</div>
          </div>
        `))
        .addTo(mapInstance.current!);
      
      markersRef.current.push(vendorMarker);

      // Customer marker
      const customerMarker = new maplibregl.Marker({ 
        color: "#F59E0B", 
        scale: 1.0 
      })
        .setLngLat(order.order.coordinates)
        .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`
          <div class="p-3 bg-white rounded-lg shadow-lg">
            <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              🏠 ${order.customer.name}
            </h3>
            <p class="text-sm text-gray-600">${order.order.deliveryAddress}</p>
            <div class="mt-2 text-xs text-orange-600 font-medium">
              Order: #${order.orderId.slice(-6)}
            </div>
            ${order.order.distance ? `<div class="text-xs text-blue-600 mt-1">Distance: ${order.order.distance}</div>` : ''}
            ${order.order.duration ? `<div class="text-xs text-blue-600">Duration: ${order.order.duration}</div>` : ''}
          </div>
        `))
        .addTo(mapInstance.current!);
      
      markersRef.current.push(customerMarker);
    });

    // Add Google route if available and enabled
    if (googleRouteData && showGoogleRoute && googleRouteData.coordinates && googleRouteData.coordinates.length > 0) {
      const googleRouteGeoJSON = {
        type: "Feature",
        properties: { source: "google" },
        geometry: {
          type: "LineString",
          coordinates: googleRouteData.coordinates
        }
      };

      mapInstance.current.addSource('google-route', {
        type: 'geojson',
        data: googleRouteGeoJSON
      });

      mapInstance.current.addLayer({
        id: 'google-route',
        type: 'line',
        source: 'google-route',
        paint: {
          'line-color': googleRouteData.color || getStatusColor(rider.status),
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add direction arrows for Google route
      mapInstance.current.addLayer({
        id: 'google-route-arrows',
        type: 'symbol',
        source: 'google-route',
        layout: {
          'symbol-placement': 'line',
          'text-field': '▶',
          'text-size': 12,
          'text-keep-upright': true,
          'symbol-spacing': 80,
          'text-rotation-alignment': 'map'
        },
        paint: {
          'text-color': googleRouteData.color || getStatusColor(rider.status),
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

    // Add database route if available and enabled
    if (databaseRouteData && showDatabaseRoute && databaseRouteData.coordinates && databaseRouteData.coordinates.length > 0) {
      const databaseRouteGeoJSON = {
        type: "Feature",
        properties: { source: "database" },
        geometry: {
          type: "LineString",
          coordinates: databaseRouteData.coordinates
        }
      };

      mapInstance.current.addSource('database-route', {
        type: 'geojson',
        data: databaseRouteGeoJSON
      });

      mapInstance.current.addLayer({
        id: 'database-route',
        type: 'line',
        source: 'database-route',
        paint: {
          'line-color': '#8B5CF6', // Purple color for database routes
          'line-width': 3,
          'line-opacity': 0.7,
          'line-dasharray': [3, 3] // Dashed line to distinguish from Google routes
        }
      });

      // Add direction arrows for database route
      mapInstance.current.addLayer({
        id: 'database-route-arrows',
        type: 'symbol',
        source: 'database-route',
        layout: {
          'symbol-placement': 'line',
          'text-field': '🗺️',
          'text-size': 10,
          'text-keep-upright': true,
          'symbol-spacing': 100,
          'text-rotation-alignment': 'map'
        },
        paint: {
          'text-color': '#8B5CF6',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }

    // Fit map to show route or just center on rider
    if (hasRoutes) {
      const bounds = new maplibregl.LngLatBounds();
      
      // Include route coordinates in bounds
      if (googleRouteData && showGoogleRoute) {
        googleRouteData.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
      }
      
      if (databaseRouteData && showDatabaseRoute) {
        databaseRouteData.coordinates.forEach((coord: [number, number]) => {
          bounds.extend(coord);
        });
      }
      
      // Add some padding and include rider position
      bounds.extend([rider.position.lng, rider.position.lat]);
      
      mapInstance.current.fitBounds(bounds, { 
        padding: 50,
        maxZoom: 15
      });
    } else {
      // Just center on rider if no route
      mapInstance.current.flyTo({
        center: [rider.position.lng, rider.position.lat],
        zoom: 13
      });
    }
  };

  // Update map when rider data or route visibility changes
  useEffect(() => {
    updateMapContent();
  }, [rider, riderRoutes, databaseRoutes, mapLoaded, showGoogleRoute, showDatabaseRoute]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Available
          </Badge>
        );
      case "On Delivery":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
            On Delivery
          </Badge>
        );
      case "On Break":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-medium">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            On Break
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStopIcon = (type: string, status: string) => {
    if (status === "completed") {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status === "current") {
      return <PlayCircle className="w-4 h-4 text-blue-500 animate-pulse" />;
    } else {
      return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "Available":
        return "from-green-500 to-emerald-600";
      case "On Delivery":
        return "from-blue-500 to-blue-600";
      case "On Break":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getVehicleIcon = (vehicle: string) => {
    return vehicle === "Motorcycle" ? (
      <Car className="h-5 w-5 text-blue-600" />
    ) : (
      <Bike className="h-5 w-5 text-green-600" />
    );
  };

  const calculateTotalAmount = (order: OrderData) => {
    const itemsTotal = order.productInfor.reduce((total, item) => {
      const productPrice = parseFloat(item.product[0]?.price || "0");
      return total + (productPrice * item.quantity);
    }, 0);
    
    const deliveryFee = order.deliveryMetaData?.price || 0;
    return itemsTotal + deliveryFee;
  };

  const formatDeliveryDuration = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  // Create route stops for each order
  const createOrderStops = (order: OrderData) => {
    return [
      {
        id: `pickup-${order.orderId}`,
        address: order.vendor.location,
        type: "pickup" as const,
        status: order.status === "PREPARING" ? "current" : (order.status === "CONFIRMED" ? "pending" : "completed") as const,
        estimatedTime: "0 min",
        icon: "🏪"
      },
      {
        id: `delivery-${order.orderId}`,
        address: order.order.deliveryAddress,
        type: "delivery" as const,
        status: order.status === "OUT_FOR_DELIVERY" ? "current" : (order.status === "DELIVERED" ? "completed" : "pending") as const,
        estimatedTime: order.deliveryMetaData ? formatDeliveryDuration(order.deliveryMetaData.duration) : order.order.duration || "~30 min",
        icon: "🏠"
      }
    ];
  };

  const totalEarnings = parseFloat(rider.earnings.replace('GH₵', ''));
  const avgOrderValue = rider.orders > 0 ? totalEarnings / rider.orders : 0;

  return (
    <ScrollArea className="mt-6 h-[calc(85vh-140px)]">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="relative">
            <div className={`w-16 h-16 bg-gradient-to-br ${getStatusGradient(rider.status)} rounded-2xl flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xl">
                {rider.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="absolute -top-2 -right-2">
              {rider.status === "Available" && (
                <div className="w-6 h-6 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
              )}
              {rider.status === "On Delivery" && (
                <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
              )}
              {rider.status === "On Break" && (
                <div className="w-6 h-6 bg-yellow-500 rounded-full border-3 border-white shadow-lg"></div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{rider.name}</h2>
              {getStatusBadge(rider.status)}
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                {getVehicleIcon(rider.vehicle)}
                {rider.vehicle}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                {rider.location}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{totalEarnings.toFixed(2)}</p>
                  <p className="text-sm text-blue-700 font-medium">Total Earnings (GH₵)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">{rider.orders}</p>
                  <p className="text-sm text-green-700 font-medium">Orders Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-lg font-bold text-gray-900">{rider.rating.toFixed(1)}</span>
                </div>
                <p className="text-xs text-gray-600 font-medium">Customer Rating</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-lg font-bold text-gray-900">GH₵{avgOrderValue.toFixed(2)}</p>
                <p className="text-xs text-gray-600 font-medium">Avg Order Value</p>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Timer className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-xs text-gray-600 font-medium">{rider.lastActive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Location & Navigation with Functional Map */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-blue-500" />
                Live Location & Routes
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="rounded-lg"
              >
                {isMapExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Route Toggle Controls */}
            {hasRoutes && (
              <div className="flex gap-2 mb-4">
                {googleRouteData && (
                  <Button
                    variant={showGoogleRoute ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowGoogleRoute(!showGoogleRoute)}
                    className="text-xs"
                  >
                    <Globe className="h-3 w-3 mr-1" />
                    Google Route
                  </Button>
                )}
                {databaseRouteData && (
                  <Button
                    variant={showDatabaseRoute ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowDatabaseRoute(!showDatabaseRoute)}
                    className="text-xs"
                  >
                    <Database className="h-3 w-3 mr-1" />
                    Saved Route
                  </Button>
                )}
              </div>
            )}

            <div 
              className={`bg-gray-100 rounded-xl mb-4 relative overflow-hidden transition-all duration-300 ${
                isMapExpanded ? 'h-80' : 'h-40'
              }`}
            >
              <div ref={mapRef} className="w-full h-full">
                {!mapLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                    <div className="text-center z-10">
                      <MapIcon className="h-10 w-10 mx-auto text-blue-500 mb-2 animate-pulse" />
                      <p className="text-sm font-semibold text-blue-700">Loading Live Map...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Map overlay info */}
              {mapLoaded && hasRoutes && (
                <div className="absolute top-3 left-3 space-y-1">
                  {googleRouteData && showGoogleRoute && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                      <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                        <Globe className="h-3 w-3 text-blue-500" />
                        📍 {googleRouteData.distance.toFixed(1)}km • {Math.round(googleRouteData.duration / 60)}min
                      </div>
                    </div>
                  )}
                  {databaseRouteData && showDatabaseRoute && (
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
                      <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                        <Database className="h-3 w-3 text-purple-500" />
                        🗺️ {databaseRouteData.distance.toFixed(1)}km • {Math.round(databaseRouteData.duration / 60)}min
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Map status indicator */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-md">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${mapLoaded ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                  <span className="text-xs font-medium text-gray-700">
                    {mapLoaded ? 'Live' : 'Loading'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-600 font-medium mb-1">Current Location</p>
                <p className="font-semibold text-gray-900 text-xs">{rider.location}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-600 font-medium mb-1">Last Update</p>
                <p className="font-semibold text-gray-900 text-xs">{rider.lastActive}</p>
              </div>
            </div>
            
            {/* Route Information */}
            {hasRoutes && (
              <div className="mt-4 space-y-3">
                {googleRouteData && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Google Route</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-blue-600">Distance:</span>
                        <span className="font-medium text-blue-900 ml-1">{googleRouteData.distance.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-blue-600">ETA:</span>
                        <span className="font-medium text-blue-900 ml-1">{Math.round(googleRouteData.duration / 60)} min</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {databaseRouteData && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Saved Route</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-purple-600">Distance:</span>
                        <span className="font-medium text-purple-900 ml-1">{databaseRouteData.distance.toFixed(1)} km</span>
                      </div>
                      <div>
                        <span className="text-purple-600">ETA:</span>
                        <span className="font-medium text-purple-900 ml-1">{Math.round(databaseRouteData.duration / 60)} min</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Orders with Enhanced Design */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Current Orders
              <Badge variant="outline" className="ml-2">
                {rider.currentOrders.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rider.currentOrders.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-900 mb-2">No Active Orders</h4>
                <p className="text-sm text-gray-500">This rider is available for new assignments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rider.currentOrders.map((order, index) => (
                  <div key={order.orderId} className="border border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">#{order.orderId.slice(-2)}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Order #{order.orderId.slice(-6)}</h4>
                          <Badge variant="outline" className="text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          GH₵{calculateTotalAmount(order).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ETA: {order.order.duration || (order.deliveryMetaData ? formatDeliveryDuration(order.deliveryMetaData.duration) : "~30 min")}
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.customer.name}</p>
                          <p className="text-xs text-gray-600">{order.customer.number}</p>
                        </div>
                      </div>
                    </div>

                    {/* Route Stops */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Route className="h-4 w-4" />
                        Delivery Route
                        {order.order.routeData && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Database className="h-3 w-3 mr-1" />
                            Saved
                          </Badge>
                        )}
                      </h5>
                      {createOrderStops(order).map((stop, stopIndex) => (
                        <div key={stop.id} className="flex items-center gap-4 p-3 bg-white rounded-lg">
                          <div className="flex-shrink-0">
                            {getStopIcon(stop.type, stop.status)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{stop.icon}</span>
                              <span className="text-sm font-medium text-gray-900">
                                {stop.address.split(',')[0]}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${stop.type === "pickup" ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}
                              >
                                {stop.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {stop.status === "completed" ? (
                                <span className="text-green-600 font-medium">✓ Completed</span>
                              ) : stop.status === "current" ? (
                                <span className="text-blue-600 font-medium">🚚 In Progress</span>
                              ) : (
                                `ETA: ${stop.estimatedTime}`
                              )}
                            </p>
                            {stop.type === "delivery" && order.order.distance && (
                              <p className="text-xs text-gray-500 mt-1">
                                Distance: {order.order.distance} • Duration: {order.order.duration}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pb-6">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-12 font-medium"
            onClick={() => window.open(`tel:${rider.phone}`, '_self')}
          >
            <Phone className="h-4 w-4 mr-2" />
            Call Rider
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl h-12 font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => {
              if (mapInstance.current && hasRoutes) {
                // Focus on the route
                const bounds = new maplibregl.LngLatBounds();
                
                if (googleRouteData && showGoogleRoute) {
                  googleRouteData.coordinates.forEach((coord: [number, number]) => {
                    bounds.extend(coord);
                  });
                }
                
                if (databaseRouteData && showDatabaseRoute) {
                  databaseRouteData.coordinates.forEach((coord: [number, number]) => {
                    bounds.extend(coord);
                  });
                }
                
                if (!bounds.isEmpty()) {
                  mapInstance.current.fitBounds(bounds, { padding: 50 });
                  setIsMapExpanded(true);
                }
              }
            }}
          >
            <Route className="h-4 w-4 mr-2" />
            Focus Route
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}