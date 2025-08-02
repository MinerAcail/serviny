"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useQuery, gql } from "@apollo/client";
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
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  Package,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  MapPin,
  DollarSign,
  Building,
  Link,
  BarChart3,
  X,
  Menu,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Info,
  ChevronUp,
  ChevronDown,
  MapPinHouse,
  Crosshair,
} from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Import rider-specific utilities
import {
  RiderServiceData,
  RiderSearchSuggestion,
  RiderSelectedEntity,
  ProcessedRiderData,
  // RiderRouteData,
  generateRiderSearchSuggestions,
  // getRiderRelatedEntityData,
  handleRiderSearchSuggestionSelect,
  addRiderRoutesToMap,
  // parseRouteGeoJSON,
  getServiceStatusColor,
  // formatServiceSummary,
} from "@/components/rider/riderEntityUtils";

// Import the enhanced components
import { FilterControlPanel } from "@/components/rider/FilterControlPanel";
import RiderServiceManagement from "@/components/rider/RiderServiceManagement";
// import { Badge } from "../ui/badge";

// Import enhanced location tracking components
import {
  LocationTrackingButton,
  // LocationStatusCard,
  LocationErrorCard,
  // useLocationTracking,
  locationTrackingStyles,
  // RiderLocation,
  // MovementStatusCard,
  useLocationTrackingServiceRider,
} from "@/components/rider/LocationTrackingManagement";
import { Badge } from "@/components/ui/badge";

// GraphQL Query for rider's assigned data
export const GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA = gql`
  query GetAllRidersBookingAndOrdersAssignedData {
    getAllRidersBookingAndOrdersAssignedData {
      id
      serviceId
      type
      createdAt
      
      rider {
        id
        name
        number
        location
        coordinates
      }
      
      customer {
        name
        dpfile
        number
      }
      
      vendor {
        id
        name
        location
        coordinates
      }
      
      orderData {
        orderId
        status
        deliveryAddress
        estimatedDeliveryDate
        serviceFee
        paymentStatus
        paymentMethod
        productInfor {
          product {
            id
            name
            price
            state
          }
          quantity
        }
        deliveryMetaData {
          id
          price
          duration
          distance
          zone
          geojson
          isochroneId
        }
        routeData {
          id
          orderId
          geojson
          userId
          createdAt
        }
        order {
          id
          coordinates
          deliveryAddress
          distance
          duration
        }
      }
      
      bookingData {
        bookingId
        status
        startTime
        endTime
        day
        item
        tableSize
        userType
        isConfirmed
        pickupLocation
        dropoffLocation
        deliveryAddress
        pickUpAddress
        multiGroupId
        deliveryFee
        distance
        duration
        estimatedDeliveryDate
        paymentStatus
        paymentMethod
            
        cargoId
        rangeMetaData {
          id
          riderId
          startKm
          endKm
          price
        }
        routeData {
          id
          orderId
          geojson
          userId
          createdAt
        }
      }
    }
  }
`;

const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

