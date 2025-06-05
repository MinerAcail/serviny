"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  Plus,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  Eye,
  TrendingUp,
  Package,
  Map,
  Navigation,
  Loader2,
  X,
  Clock,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useQuery, gql } from "@apollo/client";
import { toast } from "sonner";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useNavigate } from "react-router";

// Import types and utilities
import { VendorMapData, ProcessedVendor, VendorStats } from "./types";
import {
  getMapStyle,
  getVendorCoordinates,
  createVendorMarker,
  processIsochroneData,
  fitMapBounds,
  cleanupMap,
  MapState,
} from "./mapUtils";

// GraphQL Query
const GET_VENDORS_FROM_ISOCHRONE_RESULT = gql`
  query GetVendorsFromIsochroneResult {
    getVendorsFromIsochroneResult {
      vendor {
        id
        name
        type
        number
        email
        location
        aboutMe
        dpfile
        businessType
        isVerified
        coordinates
        createdAt
        updatedAt
      }
      mapData {
        id
        geojson
        metaData {
          id
          price
          duration
          distance
          zone
        }
        locations
        range
        transportMode
        address
        createdAt
        updatedAt
        status
        riderId
        vendorId
        error
        errorCode
      }
    }
  }
`;

export default function VendorsByDeliveryService() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVendors, setFilteredVendors] = useState<ProcessedVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorMapData | null>(
    null
  );
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

