import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Star,
  Timer,
  Phone,
  Route,
  Navigation,
  Car,
  Bike,
  TrendingUp,
  Package,
  Calendar,
  User,
  CheckCircle,
  PlayCircle,
  Circle,
  Database,
} from "lucide-react";
import type {
  ProcessedRider,
  RouteData,
  ServiceData,
} from "./serviceDataAndTypes";

interface RiderDetailsProps {
  rider: ProcessedRider;
  onBack: () => void;
  riderRoutes: Map<string, RouteData>;
  databaseRoutes: Map<string, RouteData>;
  serviceData: ServiceData[];
   onViewOnLiveMap?: (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => void;
}

export function RiderDetails({
  rider,
  onBack,
  riderRoutes,
  databaseRoutes,
  serviceData,
    onViewOnLiveMap,

}: RiderDetailsProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Get route data for this rider
  const googleRouteData = riderRoutes.get(rider.id);
  const databaseRouteData = databaseRoutes.get(rider.id);
  const hasRoutes = !!(googleRouteData || databaseRouteData);

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
    if (service.type === "ORDER" && service.orderData?.productInfor) {
      const itemsTotal = service.orderData.productInfor.reduce(
        (total, item) => {
          const productPrice = parseFloat(item.product[0]?.price || "0");
          return total + productPrice * item.quantity;
        },
        0
      );

      const deliveryFee = service.orderData.deliveryMetaData?.price || 0;
      return itemsTotal + deliveryFee;
    } else if (service.type === "BOOKING" && service.bookingData?.deliveryFee) {
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
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  // Create route stops for orders
  const createOrderStops = (service: ServiceData) => {
    if (service.type === "ORDER" && service.orderData) {
      return [
        {
          id: `pickup-${service.orderData.orderId}`,
          address: service.vendor.location,
          type: "pickup" as const,
          status:
            service.orderData.status === "PREPARING"
              ? "current"
              : ((service.orderData.status === "CONFIRMED"
                  ? "pending"
                  : "completed") as const),
          estimatedTime: "0 min",
          icon: "🏪",
        },
        {
          id: `delivery-${service.orderData.orderId}`,
          address: service.orderData.order.deliveryAddress,
          type: "delivery" as const,
          status:
            service.orderData.status === "OUT_FOR_DELIVERY"
              ? "current"
              : ((service.orderData.status === "DELIVERED"
                  ? "completed"
                  : "pending") as const),
          estimatedTime: service.orderData.deliveryMetaData
            ? formatDeliveryDuration(
                service.orderData.deliveryMetaData.duration
              )
            : service.orderData.order.duration || "~30 min",
          icon: "🏠",
        },
      ];
    }
    return [];
  };

  // Create route stops for bookings
  const createBookingStops = (service: ServiceData) => {
    if (service.type === "BOOKING" && service.bookingData) {
      return [
        {
          id: `pickup-${service.bookingData.bookingId}`,
          address: service.vendor.location,
          type: "pickup" as const,
          status: service.bookingData.isConfirmed
            ? "current"
            : ("pending" as const),
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
 // Handle view on live map
  const handleViewOnLiveMap = (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => {
    if (onViewOnLiveMap) {
      // let idShort = entityId;
      // if (typeof entityId === "string" && entityId.length >= 6) {
      //   idShort = entityId.slice(-6);
      // }
      onViewOnLiveMap(entityId, entityType);
    }
    onBack();
  };
  const totalEarnings = parseFloat(rider.earnings.replace("GH₵", ""));
  const totalServices =
    rider.currentOrders.length + (rider.currentBookings?.length || 0);
  const avgServiceValue = totalServices > 0 ? totalEarnings / totalServices : 0;
  return (
    <TooltipProvider>
      <ScrollArea className="mt-6 px-1 h-[100%]">
        <div className="space-y-4 b md:space-y-6">
          {/* Enhanced Header */}
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="rounded-xl hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <div
                className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${getStatusGradient(
                  rider.status
                )} rounded-2xl flex items-center justify-center shadow-lg`}
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
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {rider.name}
                </h2>
                {getStatusBadge(rider.status)}
              </div>
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <Badge variant="outline" className="flex items-center gap-1">
                  {getVehicleIcon(rider.vehicle)}
                  <span className="hidden sm:inline">{rider.vehicle}</span>
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Navigation className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate text-xs" title={rider.location}>
                    {rider.location.split(",")[0]}
                    {rider.location.includes(",") && "..."}
                  </span>
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
                    <p className="text-lg md:text-2xl font-bold text-blue-900 truncate">
                      {totalEarnings.toFixed(2)}
                    </p>
                    <p className="text-xs md:text-sm text-blue-700 font-medium">
                      Total Earnings (GH₵)
                    </p>
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
                    <p className="text-lg md:text-2xl font-bold text-orange-900">
                      {rider.orders}
                    </p>
                    <p className="text-xs md:text-sm text-orange-700 font-medium">
                      Orders Today
                    </p>
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
                    <p className="text-lg md:text-2xl font-bold text-purple-900">
                      {rider.bookings || 0}
                    </p>
                    <p className="text-xs md:text-sm text-purple-700 font-medium">
                      Bookings Today
                    </p>
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
                    <p className="text-lg md:text-2xl font-bold text-green-900">
                      {rider.rating.toFixed(1)}
                    </p>
                    <p className="text-xs md:text-sm text-green-700 font-medium">
                      Rating
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
                    handleViewOnLiveMap(
                                    rider?.name ,
                                     
                                    "rider"
                                  );
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  View Location
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Open location in maps</p>
              </TooltipContent>
            </Tooltip>
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
                    <span className="text-base md:text-lg font-bold text-gray-900">
                      {rider.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    Customer Rating
                  </p>
                </div>

                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                  <p className="text-base md:text-lg font-bold text-gray-900">
                    GH₵{avgServiceValue.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    Avg Service Value
                  </p>
                </div>

                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Timer className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">
                    {rider.lastActive}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Location & Contact Info */}
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-3 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Navigation className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                Location & Contact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 font-medium mb-1">
                    Current Location
                  </p>
                  <p className="font-semibold text-gray-900 text-xs">
                    {rider.location}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 font-medium mb-1">Last Update</p>
                  <p className="font-semibold text-gray-900 text-xs">
                    {rider.lastActive}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 font-medium mb-1">Phone Number</p>
                  <p className="font-semibold text-gray-900 text-xs">
                    {rider.phone}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600 font-medium mb-1">Vehicle Type</p>
                  <div className="flex items-center gap-2">
                    {rider.vehicle === "Motorcycle" ? (
                      <Car className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bike className="h-4 w-4 text-green-600" />
                    )}
                    <p className="font-semibold text-gray-900 text-xs">
                      {rider.vehicle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              {hasRoutes && (
                <div className="mt-4 space-y-3">
                  <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Route Information
                  </h5>

                  {googleRouteData && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium text-blue-900">
                          Google Route
                        </span>
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
                        <span className="text-sm font-medium text-purple-900">
                          Saved Route
                        </span>
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
            
            <CardContent className="p-0">
              {totalServices === 0 ? (
                <div className="text-center py-6 md:py-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="flex gap-1">
                      <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
                      <Calendar className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    No Active Services
                  </h4>
                  <p className="text-sm text-gray-500">
                    This rider is available for new assignments
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Render Orders */}
                  {rider.currentOrders.map((service, index) => (
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
                            ETA:{" "}
                            {service.orderData!.order.duration ||
                              (service.orderData!.deliveryMetaData
                                ? formatDeliveryDuration(
                                    service.orderData!.deliveryMetaData.duration
                                  )
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
                            <p className="text-xs text-gray-600">
                              {service.customer.number}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Route Stops */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Route className="h-4 w-4" />
                          Delivery Route
                          {service.orderData!.routeData && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                            >
                              <Database className="h-3 w-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </h5>
                        {createOrderStops(service).map((stop, stopIndex) => (
                          <div
                            key={stop.id}
                            className="flex items-center gap-3 md:gap-4 p-3 bg-white rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              {getStopIcon(stop.type, stop.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-base md:text-lg">
                                  {stop.icon}
                                </span>
                                <span className="text-sm font-medium text-gray-900 truncate">
                                  {stop.address.split(",")[0]}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    stop.type === "pickup"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-orange-50 text-orange-700 border-orange-200"
                                  }`}
                                >
                                  {stop.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                {stop.status === "completed" ? (
                                  <span className="text-green-600 font-medium">
                                    ✓ Completed
                                  </span>
                                ) : stop.status === "current" ? (
                                  <span className="text-blue-600 font-medium">
                                    🚚 In Progress
                                  </span>
                                ) : (
                                  `ETA: ${stop.estimatedTime}`
                                )}
                              </p>
                              {stop.type === "delivery" &&
                                service.orderData!.order.distance && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Distance:{" "}
                                    {service.orderData!.order.distance} •
                                    Duration:{" "}
                                    {service.orderData!.order.duration}
                                  </p>
                                )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Render Bookings */}
                  {rider.currentBookings?.map((service, index) => (
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
                              Booking #
                              {service.bookingData!.bookingId.slice(-6)}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {service.bookingData!.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base md:text-lg font-bold text-gray-900">
                            GH₵{calculateOrderTotal(service).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              service.bookingData!.startTime
                            ).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}{" "}
                            -{" "}
                            {new Date(
                              service.bookingData!.endTime
                            ).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
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
                            <p className="text-xs text-gray-600">
                              {service.customer.number}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Route className="h-4 w-4" />
                          Booking Details
                          {service.bookingData!.routeData && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                            >
                              <Database className="h-3 w-3 mr-1" />
                              Saved
                            </Badge>
                          )}
                        </h5>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">
                              Package 
                            </p>
                            <p className="font-medium text-gray-900">
                              {service.bookingData!.tableSize}   ${Number(service?.bookingData!.tableSize) === 1 ? 'item' : 'items'}

                            </p>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-xs text-gray-600 mb-1">Day</p>
                            <p className="font-medium text-gray-900">
                              {service.bookingData!.day}
                            </p>
                          </div>
                        </div>

                        {createBookingStops(service).map((stop) => (
                          <div
                            key={stop.id}
                            className="flex items-center gap-3 md:gap-4 p-3 bg-white rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              {getStopIcon(stop.type, stop.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-base md:text-lg">
                                  {stop.icon}
                                </span>
                                {
                                  <div className="flex flex-col gap-1">
                                  <span className="text-xs font-medium text-gray-900" title={stop.address}>
                                    {stop.address}
                                  </span>
                                  <span className="text-xs text-gray-500 truncate" title={stop.address}>
                                    {stop.address.split(",")[1]}
                                  </span>
                                  </div>
                                }
                               
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    stop.type === "pickup"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-orange-50 text-orange-700 border-orange-200"
                                  }`}
                                >
                                  {stop.type}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">
                                {stop.status === "completed" ? (
                                  <span className="text-green-600 font-medium">
                                    ✓ Completed
                                  </span>
                                ) : stop.status === "current" ? (
                                  <span className="text-blue-600 font-medium">
                                    🚚 In Progress
                                  </span>
                                ) : (
                                  `Time: ${stop.estimatedTime}`
                                )}
                              </p>
                              {stop.type === "delivery" &&
                                service.bookingData!.distance && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Distance: {service.bookingData!.distance} •
                                    Duration: {service.bookingData!.duration}
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

        
        </div>
      </ScrollArea>
    </TooltipProvider>
  );
}