// Main RiderLiveMap Component
const StandardDelveryRiderServiceLiveMap: React.FC = () => {
  // State management
  const [showServiceManagement, setShowServiceManagement] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showServiceZones, setShowServiceZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<RiderSelectedEntity | null>(null);
  const [showOnlyRelevant, setShowOnlyRelevant] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const [showInfor, setshowInfor] = useState(false);

  // Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markerUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced location tracking hook with real-time settings
  const locationTracking = useLocationTrackingServiceRider(mapInstance, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 500, // Fresh data for real-time updates
    autoCenter: true,
    showAccuracyCircle: true,
    showBearing: true,
    enableServerSync: true,
  });

  // GraphQL query
  const { loading, error, data, refetch } = useQuery(
    GET_ALL_RIDERS_BOOKING_AND_ORDERS_ASSIGNED_DATA,
    {
      pollInterval: 60000, // 60,000 ms = 60 seconds (1 minute)
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
    }
  );

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

  // Service data
  const serviceData: RiderServiceData[] = useMemo(
    () => data?.getAllRidersBookingAndOrdersAssignedData || [],
    [data]
  );

  // Process rider data
  const riderData: ProcessedRiderData | null = useMemo(() => {
    if (serviceData.length === 0) return null;
    
    // Get the first rider from the service data (assuming single rider view)
    const firstService = serviceData[0];
    if (!firstService?.rider) return null;

    const rider = firstService.rider;
    let position: { lat: number; lng: number };

    if (rider.coordinates && rider.coordinates.length >= 2) {
      position = {
        lat: rider.coordinates[1],
        lng: rider.coordinates[0],
      };
    } else {
      // Default position (Accra)
      position = {
        lat: 5.6037,
        lng: -0.187,
      };
    }

    // Calculate stats
    const orders = serviceData.filter(s => s.type === "ORDER").length;
    const bookings = serviceData.filter(s => s.type === "BOOKING").length;
    
    const totalEarnings = serviceData.reduce((sum, service) => {
      if (service.type === "ORDER") {
        return sum + (service.orderData?.deliveryMetaData?.price || 0);
      }
      if (service.type === "BOOKING") {
        return sum + parseFloat(service.bookingData?.deliveryFee || "0");
      }
      return sum;
    }, 0);

    return {
      id: rider.id,
      name: rider.name,
      status: "On Delivery",
      location: rider.location,
      phone: rider.number,
      vehicle: "Motorcycle",
      rating: 4.5,
      position,
      earnings: `GH₵${totalEarnings.toFixed(2)}`,
      orders,
      bookings,
    };
  }, [serviceData]);

  // Generate search suggestions using the utility function
  const searchSuggestions: RiderSearchSuggestion[] = useMemo(() => {
    return generateRiderSearchSuggestions(searchQuery, serviceData);
  }, [searchQuery, serviceData]);

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
      center: [-0.187, 5.6037], // Default to Accra
      zoom: 12,
      attributionControl: false,
      maxZoom: 18,
      minZoom: 8,
    });

    mapInstance.current = map;

    map.on("load", () => {
      setMapLoaded(true);
      console.log("Rider map loaded successfully");
    });

    map.on("error", (e) => {
      console.error("Rider map error:", e);
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
      
      // Only clean up service markers, not location tracking markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      // Location tracking markers are cleaned up by their own hook

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  } catch (error) {
    console.error("Failed to initialize rider map:", error);
  }
}, [maptilerApiKey]);

  // Add location tracking styles to document
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.textContent = popupStyles + locationTrackingStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Add routes to map when data changes
  useEffect(() => {
    if (!mapInstance.current || !mapLoaded) return;

    addRiderRoutesToMap(
      mapInstance.current,
      serviceData,
      showRoutes,
      selectedEntity,
      showOnlyRelevant
    );
  }, [mapLoaded, showRoutes, serviceData, selectedEntity, showOnlyRelevant]);

  // Update markers
