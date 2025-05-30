// types.ts - Updated type definitions with route data
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

export interface RiderInfo {
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

// Updated Order interface with route data
export interface Order {
  id: string
  coordinates: [number, number]
  deliveryAddress: string
  items: OrderItem[]
  distance?: string
  duration?: string
  routeData?: RouteInfo | null
}

// New RouteInfo interface for database route data
export interface RouteInfo {
  id: string
  orderId: string
  geojson: string
  userId: string
  createdAt?: string
}

export interface ZoneMetaData {
  id: string
  price: number
  duration: number
  distance: number
  zone: number
  geojson?: string
  isochroneId?: string
}

// Updated OrderData interface
export interface OrderData {
  orderId: string
  createdAt: string
  status: string
  vendor: Vendor
  productInfor: ProductInfo[]
  customer: Customer
  rider: RiderInfo | null
  order: Order
  deliveryMetaData?: ZoneMetaData | null
}

export interface ProcessedRider {
  id: string
  name: string
  status: "Available" | "On Delivery" | "On Break"
  location: string
  orders: number
  rating: number
  phone: string
  vehicle: string
  lastActive: string
  earnings: string
  currentOrders: OrderData[]
  position: { lat: number; lng: number }
  direction: number
  routeCoordinates?: [number, number][]
}

export interface RouteData {
  coordinates: [number, number][]
  distance: number
  duration: number
  color: string
  summary: string
  legs: number
}

// New interface for parsed route GeoJSON from database
export interface ParsedRouteData {
  coordinates: [number, number][]
  distance: string
  duration: string
  summary: string
}