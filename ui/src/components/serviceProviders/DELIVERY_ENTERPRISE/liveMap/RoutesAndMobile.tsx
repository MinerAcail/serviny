"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Loader2,
  Database,
  Settings,
  Eye,
  Route,
  TrendingUp,
  Users,
  Package,
  Calendar,
  BarChart3,
  X,
  Menu,
} from "lucide-react";

import type {
  ServiceData,
  ProcessedRider,
  RouteData,
} from "./serviceDataAndTypes";
import {
  setupDirectionsRequest,
  parseRouteGeoJSON,
  createRouteDataFromParsed,
} from "./hooks/mapUtilsNew";

// Route Management Hook
export const useRouteManagement = (
  serviceData: ServiceData[],
  riders: ProcessedRider[],
  isLoaded: boolean,
  loadError: any,
  mapLoaded: boolean,
  mapInitialized: boolean,
  directionsServiceRef: React.RefObject<google.maps.DirectionsService | null>,
  getOrderRoute: any
) => {
  const [riderRoutes, setRiderRoutes] = useState<Map<string, RouteData>>(new Map());
  const [databaseRoutes, setDatabaseRoutes] = useState<Map<string, RouteData>>(new Map());
  const [loadingRoutes, setLoadingRoutes] = useState<Set<string>>(new Set());
  const [loadingDatabaseRoutes, setLoadingDatabaseRoutes] = useState<boolean>(false);
  const [orderRouteCache, setOrderRouteCache] = useState<Map<string, RouteData>>(new Map());
  const [routeFetchProgress, setRouteFetchProgress] = useState({ current: 0, total: 0 });

  // Fetch service route data for individual items
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

  // Fetch all routes for services
  const fetchAllRoutesForServices = useCallback(async () => {
    if (serviceData.length === 0) {
      console.log("No service data to fetch routes for");
      return;
    }

    console.log(`Starting to fetch routes for ${serviceData.length} service items`);
    setLoadingDatabaseRoutes(true);

    const uniqueServiceIds = [...new Set(serviceData.map((service) => service.id))];
    console.log(`Found ${uniqueServiceIds.length} unique service IDs`);

    setRouteFetchProgress({ current: 0, total: uniqueServiceIds.length });

    const routePromises = uniqueServiceIds.map(async (serviceId, index) => {
      try {
        const routeData = await fetchServiceRoute(serviceId);
        setRouteFetchProgress((prev) => ({ ...prev, current: index + 1 }));

        if (routeData?.geojson) {
          console.log(`Route ${index + 1}/${uniqueServiceIds.length}: Success for service ${serviceId}`);
          return { serviceId, routeData };
        } else {
          console.log(`Route ${index + 1}/${uniqueServiceIds.length}: No data for service ${serviceId}`);
          return { serviceId, routeData: null };
        }
      } catch (error) {
        console.error(`Route ${index + 1}/${uniqueServiceIds.length}: Error for service ${serviceId}:`, error);
        setRouteFetchProgress((prev) => ({ ...prev, current: index + 1 }));
        return { serviceId, routeData: null };
      }
    });

    try {
      const results = await Promise.all(routePromises);
      const successfulRoutes = results.filter((r) => r.routeData !== null);

      console.log(`Completed route fetching: ${successfulRoutes.length}/${uniqueServiceIds.length} successful`);
      processRoutesIntoMap(successfulRoutes);
    } catch (error) {
      console.error("Error in batch route fetching:", error);
    } finally {
      setLoadingDatabaseRoutes(false);
      setRouteFetchProgress({ current: 0, total: 0 });
    }
  }, [serviceData, fetchServiceRoute]);

  // Process routes into map for visualization
  const processRoutesIntoMap = useCallback(
    (routeResults: Array<{ serviceId: string; routeData: RouteData }>) => {
      const riderRouteMap = new Map<string, RouteData>();

      console.log(`Processing ${routeResults.length} route results into rider routes`);

      // Group routes by rider
      const riderServiceMap = new Map<string, Array<{ serviceId: string; routeData: RouteData }>>();

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

        console.log(`Processing routes for rider ${rider.name}: ${riderRoutes.length} routes`);

        // Use the first route with valid data
        for (const { serviceId, routeData } of riderRoutes) {
          if (routeData?.geojson) {
            try {
              console.log(`Parsing route for rider ${rider.name}, service ${serviceId}`);
              const parsedRoute = parseRouteGeoJSON(routeData.geojson);

              if (parsedRoute) {
                const routeDataForMap = createRouteDataFromParsed(parsedRoute, rider);
                riderRouteMap.set(riderId, routeDataForMap);
                console.log(`Successfully created route for rider ${rider.name}: ${parsedRoute.coordinates.length} points`);
                break; // Use first valid route
              } else {
                console.warn(`Failed to parse route for rider ${rider.name}, service ${serviceId}`);
              }
            } catch (error) {
              console.error(`Error processing route for rider ${rider.name}, service ${serviceId}:`, error);
            }
          }
        }
      });

      console.log(`Successfully processed ${riderRouteMap.size} database routes`);
      setDatabaseRoutes(riderRouteMap);
    },
    [serviceData, riders]
  );

  // Fetch rider route using Google Directions
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
        const routeData = await setupDirectionsRequest(rider, directionsServiceRef.current);

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
        console.error(`Error fetching Google route for rider ${rider.name}:`, error);
      } finally {
        setLoadingRoutes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(riderId);
          return newSet;
        });
      }
    },
    [isLoaded, loadError, riderRoutes, loadingRoutes, directionsServiceRef]
  );

  // Auto-fetch routes for active riders
  useEffect(() => {
    if (!isLoaded || loadError || !mapLoaded || !mapInitialized) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const activeRiders = riders.filter(
        (rider) =>
          rider.status === "On Delivery" &&
          (rider.currentOrders.length > 0 || (rider.currentBookings?.length || 0) > 0)
      );
      console.log(`Fetching Delivery Routes for ${activeRiders.length} active riders`);

      // Batch process routes with staggered timing to avoid rate limits
      activeRiders.forEach((rider, index) => {
        setTimeout(() => {
          fetchRiderRoute(rider);
        }, index * 500);
      });
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [riders, isLoaded, loadError, mapLoaded, mapInitialized, fetchRiderRoute]);

  // Auto-fetch database routes when data changes
  useEffect(() => {
    if (serviceData.length > 0 && !loadingDatabaseRoutes) {
      console.log(`Service data changed, starting route fetch for ${serviceData.length} items`);

      const timeoutId = setTimeout(() => {
        fetchAllRoutesForServices();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [serviceData, fetchAllRoutesForServices, loadingDatabaseRoutes]);

  return {
    riderRoutes,
    databaseRoutes,
    loadingRoutes,
    loadingDatabaseRoutes,
    orderRouteCache,
    routeFetchProgress,
    fetchAllRoutesForServices,
    fetchRiderRoute,
    fetchServiceRoute,
  };
};

// Mobile Header Component
export const MobileHeader: React.FC<{
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  stats: any;
  showIsochrones: boolean;
  setShowIsochrones: (show: boolean) => void;
  showRoutes: boolean;
  setShowRoutes: (show: boolean) => void;
  isLoaded: boolean;
  loadingDatabaseRoutes: boolean;
  serviceData: ServiceData[];
  fetchAllRoutesForServices: () => void;
}> = ({
  showMobileMenu,
  setShowMobileMenu,
  stats,
  showIsochrones,
  setShowIsochrones,
  showRoutes,
  setShowRoutes,
  isLoaded,
  loadingDatabaseRoutes,
  serviceData,
  fetchAllRoutesForServices,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-3xl border-b border-white/20 relative z-50 shadow-xl">
      <div className="p-3 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-black tracking-tight truncate">
            Rider Services Live
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              {stats.availableRiders}
            </span>
            <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
              {stats.activeRiders}
            </span>
            <span className="flex items-center gap-1 text-xs text-orange-600 font-semibold">
              <Package className="w-3 h-3" />
              {stats.totalOrders}
            </span>
            <span className="flex items-center gap-1 text-xs text-purple-600 font-semibold">
              <Calendar className="w-3 h-3" />
              {stats.totalBookings}
            </span>
          </div>
        </div>

        <Button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          variant="outline"
          size="sm"
          className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
        >
          {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {showMobileMenu && (
        <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-3xl border border-white/20 rounded-b-3xl shadow-3xl mt-1 p-4 z-40">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50/50 p-3 rounded-2xl border border-green-200/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600 font-semibold">Available</p>
                  <p className="text-lg font-bold text-green-700">{stats.availableRiders}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-200/50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs text-blue-600 font-semibold">On Delivery</p>
                  <p className="text-lg font-bold text-blue-700">{stats.activeRiders}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-200/50">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-xs text-purple-600 font-semibold">Orders</p>
                  <p className="text-lg font-bold text-purple-700">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-200/50">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs text-orange-600 font-semibold">Bookings</p>
                  <p className="text-lg font-bold text-orange-700">{stats.totalBookings}</p>
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
                  onClick={fetchAllRoutesForServices}
                  disabled={loadingDatabaseRoutes || serviceData.length === 0}
                >
                  <Database
                    className={`h-4 w-4 mr-2 ${loadingDatabaseRoutes ? "animate-spin" : ""}`}
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
  );
};

// Route Progress Indicator Component
export const RouteProgressIndicator: React.FC<{
  loadingDatabaseRoutes: boolean;
  routeFetchProgress: { current: number; total: number };
  loadingRoutes: Set<string>;
  riders: ProcessedRider[];
}> = ({ loadingDatabaseRoutes, routeFetchProgress, loadingRoutes, riders }) => {
  if (!loadingDatabaseRoutes && loadingRoutes.size === 0) return null;

  return (
    <>
      {/* Main loading indicator */}
      {(loadingDatabaseRoutes || loadingRoutes.size > 0) && riders.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg p-3 border z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs text-gray-600">
              {loadingDatabaseRoutes ? `Fetching routes...` : `Loading ${loadingRoutes.size} route${loadingRoutes.size !== 1 ? "s" : ""}...`}
            </span>
          </div>
        </div>
      )}

      {/* Detailed progress for database routes */}
      {loadingDatabaseRoutes && routeFetchProgress.total > 0 && (
        <div className="fixed bottom-16 left-4 bg-white rounded-lg shadow-lg p-3 border z-50">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 animate-spin text-purple-600" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900 mb-1">
                Fetching Routes ({routeFetchProgress.current}/{routeFetchProgress.total})
              </div>
              <div className="w-24 h-1 bg-gray-200 rounded-full">
                <div
                  className="h-1 bg-purple-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(routeFetchProgress.current / routeFetchProgress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Desktop Stats Cards Component
export const DesktopStatsCards: React.FC<{
  databaseRoutes: Map<string, RouteData>;
  riders: ProcessedRider[];
  riderRoutes: Map<string, RouteData>;
  stats: any;
}> = ({ databaseRoutes, riders, riderRoutes, stats }) => {
  return (
    <div className="hidden xl:flex gap-3">
      <div className="bg-green-50/50 px-3 py-2 rounded-2xl border border-green-200/50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-xs text-green-600 font-semibold">DB Routes</p>
            <p className="text-sm font-bold text-green-700">{databaseRoutes.size}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 px-3 py-2 rounded-2xl border border-blue-200/50">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-blue-600 font-semibold">Active Riders</p>
            <p className="text-sm font-bold text-blue-700">{riders.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50/50 px-3 py-2 rounded-2xl border border-purple-200/50">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-xs text-purple-600 font-semibold">Delivery Routes</p>
            <p className="text-sm font-bold text-purple-700">{riderRoutes.size}</p>
          </div>
        </div>
      </div>

      <div className="bg-orange-50/50 px-3 py-2 rounded-2xl border border-orange-200/50">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-orange-600" />
          <div>
            <p className="text-xs text-orange-600 font-semibold">Service Items</p>
            <p className="text-sm font-bold text-orange-700">{stats.totalServiceData}</p>
          </div>
        </div>
      </div>
    </div>
  );
};