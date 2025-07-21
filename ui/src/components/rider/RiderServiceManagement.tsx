// RiderServiceManagement.tsx - Updated with payment information

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  Navigation,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  ExternalLink,
  Eye,
  X,
  BookmarkCheck,
  CreditCard,
  Wallet,
  BanknoteIcon,
} from "lucide-react";

// Import types
import {
  RiderServiceData,
  formatServiceSummary,
  getServiceStatusColor,
  getPaymentStatusColor,
  getPaymentMethodIcon,
} from "./riderEntityUtils";
import {
  ServiceItemManagementDialog,
  StatusManagementDialog,
} from "./statusManager";
import { PaymentStatusSection } from "../custom/USER_MAP_WORK/PaymentStatusSection";

interface RiderServiceManagementProps {
  serviceData: RiderServiceData[];
  onItemClick?: (item: RiderServiceData, type: string) => void;
  onViewOnMap?: (item: RiderServiceData, type: string) => void;
  onContactCustomer?: (customer: any) => void;
  onNavigateToLocation?: (coordinates: [number, number], label: string) => void;
  onViewOnLiveMap?: (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => void;
  setshowInfor: (show: boolean) => void;
  showInfor: boolean;
}

const RiderServiceManagement: React.FC<RiderServiceManagementProps> = ({
  serviceData,
  onItemClick,
  onViewOnMap,
  onContactCustomer,
  onNavigateToLocation,
  onViewOnLiveMap,
  showInfor,
  setshowInfor,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");

  // Filter and search services
  const filteredServices = useMemo(() => {
    return serviceData.filter((service) => {
      // Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        service.customer.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        service.vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.type === "ORDER" &&
          service.orderData?.orderId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (service.type === "BOOKING" &&
          service.bookingData?.bookingId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()));

      // Type filter
      const matchesType = typeFilter === "all" || service.type === typeFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (service.type === "ORDER") {
          matchesStatus = service.orderData?.status === statusFilter;
        } else if (service.type === "BOOKING") {
          matchesStatus = service.bookingData?.status === statusFilter;
        }
      }

      // Payment status filter
      let matchesPaymentStatus = true;
      if (paymentStatusFilter !== "all") {
        const paymentStatus =
          service.type === "ORDER"
            ? service.orderData?.paymentStatus
            : service.bookingData?.paymentStatus;
        matchesPaymentStatus =
          paymentStatus?.toUpperCase() === paymentStatusFilter.toUpperCase();
      }

      // Payment method filter
      let matchesPaymentMethod = true;
      if (paymentMethodFilter !== "all") {
        const paymentMethod =
          service.type === "ORDER"
            ? service.orderData?.paymentMethod
            : service.bookingData?.paymentMethod;
        matchesPaymentMethod =
          paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase();
      }

      return (
        matchesSearch &&
        matchesType &&
        matchesStatus &&
        matchesPaymentStatus &&
        matchesPaymentMethod
      );
    });
  }, [
    serviceData,
    searchQuery,
    statusFilter,
    typeFilter,
    paymentStatusFilter,
    paymentMethodFilter,
  ]);

  // Separate orders and bookings
  const orders = filteredServices.filter((s) => s.type === "ORDER");
  const bookings = filteredServices.filter((s) => s.type === "BOOKING");

  // Group bookings by multiGroupId
  const groupedBookings = useMemo(() => {
    const groups = new Map<string, RiderServiceData[]>();
    const standalone: RiderServiceData[] = [];

    bookings.forEach((booking) => {
      const multiGroupId = booking.bookingData?.multiGroupId;
      if (multiGroupId) {
        if (!groups.has(multiGroupId)) {
          groups.set(multiGroupId, []);
        }
        groups.get(multiGroupId)!.push(booking);
      } else {
        standalone.push(booking);
      }
    });

    return { groups, standalone };
  }, [bookings]);