// In the useEffect that updates markers, add this condition at the beginning:
// Complete useEffect for updating markers with location tracking protection
// Replace your existing marker update useEffect with this complete version
useEffect(() => {
  if (!mapInstance.current || !mapLoaded) return;

  if (markerUpdateTimeoutRef.current) {
    clearTimeout(markerUpdateTimeoutRef.current);
  }

  markerUpdateTimeoutRef.current = setTimeout(() => {
    try {
      console.log('Clearing all service markers, current count:', markersRef.current.length);
      
      // Clear ALL existing markers in markersRef (location tracking is separate now)
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = []; // Reset to empty array

      // Create new markers for services
      const servicesToShow = showOnlyRelevant && selectedEntity
        ? selectedEntity.relatedData.services
        : serviceData;

      console.log(`Creating markers for ${servicesToShow.length} services`);

      // Add markers for each service location
      servicesToShow.forEach((service) => {
        if (service.type === "ORDER" && service.orderData?.order?.coordinates) {
          const marker = new maplibregl.Marker({ 
            color: getServiceStatusColor(service),
            scale: showOnlyRelevant ? 1.2 : 1.0 
          })
            .setLngLat(service.orderData.order.coordinates)
            .setPopup(new maplibregl.Popup({ className: "enhanced-popup" }).setHTML(`
              <div class="p-3">
                <h3 class="font-bold">Order #${service.orderData.orderId.slice(-6)}</h3>
                <p class="text-sm font-medium">${service.customer.name}</p>
                <p class="text-xs text-gray-600">${service.orderData.deliveryAddress}</p>
                <p class="text-xs font-medium mt-1">Status: ${service.orderData.status}</p>
                <p class="text-xs font-medium">Amount: GH₵${service.orderData.deliveryMetaData?.price || 0}</p>
              </div>
            `))
            .addTo(mapInstance.current!);
          markersRef.current.push(marker);

          // Add vendor marker if coordinates exist
          if (service.vendor?.coordinates) {
            const vendorMarker = new maplibregl.Marker({ 
              color: "#10B981",
              scale: showOnlyRelevant ? 1.1 : 0.9 
            })
              .setLngLat(service.vendor.coordinates)
              .setPopup(new maplibregl.Popup({ className: "enhanced-popup" }).setHTML(`
                <div class="p-3">
                  <h3 class="font-bold">${service.vendor.name}</h3>
                  <p class="text-sm">Vendor</p>
                  <p class="text-xs text-gray-600">${service.vendor.location}</p>
                  <p class="text-xs font-medium mt-1">Order #${service.orderData.orderId.slice(-6)}</p>
                </div>
              `))
              .addTo(mapInstance.current!);
            markersRef.current.push(vendorMarker);
          }
        } else if (service.type === "BOOKING" && service.bookingData) {
          // Pickup marker
          if (service.bookingData.pickupLocation) {
            const pickupMarker = new maplibregl.Marker({ 
              color: "#8B5CF6",
              scale: showOnlyRelevant ? 1.2 : 1.0 
            })
              .setLngLat(service.bookingData.pickupLocation)
              .setPopup(new maplibregl.Popup({ className: "enhanced-popup" }).setHTML(`
                <div class="p-3">
                  <h3 class="font-bold">Pickup - Booking #${service.bookingData.bookingId.slice(-6)}</h3>
                  <p class="text-sm font-medium">${service.customer.name}</p>
                  <p class="text-xs text-gray-600">${service.bookingData.pickUpAddress}</p>
                  <p class="text-xs font-medium mt-1">Status: ${service.bookingData.status || "Pending"}</p>
                  <p class="text-xs font-medium">Amount: GH₵${service.bookingData.deliveryFee}</p>
                  ${service.bookingData.multiGroupId ? `<p class="text-xs font-medium">Multi-Group: #${service.bookingData.multiGroupId.slice(-6)}</p>` : ''}
                </div>
              `))
              .addTo(mapInstance.current!);
            markersRef.current.push(pickupMarker);
          }

          // Dropoff marker
          if (service.bookingData.dropoffLocation) {
            const dropoffMarker = new maplibregl.Marker({ 
              color: "#7C3AED",
              scale: showOnlyRelevant ? 1.2 : 1.0 
            })
              .setLngLat(service.bookingData.dropoffLocation)
              .setPopup(new maplibregl.Popup({ className: "enhanced-popup" }).setHTML(`
                <div class="p-3">
                  <h3 class="font-bold">Dropoff - Booking #${service.bookingData.bookingId.slice(-6)}</h3>
                  <p class="text-sm font-medium">${service.customer.name}</p>
                  <p class="text-xs text-gray-600">${service.bookingData.deliveryAddress}</p>
                  <p class="text-xs font-medium mt-1"> ${service.bookingData.tableSize}   ${service.bookingData.tableSize === 1 ? 'item' : 'items'}</p>
                  <p class="text-xs font-medium">Day: ${service.bookingData.day}</p>
                  ${service.bookingData.multiGroupId ? `<p class="text-xs font-medium">Multi-Group: #${service.bookingData.multiGroupId.slice(-6)}</p>` : ''}
                </div>
              `))
              .addTo(mapInstance.current!);
            markersRef.current.push(dropoffMarker);
          }

          // Venue marker
          if (service.vendor?.coordinates) {
            const venueMarker = new maplibregl.Marker({ 
              color: "#10B981",
              scale: showOnlyRelevant ? 1.1 : 0.9 
            })
              .setLngLat(service.vendor.coordinates)
              .setPopup(new maplibregl.Popup({ className: "enhanced-popup" }).setHTML(`
                <div class="p-3">
                  <h3 class="font-bold">${service.vendor.name}</h3>
                  <p class="text-sm">Provider</p>
                  <p class="text-xs text-gray-600">${service.vendor.location}</p>
                  <p class="text-xs font-medium mt-1">Booking #${service.bookingData.bookingId.slice(-6)}</p>
                </div>
              `))
              .addTo(mapInstance.current!);
            markersRef.current.push(venueMarker);
          }
        }
      });

      // Add rider marker if available and not using real-time tracking
      if (riderData && !locationTracking.isTracking) {
        const riderMarker = new maplibregl.Marker({ 
          color: "#3B82F6",
          scale: 1.3 
        })
          .setLngLat([riderData.position.lng, riderData.position.lat])
          .setPopup(new maplibregl.Popup({ className: "enhanced-popup" }).setHTML(`
            <div class="p-3">
              <h3 class="font-bold">${riderData.name}</h3>
              <p class="text-sm">${riderData.status} • ${riderData.vehicle}</p>
              <p class="text-xs text-gray-600">${riderData.location}</p>
              <p class="text-xs font-medium mt-1">Orders: ${riderData.orders} • Bookings: ${riderData.bookings}</p>
              <p class="text-xs font-medium">Earnings: ${riderData.earnings}</p>
              <p class="text-xs font-medium">Rating: ⭐ ${riderData.rating}/5</p>
            </div>
          `))
          .addTo(mapInstance.current!);
        markersRef.current.push(riderMarker);
      }

      // Fit map bounds only if not using real-time tracking
      if ((servicesToShow.length > 0 || (riderData && !locationTracking.isTracking)) && !locationTracking.isTracking) {
        const bounds = new maplibregl.LngLatBounds();
        let hasCoordinates = false;

        // Add rider position (if not tracking real-time location)
        if (riderData && !locationTracking.isTracking) {
          bounds.extend([riderData.position.lng, riderData.position.lat]);
          hasCoordinates = true;
        }

        // Add service locations
        servicesToShow.forEach((service) => {
          if (service.vendor?.coordinates) {
            bounds.extend(service.vendor.coordinates);
            hasCoordinates = true;
          }
          if (service.type === "ORDER" && service.orderData?.order?.coordinates) {
            bounds.extend(service.orderData.order.coordinates);
            hasCoordinates = true;
          } else if (service.type === "BOOKING") {
            if (service.bookingData?.pickupLocation) {
              bounds.extend(service.bookingData.pickupLocation);
              hasCoordinates = true;
            }
            if (service.bookingData?.dropoffLocation) {
              bounds.extend(service.bookingData.dropoffLocation);
              hasCoordinates = true;
            }
          }
        });

        // Only fit bounds if we have coordinates and not tracking location
        if (hasCoordinates && !bounds.isEmpty() && !locationTracking.isTracking) {
          mapInstance.current?.fitBounds(bounds, {
            padding: showOnlyRelevant ? 100 : 80,
            maxZoom: showOnlyRelevant ? 16 : 15,
          });
        }
      }

      console.log(`Created ${markersRef.current.length} service markers (location tracking is separate)`);
      
    } catch (error) {
      console.error("Error updating rider markers:", error);
    }
  }, 500);

  return () => {
    if (markerUpdateTimeoutRef.current) {
      clearTimeout(markerUpdateTimeoutRef.current);
    }
  };
}, [serviceData, riderData, mapLoaded, showOnlyRelevant, selectedEntity, locationTracking.isTracking]);


  // Handle search suggestion selection
  const handleSearchSuggestionSelect = useCallback((suggestion: RiderSearchSuggestion) => {
    handleRiderSearchSuggestionSelect(
      suggestion,
      serviceData,
      setSelectedEntity,
      setShowOnlyRelevant,
      setSearchQuery,
      setShowSuggestions,
      mapInstance
    );
  }, [serviceData]);

  // Clear entity filter
  const clearEntityFilter = useCallback(() => {
    console.log("🧹 Clearing entity filter - will show all routes again");
    setShowFilterPanel(false);
    setShowSuggestions(false);
  }, []);

  // Handle item click
  const handleItemClick = useCallback((item: any, type: string) => {
    console.log("Item clicked:", item, type);
    setSelectedItem({ item, type });
    
    // Focus on relevant locations on map
    if (mapInstance.current && item) {
      const bounds = new maplibregl.LngLatBounds();
      let hasCoordinates = false;

      if (type === "order" && item.orderData?.order?.coordinates) {
        bounds.extend(item.orderData.order.coordinates);
        hasCoordinates = true;
        if (item.vendor?.coordinates) {
          bounds.extend(item.vendor.coordinates);
          hasCoordinates = true;
        }
      } else if (type === "booking") {
        if (item.bookingData?.pickupLocation) {
          bounds.extend(item.bookingData.pickupLocation);
          hasCoordinates = true;
        }
        if (item.bookingData?.dropoffLocation) {
          bounds.extend(item.bookingData.dropoffLocation);
          hasCoordinates = true;
        }
        if (item.vendor?.coordinates) {
          bounds.extend(item.vendor.coordinates);
          hasCoordinates = true;
        }
      }

      if (hasCoordinates && !bounds.isEmpty()) {
        mapInstance.current.fitBounds(bounds, {
          padding: 100,
          maxZoom: 16,
          duration: 1500,
        });
      }
    }
  }, []);

  // Handle viewing item on map
  const handleViewOnMap = useCallback((item: any, type: string) => {
    console.log("item, type", item, type);
    
    handleItemClick(item, type);
    setShowServiceManagement(false);
  }, [handleItemClick]);

  // Handle contacting customer
  const handleContactCustomer = useCallback((customer: any) => {
    if (customer?.number) {
      window.open(`tel:${customer.number}`, "_self");
    }
  }, []);

  // Handle navigation to location
  const handleNavigateToLocation = useCallback((coordinates: [number, number], label: string) => {
    if (coordinates && coordinates.length >= 2) {
      // Open in Google Maps for navigation
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}&travelmode=driving`;
      window.open(url, "_blank");
      
      // Also focus on map
      if (mapInstance.current) {
        mapInstance.current.flyTo({
          center: coordinates,
          zoom: 16,
          duration: 1500,
        });
      }
    }
  }, []);

  // Handle search focus/blur/clear
  const handleSearchFocus = () => {
    if (searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    clearEntityFilter();
  };

  // Handle input changes with immediate suggestion display
  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(`🔍 Search input changed: "${value}"`);
    setSearchQuery(value);
    
    // Immediately show suggestions if criteria met
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, []);

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

  // Stats calculation
  const stats = useMemo(() => {
    const orders = serviceData.filter((s) => s.type === "ORDER");
    const bookings = serviceData.filter((s) => s.type === "BOOKING");
    
    return {
      totalOrders: orders.length,
      totalBookings: bookings.length,
      totalServices: serviceData.length,
      confirmedOrders: orders.filter(o => o.orderData?.status === "CONFIRMED").length,
      confirmedBookings: bookings.filter(b => b.bookingData?.isConfirmed).length,
      totalEarnings: serviceData.reduce((sum, service) => {
        if (service.type === "ORDER") {
          return sum + (service.orderData?.deliveryMetaData?.price || 0);
        }
        if (service.type === "BOOKING") {
          return sum + parseFloat(service.bookingData?.deliveryFee || "0");
        }
        return sum;
      }, 0),
    };
  }, [serviceData]);

  // Enhanced Search suggestions component
  const SearchSuggestions = useCallback(() => {
    // console.log(`🔍 SearchSuggestions render - showSuggestions: ${showSuggestions}, suggestions count: ${searchSuggestions.length}, query: "${searchQuery}"`);
    
    if (!showSuggestions || searchSuggestions.length === 0) {
      // console.log(`❌ Not showing suggestions - showSuggestions: ${showSuggestions}, count: ${searchSuggestions.length}`);
      return null;
    }

    // console.log(`✅ Rendering ${searchSuggestions.length} suggestions`);

    return (
      <div className="absolute top-full  left-0 right-0 bg-white/95 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-3xl z-50 mt-2 max-h-80 overflow-hidden">
        <ScrollArea className="max-h-80">
          <div className="p-3">
            <div className="flex justify-between items-center mb-3">
              <div className="text-xs text-black/60 font-semibold flex items-center gap-2">
                <Search className="h-3 w-3" />
                Search Results ({searchSuggestions.length}) - Click to navigate
              </div>
              <button
                className="text-xs hover:bg-red-100 cursor-pointer rounded-lg text-red-500 px-2 py-1 font-medium flex items-center gap-1 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearchClear();
                }}
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            </div>
            {searchSuggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                className="w-full text-left px-3 py-3 hover:bg-white/20 rounded-2xl flex items-center gap-3 text-sm transition-all duration-300 group border-b border-white/10 last:border-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`🎯 Suggestion clicked: ${suggestion.label}`);
                  handleSearchSuggestionSelect(suggestion);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                }}
              >
                <span className="text-lg">{suggestion.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-black group-hover:text-black/80 truncate">
                    {suggestion.label}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
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

                    {suggestion.customer && suggestion.type !== "multigroup" && (
                      <span className="text-xs text-black/60 bg-white/20 px-2 py-0.5 rounded-full">
                        👤 {suggestion.customer}
                      </span>
                    )}
                    
                    {(suggestion as any).serviceCount && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        📋 {(suggestion as any).serviceCount} service{(suggestion as any).serviceCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    
                    {(suggestion as any).status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        (suggestion as any).status === "CONFIRMED" || (suggestion as any).status === "Confirmed"
                          ? "bg-green-100 text-green-700"
                          : (suggestion as any).status === "Pending"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {(suggestion as any).status}
                      </span>
                    )}
                    {('bookingData' in suggestion && suggestion.bookingData?.cargoId) ? (
                      <Badge className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        CARGO
                      </Badge>
                    ) : (
                      <>
                        {(suggestion as any).amount && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            💰 {(suggestion as any).amount}
                          </span>
                        )}
                      </>
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
  }, [showSuggestions, searchSuggestions, searchQuery, handleSearchClear, handleSearchSuggestionSelect]);

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
      <div className="h-screen flex-1 p-2 flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-50">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="bg-white/95 backdrop-blur-3xl border-b border-white/20 p-4 relative z-50 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2 truncate tracking-tight">
                  My Deliveries
                  {loading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                </h1>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-sm text-orange-600 font-semibold">
                    <Package className="w-3 h-3" />
                    {stats.totalOrders} Orders
                  </span>
                  <span className="flex items-center gap-1 text-sm text-purple-600 font-semibold">
                    <Calendar className="w-3 h-3" />
                    {stats.totalBookings} Bookings
                  </span>
                  <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                    <DollarSign className="w-3 h-3" />
                    GH₵{stats.totalEarnings.toFixed(2)}
                  </span>
                  <span className="text-sm text-black/50">
                    {stats.confirmedOrders + stats.confirmedBookings} confirmed
                  </span>
                  {riderData && (
                    <>
                      <span className="text-sm text-blue-600 font-semibold">
                        {riderData.vehicle} • {riderData.status}
                      </span>
                      <span className="text-sm text-black/50">
                        ⭐ {riderData.rating.toFixed(1)}/5
                      </span>
                    </>
                  )}
                  {/* Location tracking status in header */}
                  {locationTracking.isTracking && (
                    <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
                      <Navigation className="w-3 h-3 animate-pulse" />
                      Live Tracking
                    </span>
                  )}
                </div>
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
                      <span className="ml-2 hidden sm:inline">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Map Layers</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowServiceZones(!showServiceZones)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {showServiceZones ? "Hide" : "Show"} Service Zones
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setShowRoutes(!showRoutes)}
                    >
                      <Route className="h-4 w-4 mr-2" />
                      {showRoutes ? "Hide" : "Show"} Routes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => refetch()}
                      variant="outline"
                      className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      <span className="ml-2 hidden sm:inline">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh my deliveries</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="h-full w-full bg-gray-100">
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
                    Loading My Deliveries Map
                  </h3>
                  <p className="text-sm text-black/60">
                    Connecting to delivery data...
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
            <div className="flex pt-10 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-black/40" />
                <Input
                  placeholder={
                    isMobile
                      ? "Search my services..."
                      : "Search orders, bookings, customers, vendors..."
                  }
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="pl-10 h-10 sm:h-12 bg-white/95 backdrop-blur-3xl border-white/20 rounded-3xl shadow-3xl text-sm text-black placeholder:text-black/40 focus:bg-white/98 focus:border-white/30"
                />
                {searchQuery && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-3 top-3 text-black/40 hover:text-black/60 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
                <SearchSuggestions />
              </div>
            </div>
          </div>

          {/* Enhanced Location Status Cards */}
          {/* {locationTracking.isTracking && locationTracking.currentLocation && (
            <LocationStatusCard
              currentLocation={locationTracking.currentLocation}
              trackingDuration={locationTracking.trackingDuration}
              totalDistance={locationTracking.totalDistance}
              averageSpeed={locationTracking.averageSpeed}
              onClose={locationTracking.stopTracking}
              onCenterLocation={locationTracking.centerOnLocation}
              variant={isMobile ? "minimal" : "detailed"}
            />
          )} */}
{/* {locationTracking.isTracking && locationTracking.isMoving && locationTracking.currentLocation && (
  <MovementStatusCard
    isMoving={locationTracking.isMoving}
    speed={locationTracking.movementSpeed || 0}
    bearingChange={locationTracking.bearingChange || 0}
    currentLocation={locationTracking.currentLocation}
    onClose={() => {
      console.log('Movement status card manually closed');
      // The card will auto-hide after 10 seconds of no movement
    }}
    className="movement-status-card"
  />
)} */}
{/* {locationTracking.isTracking && (
  <span className="flex items-center gap-1 text-sm text-green-600 font-semibold">
    <Navigation className="w-3 h-3 animate-pulse" />
    Live Tracking
    {locationTracking.isMoving && (
      <span className="ml-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
        🏃 Moving {locationTracking.movementSpeed?.toFixed(0)} km/h
      </span>
    )}
  </span>
)} */}
{/* {locationTracking.isTracking && (
  <div className={`fixed top-4 right-4 backdrop-blur-lg rounded-full px-3 py-1 text-white text-xs font-medium z-50 flex items-center gap-2 shadow-lg transition-all duration-300 ${
    locationTracking.isMoving 
      ? 'bg-green-500/90 animate-pulse' 
      : 'bg-blue-500/90'
  }`}>
    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
    <span>
      {locationTracking.isMoving 
        ? `Moving ${locationTracking.movementSpeed?.toFixed(0)} km/h` 
        : 'Live Tracking'
      }
    </span>
    <Navigation className="w-3 h-3" />
  </div>
)} */}
          {locationTracking.error && (
            <LocationErrorCard
              error={locationTracking.error}
              onRetry={locationTracking.startTracking}
              onDismiss={locationTracking.clearError}
            />
          )}

          {/* Real-time Location Tracking Indicator */}
          {locationTracking.isTracking && (
            <div className="fixed top-4 left-4 bg-green-500/90 backdrop-blur-lg rounded-full px-3 py-1 text-white text-xs font-medium z-10 flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Live Tracking</span>
              <Navigation className="w-3 h-3" />
            </div>
          )}

          {/* Filter Control Panel */}
          <FilterControlPanel 
            clearEntityFilter={clearEntityFilter}
            isExpanded={isExpanded}
            setIsExpanded={setIsExpanded}
            isMobile={isMobile}
            mapInstance={mapInstance}
            selectedEntity={selectedEntity}
            showFilterPanel={showFilterPanel}
          />

          {/* Enhanced Floating Action Buttons */}
          <div className="absolute bottom-32 right-6 z-20 flex flex-col gap-3">
            {/* Filter Panel Toggle - Show when entity is selected */}
            {selectedEntity && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`bg-gradient-to-r ${
                      showFilterPanel 
                        ? 'from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800' 
                        : 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                    } text-white rounded-full shadow-3xl h-12 w-12 sm:h-14 sm:w-14 transition-all duration-300 hover:scale-110`}
                  >
                    <div className="text-center">
                      <div className="flex items-center justify-center">
                        {showFilterPanel ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <Info className="h-4 w-4" />
                        )}
                      </div>
                      <div className="text-xs opacity-90 mt-1">
                        {showFilterPanel ? "Hide" : "Details"}
                      </div>
                    </div>
                    {showFilterPanel && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showFilterPanel ? "Hide" : "Show"} service details</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Enhanced Location Tracking Button */}
            <LocationTrackingButton
              isTracking={locationTracking.isTracking}
              hasError={!!locationTracking.error}
              isLoading={locationTracking.isLoading}
              onToggle={locationTracking.toggleTracking}
              size="md"
            />

            {/* Services Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowServiceManagement(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-3xl h-12 w-12 sm:h-14 sm:w-14 transition-all duration-300 hover:scale-110"
                >
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="h-3 w-3" />
                      <Calendar className="h-3 w-3" />
                    </div>
                    <div className="text-base sm:text-lg font-bold">{stats.totalServices}</div>
                    <div className="text-xs opacity-90">Services</div>
                  </div>
                  {(stats.confirmedOrders + stats.confirmedBookings) > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {stats.confirmedOrders + stats.confirmedBookings}
                      </span>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View my services</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Service Management Sheet */}
        <Sheet open={showServiceManagement} onOpenChange={setShowServiceManagement}>
          <SheetContent side="bottom" className="h-[95vh] rounded-t-2xl">
            <SheetHeader className="mb-5">
              <SheetTitle className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                My Service Management
              </SheetTitle>
              <Button
                onClick={() => setshowInfor(!showInfor)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetHeader>

            <RiderServiceManagement
              serviceData={serviceData}
              onItemClick={handleItemClick}
              onViewOnMap={handleViewOnMap}
              onContactCustomer={handleContactCustomer}
              onNavigateToLocation={handleNavigateToLocation}
              onViewOnLiveMap={handleViewOnLiveMap}
              showInfor={showInfor} 
              setshowInfor={setshowInfor}
            />
          </SheetContent>
        </Sheet>

        {/* Loading Indicators */}
        {loading && serviceData.length > 0 && (
          <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-3 border z-50">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs text-gray-600">Syncing...</span>
            </div>
          </div>
        )}

        {loadingRoutes && (
          <div className="fixed bottom-16 left-4 bg-white rounded-lg shadow-lg p-3 border z-50">
            <div className="flex items-center gap-3">
              <Route className="w-4 h-4 animate-spin text-purple-600" />
              <div className="text-xs">
                <div className="font-medium text-gray-900">Calculating Route...</div>
                <div className="text-gray-500">Optimizing your delivery path</div>
              </div>
            </div>
          </div>
        )}

        {/* Location tracking loading indicator */}
        {locationTracking.isLoading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 border z-50">
            <div className="flex items-center gap-3">
              <Navigation className="w-4 h-4 animate-spin text-blue-600" />
              <div className="text-xs">
                <div className="font-medium text-gray-900">Getting Location...</div>
                <div className="text-gray-500">Please allow location access</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error States */}
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

        {!loading && !error && serviceData.length === 0 && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 bg-white/95 backdrop-blur-3xl rounded-full flex items-center justify-center mx-auto mb-6 shadow-3xl border border-white/20">
                <Package className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2 tracking-tight">
                No Active Deliveries
              </h3>
              <p className="text-sm text-black/60 mb-4">
                You don't have any assigned orders or bookings at the moment.
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-6 py-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check for New Deliveries
              </Button>
            </div>
          </div>
        )}

        {loading && serviceData.length === 0 && (
          <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/95 backdrop-blur-3xl rounded-full flex items-center justify-center mx-auto mb-6 shadow-3xl border border-white/20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2 tracking-tight">
                Loading My Deliveries
              </h3>
              <p className="text-sm text-black/60">
                Please wait while we fetch your assigned services...
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
    </TooltipProvider>
  );
};

// Enhanced popup styles
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

export default StandardDelveryRiderServiceLiveMap;