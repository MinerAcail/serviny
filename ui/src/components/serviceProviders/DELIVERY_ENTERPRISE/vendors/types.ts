// types.ts - Type definitions for the vendor delivery system

export interface MetaData {
  id: string
  price: number
  duration: number
  distance: number
  zone: number
}

export interface IsochroneResult {
  id: string
  geojson: string
  metaData?: MetaData[]
  locations?: number[][]
  range?: number[]
  transportMode?: string
  address?: string
  createdAt: string
  updatedAt: string
  status: string
  riderId: string
  vendorId: string
  error?: string
  errorCode?: string
}

export interface Vendor {
  id: string
  name: string
  type: string
  number: string
  email: string
  location?: string
  aboutMe?: string
  dpfile?: string
  businessType?: string
  isVerified?: boolean
  coordinates?: number[]
  createdAt: string
  updatedAt: string
}

export interface VendorMapData {
  vendor: Vendor
  mapData: IsochroneResult[]
}

export interface ProcessedVendor extends Vendor {
  category: string
  phone: string
  address: string
  status: string
  rating: number
  totalOrders: number
  monthlyOrders: number
  revenue: string
  joinDate: string
  commission: string
  avgOrderValue: string
  hasDeliveryZones: boolean
  deliveryRadius: string
  activeRiders: number
  totalZones: number
  minPrice: number
  maxPrice: number
  avgDeliveryTime: number
  lastUpdated: string
}

export interface VendorStats {
  totalVendors: number
  activeVendors: number
  totalZones: number
  avgRating: string
}