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
import { Calendar, Search, Filter, Download, Eye, MapPin, Clock, Phone, Star } from "lucide-react"

export default function History() {
  const historyData = [
    {
      id: "ORD-001",
      date: "2024-01-15",
      time: "14:30",
      customer: "John Doe",
      customerPhone: "+1 234-567-8901",
      vendor: "Pizza Palace",
      rider: "Mike Johnson",
      riderPhone: "+1 234-567-8902",
      pickup: "123 Main St",
      delivery: "456 Oak Ave",
      status: "Delivered",
      priority: "Normal",
      orderValue: "$24.50",
      deliveryTime: "28 min",
      rating: 4.8,
      distance: "2.3 km",
    },
    {
      id: "ORD-002",
      date: "2024-01-15",
      time: "13:45",
      customer: "Sarah Smith",
      customerPhone: "+1 234-567-8903",
      vendor: "Fresh Market",
      rider: "Emma Davis",
      riderPhone: "+1 234-567-8904",
      pickup: "789 Pine St",
      delivery: "321 Elm St",
      status: "Delivered",
      priority: "High",
      orderValue: "$45.80",
      deliveryTime: "32 min",
      rating: 4.9,
      distance: "1.8 km",
    },
    {
      id: "ORD-003",
      date: "2024-01-15",
      time: "12:20",
      customer: "David Wilson",
      customerPhone: "+1 234-567-8905",
      vendor: "Coffee Corner",
      rider: "Tom Wilson",
      riderPhone: "+1 234-567-8906",
      pickup: "555 Cedar Rd",
      delivery: "777 Maple Dr",
      status: "Delivered",
      priority: "Normal",
      orderValue: "$12.30",
      deliveryTime: "15 min",
      rating: 4.7,
      distance: "0.8 km",
    },
    {
      id: "ORD-004",
      date: "2024-01-15",
      time: "11:15",
      customer: "Lisa Brown",
      customerPhone: "+1 234-567-8907",
      vendor: "Burger Barn",
      rider: "Sarah Chen",
      riderPhone: "+1 234-567-8908",
      pickup: "999 Birch Ave",
      delivery: "111 Spruce St",
      status: "Cancelled",
      priority: "Normal",
      orderValue: "$18.90",
      deliveryTime: "-",
      rating: null,
      distance: "2.7 km",
    },
    {
      id: "ORD-005",
      date: "2024-01-14",
      time: "19:45",
      customer: "Alex Rodriguez",
      customerPhone: "+1 234-567-8909",
      vendor: "Pizza Palace",
      rider: "Mike Johnson",
      riderPhone: "+1 234-567-8902",
      pickup: "123 Main St",
      delivery: "888 Willow Ln",
      status: "Delivered",
      priority: "High",
      orderValue: "$31.20",
      deliveryTime: "25 min",
      rating: 5.0,
      distance: "3.2 km",
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return <Badge className="bg-green-100 text-green-700 border-green-200">Delivered</Badge>
      case "Cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-200">Cancelled</Badge>
      case "Refunded":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "High":
        return <Badge className="bg-red-100 text-red-700 border-red-200">High</Badge>
      case "Normal":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Normal</Badge>
      default:
        return <Badge variant="secondary">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Order History</h1>
          <p className="text-gray-600 text-sm md:text-base">Complete history of all orders and deliveries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl border-gray-200">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline" className="rounded-xl border-gray-200">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Search orders..." className="pl-10 border-gray-200 rounded-xl" />
            </div>
            <Button variant="outline" className="rounded-xl border-gray-200">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {historyData.map((order) => (
          <Card key={order.id} className="border-0 shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="font-semibold text-gray-900">{order.id}</span>
                    <div className="flex gap-2">
                      {getStatusBadge(order.status)}
                      {getPriorityBadge(order.priority)}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Customer</p>
                      <p className="text-gray-600">{order.customer}</p>
                      <div className="flex items-center gap-1 text-gray-500 mt-1">
                        <Phone className="h-3 w-3" />
                        {order.customerPhone}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Vendor</p>
                      <p className="text-gray-600">{order.vendor}</p>
                      <p className="text-gray-500 mt-1">Value: {order.orderValue}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Rider</p>
                      <p className="text-gray-600">{order.rider}</p>
                      <div className="flex items-center gap-1 text-gray-500 mt-1">
                        <Phone className="h-3 w-3" />
                        {order.riderPhone}
                      </div>
                    </div>
                  </div>

                  {/* Route and Time */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {order.date} at {order.time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {order.distance} • {order.deliveryTime}
                      </span>
                    </div>
                    {order.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-gray-600">{order.rating}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="rounded-lg">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Order Details - {order.id}</DialogTitle>
                        <DialogDescription>Complete order information and timeline</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order Date</p>
                            <p className="text-sm text-gray-600">{order.date}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order Time</p>
                            <p className="text-sm text-gray-600">{order.time}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Order Value</p>
                            <p className="text-sm text-gray-600">{order.orderValue}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Delivery Time</p>
                            <p className="text-sm text-gray-600">{order.deliveryTime}</p>
                          </div>
                        </div>

                        {/* Customer & Vendor */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">Customer</p>
                            <p className="text-sm text-gray-600">{order.customer}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Phone className="h-3 w-3" />
                              {order.customerPhone}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Vendor</p>
                            <p className="text-sm text-gray-600">{order.vendor}</p>
                          </div>
                        </div>

                        {/* Rider */}
                        <div>
                          <p className="text-sm font-medium text-gray-900">Rider</p>
                          <p className="text-sm text-gray-600">{order.rider}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Phone className="h-3 w-3" />
                            {order.riderPhone}
                          </div>
                        </div>

                        {/* Route */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 mb-2">Route</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">{order.pickup}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-600">{order.delivery}</span>
                            </div>
                            <p className="text-xs text-gray-500 ml-4">Distance: {order.distance}</p>
                          </div>
                        </div>

                        {/* Status and Rating */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            {getStatusBadge(order.status)}
                            {getPriorityBadge(order.priority)}
                          </div>
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Orders</div>
            <p className="text-2xl font-bold text-gray-900">1,247</p>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Delivered</div>
            <p className="text-2xl font-bold text-green-600">1,189</p>
            <p className="text-xs text-gray-500">95.3% success rate</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Total Revenue</div>
            <p className="text-2xl font-bold text-gray-900">$28,450</p>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white rounded-2xl">
          <CardContent className="p-4">
            <div className="text-sm font-medium text-gray-600">Avg Rating</div>
            <p className="text-2xl font-bold text-gray-900">4.8</p>
            <p className="text-xs text-green-600">+0.1 from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
