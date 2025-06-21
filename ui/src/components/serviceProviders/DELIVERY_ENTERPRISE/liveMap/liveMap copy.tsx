"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, useLazyQuery, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Navigation,
  Search,
  RefreshCw,
  Loader2,
  XCircle,
  Eye,
  Route,
  Car,
  Bike,
  Users,
  TrendingUp,
  Database,
  Settings,
  Filter,
  Package,
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
  Menu,
  Info,
  BarChart3,
} from "lucide-react";
import { useJsApiLoader, type Libraries } from "@react-google-maps/api";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  ServiceData,
  ProcessedRider,
  RouteData,
} from "./serviceDataAndTypes";
import { GET_ALL_RIDERS_SERVICE_DATA } from "./serviceDataAndTypes";
import {
  processRiders,
  addIsochronesToMap,
  addRiderRoutesToMap,
  setupDirectionsRequest,
  parseRouteGeoJSON,
  createRouteDataFromParsed,
  createAllMarkersWithLocations,
} from "./hooks/mapUtilsNew";
import { ActiveRiders } from "./active-riders";
import { RiderDetails } from "./rider-details";
import { ServiceManagement } from "./service-management";

// Separate query for route data
export const GET_ROUTE_DATA_FOR_EACH_ORDER = gql`
  query GetOrderRoute($orderId: String!) {
    getOrderRoute(orderId: $orderId) {
      id
      orderId
      geojson
      userId
      createdAt
    }
  }
`;

const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;
const googleMapsApiKey = import.meta.env.VITE_PUBLIC_GOOGLE_MAPS_API_KEY;

const libraries: Libraries = ["places"];
export const GOOGLE_MAPS_CONFIG = {
  id: "google-map-script",
  googleMapsApiKey: googleMapsApiKey,
  libraries: libraries,
};

const popupStyles = `
  .enhanced-popup .maplibregl-popup-content {
    padding: 0 !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    background: rgba(255, 255, 255, 0.95) !important;
    backdrop-filter: blur(20px) !important;
  }
  
  .enhanced-popup .maplibregl-popup-close-button {
    color: #6b7280 !important;
    font-size: 18px !important;
    padding: 8px !important;
    right: 8px !important;
    top: 8px !important;
    border-radius: 8px !important;
  }
  
  .enhanced-popup .maplibregl-popup-close-button:hover {
    color: #374151 !important;
    background-color: rgba(243, 244, 246, 0.8) !important;
  }
  
  .enhanced-popup .maplibregl-popup-tip {
    border-top-color: rgba(255, 255, 255, 0.95) !important;
    border-bottom-color: rgba(255, 255, 255, 0.95) !important;
  }
  
  @keyframes ping {
    75%, 100% {
      transform: translate(-50%, -50%) scale(2);
      opacity: 0;
    }
  }
`;

