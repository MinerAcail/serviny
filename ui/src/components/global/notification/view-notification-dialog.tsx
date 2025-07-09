"use client"

import { useState } from "react"
import { Bell, ChevronDown, ChevronRight, User, MapPin, Clock, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

// Mock data
const mockNotifications = {
  deliveryBookings: [
    {
      id: "single-1",
      type: "single",
      pickup: "Downtown Mall",
      dropoff: "Residential Area",
      items: "Electronics Package",
      time: "2 hours ago",
      status: "pending",
      assignedRider: {
        name: "Mike Rodriguez",
        avatar: "/placeholder.svg?height=32&width=32",
        phone: "+1 (555) 123-4567",
      },
    },
    {
      id: "multi-1",
      type: "multi",
      multiBookingId: "MB-001",
      pickup: "Warehouse District",
      totalDeliveries: 3,
      time: "1 hour ago",
      status: "in-progress",
      dropoffs: [
        { location: "Office Complex A", items: "Documents", recipient: "John Doe" },
        { location: "Retail Store B", items: "Inventory", recipient: "Jane Smith" },
        { location: "Home Address C", items: "Personal Package", recipient: "Mike Johnson" },
      ],
      assignedRider: {
        name: "Sarah Chen",
        avatar: "/placeholder.svg?height=32&width=32",
        phone: "+1 (555) 987-6543",
      },
    },
  ],
  cargo: [
    {
      id: "cargo-1",
      type: "single",
      pickup: "Port Authority",
      dropoff: "Industrial Zone",
      items: "Heavy Machinery Parts",
      time: "3 hours ago",
      status: "pending",
      assignedRider: {
        name: "David Wilson",
        avatar: "/placeholder.svg?height=32&width=32",
        phone: "+1 (555) 456-7890",
      },
    },
    {
      id: "cargo-2",
      type: "multi",
      cargoId: "CG-002",
      pickup: "Distribution Center",
      time: "30 minutes ago",
      status: "pending",
      items: [
        { name: "Steel Beams", quantity: "5 units", weight: "2 tons" },
        { name: "Construction Tools", quantity: "1 set", weight: "500 kg" },
        { name: "Safety Equipment", quantity: "10 pieces", weight: "50 kg" },
      ],
      assignedRider: {
        name: "Lisa Thompson",
        avatar: "/placeholder.svg?height=32&width=32",
        phone: "+1 (555) 321-0987",
      },
    },
  ],
  riderRequests: [
    {
      id: "rider-1",
      riderName: "Alex Thompson",
      avatar: "/placeholder.svg?height=40&width=40",
      serviceProvider: "QuickDelivery Co.",
      status: "pending",
      requestTime: "15 minutes ago",
    },
    {
      id: "rider-2",
      riderName: "Sarah Wilson",
      avatar: "/placeholder.svg?height=40&width=40",
      serviceProvider: "FastTrack Logistics",
      status: "pending",
      requestTime: "45 minutes ago",
    },
  ],
  orders: [
    {
      cartId: "CART-001",
      buyerName: "Robert Chen",
      totalAmount: "$245.99",
      orderDate: "Today, 2:30 PM",
      items: [
        { name: "Wireless Headphones", quantity: 2, price: "$89.99" },
        { name: "Phone Case", quantity: 1, price: "$24.99" },
        { name: "Charging Cable", quantity: 3, price: "$15.99" },
      ],
    },
    {
      id: "CART-002",
      cartId: "CART-002",
      buyerName: "Emily Davis",
      totalAmount: "$156.50",
      orderDate: "Today, 1:15 PM",
      items: [
        { name: "Coffee Maker", quantity: 1, price: "$89.99" },
        { name: "Coffee Beans", quantity: 2, price: "$19.99" },
        { name: "Ceramic Mugs", quantity: 4, price: "$12.99" },
      ],
    },
  ],
  completedDeliveries: [
    {
      id: "completed-1",
      type: "Single Booking",
      pickup: "City Center",
      dropoff: "Suburban Mall",
      completedTime: "1 hour ago",
      status: "completed",
    },
    {
      id: "completed-2",
      type: "Cargo Delivery",
      pickup: "Manufacturing Plant",
      dropoff: "Retail Warehouse",
      completedTime: "3 hours ago",
      status: "completed",
    },
  ],
}

export default function NotificationDialog() {
  const [expandedMultiBookings, setExpandedMultiBookings] = useState<string[]>([])
  const [expandedCargo, setExpandedCargo] = useState<string[]>([])

  const toggleMultiBooking = (id: string) => {
    setExpandedMultiBookings((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleCargo = (id: string) => {
    setExpandedCargo((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleAcceptRider = (riderId: string) => {
    console.log(`Accepted rider: ${riderId}`)
  }

  const handleRejectRider = (riderId: string) => {
    console.log(`Rejected rider: ${riderId}`)
  }

  const totalNotifications =
    mockNotifications.deliveryBookings.length +
    mockNotifications.cargo.length +
    mockNotifications.riderRequests.length +
    mockNotifications.orders.length +
    mockNotifications.completedDeliveries.length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative bg-transparent">
          <Bell className="h-4 w-4" />
          {totalNotifications > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {totalNotifications}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[100%] h-[90%] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            <Badge variant="secondary">{totalNotifications}</Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className=" px-6">
          <div className="space-y-4 pb-6">
            {/* Delivery Bookings - Light Green */}
            <div className="space-y-3">
              {mockNotifications.deliveryBookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="border-0 hover:bg-green-50 bg-green-100/bg-emerald-100/50 transition-colors cursor-pointer rounded-2xl"
                >
                  {booking.type === "single" ? (
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-green-900">Single Booking</h3>
                            <Badge variant="secondary" className="bg-green-200 text-green-800 border-0">
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-green-700">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">
                                {booking.pickup} → {booking.dropoff}
                              </span>
                            </div>
                            <p className="text-green-700">{booking.items}</p>
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Clock className="h-3 w-3" />
                              {booking.time}
                            </div>
                          </div>
                          {booking.assignedRider && (
                            <div className="flex items-center gap-3 pt-3 border-t border-green-200">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={booking.assignedRider.avatar || "/placeholder.svg"}
                                  alt={booking.assignedRider.name}
                                />
                                <AvatarFallback className="text-xs bg-green-200 text-green-800">
                                  {booking.assignedRider.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm">
                                <p className="font-medium text-green-900">Assigned: {booking.assignedRider.name}</p>
                                <p className="text-green-600">{booking.assignedRider.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-200">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    <Collapsible
                      open={expandedMultiBookings.includes(booking.id)}
                      onOpenChange={() => toggleMultiBooking(booking.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-6 cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-green-900">Multi-Booking</h3>
                                <Badge variant="secondary" className="bg-green-200 text-green-800 border-0">
                                  ID: {booking.multiBookingId}
                                </Badge>
                                <Badge variant="secondary" className="bg-green-200 text-green-800 border-0">
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-green-700">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-sm">
                                    {booking.pickup} → {booking.totalDeliveries} deliveries
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <Clock className="h-3 w-3" />
                                  {booking.time}
                                </div>
                                {booking.assignedRider && (
                                  <div className="flex items-center gap-2 text-sm text-green-700">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={booking.assignedRider.avatar || "/placeholder.svg"}
                                        alt={booking.assignedRider.name}
                                      />
                                      <AvatarFallback className="text-[10px] bg-green-200 text-green-800">
                                        {booking.assignedRider.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>Rider: {booking.assignedRider.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-200">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                              {expandedMultiBookings.includes(booking.id) ? (
                                <ChevronDown className="h-4 w-4 text-green-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-6 pb-6 space-y-3">
                          <Separator className="bg-green-200" />
                          <h4 className="text-sm font-medium text-green-900">Drop-off Points:</h4>
                          {booking.dropoffs?.map((dropoff, index) => (
                            <div key={index} className="bg-green-100/bg-emerald-100/50 p-4 rounded-xl space-y-2">
                              <div className="flex items-center gap-2 text-sm text-green-800">
                                <MapPin className="h-3 w-3" />
                                {dropoff.location}
                              </div>
                              <p className="text-sm text-green-700">Items: {dropoff.items}</p>
                              <p className="text-sm text-green-700">Recipient: {dropoff.recipient}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </Card>
              ))}

              {/* Cargo - Light Brown */}
              {mockNotifications.cargo.map((cargo) => (
                <Card
                  key={cargo.id}
                  className="border-0 hover:bg-amber-50 bg-amber-100/bg-emerald-100/50 transition-colors cursor-pointer rounded-2xl"
                >
                  {cargo.type === "single" ? (
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-amber-900">Single Cargo</h3>
                            <Badge variant="secondary" className="bg-amber-200 text-amber-800 border-0">
                              {cargo.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-amber-700">
                              <MapPin className="h-4 w-4" />
                              <span className="text-sm">
                                {cargo.pickup} → {cargo.dropoff}
                              </span>
                            </div>
                            <p className="text-amber-700">{cargo.items}</p>
                            <div className="flex items-center gap-1 text-xs text-amber-600">
                              <Clock className="h-3 w-3" />
                              {cargo.time}
                            </div>
                          </div>
                          {cargo.assignedRider && (
                            <div className="flex items-center gap-3 pt-3 border-t border-amber-200">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={cargo.assignedRider.avatar || "/placeholder.svg"}
                                  alt={cargo.assignedRider.name}
                                />
                                <AvatarFallback className="text-xs bg-amber-200 text-amber-800">
                                  {cargo.assignedRider.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="text-sm">
                                <p className="font-medium text-amber-900">Assigned: {cargo.assignedRider.name}</p>
                                <p className="text-amber-600">{cargo.assignedRider.phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="text-amber-600 hover:bg-amber-200">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  ) : (
                    <Collapsible open={expandedCargo.includes(cargo.id)} onOpenChange={() => toggleCargo(cargo.id)}>
                      <CollapsibleTrigger asChild>
                        <CardContent className="p-6 cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg text-amber-900">Multi-Cargo</h3>
                                <Badge variant="secondary" className="bg-amber-200 text-amber-800 border-0">
                                  ID: {cargo.cargoId}
                                </Badge>
                                <Badge variant="secondary" className="bg-amber-200 text-amber-800 border-0">
                                  {cargo.status}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-700">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-sm">
                                    {cargo.pickup} → {cargo.items?.length} items
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <Clock className="h-3 w-3" />
                                  {cargo.time}
                                </div>
                                {cargo.assignedRider && (
                                  <div className="flex items-center gap-2 text-sm text-amber-700">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage
                                        src={cargo.assignedRider.avatar || "/placeholder.svg"}
                                        alt={cargo.assignedRider.name}
                                      />
                                      <AvatarFallback className="text-[10px] bg-amber-200 text-amber-800">
                                        {cargo.assignedRider.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>Rider: {cargo.assignedRider.name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" className="text-amber-600 hover:bg-amber-200">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                              {expandedCargo.includes(cargo.id) ? (
                                <ChevronDown className="h-4 w-4 text-amber-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-6 pb-6 space-y-3">
                          <Separator className="bg-amber-200" />
                          <h4 className="text-sm font-medium text-amber-900">Cargo Items:</h4>
                          <ScrollArea className="max-h-32">
                            {cargo.items?.map((item, index) => (
                              <div key={index} className="bg-amber-100/bg-emerald-100/50 p-4 rounded-xl space-y-2 mb-3">
                                <p className="text-sm font-medium text-amber-900">{item.name}</p>
                                <div className="flex gap-4 text-xs text-amber-700">
                                  <span>Qty: {item.quantity}</span>
                                  <span>Weight: {item.weight}</span>
                                </div>
                              </div>
                            ))}
                          </ScrollArea>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </Card>
              ))}
            </div>

            {/* Rider Requests */}
            <div className="space-y-3">
              {mockNotifications.riderRequests.map((request) => (
                <Card
                  key={request.id}
                  className="border-0 hover:bg-slate-50 bg-slate-100/bg-emerald-100/50 transition-colors cursor-pointer rounded-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.avatar || "/placeholder.svg"} alt={request.riderName} />
                          <AvatarFallback className="bg-slate-200 text-slate-700">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-slate-900">{request.riderName}</h3>
                          <p className="text-slate-700">Wants to join {request.serviceProvider}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-slate-200 text-slate-800 border-0">
                              {request.status}
                            </Badge>
                            <span className="text-xs text-slate-600">{request.requestTime}</span>
                          </div>
                        </div>
                      </div>
                     
                    </div>
                     <div className="flex justify-end gap-3 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRider(request.id)}
                          className="border-slate-300 text-slate-700 hover:bg-slate-100/bg-emerald-100/50"
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRider(request.id)}
                          className="bg-slate-800 hover:bg-slate-700"
                        >
                          Accept
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Orders - Light Blue */}
            <div className="space-y-3">
              {mockNotifications.orders.map((order) => (
                <Card
                  key={order.cartId}
                  className="border-0 hover:bg-blue-50 bg-blue-100/bg-emerald-100/50 transition-colors cursor-pointer rounded-2xl"
                >
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-6 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-blue-900">Order from {order.buyerName}</h3>
                              <Badge variant="secondary" className="bg-blue-200 text-blue-800 border-0">
                                {order.cartId}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-blue-700">{order.orderDate}</p>
                              <p className="text-sm text-blue-600">{order.items.length} items</p>
                                <div className="text-right">
                              <p className="font-semibold text-xl text-blue-900">{order.totalAmount}</p>
                            </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                          
                            <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-200">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-6 pb-6 space-y-3">
                        <Separator className="bg-blue-200" />
                        <ScrollArea className="max-h-40">
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center p-3 bg-blue-100/bg-emerald-100/50 rounded-xl">
                                <div>
                                  <p className="font-medium text-sm text-blue-900">{item.name}</p>
                                  <p className="text-xs text-blue-700">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium text-blue-900">{item.price}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              ))}
            </div>

            {/* Completed Deliveries */}
            <div className="space-y-3">
              {mockNotifications.completedDeliveries.map((delivery) => (
                <Card
                  key={delivery.id}
                  className="border-0 hover:bg-emerald-50 bg-emerald-100/50 transition-colors cursor-pointer rounded-2xl"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-emerald-900">{delivery.type}</h3>
                          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600 border-0">
                            {delivery.status}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-emerald-700">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">
                              {delivery.pickup} → {delivery.dropoff}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <Clock className="h-3 w-3" />
                            {delivery.completedTime}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-emerald-600 hover:bg-emerald-200">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