const [mapReadyToInit, setMapReadyToInit] = useState(false);
const [initMapManually, setInitMapManually] = useState(false);
const [autoInitTimer, setAutoInitTimer] = useState<NodeJS.Timeout | null>(null);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const mapInitialized = useRef(false);

  const { data, loading, error, refetch } = useQuery<{
    getVendorsFromIsochroneResult: VendorMapData[];
  }>(GET_VENDORS_FROM_ISOCHRONE_RESULT, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
    onError: (error) => {
      console.error("GraphQL Error:", error);
      toast.error("Failed to load vendors", {
        description:
          error.message ||
          "Please try again or contact support if the issue persists.",
      });
    },
    onCompleted: (data) => {
      console.log("Vendors data loaded:", data);
      if (data?.getVendorsFromIsochroneResult?.length === 0) {
        toast.info("No vendors found", {
          description:
            "No vendors with delivery zones were found for your area.",
        });
      }
    },
  });

  // Enhanced vendor data processing with better error handling
  const processVendorData = (
    vendorMapData: VendorMapData[]
  ): ProcessedVendor[] => {
    if (!vendorMapData || vendorMapData.length === 0) {
      return [];
    }

    return vendorMapData.map((item) => {
      const { vendor, mapData } = item;

      // Initialize metrics
      let totalZones = 0;
      let minPrice = Infinity;
      let maxPrice = 0;
      let totalDeliveryTime = 0;
      let deliveryTimeCount = 0;
      let maxRange = 0;
      let hasValidData = false;

      // Process isochrone data more safely
      if (mapData && Array.isArray(mapData)) {
        mapData.forEach((isochrone) => {
          // Process metadata if available
          if (isochrone.metaData && Array.isArray(isochrone.metaData)) {
            totalZones += isochrone.metaData.length;
            hasValidData = true;

            isochrone.metaData.forEach((meta) => {
              // Safely process price
              if (typeof meta.price === "number" && meta.price >= 0) {
                minPrice = Math.min(minPrice, meta.price);
                maxPrice = Math.max(maxPrice, meta.price);
              }

              // Safely process duration
              if (typeof meta.duration === "number" && meta.duration > 0) {
                totalDeliveryTime += meta.duration;
                deliveryTimeCount++;
              }
            });
          }

          // Process range data safely
          if (
            isochrone.range &&
            Array.isArray(isochrone.range) &&
            isochrone.range.length > 0
          ) {
            const validRanges = isochrone.range.filter(
              (r) => typeof r === "number" && r > 0
            );
            if (validRanges.length > 0) {
              maxRange = Math.max(maxRange, Math.max(...validRanges));
              hasValidData = true;
            }
          }
        });
      }

      // Calculate derived metrics
      const avgDeliveryTime =
        deliveryTimeCount > 0 ? totalDeliveryTime / deliveryTimeCount : 0;
      const deliveryRadius =
        maxRange > 0 ? `${((maxRange / 60) * 5).toFixed(1)} km` : "No data";

      // Normalize price values
      const normalizedMinPrice = minPrice !== Infinity ? minPrice : 0;
      const normalizedMaxPrice = maxPrice > 0 ? maxPrice : normalizedMinPrice;

      // Generate realistic mock data based on actual data
      const baseOrderCount = Math.max(50, totalZones * 20);
      const mockMetrics = {
        totalOrders: baseOrderCount + Math.floor(Math.random() * 500),
        monthlyOrders:
          Math.floor(baseOrderCount / 12) + Math.floor(Math.random() * 50),
        rating: Math.max(3.5, 4.0 + Math.random() * 1),
        commission: `${Math.floor(Math.random() * 5) + 10}%`,
      };

      // Calculate revenue based on actual pricing data
      const avgPrice =
        normalizedMaxPrice > normalizedMinPrice
          ? (normalizedMinPrice + normalizedMaxPrice) / 2
          : Math.max(normalizedMinPrice, 15);

      const revenue = `$${(mockMetrics.monthlyOrders * avgPrice * 0.8).toFixed(
        0
      )}`;
      const avgOrderValue = `$${avgPrice.toFixed(2)}`;

      // Get the most recent update timestamp
      const lastUpdated =
        mapData && mapData.length > 0
          ? mapData.reduce((latest, current) => {
              const currentTime = new Date(current.updatedAt).getTime();
              const latestTime = new Date(latest).getTime();
              return currentTime > latestTime ? current.updatedAt : latest;
            }, mapData[0].updatedAt)
          : vendor.updatedAt;

      return {
        ...vendor,
        category: vendor.businessType || vendor.type || "Service",
        phone: vendor.number || "Not provided",
        address: vendor.location || "Address not available",
        status: vendor.isVerified ? "Active" : "Pending",
        rating: Number(mockMetrics.rating.toFixed(1)),
        totalOrders: mockMetrics.totalOrders,
        monthlyOrders: mockMetrics.monthlyOrders,
        revenue,
        joinDate: new Date(vendor.createdAt).toLocaleDateString(),
        commission: mockMetrics.commission,
        avgOrderValue,
        hasDeliveryZones: hasValidData,
        deliveryRadius,
        activeRiders: mapData?.length || 0,
        totalZones,
        minPrice: normalizedMinPrice,
        maxPrice: normalizedMaxPrice,
        avgDeliveryTime,
        lastUpdated: new Date(lastUpdated).toLocaleDateString(),
      };
    });
  };

  // Enhanced filtering with better search logic
  useEffect(() => {
    if (data?.getVendorsFromIsochroneResult) {
      const processed = processVendorData(data.getVendorsFromIsochroneResult);

      if (searchQuery.trim() === "") {
        setFilteredVendors(processed);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = processed.filter(
          (vendor) =>
            vendor.name.toLowerCase().includes(query) ||
            vendor.email.toLowerCase().includes(query) ||
            vendor.category.toLowerCase().includes(query) ||
            vendor.address.toLowerCase().includes(query) ||
            vendor.phone.toLowerCase().includes(query) ||
            vendor.id.toLowerCase().includes(query)
        );
        setFilteredVendors(filtered);
      }
    }
  }, [data, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            Active
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case "Inactive":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            Inactive
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors: Record<string, string> = {
      Restaurant: "text-blue-600 border-blue-200",
      Grocery: "text-green-600 border-green-200",
      Cafe: "text-orange-600 border-orange-200",
      Food: "text-red-600 border-red-200",
      Retail: "text-purple-600 border-purple-200",
      Service: "text-indigo-600 border-indigo-200",
    };

    const colorClass =
      categoryColors[category] || "text-gray-600 border-gray-200";

    return (
      <Badge variant="outline" className={colorClass}>
        {category}
      </Badge>
    );
  };

  const handleViewMap = (vendorId: string) => {
    const vendorData = data?.getVendorsFromIsochroneResult.find(
      (v) => v.vendor.id === vendorId
    );
    if (vendorData) {
      setSelectedVendor(vendorData);
      setIsMapDialogOpen(true);
      setMapError(null); // Reset error state
    } else {
      toast.error("Vendor data not found", {
        description: "Unable to load map data for this vendor.",
      });
    }
  };

  const handleViewDeliveryZones = (vendorId: string) => {
    navigate(`/delivery-zones/${vendorId}`);
  };

  // Clean up map function
// Enhanced cleanup function
const cleanupMapInstance = useCallback(() => {
  // Clear any pending auto-init timer
  if (autoInitTimer) {
    clearTimeout(autoInitTimer);
    setAutoInitTimer(null);
  }

  if (mapInstance.current) {
    cleanupMap(mapInstance.current);
    mapInstance.current = null;
    mapInitialized.current = false;
  }
  setIsMapLoading(false);
  setMapError(null);
  setMapReadyToInit(false);
  setInitMapManually(false);
}, [autoInitTimer]);


  // Reload map function
  const reloadMap = useCallback(() => {
    console.log("Reloading map...");
    cleanupMapInstance();
    setMapError(null);

    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      if (selectedVendor && mapRef.current) {
        initializeMap();
      }
    }, 100);
  }, [selectedVendor]);

  // Initialize map function with better error handling and timing