const LiveMap: React.FC = () => {
  // State management
  const [showOrdersBookings, setShowOrdersBookings] = useState(false);
  const [selectedRider, setSelectedRider] = useState<ProcessedRider | null>(
    null
  );
  const [showRidersList, setShowRidersList] = useState(false);
  const [showRiderDetails, setShowRiderDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showIsochrones, setShowIsochrones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [riderRoutes, setRiderRoutes] = useState<Map<string, RouteData>>(
    new Map()
  );
  const [databaseRoutes, setDatabaseRoutes] = useState<Map<string, RouteData>>(
    new Map()
  );
  const [loadingRoutes, setLoadingRoutes] = useState<Set<string>>(new Set());
  const [loadingDatabaseRoutes, setLoadingDatabaseRoutes] =
    useState<boolean>(false);
  const [orderRouteCache, setOrderRouteCache] = useState<
    Map<string, RouteData>
  >(new Map());
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapReadyToInit, setMapReadyToInit] = useState(false);
  const [initMapManually, setInitMapManually] = useState(false);
  const [routeFetchProgress, setRouteFetchProgress] = useState({
    current: 0,
    total: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    type:
      | "rider"
      | "customer"
      | "order"
      | "booking"
      | "vendor"
      | "multigroup"
      | null;
    value: string;
    relatedData: any[];
  } | null>(null);
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeDetailTab, setActiveDetailTab] = useState("overview");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null
  );
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Google Maps loader
  const { isLoaded, loadError } = useJsApiLoader(GOOGLE_MAPS_CONFIG);

  // Updated to use the new unified query
  const { loading, error, data, refetch } = useQuery(
    GET_ALL_RIDERS_SERVICE_DATA,
    {
      pollInterval: 90000,
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
    }
  );

  // Lazy query for fetching individual route data if needed
  const [getOrderRoute] = useLazyQuery(GET_ROUTE_DATA_FOR_EACH_ORDER, {
    errorPolicy: "all",
  });

  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Updated memoized data processing for ServiceData
  const serviceData: ServiceData[] = useMemo(
    () => data?.getAllRidersServiceData || [],
    [data]
  );

  const riders = useMemo(() => processRiders(serviceData), [serviceData]);

  // Search suggestions generator
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const suggestions = [];

    // Get unique customer names
    const customers = [...new Set(serviceData.map((s) => s.customer.name))]
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 3)
      .map((name) => ({
        type: "customer",
        value: name,
        label: `Customer: ${name}`,
        icon: "👤",
      }));

    // Get order IDs
    const orders = serviceData
      .filter((s) => s.type === "ORDER" && s.orderData?.orderId)
      .filter((s) => {
        const orderId = s.orderData.orderId.toLowerCase();
        const shortId = orderId.slice(-6);
        return (
          orderId.includes(query) ||
          shortId.includes(query) ||
          orderId.includes(query.replace("#", "")) ||
          shortId.includes(query.replace("#", ""))
        );
      })
      .slice(0, 3)
      .map((s) => ({
        type: "order",
        value: `#${s.orderData.orderId.slice(-6)}`,
        label: `Order #${s.orderData.orderId.slice(-6)}`,
        icon: "📦",
        customer: s.customer.name,
      }));

    // Get booking IDs
    const bookings = serviceData
      .filter((s) => s.type === "BOOKING" && s.bookingData?.bookingId)
      .filter((s) => {
        const bookingId = s.bookingData.bookingId.toLowerCase();
        const shortId = bookingId.slice(-6);
        return (
          bookingId.includes(query) ||
          shortId.includes(query) ||
          bookingId.includes(query.replace("#", "")) ||
          shortId.includes(query.replace("#", ""))
        );
      })
      .slice(0, 3)
      .map((s) => ({
        type: "booking",
        value: `#${s.bookingData.bookingId.slice(-6)}`,
        label: `Booking #${s.bookingData.bookingId.slice(-6)}`,
        icon: "📅",
        customer: s.customer.name,
      }));

    // Get vendor names
    const vendors = [...new Set(serviceData.map((s) => s.vendor.name))]
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 2)
      .map((name) => ({
        type: "vendor",
        value: name,
        label: `Vendor: ${name}`,
        icon: "🏪",
      }));

    // Get rider names
    const riderNames = riders
      .filter((rider) => rider.name.toLowerCase().includes(query))
      .slice(0, 2)
      .map((rider) => ({
        type: "rider",
        value: rider.name,
        label: `Rider: ${rider.name}`,
        icon: rider.vehicle === "Motorcycle" ? "🏍️" : "🚲",
        status: rider.status,
      }));

    // MultiGroup suggestions
    const multiGroupSuggestions = (() => {
      const multiGroupIds = [
        ...new Set(
          serviceData
            .filter((s) => s.type === "BOOKING" && s.bookingData?.multiGroupId)
            .map((s) => s.bookingData.multiGroupId)
        ),
      ];

      return multiGroupIds
        .filter((multiGroupId) => {
          const shortId = multiGroupId.slice(-6).toLowerCase();
          const fullId = multiGroupId.toLowerCase();
          return (
            fullId.includes(query) ||
            shortId.includes(query) ||
            fullId.includes(query.replace("#", "")) ||
            shortId.includes(query.replace("#", ""))
          );
        })
        .slice(0, 2)
        .map((multiGroupId) => {
          const groupBookings = serviceData.filter(
            (s) =>
              s.type === "BOOKING" &&
              s.bookingData?.multiGroupId === multiGroupId
          );

          const uniqueCustomers = [
            ...new Set(groupBookings.map((s) => s.customer.name)),
          ];

          return {
            type: "multigroup",
            value: `#${multiGroupId.slice(-6)}`,
            label: `Multi-Group #${multiGroupId.slice(-6)}`,
            icon: "📅🔗",
            multiGroupId: multiGroupId,
            bookingCount: groupBookings.length,
            customers: uniqueCustomers,
            customerDisplay:
              uniqueCustomers.length === 1
                ? uniqueCustomers[0]
                : `${uniqueCustomers.length} customers`,
          };
        });
    })();

    setSearchSuggestions([
      ...customers,
      ...orders,
      ...bookings,
      ...vendors,
      ...riderNames,
      ...multiGroupSuggestions,
    ]);
    setShowSuggestions(true);
  }, [searchQuery, serviceData, riders]);

  // Enhanced filteredRiders logic with multiGroupId search
  const filteredRiders = useMemo(
    () =>
      riders.filter((rider) => {
        const matchesSearch = (() => {
          if (!searchQuery.trim()) return true;

          const query = searchQuery.toLowerCase().trim();

          // Search in rider information
          const riderNameMatch = rider.name.toLowerCase().includes(query);
          const riderLocationMatch = rider.location
            .toLowerCase()
            .includes(query);

          // Search in customer names from rider's current services
          const customerNameMatch = [
            ...rider.currentOrders,
            ...(rider.currentBookings || []),
          ].some((service) =>
            service.customer.name.toLowerCase().includes(query)
          );

          // Search in order IDs (with and without # prefix)
          const orderIdMatch = rider.currentOrders.some((service) => {
            if (service.type === "ORDER" && service.orderData?.orderId) {
              const orderId = service.orderData.orderId.toLowerCase();
              const shortOrderId = orderId.slice(-6);

              return (
                orderId.includes(query) ||
                shortOrderId.includes(query) ||
                orderId.includes(query.replace("#", "")) ||
                shortOrderId.includes(query.replace("#", ""))
              );
            }
            return false;
          });

          // Search in booking IDs (with and without # prefix)
          const bookingIdMatch = (rider.currentBookings || []).some(
            (service) => {
              if (
                service.type === "BOOKING" &&
                service.bookingData?.bookingId
              ) {
                const bookingId = service.bookingData.bookingId.toLowerCase();
                const shortBookingId = bookingId.slice(-6);

                return (
                  bookingId.includes(query) ||
                  shortBookingId.includes(query) ||
                  bookingId.includes(query.replace("#", "")) ||
                  shortBookingId.includes(query.replace("#", ""))
                );
              }
              return false;
            }
          );

          // Search in multiGroupId (with and without # prefix)
          const multiGroupIdMatch = (rider.currentBookings || []).some(
            (service) => {
              if (
                service.type === "BOOKING" &&
                service.bookingData?.multiGroupId
              ) {
                const multiGroupId =
                  service.bookingData.multiGroupId.toLowerCase();
                const shortMultiGroupId = multiGroupId.slice(-6);

                return (
                  multiGroupId.includes(query) ||
                  shortMultiGroupId.includes(query) ||
                  multiGroupId.includes(query.replace("#", "")) ||
                  shortMultiGroupId.includes(query.replace("#", ""))
                );
              }
              return false;
            }
          );

          // Search in vendor names
          const vendorNameMatch = [
            ...rider.currentOrders,
            ...(rider.currentBookings || []),
          ].some((service) =>
            service.vendor?.name?.toLowerCase().includes(query)
          );

          // Search in delivery addresses
          const deliveryAddressMatch = [
            ...rider.currentOrders.filter((s) => s.orderData?.deliveryAddress),
            ...(rider.currentBookings || []).filter(
              (s) => s.bookingData?.deliveryAddress
            ),
          ].some((service) => {
            const address =
              service.type === "ORDER"
                ? service.orderData?.deliveryAddress
                : service.bookingData?.deliveryAddress;
            return address?.toLowerCase().includes(query);
          });

          // Search in pickup addresses (for bookings)
          const pickupAddressMatch = (rider.currentBookings || [])
            .filter((s) => s.bookingData?.pickUpAddress)
            .some((service) => {
              const pickupAddress = service.bookingData?.pickUpAddress;
              return pickupAddress?.toLowerCase().includes(query);
            });

          return (
            riderNameMatch ||
            riderLocationMatch ||
            customerNameMatch ||
            orderIdMatch ||
            bookingIdMatch ||
            multiGroupIdMatch ||
            vendorNameMatch ||
            deliveryAddressMatch ||
            pickupAddressMatch
          );
        })();

        const matchesStatus =
          statusFilter === "all" || rider.status === statusFilter;
        const matchesVehicle =
          vehicleFilter === "all" || rider.vehicle === vehicleFilter;

        let matchesType = true;
        if (typeFilter !== "all") {
          const hasOrderType = rider.currentOrders.some(
            (order) => order.type === typeFilter
          );
          const hasBookingType =
            rider.currentBookings?.some(
              (booking) => booking.type === typeFilter
            ) || false;
          matchesType = hasOrderType || hasBookingType;
        }

        return matchesSearch && matchesStatus && matchesVehicle && matchesType;
      }),
    [riders, searchQuery, statusFilter, vehicleFilter, typeFilter]
  );

  // Updated stats calculation
  const stats = useMemo(() => {
    const orderCount = serviceData.filter((s) => s.type === "ORDER").length;
    const bookingCount = serviceData.filter((s) => s.type === "BOOKING").length;

    return {
      activeRiders: riders.filter((r) => r.status === "On Delivery").length,
      availableRiders: riders.filter((r) => r.status === "Available").length,
      onBreakRiders: riders.filter((r) => r.status === "On Break").length,
      totalOrders: orderCount,
      totalBookings: bookingCount,
      totalServiceData: serviceData.length,
      ordersWithRoutes: orderRouteCache.size,
      routeFetchProgress: routeFetchProgress,
      motorcycles: riders.filter((r) => r.vehicle === "Motorcycle").length,
      bicycles: riders.filter((r) => r.vehicle === "Bicycle").length,
    };
  }, [riders, serviceData, orderRouteCache.size, routeFetchProgress]);

  // Search suggestions component
  const SearchSuggestions = () => {
    if (!showSuggestions || searchSuggestions.length === 0) return null;

    return (
      <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-3xl z-50 mt-2 max-h-80 overflow-hidden">
        <ScrollArea className="max-h-80">
          <div className="p-3">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs text-black/60 font-semibold flex items-center gap-2">
                <Search className="h-3 w-3" />
                Search Results - Click to navigate
              </div>
              <button
                className="text-xs hover:bg-red-100 cursor-pointer rounded-lg text-red-500 px-2 py-1 font-medium flex items-center gap-1 transition-colors"
                onClick={() => {
                  setSearchQuery("");
                  setShowSuggestions(false);
                  clearEntityFilter();
                }}
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="w-full text-left px-3 py-3 hover:bg-white/20 rounded-2xl flex items-center gap-3 text-sm transition-all duration-300 group border-b border-white/10 last:border-0"
                onClick={() => handleSearchSuggestionSelect(suggestion)}
              >
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-black group-hover:text-black/80 truncate">
                    {suggestion.label}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    {/* MultiGroup specific badges */}
                    {suggestion.type === "multigroup" && (
                      <>
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                          👥 {suggestion.customerDisplay}
                        </span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          📅 {suggestion.bookingCount} booking
                          {suggestion.bookingCount !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}

                    {/* Existing badges for other types */}
                    {suggestion.customer &&
                      suggestion.type !== "multigroup" && (
                        <span className="text-xs text-black/60 bg-white/20 px-2 py-0.5 rounded-full">
                          👤 {suggestion.customer}
                        </span>
                      )}
                    {suggestion.status && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          suggestion.status === "Available"
                            ? "bg-green-100 text-green-700"
                            : suggestion.status === "On Delivery"
                            ? "bg-blue-100 text-blue-700"
                            : suggestion.status === "CONFIRMED"
                            ? "bg-orange-100 text-orange-700"
                            : suggestion.status === "Confirmed"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {suggestion.status}
                      </span>
                    )}
                    {suggestion.rider && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        🏍️ {suggestion.rider}
                      </span>
                    )}
                    {suggestion.serviceCount !== undefined &&
                      suggestion.type !== "multigroup" && (
                        <span className="text-xs text-black/50 bg-white/20 px-2 py-0.5 rounded-full">
                          {suggestion.serviceCount} service
                          {suggestion.serviceCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    {suggestion.location && (
                      <span className="text-xs text-black/50 bg-white/20 px-2 py-0.5 rounded-full truncate max-w-32">
                        📍 {suggestion.location}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Navigation className="h-3 w-3 text-black/40 group-hover:text-blue-500" />
                  <div
                    className={`w-2 h-2 rounded-full ${
                      suggestion.type === "customer"
                        ? "bg-blue-500"
                        : suggestion.type === "order"
                        ? "bg-orange-500"
                        : suggestion.type === "booking"
                        ? "bg-purple-500"
                        : suggestion.type === "multigroup"
                        ? "bg-purple-600"
                        : suggestion.type === "vendor"
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  };

  const handleViewOnLiveMap = (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => {
    console.log("Entity ID:", entityId);
    console.log("Entity Type:", entityType);

    // Set the search query to the entity ID
    setSearchQuery(entityId);

    // Optionally show suggestions if you want to trigger search
    setShowSuggestions(true);

    // You can also handle different entity types differently:
    switch (entityType) {
      case "order":
        console.log("Opening live map for order:", entityId);
        setSearchQuery(`#${entityId}`);
        break;
      case "booking":
        console.log("Opening live map for booking:", entityId);
        setSearchQuery(`#${entityId}`);
        break;
      case "multigroup":
        console.log("Opening live map for multi-group:", entityId);
        setSearchQuery(`#${entityId}`);
        break;
      case "customer":
        console.log("Opening live map for customer:", entityId);
        setSearchQuery(entityId);
        break;
      case "vendor":
        console.log("Opening live map for vendor:", entityId);
        setSearchQuery(entityId);
        break;
      default:
        console.log("Unknown entity type:", entityType);
    }
  };

  // Updated function to fetch route data for service items
  const fetchServiceRoute = useCallback(
    async (serviceId: string) => {
      if (orderRouteCache.has(serviceId)) {
        return orderRouteCache.get(serviceId);
      }

      try {
        console.log(`Fetching route for service item: ${serviceId}`);
        const { data } = await getOrderRoute({
          variables: { orderId: serviceId },
        });

        if (data?.getOrderRoute) {
          console.log(`Successfully fetched route for service ${serviceId}:`, {
            id: data.getOrderRoute.id,
            hasGeojson: !!data.getOrderRoute.geojson,
            geojsonLength: data.getOrderRoute.geojson?.length || 0,
          });

          setOrderRouteCache((prev) =>
            new Map(prev).set(serviceId, data.getOrderRoute)
          );
          return data.getOrderRoute;
        } else {
          console.warn(`No route data returned for service ${serviceId}`);
        }
      } catch (error) {
        console.error(`Error fetching route for service ${serviceId}:`, error);
      }
      return null;
    },
    [getOrderRoute, orderRouteCache]
  );

  // Updated function to fetch all route data
  const fetchAllRoutesForServices = useCallback(async () => {
    if (serviceData.length === 0) {
      console.log("No service data to fetch routes for");
      return;
    }

    console.log(
      `Starting to fetch routes for ${serviceData.length} service items`
    );
    setLoadingDatabaseRoutes(true);

    const uniqueServiceIds = [
      ...new Set(serviceData.map((service) => service.id)),
    ];
    console.log(`Found ${uniqueServiceIds.length} unique service IDs`);

    setRouteFetchProgress({ current: 0, total: uniqueServiceIds.length });

    const routePromises = uniqueServiceIds.map(async (serviceId, index) => {
      try {
        const routeData = await fetchServiceRoute(serviceId);
        setRouteFetchProgress((prev) => ({ ...prev, current: index + 1 }));

        if (routeData?.geojson) {
          console.log(
            `Route ${index + 1}/${
              uniqueServiceIds.length
            }: Success for service ${serviceId}`
          );
          return { serviceId, routeData };
        } else {
          console.log(
            `Route ${index + 1}/${
              uniqueServiceIds.length
            }: No data for service ${serviceId}`
          );
          return { serviceId, routeData: null };
        }
      } catch (error) {
        console.error(
          `Route ${index + 1}/${
            uniqueServiceIds.length
          }: Error for service ${serviceId}:`,
          error
        );
        setRouteFetchProgress((prev) => ({ ...prev, current: index + 1 }));
        return { serviceId, routeData: null };
      }
    });

    try {
      const results = await Promise.all(routePromises);
      const successfulRoutes = results.filter((r) => r.routeData !== null);

      console.log(
        `Completed route fetching: ${successfulRoutes.length}/${uniqueServiceIds.length} successful`
      );

      // Process the routes into database routes
      processRoutesIntoMap(successfulRoutes);
    } catch (error) {
      console.error("Error in batch route fetching:", error);
    } finally {
      setLoadingDatabaseRoutes(false);
      setRouteFetchProgress({ current: 0, total: 0 });
    }
  }, [serviceData, fetchServiceRoute]);

  // Updated process routes function for ServiceData
  const processRoutesIntoMap = useCallback(
    (routeResults: Array<{ serviceId: string; routeData: RouteData }>) => {
      const riderRouteMap = new Map<string, RouteData>();

      console.log(
        `Processing ${routeResults.length} route results into rider routes`
      );

      // Group routes by rider
      const riderServiceMap = new Map<
        string,
        Array<{ serviceId: string; routeData: RouteData }>
      >();

      routeResults.forEach(({ serviceId, routeData }) => {
        const service = serviceData.find((s) => s.id === serviceId);
        if (service?.rider?.id) {
          const riderId = service.rider.id;
          if (!riderServiceMap.has(riderId)) {
            riderServiceMap.set(riderId, []);
          }
          riderServiceMap.get(riderId)!.push({ serviceId, routeData });
        }
      });

      console.log(`Found routes for ${riderServiceMap.size} riders`);

      // Process each rider's routes
      riderServiceMap.forEach((riderRoutes, riderId) => {
        const rider = riders.find((r) => r.id === riderId);
        if (!rider) {
          console.warn(`No rider found for ID: ${riderId}`);
          return;
        }

        console.log(
          `Processing routes for rider ${rider.name}: ${riderRoutes.length} routes`
        );

        // Use the first route with valid data
        for (const { serviceId, routeData } of riderRoutes) {
          if (routeData?.geojson) {
            try {
              console.log(
                `Parsing route for rider ${rider.name}, service ${serviceId}`
              );
              const parsedRoute = parseRouteGeoJSON(routeData.geojson);

              if (parsedRoute) {
                const routeDataForMap = createRouteDataFromParsed(
                  parsedRoute,
                  rider
                );
                riderRouteMap.set(riderId, routeDataForMap);
                console.log(
                  `Successfully created route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`
                );
                break; // Use first valid route
              } else {
                console.warn(
                  `Failed to parse route for rider ${rider.name}, service ${serviceId}`
                );
              }
            } catch (error) {
              console.error(
                `Error processing route for rider ${rider.name}, service ${serviceId}:`,
                error
              );
            }
          }
        }
      });

      console.log(
        `Successfully processed ${riderRouteMap.size} database routes`
      );
      setDatabaseRoutes(riderRouteMap);
    },
    [serviceData, riders]
  );

  // Updated fetch routes when data changes
  useEffect(() => {
    if (serviceData.length > 0 && !loadingDatabaseRoutes) {
      console.log(
        `Service data changed, starting route fetch for ${serviceData.length} items`
      );

      // Clear any existing timeout
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current);
      }

      // Debounce the route fetching
      routeUpdateTimeoutRef.current = setTimeout(() => {
        fetchAllRoutesForServices();
      }, 2000);
    }

    return () => {
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current);
      }
    };
  }, [serviceData, fetchAllRoutesForServices, loadingDatabaseRoutes]);

  // Initialize Google Directions Service
  useEffect(() => {
    if (isLoaded && !loadError && !directionsServiceRef.current) {
      try {
        directionsServiceRef.current = new google.maps.DirectionsService();
        console.log("Google Directions Service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Google Directions Service:", error);
      }
    }
  }, [isLoaded, loadError]);

  // Updated fetch rider route function
  const fetchRiderRoute = useCallback(
    async (rider: ProcessedRider) => {
      if (
        !isLoaded ||
        loadError ||
        !directionsServiceRef.current ||
        (!rider.currentOrders.length && !rider.currentBookings?.length)
      ) {
        return;
      }

      const riderId = rider.id;
      if (riderRoutes.has(riderId) || loadingRoutes.has(riderId)) {
        return;
      }

      console.log(`Fetching Google route for rider: ${rider.name}`);
      setLoadingRoutes((prev) => new Set(prev).add(riderId));

      try {
        const routeData = await setupDirectionsRequest(
          rider,
          directionsServiceRef.current
        );

        if (routeData) {
          console.log(`Google route calculated for ${rider.name}:`, {
            distance: `${routeData.distance.toFixed(1)}km`,
            duration: `${Math.round(routeData.duration / 60)}min`,
            points: routeData.coordinates.length,
            legs: routeData.legs,
          });
          setRiderRoutes((prev) => new Map(prev).set(riderId, routeData));
        }
      } catch (error) {
        console.error(
          `Error fetching Google route for rider ${rider.name}:`,
          error
        );
      } finally {
        setLoadingRoutes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(riderId);
          return newSet;
        });
      }
    },
    [isLoaded, loadError, riderRoutes, loadingRoutes]
  );

  // Updated fetch routes for active riders
  useEffect(() => {
    if (!isLoaded || loadError || !mapLoaded || !mapInitialized) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const activeRiders = riders.filter(
        (rider) =>
          rider.status === "On Delivery" &&
          (rider.currentOrders.length > 0 ||
            (rider.currentBookings?.length || 0) > 0)
      );
      console.log(
        `Fetching Delivery Routes for ${activeRiders.length} active riders`
      );

      // Batch process routes with staggered timing to avoid rate limits
      activeRiders.forEach((rider, index) => {
        setTimeout(() => {
          fetchRiderRoute(rider);
        }, index * 500);
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [riders, isLoaded, loadError, mapLoaded, mapInitialized, fetchRiderRoute]);

  const handleRiderClick = useCallback((rider: ProcessedRider) => {
    setSelectedRider(rider);
    setShowRidersList(false);
    setShowRiderDetails(true);

    if (mapInstance.current) {
      mapInstance.current.flyTo({
        center: [rider.position.lng, rider.position.lat],
        zoom: 14,
        duration: 1000,
      });
    }
  }, []);

  const handleBackToMap = useCallback(() => {
    setShowRiderDetails(false);
    setSelectedRider(null);

    if (mapInstance.current && riders.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      riders.forEach((rider) => {
        bounds.extend([rider.position.lng, rider.position.lat]);
      });
      if (riders.length > 1) {
        mapInstance.current.fitBounds(bounds, { padding: 50 });
      }
    }
  }, [riders]);

  // Map initialization function
  const initializeMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) {
      console.log("Map container not ready or map already initialized");
      return;
    }

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json";

    try {
      console.log("Initializing map...");
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: [-0.187, 5.6037],
        zoom: 12,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 8,
      });

      mapInstance.current = map;

      map.on("load", () => {
        setMapLoaded(true);
        setMapInitialized(true);
        console.log("Map loaded successfully");
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
      });

      // Add resize handler
      const handleResize = () => {
        if (mapInstance.current) {
          mapInstance.current.resize();
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
        setMapInitialized(false);
      };
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }, [maptilerApiKey]);

  // Initialize MapLibre map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const mapStyle = maptilerApiKey
      ? `https://api.maptiler.com/maps/streets/style.json?key=${maptilerApiKey}`
      : "https://demotiles.maplibre.org/style.json";

    try {
      const map = new maplibregl.Map({
        container: mapRef.current,
        style: mapStyle,
        center: [-0.187, 5.6037],
        zoom: 12,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 8,
      });

      mapInstance.current = map;

      map.on("load", () => {
        setMapLoaded(true);
        setMapInitialized(true);
        console.log("Map loaded successfully");
      });

      map.on("error", (e) => {
        console.error("Map error:", e);
      });

      // Add resize handler
      const handleResize = () => {
        if (mapInstance.current) {
          mapInstance.current.resize();
        }
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }
        setMapInitialized(false);
      };
    } catch (error) {
      console.error("Failed to initialize map:", error);
    }
  }, [maptilerApiKey]);

  // Update map with isochrones and routes - debounced
  useEffect(() => {
    if (!mapLoaded || !mapInitialized) return;

    const timeoutId = setTimeout(() => {
      try {
        addIsochronesToMap(
          mapInstance.current,
          mapLoaded,
          showIsochrones,
          showOnlyRelevant && selectedEntity
            ? selectedEntity.relatedData.services
            : serviceData
        );

        // Filter routes based on selected entity
        let routesToShow = new Map(riderRoutes);
        let dbRoutesToShow = new Map(databaseRoutes);

        if (showOnlyRelevant && selectedEntity) {
          // Only show routes for relevant riders
          const relevantRiderIds = new Set(
            selectedEntity.relatedData.riders.map((r) => r.id)
          );

          routesToShow = new Map(
            [...riderRoutes.entries()].filter(([riderId]) =>
              relevantRiderIds.has(riderId)
            )
          );

          dbRoutesToShow = new Map(
            [...databaseRoutes.entries()].filter(([riderId]) =>
              relevantRiderIds.has(riderId)
            )
          );
        }

        const combinedRoutes = new Map(routesToShow);
        dbRoutesToShow.forEach((route, riderId) => {
          if (!combinedRoutes.has(riderId)) {
            combinedRoutes.set(riderId, route);
          }
        });

        // Enhanced function now handles multigroup routes
        addRiderRoutesToMap(
          mapInstance.current,
          mapLoaded,
          showRoutes,
          combinedRoutes,
          showOnlyRelevant && selectedEntity
            ? selectedEntity.relatedData.riders
            : riders,
          selectedRider,
          showOnlyRelevant && selectedEntity
            ? selectedEntity.relatedData.services
            : serviceData
        );
      } catch (error) {
        console.error("Error updating map layers:", error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    mapLoaded,
    mapInitialized,
    showIsochrones,
    showRoutes,
    serviceData,
    riderRoutes,
    databaseRoutes,
    selectedRider,
    riders,
    showOnlyRelevant,
    selectedEntity,
  ]);

  // Update markers with debouncing and better performance
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded || !mapInitialized) return;

    if (markerUpdateTimeoutRef.current) {
      clearTimeout(markerUpdateTimeoutRef.current);
    }

    markerUpdateTimeoutRef.current = setTimeout(() => {
      try {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Enhanced function now handles multigroup markers better
        const newMarkers = createAllMarkersWithLocations(
          mapInstance.current!,
          serviceData,
          filteredRiders,
          riderRoutes,
          handleRiderClick,
          showOnlyRelevant,
          selectedEntity
        );

        // Store markers for cleanup
        markersRef.current = newMarkers;

        // Enhanced bounds fitting for multigroup
        if (filteredRiders.length > 0 || serviceData.length > 0) {
          try {
            const bounds = new maplibregl.LngLatBounds();

            // Add rider positions to bounds
            filteredRiders.forEach((rider) => {
              bounds.extend([rider.position.lng, rider.position.lat]);
            });

            // Add service locations to bounds
            const servicesToShow =
              showOnlyRelevant && selectedEntity
                ? selectedEntity.relatedData.services
                : serviceData;

            servicesToShow.forEach((service) => {
              if (service.type === "ORDER") {
                if (service.vendor?.coordinates)
                  bounds.extend(service.vendor.coordinates);
                if (service.orderData?.order?.coordinates)
                  bounds.extend(service.orderData.order.coordinates);
              } else if (service.type === "BOOKING" && service.bookingData) {
                // Enhanced for multigroup - add ALL pickup/dropoff locations
                if (service.bookingData.pickupLocation)
                  bounds.extend(service.bookingData.pickupLocation);
                if (service.bookingData.dropoffLocation)
                  bounds.extend(service.bookingData.dropoffLocation);
              }
            });

            if (filteredRiders.length > 1 || servicesToShow.length > 0) {
              mapInstance.current?.fitBounds(bounds, {
                padding: showOnlyRelevant ? 100 : 80,
                maxZoom: showOnlyRelevant ? 16 : 15,
              });
            }
          } catch (boundsError) {
            console.error("Error fitting bounds:", boundsError);
          }
        }
      } catch (error) {
        console.error("Error updating markers:", error);
      }
    }, 500);

    return () => {
      if (markerUpdateTimeoutRef.current) {
        clearTimeout(markerUpdateTimeoutRef.current);
      }
    };
  }, [
    filteredRiders,
    mapLoaded,
    mapInitialized,
    serviceData,
    riderRoutes,
    handleRiderClick,
    showOnlyRelevant,
    selectedEntity,
  ]);

  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = popupStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Check when everything is ready and set the flag
  useEffect(() => {
    const dataReady = serviceData.length > 0 && riders.length > 0;
    const googleMapsReady = isLoaded && !loadError;
    const componentsReady = true;

    if (dataReady && googleMapsReady && componentsReady) {
      setMapReadyToInit(true);

      const autoInitTimeout = setTimeout(() => {
        if (!mapInstance.current) {
          console.log("Auto-initializing map after 4 seconds...");
          initializeMap();
        }
      }, 4000);

      return () => clearTimeout(autoInitTimeout);
    }
  }, [serviceData, riders, isLoaded, loadError, initializeMap]);

  // Manual initialization effect
  useEffect(() => {
    if (initMapManually && mapReadyToInit) {
      initializeMap();
      setInitMapManually(false);
    }
  }, [initMapManually, mapReadyToInit, initializeMap]);

  // Button handler for manual initialization
  const handleInitializeMap = useCallback(() => {
    if (mapReadyToInit && !mapInstance.current) {
      setInitMapManually(true);
    }
  }, [mapReadyToInit]);

  const getRelatedEntityData = useCallback(
    (entityType: string, entityValue: string) => {
      const related = {
        riders: [],
        services: [],
        vendors: [],
        customers: [],
        routes: [],
      };

      switch (entityType) {
        case "rider": {
          const rider = riders.find((r) => r.name === entityValue);
          if (rider) {
            related.riders = [rider];
            related.services = [
              ...rider.currentOrders,
              ...(rider.currentBookings || []),
            ];
            related.vendors = [
              ...new Set(related.services.map((s) => s.vendor)),
            ];
            related.customers = [
              ...new Set(related.services.map((s) => s.customer)),
            ];
            related.routes = related.services
              .filter((s) => {
                if (s.type === "ORDER") return s.orderData?.routeData?.geojson;
                if (s.type === "BOOKING")
                  return s.bookingData?.routeData?.geojson;
                return false;
              })
              .map((s) =>
                s.type === "ORDER"
                  ? s.orderData.routeData
                  : s.bookingData.routeData
              );
          }
          break;
        }
        case "customer": {
          const customerServices = serviceData.filter(
            (s) => s.customer.name === entityValue
          );
          related.services = customerServices;
          related.riders = customerServices
            .filter((s) => s.rider)
            .map((s) => riders.find((r) => r.id === s.rider.id))
            .filter(Boolean);
          related.vendors = [...new Set(customerServices.map((s) => s.vendor))];
          related.customers = [customerServices[0]?.customer].filter(Boolean);
          related.routes = customerServices
            .filter((s) => {
              if (s.type === "ORDER") return s.orderData?.routeData?.geojson;
              if (s.type === "BOOKING")
                return s.bookingData?.routeData?.geojson;
              return false;
            })
            .map((s) =>
              s.type === "ORDER"
                ? s.orderData.routeData
                : s.bookingData.routeData
            );
          break;
        }
        case "order": {
          const orderService = serviceData.find(
            (s) =>
              s.type === "ORDER" &&
              s.orderData?.orderId?.slice(-6) === entityValue.replace("#", "")
          );
          if (orderService) {
            related.services = [orderService];
            related.vendors = [orderService.vendor];
            related.customers = [orderService.customer];
            if (orderService.rider) {
              related.riders = [
                riders.find((r) => r.id === orderService.rider.id),
              ].filter(Boolean);
            }
            if (orderService.orderData?.routeData?.geojson) {
              related.routes = [orderService.orderData.routeData];
            }
          }
          break;
        }
        case "booking": {
          const bookingService = serviceData.find(
            (s) =>
              s.type === "BOOKING" &&
              s.bookingData?.bookingId?.slice(-6) ===
                entityValue.replace("#", "")
          );
          if (bookingService) {
            related.services = [bookingService];
            related.vendors = [bookingService.vendor];
            related.customers = [bookingService.customer];
            if (bookingService.rider) {
              related.riders = [
                riders.find((r) => r.id === bookingService.rider.id),
              ].filter(Boolean);
            }
            if (bookingService.bookingData?.routeData?.geojson) {
              related.routes = [bookingService.bookingData.routeData];
            }
          }
          break;
        }
        case "multigroup": {
          const shortId = entityValue.replace("#", "");
          const multiGroupServices = serviceData.filter(
            (s) =>
              s.type === "BOOKING" &&
              s.bookingData?.multiGroupId &&
              s.bookingData.multiGroupId.slice(-6) === shortId
          );

          if (multiGroupServices.length > 0) {
            console.log(
              `getRelatedEntityData: Found ${multiGroupServices.length} services for multigroup ${shortId}`
            );

            related.services = multiGroupServices;
            related.vendors = [
              ...new Set(multiGroupServices.map((s) => s.vendor)),
            ];
            related.customers = [
              ...new Set(multiGroupServices.map((s) => s.customer)),
            ];
            related.riders = multiGroupServices
              .filter((s) => s.rider)
              .map((s) => riders.find((r) => r.id === s.rider.id))
              .filter(Boolean);
            related.routes = multiGroupServices
              .filter((s) => s.bookingData?.routeData?.geojson)
              .map((s) => s.bookingData.routeData);

            console.log(
              `Related data: ${related.services.length} services, ${related.riders.length} riders, ${related.routes.length} routes`
            );
          }
          break;
        }

        case "vendor": {
          const vendorServices = serviceData.filter(
            (s) => s.vendor.name === entityValue
          );
          related.services = vendorServices;
          related.vendors = [vendorServices[0]?.vendor].filter(Boolean);
          related.customers = [
            ...new Set(vendorServices.map((s) => s.customer)),
          ];
          related.riders = vendorServices
            .filter((s) => s.rider)
            .map((s) => riders.find((r) => r.id === s.rider.id))
            .filter(Boolean);
          related.routes = vendorServices
            .filter((s) => {
              if (s.type === "ORDER") return s.orderData?.routeData?.geojson;
              if (s.type === "BOOKING")
                return s.bookingData?.routeData?.geojson;
              return false;
            })
            .map((s) =>
              s.type === "ORDER"
                ? s.orderData.routeData
                : s.bookingData.routeData
            );
          break;
        }
      }

      return related;
    },
    [riders, serviceData]
  );

  // Enhanced FilterControlPanel with detailed entity-specific information
  const FilterControlPanel = () => {
    if (!showOnlyRelevant && !selectedEntity) return null;

    // Helper function to get detailed entity information
    const getEntityDetails = () => {
      if (!selectedEntity) return null;

      const { type, value, relatedData } = selectedEntity;

      switch (type) {
        case "rider":
          const rider = relatedData.riders[0];
          if (!rider) return null;

          return {
            title: `Rider: ${rider.name}`,
            subtitle: `${rider.status} • ${rider.vehicle}`,
            icon: rider.vehicle === "Motorcycle" ? "🏍️" : "🚲",
            details: {
              overview: {
                Phone: rider.phone,
                Location: rider.location,
                Status: rider.status,
                Vehicle: rider.vehicle,
                Earnings: rider.earnings,
                Rating: `${rider.rating}/5 ⭐`,
                "Last Active": rider.lastActive,
                Coordinates: `${rider.position.lat.toFixed(
                  6
                )}, ${rider.position.lng.toFixed(6)}`,
              },
              services: relatedData.services.map((service) => ({
                id: service.id,
                type: service.type,
                customer: service.customer.name,
                status:
                  service.type === "ORDER"
                    ? service.orderData?.status
                    : service.bookingData?.isConfirmed
                    ? "Confirmed"
                    : "Pending",
                amount:
                  service.type === "ORDER"
                    ? `GH₵${service.orderData?.deliveryMetaData?.price || 0}`
                    : `GH₵${service.bookingData?.deliveryFee || 0}`,
                orderId:
                  service.type === "ORDER"
                    ? service.orderData?.orderId
                    : service.bookingData?.bookingId,
                vendor: service.vendor.name,
              })),
              routes: relatedData.routes.map((route) => ({
                id: route.id,
                distance: route.geojson
                  ? JSON.parse(route.geojson).metadata?.distance
                  : "N/A",
                duration: route.geojson
                  ? JSON.parse(route.geojson).metadata?.duration
                  : "N/A",
                summary: route.geojson
                  ? JSON.parse(route.geojson).metadata?.summary
                  : "Route",
              })),
            },
          };

        case "customer":
          const customer = relatedData.customers[0];
          const customerServices = relatedData.services;
          if (!customer) return null;

          return {
            title: `Customer: ${customer.name}`,
            subtitle: `${customerServices.length} service${
              customerServices.length !== 1 ? "s" : ""
            }`,
            icon: "👤",
            details: {
              overview: {
                Name: customer.name,
                Phone: customer.number,
                "Total Services": customerServices.length,
                "Active Orders": customerServices.filter(
                  (s) =>
                    s.type === "ORDER" && s.orderData?.status !== "DELIVERED"
                ).length,
                "Active Bookings": customerServices.filter(
                  (s) => s.type === "BOOKING" && s.bookingData?.isConfirmed
                ).length,
                "Total Spent": `GH₵${customerServices
                  .reduce((total, service) => {
                    if (service.type === "ORDER")
                      return (
                        total +
                        (service.orderData?.deliveryMetaData?.price || 0)
                      );
                    if (service.type === "BOOKING")
                      return (
                        total +
                        Number.parseFloat(
                          service.bookingData?.deliveryFee || "0"
                        )
                      );
                    return total;
                  }, 0)
                  .toFixed(2)}`,
              },
              services: customerServices.map((service) => ({
                id: service.id,
                type: service.type,
                orderId:
                  service.type === "ORDER"
                    ? service.orderData?.orderId
                    : service.bookingData?.bookingId,
                status:
                  service.type === "ORDER"
                    ? service.orderData?.status
                    : service.bookingData?.isConfirmed
                    ? "Confirmed"
                    : "Pending",
                vendor: service.vendor.name,
                rider: service.rider?.name || "Unassigned",
                amount:
                  service.type === "ORDER"
                    ? `GH₵${service.orderData?.deliveryMetaData?.price || 0}`
                    : `GH₵${service.bookingData?.deliveryFee || 0}`,
                date: new Date(service.createdAt).toLocaleDateString(),
                address:
                  service.type === "ORDER"
                    ? service.orderData?.deliveryAddress
                    : service.bookingData?.deliveryAddress,
                pickupAddress:
                  service.type === "BOOKING"
                    ? service.bookingData?.pickUpAddress
                    : service.vendor.location,
              })),
              locations: customerServices
                .map((service) => {
                  if (service.type === "ORDER") {
                    return {
                      type: "Delivery",
                      address: service.orderData?.deliveryAddress,
                      coordinates: service.orderData?.order?.coordinates,
                      vendor: service.vendor.name,
                      vendorLocation: service.vendor.coordinates,
                    };
                  } else if (service.type === "BOOKING") {
                    return {
                      type: "Booking",
                      pickupAddress: service.bookingData?.pickUpAddress,
                      pickupCoordinates: service.bookingData?.pickupLocation,
                      dropoffCoordinates: service.bookingData?.dropoffLocation,
                      venue: service.bookingData?.deliveryAddress,
                      venueLocation: service.vendor.coordinates,
                    };
                  }
                  return null;
                })
                .filter(Boolean),
            },
          };

        case "multigroup":
          const multiGroupServices = relatedData.services;
          if (multiGroupServices.length === 0) return null;

          // Get the multiGroupId from the first service
          const multiGroupId = multiGroupServices[0]?.bookingData?.multiGroupId;
          const shortMultiGroupId = multiGroupId?.slice(-6);

          // Get all unique customers, vendors, and riders
          const uniqueCustomers = [
            ...new Set(multiGroupServices.map((s) => s.customer.name)),
          ];
          const uniqueVendors = [
            ...new Set(multiGroupServices.map((s) => s.vendor.name)),
          ];
          const uniqueRiders = [
            ...new Set(
              multiGroupServices.filter((s) => s.rider).map((s) => s.rider.name)
            ),
          ];

          // Calculate totals
          const totalFee = multiGroupServices.reduce((total, service) => {
            return (
              total + Number.parseFloat(service.bookingData?.deliveryFee || "0")
            );
          }, 0);

          const confirmedBookings = multiGroupServices.filter(
            (s) => s.bookingData?.isConfirmed
          ).length;
          const pendingBookings = multiGroupServices.length - confirmedBookings;

          return {
            title: `Multi-Group #${shortMultiGroupId}`,
            subtitle: `${multiGroupServices.length} bookings • ${
              uniqueCustomers.length
            } customer${uniqueCustomers.length !== 1 ? "s" : ""}`,
            icon: "📅🔗",
            details: {
              overview: {
                "Multi-Group ID": multiGroupId,
                "Total Bookings": multiGroupServices.length,
                "Confirmed Bookings": confirmedBookings,
                "Pending Bookings": pendingBookings,
                "Unique Customers": uniqueCustomers.length,
                "Unique Vendors": uniqueVendors.length,
                "Assigned Riders": uniqueRiders.length,
                "Total Delivery Fees": `GH₵${totalFee.toFixed(2)}`,
                "Average Fee per Booking": `GH₵${(
                  totalFee / multiGroupServices.length
                ).toFixed(2)}`,
                "Group Status":
                  confirmedBookings === multiGroupServices.length
                    ? "All Confirmed"
                    : confirmedBookings === 0
                    ? "All Pending"
                    : "Mixed Status",
              },
              services: multiGroupServices.map((service, index) => ({
                id: service.id,
                type: service.type,
                bookingNumber: index + 1,
                customer: service.customer.name,
                bookingId: service.bookingData?.bookingId,
                status: service.bookingData?.isConfirmed
                  ? "Confirmed"
                  : "Pending",
                vendor: service.vendor.name,
                rider: service.rider?.name || "Unassigned",
                amount: `GH₵${service.bookingData?.deliveryFee || 0}`,
                date: new Date(service.createdAt).toLocaleDateString(),
                deliveryAddress: service.bookingData?.deliveryAddress,
                pickupAddress: service.bookingData?.pickUpAddress,
                tableSize: service.bookingData?.tableSize
                  ? `${service.bookingData.tableSize} people`
                  : "N/A",
                day: service.bookingData?.day,
                startTime: service.bookingData?.startTime
                  ? new Date(service.bookingData.startTime).toLocaleTimeString()
                  : "N/A",
                endTime: service.bookingData?.endTime
                  ? new Date(service.bookingData.endTime).toLocaleTimeString()
                  : "N/A",
                item: service.bookingData?.item || "None",
              })),
              locations: multiGroupServices.map((service, index) => ({
                bookingNumber: index + 1,
                customer: service.customer.name,
                pickupAddress: service.bookingData?.pickUpAddress,
                pickupCoordinates: service.bookingData?.pickupLocation,
                deliveryAddress: service.bookingData?.deliveryAddress,
                dropoffCoordinates: service.bookingData?.dropoffLocation,
                venue: service.vendor.name,
                venueLocation: service.vendor.location,
                venueCoordinates: service.vendor.coordinates,
              })),
              customers: uniqueCustomers.map((customerName) => {
                const customerBookings = multiGroupServices.filter(
                  (s) => s.customer.name === customerName
                );
                const customerInfo = customerBookings[0].customer;
                const customerTotalFee = customerBookings.reduce(
                  (total, service) => {
                    return (
                      total +
                      Number.parseFloat(service.bookingData?.deliveryFee || "0")
                    );
                  },
                  0
                );

                return {
                  name: customerName,
                  phone: customerInfo.number,
                  bookings: customerBookings.length,
                  totalSpent: customerTotalFee,
                  confirmedBookings: customerBookings.filter(
                    (s) => s.bookingData?.isConfirmed
                  ).length,
                  pendingBookings: customerBookings.filter(
                    (s) => !s.bookingData?.isConfirmed
                  ).length,
                };
              }),
              routes: multiGroupServices
                .filter((service) => service.bookingData?.routeData?.geojson)
                .map((service, index) => ({
                  bookingNumber: index + 1,
                  bookingId: service.bookingData?.bookingId?.slice(-6),
                  customer: service.customer.name,
                  distance: service.bookingData?.routeData?.geojson
                    ? JSON.parse(service.bookingData.routeData.geojson || "{}")
                        .metadata?.distance
                    : "N/A",
                  duration: service.bookingData?.routeData?.geojson
                    ? JSON.parse(service.bookingData.routeData.geojson || "{}")
                        .metadata?.duration
                    : "N/A",
                  summary: service.bookingData?.routeData?.geojson
                    ? JSON.parse(service.bookingData.routeData.geojson || "{}")
                        .metadata?.summary
                    : "Route",
                })),
              details: {
                "Group Statistics": `${multiGroupServices.length} total bookings in this multi-group`,
                "Customer Distribution":
                  uniqueCustomers.length === 1
                    ? "Single customer group"
                    : `Multi-customer group (${uniqueCustomers.join(", ")})`,
                "Venue Distribution":
                  uniqueVendors.length === 1
                    ? `Single venue: ${uniqueVendors[0]}`
                    : `Multiple venues: ${uniqueVendors.join(", ")}`,
                "Rider Assignment":
                  uniqueRiders.length === 0
                    ? "No riders assigned"
                    : uniqueRiders.length === 1
                    ? `Single rider: ${uniqueRiders[0]}`
                    : `Multiple riders: ${uniqueRiders.join(", ")}`,
                "Fee Range": (() => {
                  const fees = multiGroupServices.map((s) =>
                    Number.parseFloat(s.bookingData?.deliveryFee || "0")
                  );
                  const minFee = Math.min(...fees);
                  const maxFee = Math.max(...fees);
                  return minFee === maxFee
                    ? `Uniform fee: GH₵${minFee.toFixed(2)}`
                    : `Range: GH₵${minFee.toFixed(2)} - GH₵${maxFee.toFixed(
                        2
                      )}`;
                })(),
              },
            },
          };

        default:
          return null;
      }
    };

    const entityDetails = getEntityDetails();
    if (!entityDetails) return null;

    const detailTabs = [
      { id: "overview", label: "Overview", icon: "📊" },
      ...(entityDetails.details.services
        ? [{ id: "services", label: "Services", icon: "📋" }]
        : []),
      ...(entityDetails.details.locations
        ? [{ id: "locations", label: "Locations", icon: "📍" }]
        : []),
      ...(entityDetails.details.routes
        ? [{ id: "routes", label: "Routes", icon: "🛣️" }]
        : []),
      ...(entityDetails.details.customers
        ? [{ id: "customers", label: "Customers", icon: "👥" }]
        : []),
      ...(entityDetails.details.details
        ? [{ id: "details", label: "Details", icon: "🔍" }]
        : []),
    ];

    return (
      <div className="absolute top-16 sm:top-20 left-3 sm:left-4 right-3 sm:right-4 z-10">
        <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-3xl overflow-hidden">
          {/* Enhanced Header */}
          <div className="p-3 sm:p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-lg">{entityDetails.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-black text-sm sm:text-base tracking-tight truncate">
                    {entityDetails.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-black/60 truncate">
                    {entityDetails.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs bg-white/10 hover:bg-white/20 rounded-full"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearEntityFilter}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-white/10 hover:bg-white/20 border-white/20 rounded-full"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  {isMobile ? "" : "Clear"}
                </Button>
              </div>
            </div>
          </div>

          {/* Expandable Content */}
          {isExpanded && (
            <div className="max-h-96 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-white/20 overflow-x-auto scrollbar-hide">
                {detailTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDetailTab(tab.id)}
                    className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                      activeDetailTab === tab.id
                        ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50/50"
                        : "text-black/60 hover:text-black hover:bg-white/10"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <ScrollArea className="h-80">
                <div className="p-3 sm:p-4">
                  {activeDetailTab === "overview" &&
                    entityDetails.details.overview && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(entityDetails.details.overview).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20"
                            >
                              <div className="text-xs text-black/60 font-semibold">
                                {key}
                              </div>
                              <div className="text-sm text-black font-semibold mt-1 break-words">
                                {value}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {activeDetailTab === "services" &&
                    entityDetails.details.services && (
                      <div className="space-y-3">
                        {entityDetails.details.services.map(
                          (service, index) => (
                            <div
                              key={index}
                              className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      service.type === "ORDER"
                                        ? "bg-orange-100 text-orange-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}
                                  >
                                    {service.type}
                                  </span>
                                  <span className="text-sm font-semibold text-black truncate">
                                    {service.bookingNumber
                                      ? `#${service.bookingNumber}`
                                      : `#${
                                          service.orderId?.slice(-6) ||
                                          service.bookingId?.slice(-6)
                                        }`}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                  {service.amount}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                <div>
                                  <span className="text-black/60">
                                    Customer:
                                  </span>
                                  <span className="ml-1 font-semibold text-black truncate">
                                    {service.customer}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-black/60">Status:</span>
                                  <span className="ml-1 font-semibold text-black">
                                    {service.status}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-black/60">Vendor:</span>
                                  <span className="ml-1 font-semibold text-black truncate">
                                    {service.vendor}
                                  </span>
                                </div>
                                {service.rider && (
                                  <div>
                                    <span className="text-black/60">
                                      Rider:
                                    </span>
                                    <span className="ml-1 font-semibold text-black">
                                      {service.rider}
                                    </span>
                                  </div>
                                )}
                                {service.date && (
                                  <div>
                                    <span className="text-black/60">Date:</span>
                                    <span className="ml-1 font-semibold text-black">
                                      {service.date}
                                    </span>
                                  </div>
                                )}
                                {service.tableSize && (
                                  <div>
                                    <span className="text-black/60">
                                      Table:
                                    </span>
                                    <span className="ml-1 font-semibold text-black">
                                      {service.tableSize}
                                    </span>
                                  </div>
                                )}
                                {service.day && (
                                  <div>
                                    <span className="text-black/60">Day:</span>
                                    <span className="ml-1 font-semibold text-black">
                                      {service.day}
                                    </span>
                                  </div>
                                )}
                                {service.startTime &&
                                  service.startTime !== "N/A" && (
                                    <div className="sm:col-span-2">
                                      <span className="text-black/60">
                                        Time:
                                      </span>
                                      <span className="ml-1 font-semibold text-black">
                                        {service.startTime} - {service.endTime}
                                      </span>
                                    </div>
                                  )}
                                {service.deliveryAddress && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <span className="text-black/60">
                                      Delivery:
                                    </span>
                                    <span className="ml-1 font-semibold text-black break-words">
                                      {service.deliveryAddress}
                                    </span>
                                  </div>
                                )}
                                {service.pickupAddress && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <span className="text-black/60">
                                      Pickup:
                                    </span>
                                    <span className="ml-1 font-semibold text-black break-words">
                                      {service.pickupAddress}
                                    </span>
                                  </div>
                                )}
                                {service.item && service.item !== "None" && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <span className="text-black/60">
                                      Special Item:
                                    </span>
                                    <span className="ml-1 font-semibold text-black">
                                      {service.item}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {activeDetailTab === "locations" &&
                    entityDetails.details.locations && (
                      <div className="space-y-3">
                        {entityDetails.details.locations.map(
                          (location, index) => (
                            <div
                              key={index}
                              className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20"
                            >
                              <div className="flex items-center gap-2 mb-3">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                  Booking #{location.bookingNumber || index + 1}
                                </span>
                                <span className="font-semibold text-sm text-black truncate">
                                  {location.customer}
                                </span>
                              </div>

                              {/* Pickup Location */}
                              {location.pickupAddress && (
                                <div className="mb-3 p-3 bg-purple-50/50 rounded-xl border-l-4 border-purple-400">
                                  <div className="text-xs font-semibold text-purple-700 mb-1">
                                    📍 Pickup Location
                                  </div>
                                  <div className="text-sm text-black break-words">
                                    {location.pickupAddress}
                                  </div>
                                  {location.pickupCoordinates && (
                                    <div className="text-xs text-black/50 mt-1">
                                      📍{" "}
                                      {location.pickupCoordinates[1]?.toFixed(
                                        6
                                      )}
                                      ,{" "}
                                      {location.pickupCoordinates[0]?.toFixed(
                                        6
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Delivery Location */}
                              {location.deliveryAddress && (
                                <div className="mb-3 p-3 bg-blue-50/50 rounded-xl border-l-4 border-blue-400">
                                  <div className="text-xs font-semibold text-blue-700 mb-1">
                                    🎯 Delivery Location
                                  </div>
                                  <div className="text-sm text-black break-words">
                                    {location.deliveryAddress}
                                  </div>
                                  {location.dropoffCoordinates && (
                                    <div className="text-xs text-black/50 mt-1">
                                      📍{" "}
                                      {location.dropoffCoordinates[1]?.toFixed(
                                        6
                                      )}
                                      ,{" "}
                                      {location.dropoffCoordinates[0]?.toFixed(
                                        6
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Venue Location */}
                              {location.venue && (
                                <div className="p-3 bg-green-50/50 rounded-xl border-l-4 border-green-400">
                                  <div className="text-xs font-semibold text-green-700 mb-1">
                                    🏪 Venue
                                  </div>
                                  <div className="text-sm text-black break-words">
                                    {location.venue}
                                  </div>
                                  <div className="text-xs text-black/60 break-words">
                                    {location.venueLocation}
                                  </div>
                                  {location.venueCoordinates && (
                                    <div className="text-xs text-black/50 mt-1">
                                      📍{" "}
                                      {location.venueCoordinates[1]?.toFixed(6)}
                                      ,{" "}
                                      {location.venueCoordinates[0]?.toFixed(6)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {activeDetailTab === "customers" &&
                    entityDetails.details.customers && (
                      <div className="space-y-3">
                        {entityDetails.details.customers.map(
                          (customer, index) => (
                            <div
                              key={index}
                              className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-sm text-black truncate">
                                    {customer.name}
                                  </h5>
                                  <div className="text-xs text-black/60 break-words">
                                    {customer.phone}
                                  </div>
                                </div>
                                <span className="text-sm font-bold text-green-600">
                                  GH₵{customer.totalSpent.toFixed(2)}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div>
                                  <span className="text-black/60">
                                    Bookings:
                                  </span>
                                  <span className="ml-1 font-semibold text-black">
                                    {customer.bookings}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-black/60">
                                    Confirmed:
                                  </span>
                                  <span className="ml-1 font-semibold text-green-600">
                                    {customer.confirmedBookings}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-black/60">
                                    Pending:
                                  </span>
                                  <span className="ml-1 font-semibold text-orange-600">
                                    {customer.pendingBookings}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {activeDetailTab === "routes" &&
                    entityDetails.details.routes && (
                      <div className="space-y-3">
                        {entityDetails.details.routes.map((route, index) => (
                          <div
                            key={index}
                            className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                Booking #{route.bookingNumber}
                              </span>
                              <span className="text-sm font-semibold text-black">
                                #{route.bookingId}
                              </span>
                              <span className="text-xs text-black/60 truncate">
                                {route.customer}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-black/60">Distance:</span>
                                <span className="ml-1 font-semibold text-black">
                                  {route.distance}
                                </span>
                              </div>
                              <div>
                                <span className="text-black/60">Duration:</span>
                                <span className="ml-1 font-semibold text-black">
                                  {route.duration}
                                </span>
                              </div>
                              <div>
                                <span className="text-black/60">Summary:</span>
                                <span className="ml-1 font-semibold text-black truncate">
                                  {route.summary}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {activeDetailTab === "details" &&
                    entityDetails.details.details && (
                      <div className="grid grid-cols-1 gap-3">
                        {Object.entries(entityDetails.details.details).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 border border-white/20"
                            >
                              <div className="text-xs text-black/60 font-semibold">
                                {key}
                              </div>
                              <div className="text-sm text-black font-semibold mt-1 break-words">
                                {value}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Quick Stats Footer */}
          <div className="p-3 sm:p-4 justify-between flex bg-white/10 backdrop-blur-xl border-t border-white/20">
            <div className="grid grid-cols-4 gap-2 flex-1">
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
                <div className="text-xs font-bold text-orange-700">
                  {selectedEntity?.relatedData.services?.filter(
                    (s) => s.type === "ORDER"
                  ).length || 0}
                </div>
                <div className="text-xs text-orange-600">Orders</div>
              </div>
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
                <div className="text-xs font-bold text-purple-700">
                  {selectedEntity?.relatedData.services?.filter(
                    (s) => s.type === "BOOKING"
                  ).length || 0}
                </div>
                <div className="text-xs text-purple-600">Bookings</div>
              </div>
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
                <div className="text-xs font-bold text-green-700">
                  {selectedEntity?.relatedData.routes?.length || 0}
                </div>
                <div className="text-xs text-green-600">Routes</div>
              </div>
              <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
                <div className="text-xs font-bold text-blue-700">
                  {selectedEntity?.type === "multigroup"
                    ? [
                        ...new Set(
                          selectedEntity.relatedData.services?.map(
                            (s) => s.customer.name
                          )
                        ),
                      ].length
                    : selectedEntity?.relatedData.customers?.length || 0}
                </div>
                <div className="text-xs text-blue-600">Customers</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (mapInstance.current && selectedEntity) {
                  const bounds = new maplibregl.LngLatBounds();
                  selectedEntity.relatedData.riders?.forEach((rider) => {
                    bounds.extend([rider.position.lng, rider.position.lat]);
                  });
                  selectedEntity.relatedData.services?.forEach((service) => {
                    if (service.type === "ORDER") {
                      if (service.vendor?.coordinates)
                        bounds.extend(service.vendor.coordinates);
                      if (service.orderData?.order?.coordinates)
                        bounds.extend(service.orderData.order.coordinates);
                    } else if (
                      service.type === "BOOKING" &&
                      service.bookingData
                    ) {
                      if (service.bookingData.pickupLocation)
                        bounds.extend(service.bookingData.pickupLocation);
                      if (service.bookingData.dropoffLocation)
                        bounds.extend(service.bookingData.dropoffLocation);
                    }
                  });
                  mapInstance.current.fitBounds(bounds, {
                    padding: 100,
                    maxZoom: 15,
                    duration: 1500,
                  });
                }
              }}
              className="text-xs bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl ml-2"
            >
              <Navigation className="h-3 w-3 mr-1" />
              {isMobile ? "Fit" : "Fit View"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const clearEntityFilter = useCallback(() => {
    setSelectedEntity(null);
    setShowOnlyRelevant(false);
    setSearchQuery("");
  }, []);

  const flyToLocation = useCallback(
    (coordinates: [number, number], zoom = 15) => {
      if (mapInstance.current && coordinates && coordinates.length === 2) {
        mapInstance.current.flyTo({
          center: [coordinates[0], coordinates[1]], // [lng, lat]
          zoom: zoom,
          duration: 1500,
          essential: true,
        });
      }
    },
    []
  );

  const handleSearchSuggestionSelect = useCallback(
    (suggestion: any) => {
      setSearchQuery(suggestion.value);
      setShowSuggestions(false);

      // Get related data for this entity
      const relatedData = getRelatedEntityData(
        suggestion.type,
        suggestion.value
      );

      // Set selected entity for filtered display
      setSelectedEntity({
        type: suggestion.type,
        value: suggestion.value,
        relatedData: relatedData,
      });
      setShowOnlyRelevant(true);

      // Navigate based on suggestion type
      switch (suggestion.type) {
        case "rider": {
          const rider = riders.find((r) => r.name === suggestion.value);
          if (rider) {
            flyToLocation([rider.position.lng, rider.position.lat], 16);
            setSelectedRider(rider);
          }
          break;
        }
        case "customer": {
          const customerServices = serviceData.filter(
            (s) => s.customer.name === suggestion.value
          );
          if (customerServices.length > 0) {
            const service = customerServices[0];
            let coordinates: [number, number] | null = null;

            if (
              service.type === "ORDER" &&
              service.orderData?.order?.coordinates
            ) {
              coordinates = service.orderData.order.coordinates;
            } else if (
              service.type === "BOOKING" &&
              service.bookingData?.pickupLocation
            ) {
              coordinates = service.bookingData.pickupLocation;
            }

            if (coordinates) {
              flyToLocation(coordinates, 15);
            }
          }
          break;
        }
        case "order": {
          const orderService = serviceData.find(
            (s) =>
              s.type === "ORDER" &&
              s.orderData?.orderId?.slice(-6) ===
                suggestion.value.replace("#", "")
          );
          if (orderService?.orderData?.order?.coordinates) {
            flyToLocation(orderService.orderData.order.coordinates, 15);

            if (orderService.rider) {
              const orderRider = riders.find(
                (r) => r.id === orderService.rider?.id
              );
              if (orderRider) {
                setSelectedRider(orderRider);
              }
            }
          }
          break;
        }
        case "booking": {
          const bookingService = serviceData.find(
            (s) =>
              s.type === "BOOKING" &&
              s.bookingData?.bookingId?.slice(-6) ===
                suggestion.value.replace("#", "")
          );
          if (bookingService?.bookingData?.pickupLocation) {
            flyToLocation(bookingService.bookingData.pickupLocation, 15);

            if (bookingService.rider) {
              const bookingRider = riders.find(
                (r) => r.id === bookingService.rider?.id
              );
              if (bookingRider) {
                setSelectedRider(bookingRider);
              }
            }
          }
          break;
        }
        case "multigroup": {
          const shortId = suggestion.value.replace("#", "");
          const multiGroupServices = serviceData.filter(
            (s) =>
              s.type === "BOOKING" &&
              s.bookingData?.multiGroupId &&
              s.bookingData.multiGroupId.slice(-6) === shortId
          );

          if (multiGroupServices.length > 0) {
            console.log(
              `Found ${multiGroupServices.length} services in multigroup ${shortId}`
            );

            // Find bounds for all pickup/dropoff locations in the group
            const bounds = new maplibregl.LngLatBounds();
            let hasValidCoordinates = false;

            multiGroupServices.forEach((service) => {
              if (service.bookingData?.pickupLocation) {
                bounds.extend(service.bookingData.pickupLocation);
                hasValidCoordinates = true;
              }
              if (service.bookingData?.dropoffLocation) {
                bounds.extend(service.bookingData.dropoffLocation);
                hasValidCoordinates = true;
              }
            });

            // Fit map to show all locations in the multi-group
            if (hasValidCoordinates && mapInstance.current) {
              mapInstance.current.fitBounds(bounds, {
                padding: 100,
                maxZoom: 15,
                duration: 1500,
              });
            }

            // If there's a rider assigned to any booking in the group, select them
            const riderService = multiGroupServices.find((s) => s.rider);
            if (riderService?.rider) {
              const groupRider = riders.find(
                (r) => r.id === riderService.rider?.id
              );
              if (groupRider) {
                setSelectedRider(groupRider);
                console.log(
                  `Selected rider ${groupRider.name} for multigroup ${shortId}`
                );
              }
            }
          }
          break;
        }
        case "vendor": {
          const vendorService = serviceData.find(
            (s) => s.vendor.name === suggestion.value
          );
          if (vendorService?.vendor?.coordinates) {
            flyToLocation(vendorService.vendor.coordinates, 15);
          }
          break;
        }
      }
    },
    [
      riders,
      serviceData,
      flyToLocation,
      setSelectedRider,
      getRelatedEntityData,
      mapInstance,
    ]
  );

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (routeUpdateTimeoutRef.current) {
        clearTimeout(routeUpdateTimeoutRef.current);
      }
      if (markerUpdateTimeoutRef.current) {
        clearTimeout(markerUpdateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-50">
        {/* Enhanced Mobile Header */}
        {isMobile && (
          <div className="bg-white/95 backdrop-blur-3xl border-b border-white/20  relative z-50 shadow-xl">
          

            {/* Mobile Menu Dropdown */}
            {showMobileMenu && (
              <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-3xl border border-white/20 rounded-b-3xl shadow-3xl mt-1 p-4 z-40">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-green-50/50 p-3 rounded-2xl border border-green-200/50">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-xs text-green-600 font-semibold">
                          Available
                        </p>
                        <p className="text-lg font-bold text-green-700">
                          {stats.availableRiders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-200/50">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-xs text-blue-600 font-semibold">
                          On Delivery
                        </p>
                        <p className="text-lg font-bold text-blue-700">
                          {stats.activeRiders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/50">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-purple-600 font-semibold">
                          Orders
                        </p>
                        <p className="text-lg font-bold text-purple-700">
                          {stats.totalOrders}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-200/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-xs text-orange-600 font-semibold">
                          Bookings
                        </p>
                        <p className="text-lg font-bold text-orange-700">
                          {stats.totalBookings}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem
                        checked={showIsochrones}
                        onCheckedChange={setShowIsochrones}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Delivery Zones
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={showRoutes}
                        onCheckedChange={setShowRoutes}
                        disabled={!isLoaded}
                      >
                        <Route className="h-4 w-4 mr-2" />
                        Delivery Routes
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => fetchAllRoutesForServices()}
                        disabled={
                          loadingDatabaseRoutes || serviceData.length === 0
                        }
                      >
                        <Database
                          className={`h-4 w-4 mr-2 ${
                            loadingDatabaseRoutes ? "animate-spin" : ""
                          }`}
                        />
                        Fetch All Routes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    onClick={() => setShowMobileMenu(false)}
                    variant="outline"
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="bg-white/95 backdrop-blur-3xl border-b border-white/20 p-4 relative z-50 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-black flex items-center gap-2 truncate tracking-tight">
                  Rider Services Live
                  {!isLoaded && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                </h1>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {stats.availableRiders} Available
                  </span>
                  <span className="flex items-center gap-1 text-sm text-blue-600 font-semibold">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    {stats.activeRiders} On Delivery
                  </span>
                  <span className="flex items-center gap-1 text-sm text-orange-600 font-semibold">
                    <Package className="w-3 h-3" />
                    {stats.totalOrders} Orders
                  </span>
                  <span className="flex items-center gap-1 text-sm text-purple-600 font-semibold">
                    <Calendar className="w-3 h-3" />
                    {stats.totalBookings} Bookings
                  </span>
                  <span className="text-sm text-black/50">
                    {stats.ordersWithRoutes} w/ Routes
                  </span>
                  {loadingRoutes.size > 0 && (
                    <span className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading {loadingRoutes.size} route
                      {loadingRoutes.size !== 1 ? "s" : ""}
                    </span>
                  )}
                  {loadingDatabaseRoutes && (
                    <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                      <Database className="w-3 h-3 animate-spin" />
                      Fetching DB routes{" "}
                      {stats.routeFetchProgress.total > 0 &&
                        `(${stats.routeFetchProgress.current}/${stats.routeFetchProgress.total})`}
                    </span>
                  )}
                </div>
              </div>

              {/* Enhanced Stats Cards - Desktop Only */}
              <div className="hidden xl:flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-green-50/50 px-3 py-2 rounded-2xl border border-green-200/50">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-xs text-green-600 font-semibold">
                            DB Routes
                          </p>
                          <p className="text-sm font-bold text-green-700">
                            {databaseRoutes.size}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Database stored routes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-blue-50/50 px-3 py-2 rounded-2xl border border-blue-200/50">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-semibold">
                            Active Riders
                          </p>
                          <p className="text-sm font-bold text-blue-700">
                            {riders.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total active riders</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-purple-50/50 px-3 py-2 rounded-2xl border border-purple-200/50">
                      <div className="flex items-center gap-2">
                        <Route className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-xs text-purple-600 font-semibold">
                            Delivery Routes
                          </p>
                          <p className="text-sm font-bold text-purple-700">
                            {riderRoutes.size}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Google Maps calculated routes</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-orange-50/50 px-3 py-2 rounded-2xl border border-orange-200/50">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-xs text-orange-600 font-semibold">
                            Service Items
                          </p>
                          <p className="text-sm font-bold text-orange-700">
                            {stats.totalServiceData}
                          </p>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total orders and bookings</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="ml-2">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={showIsochrones}
                      onCheckedChange={setShowIsochrones}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Delivery Zones
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={showRoutes}
                      onCheckedChange={setShowRoutes}
                      disabled={!isLoaded}
                    >
                      <Route className="h-4 w-4 mr-2" />
                      Delivery Routes
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => fetchAllRoutesForServices()}
                      disabled={
                        loadingDatabaseRoutes || serviceData.length === 0
                      }
                    >
                      <Database
                        className={`h-4 w-4 mr-2 ${
                          loadingDatabaseRoutes ? "animate-spin" : ""
                        }`}
                      />
                      Fetch All Routes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        refetch();
                        handleInitializeMap();
                      }}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
                      disabled={loading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                      />
                      <span className="ml-2">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh service data</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative">
          <div
            ref={mapRef}
            className="h-full w-full bg-gray-100"
            style={{ minHeight: "400px" }}
          >
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/95 backdrop-blur-3xl rounded-full flex items-center justify-center mx-auto mb-6 shadow-3xl border border-white/20">
                    <div className="relative">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-black mb-2 tracking-tight">
                    Loading Live Map
                  </h3>
                  <p className="text-sm text-black/60">
                    {!isLoaded
                      ? "Loading Google Maps..."
                      : "Connecting to rider services..."}
                  </p>
                  <div className="mt-4 flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Map Controls */}
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-10">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-black/40" />
                <Input
                  placeholder={
                    isMobile
                      ? "Search & navigate: riders, customers, orders..."
                      : "Search & navigate: riders, customers, orders (#123456), bookings (#654321), vendors..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() =>
                    searchQuery.length >= 2 && setShowSuggestions(true)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 200)
                  }
                  className="pl-10 h-10 sm:h-12 bg-white/95 backdrop-blur-3xl border-white/20 rounded-3xl shadow-3xl text-sm text-black placeholder:text-black/40 focus:bg-white/98 focus:border-white/30"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-3 text-black/40 hover:text-black/60 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
                <SearchSuggestions />
              </div>

              {/* Enhanced Filter Dropdown */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/95 backdrop-blur-3xl hover:bg-white/98 border-white/20 rounded-3xl shadow-3xl h-10 sm:h-12 px-3 sm:px-4"
                    >
                      <Filter className="h-4 w-4" />
                      {!isMobile && <span className="ml-2">Filter</span>}
                      {(statusFilter !== "all" ||
                        vehicleFilter !== "all" ||
                        typeFilter !== "all") && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-1"></div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Filter Riders</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Service Type Filter */}
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      Service Type
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={typeFilter === "all"}
                      onCheckedChange={() => setTypeFilter("all")}
                    >
                      All Types ({stats.totalServiceData})
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={typeFilter === "ORDER"}
                      onCheckedChange={() => setTypeFilter("ORDER")}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Orders ({stats.totalOrders})
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={typeFilter === "BOOKING"}
                      onCheckedChange={() => setTypeFilter("BOOKING")}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Bookings ({stats.totalBookings})
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator />

                    {/* Status Filter */}
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      Status
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === "all"}
                      onCheckedChange={() => setStatusFilter("all")}
                    >
                      All Status ({riders.length})
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === "Available"}
                      onCheckedChange={() => setStatusFilter("Available")}
                    >
                      Available ({stats.availableRiders})
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === "On Delivery"}
                      onCheckedChange={() => setStatusFilter("On Delivery")}
                    >
                      On Delivery ({stats.activeRiders})
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter === "On Break"}
                      onCheckedChange={() => setStatusFilter("On Break")}
                    >
                      On Break ({stats.onBreakRiders})
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator />

                    {/* Vehicle Filter */}
                    <DropdownMenuLabel className="text-xs text-gray-500">
                      Vehicle
                    </DropdownMenuLabel>
                    <DropdownMenuCheckboxItem
                      checked={vehicleFilter === "all"}
                      onCheckedChange={() => setVehicleFilter("all")}
                    >
                      All Vehicles
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={vehicleFilter === "Motorcycle"}
                      onCheckedChange={() => setVehicleFilter("Motorcycle")}
                    >
                      <Car className="h-4 w-4 mr-2" />
                      Motorcycles ({stats.motorcycles})
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={vehicleFilter === "Bicycle"}
                      onCheckedChange={() => setVehicleFilter("Bicycle")}
                    >
                      <Bike className="h-4 w-4 mr-2" />
                      Bicycles ({stats.bicycles})
                    </DropdownMenuCheckboxItem>

                    {/* Clear all filters option */}
                    {(statusFilter !== "all" ||
                      vehicleFilter !== "all" ||
                      typeFilter !== "all") && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setStatusFilter("all");
                            setVehicleFilter("all");
                            setTypeFilter("all");
                          }}
                          className="text-red-600 font-medium"
                        >
                          Clear All Filters
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}

                  variant="outline"
                  className="bg-white/95 backdrop-blur-3xl hover:bg-white/98 border-white/20 rounded-3xl shadow-3xl h-10 sm:h-12 px-3 sm:px-4"
                >
                  <BarChart3 className="h-4 w-4" />
                  {!isMobile && <span className="ml-2">Analytics</span>}
                 
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Control Panel */}
          {showFilterPanel && <FilterControlPanel />}

          {/* Enhanced Floating Action Buttons */}
          <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3">
            {/* Filter Panel Toggle (when entity is selected) */}
            {showOnlyRelevant && selectedEntity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowFilterPanel((prev) => !prev)}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full shadow-3xl h-12 w-12 sm:h-14 sm:w-14 transition-all duration-300 hover:scale-110"
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                      </div>
                      <div className="text-xs opacity-90 mt-1">
                        {showFilterPanel ? "Hide" : "Show"}
                      </div>
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showFilterPanel ? "Hide" : "Show"} entity details</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Orders & Bookings Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowOrdersBookings(true)}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-full shadow-3xl h-12 w-12 sm:h-14 sm:w-14 transition-all duration-300 hover:scale-110"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <Package className="h-4 w-4 mr-1" />
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="text-xs opacity-90 mt-1">Services</div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {stats.totalServiceData}
                    </span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View orders and bookings</p>
              </TooltipContent>
            </Tooltip>

            {/* Riders Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowRidersList(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-3xl h-12 w-12 sm:h-14 sm:w-14 transition-all duration-300 hover:scale-110"
                >
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold">
                      {filteredRiders.length}
                    </div>
                    <div className="text-xs opacity-90">Riders</div>
                  </div>
                  {stats.activeRiders > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {stats.activeRiders}
                      </span>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View all riders</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Enhanced Bottom Sheets */}
        <Sheet open={showRidersList} onOpenChange={setShowRidersList}>
          <SheetContent side="bottom" className="h-[97%] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Riders
                {(statusFilter !== "all" ||
                  vehicleFilter !== "all" ||
                  typeFilter !== "all") && (
                  <span className="text-sm text-gray-500">
                    (Filtered: {filteredRiders.length}/{riders.length})
                  </span>
                )}
              </SheetTitle>
              <SheetDescription>
                {stats.availableRiders} available • {stats.activeRiders} on
                delivery • {stats.onBreakRiders} on break • {stats.totalOrders}{" "}
                orders • {stats.totalBookings} bookings
              </SheetDescription>
            </SheetHeader>
            <ActiveRiders
              riders={filteredRiders}
              onRiderClick={handleRiderClick}
            />
          </SheetContent>
        </Sheet>

        <Sheet open={showRiderDetails} onOpenChange={setShowRiderDetails}>
          <SheetContent side="bottom" className="h-[97vh] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Rider Details
              </SheetTitle>
              <SheetDescription>
                Live tracking and service information
              </SheetDescription>
            </SheetHeader>
            {selectedRider && (
              <RiderDetails
                rider={selectedRider}
                onBack={handleBackToMap}
                riderRoutes={riderRoutes}
                databaseRoutes={databaseRoutes}
                serviceData={serviceData}
              />
            )}
          </SheetContent>
        </Sheet>

        {/* Enhanced Service Management Sheet */}
        <Sheet open={showOrdersBookings} onOpenChange={setShowOrdersBookings}>
          <SheetContent side="bottom" className="h-[97%] rounded-t-2xl">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                Service Management
              </SheetTitle>
            </SheetHeader>

            <ServiceManagement
              serviceData={serviceData}
              riders={riders}
              stats={stats}
              onRiderClick={handleRiderClick}
              setShowOrdersBookings={setShowOrdersBookings}
              onViewOnLiveMap={handleViewOnLiveMap}
            />
          </SheetContent>
        </Sheet>

        {/* Loading Indicator */}
        {(loading || loadingDatabaseRoutes) && riders.length > 0 && (
          <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-3 border z-50">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs text-gray-600">
                {loadingDatabaseRoutes ? `Fetching routes...` : "Syncing..."}
              </span>
            </div>
          </div>
        )}

        {/* Route Fetch Progress */}
        {loadingDatabaseRoutes && stats.routeFetchProgress.total > 0 && (
          <div className="fixed bottom-16 left-4 bg-white rounded-lg shadow-lg p-3 border z-50">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 animate-spin text-purple-600" />
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-900 mb-1">
                  Fetching Routes ({stats.routeFetchProgress.current}/
                  {stats.routeFetchProgress.total})
                </div>
                <div className="w-24 h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-1 bg-purple-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (stats.routeFetchProgress.current /
                          stats.routeFetchProgress.total) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error States */}
        {loadError && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="text-center max-w-md mx-auto px-4">
              <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Google Maps Error
              </h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                Failed to load Google Maps API. Please check your API key and
                try again.
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Error: {loadError.message}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>
          </div>
        )}

        {loading && serviceData.length === 0 && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading Rider Services
              </h3>
              <p className="text-gray-600">
                Please wait while we fetch live data...
              </p>
            </div>
          </div>
        )}

        {error && serviceData.length === 0 && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
            <div className="text-center max-w-md mx-auto px-4">
              <XCircle className="w-16 h-16 mx-auto mb-6 text-red-500" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Service Unavailable
              </h3>
              <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                {error.message}
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default LiveMap;
