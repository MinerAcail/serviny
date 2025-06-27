// riderEntityUtils.ts - Updated with payment fields

import maplibregl from "maplibre-gl";

// Updated type definitions with payment fields
export interface RiderServiceData {
  id: string;
  serviceId: string;
  type: "ORDER" | "BOOKING";
  createdAt: string;
  rider: {
    id: string;
    name: string;
    number: string;
    location: string;
    coordinates?: [number, number];
  };
  customer: {
    name: string;
    dpfile?: string;
    number: string;
  };
  vendor: {
    id: string;
    name: string;
    location: string;
    coordinates?: [number, number];
  };
  orderData?: {
    orderId: string;
    status: string;
    deliveryAddress: string;
    estimatedDeliveryDate?: string;
    serviceFee?: number;
    paymentStatus: string; // Added payment status
    paymentMethod: string; // Added payment method
    productInfor?: Array<{
      product: Array<{
        id: string;
        name: string;
        price: string;
        state: string;
      }>;
      quantity: number;
    }>;
    deliveryMetaData?: {
      id: string;
      price: number;
      duration: string;
      distance: string;
      zone: number;
      geojson: string;
      isochroneId: string;
    };
    routeData?: {
      id: string;
      orderId: string;
      geojson: string;
      userId: string;
      createdAt: string;
    };
    order?: {
      id: string;
      coordinates: [number, number];
      deliveryAddress: string;
      distance?: string;
      duration?: string;
    };
  };
  bookingData?: {
    bookingId: string;
    status: string; // Updated: now has status field
    startTime?: string;
    endTime?: string;
    day: string;
    item?: string;
    tableSize: number;
    userType: string;
    isConfirmed: boolean;
    pickupLocation?: [number, number];
    dropoffLocation?: [number, number];
    deliveryAddress: string;
    pickUpAddress: string;
    multiGroupId?: string;
    deliveryFee: string;
    distance?: string;
    duration?: string;
    estimatedDeliveryDate?: string;
    paymentStatus: string; // Added payment status
    paymentMethod: string; // Added payment method
        cargoId?:string;
    rangeMetaData?: {
      id: string;
      riderId: string;
      startKm: number;
      endKm: number;
      price: number;
    };
    routeData?: {
      id: string;
      orderId: string;
      geojson: string;
      userId: string;
      createdAt: string;
    };
  };
}

