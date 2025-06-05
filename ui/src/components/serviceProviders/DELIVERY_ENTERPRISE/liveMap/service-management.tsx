"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Package,
  Calendar,
  User,
  Users,
  TrendingUp,
  Filter,
  Phone,
  Navigation,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from "lucide-react"
import type { ServiceData, ProcessedRider } from "./serviceDataAndTypes"
// import UnifiedChatSystem from "@/components/user/chat-system"
// import UnifiedChatSystem from "./chat-system"

interface ServiceManagementProps {
  serviceData: ServiceData[]
  riders: ProcessedRider[]
  stats: {
    totalOrders: number
    totalBookings: number
    totalServiceData: number
  }
  onRiderClick: (rider: ProcessedRider) => void
}

export function ServiceManagement({ serviceData, riders, stats, onRiderClick }: ServiceManagementProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "bookings" | "customers" | "analytics">("orders")
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set(serviceData.map((service) => service.id)))
  const [showChat, setShowChat] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null)

  useEffect(() => {
    setCollapsedCards(new Set(serviceData.map((service) => service.id)))
  }, [serviceData])

  const toggleCardCollapse = (serviceId: string) => {
    setCollapsedCards((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }

  const openChat = (service: ServiceData) => {
    setSelectedService(service)
    setShowChat(true)
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-200px)]">
      {/* Enhanced Tabs - Fixed Header */}
      <div className="flex border-b mb-4 overflow-x-auto bg-white sticky top-0 z-10 px-1 flex-shrink-0">
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "orders"
              ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Package className="h-4 w-4" />
          Orders ({stats.totalOrders})
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "bookings"
              ? "text-purple-600 border-b-2 border-purple-500 bg-purple-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Bookings ({stats.totalBookings})
        </button>
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "customers"
              ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <Users className="h-4 w-4" />
          Customers ({new Set(serviceData.map((s) => s.customer.name)).size})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
            activeTab === "analytics"
              ? "text-green-600 border-b-2 border-green-500 bg-green-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Analytics
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="space-y-4 pb-6 px-1">
            {/* Orders Tab Content */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sticky top-0 bg-white py-3 z-10 border-b border-gray-100">
                  <h3 className="text-lg font-semibold">Active Orders</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input placeholder="Search orders..." className="max-w-xs" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Order Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem>CONFIRMED</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>PREPARING</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>OUT_FOR_DELIVERY</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>DELIVERED</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4">
                  {serviceData.filter((s) => s.type === "ORDER").length > 0 ? (
                    serviceData
                      .filter((s) => s.type === "ORDER")
                      .map((service) => {
                        const isCollapsed = collapsedCards.has(service.id)
                        return (
                          <Card key={service.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="p-4 bg-gradient-to-r from-orange-50 to-white">
                                {/* Enhanced Header with Customer Name */}
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                      <Package className="h-6 w-6 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-lg">
                                          Order #{service.orderData?.orderId.slice(-6)}
                                        </h4>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleCardCollapse(service.id)}
                                          className="h-6 w-6 p-0 hover:bg-orange-100"
                                        >
                                          {isCollapsed ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronUp className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                      <p className="font-medium text-gray-900 mb-1">{service.customer.name}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="bg-orange-50 text-orange-700 border-orange-200"
                                        >
                                          {service.orderData?.status}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {new Date(service.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                      GH₵{service.orderData?.deliveryMetaData?.price || "0"}
                                    </p>
                                    <p className="text-xs text-gray-500">Delivery Fee</p>
                                  </div>
                                </div>

                                {/* Collapsible Content */}
                                {!isCollapsed && (
                                  <>
                                    {/* Customer Information */}
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                      <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Customer Details
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">Name</p>
                                          <p className="font-medium">{service.customer.name}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Phone</p>
                                          <p className="font-medium">{service.customer.number}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-sm text-gray-500">Delivery Address</p>
                                          <p className="font-medium">{service.orderData?.deliveryAddress}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Order Items */}
                                    {service.orderData?.productInfor && (
                                      <div className="bg-white rounded-lg p-4 mb-4">
                                        <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                          <Package className="h-4 w-4" />
                                          Order Items
                                        </h5>
                                        <div className="space-y-2">
                                          {service.orderData.productInfor.map((item, index) => (
                                            <div
                                              key={index}
                                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                            >
                                              <div>
                                                <p className="font-medium">{item.product[0]?.name}</p>
                                                <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                              </div>
                                              <p className="font-medium">GH₵{item.product[0]?.price}</p>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Vendor & Delivery Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-1">Vendor</p>
                                        <p className="font-medium">{service.vendor.name}</p>
                                        <p className="text-xs text-gray-500">{service.vendor.location}</p>
                                      </div>
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-1">Delivery Info</p>
                                        <p className="text-sm">
                                          Distance: {service.orderData?.deliveryMetaData?.distance || "N/A"}km
                                        </p>
                                        <p className="text-sm">
                                          Duration: {service.orderData?.deliveryMetaData?.duration || "N/A"} min
                                        </p>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Footer - Rider Assignment (Always Visible) */}
                                {service.rider && (
                                  <div className="pt-3 border-t flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Navigation className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium">{service.rider.name}</p>
                                        <p className="text-sm text-gray-500">{service.rider.number}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openChat(service)}
                                        className="bg-green-50 hover:bg-green-100 border-green-200"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-1 text-green-600" />
                                        Chat
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`tel:${service.rider?.number}`, "_self")}
                                      >
                                        <Phone className="h-4 w-4 mr-1" />
                                        Call
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const rider = riders.find((r) => r.id === service.rider?.id)
                                          if (rider) {
                                            onRiderClick(rider)
                                          }
                                        }}
                                      >
                                        View Rider
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                  ) : (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h4>
                      <p className="text-gray-500">There are currently no active orders in the system.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bookings Tab Content */}
            {activeTab === "bookings" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sticky top-0 bg-white py-3 z-10 border-b border-gray-100">
                  <h3 className="text-lg font-semibold">Active Bookings</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input placeholder="Search bookings..." className="max-w-xs" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Booking Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuCheckboxItem>Confirmed</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>Pending</DropdownMenuCheckboxItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-4">
                  {serviceData.filter((s) => s.type === "BOOKING").length > 0 ? (
                    serviceData
                      .filter((s) => s.type === "BOOKING")
                      .map((service) => {
                        const isCollapsed = collapsedCards.has(service.id)
                        return (
                          <Card key={service.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-white">
                                {/* Enhanced Header with Customer Name */}
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                      <Calendar className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-lg">
                                          Booking #{service.bookingData?.bookingId.slice(-6)}
                                        </h4>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleCardCollapse(service.id)}
                                          className="h-6 w-6 p-0 hover:bg-purple-100"
                                        >
                                          {isCollapsed ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronUp className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </div>
                                      <p className="font-medium text-gray-900 mb-1">{service.customer.name}</p>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="bg-purple-50 text-purple-700 border-purple-200"
                                        >
                                          {service.bookingData?.isConfirmed ? "Confirmed" : "Pending"}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {new Date(service.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">
                                      GH₵{service.bookingData?.deliveryFee || "0"}
                                    </p>
                                    <p className="text-xs text-gray-500">Service Fee</p>
                                  </div>
                                </div>

                                {/* Collapsible Content */}
                                {!isCollapsed && (
                                  <>
                                    {/* Customer Information */}
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                      <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Customer Details
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">Name</p>
                                          <p className="font-medium">{service.customer.name}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Phone</p>
                                          <p className="font-medium">{service.customer.number}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">User Type</p>
                                          <p className="font-medium">{service.bookingData?.userType || "Standard"}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Table Size</p>
                                          <p className="font-medium">{service.bookingData?.tableSize} people</p>
                                        </div>
                                        <div className="md:col-span-2">
                                          <p className="text-sm text-gray-500">Delivery Address</p>
                                          <p className="font-medium">{service.bookingData?.deliveryAddress}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Booking Details */}
                                    <div className="bg-white rounded-lg p-4 mb-4">
                                      <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Booking Information
                                      </h5>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">Date</p>
                                          <p className="font-medium">{service.bookingData?.day}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Start Time</p>
                                          <p className="font-medium">{service.bookingData?.startTime}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">End Time</p>
                                          <p className="font-medium">{service.bookingData?.endTime}</p>
                                        </div>
                                        {service.bookingData?.item && (
                                          <div className="md:col-span-3">
                                            <p className="text-sm text-gray-500">Special Items/Requirements</p>
                                            <p className="font-medium">{service.bookingData.item}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Vendor & Service Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-1">Venue</p>
                                        <p className="font-medium">{service.vendor.name}</p>
                                        <p className="text-xs text-gray-500">{service.vendor.location}</p>
                                      </div>
                                      <div className="bg-white rounded-lg p-3">
                                        <p className="text-sm text-gray-500 mb-1">Service Info</p>
                                        <p className="text-sm">Distance: {service.bookingData?.distance || "N/A"}</p>
                                        <p className="text-sm">Duration: {service.bookingData?.duration || "N/A"}</p>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Footer - Rider Assignment (Always Visible) */}
                                {service.rider && (
                                  <div className="pt-3 border-t flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Navigation className="h-4 w-4 text-blue-600" />
                                      </div>
                                      <div>
                                        <p className="font-medium">{service.rider.name}</p>
                                        <p className="text-sm text-gray-500">{service.rider.number}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openChat(service)}
                                        className="bg-green-50 hover:bg-green-100 border-green-200"
                                      >
                                        <MessageSquare className="h-4 w-4 mr-1 text-green-600" />
                                        Chat
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`tel:${service.rider?.number}`, "_self")}
                                      >
                                        <Phone className="h-4 w-4 mr-1" />
                                        Call
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const rider = riders.find((r) => r.id === service.rider?.id)
                                          if (rider) {
                                            onRiderClick(rider)
                                          }
                                        }}
                                      >
                                        View Rider
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Active Bookings</h4>
                      <p className="text-gray-500">There are currently no active bookings in the system.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customers Tab Content - Keeping existing content */}
            {activeTab === "customers" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sticky top-0 bg-white py-3 z-10 border-b border-gray-100">
                  <h3 className="text-lg font-semibold">Customer Overview</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Input placeholder="Search customers..." className="max-w-xs" />
                    <Button variant="outline" size="sm">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {Array.from(new Set(serviceData.map((s) => s.customer.name))).map((customerName) => {
                    const customerServices = serviceData.filter((s) => s.customer.name === customerName)
                    const customer = customerServices[0].customer
                    const orders = customerServices.filter((s) => s.type === "ORDER")
                    const bookings = customerServices.filter((s) => s.type === "BOOKING")
                    const totalSpent = customerServices.reduce((total, service) => {
                      if (service.type === "ORDER" && service.orderData?.deliveryMetaData?.price) {
                        return total + service.orderData.deliveryMetaData.price
                      } else if (service.type === "BOOKING" && service.bookingData?.deliveryFee) {
                        return total + Number.parseFloat(service.bookingData.deliveryFee)
                      }
                      return total
                    }, 0)

                    return (
                      <Card key={customerName} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="p-4 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                  <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg">{customer.name}</h4>
                                  <p className="text-sm text-gray-500">{customer.number}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">GH₵{totalSpent.toFixed(2)}</p>
                                <p className="text-xs text-gray-500">Total Spent</p>
                              </div>
                            </div>

                            {/* Customer Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="bg-white rounded-lg p-3 text-center">
                                <p className="text-lg font-bold text-orange-600">{orders.length}</p>
                                <p className="text-xs text-gray-500">Orders</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <p className="text-lg font-bold text-purple-600">{bookings.length}</p>
                                <p className="text-xs text-gray-500">Bookings</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-center">
                                <p className="text-lg font-bold text-green-600">{customerServices.length}</p>
                                <p className="text-xs text-gray-500">Total Services</p>
                              </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-gray-900 mb-3">Recent Activity</h5>
                              <div className="space-y-2 max-h-32 overflow-y-auto">
                                {customerServices.slice(0, 3).map((service, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <div className="flex items-center gap-2">
                                      {service.type === "ORDER" ? (
                                        <Package className="h-4 w-4 text-orange-500" />
                                      ) : (
                                        <Calendar className="h-4 w-4 text-purple-500" />
                                      )}
                                      <div>
                                        <p className="text-sm font-medium">
                                          {service.type === "ORDER" ? "Order" : "Booking"} #
                                          {service.type === "ORDER"
                                            ? service.orderData?.orderId.slice(-6)
                                            : service.bookingData?.bookingId.slice(-6)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(service.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {service.type === "ORDER"
                                        ? service.orderData?.status
                                        : service.bookingData?.isConfirmed
                                          ? "Confirmed"
                                          : "Pending"}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Customer Preferences & Needs */}
                            <div className="bg-white rounded-lg p-4 mb-4">
                              <h5 className="font-medium text-gray-900 mb-3">Customer Insights</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Preferred Service</p>
                                  <p className="font-medium">
                                    {orders.length > bookings.length ? "Food Delivery" : "Event Booking"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Average Order Value</p>
                                  <p className="font-medium">
                                    GH₵
                                    {customerServices.length > 0
                                      ? (totalSpent / customerServices.length).toFixed(2)
                                      : "0"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Most Recent</p>
                                  <p className="font-medium">
                                    {new Date(
                                      Math.max(...customerServices.map((s) => new Date(s.createdAt).getTime())),
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Customer Since</p>
                                  <p className="font-medium">
                                    {new Date(
                                      Math.min(...customerServices.map((s) => new Date(s.createdAt).getTime())),
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(`tel:${customer.number}`, "_self")}
                              >
                                <Phone className="h-4 w-4 mr-1" />
                                Call Customer
                              </Button>
                              <Button variant="outline" size="sm">
                                <User className="h-4 w-4 mr-1" />
                                View Profile
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Analytics Tab Content - Keeping existing content */}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center sticky top-0 bg-white py-3 z-10 border-b border-gray-100 mb-4">
                  <h3 className="text-lg font-semibold">Service Analytics</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Today
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Today</DropdownMenuItem>
                      <DropdownMenuItem>This Week</DropdownMenuItem>
                      <DropdownMenuItem>This Month</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.totalOrders}</p>
                          <p className="text-sm text-gray-500">Total Orders</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-2xl font-bold">{stats.totalBookings}</p>
                          <p className="text-sm text-gray-500">Total Bookings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-2xl font-bold">{new Set(serviceData.map((s) => s.customer.name)).size}</p>
                          <p className="text-sm text-gray-500">Unique Customers</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="text-2xl font-bold">
                            GH₵
                            {serviceData
                              .reduce((total, service) => {
                                if (service.type === "ORDER" && service.orderData?.deliveryMetaData?.price) {
                                  return total + service.orderData.deliveryMetaData.price
                                } else if (service.type === "BOOKING" && service.bookingData?.deliveryFee) {
                                  return total + Number.parseFloat(service.bookingData.deliveryFee)
                                }
                                return total
                              }, 0)
                              .toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">Total Revenue</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Service Distribution */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4">Service Distribution</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-orange-500" />
                          <span>Food Orders</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-orange-500 rounded-full"
                              style={{ width: `${(stats.totalOrders / stats.totalServiceData) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{stats.totalOrders}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>Event Bookings</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-purple-500 rounded-full"
                              style={{ width: `${(stats.totalBookings / stats.totalServiceData) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{stats.totalBookings}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Customers */}
                <Card>
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-4">Top Customers</h4>
                    <div className="space-y-3">
                      {Array.from(new Set(serviceData.map((s) => s.customer.name)))
                        .map((customerName) => {
                          const customerServices = serviceData.filter((s) => s.customer.name === customerName)
                          const totalSpent = customerServices.reduce((total, service) => {
                            if (service.type === "ORDER" && service.orderData?.deliveryMetaData?.price) {
                              return total + service.orderData.deliveryMetaData.price
                            } else if (service.type === "BOOKING" && service.bookingData?.deliveryFee) {
                              return total + Number.parseFloat(service.bookingData.deliveryFee)
                            }
                            return total
                          }, 0)
                          return { name: customerName, services: customerServices.length, spent: totalSpent }
                        })
                        .sort((a, b) => b.spent - a.spent)
                        .slice(0, 5)
                        .map((customer, index) => (
                          <div
                            key={customer.name}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-sm text-gray-500">{customer.services} services</p>
                              </div>
                            </div>
                            <p className="font-bold">GH₵{customer.spent.toFixed(2)}</p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Dialog */}
      <Dialog open={showChat} onOpenChange={setShowChat}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat - {selectedService?.type === "ORDER" ? "Order" : "Booking"} #
              {selectedService?.type === "ORDER"
                ? selectedService?.orderData?.orderId.slice(-6)
                : selectedService?.bookingData?.bookingId.slice(-6)}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 p-6 pt-0">
            {/* <UnifiedChatSystem service={selectedService!} onClose={() => setShowChat(false)} /> */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
