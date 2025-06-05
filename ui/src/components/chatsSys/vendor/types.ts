// types.ts - Type definitions for Vendor Chat System

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderRole: "customer" | "vendor" | "rider" | "system"
  text?: string
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
  type: "text" | "location" | "status_update" | "image" | "file" | "action_required"
  attachments?: {
    type: "image" | "file" | "location"
    url: string
    name?: string
    coordinates?: { lat: number; lng: number }
  }[]
  metadata?: {
    orderStatus?: string
    location?: { lat: number; lng: number; address: string }
    action?: string
  }
}

export interface ServiceData {
  id: string
  serviceId: string
  type: 'ORDER' | 'BOOKING'
  rider?: {
    id: string
    name: string
    number: string
    location?: string
    coordinates?: [number, number]
  }
  customer: {
    id?: string
    name: string
    number: string
    dpfile?: string
  }
  vendor: {
    id: string
    name: string
    location: string
    coordinates: [number, number]
  }
  createdAt: string
  orderData?: {
    orderId: string
    status: string
    deliveryAddress: string
    estimatedDeliveryDate?: string
    serviceFee?: string
    productInfor: {
      product: {
        id: string
        name: string
        price: string
        state: string
      }[]
      quantity: number
    }[]
    deliveryMetaData?: {
      id: string
      price: number
      duration: number
      distance: number
      zone: number
      geojson?: string
      isochroneId: string
    }
    order: {
      id: string
      coordinates: [number, number]
      deliveryAddress: string
      distance?: string
      duration?: string
    }
  }
  bookingData?: {
    bookingId: string
    startTime: string
    endTime: string
    day: string
    item?: string
    tableSize: number
    userType: string
    isConfirmed?: boolean
    pickupLocation?: [number, number]
    dropoffLocation?: [number, number]
    deliveryAddress: string
    deliveryFee?: string
    distance?: string
    duration?: string
    estimatedDeliveryDate?: string
  }
}

export interface LocationData {
  lat: number
  lng: number
  address: string
}

export interface VendorChatWindowProps {
  service: ServiceData
  onClose: () => void
  currentUserLocation?: { lat: number; lng: number }
}

export interface VendorMiniMapProps {
  riderLocation?: LocationData
  customerLocation?: LocationData
  vendorLocation?: LocationData
  isExpanded: boolean
  onToggleExpand: () => void
  isFullScreen?: boolean
}

export interface FullScreenMapModalProps {
  isOpen: boolean
  onClose: () => void
  riderLocation?: LocationData
  customerLocation?: LocationData
  vendorLocation?: LocationData
  service: ServiceData
}