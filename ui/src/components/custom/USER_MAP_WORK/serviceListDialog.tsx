"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Package,
  Calendar,
  MapPin,
  Clock,
  Eye,
  Search,
  RefreshCw,
  Phone,
  ChevronRight,
  Filter,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import moment from "moment";
import { ServiceData } from "./types";
import { PaymentStatusSection } from "./PaymentStatusSection";
import { formatPrice } from "@/components/global/formatPrice";
// import { PaymentStatusSection } from "./viewService"
interface ServiceStats {
  totalOrders: number;
  totalBookings: number;
  activeOrders: number;
  confirmedBookings: number;
}

type ActiveTab = "all" | "orders" | "bookings";
type SortBy = "date" | "status" | "type";

interface ServiceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortBy: SortBy;
  setSortBy: (sort: SortBy) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  serviceData: ServiceData[];
  stats: ServiceStats;
  handleViewAll: () => void;
  handleRefresh: () => void;
  loading: boolean;
  error: any;
  filteredData: ServiceData[];
  selectedItem: ServiceData | null;
  handleItemClick: (item: ServiceData) => void;
  handleJustPaymentItemClick?: (item: ServiceData) => void;
  getStatusBadge: (item: ServiceData) => React.ReactNode;
  handleUpdateStatus: (status: string) => Promise<void>;
  isUpdatingStatus: boolean;
  paymentStatus: any;
  paymentLoading: boolean;
  handleOpenStatusDialog: () => void;
}

