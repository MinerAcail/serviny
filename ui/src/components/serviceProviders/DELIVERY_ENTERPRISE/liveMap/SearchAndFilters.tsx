"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Navigation,
  Search,
  XCircle,
  ChevronUp,
  ChevronDown,
  X,
  Package,
  Calendar,
  Car,
  Bike,
  Filter,
} from "lucide-react";
import maplibregl from "maplibre-gl";

import type {
  ServiceData,
  ProcessedRider,
  RouteData,
} from "./serviceDataAndTypes";

// Types for search suggestions
interface SearchSuggestion {
  type: string;
  value: string;
  label: string;
  icon: string;
  customer?: string;
  status?: string;
  rider?: string;
  serviceCount?: number;
  location?: string;
  multiGroupId?: string;
  bookingCount?: number;
  customers?: string[];
  customerDisplay?: string;
}

interface SearchAndFiltersProps {
  serviceData: ServiceData[];
  riders: ProcessedRider[];
  stats: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  vehicleFilter: string;
  setVehicleFilter: (filter: string) => void;
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  selectedEntity: any;
  setSelectedEntity: (entity: any) => void;
  showOnlyRelevant: boolean;
  setShowOnlyRelevant: (show: boolean) => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  activeDetailTab: string;
  setActiveDetailTab: (tab: string) => void;
  isMobile: boolean;
  mapInstance: React.RefObject<maplibregl.Map | null>;
  onRiderClick: (rider: ProcessedRider) => void;
}

export function SearchAndFilters({
  serviceData,
  riders,
  stats,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  vehicleFilter,
  setVehicleFilter,
  typeFilter,
  setTypeFilter,
  selectedEntity,
  setSelectedEntity,
  showOnlyRelevant,
  setShowOnlyRelevant,
  isExpanded,
  setIsExpanded,
  activeDetailTab,
  setActiveDetailTab,
  isMobile,
  mapInstance,
  onRiderClick,
}: SearchAndFiltersProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);

  // Generate search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

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
        const orderId = s.orderData!.orderId.toLowerCase();
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
        value: `#${s.orderData!.orderId.slice(-6)}`,
        label: `Order #${s.orderData!.orderId.slice(-6)}`,
        icon: "📦",
        customer: s.customer.name,
      }));

    // Get booking IDs
    const bookings = serviceData
      .filter((s) => s.type === "BOOKING" && s.bookingData?.bookingId)
      .filter((s) => {
        const bookingId = s.bookingData!.bookingId.toLowerCase();
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
        value: `#${s.bookingData!.bookingId.slice(-6)}`,
        label: `Booking #${s.bookingData!.bookingId.slice(-6)}`,
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
            .map((s) => s.bookingData!.multiGroupId!)
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

  // Get related entity data helper
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
            .map((s) => riders.find((r) => r.id === s.rider!.id))
            .filter(Boolean);
          related.vendors = [...new Set(customerServices.map((s) => s.vendor))];
          related.customers = [customerServices[0]?.customer].filter(Boolean);
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
            related.services = multiGroupServices;
            related.vendors = [
              ...new Set(multiGroupServices.map((s) => s.vendor)),
            ];
            related.customers = [
              ...new Set(multiGroupServices.map((s) => s.customer)),
            ];
            related.riders = multiGroupServices
              .filter((s) => s.rider)
              .map((s) => riders.find((r) => r.id === s.rider!.id))
              .filter(Boolean);
          }
          break;
        }
        // Add other cases as needed
      }

      return related;
    },
    [riders, serviceData]
  );

  // Fly to location helper
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
    [mapInstance]
  );

  // Handle search suggestion selection
  const handleSearchSuggestionSelect = useCallback(
    (suggestion: SearchSuggestion) => {
      setSearchQuery(suggestion.value);
      setShowSuggestions(false);

      // Get related data for this entity
      const relatedData = getRelatedEntityData(suggestion.type, suggestion.value);

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
            onRiderClick(rider);
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

            if (service.type === "ORDER" && service.orderData?.order?.coordinates) {
              coordinates = service.orderData.order.coordinates;
            } else if (service.type === "BOOKING" && service.bookingData?.pickupLocation) {
              coordinates = service.bookingData.pickupLocation;
            }

            if (coordinates) {
              flyToLocation(coordinates, 15);
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

          if (multiGroupServices.length > 0 && mapInstance.current) {
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

            if (hasValidCoordinates) {
              mapInstance.current.fitBounds(bounds, {
                padding: 100,
                maxZoom: 15,
                duration: 1500,
              });
            }
          }
          break;
        }
        // Add other cases as needed
      }
    },
    [
      setSearchQuery,
      setShowSuggestions,
      getRelatedEntityData,
      setSelectedEntity,
      setShowOnlyRelevant,
      riders,
      serviceData,
      flyToLocation,
      onRiderClick,
      mapInstance,
    ]
  );

  // Clear entity filter
  const clearEntityFilter = useCallback(() => {
    setSelectedEntity(null);
    setShowOnlyRelevant(false);
    setSearchQuery("");
  }, [setSelectedEntity, setShowOnlyRelevant, setSearchQuery]);

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
                    {suggestion.customer && suggestion.type !== "multigroup" && (
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
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {suggestion.status}
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

  // Filter Control Panel Component
  const FilterControlPanel = () => {
    if (!showOnlyRelevant && !selectedEntity) return null;

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
              },
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
              },
            },
          };

        case "multigroup":
          const multiGroupServices = relatedData.services;
          if (multiGroupServices.length === 0) return null;

          const uniqueCustomers = [
            ...new Set(multiGroupServices.map((s) => s.customer.name)),
          ];

          return {
            title: `Multi-Group ${value}`,
            subtitle: `${multiGroupServices.length} bookings • ${
              uniqueCustomers.length
            } customer${uniqueCustomers.length !== 1 ? "s" : ""}`,
            icon: "📅🔗",
            details: {
              overview: {
                "Total Bookings": multiGroupServices.length,
                "Unique Customers": uniqueCustomers.length,
              },
            },
          };

        default:
          return null;
      }
    };

    const entityDetails = getEntityDetails();
    if (!entityDetails) return null;

    return (
      <div className="absolute top-16 sm:top-20 left-3 sm:left-4 right-3 sm:right-4 z-10">
        <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-3xl overflow-hidden">
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

          {isExpanded && (
            <div className="p-3 sm:p-4">
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
            </div>
          )}
        </div>
      </div>
    );
  };

  return {
    SearchSuggestions,
    FilterControlPanel,
    showSuggestions,
    setShowSuggestions,
    clearEntityFilter,
    handleSearchSuggestionSelect,
  };
};

// Filter Dropdown Component
export const FilterDropdown: React.FC<{
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  vehicleFilter: string;
  setVehicleFilter: (filter: string) => void;
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  stats: any;
  isMobile: boolean;
}> = ({
  statusFilter,
  setStatusFilter,
  vehicleFilter,
  setVehicleFilter,
  typeFilter,
  setTypeFilter,
  stats,
  isMobile,
}) => {
  return (
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
          All Status
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
  );
};