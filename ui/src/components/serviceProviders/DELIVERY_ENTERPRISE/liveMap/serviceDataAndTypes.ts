import { GOOGLE_MAPS_CONFIG } from "@/components/global/formatPrice";
import { gql } from "@apollo/client";
import type { Libraries } from "@react-google-maps/api";

// GraphQL Queries
export const GET_ALL_RIDERS_SERVICE_DATA = gql`
  query GetAllRidersServiceData {
    getAllRidersServiceData {
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

      # Order-specific data (only populated when type = ORDER)
      orderData {
        orderId
        status
        deliveryAddress
        estimatedDeliveryDate
        serviceFee
        productInfor {
          product {
            id
            name
            price
            state
            imageUrls
          }
          quantity
          itemType
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
          items {
            id
            orderId
            quantity
            itemType
            product {
              id
              name
            }
          }
        }
      }

      # Booking-specific data (only populated when type = BOOKING)
      bookingData {
        bookingId
        startTime
        endTime
        day
        item
        notes

        tableSize
        userType
        isConfirmed
        status
        transportType
        cargoId
        pickupLocation
        dropoffLocation
        deliveryAddress
        pickUpAddress
        multiGroupId
        deliveryFee
        distance
        duration
        estimatedDeliveryDate
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
     
       requestItemData {
        requestId
        userType
        isConfirmed
        paymentStatus
        paymentMethod
        transportType
        deliveryFee
        distance
        duration
        estimatedDeliveryDate
        requestItem {
          id
          name
          webLink
          price
          state
          description
          quantity
          itemType
          imageUrls
          duration
          distance
          deliveryFee
          dropoffLocation
          pickupLocation
          estimatedDeliveryDate
          deliveryAddress
          pickUpAddress
          rangeMetaId
          categories
          createdAt
          updatedAt
        }
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



// Base types that are shared
export interface UsersInfor {
  id?: string;
  name: string;
  number: string;
  location?: string;
  coordinates?: [number, number];
  dpfile?: string;
}

export interface Service {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
}

export interface RouteInfo {
  id: string;
  orderId: string;
  geojson?: string;
  userId?: string;
  createdAt: string;
}

// Order-specific types
export interface Product {
  id: string;
  name: string;
  price: string;
  state: string;
  imageUrls: string[];
}

export interface productInfor {
  product: Product[];
  quantity: number;
  itemType: string;
}

export interface ZoneMetaData {
  id: string;
  price: number;
  duration: number;
  distance: number;
  zone: number;
  geojson?: string;
  isochroneId: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  itemType: string;
  product: {
    id: string;
    name: string;
  };
}

export interface Order {
  id: string;
  coordinates: [number, number];
  deliveryAddress: string;
  distance?: string;
  duration?: string;
  items: OrderItem[];
}

export interface CartItemOrder {
  orderId: string;
  status: string;
  deliveryAddress: string;
  estimatedDeliveryDate?: string;
  serviceFee?: string;
  productInfor: productInfor[];
  deliveryMetaData?: ZoneMetaData;
  routeData?: RouteInfo;
  order: Order;
}

// Booking-specific types
export interface RangeMetaData {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
}

export interface AppointmentBookingData {
  bookingId: string;
  startTime: string;
  endTime: string;
  day: string;
  item?: string;
  tableSize: number;
  userType: string;
  isConfirmed?: boolean;
  pickupLocation?: [number, number];
  dropoffLocation?: [number, number];
  deliveryAddress: string;
  pickUpAddress?: string;
  multiGroupId?: string;
  deliveryFee?: string;
  status?: string;
  transportType?: string;
  cargoId?: string;
  distance?: string;
  duration?: string;
  estimatedDeliveryDate?: string;
  routeData?: RouteInfo;
  rangeMetaData?: RangeMetaData;
}

// Main ServiceData type
export interface ServiceData {
  id: string;
  serviceId: string;
  type: "ORDER" | "BOOKING" | "REQUESTITEM";
  rider?: UsersInfor;
  customer: UsersInfor;
  vendor: Service;
  createdAt: string;
  orderData?: CartItemOrder;
  bookingData?: AppointmentBookingData;
  requestItemData?: RequestItemData;
}
export interface RequestItem {
  id: string;
  name?: string;
  price?: string;
  state?: string;
  description?: string;
  quantity: number;
  itemType?: string;
  categories?: string;
  imageUrls?: string[];
  duration?: string;
  distance?: string;
  deliveryFee?: string;
  dropoffLocation?: [number, number];
  pickupLocation?: [number, number];
  estimatedDeliveryDate?: string;
  deliveryAddress?: string;
  pickUpAddress?: string;
  rangeMetaId?: string;
  webLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RequestItemData {
  requestId: string;
  userType: string;
  isConfirmed?: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  transportType?: string;
  deliveryFee?: string;
  distance?: string;
  duration?: string;
  estimatedDeliveryDate?: string;
  requestItem?: RequestItem;
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
    geojson: any;
    userId: string;
    createdAt: string;
  };
}
export interface RidersServiceData {
  getAllRidersServiceData: ServiceData;
}

export interface getAllRidersServiceData {
  id: string;
  serviceId: string;
  type: "ORDER" | "BOOKING";
  rider?: {
    id: string;
    name: string;
    number: string;
    location?: string;
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
    coordinates: [number, number];
  };
  createdAt: string;
  orderData?: {
    orderId?: string;
    status?: string; // Using status field for orders
    deliveryAddress?: string;
    estimatedDeliveryDate?: string;
    serviceFee?: number;
    productInfor?: Array<{
      product: Product[];
      quantity: number;
      itemType: string;
    }>;
    deliveryMetaData?: {
      id: string;
      price: number;
      duration: string;
      distance: string;
      zone: string;
      geojson: any;
      isochroneId: string;
    };
    routeData?: {
      id: string;
      orderId: string;
      geojson: any;
      userId: string;
      createdAt: string;
    };
    order?: {
      id: string;
      coordinates: [number, number];
      deliveryAddress: string;
      distance: string;
      duration: string;
      items: Array<{
        id: string;
        orderId: string;
        quantity: number;
        itemType: string;

        itemType: string;
        product: {
          id: string;
          name: string;
        };
      }>;
    };
  };
  bookingData?: {
    bookingId?: string;
    startTime?: string;
    endTime?: string;
    day?: string;
    item?: string;
    tableSize?: number;
    userType?: string;
    status?: string; // Using status field for bookings instead of isConfirmed
    pickupLocation?: string;
    dropoffLocation?: string;
    deliveryAddress?: string;
    pickUpAddress?: string;
    cargoId?: string;
    deliveryFee?: number;
    distance?: string;
    duration?: string;
    estimatedDeliveryDate?: string;
    notes?: string;
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
      geojson: any;
      userId: string;
      createdAt: string;
    };
  };
}
// Processed rider type for the map
export interface ProcessedRider {
  id: string;
  name: string;
  status: "Available" | "On Delivery" | "On Break";
  location: string;
  orders: number;
  bookings?: number;
  requestItems?: number;
  rating: number;
  phone: string;
  vehicle: "Motorcycle" | "Bicycle";
  lastActive: string;
  earnings: string;
  currentOrders: ServiceData[];
  currentBookings?: ServiceData[];
  currentRequestItems?: ServiceData[];
  
  position: { lat: number; lng: number };
  direction: number;
  routeCoordinates?: [number, number][];
}

// Route data for map visualization
export interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  color: string;
  summary: string;
  legs: number;
  geojson?: string;
}

export interface ParsedRouteData {
  coordinates: [number, number][];
  distance: string;
  duration: string;
  summary: string;
}

// Stats interface
export interface Stats {
  activeRiders: number;
  availableRiders: number;
  onBreakRiders: number;
  totalOrders: number;
  totalBookings: number;
  totalServiceData: number;
  ordersWithRoutes: number;
  routeFetchProgress: { current: number; total: number };
  motorcycles: number;
  bicycles: number;
}

// Search suggestion types
export interface SearchSuggestion {
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

// Entity selection types
export interface SelectedEntity {
  type:
    | "rider"
    | "customer"
    | "order"
    | "booking"
    | "vendor"
    | "multigroup"
    | null;
  value: string;
  relatedData: {
    riders: ProcessedRider[];
    services: ServiceData[];
    vendors: Service[];
    customers: UsersInfor[];
    routes: RouteInfo[];
  };
}

// Filter types
export type StatusFilter = "all" | "Available" | "On Delivery" | "On Break";
export type VehicleFilter = "all" | "Motorcycle" | "Bicycle";
export type TypeFilter = "all" | "ORDER" | "BOOKING";

// Component prop types
// export interface LiveMapProps {
//   // No props needed for main component
// }

export interface SearchAndFiltersProps {
  serviceData: ServiceData[];
  riders: ProcessedRider[];
  stats: Stats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  vehicleFilter: VehicleFilter;
  setVehicleFilter: (filter: VehicleFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
  selectedEntity: SelectedEntity | null;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
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

export interface RouteManagementHookProps {
  serviceData: ServiceData[];
  riders: ProcessedRider[];
  isLoaded: boolean;
  loadError: any;
  mapLoaded: boolean;
  mapInitialized: boolean;
  directionsServiceRef: React.RefObject<google.maps.DirectionsService | null>;
  getOrderRoute: any;
}

export interface MobileHeaderProps {
  showMobileMenu: boolean;
  setShowMobileMenu: (show: boolean) => void;
  stats: Stats;
  showIsochrones: boolean;
  setShowIsochrones: (show: boolean) => void;
  showRoutes: boolean;
  setShowRoutes: (show: boolean) => void;
  isLoaded: boolean;
  loadingDatabaseRoutes: boolean;
  serviceData: ServiceData[];
  fetchAllRoutesForServices: () => void;
}

export interface RouteProgressIndicatorProps {
  loadingDatabaseRoutes: boolean;
  routeFetchProgress: { current: number; total: number };
  loadingRoutes: Set<string>;
  riders: ProcessedRider[];
}

export interface DesktopStatsCardsProps {
  databaseRoutes: Map<string, RouteData>;
  riders: ProcessedRider[];
  riderRoutes: Map<string, RouteData>;
  stats: Stats;
}

export interface FilterDropdownProps {
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  vehicleFilter: VehicleFilter;
  setVehicleFilter: (filter: VehicleFilter) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
  stats: Stats;
  isMobile: boolean;
}

// Map utility function types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface IsochroneData {
  vendorId: string;
  polygon: [number, number][];
  color: string;
  zone: number;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface MapError extends Error {
  type: "initialization" | "rendering" | "data" | "network";
  recoverable: boolean;
}

// Event handler types
export type RiderClickHandler = (rider: ProcessedRider) => void;
export type EntitySelectionHandler = (entity: SelectedEntity | null) => void;
export type ViewOnLiveMapHandler = (
  entityId: string,
  entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
) => void;

// Hook return types
export interface RouteManagementReturn {
  riderRoutes: Map<string, RouteData>;
  databaseRoutes: Map<string, RouteData>;
  loadingRoutes: Set<string>;
  loadingDatabaseRoutes: boolean;
  orderRouteCache: Map<string, RouteData>;
  routeFetchProgress: { current: number; total: number };
  fetchAllRoutesForServices: () => Promise<void>;
  fetchRiderRoute: (rider: ProcessedRider) => Promise<void>;
  fetchServiceRoute: (serviceId: string) => Promise<RouteData | null>;
}

export interface SearchAndFiltersReturn {
  SearchSuggestions: React.ComponentType;
  FilterControlPanel: React.ComponentType;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  clearEntityFilter: () => void;
  handleSearchSuggestionSelect: (suggestion: SearchSuggestion) => void;
}

// Configuration constants
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-0.187, 5.6037] as [number, number],
  DEFAULT_ZOOM: 12,
  MAX_ZOOM: 18,
  MIN_ZOOM: 8,
  BOUNDS_PADDING: 50,
  ROUTE_FETCH_DELAY: 2000,
  MARKER_UPDATE_DELAY: 500,
  POLL_INTERVAL: 90000,
} as const;

export const ROUTE_COLORS = {
  ACTIVE: "#3B82F6",
  AVAILABLE: "#10B981",
  ON_BREAK: "#F59E0B",
  DEFAULT: "#6B7280",
} as const;

export const STATUS_COLORS = {
  Available: "#10B981",
  "On Delivery": "#3B82F6",
  "On Break": "#F59E0B",
} as const;

// Type guards
export const isOrder = (
  service: ServiceData
): service is ServiceData & { orderData: CartItemOrder } => {
  return service.type === "ORDER" && !!service.orderData;
};

export const isBooking = (
  service: ServiceData
): service is ServiceData & { bookingData: AppointmentBookingData } => {
  return service.type === "BOOKING" && !!service.bookingData;
};

export const hasCoordinates = (
  coordinates: any
): coordinates is [number, number] => {
  return (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    typeof coordinates[0] === "number" &&
    typeof coordinates[1] === "number"
  );
};

export const isValidRoute = (route: any): route is RouteData => {
  return (
    route &&
    Array.isArray(route.coordinates) &&
    typeof route.distance === "number" &&
    typeof route.duration === "number"
  );
};
