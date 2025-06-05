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
          <Badge className="bg-green-100 text-green-700 border-green-200 font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
            Available
          </Badge>
        )
      case "On Delivery":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
            On Delivery
          </Badge>
        )
      case "On Break":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-medium">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            On Break
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getVehicleIcon = (vehicle: string) => {
    return vehicle === "Motorcycle" ? (
      <Car className="h-4 w-4 text-gray-600" />
    ) : (
      <Bike className="h-4 w-4 text-gray-600" />
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
      <ScrollArea className="mt-6 h-[calc(70vh-140px)]">
        <div className="space-y-4 pr-4">
          {sortedRiders.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No riders found</h3>
              <p className="text-gray-500">Try adjusting your search or check back later</p>
            </div>
          ) : (
            sortedRiders.map((rider) => {
              const totalOrders = rider.currentOrders.length
              const totalBookings = rider.currentBookings?.length || 0
              const totalServices = totalOrders + totalBookings

              return (
                <div
                  key={rider.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 p-4 md:p-5 hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] relative overflow-hidden"
                  onClick={() => onRiderClick(rider)}
                >
                  {/* Background gradient overlay for status */}
                  <div
                    className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getStatusGradient(rider.status)}`}
                  ></div>

                  {/* Header Section */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div
                          className={`w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br ${getStatusGradient(rider.status)} rounded-xl flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-white font-bold text-sm md:text-lg">
                            {rider.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        {/* Status indicator dot */}
                        <div className="absolute -top-1 -right-1">
                          {rider.status === "Available" && (
                            <div className="w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                          )}
                          {rider.status === "On Delivery" && (
                            <div className="w-4 h-4 md:w-5 md:h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                          )}
                          {rider.status === "On Break" && (
                            <div className="w-4 h-4 md:w-5 md:h-5 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">{rider.name}</h3>
                          {getStatusBadge(rider.status)}
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                            <span className="truncate">{rider.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                            <span>{rider.lastActive}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 md:gap-2 flex-shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-blue-50 group"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`tel:${rider.phone}`, "_self")
                            }}
                          >
                            <Phone className="h-3 w-3 md:h-4 md:w-4 text-blue-600 group-hover:text-blue-700" />
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
                            className="rounded-full h-8 w-8 md:h-10 md:w-10 p-0 hover:bg-green-50 group"
                            onClick={(e) => {
                              e.stopPropagation()
                              // Add navigation logic here
                            }}
                          >
                            <Navigation className="h-3 w-3 md:h-4 md:w-4 text-green-600 group-hover:text-green-700" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Navigate to {rider.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Enhanced Stats Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 md:p-4 mb-4">
                    <div className="grid grid-cols-4 gap-2 md:gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 md:mb-2">
                          <Package className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
                        </div>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{totalOrders}</p>
                        <p className="text-xs text-gray-600 font-medium">Orders</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 md:mb-2">
                          <Calendar className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                        </div>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{totalBookings}</p>
                        <p className="text-xs text-gray-600 font-medium">Bookings</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 md:mb-2">
                          <Star className="h-3 w-3 md:h-4 md:w-4 text-yellow-500" />
                        </div>
                        <p className="text-sm md:text-lg font-bold text-gray-900">{rider.rating.toFixed(1)}</p>
                        <p className="text-xs text-gray-600 font-medium">Rating</p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 mb-1 md:mb-2">
                          <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
                        </div>
                        <p className="text-xs md:text-sm font-bold text-green-600 truncate">
                          {formatEarnings(rider.earnings)}
                        </p>
                        <p className="text-xs text-gray-600 font-medium">Earnings</p>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 md:p-4 mb-4">
                    <div className="flex items-center justify-center gap-2">
                      {getVehicleIcon(rider.vehicle)}
                      <span className="text-sm font-bold text-gray-700">{rider.vehicle}</span>
                    </div>
                  </div>

                  {/* Active Services Section */}
                  {rider.status === "On Delivery" && totalServices > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-semibold text-gray-900">
                            {totalServices} Active Service{totalServices !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs px-2 py-1 border-blue-200 text-blue-700">
                          En Route
                        </Badge>
                      </div>

                      {/* Service breakdown */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        {totalOrders > 0 && (
                          <div className="flex items-center justify-between bg-orange-50 p-2 rounded-lg">
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 text-orange-600" />
                              <span>Orders:</span>
                            </div>
                            <span className="font-medium text-orange-700">{totalOrders}</span>
                          </div>
                        )}
                        {totalBookings > 0 && (
                          <div className="flex items-center justify-between bg-purple-50 p-2 rounded-lg">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-purple-600" />
                              <span>Bookings:</span>
                            </div>
                            <span className="font-medium text-purple-700">{totalBookings}</span>
                          </div>
                        )}
                      </div>

                      {/* Next delivery/appointment info */}
                      <div className="mt-3 text-xs text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Next delivery:</span>
                          <span className="font-medium truncate ml-2 max-w-[120px]">
                            {rider.currentOrders.length > 0 
                              ? rider.currentOrders[0]?.orderData?.order?.deliveryAddress?.split(",")[0] + "..." 
                              : rider.currentBookings?.[0]?.bookingData?.deliveryAddress?.split(",")[0] + "..."}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>ETA:</span>
                          <span className="font-medium text-blue-600">
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

                  {/* Available Status Additional Info */}
                  {rider.status === "Available" && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-2 text-green-600">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium">Ready for new services</span>
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