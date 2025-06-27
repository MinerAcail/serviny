import { gql } from "@apollo/client"

export interface ServiceData {
  id: string
  serviceId: string
  type: "ORDER" | "BOOKING"
  date: string
  time: string
  customer: string
  customerPhone: string
  vendor: string
  vendorLocation: string
  rider: string
  riderPhone: string
  pickup: string
  delivery: string
  status: string
  priority: string
  orderValue: string
  serviceAmount: number
  deliveryTime: string
  rating: number
  distance: string
  paymentStatus?: string
  paymentMethod?: string
  multiGroupId?: string
  tableSize?: string
  bookingDay?: string
  startTime?: string
  endTime?: string
  item?: string
  notes?: string
  rawData: RawServiceDataFromAPI
}
// Type for raw service data from GraphQL
export interface RawServiceDataFromAPI {
  id: string
  serviceId?: string
  type: "ORDER" | "BOOKING"
  createdAt: string
  
  rider?: {
    id: string
    name: string
    number: string
    location: string
    coordinates: [number, number]
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
  
  orderData?: {
    orderId: string
    status: string
    deliveryAddress: string
    estimatedDeliveryDate?: string
    serviceFee: number
    paymentStatus?: string
    paymentMethod?: string
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
      geojson?: string
      isochroneId?: string
    }
    routeData?: {
      id: string
      orderId: string
      geojson?: string
      userId: string
      createdAt: string
    }
    order?: {
      id: string
      coordinates: [number, number]
      deliveryAddress: string
      distance: string
      duration: string
    }
  }
  
  bookingData?: {
    bookingId: string
    status?: string
    startTime?: string
    endTime?: string
    day?: string
    item?: string
    notes?: string
    tableSize?: string
    userType?: string
    isConfirmed: boolean
    pickupLocation?: [number, number]
    dropoffLocation?: [number, number]
    deliveryAddress: string
    pickUpAddress?: string
    multiGroupId?: string
    deliveryFee: string
    distance?: string
    duration?: string
    estimatedDeliveryDate?: string
    paymentStatus?: string
    paymentMethod?: string
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
      geojson?: string
      userId: string
      createdAt: string
    }
  }
}
export interface Stats {
  total: number
  delivered: number
  revenue: string
  paidRevenue: string
  pendingRevenue: string
  avgRating: number
  successRate: string
  paymentRate: string
  orders: number
  bookings: number
  multiGroups: number
  paidServices: number
}

export interface FilteredData {
  filteredHistory: ServiceData[]
  filteredGroups: Map<string, ServiceData[]>
  filteredStandalone: ServiceData[]
}

export type ViewMode = "all" | "groups" | "standalone"

// GraphQL query
export const GET_ALL_RIDERS_SERVICE_DATA = gql`
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
        notes
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