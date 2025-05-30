// Updated GraphQL Query with route data
import { gql } from "@apollo/client"

export const GET_ALL_RIDERS_ORDER_ITEMS_BY_SERVICE = gql`
  query GetAllRidersOrderItemsByService {
    getAllRidersOrderItemsByService {
      orderId
      createdAt
      status
      deliveryMetaData {
        id
        price
        duration
        distance
        zone
        geojson
        isochroneId
      }
      vendor {
        id
        name
        location
        coordinates
      }
      productInfor {
        product {
          id
          name
          price
          state
        }
        quantity
      }
      customer {
        name
        dpfile
        number
      }
      rider {
        id
        name
        number
        location
        coordinates
      }
      order {
        id
        coordinates
        deliveryAddress
        distance
        duration
        routeData {
          id
          orderId
          geojson
          userId
          createdAt
        }
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
  }
`

// Additional query to get route data for specific orders
export const GET_ROUTE_DATA = gql`
  query GetRouteData($orderId: String!) {
    getRouteData(routeID: $orderId) {
      distance
      duration
    }
  }
`

// Query to get all route data
export const GET_ROUTE_DATA_FOR_EARCH_ORDER = gql`
    query GetOrderRoute($orderId:String!) {
    getOrderRoute(orderId:$orderId) {
      id
      orderId
      geojson
      userId
      createdAt
    }
  }
`