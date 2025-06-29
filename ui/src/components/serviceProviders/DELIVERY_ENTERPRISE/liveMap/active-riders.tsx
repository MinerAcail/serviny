"use client"

import { Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { MapPin, Star, Phone, Package, Navigation, Clock, DollarSign, Bike, Car, Calendar } from "lucide-react"
import type { ProcessedRider } from "./serviceDataAndTypes"

interface ActiveRidersProps {
  riders: ProcessedRider[]
  onRiderClick: (rider: ProcessedRider) => void
}

export function ActiveRiders({ riders, onRiderClick }: ActiveRidersProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Available":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 font-medium text-xs px-1 sm:px-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
            Available
          </Badge>
        )
      case "On Delivery":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium text-xs px-1 sm:px-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
            On Delivery
          </Badge>
        )
      case "On Break":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-medium text-xs px-1 sm:px-2">
            <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1"></div>
            On Break
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="text-xs px-1 sm:px-2">{status}</Badge>
    }
  }
  

  const getVehicleIcon = (vehicle: string) => {
    return vehicle === "Motorcycle" ? (
      <Car className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
    ) : (
      <Bike className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-600" />
    )
  }

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "Available":
        return "from-green-500 to-emerald-600"
      case "On Delivery":
        return "from-blue-500 to-blue-600"
      case "On Break":
        return "from-yellow-500 to-orange-500"
      default:
        return "from-gray-500 to-gray-600"
    }
  }

  const formatEarnings = (earnings: string) => {
    const amount = parseFloat(earnings.replace("GH₵", ""))
    return amount > 0 ? earnings : "GH₵0.00"
  }

  const sortedRiders = [...riders].sort((a, b) => {
    // Sort by status priority: On Delivery > Available > On Break
    const statusPriority = { "On Delivery": 3, Available: 2, "On Break": 1 }
    return statusPriority[b.status] - statusPriority[a.status]
  })

  return (
    <TooltipProvider>
      <ScrollArea className="mt-4 h-full">
        {/* Responsive spacing and padding */}
        <div className="space-y-2 sm:space-y-3 px-1 sm:px-2 pb-4">
          {sortedRiders.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">No riders found</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or check back later</p>
            </div>
          ) : (
            sortedRiders.map((rider, index) => {
              const totalOrders = rider.currentOrders.length
              const totalBookings = rider.currentBookings?.length || 0
              const totalServices = totalOrders + totalBookings
              const isLastItem = index === sortedRiders.length - 1

              return (
                <div
                  key={rider.id}
                  className={`bg-white rounded-lg sm:rounded-xl border border-gray-100 hover:border-gray-200 p-2 sm:p-3 hover:shadow-md transition-all duration-300 cursor-pointer active:scale-[0.98] relative overflow-hidden ${
                    isLastItem ? 'mb-3' : ''
                  }`}
                  onClick={() => onRiderClick(rider)}
                >
                  {/* Header Section - Responsive Design */}
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0 pr-2">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${getStatusGradient(rider.status)} rounded-lg flex items-center justify-center shadow-md`}
                        >
                          <span className="text-white font-bold text-xs sm:text-sm">
                            {rider.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        {/* Status indicator dot - responsive */}
                        <div className="absolute -top-0.5 -right-0.5">
                          {rider.status === "Available" && (
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border border-white shadow-sm"></div>
                          )}
                          {rider.status === "On Delivery" && (
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full border border-white shadow-sm animate-pulse"></div>
                          )}
                          {rider.status === "On Break" && (
                            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-yellow-500 rounded-full border border-white shadow-sm"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm truncate flex-shrink-0 max-w-[120px] sm:max-w-none">{rider.name}</h3>
                          <div className="flex-shrink-0">
                            {getStatusBadge(rider.status)}
                          </div>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            <span className="truncate text-xs" title={rider.location}>
                              {rider.location.split(",")[0]}
                              {rider.location.includes(",") && "..."}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                            <span className="text-xs">{rider.lastActive}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Responsive */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-blue-50 group"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${rider.phone}`, "_self")
                            }}
                          >
                            <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-600 group-hover:text-blue-700" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Call {rider.name}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full h-6 w-6 sm:h-7 sm:w-7 p-0 hover:bg-green-50 group"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add navigation logic here
                            }}
                          >
                            <Navigation className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600 group-hover:text-green-700" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Navigate to {rider.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Responsive Stats Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 sm:p-2.5 mb-2 sm:mb-3">
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                          <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-orange-600" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{totalOrders}</p>
                        <p className="text-xs text-gray-600 font-medium leading-tight">Orders</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                          <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-600" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{totalBookings}</p>
                        <p className="text-xs text-gray-600 font-medium leading-tight">Bookings</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                          <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-yellow-500" />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{rider.rating.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 font-medium leading-tight">Rating</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-0.5 sm:mb-1">
                          <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-green-600" />
                        </div>
                        <p className="text-xs font-bold text-green-600 truncate">
                          {formatEarnings(rider.earnings)}
                        </p>
                        <p className="text-xs text-gray-600 font-medium leading-tight">Earnings</p>
                      </div>
                    </div>
                  </div>

                  {/* Responsive Vehicle Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-1.5 sm:p-2 mb-2 sm:mb-3">
                    <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                      {getVehicleIcon(rider.vehicle)}
                      <span className="text-xs sm:text-sm font-semibold text-gray-700">{rider.vehicle}</span>
                    </div>
                  </div>

                  {/* Active Services Section - Responsive */}
                  {rider.status === "On Delivery" && totalServices > 0 && (
                    <div className="border-t border-gray-200 pt-2 sm:pt-3">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {totalServices} Active Service{totalServices !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs px-1 sm:px-1.5 py-0.5 border-blue-200 text-blue-700">
                          En Route
                        </Badge>
                      </div>

                      {/* Responsive Service breakdown */}
                      <div className="flex gap-1 sm:gap-2 text-xs text-gray-600 mb-1.5 sm:mb-2">
                        {totalOrders > 0 && (
                          <div className="flex-1 flex items-center justify-between bg-orange-50 p-1 sm:p-1.5 rounded">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Package className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-orange-600" />
                              <span className="text-xs">Orders:</span>
                            </div>
                            <span className="font-medium text-orange-700 text-xs">{totalOrders}</span>
                          </div>
                        )}
                        {totalBookings > 0 && (
                          <div className="flex-1 flex items-center justify-between bg-purple-50 p-1 sm:p-1.5 rounded">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <Calendar className="h-2 w-2 sm:h-2.5 sm:w-2.5 text-purple-600" />
                              <span className="text-xs">Bookings:</span>
                            </div>
                            <span className="font-medium text-purple-700 text-xs">{totalBookings}</span>
                          </div>
                        )}
                      </div>

                      {/* Responsive Next delivery info */}
                      <div className="text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs">Next delivery:</span>
                          <span className="font-medium truncate ml-1 sm:ml-2 max-w-[80px] sm:max-w-[100px] text-xs">
                            {rider.currentOrders.length > 0 
                              ? rider.currentOrders[0]?.orderData?.order?.deliveryAddress?.split(",")[0] + "..." 
                              : rider.currentBookings?.[0]?.bookingData?.deliveryAddress?.split(",")[0] + "..."}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs">ETA:</span>
                          <span className="font-medium text-blue-600 text-xs">
                            {rider.currentOrders.length > 0
                              ? rider.currentOrders[0]?.orderData?.deliveryMetaData
                                ? `${Math.round(rider.currentOrders[0].orderData.deliveryMetaData.duration / 60)} min`
                                : "~30 min"
                              : rider.currentBookings?.[0]?.bookingData?.duration || "~30 min"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Status Additional Info - Responsive */}
                  {rider.status === "Available" && (
                    <div className="border-t border-gray-200 pt-2 sm:pt-3">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-1 sm:gap-1.5 text-green-600">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-xs sm:text-sm font-medium">Ready for new services</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>
    </TooltipProvider>
  )
}