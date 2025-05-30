
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, Star, Phone, Package, Navigation, Clock, DollarSign, Bike, Car } from "lucide-react";
import { ProcessedRider } from "./hooks/types";

interface ActiveRidersProps {
  riders: ProcessedRider[];
  onRiderClick: (rider: ProcessedRider) => void;
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
        );
      case "On Delivery":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
            On Delivery
          </Badge>
        );
      case "On Break":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 font-medium">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
            On Break
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getVehicleIcon = (vehicle: string) => {
    return vehicle === "Motorcycle" ? (
      <Car className="h-4 w-4 text-gray-600" />
    ) : (
      <Bike className="h-4 w-4 text-gray-600" />
    );
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case "Available":
        return "from-green-500 to-emerald-600";
      case "On Delivery":
        return "from-blue-500 to-blue-600";
      case "On Break":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatEarnings = (earnings: string) => {
    const amount = parseFloat(earnings.replace('GH₵', ''));
    return amount > 0 ? earnings : 'GH₵0.00';
  };

  const sortedRiders = [...riders].sort((a, b) => {
    // Sort by status priority: On Delivery > Available > On Break
    const statusPriority = { "On Delivery": 3, "Available": 2, "On Break": 1 };
    return statusPriority[b.status] - statusPriority[a.status];
  });

  return (
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
          sortedRiders.map((rider) => (
            <div
              key={rider.id}
              className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 p-5 hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] relative overflow-hidden"
              onClick={() => onRiderClick(rider)}
            >
              {/* Background gradient overlay for status */}
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${getStatusGradient(rider.status)}`}></div>
              
              {/* Header Section */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className={`w-14 h-14 bg-gradient-to-br ${getStatusGradient(rider.status)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-bold text-lg">
                        {rider.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    {/* Status indicator dot */}
                    <div className="absolute -top-1 -right-1">
                      {rider.status === "Available" && (
                        <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                      {rider.status === "On Delivery" && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                      )}
                      {rider.status === "On Break" && (
                        <div className="w-5 h-5 bg-yellow-500 rounded-full border-2 border-white shadow-sm"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-gray-900 text-lg">{rider.name}</h3>
                      {getStatusBadge(rider.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{rider.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{rider.lastActive}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="rounded-full h-10 w-10 p-0 hover:bg-blue-50 group"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${rider.phone}`, '_self');
                    }}
                  >
                    <Phone className="h-4 w-4 text-blue-600 group-hover:text-blue-700" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="rounded-full h-10 w-10 p-0 hover:bg-green-50 group"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add navigation logic here
                    }}
                  >
                    <Navigation className="h-4 w-4 text-green-600 group-hover:text-green-700" />
                  </Button>
                </div>
              </div>

              {/* Stats Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Package className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{rider.orders}</p>
                    <p className="text-xs text-gray-600 font-medium">Orders</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-900">{rider.rating.toFixed(1)}</p>
                    <p className="text-xs text-gray-600 font-medium">Rating</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-green-600">{formatEarnings(rider.earnings)}</p>
                    <p className="text-xs text-gray-600 font-medium">Earnings</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {getVehicleIcon(rider.vehicle)}
                    </div>
                    <p className="text-xs font-bold text-gray-700">{rider.vehicle}</p>
                    <p className="text-xs text-gray-600 font-medium">Vehicle</p>
                  </div>
                </div>
              </div>

              {/* Active Orders Section */}
              {rider.status === "On Delivery" && rider.currentOrders.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-gray-900">
                        {rider.currentOrders.length} Active Order{rider.currentOrders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs px-2 py-1 border-blue-200 text-blue-700">
                      En Route
                    </Badge>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Next delivery:</span>
                      <span className="font-medium">
                        {rider.currentOrders[0]?.order.deliveryAddress.split(',')[0]}...
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span>ETA:</span>
                      <span className="font-medium text-blue-600">
                        {rider.currentOrders[0]?.deliveryMetaData 
                          ? `${Math.round(rider.currentOrders[0].deliveryMetaData.duration / 60)} min`
                          : '~30 min'
                        }
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
                      <span className="text-sm font-medium">Ready for new orders</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}