// Helper function to get payment status color
export const getPaymentStatusColor = (paymentStatus: string): string => {
  switch (paymentStatus?.toUpperCase()) {
    case "PAID":
    case "COMPLETED":
    case "SUCCESS":
      return "bg-green-100 text-green-700";
    case "PENDING":
    case "PROCESSING":
      return "bg-yellow-100 text-yellow-700";
    case "FAILED":
    case "DECLINED":
    case "CANCELLED":
      return "bg-red-100 text-red-700";
    case "REFUNDED":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// Helper function to get payment method icon
export const getPaymentMethodIcon = (paymentMethod: string): string => {
  switch (paymentMethod?.toLowerCase()) {
    case "card":
    case "credit_card":
    case "debit_card":
      return "💳";
    case "cash":
    case "cash_on_delivery":
    case "cod":
      return "💵";
    case "mobile_money":
    case "momo":
    case "mobile":
      return "📱";
    case "bank_transfer":
    case "transfer":
      return "🏦";
    case "wallet":
    case "e_wallet":
      return "👛";
    default:
      return "💰";
  }
};

// Updated search suggestions generator with payment info
// Updated search suggestions generator with payment info and cargoId support
export const generateRiderSearchSuggestions = (
  searchQuery: string, 
  serviceData: RiderServiceData[]
): RiderSearchSuggestion[] => {
  if (!searchQuery || searchQuery.trim().length < 2) {
    return [];
  }

  const query = searchQuery.toLowerCase().trim();
  const suggestions: RiderSearchSuggestion[] = [];

  console.log(`🔍 Generating suggestions for: "${query}"`);

  try {
    // Customer search - with payment info
    const customers = [...new Set(serviceData.map((s) => s.customer.name))]
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 3)
      .map((name) => {
        const customerServices = serviceData.filter(s => s.customer.name === name);
        const totalPaid = customerServices.filter(s => {
          const paymentStatus = s.type === "ORDER" 
            ? s.orderData?.paymentStatus 
            : s.bookingData?.paymentStatus;
          return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
        }).length;
        
        return {
          type: "customer" as const,
          value: name,
          label: `Customer: ${name}`,
          icon: "👤",
          serviceCount: customerServices.length,
          paidServices: totalPaid,
        };
      });

    // Order search with payment info
    const orders = serviceData
      .filter((s) => s.type === "ORDER" && s.orderData?.orderId)
      .filter((s) => {
        const orderId = s.orderData!.orderId.toLowerCase();
        const shortId = orderId.slice(-6);
        return (
          orderId.includes(query) ||
          shortId.includes(query) ||
          orderId.includes(query.replace("#", "")) ||
          shortId.includes(query.replace("#", "")) ||
          `#${shortId}`.includes(query)
        );
      })
      .slice(0, 3)
      .map((s) => ({
        type: "order" as const,
        value: `#${s.orderData!.orderId.slice(-6)}`,
        label: `Order #${s.orderData!.orderId.slice(-6)}`,
        icon: "📦",
        customer: s.customer.name,
        status: s.orderData!.status,
        paymentStatus: s.orderData?.paymentStatus,
        paymentMethod: s.orderData?.paymentMethod,
        amount: s.orderData?.deliveryMetaData?.price 
          ? `GH₵${s.orderData.deliveryMetaData.price}` 
          : undefined,
      }));

    // Booking search with payment info and cargoId support
    const bookings = serviceData
      .filter((s) => s.type === "BOOKING" && s.bookingData?.bookingId)
      .filter((s) => {
        const bookingId = s.bookingData!.bookingId.toLowerCase();
        const shortId = bookingId.slice(-6);
        return (
          bookingId.includes(query) ||
          shortId.includes(query) ||
          bookingId.includes(query.replace("#", "")) ||
          shortId.includes(query.replace("#", "")) ||
          `#${shortId}`.includes(query)
        );
      })
      .slice(0, 3)
      .map((s) => ({
        type: "booking" as const,
        value: `#${s.bookingData!.bookingId.slice(-6)}`,
        label: `Booking #${s.bookingData!.bookingId.slice(-6)}`,
        icon: "📅",
        customer: s.customer.name,
        status: s.bookingData!.status,
        paymentStatus: s.bookingData?.paymentStatus,
        paymentMethod: s.bookingData?.paymentMethod,
        amount: s.bookingData?.deliveryFee 
          ? `GH₵${s.bookingData.deliveryFee}` 
          : undefined,
        // Include the complete bookingData with cargoId
        bookingData: {
          cargoId: s.bookingData?.cargoId,
          status: s.bookingData?.status,
          deliveryFee: s.bookingData?.deliveryFee,
          bookingId: s.bookingData?.bookingId,
          pickUpAddress: s.bookingData?.pickUpAddress,
          deliveryAddress: s.bookingData?.deliveryAddress,
        }
      }));

    // Vendor search with service count
    const vendors = [...new Set(serviceData.map((s) => s.vendor.name))]
      .filter((name) => name.toLowerCase().includes(query))
      .slice(0, 2)
      .map((name) => {
        const vendorServices = serviceData.filter(s => s.vendor.name === name);
        return {
          type: "vendor" as const,
          value: name,
          label: `Vendor: ${name}`,
          icon: "🏪",
          serviceCount: vendorServices.length,
        };
      });

    // MultiGroup search with enhanced info and cargoId support
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
            shortId.includes(query.replace("#", "")) ||
            `#${shortId}`.includes(query)
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

          const totalPaid = groupBookings.filter(s => 
            s.bookingData?.paymentStatus?.toUpperCase() === "PAID" || 
            s.bookingData?.paymentStatus?.toUpperCase() === "COMPLETED"
          ).length;

          // Check if any booking in the group has cargoId
          const hasCargoId = groupBookings.some(b => b.bookingData?.cargoId);
          const firstCargoId = groupBookings.find(b => b.bookingData?.cargoId)?.bookingData?.cargoId;

          return {
            type: "multigroup" as const,
            value: `#${multiGroupId.slice(-6)}`,
            label: `Multi-Group #${multiGroupId.slice(-6)}`,
            icon: "📅🔗",
            multiGroupId: multiGroupId,
            bookingCount: groupBookings.length,
            customers: uniqueCustomers,
            paidBookings: totalPaid,
            customerDisplay:
              uniqueCustomers.length === 1
                ? uniqueCustomers[0]
                : `${uniqueCustomers.length} customers`,
            // Include bookingData if there's a cargoId in the group
            ...(hasCargoId && {
              bookingData: {
                cargoId: firstCargoId,
              }
            })
          };
        });
    })();

    // Payment method search with cargoId support
    const paymentMethodSearch = serviceData
      .filter(service => {
        const paymentMethod = service.type === "ORDER" 
          ? service.orderData?.paymentMethod?.toLowerCase()
          : service.bookingData?.paymentMethod?.toLowerCase();
        return paymentMethod?.includes(query);
      })
      .slice(0, 2)
      .map(service => ({
        type: (service.type === "ORDER" ? "order" : "booking") as const,
        value: service.type === "ORDER" 
          ? `#${service.orderData!.orderId.slice(-6)}`
          : `#${service.bookingData!.bookingId.slice(-6)}`,
        label: `Payment: ${service.type === "ORDER" 
          ? service.orderData!.paymentMethod 
          : service.bookingData!.paymentMethod}`,
        icon: getPaymentMethodIcon(service.type === "ORDER" 
          ? service.orderData!.paymentMethod 
          : service.bookingData!.paymentMethod),
        customer: service.customer.name,
        paymentStatus: service.type === "ORDER" 
          ? service.orderData?.paymentStatus 
          : service.bookingData?.paymentStatus,
        // Include bookingData for booking payments
        ...(service.type === "BOOKING" && {
          bookingData: {
            cargoId: service.bookingData?.cargoId,
            status: service.bookingData?.status,
            deliveryFee: service.bookingData?.deliveryFee,
            bookingId: service.bookingData?.bookingId,
          }
        })
      }));

    // Address search with cargoId support
    const addresses = serviceData
      .filter(service => {
        if (service.type === "ORDER" && service.orderData?.deliveryAddress) {
          return service.orderData.deliveryAddress.toLowerCase().includes(query);
        }
        if (service.type === "BOOKING") {
          return (
            service.bookingData?.deliveryAddress?.toLowerCase().includes(query) ||
            service.bookingData?.pickUpAddress?.toLowerCase().includes(query)
          );
        }
        return false;
      })
      .slice(0, 2)
      .map(service => ({
        type: (service.type === "ORDER" ? "order" : "booking") as const,
        value: service.type === "ORDER" 
          ? `#${service.orderData!.orderId.slice(-6)}`
          : `#${service.bookingData!.bookingId.slice(-6)}`,
        label: `Address: ${service.type === "ORDER" 
          ? service.orderData!.deliveryAddress 
          : service.bookingData!.deliveryAddress}`,
        icon: "📍",
        customer: service.customer.name,
        // Include bookingData for booking addresses
        ...(service.type === "BOOKING" && {
          bookingData: {
            cargoId: service.bookingData?.cargoId,
            status: service.bookingData?.status,
            deliveryFee: service.bookingData?.deliveryFee,
            bookingId: service.bookingData?.bookingId,
            pickUpAddress: service.bookingData?.pickUpAddress,
            deliveryAddress: service.bookingData?.deliveryAddress,
          }
        })
      }));

    // Combine all suggestions
    const allSuggestions = [
      ...customers,
      ...orders,
      ...bookings,
      ...vendors,
      ...multiGroupSuggestions,
      ...paymentMethodSearch,
      ...addresses,
    ].slice(0, 8);

    console.log(`✅ Generated ${allSuggestions.length} suggestions successfully`);
    console.log(`📦 Suggestions with cargoId:`, allSuggestions.filter(s => s.bookingData?.cargoId));
    
    return allSuggestions;

  } catch (error) {
    console.error("❌ Error generating search suggestions:", error);
    return [];
  }
};

