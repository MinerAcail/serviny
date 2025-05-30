"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  MapPin,
  Clock,
  Phone,
  User,
  CreditCard,
  Truck,
  CheckCircle,
  Star,
  Navigation,
  Package,
  Receipt,
  X,
  Minus,
  Plus,
  Edit3,
  AlertCircle,
} from "lucide-react"

// Types
interface CartItem {
  id: string
  name: string
  description?: string
  price: number
  quantity: number
  image?: string
  category?: string
}

interface DeliveryLocation {
  address: string
  city?: string
  state?: string
  zipCode?: string
  coordinates?: { lat: number; lng: number }
  instructions?: string
}

interface Rider {
  id: string
  name: string
  avatar?: string
  rating: number
  phone: string
  vehicleType: string
  estimatedArrival: string
  isOnline: boolean
}

interface CheckoutData {
  items: CartItem[]
  deliveryLocation: DeliveryLocation
  rider?: Rider
  deliveryFee: number
  serviceFee: number
  tax: number
  discount?: number
  estimatedDeliveryTime: string
  orderNumber?: string
  status?: string
  deliveryDistance?: string
  deliveryDuration?: string
}

interface CheckoutDialogProps {
  isOpen: boolean
  onClose: () => void
  checkoutData: CheckoutData
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onRemoveItem?: (itemId: string) => void
  onEditLocation?: () => void
  onPlaceOrder?: () => void
  isProcessing?: boolean
  mode?: 'checkout' | 'confirmation' | 'review'
  title?: string
  showPaymentMethod?: boolean
  showOrderActions?: boolean
}

