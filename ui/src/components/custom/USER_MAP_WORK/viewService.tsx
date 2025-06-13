"use client";

import type React from "react";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery } from "@apollo/client";
import {
  Loader2,
  Package,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Search,
  RefreshCw,
  Phone,
  ChevronRight,
  X,
  List,
  Settings,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import our modular files
import {
  GET_ALL_USER_SERVICE_DATA,
  type ServiceData,
  type ServiceStats,
  type ViewMode,
  type ActiveTab,
  type SortBy,
} from "./types";

// Import functional map manager
import {
  createMapState,
  initializeMap,
  updateMapData,
  destroyMap,
  debugMapState,
  type MapState,
} from "./mapManager";
import ServiceListDialog from "./serviceListDialog";

const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

export default function UserServiceViewer() {
  // State management
  const [showDialog, setShowDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceData | null>(null);
  const [isCardOpen, setIsCardOpen] = useState(true); // New state for card toggle
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Map refs - now using functional approach with callback ref
  const mapStateRef = useRef<MapState | null>(null);
  const [mapContainer, setMapContainer] = useState<HTMLDivElement | null>(null);

  // Callback ref to ensure we get the container when it's available
  const mapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      console.log("📍 Map container is now available:", node);
      setMapContainer(node);
    } else {
      console.log("📍 Map container removed");
      setMapContainer(null);
    }
  }, []);

  // GraphQL query
  const { loading, error, data, refetch } = useQuery(
    GET_ALL_USER_SERVICE_DATA,
    {
      pollInterval: 60000,
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
    }
  );

  const serviceData: ServiceData[] = useMemo(
    () => data?.getAllUserServiceData || [],
    [data]
  );

  // Initialize map when container becomes available
  useEffect(() => {
    if (!mapContainer) {
      console.log("⏳ Waiting for map container...");
      return;
    }

    if (mapStateRef.current) {
      console.warn("⚠️ Map already initialized, skipping...");
      return;
    }

    // Check if container has dimensions
    const containerRect = mapContainer.getBoundingClientRect();
    console.log("📐 Container dimensions:", {
      width: containerRect.width,
      height: containerRect.height,
      top: containerRect.top,
      left: containerRect.left,
    });

    if (containerRect.width === 0 || containerRect.height === 0) {
      console.warn("⚠️ Container has no dimensions, waiting...");

      // Try again after a short delay
      const retryTimeout = setTimeout(() => {
        const newRect = mapContainer.getBoundingClientRect();
        if (newRect.width > 0 && newRect.height > 0) {
          console.log(
            "✅ Container now has dimensions, retrying initialization"
          );
          // Trigger re-render to retry
          setMapContainer(mapContainer);
        }
      }, 1000);

      return () => clearTimeout(retryTimeout);
    }

    console.log("🗺️ Initializing map with functional approach...");

    try {
      // Create map state
      mapStateRef.current = createMapState();

      // Initialize map
      initializeMap(
        mapStateRef.current,
        mapContainer,
        maptilerApiKey || "",
        () => {
          console.log("✅ Map loaded successfully - setting mapLoaded to true");
          setMapLoaded(true);
        }
      );

      // Debug map state after 5 seconds if still loading
      const debugTimeout = setTimeout(() => {
        if (mapStateRef.current && !mapLoaded) {
          console.log("🐛 Map still loading after 5 seconds, debugging...");
          debugMapState(mapStateRef.current);
        }
      }, 5000);

      return () => {
        clearTimeout(debugTimeout);
      };
    } catch (error) {
      console.error("💥 Failed to initialize map:", error);
      // Force show the map content even if initialization failed
      setTimeout(() => {
        console.log("🔄 Force setting map loaded after error");
        setMapLoaded(true);
      }, 3000);
    }
  }, [mapContainer, maptilerApiKey]); // Depend on mapContainer

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (mapStateRef.current) {
        console.log("🧹 Cleaning up map...");
        destroyMap(mapStateRef.current);
        mapStateRef.current = null;
      }
      setMapLoaded(false);
    };
  }, []);

  // Separate effect for debugging map state
  useEffect(() => {
    if (mapStateRef.current) {
      const interval = setInterval(() => {
        if (!mapLoaded && mapStateRef.current) {
          console.log("🔍 Periodic map state check...");
          debugMapState(mapStateRef.current);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [mapLoaded]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    if (!serviceData.length) return [];

    const filtered = serviceData.filter((item) => {
      const matchesSearch =
        item.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vendor.location
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.type === "ORDER" &&
          item.orderData?.orderId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (item.type === "BOOKING" &&
          item.bookingData?.bookingId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (item.type === "ORDER" && item.orderData?.status === statusFilter) ||
        (item.type === "BOOKING" &&
          (statusFilter === "confirmed"
            ? item.bookingData?.isConfirmed
            : !item.bookingData?.isConfirmed));

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "orders" && item.type === "ORDER") ||
        (activeTab === "bookings" && item.type === "BOOKING");

      return matchesSearch && matchesStatus && matchesTab;
    });

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "status": {
          const statusA =
            a.type === "ORDER"
              ? a.orderData?.status || ""
              : a.bookingData?.isConfirmed
              ? "confirmed"
              : "pending";
          const statusB =
            b.type === "ORDER"
              ? b.orderData?.status || ""
              : b.bookingData?.isConfirmed
              ? "confirmed"
              : "pending";
          return statusA.localeCompare(statusB);
        }
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [serviceData, searchQuery, statusFilter, sortBy, activeTab]);

  // Update map when data changes - using functional approach
  useEffect(() => {
    if (mapStateRef.current && mapLoaded && serviceData.length > 0) {
      console.log(
        `🔄 Updating map with ${filteredData.length} filtered items from ${serviceData.length} total`
      );
      try {
        updateMapData(
          mapStateRef.current,
          serviceData,
          filteredData,
          selectedItem,
          viewMode
        );
      } catch (error) {
        console.error("❌ Failed to update map:", error);
      }
    }
  }, [serviceData, filteredData, selectedItem, viewMode, mapLoaded]);

  // Statistics
  const stats: ServiceStats = useMemo(() => {
    const orders = serviceData.filter((item) => item.type === "ORDER");
    const bookings = serviceData.filter((item) => item.type === "BOOKING");

    return {
      totalOrders: orders.length,
      totalBookings: bookings.length,
      activeOrders: orders.filter((order) =>
        ["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"].includes(
          order.orderData?.status || ""
        )
      ).length,
      confirmedBookings: bookings.filter(
        (booking) => booking.bookingData?.isConfirmed
      ).length,
    };
  }, [serviceData]);

  // Event handlers
  const handleItemClick = (item: ServiceData) => {
    console.log(`👆 Selected item: ${item.type} ${item.id}`);
    setSelectedItem(item);
    setIsCardOpen(true); // Open the card when a new item is selected
    setViewMode("selected");
    setShowDialog(false);
  };

  const handleViewAll = () => {
    console.log("👁️ Viewing all items");
    setSelectedItem(null);
    setIsCardOpen(false); // Close the card
    setViewMode("all");
    setShowDialog(false);
  };

  const handleRefresh = () => {
    console.log("🔄 Refreshing data...");
    refetch();
  };

  // Toggle card visibility
  const handleToggleCard = () => {
    setIsCardOpen(!isCardOpen);
  };

  // Status badge helper
  const getStatusBadge = (item: ServiceData) => {
    if (item.type === "ORDER") {
      const status = item.orderData?.status || "UNKNOWN";
      const colors = {
        CONFIRMED: "bg-blue-100/80 text-blue-800 border-blue-200/50",
        PREPARING: "bg-yellow-100/80 text-yellow-800 border-yellow-200/50",
        OUT_FOR_DELIVERY:
          "bg-purple-100/80 text-purple-800 border-purple-200/50",
        DELIVERED: "bg-green-100/80 text-green-800 border-green-200/50",
        CANCELLED: "bg-red-100/80 text-red-800 border-red-200/50",
      };
      return (
        <Badge
          className={`backdrop-blur-xl border ${
            colors[status as keyof typeof colors] ||
            "bg-gray-100/80 text-gray-800 border-gray-200/50"
          }`}
        >
          {status}
        </Badge>
      );
    } else {
      const isConfirmed = item.bookingData?.isConfirmed;
      return (
        <Badge
          className={`backdrop-blur-xl border ${
            isConfirmed
              ? "bg-green-100/80 text-green-800 border-green-200/50"
              : "bg-yellow-100/80 text-yellow-800 border-yellow-200/50"
          }`}
        >
          {isConfirmed ? "Confirmed" : "Pending"}
        </Badge>
      );
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-100 via-white to-green-100 flex items-center justify-center">
        <div className="text-center backdrop-blur-xl bg-white/30 rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-xl">
            <div className="relative">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Loading Service Data
          </h3>
          <p className="text-sm text-gray-500">
            Fetching your orders and bookings...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-red-100 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center backdrop-blur-xl bg-white/30 rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md">
          <div className="w-20 h-20 bg-red-100/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-xl">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Failed to Load Data
          </h3>
          <p className="text-sm text-gray-500 mb-4">{error.message}</p>
          <Button
            onClick={handleRefresh}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-5">
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        <div ref={mapRefCallback} className="w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-white to-green-100 flex items-center justify-center">
            <div className="text-center backdrop-blur-xl bg-white/30 rounded-3xl p-8 border border-white/20 shadow-2xl max-w-md">
              <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl backdrop-blur-xl">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                  <div className="absolute inset-0 w-10 h-10 border-2 border-blue-200 rounded-full animate-pulse"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Loading Map
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Connecting to map services...
              </p>

              {/* Debug info in development */}
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-gray-400 space-y-1">
                  <p>
                    API Key: {maptilerApiKey ? "✅ Provided" : "❌ Using Demo"}
                  </p>
                  <p>Container: {mapContainer ? "✅ Ready" : "❌ Not Ready"}</p>
                  <p>State: {mapStateRef.current ? "✅ Created" : "❌ Null"}</p>
                </div>
              )}

              {/* Force show button after 10 seconds */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log("🔄 Force showing map interface");
                  setMapLoaded(true);
                }}
                className="mt-4 backdrop-blur-xl bg-white/20 hover:bg-white/30 border-white/30 text-gray-600"
              >
                Skip Loading
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Controls Bar */}
      <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 z-20">
        <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 backdrop-blur-xl bg-white/30 border-white/30 text-gray-700 placeholder-gray-500 text-sm h-10"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsStatsOpen(!isStatsOpen)}
                className="backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 h-10 px-3"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Stats</span>
              </Button>

              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 h-10 px-3"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Filter</span>
              </Button> */}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDialog(true)}
                className="backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 h-10 px-3"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">List</span>
              </Button>

              {/* <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 h-10 px-3"
              >
                <Settings className="h-4 w-4" />
              </Button> */}
            </div>
          </div>
        </div>
      </div>

     

      {/* Selected Item Info Card - Modified with toggle */}
      {selectedItem && (
        <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-auto sm:max-w-md z-10">
          <div className="backdrop-blur-xl bg-white/20 rounded-2xl border border-white/30 shadow-2xl">
            {/* Card Header - Always visible */}
            <div
              onClick={handleToggleCard}
              className="p-4 sm:p-6 border-b border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl ${
                      selectedItem.type === "ORDER"
                        ? "bg-orange-100/50"
                        : "bg-purple-100/50"
                    }`}
                  >
                    {selectedItem.type === "ORDER" ? (
                      <Package className="h-5 w-5 text-orange-600" />
                    ) : (
                      <Calendar className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedItem.type === "ORDER" ? "Order" : "Booking"} #
                      {selectedItem.type === "ORDER"
                        ? selectedItem.orderData?.orderId?.slice(-6)
                        : selectedItem.bookingData?.bookingId?.slice(-6)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedItem.vendor.name}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleCard}
                  className="backdrop-blur-xl bg-white/20 hover:bg-white/30 border border-white/30 text-gray-700 h-8 w-8 p-0"
                >
                  {isCardOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Collapsible Card Content */}
            {isCardOpen && (
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedItem.vendor.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date(selectedItem.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {getStatusBadge(selectedItem)}
                </div>

                {selectedItem.rider && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedItem.rider.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedItem.rider.number}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          window.open(
                            `tel:${selectedItem.rider?.number}`,
                            "_self"
                          )
                        }
                        className="backdrop-blur-xl bg-blue-500/80 hover:bg-blue-600/80 text-white border-0"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Stats Card */}
      {isStatsOpen && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
          <Card className="backdrop-blur-xl bg-white/20 border-white/30 shadow-2xl">
            <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-700" />
                    <span className="font-medium text-gray-700">Stats</span>
                  </div>
                  {isStatsOpen ? (
                    <ChevronUp className="h-4 w-4 text-gray-700" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-700" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0 pb-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center backdrop-blur-xl bg-orange-100/30 rounded-xl p-3 border border-orange-200/30">
                      <p className="text-xs text-orange-600 font-medium">
                        Orders
                      </p>
                      <p className="text-lg font-bold text-orange-700">
                        {stats.totalOrders}
                      </p>
                    </div>
                    <div className="text-center backdrop-blur-xl bg-purple-100/30 rounded-xl p-3 border border-purple-200/30">
                      <p className="text-xs text-purple-600 font-medium">
                        Bookings
                      </p>
                      <p className="text-lg font-bold text-purple-700">
                        {stats.totalBookings}
                      </p>
                    </div>
                    <div className="text-center backdrop-blur-xl bg-blue-100/30 rounded-xl p-3 border border-blue-200/30">
                      <p className="text-xs text-blue-600 font-medium">
                        Active
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {stats.activeOrders}
                      </p>
                    </div>
                    <div className="text-center backdrop-blur-xl bg-green-100/30 rounded-xl p-3 border border-green-200/30">
                      <p className="text-xs text-green-600 font-medium">
                        Confirmed
                      </p>
                      <p className="text-lg font-bold text-green-700">
                        {stats.confirmedBookings}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl p-6 w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Customize your map and data preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Map Style
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg backdrop-blur-xl bg-white/50">
                <option>Streets</option>
                <option>Satellite</option>
                <option>Terrain</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Auto Refresh
              </label>
              <select className="w-full p-2 border border-gray-300 rounded-lg backdrop-blur-xl bg-white/50">
                <option>Every 30 seconds</option>
                <option>Every minute</option>
                <option>Every 5 minutes</option>
                <option>Disabled</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Show route animations
              </span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Enable notifications
              </span>
              <input type="checkbox" className="rounded" defaultChecked />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Dialog */}
      <ServiceListDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serviceData={serviceData}
        stats={stats}
        handleViewAll={handleViewAll}
        handleRefresh={handleRefresh}
        loading={loading}
        error={error}
        filteredData={filteredData}
        selectedItem={selectedItem}
        handleItemClick={handleItemClick}
        getStatusBadge={getStatusBadge}
      />
    </div>
  );
}