// // Helper function for payment method icons
// const getPaymentMethodIcon = (paymentMethod: string): string => {
//   const method = paymentMethod?.toLowerCase();
//   if (method?.includes('card') || method?.includes('visa') || method?.includes('mastercard')) {
//     return "💳";
//   }
//   if (method?.includes('mobile') || method?.includes('momo')) {
//     return "📱";
//   }
//   if (method?.includes('cash')) {
//     return "💵";
//   }
//   if (method?.includes('bank') || method?.includes('transfer')) {
//     return "🏦";
//   }
//   return "💰";
// };

// Rest of the utility functions remain the same...
interface RiderSearchSuggestion {
  type: "customer" | "order" | "booking" | "vendor" | "multigroup";
  value: string;
  label: string;
  icon: string;
  customer?: string;
  customerDisplay?: string;
  bookingCount?: number;
  amount?: string;
  status?: string;
  serviceCount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paidServices?: number;
  paidBookings?: number;
  // ADD THIS:
  bookingData?: {
    cargoId?: string;
    status?: string;
    deliveryFee?: string;
    bookingId?: string;
  };
}

export interface RiderSelectedEntity {
  type: string;
  value: string;
  relatedData: {
    services: RiderServiceData[];
    vendors: any[];
    customers: any[];
  };
}

