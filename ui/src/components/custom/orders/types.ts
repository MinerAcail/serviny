// types.ts
import { gql } from "@apollo/client"

// Types based on your GraphQL schema
export interface Product {
  id: string
  name: string
  price: string
  state: string
}

export interface ProductInfo {
  product: Product[]
  quantity: number
}

export interface Vendor {
  id: string
  name: string
  location: string
  coordinates: [number, number]
}

export interface Customer {
  name: string
  dpfile: string | null
  number: string
}

export interface Rider {
  id: string
  name: string
  number: string
  location: string
  coordinates?: [number, number]
}

export interface OrderItem {
  id: string
  orderId: string
  quantity: number
  itemType: string
  product: Product | null
}

export interface Order {
  id: string
  coordinates: [number, number]
  deliveryAddress: string
  items: OrderItem[]
}

// Add ZoneMetaData interface
export interface ZoneMetaData {
  id: string
  price: number
  duration: number
  distance: number
  zone: number
  geojson?: string
  isochroneId?: string
}

export interface OrderData {
  orderId: string
  createdAt: string
  status: string
  vendor: Vendor
  productInfor: ProductInfo[]
  customer: Customer
  rider: Rider | null
  order: Order
  deliveryMetaData?: ZoneMetaData | null // Add this field
}

// GraphQL Query - Updated to include deliveryMetaData
export const GET_ALL_ORDER_ITEMS_BY_PRODUCT_ID_DELIVERY = gql`
  query GetAllOrderItemsByProductIDDelivery {
    getAllOrderItemsByProductIdDelivery {
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

// Utility functions
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-orange-500"
    case "confirmed":
      return "bg-blue-500"
    case "preparing":
      return "bg-yellow-500"
    case "out_for_delivery":
      return "bg-purple-500"
    case "delivered":
      return "bg-green-500"
    case "cancelled":
      return "bg-red-500"
    default:
      return "bg-gray-500"
  }
}

export const getStatusIcon = (status: string) => {
  const icons = {
    pending: "Clock",
    confirmed: "CheckCircle", 
    preparing: "Package",
    out_for_delivery: "Truck",
    delivered: "CheckCircle",
    cancelled: "XCircle",
    default: "AlertCircle"
  }
  return icons[status.toLowerCase() as keyof typeof icons] || icons.default
}

export const calculateTotalAmount = (productInfor: ProductInfo[], deliveryMetaData?: ZoneMetaData | null) => {
  const itemsTotal = productInfor.reduce((total, item) => {
    const productPrice = parseFloat(item.product[0]?.price || "0")
    return total + (productPrice * item.quantity)
  }, 0)
  
  // Add delivery fee if available
  const deliveryFee = deliveryMetaData?.price || 0
  return itemsTotal + deliveryFee
}

export const getTotalItemsCount = (productInfor: ProductInfo[]) => {
  return productInfor.reduce((total, item) => total + item.quantity, 0)
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const getEstimatedDeliveryTime = (createdAt: string, deliveryMetaData?: ZoneMetaData | null) => {
  const created = new Date(createdAt)
  // Use delivery duration from metadata if available, otherwise default to 45 minutes
  const estimatedMinutes = deliveryMetaData?.duration ? Math.ceil(deliveryMetaData.duration / 60) : 45
  const estimated = new Date(created.getTime() + estimatedMinutes * 60000)
  return estimated
}

// Helper function to format delivery duration
export const formatDeliveryDuration = (seconds: number) => {
  const minutes = Math.ceil(seconds / 60)
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

// Helper function to format delivery distance
export const formatDeliveryDistance = (kilometers: number) => {
  if (kilometers < 1) {
    return `${Math.round(kilometers * 1000)}m`
  }
  return `${kilometers.toFixed(1)}km`
}