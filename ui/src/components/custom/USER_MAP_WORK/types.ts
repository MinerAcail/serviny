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
`

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
  orderData?: any
  bookingData?: any
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