export interface ProcessedRiderData {
  id: string;
  name: string;
  status: string;
  location: string;
  phone: string;
  vehicle: string;
  rating: number;
  position: { lat: number; lng: number };
  earnings: string;
  orders: number;
  bookings: number;
}

export interface RiderRouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  color: string;
  summary: string;
}

export interface ParsedRouteData {
  coordinates: [number, number][];
  distance: string;
  duration: string;
  summary: string;
}

// Enhanced related entity data function
export const getRiderRelatedEntityData = (
  entityType: string, 
  entityValue: string, 
  serviceData: RiderServiceData[]
) => {
  const related = {
    services: [] as RiderServiceData[],
    vendors: [] as any[],
    customers: [] as any[],
  };

  switch (entityType) {
    case "customer": {
      const customerServices = serviceData.filter(
        (s) => s.customer.name === entityValue
      );
      related.services = customerServices;
      related.vendors = [...new Set(customerServices.map((s) => s.vendor))];
      related.customers = [customerServices[0]?.customer].filter(Boolean);
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
      }
      break;
    }
    case "booking": {
      const bookingService = serviceData.find(
        (s) =>
          s.type === "BOOKING" &&
          s.bookingData?.bookingId?.slice(-6) === entityValue.replace("#", "")
      );
      if (bookingService) {
        related.services = [bookingService];
        related.vendors = [bookingService.vendor];
        related.customers = [bookingService.customer];
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
        related.services = multiGroupServices;
        related.vendors = [
          ...new Set(multiGroupServices.map((s) => s.vendor)),
        ];
        related.customers = [
          ...new Set(multiGroupServices.map((s) => s.customer)),
        ];
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
      break;
    }
  }

  return related;
};

// Route parsing function
export const parseRouteGeoJSON = (geojsonString: string): ParsedRouteData | null => {
  try {
    const geoJSON = JSON.parse(geojsonString);

    if (geoJSON.type === "Feature" && geoJSON.geometry?.type === "LineString") {
      const coordinates = geoJSON.geometry.coordinates;

      if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.warn("Invalid coordinates array in GeoJSON");
        return null;
      }

      const validCoordinates = coordinates.filter((coord: any) => {
        return (
          Array.isArray(coord) &&
          coord.length >= 2 &&
          typeof coord[0] === "number" &&
          typeof coord[1] === "number" &&
          !isNaN(coord[0]) &&
          !isNaN(coord[1])
        );
      });

      if (validCoordinates.length === 0) {
        console.warn("No valid coordinates found in GeoJSON");
        return null;
      }

      console.log(`Parsed route with ${validCoordinates.length} valid coordinates`);

      return {
        coordinates: validCoordinates,
        distance: geoJSON.metadata?.distance || geoJSON.properties?.distance || "0 km",
        duration: geoJSON.metadata?.duration || geoJSON.properties?.duration || "0 min",
        summary: geoJSON.metadata?.summary || geoJSON.properties?.summary || "Route",
      };
    }

    console.warn("Invalid GeoJSON structure - not a LineString Feature");
    return null;
  } catch (error) {
    console.error("Error parsing route GeoJSON:", error);
    return null;
  }
};

