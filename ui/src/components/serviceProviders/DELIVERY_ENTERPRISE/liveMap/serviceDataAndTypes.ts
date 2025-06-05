import { gql } from "@apollo/client";
//all in one file called serviceDataAndTypes
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
        tableSize
        userType
        isConfirmed
        pickupLocation
        dropoffLocation
        deliveryAddress
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
}

export interface OrderProductInfor {
  product: Product[];
  quantity: number;
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
  productInfor: OrderProductInfor[];
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
  deliveryFee?: string;
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
  type: 'ORDER' | 'BOOKING';
  rider?: UsersInfor;
  customer: UsersInfor;
  vendor: Service;
  createdAt: string;
  orderData?: CartItemOrder;
  bookingData?: AppointmentBookingData;
}

// Processed rider type for the map
export interface ProcessedRider {
  id: string;
  name: string;
  status: "Available" | "On Delivery" | "On Break";
  location: string;
  orders: number;
  bookings?: number;
  rating: number;
  phone: string;
  vehicle: "Motorcycle" | "Bicycle";
  lastActive: string;
  earnings: string;
  currentOrders: ServiceData[];
  currentBookings?: ServiceData[];
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