// Extract map initialization into a separate function
const initializeMap = useCallback(() => {
  if (!mapRef.current || !selectedVendor || mapInitialized.current) {
    console.log('Map not ready for initialization:', {
      hasContainer: !!mapRef.current,
      hasVendor: !!selectedVendor,
      alreadyInitialized: mapInitialized.current
    });
    return;
  }

  console.log("Initializing map for vendor:", selectedVendor.vendor.name);
  setIsMapLoading(true);
  setMapError(null);
  mapInitialized.current = true;

  const mapStyle = getMapStyle();
  const vendorCoords = getVendorCoordinates(selectedVendor.vendor);

  console.log("Map coordinates:", vendorCoords);
  console.log("Map style URL:", mapStyle);

  try {
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: mapStyle,
      center: vendorCoords,
      zoom: 12,
      attributionControl: false,
    });

    mapInstance.current = map;

    // Add vendor marker
    createVendorMarker(map, selectedVendor.vendor, vendorCoords);

    map.on("load", () => {
      console.log("Map loaded successfully");
      setIsMapLoading(false);

      // Process isochrone data
      processIsochroneData(map, selectedVendor, () => {
        // Fit bounds after processing
        fitMapBounds(map, selectedVendor, vendorCoords);
      });
    });

    // Enhanced error handling
    map.on("error", (e) => {
      console.error("Map error:", e);
      setIsMapLoading(false);
      setMapError("Map failed to load. Please try reloading.");
      toast.error("Map loading error", {
        description:
          "There was an issue loading the map. Please try reloading.",
      });
    });

    // Style loading events
    map.on("styledata", () => {
      console.log("Map style loaded");
    });

    map.on("sourcedata", (e) => {
      if (e.isSourceLoaded) {
        console.log("Source data loaded:", e.sourceId);
      }
    });
  } catch (mapError) {
    console.error("Error initializing map:", mapError);
    setIsMapLoading(false);
    setMapError("Failed to initialize map. Please try reloading.");
    mapInitialized.current = false;
    toast.error("Failed to initialize map", {
      description: "Please check your internet connection and try again.",
    });
  }
}, [selectedVendor]);


  // Map initialization effect - FIXED with proper timing
  useEffect(() => {
    if (
      isMapDialogOpen &&
      selectedVendor &&
      mapRef.current &&
      !mapInitialized.current
    ) {
      // Add a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isMapDialogOpen, selectedVendor, initializeMap]);

  // Cleanup when dialog closes
  useEffect(() => {
    if (!isMapDialogOpen) {
      cleanupMapInstance();
    }
  }, [isMapDialogOpen, cleanupMapInstance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMapInstance();
    };
  }, [cleanupMapInstance]);

  const handleRefresh = () => {
    refetch();
    toast.success("Vendors refreshed successfully");
  };

  // Calculate enhanced stats
  const stats: VendorStats = {
    totalVendors: filteredVendors.length,
    activeVendors: filteredVendors.filter((v) => v.status === "Active").length,
    totalZones: filteredVendors.reduce((sum, v) => sum + v.totalZones, 0),
    avgRating:
      filteredVendors.length > 0
        ? (
            filteredVendors.reduce((sum, v) => sum + v.rating, 0) /
            filteredVendors.length
          ).toFixed(1)
        : "0.0",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Loading vendors with delivery zones...
          </p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to Load Vendors
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message || "There was an error loading the vendor data."}
          </p>
          <Button
            onClick={handleRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Loader2
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : "hidden"}`}
            />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (
    !data ||
    !data.getVendorsFromIsochroneResult ||
    data.getVendorsFromIsochroneResult.length === 0
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Vendors Found
          </h3>
          <p className="text-gray-600 mb-4">
            No vendors with delivery zones were found for your area.
          </p>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            My Partner Vendors
          </h1>
          <p className="text-gray-600 text-sm md:text-base">
            Vendors you can deliver for ({filteredVendors.length} available)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="rounded-xl"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vendors by name, email, or category..."
                className="pl-10 border-gray-200 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl border-gray-200">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">
                Total Vendors
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalVendors}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Active</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats.activeVendors}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Map className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-600">
                Total Zones
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalZones}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">
                Avg Rating
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.avgRating}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* No vendors message */}
      {filteredVendors.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No vendors found
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "No vendors have delivery zones configured for your area yet"}
          </p>
          {!searchQuery && (
            <Button variant="outline" onClick={handleRefresh}>
              Refresh Data
            </Button>
          )}
        </div>
      )}

      {/* Vendors Grid */}
      {filteredVendors.length > 0 && (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card
              key={vendor.id}
              className="border-0 shadow-sm bg-white rounded-2xl hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 rounded-xl">
                      <AvatarImage src={vendor.dpfile} alt={vendor.name} />
                      <AvatarFallback className="rounded-xl bg-gray-100 text-gray-600">
                        <Building2 className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                        {vendor.name}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-sm">
                        ID: {vendor.id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(vendor.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category and Rating */}
                <div className="flex items-center justify-between">
                  {getCategoryBadge(vendor.category)}
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium text-gray-900">
                      {vendor.rating}
                    </span>
                  </div>
                </div>

                {/* Delivery Zone Info */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Delivery Coverage
                      </span>
                    </div>
                    <span className="text-sm font-bold text-blue-700">
                      {vendor.deliveryRadius}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-blue-600">
                    <span>
                      {vendor.totalZones} delivery zone
                      {vendor.totalZones !== 1 ? "s" : ""}
                    </span>
                    {vendor.avgDeliveryTime > 0 && (
                      <span>~{Math.round(vendor.avgDeliveryTime)}min avg</span>
                    )}
                  </div>
                  {vendor.minPrice > 0 && (
                    <div className="flex justify-between text-xs text-blue-600 mt-1">
                      <span>Delivery fees:</span>
                      <span className="font-medium">
                        ${vendor.minPrice.toFixed(2)}
                        {vendor.maxPrice > vendor.minPrice
                          ? ` - ${vendor.maxPrice.toFixed(2)}`
                          : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{vendor.address}</span>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-lg font-bold text-gray-900">
                      {vendor.monthlyOrders}
                    </p>
                    <p className="text-xs text-gray-600">Monthly Orders</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-xl">
                    <p className="text-lg font-bold text-gray-900">
                      {vendor.avgOrderValue}
                    </p>
                    <p className="text-xs text-gray-600">Avg Order</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage
                              src={vendor.dpfile}
                              alt={vendor.name}
                            />
                            <AvatarFallback className="rounded-lg">
                              <Building2 className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          {vendor.name}
                        </DialogTitle>
                        <DialogDescription>
                          Complete vendor information and delivery performance
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Category
                            </p>
                            <div className="mt-1">
                              {getCategoryBadge(vendor.category)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Status
                            </p>
                            <div className="mt-1">
                              {getStatusBadge(vendor.status)}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Join Date
                            </p>
                            <p className="text-sm text-gray-600">
                              {vendor.joinDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Last Updated
                            </p>
                            <p className="text-sm text-gray-600">
                              {vendor.lastUpdated}
                            </p>
                          </div>
                        </div>

                        {/* Contact Information */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-3">
                            Contact Information
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{vendor.phone}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span>{vendor.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{vendor.address}</span>
                            </div>
                          </div>
                        </div>

                        {/* Delivery Zone Info */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-3">
                            Delivery Information
                          </p>
                          <div className="bg-blue-50 rounded-xl p-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Coverage Radius
                                </span>
                                <p className="font-medium text-blue-900">
                                  {vendor.deliveryRadius}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Total Zones
                                </span>
                                <p className="font-medium text-blue-900">
                                  {vendor.totalZones}
                                </p>
                              </div>
                              {vendor.minPrice > 0 && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">
                                    Delivery Fee Range
                                  </span>
                                  <p className="font-medium text-blue-900">
                                    ${vendor.minPrice.toFixed(2)} - $
                                    {vendor.maxPrice.toFixed(2)}
                                  </p>
                                </div>
                              )}
                              {vendor.avgDeliveryTime > 0 && (
                                <div>
                                  <span className="text-gray-600">
                                    Avg Delivery Time
                                  </span>
                                  <p className="font-medium text-blue-900">
                                    {Math.round(vendor.avgDeliveryTime)} minutes
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Performance Metrics */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-3">
                            Performance Metrics
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <p className="text-xl font-bold text-gray-900">
                                {vendor.totalOrders}
                              </p>
                              <p className="text-xs text-gray-600">
                                Total Orders
                              </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="text-xl font-bold text-gray-900">
                                  {vendor.rating}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">Rating</p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <p className="text-xl font-bold text-gray-900">
                                {vendor.avgOrderValue}
                              </p>
                              <p className="text-xs text-gray-600">
                                Avg Order Value
                              </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-xl">
                              <p className="text-xl font-bold text-gray-900">
                                {vendor.monthlyOrders}
                              </p>
                              <p className="text-xs text-gray-600">
                                This Month
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* About Section */}
                        {vendor.aboutMe && (
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-2">
                              About
                            </p>
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                              {vendor.aboutMe}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleViewDeliveryZones(vendor.id)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg"
                          >
                            <Map className="h-4 w-4 mr-2" />
                            View Delivery Zones
                          </Button>
                          <Button
                            onClick={() => handleViewMap(vendor.id)}
                            variant="outline"
                            className="w-full rounded-lg"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview Map
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    size="sm"
                    onClick={() => {
                      reloadMap();
                      handleViewMap(vendor.id);
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Map
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleViewDeliveryZones(vendor.id)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Zones
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Map Dialog with Loading State and Reload Functionality */}
      <Dialog open={isMapDialogOpen} onOpenChange={setIsMapDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={selectedVendor?.vendor.dpfile}
                  alt={selectedVendor?.vendor.name}
                />
                <AvatarFallback className="rounded-lg">
                  <Building2 className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-lg font-semibold">
                  {selectedVendor?.vendor.name}
                </div>
                <div className="text-sm text-gray-600 font-normal">
                  {selectedVendor?.mapData.length || 0} delivery zones
                </div>
              </div>
              {/* Reload button in header */}
              <Button
                variant="outline"
                size="sm"
                onClick={reloadMap}
                disabled={isMapLoading}
                className="shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isMapLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="h-[500px] w-full relative">
            <div ref={mapRef} className="w-full h-full rounded-b-lg" />

            {/* Loading overlay */}
            {isMapLoading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-900">
                    Loading map...
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Please wait while we prepare the delivery zones
                  </p>
                </div>
              </div>
            )}

            {/* Error overlay with reload option */}
            {mapError && !isMapLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center max-w-md p-6">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Map Loading Failed
                  </h3>
                  <p className="text-gray-600 mb-4">{mapError}</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={reloadMap}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reload Map
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsMapDialogOpen(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Map overlay info */}
            {!isMapLoading && !mapError && (
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                <div className="text-sm font-medium text-gray-900">
                  {selectedVendor?.vendor.name}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedVendor?.vendor.businessType ||
                    selectedVendor?.vendor.type}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {selectedVendor?.mapData.length || 0} delivery zones
                </div>
              </div>
            )}

            {/* Zone legend */}
            {!isMapLoading &&
              !mapError &&
              selectedVendor &&
              selectedVendor.mapData.length > 0 && (
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm max-w-xs">
                  <div className="text-xs font-medium text-gray-900 mb-2">
                    Delivery Zones
                  </div>
                  <div className="space-y-1">
                    {[
                      "#34c759",
                      "#ffcc00",
                      "#ff3b30",
                      "#007aff",
                      "#af52de",
                      "#ff2d55",
                    ]
                      .slice(
                        0,
                        Math.max(
                          3,
                          selectedVendor.mapData[0]?.metaData?.length || 0
                        )
                      )
                      .map((color, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-gray-600">
                            Zone {index + 1}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>

          <div className="p-6 pt-4 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {isMapLoading
                  ? "Loading map..."
                  : mapError
                  ? "Map failed to load"
                  : "Click on any zone to see delivery details"}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={reloadMap}
                  disabled={isMapLoading}
                  className="rounded-lg"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isMapLoading ? "animate-spin" : ""
                    }`}
                  />
                  Reload Map
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsMapDialogOpen(false)}
                  className="rounded-lg"
                >
                  Close
                </Button>
                {/* <Button
                  onClick={() =>
                    selectedVendor &&
                    handleViewDeliveryZones(selectedVendor.vendor.id)
                  }
                  className="bg-green-500 hover:bg-green-600 text-white rounded-lg"
                  disabled={isMapLoading}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Full Delivery Manager
                </Button> */}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
