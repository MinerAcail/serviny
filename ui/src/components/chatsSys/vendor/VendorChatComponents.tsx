import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Send,
  Paperclip,
  ChevronLeft,
  Package,
  Phone,
  CheckCircle,
  AlertCircle,
  Camera,
  Navigation,
  Clock,
  Map,
  Maximize2,
  Minimize2,
  Home,
  Building,
  Truck,
  Star,
  ChefHat,
  Timer,
  X,
  Eye,
  EyeOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { 
  Message, 
  ServiceData, 
  LocationData, 
  VendorMiniMapProps, 
  FullScreenMapModalProps,
  VendorChatWindowProps 
} from "./types"

// Mini Map Component
export const VendorMiniMap: React.FC<VendorMiniMapProps> = ({ 
  riderLocation, 
  customerLocation, 
  vendorLocation, 
  isExpanded, 
  onToggleExpand, 
  isFullScreen = false 
}) => {
  const mapHeight = isFullScreen ? "h-full" : isExpanded ? "h-64" : "h-32"

  return (
    <div className={`bg-gray-100 rounded-lg overflow-hidden transition-all duration-300 ${mapHeight}`}>
      <div className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-yellow-50 to-orange-100">
          <div className="relative h-full">
            {vendorLocation && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                <Building className="h-3 w-3" />
                <span>Your Restaurant</span>
              </div>
            )}

            {customerLocation && (
              <div className="absolute top-4 right-4 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                <Home className="h-3 w-3" />
                <span>Customer</span>
              </div>
            )}

            {riderLocation && (
              <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-full text-xs animate-pulse">
                <Truck className="h-3 w-3" />
                <span>Rider</span>
              </div>
            )}

            <svg className="absolute inset-0 w-full h-full">
              <path
                d="M 100 100 Q 150 50 200 80"
                stroke="#F97316"
                strokeWidth="3"
                strokeDasharray="8,4"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          </div>
        </div>

        {!isFullScreen && (
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6 bg-white/90 hover:bg-white"
              onClick={onToggleExpand}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </div>
        )}

        {isExpanded && !isFullScreen && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg p-3">
            <div className="text-xs space-y-2">
              <div className="flex items-center gap-2">
                <ChefHat className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Delivery Overview</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600">
                <div>
                  <span className="font-medium">Distance:</span> 2.3 km
                </div>
                <div>
                  <span className="font-medium">ETA:</span> 12 mins
                </div>
              </div>
              {riderLocation && <p className="text-gray-600 truncate">Rider: {riderLocation.address}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Full Screen Map Modal Component
export const FullScreenMapModal: React.FC<FullScreenMapModalProps> = ({ 
  isOpen, 
  onClose, 
  riderLocation, 
  customerLocation, 
  vendorLocation, 
  service 
}) => {
  const isOrder = service.type === "ORDER"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-full max-h-full h-screen w-screen p-0 m-0">
        <div className="h-full flex flex-col bg-white">
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-yellow-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Delivery Overview</h3>
                <p className="text-sm text-gray-600">Real-time tracking</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-10 w-10">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1">
            <VendorMiniMap
              riderLocation={riderLocation}
              customerLocation={customerLocation}
              vendorLocation={vendorLocation}
              isExpanded={true}
              onToggleExpand={() => {}}
              isFullScreen={true}
            />
          </div>

          <div className="bg-white border-t p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Your Restaurant</span>
                </div>
                <p className="text-sm text-orange-700">{service.vendor.location}</p>
                <p className="text-xs text-orange-600 mt-1">Pickup Location</p>
              </div>

              {customerLocation && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Customer</span>
                  </div>
                  <p className="text-sm text-blue-700">{service.customer.name}</p>
                  <p className="text-xs text-blue-600 mt-1">{customerLocation.address}</p>
                </div>
              )}

              {riderLocation && service.rider && (
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">Rider</span>
                  </div>
                  <p className="text-sm text-green-700">{service.rider.name}</p>
                  <p className="text-xs text-green-600 mt-1">{riderLocation.address}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Total Distance</p>
                <p className="text-sm font-bold text-gray-800">
                  {isOrder ? service.orderData?.deliveryMetaData?.distance || "2.3" : service.bookingData?.distance || "2.3"} km
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Estimated Time</p>
                <p className="text-sm font-bold text-gray-800">
                  {isOrder ? service.orderData?.deliveryMetaData?.duration || "12" : service.bookingData?.duration || "12"} mins
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Order Value</p>
                <p className="text-sm font-bold text-green-600">
                  GH₵{isOrder ? service.orderData?.deliveryMetaData?.price : service.bookingData?.deliveryFee}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <p className="text-sm font-bold text-orange-600">
                  {isOrder ? service.orderData?.status : service.bookingData?.isConfirmed ? "Confirmed" : "Pending"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${service.customer.number}`, "_self")}>
                <Phone className="h-4 w-4 mr-2" />
                Call Customer
              </Button>
              {service.rider && (
                <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${service.rider?.number}`, "_self")}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Rider
                </Button>
              )}
              <Button variant="outline" className="flex-1">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Individual Chat Component
export const VendorChatWindow: React.FC<VendorChatWindowProps> = ({ 
  service, 
  onClose, 
  currentUserLocation 
}) => {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [orderProgress, setOrderProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState("")
  const [customerLocation, setCustomerLocation] = useState<LocationData | null>(null)
  const [riderLocation, setRiderLocation] = useState<LocationData | null>(null)
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [showFullMap, setShowFullMap] = useState(false)
  const [preparationTime, setPreparationTime] = useState(15)
  const [showHeader, setShowHeader] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const initializeChatForService = useCallback(() => {
    const isOrder = service.type === "ORDER"
    const serviceId = isOrder ? service.orderData?.orderId : service.bookingData?.bookingId
    const status = isOrder ? service.orderData?.status : service.bookingData?.isConfirmed ? "Confirmed" : "Pending"

    setCurrentStatus(status || "")
    setOrderProgress(getProgressFromStatus(status || ""))

    const initialMessages: Message[] = [
      {
        id: "init-1",
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        text: `New ${isOrder ? "order" : "booking"} received: #${serviceId?.slice(-6)} 🍽️`,
        timestamp: new Date(service.createdAt),
        status: "read",
        type: "status_update",
      },
      {
        id: "init-2",
        senderId: service.customer.id || "customer",
        senderName: service.customer.name,
        senderRole: "customer",
        text: `Hello! I just placed ${isOrder ? "an order" : "a booking"} with you. Looking forward to it! 😊`,
        timestamp: new Date(new Date(service.createdAt).getTime() + 2 * 60000),
        status: "read",
        type: "text",
      },
    ]

    if (service.rider) {
      initialMessages.push({
        id: "init-3",
        senderId: service.rider.id,
        senderName: service.rider.name,
        senderRole: "rider",
        text: `Hi! I'm ${service.rider.name}, the assigned ${isOrder ? "delivery rider" : "service coordinator"}. Please let me know when the ${isOrder ? "order" : "booking"} is ready! 🚴‍♂️`,
        timestamp: new Date(new Date(service.createdAt).getTime() + 5 * 60000),
        status: "read",
        type: "text",
      })
    }

    setMessages(initialMessages)
  }, [service])

  const getProgressFromStatus = (status: string): number => {
    const statusMap: Record<string, number> = {
      PENDING: 10,
      CONFIRMED: 25,
      PREPARING: 50,
      OUT_FOR_DELIVERY: 75,
      DELIVERED: 100,
      Pending: 10,
      Confirmed: 25,
    }
    return statusMap[status] || 0
  }

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      PENDING: "bg-yellow-500",
      CONFIRMED: "bg-blue-500",
      PREPARING: "bg-orange-500",
      OUT_FOR_DELIVERY: "bg-purple-500",
      DELIVERED: "bg-green-500",
      Pending: "bg-yellow-500",
      Confirmed: "bg-blue-500",
    }
    return colorMap[status] || "bg-gray-500"
  }

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      senderRole: "vendor",
      text: message,
      timestamp: new Date(),
      status: "sending",
      type: "text",
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")

    setTimeout(() => {
      setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg)))
    }, 1000)
  }

  const updateOrderStatus = (newStatus: string) => {
    const statusMessage: Message = {
      id: `status-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      senderRole: "vendor",
      text: `Order status updated: ${newStatus} ✅`,
      timestamp: new Date(),
      status: "sent",
      type: "status_update",
      metadata: {
        orderStatus: newStatus,
      },
    }
    setMessages((prev) => [...prev, statusMessage])
    setCurrentStatus(newStatus)
    setOrderProgress(getProgressFromStatus(newStatus))
  }

  const notifyPreparationTime = () => {
    const timeMessage: Message = {
      id: `time-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      senderRole: "vendor",
      text: `Your order will be ready in approximately ${preparationTime} minutes! 🍳`,
      timestamp: new Date(),
      status: "sent",
      type: "text",
    }
    setMessages((prev) => [...prev, timeMessage])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  useEffect(() => {
    initializeChatForService()
    setCustomerLocation({
      lat: 5.6037 + 0.01,
      lng: -0.187 + 0.01,
      address: service.orderData?.deliveryAddress || service.bookingData?.deliveryAddress || "Customer location",
    })

    if (service.rider) {
      setRiderLocation({
        lat: 5.6037 + 0.005,
        lng: -0.187 + 0.005,
        address: "Rider location",
      })
    }
  }, [initializeChatForService, service])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const isOrder = service.type === "ORDER"
  const serviceId = isOrder ? service.orderData?.orderId : service.bookingData?.bookingId

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full flex-shrink-0" onClick={onClose}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-yellow-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">
                {isOrder ? "Order" : "Booking"} #{serviceId?.slice(-6)}
              </h3>
              <p className="text-sm text-gray-600 truncate">Customer: {service.customer.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={`text-white text-sm ${getStatusColor(currentStatus)}`}>{currentStatus}</Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setShowHeader(!showHeader)}
            >
              {showHeader ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {showHeader && (
          <div className="px-4 pb-4">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 font-medium">Order Progress</span>
                <span className="font-bold text-orange-600">{orderProgress}%</span>
              </div>
              <Progress value={orderProgress} className="h-2" />
            </div>

            {isOrder && service.orderData?.productInfor && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items
                </h4>
                <div className="bg-white rounded-lg p-3 space-y-2 max-h-24 overflow-y-auto">
                  {service.orderData.productInfor.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{item.product[0]?.name}</span>
                      <span className="text-gray-600">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(customerLocation || riderLocation) && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Map className="h-4 w-4 text-orange-600" />
                    Delivery Overview
                  </span>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowFullMap(true)}>
                    <Navigation className="h-3 w-3 mr-1" />
                    Full View
                  </Button>
                </div>
                <VendorMiniMap
                  riderLocation={riderLocation}
                  customerLocation={customerLocation}
                  vendorLocation={
                    currentUserLocation ? { ...currentUserLocation, address: "Your restaurant" } : undefined
                  }
                  isExpanded={isMapExpanded}
                  onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Revenue</p>
                <p className="text-sm font-bold text-green-600">
                  GH₵{isOrder ? service.orderData?.deliveryMetaData?.price : service.bookingData?.deliveryFee}
                </p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Prep Time</p>
                <p className="text-sm font-bold text-orange-600">{preparationTime} mins</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <p className="text-xs text-gray-500 mb-1">Rating</p>
                <p className="text-sm font-bold text-yellow-600 flex items-center justify-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  4.9
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-1">
            {msg.senderRole === "system" && (
              <div className="flex justify-center">
                <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 max-w-sm">
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-orange-600" />
                    <p className="text-sm text-orange-800 font-medium">{msg.text}</p>
                  </div>
                  <p className="text-xs text-orange-600 mt-1 text-center">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            )}

            {msg.senderRole !== "system" && (
              <div className={`flex ${msg.senderId === "current-user" ? "justify-end" : "justify-start"}`}>
                <div className="flex items-start gap-3 max-w-[85%]">
                  {msg.senderId !== "current-user" && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback
                        className={`text-sm font-medium ${
                          msg.senderRole === "customer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                        }`}
                      >
                        {msg.senderRole === "customer" ? "👤" : "🚴"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="space-y-1 flex-1 min-w-0">
                    {msg.senderId !== "current-user" && (
                      <p className="text-xs text-gray-500 px-1 truncate font-medium">
                        {msg.senderName} • {msg.senderRole === "customer" ? "Customer" : "Rider"}
                      </p>
                    )}
                    <div
                      className={`rounded-2xl p-4 break-words ${
                        msg.senderId === "current-user"
                          ? "bg-orange-500 text-white rounded-br-md"
                          : msg.senderRole === "customer"
                            ? "bg-blue-100 text-blue-900 rounded-bl-md border border-blue-200"
                            : msg.senderRole === "rider"
                              ? "bg-purple-100 text-purple-900 rounded-bl-md border border-purple-200"
                              : "bg-gray-100 text-gray-800 rounded-bl-md"
                      }`}
                    >
                      {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}

                      <div
                        className={`text-xs mt-2 flex items-center ${
                          msg.senderId === "current-user" ? "text-orange-100 justify-end" : "text-gray-500"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                        {msg.senderId === "current-user" && (
                          <div className="ml-2">
                            {msg.status === "sending" && <Clock className="h-3 w-3" />}
                            {msg.status === "sent" && <CheckCircle className="h-3 w-3" />}
                            {msg.status === "delivered" && <CheckCircle className="h-3 w-3 text-orange-200" />}
                            {msg.status === "read" && <CheckCircle className="h-3 w-3 text-orange-300" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {currentStatus !== "DELIVERED" && (
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 text-center">Order Management</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrderStatus("CONFIRMED")}
                      className="h-10"
                      disabled={currentStatus === "CONFIRMED"}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateOrderStatus("PREPARING")}
                      className="h-10"
                      disabled={currentStatus === "PREPARING"}
                    >
                      <ChefHat className="h-4 w-4 mr-2" />
                      Preparing
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreparationTime(Math.max(5, preparationTime - 5))}
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <Button variant="outline" size="sm" onClick={notifyPreparationTime} className="flex-1 h-10">
                      <Timer className="h-4 w-4 mr-2" />
                      Ready in {preparationTime} mins
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreparationTime(preparationTime + 5)}
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateOrderStatus("OUT_FOR_DELIVERY")}
                    className="w-full h-10"
                    disabled={currentStatus === "OUT_FOR_DELIVERY" || !service.rider}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Ready for Pickup
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          <Button variant="outline" size="sm" className="text-xs h-8 flex-shrink-0">
            <Phone className="h-3 w-3 mr-1" />
            Call Customer
          </Button>
          {service.rider && (
            <Button variant="outline" size="sm" className="text-xs h-8 flex-shrink-0">
              <Phone className="h-3 w-3 mr-1" />
              Call Rider
            </Button>
          )}
          <Button variant="outline" size="sm" className="text-xs h-8 flex-shrink-0" onClick={notifyPreparationTime}>
            <Timer className="h-3 w-3 mr-1" />
            Update Time
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8 flex-shrink-0">
            <AlertCircle className="h-3 w-3 mr-1" />
            Report Issue
          </Button>
        </div>

        <div className="flex items-end gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full flex-shrink-0">
            <Camera className="h-5 w-5 text-gray-500" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full flex-shrink-0">
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message customer or rider..."
              className="resize-none pr-12 py-3 min-h-[44px] max-h-32 rounded-2xl border-gray-200 focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
              rows={1}
            />
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className="rounded-full h-10 w-10 bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Full Screen Map Modal */}
      <FullScreenMapModal
        isOpen={showFullMap}
        onClose={() => setShowFullMap(false)}
        riderLocation={riderLocation}
        customerLocation={customerLocation}
        vendorLocation={
          currentUserLocation ? { ...currentUserLocation, address: "Your restaurant" } : undefined
        }
        service={service}
      />
    </div>
  )
}