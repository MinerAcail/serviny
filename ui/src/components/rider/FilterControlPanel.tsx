// FilterControlPanel.tsx - Enhanced with payment information

import React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  XCircle,
  Navigation,
  ChevronUp,
  ChevronDown,
  Package,
  Calendar,
  User,
  Building,
  MapPin,
  Phone,
  Clock,
  DollarSign,
  CreditCard,
  Wallet,
} from "lucide-react";
import maplibregl from "maplibre-gl";

// Import types from the utilities
import { 
  RiderSelectedEntity, 
  RiderServiceData, 
  getPaymentStatusColor, 
  getPaymentMethodIcon 
} from "./riderEntityUtils";

interface FilterControlPanelProps {
  clearEntityFilter: () => void;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isMobile: boolean;
  mapInstance: React.RefObject<maplibregl.Map | null>;
  selectedEntity: RiderSelectedEntity | null;
  showFilterPanel: boolean;
}

export const FilterControlPanel: React.FC<FilterControlPanelProps> = ({
  clearEntityFilter,
  isExpanded,
  setIsExpanded,
  isMobile,
  mapInstance,
  selectedEntity,
  showFilterPanel,
}) => {
  // Only show if we have a selected entity AND showFilterPanel is true
  if (!showFilterPanel || !selectedEntity) return null;

  // Helper function to get detailed entity information with payment data
  const getEntityDetails = () => {
    if (!selectedEntity) return null;

    const { type, value, relatedData } = selectedEntity;

    switch (type) {
      case "customer": {
        const customerServices = relatedData.services;
        const customer = relatedData.customers[0];
        if (!customer) return null;

        const totalAmount = customerServices.reduce((sum, service) => {
          if (service.type === "ORDER") {
            return sum + (service.orderData?.deliveryMetaData?.price || 0);
          }
          if (service.type === "BOOKING") {
            return sum + parseFloat(service.bookingData?.deliveryFee || "0");
          }
          return sum;
        }, 0);

        const paidAmount = customerServices
          .filter(service => {
            const paymentStatus = service.type === "ORDER" 
              ? service.orderData?.paymentStatus 
              : service.bookingData?.paymentStatus;
            return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
          })
          .reduce((sum, service) => {
            if (service.type === "ORDER") {
              return sum + (service.orderData?.deliveryMetaData?.price || 0);
            }
            if (service.type === "BOOKING") {
              return sum + parseFloat(service.bookingData?.deliveryFee || "0");
            }
            return sum;
          }, 0);

        const pendingAmount = totalAmount - paidAmount;
        
        const paymentMethods = [...new Set(customerServices
          .map(service => service.type === "ORDER" 
            ? service.orderData?.paymentMethod 
            : service.bookingData?.paymentMethod)
          .filter(Boolean))];

        return {
          title: `Customer: ${customer.name}`,
          subtitle: `${customerServices.length} service${customerServices.length !== 1 ? "s" : ""} • GH₵${totalAmount.toFixed(2)} total`,
          icon: "👤",
          details: {
            overview: {
              Name: customer.name,
              Phone: customer.number,
              "Total Services": customerServices.length,
              "Total Orders": customerServices.filter(s => s.type === "ORDER").length,
              "Total Bookings": customerServices.filter(s => s.type === "BOOKING").length,
              "Total Amount": `GH₵${totalAmount.toFixed(2)}`,
              "Paid Amount": `GH₵${paidAmount.toFixed(2)}`,
              "Pending Amount": `GH₵${pendingAmount.toFixed(2)}`,
              "Payment Methods Used": paymentMethods.join(", ") || "None",
              "Confirmed Orders": customerServices.filter(s => 
                s.type === "ORDER" && s.orderData?.status === "CONFIRMED"
              ).length,
              "Confirmed Bookings": customerServices.filter(s => 
                s.type === "BOOKING" && s.bookingData?.status === "CONFIRMED"
              ).length,
            },
            services: customerServices.map((service) => ({
              id: service.id,
              type: service.type,
              serviceId: service.type === "ORDER" 
                ? service.orderData?.orderId 
                : service.bookingData?.bookingId,
              status: service.type === "ORDER" 
                ? service.orderData?.status 
                : service.bookingData?.status,
              vendor: service.vendor.name,
              amount: service.type === "ORDER" 
                ? `GH₵${service.orderData?.deliveryMetaData?.price || 0}` 
                : `GH₵${service.bookingData?.deliveryFee || 0}`,
              paymentStatus: service.type === "ORDER" 
                ? service.orderData?.paymentStatus 
                : service.bookingData?.paymentStatus,
              paymentMethod: service.type === "ORDER" 
                ? service.orderData?.paymentMethod 
                : service.bookingData?.paymentMethod,
              date: new Date(service.createdAt).toLocaleDateString(),
              address: service.type === "ORDER" 
                ? service.orderData?.deliveryAddress 
                : service.bookingData?.deliveryAddress,
            })),
          },
        };
      }

      case "order": {
        const orderService = relatedData.services[0];
        if (!orderService || orderService.type !== "ORDER") return null;

        return {
          title: `Order: #${orderService.orderData?.orderId?.slice(-6)}`,
          subtitle: `${orderService.customer.name} • ${orderService.vendor.name}`,
          icon: "📦",
          details: {
            overview: {
              "Order ID": orderService.orderData?.orderId,
              Customer: orderService.customer.name,
              "Customer Phone": orderService.customer.number,
              Vendor: orderService.vendor.name,
              Status: orderService.orderData?.status,
              Amount: `GH₵${orderService.orderData?.deliveryMetaData?.price || 0}`,
              "Payment Status": orderService.orderData?.paymentStatus || "Unknown",
              "Payment Method": orderService.orderData?.paymentMethod || "Unknown",
              "Delivery Address": orderService.orderData?.deliveryAddress,
              "Delivery Distance": orderService.orderData?.deliveryMetaData?.distance,
              "Delivery Duration": orderService.orderData?.deliveryMetaData?.duration,
              "Delivery Zone": orderService.orderData?.deliveryMetaData?.zone,
              "Service Fee": orderService.orderData?.serviceFee ? `GH₵${orderService.orderData.serviceFee}` : "N/A",
              "Estimated Delivery": orderService.orderData?.estimatedDeliveryDate 
                ? new Date(orderService.orderData.estimatedDeliveryDate).toLocaleString() 
                : "N/A",
              "Created At": new Date(orderService.createdAt).toLocaleString(),
            },
          },
        };
      }

      case "booking": {
        const bookingService = relatedData.services[0];
        if (!bookingService || bookingService.type !== "BOOKING") return null;

        return {
          title: `Booking: #${bookingService.bookingData?.bookingId?.slice(-6)}`,
          subtitle: `${bookingService.customer.name} • ${bookingService.vendor.name}`,
          icon: "📅",
          details: {
            overview: {
              "Booking ID": bookingService.bookingData?.bookingId,
              Customer: bookingService.customer.name,
              "Customer Phone": bookingService.customer.number,
              Vendor: bookingService.vendor.name,
              Status: bookingService.bookingData?.status || "Pending",
              "Confirmation Status": bookingService.bookingData?.isConfirmed ? "Confirmed" : "Pending",
              Amount: `GH₵${bookingService.bookingData?.deliveryFee || 0}`,
              "Payment Status": bookingService.bookingData?.paymentStatus || "Unknown",
              "Payment Method": bookingService.bookingData?.paymentMethod || "Unknown",
              "Pickup Address": bookingService.bookingData?.pickUpAddress,
              "Delivery Address": bookingService.bookingData?.deliveryAddress,
              "Item Count": bookingService.bookingData?.tableSize ? `${bookingService.bookingData.tableSize} ${Number(bookingService.bookingData?.tableSize) === 1 ? 'item' : 'items'}` : "N/A",
              "User Type": bookingService.bookingData?.userType || "N/A",
              Day: bookingService.bookingData?.day,
              "Start Time": bookingService.bookingData?.startTime ? new Date(bookingService.bookingData.startTime).toLocaleString() : "N/A",
              "End Time": bookingService.bookingData?.endTime ? new Date(bookingService.bookingData.endTime).toLocaleString() : "N/A",
              "Multi Group": bookingService.bookingData?.multiGroupId ? `#${bookingService.bookingData.multiGroupId.slice(-6)}` : "No",
              "Estimated Delivery": bookingService.bookingData?.estimatedDeliveryDate 
                ? new Date(bookingService.bookingData.estimatedDeliveryDate).toLocaleString() 
                : "N/A",
              "Created At": new Date(bookingService.createdAt).toLocaleString(),
            },
          },
        };
      }

      case "multigroup": {
        const multiGroupServices = relatedData.services;
        if (multiGroupServices.length === 0) return null;

        const multiGroupId = multiGroupServices[0]?.bookingData?.multiGroupId;
        const shortMultiGroupId = multiGroupId?.slice(-6);

        const uniqueCustomers = [...new Set(multiGroupServices.map((s) => s.customer.name))];
        const uniqueVendors = [...new Set(multiGroupServices.map((s) => s.vendor.name))];

        const totalFee = multiGroupServices.reduce((total, service) => {
          return total + parseFloat(service.bookingData?.deliveryFee || "0");
        }, 0);

        const paidAmount = multiGroupServices
          .filter(service => {
            const paymentStatus = service.bookingData?.paymentStatus;
            return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
          })
          .reduce((total, service) => {
            return total + parseFloat(service.bookingData?.deliveryFee || "0");
          }, 0);

        const pendingAmount = totalFee - paidAmount;
        const confirmedBookings = multiGroupServices.filter((s) => s.bookingData?.status === "CONFIRMED").length;
        const paidBookings = multiGroupServices.filter(service => {
          const paymentStatus = service.bookingData?.paymentStatus;
          return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
        }).length;

        const paymentMethods = [...new Set(multiGroupServices
          .map(service => service.bookingData?.paymentMethod)
          .filter(Boolean))];

        return {
          title: `Multi-Group #${shortMultiGroupId}`,
          subtitle: `${multiGroupServices.length} bookings • ${uniqueCustomers.length} customer${uniqueCustomers.length !== 1 ? "s" : ""} • GH₵${totalFee.toFixed(2)}`,
          icon: "📅🔗",
          details: {
            overview: {
              "Multi-Group ID": multiGroupId,
              "Total Bookings": multiGroupServices.length,
              "Confirmed Bookings": confirmedBookings,
              "Pending Bookings": multiGroupServices.length - confirmedBookings,
              "Paid Bookings": paidBookings,
              "Pending Payments": multiGroupServices.length - paidBookings,
              "Unique Customers": uniqueCustomers.length,
              "Unique Vendors": uniqueVendors.length,
              "Total Delivery Fees": `GH₵${totalFee.toFixed(2)}`,
              "Paid Amount": `GH₵${paidAmount.toFixed(2)}`,
              "Pending Amount": `GH₵${pendingAmount.toFixed(2)}`,
              "Average Fee per Booking": `GH₵${(totalFee / multiGroupServices.length).toFixed(2)}`,
              "Payment Methods": paymentMethods.join(", ") || "None",
              "Group Status": confirmedBookings === multiGroupServices.length
                ? "All Confirmed"
                : confirmedBookings === 0
                ? "All Pending"
                : "Mixed Status",
              "Payment Status": paidBookings === multiGroupServices.length
                ? "All Paid"
                : paidBookings === 0
                ? "All Pending"
                : "Mixed Payment Status",
            },
            services: multiGroupServices.map((service, index) => ({
              id: service.id,
              bookingNumber: index + 1,
              customer: service.customer.name,
              bookingId: service.bookingData?.bookingId,
              status: service.bookingData?.status || "Pending",
              confirmationStatus: service.bookingData?.isConfirmed ? "Confirmed" : "Pending",
              vendor: service.vendor.name,
              amount: `GH₵${service.bookingData?.deliveryFee || 0}`,
              paymentStatus: service.bookingData?.paymentStatus || "Unknown",
              paymentMethod: service.bookingData?.paymentMethod || "Unknown",
              date: new Date(service.createdAt).toLocaleDateString(),
              deliveryAddress: service.bookingData?.deliveryAddress,
              pickupAddress: service.bookingData?.pickUpAddress,
              tableSize: service.bookingData?.tableSize ? `${service.bookingData.tableSize} ${Number(service.bookingData.tableSize) === 1 ? 'item' : 'items'}` : "N/A",
              day: service.bookingData?.day,
              startTime: service.bookingData?.startTime ? new Date(service.bookingData.startTime).toLocaleTimeString() : "N/A",
              endTime: service.bookingData?.endTime ? new Date(service.bookingData.endTime).toLocaleTimeString() : "N/A",
            })),
            customers: uniqueCustomers.map((customerName) => {
              const customerBookings = multiGroupServices.filter(
                (s) => s.customer.name === customerName
              );
              const customerInfo = customerBookings[0].customer;
              const customerTotalFee = customerBookings.reduce(
                (total, service) => {
                  return total + parseFloat(service.bookingData?.deliveryFee || "0");
                },
                0
              );
              const customerPaidAmount = customerBookings
                .filter(service => {
                  const paymentStatus = service.bookingData?.paymentStatus;
                  return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
                })
                .reduce((total, service) => {
                  return total + parseFloat(service.bookingData?.deliveryFee || "0");
                }, 0);

              return {
                name: customerName,
                phone: customerInfo.number,
                bookings: customerBookings.length,
                totalSpent: customerTotalFee,
                paidAmount: customerPaidAmount,
                pendingAmount: customerTotalFee - customerPaidAmount,
                confirmedBookings: customerBookings.filter(
                  (s) => s.bookingData?.status === "CONFIRMED"
                ).length,
                pendingBookings: customerBookings.filter(
                  (s) => s.bookingData?.status !== "CONFIRMED"
                ).length,
                paidBookings: customerBookings.filter(service => {
                  const paymentStatus = service.bookingData?.paymentStatus;
                  return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
                }).length,
              };
            }),
          },
        };
      }

      case "vendor": {
        const vendorServices = relatedData.services;
        const vendor = relatedData.vendors[0];
        if (!vendor) return null;

        const totalAmount = vendorServices.reduce((sum, service) => {
          if (service.type === "ORDER") {
            return sum + (service.orderData?.deliveryMetaData?.price || 0);
          }
          if (service.type === "BOOKING") {
            return sum + parseFloat(service.bookingData?.deliveryFee || "0");
          }
          return sum;
        }, 0);

        const paidAmount = vendorServices
          .filter(service => {
            const paymentStatus = service.type === "ORDER" 
              ? service.orderData?.paymentStatus 
              : service.bookingData?.paymentStatus;
            return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
          })
          .reduce((sum, service) => {
            if (service.type === "ORDER") {
              return sum + (service.orderData?.deliveryMetaData?.price || 0);
            }
            if (service.type === "BOOKING") {
              return sum + parseFloat(service.bookingData?.deliveryFee || "0");
            }
            return sum;
          }, 0);

        const paymentMethods = [...new Set(vendorServices
          .map(service => service.type === "ORDER" 
            ? service.orderData?.paymentMethod 
            : service.bookingData?.paymentMethod)
          .filter(Boolean))];

        return {
          title: `Vendor: ${vendor.name}`,
          subtitle: `${vendorServices.length} service${vendorServices.length !== 1 ? "s" : ""} • GH₵${totalAmount.toFixed(2)} revenue`,
          icon: "🏪",
          details: {
            overview: {
              Name: vendor.name,
              Location: vendor.location,
              "Total Services": vendorServices.length,
              "Total Orders": vendorServices.filter(s => s.type === "ORDER").length,
              "Total Bookings": vendorServices.filter(s => s.type === "BOOKING").length,
              "Total Revenue": `GH₵${totalAmount.toFixed(2)}`,
              "Paid Revenue": `GH₵${paidAmount.toFixed(2)}`,
              "Pending Revenue": `GH₵${(totalAmount - paidAmount).toFixed(2)}`,
              "Payment Methods": paymentMethods.join(", ") || "None",
              "Unique Customers": [...new Set(vendorServices.map(s => s.customer.name))].length,
              Coordinates: vendor.coordinates ? `${vendor.coordinates[1]?.toFixed(6)}, ${vendor.coordinates[0]?.toFixed(6)}` : "N/A",
            },
            services: vendorServices.map((service) => ({
              id: service.id,
              type: service.type,
              customer: service.customer.name,
              serviceId: service.type === "ORDER" ? service.orderData?.orderId : service.bookingData?.bookingId,
              status: service.type === "ORDER" ? service.orderData?.status : service.bookingData?.status,
              amount: service.type === "ORDER" ? `GH₵${service.orderData?.deliveryMetaData?.price || 0}` : `GH₵${service.bookingData?.deliveryFee || 0}`,
              paymentStatus: service.type === "ORDER" ? service.orderData?.paymentStatus : service.bookingData?.paymentStatus,
              paymentMethod: service.type === "ORDER" ? service.orderData?.paymentMethod : service.bookingData?.paymentMethod,
              date: new Date(service.createdAt).toLocaleDateString(),
            })),
          },
        };
      }

      default:
        return null;
    }
  };

  const entityDetails = getEntityDetails();
  if (!entityDetails) return null;

  const detailTabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    ...(entityDetails.details.services ? [{ id: "services", label: "Services", icon: "📋" }] : []),
    ...(entityDetails.details.customers ? [{ id: "customers", label: "Customers", icon: "👥" }] : []),
  ];

  const [activeDetailTab, setActiveDetailTab] = React.useState("overview");

  return (
    <div className="absolute top-16 sm:top-20 left-3 sm:left-4 right-3 sm:right-4 z-50">
      <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-3xl overflow-hidden">
        {/* Enhanced Header */}
        <div className="p-3 sm:p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-lg">{entityDetails.icon}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-black text-sm sm:text-base tracking-tight truncate">
                  {entityDetails.title}
                </h4>
                <p className="text-xs sm:text-sm text-black/60 truncate">
                  {entityDetails.subtitle}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs bg-white/10 hover:bg-white/20 rounded-full"
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={clearEntityFilter}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 bg-white/10 hover:bg-white/20 border-white/20 rounded-full"
              >
                <XCircle className="h-3 w-3 mr-1" />
                {isMobile ? "" : "Close"}
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="max-h-96 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/20 overflow-x-auto scrollbar-hide">
              {detailTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveDetailTab(tab.id)}
                  className={`flex items-center gap-1 px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                    activeDetailTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50/50"
                      : "text-black/60 hover:text-black hover:bg-white/10"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <ScrollArea className="h-80">
              <div className="p-3 sm:p-4">
                {activeDetailTab === "overview" && entityDetails.details.overview && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(entityDetails.details.overview).map(([key, value]) => {
                      // Special handling for payment-related fields
                      const isPaymentStatus = key.toLowerCase().includes("payment status");
                      const isPaymentMethod = key.toLowerCase().includes("payment method");
                      const isAmount = key.toLowerCase().includes("amount") || key.toLowerCase().includes("revenue") || key.toLowerCase().includes("fee");

                      return (
                        <div
                          key={key}
                          className={`backdrop-blur-xl rounded-2xl p-3 border ${
                            isPaymentStatus || isPaymentMethod || isAmount
                              ? "bg-gradient-to-r from-green-50/50 to-blue-50/50 border-green-200/50"
                              : "bg-white/10 border-white/20"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {isPaymentStatus && <CreditCard className="h-3 w-3 text-blue-600" />}
                            {isPaymentMethod && <Wallet className="h-3 w-3 text-green-600" />}
                            {isAmount && <DollarSign className="h-3 w-3 text-green-600" />}
                            <div className="text-xs text-black/60 font-semibold">{key}</div>
                          </div>
                          <div className={`text-sm font-semibold mt-1 break-words ${
                            isAmount ? "text-green-700" : "text-black"
                          }`}>
                            {isPaymentMethod && String(value) !== "Unknown" && (
                              <span className="mr-2">{getPaymentMethodIcon(String(value))}</span>
                            )}
                            {isPaymentStatus && String(value) !== "Unknown" ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(String(value))}`}>
                                {String(value)}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {activeDetailTab === "services" && entityDetails.details.services && (
                  <div className="space-y-3">
                    {entityDetails.details.services.map((service: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                service.type === "ORDER"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-purple-100 text-purple-700"
                              }`}
                            >
                              {service.type}
                            </span>
                            <span className="text-sm font-semibold text-black truncate">
                              {service.bookingNumber
                                ? `#${service.bookingNumber}`
                                : `#${service.serviceId?.slice(-6) || service.bookingId?.slice(-6)}`}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-green-600">
                            {service.amount}
                          </span>
                        </div>

                        {/* Payment Information Row */}
                        <div className="bg-gray-50/50 rounded-lg p-2 mb-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span>{getPaymentMethodIcon(service.paymentMethod || "")}</span>
                              <span className="text-black/60">Method:</span>
                              <span className="font-semibold text-black">
                                {service.paymentMethod || "Unknown"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3 text-blue-600" />
                              <span className="text-black/60">Status:</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(service.paymentStatus || "")}`}>
                                {service.paymentStatus || "Unknown"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-black/60">Customer:</span>
                            <span className="ml-1 font-semibold text-black truncate">
                              {service.customer}
                            </span>
                          </div>
                          <div>
                            <span className="text-black/60">Status:</span>
                            <span className="ml-1 font-semibold text-black">
                              {service.status}
                            </span>
                          </div>
                          {service.confirmationStatus && (
                            <div>
                              <span className="text-black/60">Confirmation:</span>
                              <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                                service.confirmationStatus === "Confirmed" 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-yellow-100 text-yellow-700"
                              }`}>
                                {service.confirmationStatus}
                              </span>
                            </div>
                          )}
                          {service.vendor && (
                            <div>
                              <span className="text-black/60">Vendor:</span>
                              <span className="ml-1 font-semibold text-black truncate">
                                {service.vendor}
                              </span>
                            </div>
                          )}
                          {service.date && (
                            <div>
                              <span className="text-black/60">Date:</span>
                              <span className="ml-1 font-semibold text-black">
                                {service.date}
                              </span>
                            </div>
                          )}
                          {service.tableSize && (
                            <div>
                              <span className="text-black/60">Item Count:</span>
                              <span className="ml-1 font-semibold text-black">
                                {service.tableSize}
                              </span>
                            </div>
                          )}
                          {service.day && (
                            <div>
                              <span className="text-black/60">Day:</span>
                              <span className="ml-1 font-semibold text-black">
                                {service.day}
                              </span>
                            </div>
                          )}
                          {service.startTime && service.startTime !== "N/A" && (
                            <div className="sm:col-span-2">
                              <span className="text-black/60">Time:</span>
                              <span className="ml-1 font-semibold text-black">
                                {service.startTime} - {service.endTime}
                              </span>
                            </div>
                          )}
                          {service.deliveryAddress && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <span className="text-black/60">Delivery:</span>
                              <span className="ml-1 font-semibold text-black break-words">
                                {service.deliveryAddress}
                              </span>
                            </div>
                          )}
                          {service.pickupAddress && (
                            <div className="sm:col-span-2 lg:col-span-3">
                              <span className="text-black/60">Pickup:</span>
                              <span className="ml-1 font-semibold text-black break-words">
                                {service.pickupAddress}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeDetailTab === "customers" && entityDetails.details.customers && (
                  <div className="space-y-3">
                    {entityDetails.details.customers.map((customer: any, index: number) => (
                      <div
                        key={index}
                        className="bg-white/10 backdrop-blur-xl rounded-2xl p-3 sm:p-4 border border-white/20"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-sm text-black truncate">
                              {customer.name}
                            </h5>
                            <div className="text-xs text-black/60 break-words">
                              <Phone className="inline h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-green-600">
                              GH₵{customer.totalSpent.toFixed(2)}
                            </span>
                            {customer.paidAmount !== undefined && (
                              <div className="text-xs text-green-600">
                                Paid: GH₵{customer.paidAmount.toFixed(2)}
                              </div>
                            )}
                            {customer.pendingAmount !== undefined && customer.pendingAmount > 0 && (
                              <div className="text-xs text-yellow-600">
                                Pending: GH₵{customer.pendingAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-black/60">Bookings:</span>
                            <span className="ml-1 font-semibold text-black">
                              {customer.bookings}
                            </span>
                          </div>
                          <div>
                            <span className="text-black/60">Confirmed:</span>
                            <span className="ml-1 font-semibold text-green-600">
                              {customer.confirmedBookings}
                            </span>
                          </div>
                          <div>
                            <span className="text-black/60">Pending:</span>
                            <span className="ml-1 font-semibold text-orange-600">
                              {customer.pendingBookings}
                            </span>
                          </div>
                          {customer.paidBookings !== undefined && (
                            <>
                              <div>
                                <span className="text-black/60">Paid:</span>
                                <span className="ml-1 font-semibold text-green-600">
                                  {customer.paidBookings}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-black/60">Payment Rate:</span>
                                <span className="ml-1 font-semibold text-blue-600">
                                  {((customer.paidBookings / customer.bookings) * 100).toFixed(1)}%
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Enhanced Quick Stats Footer with Payment Info */}
        <div className="p-3 sm:p-4 justify-between flex bg-white/10 backdrop-blur-xl border-t border-white/20">
          <div className="grid grid-cols-4 gap-2 flex-1">
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
              <div className="text-xs font-bold text-orange-700">
                {selectedEntity?.relatedData.services?.filter((s) => s.type === "ORDER").length || 0}
              </div>
              <div className="text-xs text-orange-600">Orders</div>
            </div>
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
              <div className="text-xs font-bold text-purple-700">
                {selectedEntity?.relatedData.services?.filter((s) => s.type === "BOOKING").length || 0}
              </div>
              <div className="text-xs text-purple-600">Bookings</div>
            </div>
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
              <div className="text-xs font-bold text-green-700">
                {selectedEntity?.relatedData.services?.filter(service => {
                  const paymentStatus = service.type === "ORDER" 
                    ? service.orderData?.paymentStatus 
                    : service.bookingData?.paymentStatus;
                  return paymentStatus?.toUpperCase() === "PAID" || paymentStatus?.toUpperCase() === "COMPLETED";
                }).length || 0}
              </div>
              <div className="text-xs text-green-600">Paid</div>
            </div>
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-2 text-center border border-white/20">
              <div className="text-xs font-bold text-blue-700">
                {selectedEntity?.type === "multigroup"
                  ? [...new Set(selectedEntity.relatedData.services?.map((s) => s.customer.name))].length
                  : selectedEntity?.relatedData.customers?.length || 0}
              </div>
              <div className="text-xs text-blue-600">Customers</div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (mapInstance.current && selectedEntity) {
                const bounds = new maplibregl.LngLatBounds();
                let hasCoordinates = false;

                selectedEntity.relatedData.services?.forEach((service) => {
                  if (service.vendor?.coordinates) {
                    bounds.extend(service.vendor.coordinates);
                    hasCoordinates = true;
                  }
                  if (service.type === "ORDER" && service.orderData?.order?.coordinates) {
                    bounds.extend(service.orderData.order.coordinates);
                    hasCoordinates = true;
                  } else if (service.type === "BOOKING") {
                    if (service.bookingData?.pickupLocation) {
                      bounds.extend(service.bookingData.pickupLocation);
                      hasCoordinates = true;
                    }
                    if (service.bookingData?.dropoffLocation) {
                      bounds.extend(service.bookingData.dropoffLocation);
                      hasCoordinates = true;
                    }
                  }
                });

                if (hasCoordinates) {
                  mapInstance.current.fitBounds(bounds, {
                    padding: 100,
                    maxZoom: 15,
                    duration: 1500,
                  });
                }
              }
            }}
            className="text-xs bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl ml-2"
          >
            <Navigation className="h-3 w-3 mr-1" />
            {isMobile ? "Fit" : "Fit View"}
          </Button>
        </div>
      </div>
    </div>
  );
};