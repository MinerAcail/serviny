"use client"

import type React from "react"

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
  DollarSign,
  CheckCircle,
  Building,
  FileText,
  X,
} from "lucide-react"
import { useQuery, gql } from "@apollo/client"
import { useMemo, useState, useRef, useEffect } from "react"

// Import types and utilities
import type { ServiceData, ViewMode } from "./types"
import {
  getPaymentStatusColor,
  getPaymentMethodIcon,
  processServiceData,
  generateSearchSuggestions,
  filterServices,
  calculateStats,
  getUniquePaymentStatuses,
} from "./rider-history-utils"

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

export default function RiderHistory(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [viewMode, setViewMode] = useState<ViewMode>("all")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showControls, setShowControls] = useState(false)

  const { loading, error, data, refetch } = useQuery(GET_ALL_RIDERS_SERVICE_DATA, {
    pollInterval: 30000,
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  })

  // Process the service data for history display with payment information and grouping
  const { historyData, groupedData, standaloneServices } = useMemo(() => {
    if (!data?.getAllRidersBookingAndOrdersAssignedData)
      return { historyData: [], groupedData: new Map(), standaloneServices: [] }

    return processServiceData(data.getAllRidersBookingAndOrdersAssignedData)
  }, [data])

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    return generateSearchSuggestions(historyData, searchQuery)
  }, [historyData, searchQuery])

  // Enhanced filter with support for multi-group search and filtering
  const { filteredHistory, filteredGroups, filteredStandalone } = useMemo(() => {
    return filterServices(
      historyData,
      standaloneServices,
      groupedData,
      searchQuery,
      typeFilter,
      statusFilter,
      paymentStatusFilter,
    )
  }, [historyData, searchQuery, typeFilter, statusFilter, paymentStatusFilter, standaloneServices, groupedData])

  // Enhanced statistics with payment information
  const stats = useMemo(() => {
    return calculateStats(historyData, groupedData)
  }, [historyData, groupedData])

  // Get unique payment statuses for filters
  const paymentStatuses = useMemo(() => {
    return getUniquePaymentStatuses(historyData)
  }, [historyData])

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    const cleanSuggestion = suggestion.replace(/^[👤🏢🚴💳📋🔗📊📝]\s/u, "")
    setSearchQuery(cleanSuggestion)
    setShowSuggestions(false)
  }

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Multi-Group component for grouped bookings
  const MultiGroupCard: React.FC<{ groupId: string; services: ServiceData[] }> = ({ groupId, services }) => {
    const shortGroupId = groupId.slice(-6)

    // Calculate group statistics
    const totalAmount = services.reduce((sum, service) => sum + service.serviceAmount, 0)
    const uniqueCustomers = [...new Set(services.map((s) => s.customer))]
    const uniqueVendors = [...new Set(services.map((s) => s.vendor))]
    const confirmedCount = services.filter((s) => s.status?.toUpperCase() === "CONFIRMED").length
    const paidCount = services.filter(
      (s) => s.paymentStatus?.toUpperCase() === "PAID" || s.paymentStatus?.toUpperCase() === "COMPLETED",
    ).length
    const paidAmount = services
      .filter((s) => s.paymentStatus?.toUpperCase() === "PAID" || s.paymentStatus?.toUpperCase() === "COMPLETED")
      .reduce((sum, service) => sum + service.serviceAmount, 0)

    return (
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl">
        <CardContent className="p-3 sm:p-4">
          {/* Group Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white font-semibold text-xs">🔗 Multi-Group #{shortGroupId}</Badge>
                <Badge variant="outline" className="text-xs">
                  {services.length} Booking{services.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {uniqueCustomers.length === 1 ? uniqueCustomers[0] : `${uniqueCustomers.length} customers`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {uniqueVendors.length === 1 ? uniqueVendors[0] : `${uniqueVendors.length} venues`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>
                    {services[0].date} • {services[0].time}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right sm:text-right text-left">
              <div className="text-lg font-bold text-purple-700">GH₵{totalAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-600">
                {confirmedCount}/{services.length} confirmed
              </div>
              <div className="text-xs text-green-600">
                {paidCount}/{services.length} paid
              </div>
            </div>
          </div>

          {/* Group Statistics */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-purple-700">{services.length}</div>
              <div className="text-xs text-gray-600">Bookings</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-green-600">{confirmedCount}</div>
              <div className="text-xs text-gray-600">Confirmed</div>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <div className="text-sm font-bold text-emerald-600">GH₵{paidAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Paid</div>
            </div>
          </div>

          {/* Payment Methods Summary */}
          {services.some((s) => s.paymentMethod) && (
            <div className="bg-white/40 rounded-lg p-2 mb-3">
              <div className="text-xs font-medium text-gray-700 mb-1">Payment Methods:</div>
              <div className="flex flex-wrap gap-1">
                {[...new Set(services.map((s) => s.paymentMethod).filter(Boolean))].map((method) => (
                  <span key={method} className="text-xs bg-white/60 px-2 py-1 rounded-full">
                    {getPaymentMethodIcon(method!)} {method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Expand/Collapse Button */}
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 bg-white/50 hover:bg-white/70 border-purple-300">
                  <Eye className="h-4 w-4 mr-2" />
                  Show Details ({services.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl mx-2 sm:mx-4 max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Multi-Group #{shortGroupId} - Individual Bookings
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    {services.length} bookings • {uniqueCustomers.length} customer
                    {uniqueCustomers.length !== 1 ? "s" : ""} • GH₵{totalAmount.toFixed(2)} total
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto px-1">
                  {/* Group Summary */}
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Group Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Total Bookings:</span>
                        <span className="ml-2 font-medium">{services.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="ml-2 font-medium text-green-600">GH₵{totalAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confirmed:</span>
                        <span className="ml-2 font-medium">
                          {confirmedCount}/{services.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Paid:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {paidCount}/{services.length} (GH₵{paidAmount.toFixed(2)})
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <div className="mb-1">
                        <span className="text-gray-600">Customers:</span>
                        <span className="ml-2 font-medium">{uniqueCustomers.join(", ")}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Venues:</span>
                        <span className="ml-2 font-medium">{uniqueVendors.join(", ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Individual Bookings Grid */}
                  <div>
                    <h4 className="font-semibold mb-3">Individual Bookings</h4>
                    <div className="grid gap-3">
                      {services.map((service, index) => (
                        <Card key={service.serviceId} className="border border-purple-100">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                                  #{index + 1}
                                </span>
                                <div>
                                  <div className="font-medium text-sm">{service.customer}</div>
                                  <div className="text-xs text-gray-600">Booking #{service.id?.slice(-6)}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-green-600">{service.orderValue}</div>
                                {getStatusBadge(service.status)}
                              </div>
                            </div>

                            {/* Payment info */}
                            {(service.paymentMethod || service.paymentStatus) && (
                              <div className="bg-gray-50 rounded p-2 mb-3">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-1">
                                    <span>{getPaymentMethodIcon(service.paymentMethod || "")}</span>
                                    <span>{service.paymentMethod || "Unknown"}</span>
                                  </div>
                                  {service.paymentStatus && getPaymentStatusBadge(service.paymentStatus)}
                                </div>
                              </div>
                            )}

                            {/* Booking Details */}
                            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                              <div>
                                <span className="text-gray-600">Venue:</span>
                                <span className="ml-1 font-medium">{service.vendor}</span>
                              </div>
                              <div>
                                <span className="text-gray-600"> Item Count:</span>
                                <span className="ml-1 font-medium">{service.tableSize || "N/A"} ${Number(service.tableSize) === 1 ? 'item' : 'items'}
</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Day:</span>
                                <span className="ml-1 font-medium">{service.bookingDay || "N/A"}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Time:</span>
                                <span className="ml-1 font-medium">
                                  {service.startTime
                                    ? new Date(service.startTime).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "N/A"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Rider:</span>
                                <span className="ml-1 font-medium">{service.rider}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Distance:</span>
                                <span className="ml-1 font-medium">{service.distance}</span>
                              </div>
                            </div>

                            {/* Booking Description */}
                            {(service.item || service.notes) && (
                              <div className="bg-blue-50 rounded p-2 mb-3">
                                <div className="text-xs">
                                  {service.item && (
                                    <div className="mb-1">
                                      <span className="text-gray-600 font-medium">Item:</span>
                                      <span className="ml-1 text-gray-900">{service.item}</span>
                                    </div>
                                  )}
                                  {service.notes && (
                                    <div>
                                      <span className="text-gray-600 font-medium">Note:</span>
                                      <span className="ml-1 text-gray-900">{service.notes}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Route Information */}
                            <div className="text-xs">
                              <div className="text-gray-600 mb-1">Route:</div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="truncate">{service.pickup}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="truncate">{service.delivery}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    )
  }

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
            {status || "Unknown"}
          </Badge>
        )
    }
  }

  const getPaymentStatusBadge = (paymentStatus: string) => {
    if (!paymentStatus) return null

    return <Badge className={`text-xs ${getPaymentStatusColor(paymentStatus)}`}>{paymentStatus}</Badge>
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
    <div className="container pt-10 sm:pt-10 mx-auto px-2 sm:px-3 lg:px-6 py-2 sm:py-3 lg:py-6 max-w-7xl">
   

      {/* Enhanced Search Bar with Suggestions */}
      <div className="mb-3 sm:mb-4 relative" ref={searchInputRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search services, customers, vendors..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSuggestions(e.target.value.trim().length > 0)
            }}
            onFocus={() => setShowSuggestions(searchQuery.trim().length > 0)}
            className="pl-9 pr-10 rounded-xl text-sm sm:text-base"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => {
                setSearchQuery("")
                setShowSuggestions(false)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
            <div className="py-2">
              <div className="px-3 py-1 text-xs text-gray-500 font-medium border-b">Search Suggestions</div>
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls Toggle Button */}
      <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <Button
          variant="outline"
          onClick={() => setShowControls(!showControls)}
          className="flex items-center gap-2 rounded-xl text-sm w-full sm:w-auto"
        >
          <Filter className="h-4 w-4" />
          <span>Filters & Controls</span>
          {showControls ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {/* Quick Stats Summary when controls are hidden */}
        {!showControls && (
          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 w-full sm:w-auto justify-center sm:justify-end">
            <span>All ({filteredHistory.length})</span>
            <span>•</span>
            <span>Groups ({filteredGroups.size})</span>
            <span>•</span>
            <span>Individual ({filteredStandalone.length})</span>
          </div>
        )}
      </div>

      {/* Collapsible Controls Section */}
      {showControls && (
        <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4 bg-gray-50 rounded-xl p-3 sm:p-4">
          {/* View Mode Toggle */}
          <div className="flex gap-1 sm:gap-2 bg-white p-1 rounded-lg">
            <Button
              variant={viewMode === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("all")}
              className="flex-1 rounded-md text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">All ({filteredHistory.length})</span>
              <span className="sm:hidden">All ({filteredHistory.length})</span>
            </Button>
            <Button
              variant={viewMode === "groups" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("groups")}
              className="flex-1 rounded-md text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Multi-Groups ({filteredGroups.size})</span>
              <span className="sm:hidden">Groups ({filteredGroups.size})</span>
            </Button>
            <Button
              variant={viewMode === "standalone" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("standalone")}
              className="flex-1 rounded-md text-xs sm:text-sm px-2 sm:px-3"
            >
              <span className="hidden sm:inline">Individual ({filteredStandalone.length})</span>
              <span className="sm:hidden">Solo ({filteredStandalone.length})</span>
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3  bg-slate-200 py-2 border border-gray-300 rounded-lg text-sm w-full"
            >
              <option value="all">All Types</option>
              <option value="ORDER">Orders</option>
              <option value="BOOKING">Bookings</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3  bg-slate-200 py-2 border border-gray-300 rounded-lg text-sm w-full"
            >
              <option value="all">All Status</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="px-3  bg-slate-200 py-2 border border-gray-300 rounded-lg text-sm w-full"
            >
              <option value="all">Payment Status</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setTypeFilter("all")
                setStatusFilter("all")
                setPaymentStatusFilter("all")
                setShowSuggestions(false)
              }}
              className="rounded-lg text-sm w-full"
            >
              Clear Filters
            </Button>
          </div>

          {/* Toggle Buttons Row */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 justify-center p-3 h-auto hover:bg-white text-xs"
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
              className="flex-1 justify-center p-3 h-auto hover:bg-white text-xs"
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Actions</span>
              </div>
              {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>

          {/* Enhanced Statistics */}
          <Card>
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                      <p className="text-xs text-gray-600">Total Services</p>
                      <p className="text-xs text-blue-600">
                        {stats.orders} Orders • {stats.bookings} Bookings
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-xl p-3 text-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Package className="h-4 w-4 text-purple-600" />
                      </div>
                      <p className="text-lg font-bold text-purple-600">{stats.multiGroups}</p>
                      <p className="text-xs text-gray-600">Multi-Groups</p>
                    </div>

                    <div className="bg-green-50 rounded-xl p-3 text-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <p className="text-lg font-bold text-green-600">{stats.delivered}</p>
                      <p className="text-xs text-gray-600">Completed</p>
                      <p className="text-xs text-green-600">{stats.successRate}% Success Rate</p>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-3 text-center">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <DollarSign className="h-4 w-4 text-indigo-600" />
                      </div>
                      <p className="text-lg font-bold text-gray-900">GH₵{stats.revenue}</p>
                      <p className="text-xs text-gray-600">Total Revenue</p>
                    </div>

                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                      </div>
                      <p className="text-lg font-bold text-emerald-600">GH₵{stats.paidRevenue}</p>
                      <p className="text-xs text-gray-600">Paid Revenue</p>
                      <p className="text-xs text-emerald-600">{stats.paymentRate}% Paid</p>
                    </div>

                    <div className="bg-yellow-50 rounded-xl p-3 text-center">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <p className="text-lg font-bold text-yellow-600">GH₵{stats.pendingRevenue}</p>
                      <p className="text-xs text-gray-600">Pending Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          {/* Collapsible Actions */}
          <Card>
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
                      <FileText className="h-4 w-4" />
                      <span className="text-xs">Report</span>
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      )}

      {/* Service History List */}
      <div className="space-y-4">
        {/* Multi-Group Bookings Section */}
        {(viewMode === "all" || viewMode === "groups") && filteredGroups.size > 0 && (
          <div className="space-y-3">
            {viewMode === "all" && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Multi-Group Bookings</h3>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                  {filteredGroups.size} group{filteredGroups.size !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
            {Array.from(filteredGroups.entries()).map(([groupId, services]) => (
              <MultiGroupCard key={groupId} groupId={groupId} services={services} />
            ))}
          </div>
        )}

        {/* Individual Services Section */}
        {(viewMode === "all" || viewMode === "standalone") && filteredStandalone.length > 0 && (
          <div className="space-y-3">
            {viewMode === "all" && filteredGroups.size > 0 && (
              <div className="flex items-center gap-2 mb-3 mt-6">
                <h3 className="text-lg font-semibold text-gray-900">Individual Services</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {filteredStandalone.length} service{filteredStandalone.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredStandalone.map((order: ServiceData) => (
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

                    {/* Payment Information Row */}
                    {(order.paymentMethod || order.paymentStatus) && (
                      <div className="bg-gray-50/50 rounded-lg p-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-lg">{getPaymentMethodIcon(order.paymentMethod || "")}</span>
                            <span className="text-gray-600">Payment:</span>
                            <span className="font-medium text-gray-900">{order.paymentMethod || "Unknown"}</span>
                          </div>
                          {order.paymentStatus && getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                      </div>
                    )}

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
                          <Building className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {order.type === "ORDER" ? "Vendor" : "Venue"}
                          </span>
                        </div>
                        <p className="text-gray-900 truncate">{order.vendor}</p>
                      </div>
                    </div>

                    {/* Booking specific information */}
                    {order.type === "BOOKING" && (order.tableSize || order.bookingDay) && (
                      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                        {order.tableSize && (
                          <div>
                            <span className="font-medium text-gray-700"> Item Count: </span>
                            <span className="text-gray-900">{order.tableSize} ${Number(order.tableSize) === 1 ? 'item' : 'items'}
</span>
                          </div>
                        )}
                        {order.bookingDay && (
                          <div>
                            <span className="font-medium text-gray-700">Day: </span>
                            <span className="text-gray-900">{order.bookingDay}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking Description */}
                    {order.type === "BOOKING" && (order.item || order.notes) && (
                      <div className="bg-blue-50/50 rounded-lg p-2 mb-3">
                        <div className="text-xs">
                          {order.item && (
                            <div className="mb-1">
                              <span className="font-medium text-gray-700">Item: </span>
                              <span className="text-gray-900">{order.item}</span>
                            </div>
                          )}
                          {order.notes && (
                            <div>
                              <span className="font-medium text-gray-700">Note: </span>
                              <span className="text-gray-900">{order.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
                      <DialogContent className="sm:max-w-lg mx-2 sm:mx-4 max-h-[90vh] overflow-hidden">
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

                          {/* Booking Description (for bookings only) */}
                          {order.type === "BOOKING" && (order.item || order.notes) && (
                            <div className="bg-amber-50 rounded-lg p-3">
                              <p className="font-medium text-gray-900 mb-2">Booking Description</p>
                              {order.item && (
                                <div className="mb-2">
                                  <span className="text-sm font-medium text-gray-700">Item: </span>
                                  <span className="text-sm text-gray-900">{order.item}</span>
                                </div>
                              )}
                              {order.notes && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">Note: </span>
                                  <span className="text-sm text-gray-900">{order.notes}</span>
                                </div>
                              )}
                            </div>
                          )}

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
              ))}
            </div>
          </div>
        )}

        {/* No Results State */}
        {filteredHistory.length === 0 && (
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