  // Enhanced stats with payment information
  const stats = useMemo(() => {
    const totalEarnings = serviceData.reduce((sum, service) => {
      if (service.type === "ORDER") {
        return sum + (service.orderData?.deliveryMetaData?.price || 0);
      }
      if (service.type === "BOOKING") {
        return sum + parseFloat(service.bookingData?.deliveryFee || "0");
      }
      return sum;
    }, 0);

    const paidServices = serviceData.filter((service) => {
      const paymentStatus =
        service.type === "ORDER"
          ? service.orderData?.paymentStatus
          : service.bookingData?.paymentStatus;
      return (
        paymentStatus?.toUpperCase() === "PAID" ||
        paymentStatus?.toUpperCase() === "COMPLETED"
      );
    });

    const paidEarnings = paidServices.reduce((sum, service) => {
      if (service.type === "ORDER") {
        return sum + (service.orderData?.deliveryMetaData?.price || 0);
      }
      if (service.type === "BOOKING") {
        return sum + parseFloat(service.bookingData?.deliveryFee || "0");
      }
      return sum;
    }, 0);

    return {
      totalOrders: orders.length,
      totalBookings: bookings.length,
      confirmedOrders: orders.filter((o) => o.orderData?.status === "CONFIRMED")
        .length,
      confirmedBookings: bookings.filter(
        (b) => b.bookingData?.status === "CONFIRMED"
      ).length,
      totalEarnings,
      paidEarnings,
      paidServices: paidServices.length,
      pendingPayments: serviceData.filter((service) => {
        const paymentStatus =
          service.type === "ORDER"
            ? service.orderData?.paymentStatus
            : service.bookingData?.paymentStatus;
        return paymentStatus?.toUpperCase() === "PENDING";
      }).length,
      multiGroups: groupedBookings.groups.size,
    };
  }, [orders, bookings, serviceData, groupedBookings]);

  // Get unique payment methods and statuses for filters
  const paymentMethods = useMemo(() => {
    const methods = new Set<string>();
    serviceData.forEach((service) => {
      const method =
        service.type === "ORDER"
          ? service.orderData?.paymentMethod
          : service.bookingData?.paymentMethod;
      if (method) methods.add(method);
    });
    return Array.from(methods);
  }, [serviceData]);

  const paymentStatuses = useMemo(() => {
    const statuses = new Set<string>();
    serviceData.forEach((service) => {
      const status =
        service.type === "ORDER"
          ? service.orderData?.paymentStatus
          : service.bookingData?.paymentStatus;
      if (status) statuses.add(status);
    });
    return Array.from(statuses);
  }, [serviceData]);

  const handleItemClick = (item: RiderServiceData) => {
    onItemClick?.(item, item.type.toLowerCase());
  };

  const handleViewOnMap = (item: RiderServiceData) => {
    onViewOnMap?.(item, item.type.toLowerCase());
  };

