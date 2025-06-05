import React, { useState } from "react"
import {
  Package,
  Calendar,
  ChefHat,
  MessageSquare,
  Search,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { VendorChatWindow } from "./VendorChatComponents"
import type { ServiceData } from "./types"

// Sample service data - in real app this would come from props or API
const sampleServiceData: ServiceData[] = [
  {
    id: "service-1",
    serviceId: "vendor-001",
    type: "ORDER",
    createdAt: new Date().toISOString(),
    customer: {
      id: "customer-1",
      name: "John Doe",
      number: "+233123456789",
      dpfile: ""
    },
    vendor: {
      id: "vendor-1",
      name: "Tasty Bites Restaurant",
      location: "Accra Mall, Accra",
      coordinates: [-0.187, 5.6037]
    },
    rider: {
      id: "rider-1",
      name: "Michael Asante",
      number: "+233987654321",
      location: "Ring Road, Accra",
      coordinates: [-0.180, 5.600]
    },
    orderData: {
      orderId: "ORD-2024-001234",
      status: "CONFIRMED",
      deliveryAddress: "East Legon, Accra",
      estimatedDeliveryDate: new Date(Date.now() + 30 * 60000).toISOString(),
      serviceFee: "15.50",
      productInfor: [
        {
          product: [{
            id: "prod-1",
            name: "Jollof Rice with Chicken",
            price: "25.00",
            state: "available"
          }],
          quantity: 2
        },
        {
          product: [{
            id: "prod-2", 
            name: "Fried Plantain",
            price: "8.00",
            state: "available"
          }],
          quantity: 1
        }
      ],
      deliveryMetaData: {
        id: "meta-1",
        price: 15.50,
        duration: 25,
        distance: 3.2,
        zone: 1,
        isochroneId: "iso-1"
      },
      order: {
        id: "order-1",
        coordinates: [-0.170, 5.620],
        deliveryAddress: "East Legon, Accra",
        distance: "3.2 km",
        duration: "25 mins"
      }
    }
  },
  {
    id: "service-2", 
    serviceId: "vendor-001",
    type: "BOOKING",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    customer: {
      id: "customer-2",
      name: "Sarah Johnson",
      number: "+233111222333"
    },
    vendor: {
      id: "vendor-1",
      name: "Tasty Bites Restaurant", 
      location: "Accra Mall, Accra",
      coordinates: [-0.187, 5.6037]
    },
    rider: {
      id: "rider-2",
      name: "Kwame Osei",
      number: "+233444555666",
      location: "Osu, Accra"
    },
    bookingData: {
      bookingId: "BKG-2024-005678",
      startTime: "19:00",
      endTime: "21:00", 
      day: "2024-12-15",
      item: "Birthday celebration setup",
      tableSize: 6,
      userType: "premium",
      isConfirmed: true,
      deliveryAddress: "Airport Residential Area, Accra",
      deliveryFee: "20.00",
      distance: "4.1 km",
      duration: "18 mins"
    }
  },
  {
    id: "service-3",
    serviceId: "vendor-001", 
    type: "ORDER",
    createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
    customer: {
      id: "customer-3",
      name: "David Wilson",
      number: "+233777888999"
    },
    vendor: {
      id: "vendor-1",
      name: "Tasty Bites Restaurant",
      location: "Accra Mall, Accra", 
      coordinates: [-0.187, 5.6037]
    },
    orderData: {
      orderId: "ORD-2024-001235",
      status: "PREPARING",
      deliveryAddress: "Cantonments, Accra",
      productInfor: [
        {
          product: [{
            id: "prod-3",
            name: "Grilled Tilapia",
            price: "35.00", 
            state: "available"
          }],
          quantity: 1
        }
      ],
      deliveryMetaData: {
        id: "meta-2",
        price: 12.00,
        duration: 20,
        distance: 2.8,
        zone: 1,
        isochroneId: "iso-2"
      },
      order: {
        id: "order-2",
        coordinates: [-0.165, 5.590],
        deliveryAddress: "Cantonments, Accra",
        distance: "2.8 km",
        duration: "20 mins"
      }
    }
  },
  {
    id: "service-4",
    serviceId: "vendor-001",
    type: "ORDER",
    createdAt: new Date(Date.now() - 60 * 60000).toISOString(),
    customer: {
      id: "customer-4",
      name: "Emma Thompson",
      number: "+233555666777"
    },
    vendor: {
      id: "vendor-1",
      name: "Tasty Bites Restaurant",
      location: "Accra Mall, Accra",
      coordinates: [-0.187, 5.6037]
    },
    rider: {
      id: "rider-3",
      name: "Prince Mensah",
      number: "+233888999000",
      location: "Adabraka, Accra"
    },
    orderData: {
      orderId: "ORD-2024-001236",
      status: "OUT_FOR_DELIVERY",
      deliveryAddress: "Dansoman, Accra",
      productInfor: [
        {
          product: [{
            id: "prod-4",
            name: "Beef Stew with Rice",
            price: "28.00",
            state: "available"
          }],
          quantity: 1
        },
        {
          product: [{
            id: "prod-5",
            name: "Fresh Salad",
            price: "12.00",
            state: "available"
          }],
          quantity: 1
        }
      ],
      deliveryMetaData: {
        id: "meta-3",
        price: 18.00,
        duration: 35,
        distance: 5.1,
        zone: 2,
        isochroneId: "iso-3"
      },
      order: {
        id: "order-3",
        coordinates: [-0.210, 5.580],
        deliveryAddress: "Dansoman, Accra",
        distance: "5.1 km",
        duration: "35 mins"
      }
    }
  },
  {
    id: "service-5",
    serviceId: "vendor-001",
    type: "BOOKING",
    createdAt: new Date(Date.now() - 75 * 60000).toISOString(),
    customer: {
      id: "customer-5",
      name: "Robert Addo",
      number: "+233222333444"
    },
    vendor: {
      id: "vendor-1",
      name: "Tasty Bites Restaurant",
      location: "Accra Mall, Accra",
      coordinates: [-0.187, 5.6037]
    },
    bookingData: {
      bookingId: "BKG-2024-005679",
      startTime: "14:00",
      endTime: "16:00",
      day: "2024-12-16",
      item: "Business lunch meeting",
      tableSize: 8,
      userType: "corporate",
      isConfirmed: false,
      deliveryAddress: "Ridge, Accra",
      deliveryFee: "25.00",
      distance: "3.8 km",
      duration: "22 mins"
    }
  }
]

const VendorChatSystem: React.FC = () => {
  const [serviceData] = useState<ServiceData[]>(sampleServiceData)
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  // Filter services based on search and filters
  const filteredServices = serviceData.filter(service => {
    const matchesSearch = 
      service.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (
        service.type === "ORDER"
          ? (service.orderData && service.orderData.orderId ? service.orderData.orderId : "")
          : (service.bookingData && service.bookingData.bookingId ? service.bookingData.bookingId : "")
      )
        .toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || 
      (service.type === "ORDER" ? service.orderData?.status === statusFilter : 
       service.bookingData?.isConfirmed ? "Confirmed" === statusFilter : "Pending" === statusFilter)
    
    const matchesType = typeFilter === "all" || service.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique statuses for filter
  const availableStatuses = Array.from(new Set([
    ...serviceData.filter(s => s.type === "ORDER").map(s => s.orderData?.status).filter(Boolean),
    ...serviceData.filter(s => s.type === "BOOKING").map(s => s.bookingData?.isConfirmed ? "Confirmed" : "Pending")
  ]))

  // Service stats
  const stats = {
    totalOrders: serviceData.filter(s => s.type === "ORDER").length,
    totalBookings: serviceData.filter(s => s.type === "BOOKING").length,
    activeServices: filteredServices.length,
    confirmedServices: serviceData.filter(s => 
      (s.type === "ORDER" && s.orderData?.status === "CONFIRMED") ||
      (s.type === "BOOKING" && s.bookingData?.isConfirmed)
    ).length,
    preparingOrders: serviceData.filter(s => 
      s.type === "ORDER" && s.orderData?.status === "PREPARING"
    ).length,
    outForDelivery: serviceData.filter(s => 
      s.type === "ORDER" && s.orderData?.status === "OUT_FOR_DELIVERY"
    ).length
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Services List Panel */}
      <div className="w-1/3 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Vendor Chat</h2>
              <p className="text-sm text-gray-600">{stats.activeServices} active services</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-xs text-gray-500">Orders</p>
              <p className="text-sm font-bold text-orange-600">{stats.totalOrders}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-xs text-gray-500">Bookings</p>
              <p className="text-sm font-bold text-purple-600">{stats.totalBookings}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-xs text-gray-500">Preparing</p>
              <p className="text-sm font-bold text-blue-600">{stats.preparingOrders}</p>
            </div>
            <div className="bg-white rounded-lg p-2 text-center shadow-sm">
              <p className="text-xs text-gray-500">Delivery</p>
              <p className="text-sm font-bold text-green-600">{stats.outForDelivery}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Types</option>
                <option value="ORDER">Orders</option>
                <option value="BOOKING">Bookings</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Services List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {filteredServices.map((service) => {
              const isOrder = service.type === "ORDER"
              const serviceId = isOrder ? service.orderData?.orderId : service.bookingData?.bookingId
              const status = isOrder ? service.orderData?.status : service.bookingData?.isConfirmed ? "Confirmed" : "Pending"
              const amount = isOrder ? service.orderData?.deliveryMetaData?.price : service.bookingData?.deliveryFee
              const isSelected = selectedService?.id === service.id

              return (
                <Card 
                  key={service.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-orange-500 shadow-md' : ''}`}
                  onClick={() => setSelectedService(service)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isOrder ? 'bg-orange-100' : 'bg-purple-100'
                        }`}>
                          {isOrder ? (
                            <Package className={`h-5 w-5 ${isOrder ? 'text-orange-600' : 'text-purple-600'}`} />
                          ) : (
                            <Calendar className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            {isOrder ? "Order" : "Booking"} #{serviceId?.slice(-6)}
                          </h3>
                          <p className="text-xs text-gray-600 truncate">{service.customer.name}</p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          status === "CONFIRMED" || status === "Confirmed" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          status === "PREPARING" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          status === "OUT_FOR_DELIVERY" ? "bg-purple-50 text-purple-700 border-purple-200" :
                          status === "DELIVERED" ? "bg-green-50 text-green-700 border-green-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {status}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {/* Order/Booking Details */}
                      {isOrder && service.orderData?.productInfor && (
                        <div className="text-xs text-gray-600">
                          <p className="truncate">
                            {service.orderData.productInfor.length} item(s) • 
                            {service.orderData.productInfor[0]?.product[0]?.name}
                            {service.orderData.productInfor.length > 1 && ` +${service.orderData.productInfor.length - 1} more`}
                          </p>
                        </div>
                      )}

                      {!isOrder && service.bookingData && (
                        <div className="text-xs text-gray-600">
                          <p className="truncate">
                            {service.bookingData.day} • {service.bookingData.startTime} - {service.bookingData.endTime}
                          </p>
                          <p className="truncate">Table for {service.bookingData.tableSize}</p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {Math.floor(Math.random() * 5) + 1}
                            </span>
                          </div>
                          {service.rider && (
                            <div className="flex items-center gap-1">
                              <Truck className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-gray-600">Assigned</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">GH₵{amount}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(service.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filteredServices.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Found</h3>
                <p className="text-gray-500">No services match your current filters.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Panel */}
      <div className="flex-1 flex flex-col">
        {selectedService ? (
          <VendorChatWindow
            service={selectedService}
            onClose={() => setSelectedService(null)}
            currentUserLocation={{ lat: 5.6037, lng: -0.187 }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a Service</h3>
              <p className="text-gray-500 max-w-sm">
                Choose an order or booking from the list to start chatting with customers and riders.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Package className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">{stats.totalOrders} Orders</p>
                  <p className="text-xs text-gray-500">Active food orders</p>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">{stats.totalBookings} Bookings</p>
                  <p className="text-xs text-gray-500">Event reservations</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VendorChatSystem