// Enhanced route rendering function with precise filtering
export const addRiderRoutesToMap = (
  mapInstance: maplibregl.Map,
  serviceData: RiderServiceData[],
  showRoutes: boolean = true,
  selectedEntity: RiderSelectedEntity | null = null,
  showOnlyRelevant: boolean = false
) => {
  if (!mapInstance) return;

  // Clear existing route layers
  const style = mapInstance.getStyle?.();
  const existingLayers = style && style.layers ? style.layers : [];
  existingLayers.forEach(layer => {
    if (layer.id.startsWith('rider-route-')) {
      if (mapInstance.getLayer(layer.id)) {
        mapInstance.removeLayer(layer.id);
      }
    }
  });

  // Clear existing route sources
  const styleObj = mapInstance.getStyle && mapInstance.getStyle();
  const existingSources = styleObj && styleObj.sources ? styleObj.sources : {};
  Object.keys(existingSources).forEach(sourceId => {
    if (sourceId.startsWith('rider-route-')) {
      if (mapInstance.getSource(sourceId)) {
        mapInstance.removeSource(sourceId);
      }
    }
  });

  // If routes are disabled, stop here
  if (!showRoutes) return;

  // Determine which services to show routes for
  let servicesToShow: RiderServiceData[] = [];

  if (showOnlyRelevant && selectedEntity) {
    servicesToShow = selectedEntity.relatedData.services;
    console.log(`Showing routes ONLY for selected entity: ${selectedEntity.type} - ${selectedEntity.value}`);
    console.log(`Found ${servicesToShow.length} services for this entity`);
  } else {
    servicesToShow = serviceData;
    console.log(`Showing routes for all ${servicesToShow.length} services`);
  }

  // Filter services that actually have route data
  const servicesWithRoutes = servicesToShow.filter(service => {
    if (service.type === "ORDER") {
      return service.orderData?.routeData?.geojson;
    } else if (service.type === "BOOKING") {
      return service.bookingData?.routeData?.geojson;
    }
    return false;
  });

  console.log(`Found ${servicesWithRoutes.length} services with actual route data`);

  servicesWithRoutes.forEach((service, index) => {
    let routeGeoJSON = null;
    let routeColor = '#3B82F6'; // Default blue
    let routeLabel = '';
    let routeWidth = 4;
    let routeOpacity = 0.8;

    // Get route data based on service type
    if (service.type === "ORDER" && service.orderData?.routeData?.geojson) {
      routeGeoJSON = service.orderData.routeData.geojson;
      routeColor = showOnlyRelevant ? '#FF6B6B' : '#EF4444';
      routeLabel = `Order #${service.orderData.orderId.slice(-6)}`;
      routeWidth = showOnlyRelevant ? 6 : 4;
      routeOpacity = showOnlyRelevant ? 1.0 : 0.8;
    } else if (service.type === "BOOKING" && service.bookingData?.routeData?.geojson) {
      routeGeoJSON = service.bookingData.routeData.geojson;
      routeColor = showOnlyRelevant ? '#A855F7' : '#8B5CF6';
      routeLabel = `Booking #${service.bookingData.bookingId.slice(-6)}`;
      routeWidth = showOnlyRelevant ? 6 : 4;
      routeOpacity = showOnlyRelevant ? 1.0 : 0.8;
    }

    if (routeGeoJSON) {
      const parsedRoute = parseRouteGeoJSON(routeGeoJSON);

      if (parsedRoute && parsedRoute.coordinates.length > 0) {
        const sourceId = `rider-route-${service.id}`;
        const layerId = `rider-route-layer-${service.id}`;

        console.log(`Adding ${showOnlyRelevant ? 'FOCUSED' : 'normal'} route for ${routeLabel}: ${parsedRoute.coordinates.length} points`);

        try {
          // Add route source
          mapInstance.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {
                serviceId: service.id,
                serviceType: service.type,
                label: routeLabel,
                distance: parsedRoute.distance,
                duration: parsedRoute.duration,
                isFocused: showOnlyRelevant,
                entityType: selectedEntity?.type || 'none',
                entityValue: selectedEntity?.value || 'none',
              },
              geometry: {
                type: "LineString",
                coordinates: parsedRoute.coordinates,
              },
            },
          });

          // Add route layer with enhanced styling for focused routes
          mapInstance.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": routeColor,
              "line-width": routeWidth,
              "line-opacity": routeOpacity,
              "line-dasharray": showOnlyRelevant 
                ? [1, 0] // Solid line when focused
                : service.type === "BOOKING" 
                ? [3, 3] // Dashed for bookings when not focused
                : [1, 0], // Solid for orders when not focused
            },
          });

          // Add route click handler with enhanced popup for focused routes
          mapInstance.on('click', layerId, (e) => {
            const properties = e.features?.[0]?.properties;
            if (properties) {
              const popupContent = showOnlyRelevant 
                ? `
                  <div class="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div class="flex items-center gap-2 mb-2">
                      <div class="w-3 h-3 rounded-full" style="background-color: ${routeColor}"></div>
                      <h3 class="font-bold text-lg">${properties.label}</h3>
                    </div>
                    <div class="space-y-1">
                      <p class="text-sm"><strong>Distance:</strong> ${properties.distance}</p>
                      <p class="text-sm"><strong>Duration:</strong> ${properties.duration}</p>
                      <p class="text-sm"><strong>Service Type:</strong> ${properties.serviceType}</p>
                      <p class="text-xs text-blue-600 font-medium">🎯 Focused Route for ${properties.entityType}: ${properties.entityValue}</p>
                    </div>
                  </div>
                `
                : `
                  <div class="p-3">
                    <h3 class="font-bold">${properties.label}</h3>
                    <p class="text-sm">Distance: ${properties.distance}</p>
                    <p class="text-sm">Duration: ${properties.duration}</p>
                    <p class="text-xs text-gray-600">Service Type: ${properties.serviceType}</p>
                  </div>
                `;

              new maplibregl.Popup({ className: "enhanced-popup" })
                .setLngLat(e.lngLat)
                .setHTML(popupContent)
                .addTo(mapInstance);
            }
          });

          // Change cursor on hover
          mapInstance.on('mouseenter', layerId, () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });

          mapInstance.on('mouseleave', layerId, () => {
            mapInstance.getCanvas().style.cursor = '';
          });

        } catch (error) {
          console.error(`Error adding route for service ${service.id}:`, error);
        }
      } else {
        console.warn(`Failed to parse route for service ${service.id}`);
      }
    }
  });

  // Log the filtering result
  if (showOnlyRelevant && selectedEntity) {
    console.log(`🎯 ROUTE FILTERING ACTIVE: Showing ${servicesWithRoutes.length} route(s) for ${selectedEntity.type}: ${selectedEntity.value}`);
  } else {
    console.log(`📍 Showing all ${servicesWithRoutes.length} available routes`);
  }
};

