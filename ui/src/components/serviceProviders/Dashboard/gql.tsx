import { gql } from "@apollo/client";

export const GET_ALL_APPOINTMENT_BOOKINGS_BY_USER_ID = gql`
  query getAllServiceDataByUserId($userId: String!) {
    getAllServiceDataByUserId(userId: $userId) {
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
`;
export type ViewMode = "all" | "groups" | "standalone";

export interface ServiceData {
  id: string;
  serviceId: string;
  type: "ORDER" | "BOOKING";
  date: string;
  time: string;
  customer: string;
  customerPhone: string;
  vendor: string;
  vendorLocation: string;
  rider: string;
  riderPhone: string;
  pickup: string;
  delivery: string;
  status: string;
  priority: string;
  orderValue: string;
  serviceAmount: number;
  deliveryTime: string;
  rating: number;
  distance: string;
  paymentStatus?: string;
  paymentMethod?: string;
  multiGroupId?: string;
  tableSize?: string;
  bookingDay?: string;
  startTime?: string;
  endTime?: string;
  item?: string;
  notes?: string;
  rawData: any;
}