export default function CheckoutDialog({
  isOpen,
  onClose,
  checkoutData,
  onUpdateQuantity,
  onRemoveItem,
  onEditLocation,
  onPlaceOrder,
  isProcessing = false,
  mode = 'checkout',
  title,
  showPaymentMethod = true,
  showOrderActions = true,
}: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card")

  const {
    items = [],
    deliveryLocation,
    rider,
    deliveryFee = 0,
    serviceFee = 0,
    tax = 0,
    discount = 0,
    estimatedDeliveryTime,
    orderNumber,
    status,
    deliveryDistance,
    deliveryDuration,
  } = checkoutData

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = Number(subtotal) + Number(deliveryFee)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem?.(itemId)
    } else {
      onUpdateQuantity?.(itemId, newQuantity)
    }
  }

  // Dynamic title based on mode
  const getDialogTitle = () => {
    if (title) return title
    
    switch (mode) {
      case 'confirmation':
        return orderNumber ? `Order #${orderNumber.slice(-8)}` : "Order Confirmed"
      case 'review':
        return orderNumber ? `Order #${orderNumber.slice(-8)}` : "Order Review"
      default:
        return orderNumber ? `Order #${orderNumber.slice(-8)}` : "Checkout"
    }
  }

  const getStatusBadge = () => {
    if (!status) return null
    
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending' },
      'CONFIRMED': { color: 'bg-green-100 text-green-800 border-green-200', label: 'Confirmed' },
      'PROCESSING': { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Processing' },
      'DELIVERED': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Delivered' },
      'CANCELLED': { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled' },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    
    return (
      <Badge className={`${config.color} px-2 py-1 rounded-full text-xs font-medium border`}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl h-[90vh] overflow-hidden rounded-xl p-0 border-0 shadow-xl bg-white flex flex-col">
        <div className="flex flex-col h-full">
          {/* Fixed Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
            <div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {getDialogTitle()}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-0.5">Review your order details</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-6 pr-4">
              {/* Success Alert for confirmation mode */}
              {mode === 'confirmation' && (
                <Alert className="bg-green-50 border-green-200 py-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 text-sm font-medium">
                    Your delivery location has been successfully added to the order!
                  </AlertDescription>
                </Alert>
              )}

              {/* Delivery Distance Info */}
              {(deliveryDistance || deliveryDuration) && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 text-sm">Delivery Route</p>
                      <div className="flex items-center gap-3 text-xs text-blue-700">
                        {deliveryDistance && (
                          <span>Distance: {deliveryDistance}</span>
                        )}
                        {deliveryDuration && (
                          <span>Duration: {deliveryDuration}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="h-3 w-3 text-gray-600" />
                    </div>
                    Order Items ({items.length})
                  </h3>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image || "/placeholder.svg?height=48&width=48"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                        {item.description && (
                          <p className="text-xs text-gray-600 truncate">{item.description}</p>
                        )}
                        {item.category && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-gray-200 text-gray-700 border-0 rounded px-1.5 py-0.5">
                            {item.category}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onUpdateQuantity && mode === 'checkout' && (
                          <div className="flex items-center gap-1 bg-white rounded-lg p-0.5 border border-gray-200">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded hover:bg-gray-100"
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3 text-gray-600" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded hover:bg-gray-100"
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3 text-gray-600" />
                            </Button>
                          </div>
                        )}

                        {mode !== 'checkout' && (
                          <div className="text-center">
                            <span className="text-xs text-gray-500">Qty: {item.quantity}</span>
                          </div>
                        )}

                        <div className="text-right">
                          <p className="font-semibold text-gray-900 text-sm">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-gray-200" />

              {/* Delivery Information */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-gray-600" />
                    </div>
                    Delivery Information
                  </h3>
                  {onEditLocation && mode === 'checkout' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onEditLocation}
                      className="text-xs rounded-lg text-blue-600 hover:bg-blue-50 h-6 px-2"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{deliveryLocation.address}</p>
                    {(deliveryLocation.city || deliveryLocation.state || deliveryLocation.zipCode) && (
                      <p className="text-gray-600 text-xs">
                        {deliveryLocation.city && deliveryLocation.city}{deliveryLocation.city && deliveryLocation.state && ', '}
                        {deliveryLocation.state && deliveryLocation.state} {deliveryLocation.zipCode && deliveryLocation.zipCode}
                      </p>
                    )}
                  </div>

                  {deliveryLocation.instructions && (
                    <div className="p-2 bg-white rounded border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-0.5">Delivery Instructions:</p>
                      <p className="text-xs text-gray-600">{deliveryLocation.instructions}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>Est. {estimatedDeliveryTime}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Truck className="h-3 w-3" />
                      <span>Standard Delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider Information */}
              {rider && (
                <>
                  <Separator className="bg-gray-200" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                      Your Rider
                    </h3>

                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 border border-white">
                            <AvatarImage src={rider.avatar || "/placeholder.svg?height=40&width=40"} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-xs">
                              {rider.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {rider.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-medium text-gray-900 text-sm">{rider.name}</h4>
                            <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-200">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium text-yellow-700">{rider.rating}</span>
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs mb-1">{rider.vehicleType}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Phone className="h-3 w-3" />
                              <span>{rider.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Navigation className="h-3 w-3" />
                              <span>Arrives in {rider.estimatedArrival}</span>
                            </div>
                          </div>
                        </div>

                        <Badge className="bg-green-50 text-green-700 border-green-200 px-2 py-1 rounded-lg text-xs font-medium">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Assigned
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Payment Method */}
              {showPaymentMethod && mode === 'checkout' && (
                <>
                  <Separator className="bg-gray-200" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-3 w-3 text-gray-600" />
                      </div>
                      Payment Method
                    </h3>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          paymentMethod === "card"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => setPaymentMethod("card")}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              paymentMethod === "card" ? "bg-blue-100" : "bg-gray-100"
                            }`}
                          >
                            <CreditCard
                              className={`h-3 w-3 ${paymentMethod === "card" ? "text-blue-600" : "text-gray-600"}`}
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">Card</p>
                            <p className="text-xs text-gray-600">•••• 4242</p>
                          </div>
                        </div>
                      </button>

                      <button
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          paymentMethod === "cash"
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                        onClick={() => setPaymentMethod("cash")}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              paymentMethod === "cash" ? "bg-green-100" : "bg-gray-100"
                            }`}
                          >
                            <span
                              className={`text-sm font-bold ${
                                paymentMethod === "cash" ? "text-green-600" : "text-gray-600"
                              }`}
                            >
                              $
                            </span>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">Cash</p>
                            <p className="text-xs text-gray-600">Pay on delivery</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <Separator className="bg-gray-200" />

              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Order Summary</h3>

                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal ({items.length} items)</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>

                 

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 text-sm font-medium">
                      <span>Discount</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  <Separator className="bg-gray-200" />

                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Add some bottom padding for better scrolling experience */}
              <div className="pb-4" />
            </div>
          </ScrollArea>

          {/* Fixed Footer */}
          {showOrderActions && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-lg h-10 text-sm font-medium border-gray-200 hover:bg-gray-50"
                >
                  {mode === 'confirmation' ? 'Close' : 'Cancel'}
                </Button>
                {mode === 'checkout' && onPlaceOrder && (
                  <Button
                    onClick={onPlaceOrder}
                    disabled={isProcessing}
                    className="flex-1 rounded-lg h-10 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 font-medium text-sm"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      `Place Order • ${formatCurrency(total)}`
                    )}
                  </Button>
                )}
                {mode === 'confirmation' && (
                  <Button
                    onClick={onClose}
                    className="flex-1 rounded-lg h-10 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 font-medium text-sm"
                  >
                    Continue Shopping
                  </Button>
                )}
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                {mode === 'checkout' 
                  ? "By placing this order, you agree to our Terms of Service and Privacy Policy"
                  : "Thank you for your order!"
                }
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}