// Enhanced search suggestion selection handler with precise route filtering
export const handleRiderSearchSuggestionSelect = (
  suggestion: RiderSearchSuggestion,
  serviceData: RiderServiceData[],
  setSelectedEntity: (entity: RiderSelectedEntity | null) => void,
  setShowOnlyRelevant: (show: boolean) => void,
  setSearchQuery: (query: string) => void,
  setShowSuggestions: (show: boolean) => void,
  mapInstance: React.RefObject<maplibregl.Map | null>
) => {
  console.log("🔍 Search suggestion selected:", suggestion);
  
  setSearchQuery(suggestion.value);
  setShowSuggestions(false);

  // Get related data for this entity
  const relatedData = getRiderRelatedEntityData(
    suggestion.type,
    suggestion.value,
    serviceData
  );

  // Set selected entity for filtered display
  setSelectedEntity({
    type: suggestion.type,
    value: suggestion.value,
    relatedData: relatedData,
  });
  
  // Enable filtered view - this will trigger route filtering
  setShowOnlyRelevant(true);

  // Navigate to the entity on map
  if (mapInstance.current && relatedData.services.length > 0) {
    const bounds = new maplibregl.LngLatBounds();
    let hasCoordinates = false;

    console.log(`🗺️ Navigating to ${suggestion.type}: ${suggestion.value}`);

    relatedData.services.forEach((service, index) => {
      console.log(`  Service ${index + 1}: ${service.type} - ${service.id}`);
      
      // Add vendor coordinates
      if (service.vendor?.coordinates) {
        bounds.extend(service.vendor.coordinates);
        hasCoordinates = true;
        console.log(`    ✓ Added vendor coordinates: ${service.vendor.coordinates}`);
      }

      if (service.type === "ORDER") {
        // Add order delivery coordinates
        if (service.orderData?.order?.coordinates) {
          bounds.extend(service.orderData.order.coordinates);
          hasCoordinates = true;
          console.log(`    ✓ Added order delivery coordinates: ${service.orderData.order.coordinates}`);
        }
      } else if (service.type === "BOOKING") {
        // Add booking pickup/dropoff coordinates
        if (service.bookingData?.pickupLocation) {
          bounds.extend(service.bookingData.pickupLocation);
          hasCoordinates = true;
          console.log(`    ✓ Added booking pickup coordinates: ${service.bookingData.pickupLocation}`);
        }
        if (service.bookingData?.dropoffLocation) {
          bounds.extend(service.bookingData.dropoffLocation);
          hasCoordinates = true;
          console.log(`    ✓ Added booking dropoff coordinates: ${service.bookingData.dropoffLocation}`);
        }
      }
    });

    if (hasCoordinates && !bounds.isEmpty()) {
      console.log("🎯 Fitting map bounds to show ONLY the selected entity");
      mapInstance.current.fitBounds(bounds, {
        padding: 120, // Extra padding for focused view
        maxZoom: 16,  // Closer zoom for focused view
        duration: 1500,
      });
    } else {
      console.warn("⚠️ No valid coordinates found for navigation");
    }
  } else {
    console.warn("⚠️ No map instance or related services found");
  }

  // Log the filtering action
  console.log(`🎯 ROUTE FILTERING ACTIVATED: Will show ONLY routes for ${suggestion.type}: ${suggestion.value}`);
};

