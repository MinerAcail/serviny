"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  MapPin,
  Clock,
  Phone,
  Star,
  Loader2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { useQuery, gql } from "@apollo/client"
import { useMemo, useState } from "react"

export const GET_ALL_RIDERS_SERVICE_DATA = gql`
  query GetAllRidersServiceData {
    getAllRidersServiceData {
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
      
      # Order-specific data (only populated when type = ORDER)
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
      
      # Booking-specific data (only populated when type = BOOKING)
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

export default function History() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const { loading, error, data, refetch } = useQuery(GET_ALL_RIDERS_SERVICE_DATA, {
    pollInterval: 30000,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  })

  // Process the service data for history display
  const historyData = useMemo(() => {
    if (!data?.getAllRidersServiceData) return []

    return data.getAllRidersServiceData
      .map((service: any) => {
        const isOrder = service.type === "ORDER"
        const serviceInfo = isOrder ? service.orderData : service.bookingData

        return {
          id: isOrder ? service.orderData?.orderId : service.bookingData?.bookingId,
          serviceId: service.id,
          type: service.type,
          date: new Date(service.createdAt).toLocaleDateString(),
          time: new Date(service.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          customer: service.customer.name,
          customerPhone: service.customer.number,
          vendor: service.vendor.name,
          vendorLocation: service.vendor.location,
          rider: service.rider?.name || "Unassigned",
          riderPhone: service.rider?.number || "-",
          pickup: service.vendor.location,
          delivery: isOrder ? service.orderData?.deliveryAddress : service.bookingData?.deliveryAddress,
          status: isOrder ? service.orderData?.status : service.bookingData?.isConfirmed ? "Confirmed" : "Pending",
          priority: "Normal",
          orderValue: isOrder
            ? `GH₵${service.orderData?.deliveryMetaData?.price || service.orderData?.serviceFee || "0"}`
            : `GH₵${service.bookingData?.deliveryFee || "0"}`,
          deliveryTime: isOrder
            ? service.orderData?.deliveryMetaData?.duration
              ? `${service.orderData.deliveryMetaData.duration} min`
              : "-"
            : service.bookingData?.duration
              ? `${service.bookingData.duration} min`
              : "-",
          rating: 4.8,
          distance: isOrder
            ? service.orderData?.deliveryMetaData?.distance
              ? `${service.orderData.deliveryMetaData.distance} km`
              : "-"
            : service.bookingData?.distance
              ? `${service.bookingData.distance} km`
              : "-",
          rawData: service,
        }
      })
      .sort((a: any, b: any) => new Date(b.rawData.createdAt).getTime() - new Date(a.rawData.createdAt).getTime())
  }, [data])

  // Filter history data based on search
  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return historyData

    const query = searchQuery.toLowerCase()
    return historyData.filter(
      (item: any) =>
        item.id?.toLowerCase().includes(query) ||
        item.customer?.toLowerCase().includes(query) ||
        item.vendor?.toLowerCase().includes(query) ||
        item.rider?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query),
    )
  }, [historyData, searchQuery])

  // Calculate statistics
  const stats = useMemo(() => {
    if (!historyData.length) return { total: 0, delivered: 0, revenue: 0, avgRating: 0 }

    const total = historyData.length
    const delivered = historyData.filter(
      (item: any) => item.status === "DELIVERED" || item.status === "Delivered" || item.status === "Confirmed",
    ).length

    const revenue = historyData.reduce((sum: number, item: any) => {
      const value = Number.parseFloat(item.orderValue.replace("GH₵", "").replace(",", "")) || 0
      return sum + value
    }, 0)

    const avgRating = 4.8

    return {
      total,
      delivered,
      revenue: revenue.toFixed(2),
      avgRating,
      successRate: total > 0 ? ((delivered / total) * 100).toFixed(1) : "0",
    }
  }, [historyData])

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Delivered</Badge>
      case "CANCELLED":
      case "CANCELED":
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Cancelled</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">Pending</Badge>
      case "PREPARING":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Preparing</Badge>
      case "OUT_FOR_DELIVERY":
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">Delivering</Badge>
      case "REFUNDED":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">Refunded</Badge>
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )
    }
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading History</h3>
          <p className="text-gray-600">Fetching service data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md mx-auto">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load History</h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container pt-10 mx-auto px-3 sm:px-6 py-3 sm:py-6 max-w-7xl">
     

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      </div>

      {/* Toggle Buttons Row */}
      <div className="mb-4 flex gap-2">
        <Button
          variant="ghost"
          className="flex-1 justify-center p-3 h-auto hover:bg-gray-50 text-xs"
          onClick={() => setIsStatsOpen(!isStatsOpen)}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">Statistics</span>
          </div>
          {isStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          className="flex-1 justify-center p-3 h-auto hover:bg-gray-50 text-xs"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Actions</span>
          </div>
          {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Collapsible Statistics */}
      <Card className="mb-4">
        <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span className="font-medium">Performance Overview</span>
              </div>
              {isStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-600">Total Services</p>
                </div>

                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>

                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">GH₵{stats.revenue}</p>
                  <p className="text-xs text-gray-600">Revenue</p>
                </div>

                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{stats.avgRating}</p>
                  <p className="text-xs text-gray-600">Avg Rating</p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Collapsible Actions */}
      <Card className="mb-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Quick Actions</span>
              </div>
              {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="rounded-xl h-auto p-3 flex-col gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Date Range</span>
                </Button>
                <Button variant="outline" className="rounded-xl h-auto p-3 flex-col gap-1">
                  <Download className="h-4 w-4" />
                  <span className="text-xs">Export</span>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-auto p-3 flex-col gap-1"
                  onClick={() => refetch()}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="text-xs">Refresh</span>
                </Button>
                <Button variant="outline" className="rounded-xl h-auto p-3 flex-col gap-1">
                  <Filter className="h-4 w-4" />
                  <span className="text-xs">Filter</span>
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Service History List */}
      <div className=" lg:grid-cols-2 gap-3 grid">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((order: any) => (
            <Card key={order.serviceId} className="border-0 shadow-sm bg-white rounded-xl">
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {order.type} #{order.id?.slice(-6) || order.serviceId.slice(-6)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {order.type === "ORDER" ? "Order" : "Booking"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {order.date} • {order.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.status)}
                    <span className="text-sm font-semibold text-gray-900">{order.orderValue}</span>
                  </div>
                </div>

                {/* Customer & Vendor Row */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-gray-700">Customer</span>
                    </div>
                    <p className="text-gray-900 truncate">{order.customer}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="font-medium text-gray-700">{order.type === "ORDER" ? "Vendor" : "Venue"}</span>
                    </div>
                    <p className="text-gray-900 truncate">{order.vendor}</p>
                  </div>
                </div>

                {/* Rider & Distance Row */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                  <div>
                    <span className="font-medium text-gray-700">Rider: </span>
                    <span className="text-gray-900">{order.rider}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Distance: </span>
                    <span className="text-gray-900">{order.distance}</span>
                  </div>
                </div>

                {/* Action Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="w-full rounded-lg">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg mx-4">
                    <DialogHeader>
                      <DialogTitle className="text-lg">
                        {order.type} #{order.id?.slice(-6) || order.serviceId.slice(-6)}
                      </DialogTitle>
                      <DialogDescription>Complete service information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {/* Service Overview */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">Date & Time</p>
                          <p className="text-gray-600">
                            {order.date} at {order.time}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Service Value</p>
                          <p className="text-gray-600">{order.orderValue}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Duration</p>
                          <p className="text-gray-600">{order.deliveryTime}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Distance</p>
                          <p className="text-gray-600">{order.distance}</p>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-2">Customer Information</p>
                        <p className="text-sm text-gray-900">{order.customer}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          <Phone className="h-3 w-3" />
                          {order.customerPhone}
                        </div>
                      </div>

                      {/* Vendor/Venue Info */}
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-2">
                          {order.type === "ORDER" ? "Vendor" : "Venue"} Information
                        </p>
                        <p className="text-sm text-gray-900">{order.vendor}</p>
                        <p className="text-xs text-gray-600 mt-1">{order.vendorLocation}</p>
                      </div>

                      {/* Rider Info */}
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-2">Rider Information</p>
                        <p className="text-sm text-gray-900">{order.rider}</p>
                        {order.riderPhone !== "-" && (
                          <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                            <Phone className="h-3 w-3" />
                            {order.riderPhone}
                          </div>
                        )}
                      </div>

                      {/* Route Information */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-900 mb-2">Route</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">From: {order.pickup}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-sm text-gray-600">To: {order.delivery}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status & Rating */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex gap-2">{getStatusBadge(order.status)}</div>
                        {order.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{order.rating}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h4>
            <p className="text-gray-500 text-sm px-4">
              {searchQuery
                ? "Try adjusting your search terms or clearing the search."
                : "No service history available at the moment."}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery("")} className="mt-4 rounded-xl">
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Loading indicator for refresh */}
      {loading && data && (
        <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-3 border z-50">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs text-gray-600">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  )
}