  const handleViewOnLiveMap = (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => {
    if (onViewOnLiveMap) {
      let idShort = entityId;
      if (typeof entityId === "string" && entityId.length >= 6) {
        idShort = entityId.slice(-6);
      }
      onViewOnLiveMap(idShort, entityType);
    }
  };

  const handleContactCustomer = (customer: any) => {
    onContactCustomer?.(customer);
  };

  const handleNavigateToLocation = (
    coordinates: [number, number] | undefined,
    label: string
  ) => {
    if (coordinates) {
      onNavigateToLocation?.(coordinates, label);
    }
  };

  // Enhanced Service item component with payment info
  const ServiceItem: React.FC<{
    service: RiderServiceData;
    isGrouped?: boolean;
    groupIndex?: number;
  }> = ({ service, isGrouped = false, groupIndex }) => {
    const isOrder = service.type === "ORDER";
    const statusColor = getServiceStatusColor(service);

    // Payment information
    const paymentStatus = isOrder
      ? service.orderData?.paymentStatus
      : service.bookingData?.paymentStatus;
    const paymentMethod = isOrder
      ? service.orderData?.paymentMethod
      : service.bookingData?.paymentMethod;
    const paymentStatusColorClass = getPaymentStatusColor(paymentStatus || "");
    const paymentMethodIcon = getPaymentMethodIcon(paymentMethod || "");

    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            {isGrouped && (
              <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                #{groupIndex}
              </span>
            )}
            <Badge
              variant={isOrder ? "default" : "secondary"}
              className="text-xs"
            >
              {isOrder ? (
                <>
                  <Package className="h-3 w-3 mr-1" />
                  Order
                </>
              ) : (
                <>
                  <Calendar className="h-3 w-3 mr-1" />
                  Booking
                </>
              )}
            </Badge>
            <span className="text-sm font-bold text-black">
              #
              {isOrder
                ? service.orderData?.orderId?.slice(-6)
                : service.bookingData?.bookingId?.slice(-6)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {service.bookingData?.cargoId ? (
              <Badge
                // variant={isOrder ? "default" : "secondary"}
                className="text-xs"
              >
                <>
                  <Package className="h-3 w-3 mr-1" />
                  CARGO
                </>
              </Badge>
            ) : (
              <>
                <span className="text-sm font-bold text-green-600">
                  {isOrder
                    ? `GH₵${service.orderData?.deliveryMetaData?.price || 0}`
                    : `GH₵${service.bookingData?.deliveryFee || 0}`}
                </span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
              </>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-black">
              {service.customer.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleContactCustomer(service.customer)}
              className="h-6 w-6 p-0 hover:bg-blue-100"
            >
              <Phone className="h-3 w-3 text-blue-600" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">{service.vendor.name}</span>
          </div>

          {/* Payment Information Section */}
          {service.bookingData?.cargoId ? (
            <PaymentStatusSection
              selectedItem={service}
              // paymentStatus={paymentStatus}
              onPayNow={() => {}}
            />
          ) : (
            <div className="bg-gray-50/50 rounded-lg p-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{paymentMethodIcon}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {paymentMethod || "Unknown Method"}
                  </span>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColorClass}`}
                >
                  {paymentStatus || "Unknown"}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isOrder
                  ? service.orderData?.status === "CONFIRMED"
                    ? "bg-green-100 text-green-700"
                    : service.orderData?.status === "PREPARING"
                    ? "bg-yellow-100 text-yellow-700"
                    : service.orderData?.status === "OUT_FOR_DELIVERY"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
                  : service.bookingData?.status === "CONFIRMED"
                  ? "bg-green-100 text-green-700"
                  : "bg-orange-100 text-orange-700"
              }`}
            >
              {isOrder
                ? service.orderData?.status
                : service.bookingData?.status || "Pending"}
            </div>
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">
              {new Date(service.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Order specific details */}
          {isOrder && service.orderData && (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-600">Delivery Address:</div>
                  <div className="text-sm text-black">
                    {service.orderData.deliveryAddress}
                  </div>
                </div>
                {service.orderData.order?.coordinates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleNavigateToLocation(
                        service.orderData!.order!.coordinates,
                        `Order #${service.orderData!.orderId.slice(-6)} - ${
                          service.customer.name
                        }`
                      )
                    }
                    className="h-6 w-6 p-0 hover:bg-green-100"
                  >
                    <Navigation className="h-3 w-3 text-green-600" />
                  </Button>
                )}
              </div>

              {service.orderData.deliveryMetaData && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Distance: </span>
                    <span className="font-medium">
                      {service.orderData.deliveryMetaData.distance}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration: </span>
                    <span className="font-medium">
                      {service.orderData.deliveryMetaData.duration}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Booking specific details */}
          {!isOrder && service.bookingData && (
            <div className="space-y-1">
              {service.bookingData.multiGroupId && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Multi-Group #{service.bookingData.multiGroupId.slice(-6)}
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-600">Pickup:</div>
                  <div className="text-sm text-black">
                    {service.bookingData.pickUpAddress}
                  </div>
                </div>
                {/* {service.bookingData.pickupLocation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleNavigateToLocation(
                        service.bookingData!.pickupLocation!,
                        `Pickup - Booking #${service.bookingData!.bookingId.slice(
                          -6
                        )}`
                      )
                    }
                    className="h-6 w-6 p-0 hover:bg-purple-100"
                  >
                    <Navigation className="h-3 w-3 text-purple-600" />
                  </Button>
                )} */}
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-indigo-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-xs text-gray-600">Delivery:</div>
                  <div className="text-sm text-black">
                    {service.bookingData.deliveryAddress}
                  </div>
                </div>
                {/* {service.bookingData.dropoffLocation && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleNavigateToLocation(
                        service.bookingData!.dropoffLocation!,
                        `Delivery - Booking #${service.bookingData!.bookingId.slice(
                          -6
                        )}`
                      )
                    }
                    className="h-6 w-6 p-0 hover:bg-indigo-100"
                  >
                    <Navigation className="h-3 w-3 text-indigo-600" />
                  </Button>
                )} */}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  {/* <span className="text-gray-600"> Item Count: </span> */}
                  <span className="font-medium">
                    {service.bookingData.tableSize}{" "}
                    {Number(service.bookingData.tableSize) === 1
                      ? "item"
                      : "items"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Day: </span>
                  <span className="font-medium">{service.bookingData.day}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  {/* <span className="text-gray-600"> Item Count: </span> */}
                  <span className="font-medium">
                    {service.bookingData.item}
                  </span>
                </div>
                <div>
                  {/* <span className="text-gray-600"> Item Count: </span> */}
                  <span className="font-medium">
                    {/* {service.bookingData.notes}  */}
                  </span>
                </div>
              </div>
              {service.bookingData.startTime && (
                <div className="text-xs">
                  <span className="text-gray-600">Time: </span>
                  <span className="font-medium">
                    {new Date(
                      service.bookingData.startTime
                    ).toLocaleTimeString()}{" "}
                    -{" "}
                    {service.bookingData.endTime
                      ? new Date(
                          service.bookingData.endTime
                        ).toLocaleTimeString()
                      : "N/A"}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => handleItemClick(service)}
            className="flex-1 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Details
          </Button> */}
          <ServiceItemManagementDialog service={service} />
          <StatusManagementDialog
            service={service}
            onStatusUpdate={{}}
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 border-white/20 rounded-xl"
              >
                <BookmarkCheck className="h-4 w-4" />
                Status
              </Button>
            }
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleViewOnMap(service);
              handleViewOnLiveMap(
                (service.bookingData?.bookingId ||
                  service.orderData?.orderId) ??
                  "",
                service?.type?.toLowerCase() as
                  | "order"
                  | "booking"
                  | "multigroup"
                  | "customer"
                  | "vendor"
              );
            }}
            className="flex-1 text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            View Map
          </Button>
        </div>
      </div>
    );
  };

  // Enhanced Multi-group component with payment info
  const MultiGroupBookings: React.FC<{
    groupId: string;
    bookings: RiderServiceData[];
  }> = ({ groupId, bookings }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const shortGroupId = groupId.slice(-6);
    const uniqueCustomers = [...new Set(bookings.map((b) => b.customer.name))];

    const totalFee = bookings.reduce(
      (sum, b) => sum + parseFloat(b.bookingData?.deliveryFee || "0"),
      0
    );

    const confirmedCount = bookings.filter(
      (b) => b.bookingData?.status === "CONFIRMED"
    ).length;

    const paidCount = bookings.filter(
      (b) =>
        b.bookingData?.paymentStatus?.toUpperCase() === "PAID" ||
        b.bookingData?.paymentStatus?.toUpperCase() === "COMPLETED"
    ).length;

    const paidAmount = bookings
      .filter(
        (b) =>
          b.bookingData?.paymentStatus?.toUpperCase() === "PAID" ||
          b.bookingData?.paymentStatus?.toUpperCase() === "COMPLETED"
      )
      .reduce(
        (sum, b) => sum + parseFloat(b.bookingData?.deliveryFee || "0"),
        0
      );

    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-purple-600 text-white">
              Multi-Group #{shortGroupId}
            </Badge>
            <span className="text-sm font-bold text-purple-800">
              {bookings.length} bookings
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-green-600">
              GH₵{totalFee.toFixed(2)}
            </div>
            <div className="text-xs text-gray-600">
              {confirmedCount}/{bookings.length} confirmed
            </div>
            <div className="text-xs text-green-600">
              {paidCount}/{bookings.length} paid (GH₵{paidAmount.toFixed(2)})
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">
              {uniqueCustomers.length === 1
                ? uniqueCustomers[0]
                : `${uniqueCustomers.length} customers`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-gray-700">
              {[...new Set(bookings.map((b) => b.vendor.name))].join(", ")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="text-xs text-gray-600">
              Created: {new Date(bookings[0].createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Payment Summary */}
          <div className="bg-white/20 rounded-lg p-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="font-bold text-green-600">{paidCount}</div>
                <div className="text-gray-600">Paid</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-yellow-600">
                  {
                    bookings.filter(
                      (b) =>
                        b.bookingData?.paymentStatus?.toUpperCase() ===
                        "PENDING"
                    ).length
                  }
                </div>
                <div className="text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-red-600">
                  {
                    bookings.filter(
                      (b) =>
                        b.bookingData?.paymentStatus?.toUpperCase() ===
                          "FAILED" ||
                        b.bookingData?.paymentStatus?.toUpperCase() ===
                          "DECLINED"
                    ).length
                  }
                </div>
                <div className="text-gray-600">Failed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 text-xs"
          >
            {isExpanded ? "Hide" : "Show"} Details ({bookings.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              bookings.forEach((b) => handleViewOnMap(b));
              handleViewOnLiveMap(shortGroupId ?? "", "booking");
            }}
            className="text-xs"
          >
            <MapPin className="h-3 w-3 mr-1" />
            View All
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-6 pt-3 border-t border-purple-200">
            {bookings.map((booking, index) => (
              <ServiceItem
                key={booking.id}
                service={booking}
                isGrouped={true}
                groupIndex={index + 1}
              />
            ))}
            <div className="h-6 bg-red-800" />{" "}
            {/* Add down space to the last element */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced header with payment stats */}
      {showInfor && (
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats.totalOrders}
              </div>
              <div className="text-xs text-gray-600">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalBookings}
              </div>
              <div className="text-xs text-gray-600">Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.multiGroups}
              </div>
              <div className="text-xs text-gray-600">Multi-Groups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                GH₵{stats.totalEarnings.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Total Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                GH₵{stats.paidEarnings.toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">Paid Earnings</div>
            </div>
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-lg font-bold text-green-700">
                    {stats.paidServices}
                  </div>
                  <div className="text-xs text-green-600">Paid Services</div>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="text-lg font-bold text-yellow-700">
                    {stats.pendingPayments}
                  </div>
                  <div className="text-xs text-yellow-600">
                    Pending Payments
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-lg font-bold text-blue-700">
                    {stats.confirmedOrders + stats.confirmedBookings}
                  </div>
                  <div className="text-xs text-blue-600">Confirmed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced search and filters */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Types</option>
                <option value="ORDER">Orders</option>
                <option value="BOOKING">Bookings</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PREPARING">Preparing</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="PENDING">Pending</option>
              </select>

              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Payment Status</option>
                {paymentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">Payment Method</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery ||
            statusFilter !== "all" ||
            typeFilter !== "all" ||
            paymentStatusFilter !== "all" ||
            paymentMethodFilter !== "all") && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">
                Found {filteredServices.length} result
                {filteredServices.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setPaymentStatusFilter("all");
                  setPaymentMethodFilter("all");
                }}
                className="h-6 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                All ({filteredServices.length})
              </TabsTrigger>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="bookings">
                Bookings ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="groups">
                Groups ({stats.multiGroups})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-4">
              {filteredServices.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No services found</p>
                  <p className="text-xs text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-14">
                  {filteredServices.map((service, idx) => (
                    <React.Fragment key={service.id}>
                      <ServiceItem service={service} />
                      {idx === filteredServices.length - 1 && (
                        <div className="h-6 bg-red-800" /> // Add down space to the last element
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="orders" className="space-y-4 mt-4">
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No orders found</p>
                  <p className="text-xs text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order, idx) => (
                    <React.Fragment key={order.id}>
                      <ServiceItem key={order.id} service={order} />
                      {idx === orders.length - 1 && (
                        <div className="h-6 bg-red-800" /> // Add down space to the last element
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="space-y-4 mt-4">
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">No bookings found</p>
                  <p className="text-xs text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* {groupedBookings.standalone.map((booking) => (
                    <ServiceItem key={booking.id} service={booking} />
                  ))} */}
                  {bookings.map((booking, idx) => (
                    <React.Fragment key={booking.id}>
                      <ServiceItem key={booking.id} service={booking} />
                      {idx === bookings.length - 1 && (
                        <div className="h-6 bg-red-800" /> // Add down space to the last element
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="space-y-4 mt-4">
              {groupedBookings.groups.size === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    No multi-group bookings found
                  </p>
                  <p className="text-xs text-gray-500">
                    Try adjusting your search or filter criteria
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* {Array.from(groupedBookings.groups.entries()).map(
                    ([groupId, bookings]) => (
                      <MultiGroupBookings
                        key={groupId}
                        groupId={groupId}
                        bookings={bookings}
                      />
                    )
                  )} */}
                  {/* Add down space to the last element */}
                  {Array.from(groupedBookings.groups.entries()).map(
                    ([groupId, bookings]) => (
                      <React.Fragment key={groupId}>
                        <MultiGroupBookings
                          groupId={groupId}
                          bookings={bookings}
                        />
                        {Array.from(groupedBookings.groups.entries()).length ===
                        1 ? (
                          <div className="h-6 bg-red-800" />
                        ) : null}
                      </React.Fragment>
                    )
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default RiderServiceManagement;
