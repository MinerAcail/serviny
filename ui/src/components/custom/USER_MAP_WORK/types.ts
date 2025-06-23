import { gql } from "@apollo/client"

// GraphQL Query for User Service Data
export const GET_ALL_USER_SERVICE_DATA = gql`
  query GetAllUserServiceData {
    getAllUserServiceData {
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
      
      bookingData {
        bookingId
        startTime
        endTime
        day
        item
        tableSize
        userType
        status
        pickupLocation
        dropoffLocation
        deliveryAddress
        pickUpAddress
        deliveryFee
        distance
        duration
        estimatedDeliveryDate
        notes
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
`

// GraphQL Query for Payment Status
export const GET_BOOKING_ORDER_PAYMENT_STATUS = gql`
  query GetBookingOrderPaymentStatus($entityId: String!, $entityType: String!) {
    getBookingOrderPaymentStatusByUser(entityId: $entityId, entityType: $entityType) {
      id
      method
      status
      reference
      entityId
      entityType
    }
  }
`

// GraphQL Mutation for Updating Status
export const UPDATE_ORDER_BOOK_STATUS = gql`
  mutation UpdateOrderBookStatus($entityId: String!, $entityType: String!, $status: String!) {
    updateOrderBookStatus(entityId: $entityId, entityType: $entityType, status: $status)
  }
`

// Type definitions
export interface ServiceData {
  id: string
  serviceId: string
  type: "ORDER" | "BOOKING"
  rider?: {
    id: string
    name: string
    number: string
    location?: string
    coordinates?: [number, number]
  }
  customer: {
    name: string
    dpfile?: string
    number: string
  }
  vendor: {
    id: string
    name: string
    location: string
    coordinates: [number, number]
  }
  createdAt: string
  orderData?: {
    orderId?: string
    status?: string // Using status field for orders
    deliveryAddress?: string
    estimatedDeliveryDate?: string
    serviceFee?: number
    productInfor?: Array<{
      product: {
        id: string
        name: string
        price: number
        state: string
      }
      quantity: number
    }>
    deliveryMetaData?: {
      id: string
      price: number
      duration: string
      distance: string
      zone: string
      geojson: any
      isochroneId: string
    }
    routeData?: {
      id: string
      orderId: string
      geojson: any
      userId: string
      createdAt: string
    }
    order?: {
      id: string
      coordinates: [number, number]
      deliveryAddress: string
      distance: string
      duration: string
      items: Array<{
        id: string
        orderId: string
        quantity: number
        itemType: string
        product: {
          id: string
          name: string
        }
      }>
    }
  }
  bookingData?: {
    bookingId?: string
    startTime?: string
    endTime?: string
    day?: string
    item?: string
    tableSize?: number
    userType?: string
    status?: string // Using status field for bookings instead of isConfirmed
    pickupLocation?: string
    dropoffLocation?: string
    deliveryAddress?: string
    pickUpAddress?: string
    deliveryFee?: number
    distance?: string
    duration?: string
    estimatedDeliveryDate?: string
    notes?: string
    rangeMetaData?: {
      id: string
      riderId: string
      startKm: number
      endKm: number
      price: number
    }
    routeData?: {
      id: string
      orderId: string
      geojson: any
      userId: string
      createdAt: string
    }
  }
}

export interface PaymentStatus {
  id: string
  method: string
  status: string
  reference: string
  entityId: string
  entityType: string
}

export interface ServiceStats {
  totalOrders: number
  totalBookings: number
  activeOrders: number
  confirmedBookings: number
}

export type ViewMode = "all" | "selected"
export type ActiveTab = "all" | "orders" | "bookings"
export type SortBy = "date" | "status" | "type"

// Order status constants
export const ORDER_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const

// Booking status constants
export const BOOKING_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

// Payment status constants
export const PAYMENT_STATUSES = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
} as const

export type OrderStatus = typeof ORDER_STATUSES[keyof typeof ORDER_STATUSES]
export type BookingStatus = typeof BOOKING_STATUSES[keyof typeof BOOKING_STATUSES]
export type PaymentStatusType = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES]