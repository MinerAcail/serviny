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
  rawData: any
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
