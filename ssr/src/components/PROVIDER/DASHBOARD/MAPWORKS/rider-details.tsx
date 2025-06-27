import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Star,
  Timer,
  Phone,
  Route,
  Navigation,
  MapIcon,
  Car,
  Bike,
  TrendingUp,
  Package,
  Calendar,
  User,
  CheckCircle,
  PlayCircle,
  Circle,
  Maximize2,
  Minimize2,
  Globe,
  Database,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ProcessedRider, RouteData, ServiceData } from "./serviceDataAndTypes";
import { getStatusColor } from "./hooks/mapUtilsNew";
// import { getStatusColor, parseRouteGeoJSON } from "./hooks/mapUtils";

interface RiderDetailsProps {
  rider: ProcessedRider;
  onBack: () => void;
  riderRoutes: Map<string, RouteData>;
  databaseRoutes: Map<string, RouteData>;
  serviceData: ServiceData[];
}

export function RiderDetails({ rider, onBack, riderRoutes, databaseRoutes }: RiderDetailsProps) {
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showGoogleRoute, setShowGoogleRoute] = useState(true);
  const [showDatabaseRoute, setShowDatabaseRoute] = useState(true);
  // const [isMobile, setIsMobile] = useState(false);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

  // // Check if mobile
  // useEffect(() => {
  //   const checkMobile = () => {
  //     setIsMobile(window.innerWidth < 768);
  //   };

  //   checkMobile();
  //   window.addEventListener("resize", checkMobile);
  //   return () => window.removeEventListener("resize", checkMobile);
  // }, []);

  // Get route data for this rider
  const googleRouteData = riderRoutes.get(rider.id);
  const databaseRouteData = databaseRoutes.get(rider.id);
  const hasRoutes = !!(googleRouteData || databaseRouteData);

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
    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
      updateMapContent();
    });

    map.on("error", (e) => {
      console.error("Rider details map error:", e);
    });

    return () => {
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
    ["google-route", "database-route", "google-route-arrows", "database-route-arrows"].forEach((layerId) => {
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
      scale: 1.2,
    })
      .setLngLat([rider.position.lng, rider.position.lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 bg-white rounded-lg shadow-lg">
          <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
            ${rider.vehicle === "Motorcycle" ? "🏍️" : "🚲"} ${rider.name}
          </h3>
          <p class="text-sm text-gray-600">${rider.location}</p>
          <div class="mt-2 text-xs font-medium" style="color: ${getStatusColor(rider.status)}">
            ${rider.status}
          </div>
        </div>
      `)
      )
      .addTo(mapInstance.current!);

    markersRef.current.push(riderMarker);

    // Add markers for current orders
    rider.currentOrders.forEach((service) => {
      if (service.type === 'ORDER' && service.orderData) {
        // Vendor marker
        if (service.vendor?.coordinates) {
          const vendorMarker = new maplibregl.Marker({
            color: "#10B981",
            scale: 1.0,
          })
            .setLngLat(service.vendor.coordinates)
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3 bg-white rounded-lg shadow-lg">
                <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  🏪 ${service.vendor.name}
                </h3>
                <p class="text-sm text-gray-600">${service.vendor.location}</p>
                <div class="mt-2 text-xs text-green-600 font-medium">Pickup Location</div>
              </div>
            `)
            )
            .addTo(mapInstance.current!);

          markersRef.current.push(vendorMarker);
        }

        // Customer marker
        if (service.orderData.order?.coordinates) {
          const customerMarker = new maplibregl.Marker({
            color: "#F59E0B",
            scale: 1.0,
          })
            .setLngLat(service.orderData.order.coordinates)
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3 bg-white rounded-lg shadow-lg">
                <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  🏠 ${service.customer.name}
                </h3>
                <p class="text-sm text-gray-600">${service.orderData!.order!.deliveryAddress}</p>
                <div class="mt-2 text-xs text-orange-600 font-medium">
                  Order: #${service.orderData!.orderId.slice(-6)}
                </div>
                ${service.orderData!.order!.distance ? `<div class="text-xs text-blue-600 mt-1">Distance: ${service.orderData!.order!.distance}</div>` : ""}
                ${service.orderData!.order!.duration ? `<div class="text-xs text-blue-600">Duration: ${service.orderData!.order!.duration}</div>` : ""}
              </div>
            `)
            )
            .addTo(mapInstance.current!);

          markersRef.current.push(customerMarker);
        }
      }
    });

    // Add markers for current bookings
    rider.currentBookings?.forEach((service) => {
      if (service.type === 'BOOKING' && service.bookingData) {
        // Pickup marker
        if (service.bookingData.pickupLocation) {
          const pickupMarker = new maplibregl.Marker({
            color: "#8B5CF6",
            scale: 1.0,
          })
            .setLngLat(service.bookingData.pickupLocation)
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3 bg-white rounded-lg shadow-lg">
                <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  📅 ${service.vendor.name}
                </h3>
                <p class="text-sm text-gray-600">${service.vendor.location}</p>
                <div class="mt-2 text-xs text-purple-600 font-medium">Pickup Location</div>
                <div class="text-xs text-gray-500">${service.bookingData.startTime}</div>
              </div>
            `)
            )
            .addTo(mapInstance.current!);

          markersRef.current.push(pickupMarker);
        }

        // Dropoff marker
        if (service.bookingData.dropoffLocation) {
          const dropoffMarker = new maplibregl.Marker({
            color: "#F59E0B",
            scale: 1.0,
          })
            .setLngLat(service.bookingData.dropoffLocation)
            .setPopup(
              new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div class="p-3 bg-white rounded-lg shadow-lg">
                <h3 class="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  🎯 ${service.customer.name}
                </h3>
                <p class="text-sm text-gray-600">${service.bookingData!.deliveryAddress}</p>
                <div class="mt-2 text-xs text-orange-600 font-medium">
                  Booking: #${service.bookingData!.bookingId.slice(-6)}
                </div>
                <div class="text-xs text-gray-500">Table Size: ${service.bookingData!.tableSize}</div>
                ${service.bookingData!.distance ? `<div class="text-xs text-blue-600 mt-1">Distance: ${service.bookingData!.distance}</div>` : ""}
                ${service.bookingData!.duration ? `<div class="text-xs text-blue-600">Duration: ${service.bookingData!.duration}</div>` : ""}
              </div>
            `)
            )
            .addTo(mapInstance.current!);

          markersRef.current.push(dropoffMarker);
        }
      }
    });

    // Add Google route if available and enabled
    if (googleRouteData && showGoogleRoute && googleRouteData.coordinates && googleRouteData.coordinates.length > 0) {
      const googleRouteGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: { source: "google" },
        geometry: {
          type: "LineString",
          coordinates: googleRouteData.coordinates,
        },
      };

      mapInstance.current.addSource("google-route", {
        type: "geojson",
        data: googleRouteGeoJSON ,
      });

      mapInstance.current.addLayer({
        id: "google-route",
        type: "line",
        source: "google-route",
        paint: {
          "line-color": googleRouteData.color || getStatusColor(rider.status),
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });

      // Add direction arrows for Google route
      mapInstance.current.addLayer({
        id: "google-route-arrows",
        type: "symbol",
        source: "google-route",
        layout: {
          "symbol-placement": "line",
          "text-field": "▶",
          "text-size": 12,
          "text-keep-upright": true,
          "symbol-spacing": 80,
          "text-rotation-alignment": "map",
        },
        paint: {
          "text-color": googleRouteData.color || getStatusColor(rider.status),
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });
    }

    // Add database route if available and enabled
    if (databaseRouteData && showDatabaseRoute && databaseRouteData.coordinates && databaseRouteData.coordinates.length > 0) {
      const databaseRouteGeoJSON: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: { source: "database" },
        geometry: {
          type: "LineString",
          coordinates: databaseRouteData.coordinates,
        },
      };

      mapInstance.current.addSource("database-route", {
        type: "geojson",
        data: databaseRouteGeoJSON,
      });

      mapInstance.current.addLayer({
        id: "database-route",
        type: "line",
        source: "database-route",
        paint: {
          "line-color": "#8B5CF6", // Purple color for database routes
          "line-width": 3,
          "line-opacity": 0.7,
          "line-dasharray": [3, 3], // Dashed line to distinguish from Google routes
        },
      });

      // Add direction arrows for database route
      mapInstance.current.addLayer({
        id: "database-route-arrows",
        type: "symbol",
        source: "database-route",
        layout: {
          "symbol-placement": "line",
          "text-field": "🗺️",
          "text-size": 10,
          "text-keep-upright": true,
          "symbol-spacing": 100,
          "text-rotation-alignment": "map",
        },
        paint: {
          "text-color": "#8B5CF6",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
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
        maxZoom: 15,
      });
    } else {
      // Just center on rider if no route
      mapInstance.current.flyTo({
        center: [rider.position.lng, rider.position.lat],
        zoom: 13,
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

  const calculateOrderTotal = (service: ServiceData) => {
    if (service.type === 'ORDER' && service.orderData?.productInfor) {
      const itemsTotal = service.orderData.productInfor.reduce((total, item) => {
        const productPrice = parseFloat(item.product[0]?.price || "0");
        return total + productPrice * item.quantity;
      }, 0);

      const deliveryFee = service.orderData.deliveryMetaData?.price || 0;
      return itemsTotal + deliveryFee;
    } else if (service.type === 'BOOKING' && service.bookingData?.deliveryFee) {
      return parseFloat(service.bookingData.deliveryFee);
    }
    return 0;
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

  // Create route stops for orders
  const createOrderStops = (service: ServiceData) => {
    if (service.type === 'ORDER' && service.orderData) {
      return [
        {
          id: `pickup-${service.orderData.orderId}`,
          address: service.vendor.location,
          type: "pickup" as const,
          status: service.orderData.status === "PREPARING" ? "current" : 
                 (service.orderData.status === "CONFIRMED" ? "pending" : "completed"),
          estimatedTime: "0 min",
          icon: "🏪",
        },
        {
          id: `delivery-${service.orderData.orderId}`,
          address: service.orderData.order.deliveryAddress,
          type: "delivery" as const,
          status: service.orderData.status === "OUT_FOR_DELIVERY" ? "current" : 
                 (service.orderData.status === "DELIVERED" ? "completed" : "pending"),
          estimatedTime: service.orderData.deliveryMetaData
            ? formatDeliveryDuration(service.orderData.deliveryMetaData.duration)
            : service.orderData.order.duration || "~30 min",
          icon: "🏠",
        },
      ];
    }
    return [];
  };

  // Create route stops for bookings
  const createBookingStops = (service: ServiceData) => {
    if (service.type === 'BOOKING' && service.bookingData) {
      return [
        {
          id: `pickup-${service.bookingData.bookingId}`,
          address: service.vendor.location,
          type: "pickup" as const,
          status: service.bookingData.isConfirmed ? "current" : "pending" as const,
          estimatedTime: service.bookingData.startTime,
          icon: "📅",
        },
        {
          id: `delivery-${service.bookingData.bookingId}`,
          address: service.bookingData.deliveryAddress,
          type: "delivery" as const,
          status: "pending" as const,
          estimatedTime: service.bookingData.duration || "~30 min",
          icon: "🎯",
        },
      ];
    }
    return [];
  };

  const totalEarnings = parseFloat(rider.earnings.replace("GH₵", ""));
  const totalServices = rider.currentOrders.length + (rider.currentBookings?.length || 0);
  const avgServiceValue = totalServices > 0 ? totalEarnings / totalServices : 0;

  return (
    <TooltipProvider>
      <ScrollArea className="mt-6 h-[calc(85vh-140px)]">
        <div className="space-y-4 md:space-y-6">
          {/* Enhanced Header */}
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl hover:bg-gray-100">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <div
                className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${getStatusGradient(rider.status)} rounded-2xl flex items-center justify-center shadow-lg`}
              >
                <span className="text-white font-bold text-lg md:text-xl">
                  {rider.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="absolute -top-2 -right-2">
                {rider.status === "Available" && (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-green-500 rounded-full border-3 border-white shadow-lg"></div>
                )}
                {rider.status === "On Delivery" && (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                )}
                {rider.status === "On Break" && (
                  <div className="w-5 h-5 md:w-6 md:h-6 bg-yellow-500 rounded-full border-3 border-white shadow-lg"></div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{rider.name}</h2>
                {getStatusBadge(rider.status)}
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getVehicleIcon(rider.vehicle)}
                  <span className="hidden sm:inline">{rider.vehicle}</span>
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Navigation className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{rider.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-blue-900 truncate">{totalEarnings.toFixed(2)}</p>
                    <p className="text-xs md:text-sm text-blue-700 font-medium">Total Earnings (GH₵)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-orange-900">{rider.orders}</p>
                    <p className="text-xs md:text-sm text-orange-700 font-medium">Orders Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-purple-900">{rider.bookings || 0}</p>
                    <p className="text-xs md:text-sm text-purple-700 font-medium">Bookings Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Star className="h-5 w-5 md:h-6 md:w-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg md:text-2xl font-bold text-green-900">{rider.rating.toFixed(1)}</p>
                    <p className="text-xs md:text-sm text-green-700 font-medium">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                    <span className="text-base md:text-lg font-bold text-gray-900">{rider.rating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Customer Rating</p>
                </div>

                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                  <p className="text-base md:text-lg font-bold text-gray-900">GH₵{avgServiceValue.toFixed(2)}</p>
                  <p className="text-xs text-gray-600 font-medium">Avg Service Value</p>
                </div>

                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Timer className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">{rider.lastActive}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Location & Navigation with Functional Map */}
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
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
                <div className="flex gap-2 mb-4 flex-wrap">
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
                  isMapExpanded ? "h-60 md:h-80" : "h-32 md:h-40"
                }`}
              >
                <div ref={mapRef} className="w-full h-full">
                  {!mapLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                      <div className="text-center z-10">
                        <MapIcon className="h-8 w-8 md:h-10 md:w-10 mx-auto text-blue-500 mb-2 animate-pulse" />
                        <p className="text-sm font-semibold text-blue-700">Loading Live Map...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Map overlay info */}
                {mapLoaded && hasRoutes && (
                  <div className="absolute top-3 left-3 space-y-1">
                    {googleRouteData && showGoogleRoute && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1 md:py-2 shadow-md">
                        <div className="text-xs font-medium text-gray-900 flex items-center gap-1">
                          <Globe className="h-3 w-3 text-blue-500" />📍 {googleRouteData.distance.toFixed(1)}km •{" "}
                          {Math.round(googleRouteData.duration / 60)}min
                        </div>
                      </div>
                    )}
                    {databaseRouteData && showDatabaseRoute && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-2 md:px-3 py-1 md:py-2 shadow-md">
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
                    <div
                      className={`w-2 h-2 rounded-full ${mapLoaded ? "bg-green-500" : "bg-yellow-500"} animate-pulse`}
                    ></div>
                    <span className="text-xs font-medium text-gray-700">{mapLoaded ? "Live" : "Loading"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 font-medium mb-1">Current Location</p>
                  <p className="font-semibold text-gray-900 text-xs truncate">{rider.location}</p>
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
                          <span className="font-medium text-blue-900 ml-1">
                            {googleRouteData.distance.toFixed(1)} km
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-600">ETA:</span>
                          <span className="font-medium text-blue-900 ml-1">
                            {Math.round(googleRouteData.duration / 60)} min
                          </span>
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
                          <span className="font-medium text-purple-900 ml-1">
                            {databaseRouteData.distance.toFixed(1)} km
                          </span>
                        </div>
                        <div>
                          <span className="text-purple-600">ETA:</span>
                          <span className="font-medium text-purple-900 ml-1">
                            {Math.round(databaseRouteData.duration / 60)} min
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Services with Enhanced Design */}
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
                </div>
                Current Services
                <Badge variant="outline" className="ml-2">
                  {totalServices}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalServices === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="flex gap-1">
                      <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                      <Calendar className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">No Active Services</h4>
                  <p className="text-sm text-gray-500">This rider is available for new assignments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Render Orders */}
                  {rider.currentOrders.map((service) => (
                    <div
                      key={`order-${service.id}`}
                      className="border border-gray-200 rounded-xl p-3 md:p-4 bg-gradient-to-r from-orange-50 to-white"
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 md:h-5 md:w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                              Order #{service.orderData!.orderId.slice(-6)}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {service.orderData!.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base md:text-lg font-bold text-gray-900">
                            GH₵{calculateOrderTotal(service).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ETA: {service.orderData!.order.duration || 
                                  (service.orderData!.deliveryMetaData
                                    ? formatDeliveryDuration(service.orderData!.deliveryMetaData.duration)
                                    : "~30 min")}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                              {service.customer.name}
                            </p>
                            <p className="text-xs text-gray-600">{service.customer.number}</p>
                          </div>
                        </div>
                      </div>

                      {/* Route Stops */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Route className="h-4 w-4" />
                          Delivery Route
                          {service.orderData!.routeData && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Database className="h-3 w-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </h5>
                        {createOrderStops(service).map((stop) => (
                          <div key={stop.id} className="flex items-center gap-3 md:gap-4 p-3 bg-white rounded-lg">
                            <div className="flex-shrink-0">{getStopIcon(stop.type, stop.status)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-base md:text-lg">{stop.icon}</span>
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {stop.address.split(",")[0]}
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
                              {stop.type === "delivery" && service.orderData!.order.distance && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Distance: {service.orderData!.order.distance} • Duration: {service.orderData!.order.duration}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Render Bookings */}
                  {rider.currentBookings?.map((service) => (
                    <div
                      key={`booking-${service.id}`}
                      className="border border-gray-200 rounded-xl p-3 md:p-4 bg-gradient-to-r from-purple-50 to-white"
                    >
                      {/* Booking Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                              Booking #{service.bookingData!.bookingId.slice(-6)}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {service.bookingData!.isConfirmed ? "Confirmed" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base md:text-lg font-bold text-gray-900">
                            GH₵{calculateOrderTotal(service).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {service.bookingData!.startTime} - {service.bookingData!.endTime}
                          </p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-white rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                              {service.customer.name}
                            </p>
                            <p className="text-xs text-gray-600">{service.customer.number}</p>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Route className="h-4 w-4" />
                          Booking Details
                          {service.bookingData!.routeData && (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              <Database className="h-3 w-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </h5>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Table Size</p>
                            <p className="font-medium text-gray-900">{service.bookingData!.tableSize} people</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Day</p>
                            <p className="font-medium text-gray-900">{service.bookingData!.day}</p>
                          </div>
                        </div>

                        {createBookingStops(service).map((stop) => (
                          <div key={stop.id} className="flex items-center gap-3 md:gap-4 p-3 bg-white rounded-lg">
                            <div className="flex-shrink-0">{getStopIcon(stop.type, stop.status)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-base md:text-lg">{stop.icon}</span>
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {stop.address.split(",")[0]}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${stop.type === "pickup" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}
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
                                  `Time: ${stop.estimatedTime}`
                                )}
                              </p>
                              {stop.type === "delivery" && service.bookingData!.distance && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Distance: {service.bookingData!.distance} • Duration: {service.bookingData!.duration}
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
          <div className="grid grid-cols-2 gap-3 md:gap-4 pb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl h-10 md:h-12 font-medium"
                  onClick={() => window.open(`tel:${rider.phone}`, "_self")}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Rider
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Call {rider.name}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl h-10 md:h-12 font-medium border-blue-200 text-blue-700 hover:bg-blue-50"
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Focus on route in map</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}