// Enhanced ServiceCard component
function ServiceCard({
  item,
  onClick,
  isSelected,
  getStatusBadge,
  handleOpenStatusDialog,
  isUpdatingStatus,
  paymentStatus,
  paymentLoading,
  handleJustPaymentItemClick,
  selectedItem
}: {
  item: ServiceData;
  onClick: () => void;
  isSelected: boolean;
  getStatusBadge: (item: ServiceData) => React.ReactNode;
  handleOpenStatusDialog?: () => void;
  isUpdatingStatus?: boolean;
  paymentStatus?: any;
  paymentLoading?: boolean;
  handleJustPaymentItemClick?: (item: ServiceData) => void;
  selectedItem:ServiceData | null
}) {
  const [IsExpandable, setIsExpandable] = useState(isSelected);

  useEffect(() => {
    setIsExpandable(isSelected);
  }, [isSelected]);

  // Helper function to format date and time
  const formatDateTime = (dateString: string) => {
    const date = moment(dateString);
    return date.isValid() ? date.format("MMM D, h:mm A") : "Invalid Date";
  };

  // Helper function to format time only
  const formatTime = (dateString: string) => {
    const date = moment(dateString);
    return date.isValid() ? date.format("h:mm A") : "N/A";
  };

  // Helper function to format date only
  const formatDate = (dateString: string) => {
    const date = moment(dateString);
    return date.isValid() ? date.format("dddd, MMMM D, YYYY") : "N/A";
  };

  // Helper function to format date and time range
  const formatDateTimeRange = (startTime: string, endTime: string) => {
    const startMoment = moment(startTime);
    const endMoment = moment(endTime);

    if (!startMoment.isValid() || !endMoment.isValid()) {
      return {
        date: "N/A",
        time: "N/A",
      };
    }

    // Check if they're on the same day
    const isSameDay = startMoment.isSame(endMoment, "day");

    if (isSameDay) {
      // Same day: show date once, then time range
      return {
        date: startMoment.format("ddd, MMM D"),
        time: `${startMoment.format("h:mm A")} - ${endMoment.format("h:mm A")}`,
      };
    } else {
      // Different days: show full date-time for both
      return {
        date: "Multi-day booking",
        time: `${startMoment.format("ddd, MMM D, h:mm A")} - ${endMoment.format(
          "ddd, MMM D, h:mm A"
        )}`,
      };
    }
  };
// Calculates the total price of all products in the order
const calculateSelectedItemTotalPrice = () => {
  if (!item || item.type !== "ORDER" || !item.orderData) return 0;

  const orderData = item.orderData;
  if (!orderData.productInfor) return 0;

  return orderData.productInfor.reduce((total, item) => {
    const productTotal = item.product.reduce((sum, product) => {
      const price = typeof product.price === "string"
        ? parseFloat(product.price)
        : product.price ?? 0;

      return sum + price;
    }, 0);

    return total + productTotal * item.quantity;
  }, 0);
};
const calculateSelectedItemsWithdeliveryPrice = () => {
  if (!item || item.type !== "ORDER" || !item.orderData) return 0;

  const orderData = item.orderData;
  if (!orderData.productInfor) return 0;

return parseFloat(
  (
    Number(calculateSelectedItemTotalPrice()) +
    Number(orderData.serviceFee || 0)
  ).toFixed(2)
);


};

// Calculates total quantity of items in the order
const calculateSelectedItemItemsCount = () => {
  if (!item || item.type !== "ORDER" || !item.orderData) return 0;

  const orderData = item.orderData;
  if (!orderData.productInfor) return 0;

  return orderData.productInfor.reduce((count, item) => {
    return count + item.quantity;
  }, 0);
};
  return (
    <div
      className={`backdrop-blur-xl bg-white/60 rounded-2xl border cursor-pointer transition-all duration-300 hover:shadow-xl hover:bg-white/70 hover:scale-[1.02] ${
        IsExpandable
          ? "border-blue-500/50 shadow-xl bg-blue-50/40 scale-[1.02]"
          : "border-white/40 hover:border-white/60"
      }`}
      onClick={() => {
        onClick();
        setIsExpandable(!IsExpandable);
      }}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center backdrop-blur-xl shadow-lg ${
                item.type === "ORDER" ? "bg-orange-100/60" : "bg-purple-100/60"
              }`}
            >
              {item.type === "ORDER" ? (
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
              ) : (
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                {item.type === "ORDER" ? "Order" : "Booking"} #
                {item.type === "ORDER"
                  ? item.orderData?.orderId?.slice(-6) || "N/A"
                  : item.bookingData?.bookingId?.slice(-6) || "N/A"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">
                {item.vendor.name}
              </p>
            </div>
          </div>
          <div
            onClick={(e) => {
              e.stopPropagation();
              setIsExpandable(!IsExpandable);
              if (handleJustPaymentItemClick) {
                handleJustPaymentItemClick(item);
              }
            }}
            className="flex items-center gap-2 flex-shrink-0 cursor-pointer"
          >
            {getStatusBadge(item)}
            <ChevronRight
              className={`h-4 w-4 transition-transform duration-200 ${
                IsExpandable ? "rotate-90" : ""
              } text-gray-400`}
            />
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 truncate">
                 {item.type === "ORDER" ? (
                                <>{item.vendor.location}</>

              ) : (
                <>{item.bookingData?.deliveryAddress}</>
                )}
              
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600">
              {formatDateTime(item.createdAt)}
            </span>
          </div>
        </div>

        {/* Expandable Details */}
        <Collapsible open={IsExpandable}>
          <CollapsibleContent className="space-y-3">
            {/* Order specific details */}
            {item.type === "ORDER" && item.orderData && (
              <div className="backdrop-blur-xl bg-orange-50/60 rounded-xl p-3 border border-orange-200/40">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">
                  Order Details
                </h4>
                <div className="text-xs sm:text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {item.orderData.status || "N/A"}
                      </span>
                      {handleOpenStatusDialog && isSelected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStatusDialog();
                          }}
                          disabled={isUpdatingStatus}
                          className="h-6 px-2 text-xs backdrop-blur-xl bg-white/20 hover:bg-white/30 border-white/30"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Update"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p>
                    <span className="text-gray-500">From:</span>{" "}
                    <span className="font-medium">
                      {item.vendor.location || "N/A"}
                    </span>
                  </p>
                   <p>
                    <span className="text-gray-500">To:</span>{" "}
                    <span className="font-medium">
                      {item.orderData.deliveryAddress || "N/A"}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-500"> total fee:</span>{" "}
                    <span className="font-medium text-green-600">
                      {formatPrice(calculateSelectedItemsWithdeliveryPrice()) || "0"}
                    </span>
                  </p>
                    <p>
                    <span className="text-gray-500">Product Fee:</span>{" "}
                    <span className="font-light text-green-500">
                      {formatPrice(calculateSelectedItemTotalPrice()) || "0"}
                    </span>
                  </p>
                    <p>
                    <span className="text-gray-500">Delivery Fee:</span>{" "}
                    <span className="font-light text-green-500">
                      {formatPrice(item.orderData.serviceFee) || "0"}
                    </span>
                  </p>
                  {item.orderData.order?.distance && (
                    <p>
                      <span className="text-gray-500">Distance:</span>{" "}
                      <span className="font-medium">
                        {item.orderData.order.distance}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Booking specific details */}
            {item.type === "BOOKING" && item.bookingData && (
              <div className="backdrop-blur-xl bg-purple-50/60 rounded-xl p-3 border border-purple-200/40">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">
                  Booking Details
                </h4>
                <div className="text-xs sm:text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">
                        {item.bookingData.status || "N/A"}
                      </span>
                      {handleOpenStatusDialog && isSelected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenStatusDialog();
                          }}
                          disabled={isUpdatingStatus}
                          className="h-6 px-2 text-xs backdrop-blur-xl bg-white/20 hover:bg-white/30 border-white/30"
                        >
                          {isUpdatingStatus ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Update"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Item/Service */}
                  {item.bookingData.item && (
                    <p>
                      <span className="text-gray-500">Service:</span>{" "}
                      <span className="font-medium">
                        {item.bookingData.item}
                      </span>
                    </p>
                  )}

                  {/* Location Information */}
                  {item.bookingData.pickUpAddress && (
                    <p>
                      <span className="text-gray-500">Pick-up Location:</span>{" "}
                      <span className="font-medium">
                        {item.bookingData.pickUpAddress}
                      </span>
                    </p>
                  )}

                  {item.bookingData.deliveryAddress && (
                    <p>
                      <span className="text-gray-500">Delivery Address:</span>{" "}
                      <span className="font-medium">
                        {item.bookingData.deliveryAddress}
                      </span>
                    </p>
                  )}

                  {item.bookingData.startTime && item.bookingData.endTime ? (
                    // Use the new date-time range formatter
                    (() => {
                      const { date, time } = formatDateTimeRange(
                        item.bookingData.startTime,
                        item.bookingData.endTime
                      );
                      return (
                        <>
                          <p>
                            <span className="text-gray-500">Date:</span>{" "}
                            <span className="font-medium">{date}</span>
                          </p>
                          <p>
                            <span className="text-gray-500">Time:</span>{" "}
                            <span className="font-medium">{time}</span>
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    // Fallback to individual date/time if available
                    <>
                      <p>
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-medium">
                          {item.bookingData.day
                            ? formatDate(item.bookingData.day)
                            : "N/A"}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray-500">Time:</span>{" "}
                        <span className="font-medium">
                          {item.bookingData.startTime
                            ? formatTime(item.bookingData.startTime)
                            : "N/A"}{" "}
                          -{" "}
                          {item.bookingData.endTime
                            ? formatTime(item.bookingData.endTime)
                            : "N/A"}
                        </span>
                      </p>
                    </>
                  )}

                  {item.bookingData.tableSize && (
                    <p>
                      <span className="text-gray-500">Items:</span>{" "}
                      <span className="font-medium">
                        {item.bookingData.tableSize}
                      </span>
                    </p>
                  )}
                  {!item.bookingData.cargoId && (
                    <p>
                      <span className="text-gray-500">Fee:</span>{" "}
                      <span className="font-medium text-green-600">
                        GH₵{item.bookingData.deliveryFee || "0"}
                      </span>
                    </p>
                  )}

                  {/* Notes */}
                  {item.bookingData.notes && (
                    <div className="mt-2 pt-2 border-t border-purple-200/30">
                      <p className="text-gray-500 text-xs">Notes:</p>
                      <p className="font-medium text-xs">
                        {item.bookingData.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <PaymentStatusSection
              selectedItem={item}
              // paymentStatus={paymentStatus}
              onPayNow={() => {}}
            />
            {/* Payment Loading State */}
            {isSelected && paymentLoading && (
              <div className="backdrop-blur-xl bg-blue-50/60 rounded-xl p-3 border border-blue-200/40">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading payment status...
                </div>
              </div>
            )}

            {/* Rider information */}
            {item.rider && (
              <div className="backdrop-blur-xl bg-blue-50/60 rounded-xl p-3 border border-blue-200/40">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {item.rider.name}
                    </p>
                    <p className="text-xs text-gray-600">{item.rider.number}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${item.rider?.number}`, "_self");
                    }}
                    className="backdrop-blur-xl bg-blue-500/80 hover:bg-blue-600/80 text-white border-0 h-8 px-3 text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            )}

            {/* Status Update Loading Indicator */}
            {isUpdatingStatus && isSelected && (
              <div className="backdrop-blur-xl bg-blue-50/60 rounded-xl p-3 border border-blue-200/40">
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Updating status...
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}

// Main ServiceListDialog component
export default function ServiceListDialog({
  open,
  onOpenChange,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  activeTab,
  setActiveTab,
  serviceData,
  stats,
  handleViewAll,
  handleRefresh,
  loading,
  error,
  filteredData,
  selectedItem,
  handleItemClick,
  handleJustPaymentItemClick,
  getStatusBadge,
  handleUpdateStatus,
  isUpdatingStatus,
  paymentStatus,
  paymentLoading,
  handleOpenStatusDialog,
}: ServiceListDialogProps) {
  const [scrollY, setScrollY] = useState(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const currentScrollY = scrollContainerRef.current.scrollTop;
      const scrollingDown =
        currentScrollY > lastScrollY.current && currentScrollY > 50;

      setScrollY(currentScrollY);
      setIsScrollingDown(scrollingDown);
      lastScrollY.current = currentScrollY;

      // Auto-hide filters when scrolling down
      if (scrollingDown && showFilters) {
        setShowFilters(false);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll, {
        passive: true,
      });
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [showFilters]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="backdrop-blur-xl bg-white/95 border border-white/30 rounded-2xl p-0 w-[95vw] max-w-6xl h-[90vh] max-h-[800px] flex flex-col overflow-hidden">
        {/* Smart Header */}
        <div className="relative z-10">
          {/* Always visible search bar */}
          <div className="p-3 sm:p-4 backdrop-blur-xl bg-white/90 border-b border-white/30">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search orders, bookings, or vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 backdrop-blur-xl bg-white/60 border-white/40 rounded-xl h-10 sm:h-11"
                />
              </div>

              {/* Filter toggle button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`backdrop-blur-xl border-white/40 h-10 sm:h-11 px-3 sm:px-4 transition-all duration-200 ${
                  showFilters
                    ? "bg-blue-50/60 border-blue-300/50"
                    : "bg-white/60"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Filters</span>
                {(statusFilter !== "all" || activeTab !== "all") && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-1" />
                )}
              </Button>

              {/* Quick actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="backdrop-blur-xl bg-white/60 border-white/40 h-10 sm:h-11 px-2 sm:px-3"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewAll}
                  className="backdrop-blur-xl bg-white/60 border-white/40 h-10 sm:h-11 px-2 sm:px-3 hidden sm:flex"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              {/* Close button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="backdrop-blur-xl bg-white/60 border-white/40 h-10 sm:h-11 px-2 sm:px-3 hover:bg-red-50/60 hover:border-red-300/50 transition-all duration-200"
              >
                <X className="h-4 w-4 text-gray-600 hover:text-red-600" />
              </Button>
            </div>
          </div>

          {/* Collapsible Filters */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent>
              <div className="p-3 sm:p-4 backdrop-blur-xl bg-white/85 border-b border-white/30">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-white/40 rounded-xl backdrop-blur-xl bg-white/60 text-sm h-10"
                  >
                    <option value="all">All Status</option>
                    {/* Order statuses */}
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="PREPARING">Preparing</option>
                    <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="PENDING">Pending</option>
                    {/* Booking statuses */}
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="px-3 py-2 border border-white/40 rounded-xl backdrop-blur-xl bg-white/60 text-sm h-10"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="status">Sort by Status</option>
                    <option value="type">Sort by Type</option>
                  </select>
                </div>

                {/* Tabs */}
                <div className="flex justify-between items-center">
                  <div className="flex backdrop-blur-xl bg-white/50 rounded-xl p-1 border border-white/30">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === "all"
                          ? "bg-white/80 text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      All ({serviceData.length})
                    </button>
                    <button
                      onClick={() => setActiveTab("orders")}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === "orders"
                          ? "bg-white/80 text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Orders ({stats.totalOrders})
                    </button>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${
                        activeTab === "bookings"
                          ? "bg-white/80 text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Bookings ({stats.totalBookings})
                    </button>
                  </div>

                  {/* Clear filters */}
                  {(searchQuery ||
                    statusFilter !== "all" ||
                    activeTab !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setActiveTab("all");
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && !serviceData.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                <p className="text-gray-600">
                  Loading your orders and bookings...
                </p>
              </div>
            </div>
          ) : error && !serviceData.length ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-4">
                  Failed to load data: {error.message}
                </p>
                <Button onClick={handleRefresh} className="rounded-xl">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div ref={scrollContainerRef} className="h-full overflow-y-auto">
              <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                {filteredData.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100/60 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-xl">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No items found
                    </h3>
                    <p className="text-gray-500 mb-4 text-sm sm:text-base">
                      {searchQuery ||
                      statusFilter !== "all" ||
                      activeTab !== "all"
                        ? "Try adjusting your search or filters"
                        : "You don't have any orders or bookings yet"}
                    </p>
                    {(searchQuery ||
                      statusFilter !== "all" ||
                      activeTab !== "all") && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setActiveTab("all");
                        }}
                        className="rounded-xl"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Results summary */}
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-4 px-1">
                      <span>
                        Showing {filteredData.length} of {serviceData.length}{" "}
                        items
                      </span>
                      {loading && (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Updating...
                        </span>
                      )}
                    </div>

                    {/* Service cards */}
                    {filteredData.map((item) => (
                      <ServiceCard
                        key={item.id}
                        item={item}
                        onClick={() => handleItemClick(item)}
                        handleJustPaymentItemClick={handleJustPaymentItemClick}
                        isSelected={selectedItem?.id === item.id}
                        getStatusBadge={getStatusBadge}
                        handleOpenStatusDialog={handleOpenStatusDialog}
                        isUpdatingStatus={isUpdatingStatus}
                        paymentStatus={
                          selectedItem?.id === item.id ? paymentStatus : null
                        }
                        paymentLoading={
                          selectedItem?.id === item.id ? paymentLoading : false
                        }
                        selectedItem={selectedItem}
                      />
                    ))}

                    {/* Bottom padding for mobile */}
                    <div className="h-4 sm:h-6" />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scroll to top button */}
        {scrollY > 200 && (
          <Button
            onClick={() => {
              scrollContainerRef.current?.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="fixed bottom-4 right-4 z-20 rounded-full w-12 h-12 backdrop-blur-xl bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg border-0"
            size="icon"
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