// Utility function to get service status color
export const getServiceStatusColor = (service: RiderServiceData): string => {
  if (service.type === "ORDER") {
    switch (service.orderData?.status) {
      case "CONFIRMED":
        return "#10B981"; // Green
      case "PREPARING":
        return "#F59E0B"; // Orange
      case "OUT_FOR_DELIVERY":
        return "#3B82F6"; // Blue
      case "DELIVERED":
        return "#6B7280"; // Gray
      default:
        return "#EF4444"; // Red
    }
  } else if (service.type === "BOOKING") {
    return service.bookingData?.status ? "#8B5CF6" : "#F59E0B"; // Purple or Orange
  }
  return "#6B7280"; // Default gray
};

// Utility function to format service summary with payment info
export const formatServiceSummary = (service: RiderServiceData): string => {
  if (service.type === "ORDER") {
    const amount = service.orderData?.deliveryMetaData?.price 
      ? `GH₵${service.orderData.deliveryMetaData.price}` 
      : "Amount TBD";
    const paymentStatus = service.orderData?.paymentStatus || "Unknown";
    const paymentMethod = service.orderData?.paymentMethod || "Unknown";
    return `${service.customer.name} • ${amount} • ${service.orderData?.status || "Pending"} • ${paymentMethod} (${paymentStatus})`;
  } else if (service.type === "BOOKING") {
    const amount = service.bookingData?.deliveryFee 
      ? `GH₵${service.bookingData.deliveryFee}` 
      : "Amount TBD";
    const status = service.bookingData?.status || "Pending";
    const paymentStatus = service.bookingData?.paymentStatus || "Unknown";
    const paymentMethod = service.bookingData?.paymentMethod || "Unknown";
    return `${service.customer.name} • ${amount} • ${status} • ${paymentMethod} (${paymentStatus})`;
  }
  return "Service details unavailable";
};