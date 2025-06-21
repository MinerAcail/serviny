"use client";

import type React from "react";
import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  CheckCircle,
  Clock,
  XCircle,
  Package,
  Truck,
  MapPin,
  CreditCard,
  AlertCircle,
  Settings,
  Save,
  RotateCcw,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { RiderServiceData } from "./riderEntityUtils";
import { gql } from "@apollo/client";

interface StatusManagementDialogProps {
  service: RiderServiceData;
  onStatusUpdate?: (
    serviceId: string,
    statusType: string,
    newStatus: string
  ) => void;
  trigger?: React.ReactNode;
}

// GraphQL queries and mutations - Updated to match backend
const GET_BOOKING_ORDER_PAYMENT_STATUS = gql`
  query GetBookingOrderPaymentStatus(
    $entityId: String!
    $entityType: String!
    $statusType: String!
  ) {
    getBookingOrderPaymentStatus(
      entityId: $entityId
      entityType: $entityType
      statusType: $statusType
    )
  }
`;

const UPDATE_BOOKING_ORDER_PAYMENT_STATUS = gql`
  mutation UpdateBookingOrderPaymentStatus(
    $id: String!
    $serviceId: String
    $userId: String
    $riderId: String
    $status: String!
    $entityId: String!
    $entityType: String!
    $statusType: String!
  ) {
    updateBookingOrderPaymentStatus(
      id: $id
      serviceId: $serviceId
      userId: $userId
      riderId: $riderId
      status: $status
      entityId: $entityId
      entityType: $entityType
      statusType: $statusType
    )
  }
`;

// Status configurations for different types - Updated to match backend
const ORDER_STATUSES = {
  ORDER: {
    label: "Delivery Status",
    icon: <Truck className="h-4 w-4" />,
    options: [
      {
        value: "PENDING",
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-3 w-3" />,
      },
      {
        value: "CONFIRMED",
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "PREPARING",
        label: "Preparing",
        color: "bg-orange-100 text-orange-800",
        icon: <Package className="h-3 w-3" />,
      },
      {
        value: "READY",
        label: "Ready for Pickup",
        color: "bg-purple-100 text-purple-800",
        icon: <MapPin className="h-3 w-3" />,
      },
      {
        value: "PICKED_UP",
        label: "Picked Up",
        color: "bg-indigo-100 text-indigo-800",
        icon: <Truck className="h-3 w-3" />,
      },
      {
        value: "ON_DELIVERY",
        label: "On Delivery",
        color: "bg-cyan-100 text-cyan-800",
        icon: <Truck className="h-3 w-3" />,
      },
      {
        value: "DELIVERED",
        label: "Delivered",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "CANCELLED",
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3" />,
      },
      {
        value: "FAILED",
        label: "Failed Delivery",
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="h-3 w-3" />,
      },
    ],
  },
  PAYMENT: {
    label: "Payment Status",
    icon: <CreditCard className="h-4 w-4" />,
    options: [
      {
        value: "NOT_PAID",
        label: "Not Paid",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3" />,
      },
      {
        value: "PENDING",
        label: "Payment Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-3 w-3" />,
      },
      {
        value: "PROCESSING",
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
        icon: <Settings className="h-3 w-3" />,
      },
      {
        value: "PAID",
        label: "Paid",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "REFUNDED",
        label: "Refunded",
        color: "bg-purple-100 text-purple-800",
        icon: <RotateCcw className="h-3 w-3" />,
      },
      {
        value: "FAILED",
        label: "Payment Failed",
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="h-3 w-3" />,
      },
    ],
  },
};

const BOOKING_STATUSES = {
  APPOINTMENT: {
    label: "Booking Status",
    icon: <Package className="h-4 w-4" />,
    options: [
      {
        value: "PENDING",
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-3 w-3" />,
      },
      {
        value: "CONFIRMED",
        label: "Confirmed",
        color: "bg-blue-100 text-blue-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "PREPARING",
        label: "Preparing",
        color: "bg-orange-100 text-orange-800",
        icon: <Package className="h-3 w-3" />,
      },
      {
        value: "READY",
        label: "Ready",
        color: "bg-purple-100 text-purple-800",
        icon: <MapPin className="h-3 w-3" />,
      },
      {
        value: "PICKED_UP",
        label: "Picked Up",
        color: "bg-indigo-100 text-indigo-800",
        icon: <Truck className="h-3 w-3" />,
      },
      {
        value: "ON_DELIVERY",
        label: "On Delivery",
        color: "bg-cyan-100 text-cyan-800",
        icon: <Truck className="h-3 w-3" />,
      },
      {
        value: "DELIVERED",
        label: "Delivered",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "COMPLETED",
        label: "Completed",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "CANCELLED",
        label: "Cancelled",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3" />,
      },
      {
        value: "NO_SHOW",
        label: "No Show",
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="h-3 w-3" />,
      },
    ],
  },
  PAYMENT: {
    label: "Payment Status",
    icon: <CreditCard className="h-4 w-4" />,
    options: [
      {
        value: "NOT_PAID",
        label: "Not Paid",
        color: "bg-red-100 text-red-800",
        icon: <XCircle className="h-3 w-3" />,
      },
      {
        value: "PENDING",
        label: "Payment Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: <Clock className="h-3 w-3" />,
      },
      {
        value: "PROCESSING",
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
        icon: <Settings className="h-3 w-3" />,
      },
      {
        value: "PAID",
        label: "Paid",
        color: "bg-green-100 text-green-800",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      {
        value: "REFUNDED",
        label: "Refunded",
        color: "bg-purple-100 text-purple-800",
        icon: <RotateCcw className="h-3 w-3" />,
      },
      {
        value: "FAILED",
        label: "Payment Failed",
        color: "bg-red-100 text-red-800",
        icon: <AlertCircle className="h-3 w-3" />,
      },
    ],
  },
};

export function StatusManagementDialog({
  service,
  onStatusUpdate,
  trigger,
}: StatusManagementDialogProps) {
  const [open, setOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string>>(
    {}
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Get entity details for GraphQL operations - Updated to match backend logic
  const getEntityDetails = () => {
    if (service.type === "ORDER") {
      return {
        entityId: service.orderData?.orderId || service.id,
        entityType: "ORDER",
        serviceId: service.serviceId || service.id,
        userId: service.customer?.id || null,
        riderId: service.rider?.id || null,
      };
    } else if (service.type === "BOOKING") {
      return {
        entityId: service.bookingData?.bookingId || service.id,
        entityType: "BOOKING",
        serviceId: service.serviceId || service.id,
        userId: service.customer?.id || null,
        riderId: service.rider?.id || null,
      };
    }
    return {
      entityId: service.id,
      entityType: service.type,
      serviceId: service.serviceId || service.id,
      userId: service.customer?.id || null,
      riderId: service.rider?.id || null,
    };
  };

  const { entityId, entityType, serviceId, userId, riderId } =
    getEntityDetails();

  // Query current status for ORDER/APPOINTMENT
  const {
    data: orderStatusData,
    loading: orderStatusLoading,
    error: orderStatusError,
    refetch: refetchOrderStatus,
  } = useQuery(GET_BOOKING_ORDER_PAYMENT_STATUS, {
    variables: {
      entityId,
      entityType,
      statusType: service.type === "ORDER" ? "ORDER" : "APPOINTMENT",
    },
    skip: !open, // Only query when dialog is open
    errorPolicy: "all",
  });

  // Query current payment status
  const {
    data: paymentStatusData,
    loading: paymentStatusLoading,
    error: paymentStatusError,
    refetch: refetchPaymentStatus,
  } = useQuery(GET_BOOKING_ORDER_PAYMENT_STATUS, {
    variables: {
      entityId,
      entityType,
      statusType: "PAYMENT",
    },
    skip: !open, // Only query when dialog is open
    errorPolicy: "all",
  });

  // GraphQL mutation hook
  const [updateBookingOrderPaymentStatus] = useMutation(
    UPDATE_BOOKING_ORDER_PAYMENT_STATUS,
    {
      onCompleted: (data) => {
        console.log("✅ Status update completed:", data);
        // Refetch the latest statuses after update
        refetchOrderStatus();
        refetchPaymentStatus();
        toast.success("Status Updated", {
          description: "Service status has been updated successfully.",
        });
      },
      onError: (error) => {
        console.error("❌ Status update failed:", error);
        toast.error("Update Failed", {
          description:
            error.message || "Failed to update status. Please try again.",
        });
      },
    }
  );

  // Get current statuses from queries with fallback to service data
  const getCurrentStatuses = () => {
    const statusTypeKey = service.type === "ORDER" ? "ORDER" : "APPOINTMENT";

    // Use query data if available, otherwise fallback to service data
    const orderStatus =
      orderStatusData?.getBookingOrderPaymentStatus ||
      (service.type === "ORDER"
        ? service.orderData?.status
        : service.bookingData?.isConfirmed
        ? "CONFIRMED"
        : "PENDING") ||
      "PENDING";

    const paymentStatus =
      paymentStatusData?.getBookingOrderPaymentStatus ||
      (service.type === "ORDER"
        ? service.orderData?.paymentStatus
        : service.bookingData?.paymentStatus) ||
      "NOT_PAID";

    return {
      [statusTypeKey]: orderStatus,
      PAYMENT: paymentStatus,
    };
  };

  const currentStatuses = getCurrentStatuses();
  const statusConfigs =
    service.type === "ORDER" ? ORDER_STATUSES : BOOKING_STATUSES;

  // Loading state
  const isLoading = orderStatusLoading || paymentStatusLoading;

  const handleStatusChange = (statusType: string, newStatus: string) => {
    console.log(`📝 Status change queued: ${statusType} -> ${newStatus}`);
    setPendingChanges((prev) => ({
      ...prev,
      [statusType]: newStatus,
    }));
  };

  const handleSaveChanges = async () => {
    if (Object.keys(pendingChanges).length === 0) {
      return;
    }

    setIsUpdating(true);
    console.log("💾 Saving status changes:", pendingChanges);

    try {
      // Process each status change
      const updatePromises = Object.entries(pendingChanges).map(
        async ([statusType, newStatus]) => {
          console.log(
            `🔄 Updating ${statusType} to ${newStatus} for ${entityType} ${entityId}`
          );

          const result = await updateBookingOrderPaymentStatus({
            variables: {
              id: service.id,
              serviceId: serviceId,
              userId: userId,
              riderId: riderId,
              status: newStatus,
              entityId,
              entityType,
              statusType,
            },
          });

          // Call the optional callback
          if (onStatusUpdate) {
            onStatusUpdate(service.id, statusType, newStatus);
          }

          return result;
        }
      );

      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      console.log("✅ All status updates completed:", results);

      // Clear pending changes and close dialog
      setPendingChanges({});
      setOpen(false);

      toast.success("All Status Updates Completed", {
        description: `Successfully updated ${
          Object.keys(pendingChanges).length
        } status(es).`,
      });
    } catch (error) {
      console.error("❌ Error during status updates:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Some status updates failed. Please try again.";
      toast.error("Update Failed", {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    console.log("🔄 Resetting pending changes");
    setPendingChanges({});
  };

  const handleRefreshStatus = () => {
    console.log("🔄 Refreshing status data from backend");
    refetchOrderStatus();
    refetchPaymentStatus();
    setPendingChanges({}); // Clear any pending changes
    toast.info("Status Refreshed", {
      description: "Latest status information has been loaded.",
    });
  };

  const getStatusDisplay = (statusType: string, status: string) => {
    const config = statusConfigs[statusType];
    const option = config?.options.find((opt) => opt.value === status);

    if (!option)
      return {
        label: status,
        color: "bg-gray-100 text-gray-800",
        icon: <AlertCircle className="h-3 w-3" />,
      };

    return option;
  };

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Status
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Settings className="h-5 w-5" />
            Status Management
            {isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            )}
          </DialogTitle>
          <DialogDescription className="text-black/60">
            Update the status for{" "}
            {service.type === "ORDER" ? "Order" : "Booking"} #{" "}
            {service.type === "ORDER"
              ? service.orderData?.orderId?.slice(-6)
              : service.bookingData?.bookingId?.slice(-6)}
            {isLoading && " • Loading latest status..."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 p-1">
            {/* Real-time Status Info */}
            <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                  📊 Current Status (Live from Backend)
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshStatus}
                  disabled={isLoading || isUpdating}
                  className="text-xs bg-white/50 hover:bg-white/70 border-blue-200 rounded-xl"
                >
                  <RefreshCw
                    className={`h-3 w-3 mr-1 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 rounded-xl p-3 border border-blue-200/30">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    {service.type === "ORDER"
                      ? "Order Status"
                      : "Booking Status"}
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-blue-900">
                          {service.type === "ORDER"
                            ? currentStatuses.ORDER
                            : currentStatuses.APPOINTMENT}
                        </div>
                        {orderStatusError && (
                          <AlertCircle
                            className="h-3 w-3 text-red-500"
                            title="Failed to load status"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-white/50 rounded-xl p-3 border border-blue-200/30">
                  <div className="text-xs text-blue-600 font-medium mb-1">
                    Payment Status
                  </div>
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-blue-900">
                          {currentStatuses.PAYMENT}
                        </div>
                        {paymentStatusError && (
                          <AlertCircle
                            className="h-3 w-3 text-red-500"
                            title="Failed to load payment status"
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {(orderStatusError || paymentStatusError) && (
                <div className="mt-3 p-2 bg-red-50/50 rounded-lg border border-red-200/50">
                  <div className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Some status data failed to load. Using cached values.
                  </div>
                </div>
              )}
            </div>

            {/* Service Information */}
            <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
              <h4 className="font-semibold text-black mb-3">
                Service Information
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-black/60">Customer:</span>
                  <span className="ml-2 font-medium text-black">
                    {service.customer.name}
                  </span>
                </div>
                <div>
                  <span className="text-black/60">Vendor:</span>
                  <span className="ml-2 font-medium text-black">
                    {service.vendor.name}
                  </span>
                </div>
                <div>
                  <span className="text-black/60">Rider:</span>
                  <span className="ml-2 font-medium text-black">
                    {service.rider?.name || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-black/60">Amount:</span>
                  <span className="ml-2 font-medium text-green-600">
                    GH₵
                    {service.type === "ORDER"
                      ? service.orderData?.deliveryMetaData?.price || 0
                      : service.bookingData?.deliveryFee || 0}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-black/60">Entity ID:</span>
                  <span className="ml-2 font-mono text-xs text-black">
                    {entityId}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-black/60">Entity Type:</span>
                  <span className="ml-2 font-mono text-xs text-black">
                    {entityType}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Management */}
            <div className="space-y-4">
              <h4 className="font-semibold text-black">Update Statuses</h4>

              {Object.entries(statusConfigs).map(([statusType, config]) => {
                const currentStatus = currentStatuses[statusType];
                const pendingStatus = pendingChanges[statusType];
                const displayStatus = pendingStatus || currentStatus;
                const statusDisplay = getStatusDisplay(
                  statusType,
                  displayStatus
                );
                const hasQueryData =
                  statusType === "PAYMENT"
                    ? paymentStatusData
                    : orderStatusData;
                const queryError =
                  statusType === "PAYMENT"
                    ? paymentStatusError
                    : orderStatusError;

                return (
                  <div
                    key={statusType}
                    className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="font-medium text-black">
                          {config.label}
                        </span>
                        {hasQueryData && (
                          <Badge className="bg-green-100 text-green-700 text-xs border-0">
                            Live
                          </Badge>
                        )}
                        {queryError && (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs border-0">
                            Cached
                          </Badge>
                        )}
                      </div>
                      <Badge className={`${statusDisplay.color} border-0`}>
                        <div className="flex items-center gap-1">
                          {statusDisplay.icon}
                          {statusDisplay.label}
                        </div>
                      </Badge>
                    </div>

                    <Select
                      value={displayStatus}
                      onValueChange={(value) =>
                        handleStatusChange(statusType, value)
                      }
                      disabled={isUpdating || isLoading}
                    >
                      <SelectTrigger className="bg-white/20 border-white/20 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-2xl">
                        {config.options.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value}
                            className="rounded-xl"
                          >
                            <div className="flex items-center gap-2">
                              {option.icon}
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {pendingStatus && pendingStatus !== currentStatus && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-50/50 rounded-lg p-2">
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Status will change from "
                          {getStatusDisplay(statusType, currentStatus).label}"
                          to "{statusDisplay.label}"
                        </div>
                      </div>
                    )}

                    {/* Show backend sync status */}
                    <div className="mt-2 text-xs text-gray-500">
                      Last synced: {hasQueryData ? "Just now" : "From cache"}
                      {queryError && " (Sync failed)"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Multi-Group Information (for bookings) */}
            {service.type === "BOOKING" &&
              service.bookingData?.multiGroupId && (
                <div className="bg-purple-50/50 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/50">
                  <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                    📅🔗 Multi-Group Booking
                  </h4>
                  <div className="text-sm text-purple-700">
                    <div>
                      Group ID: #{service.bookingData.multiGroupId.slice(-6)}
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Note: Status changes will affect this individual booking
                      within the group
                    </div>
                  </div>
                </div>
              )}

            {/* Status History (placeholder for future implementation) */}
            <div className="bg-gray-50/50 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50">
              <h4 className="font-semibold text-gray-800 mb-2">
                Status History
              </h4>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span>
                    Created: {new Date(service.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Status history tracking will be available in future updates
                </div>
              </div>
            </div>

            {/* Pending Changes Summary */}
            {hasChanges && (
              <div className="bg-blue-50/50 backdrop-blur-xl rounded-2xl p-4 border border-blue-200/50">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Pending Changes ({Object.keys(pendingChanges).length})
                </h4>
                <div className="space-y-1 text-sm text-blue-700">
                  {Object.entries(pendingChanges).map(
                    ([statusType, newStatus]) => {
                      const config = statusConfigs[statusType];
                      const currentStatus = currentStatuses[statusType];
                      return (
                        <div
                          key={statusType}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{config.label}:</span>
                          <span>
                            {getStatusDisplay(statusType, currentStatus).label}{" "}
                            → {getStatusDisplay(statusType, newStatus).label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator className="bg-white/20" />

        {/* Action Buttons */}
        <div className="flex justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isUpdating || isLoading}
            className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isUpdating}
              className="bg-white/10 hover:bg-white/20 border-white/20 rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
              disabled={!hasChanges || isUpdating || isLoading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes{" "}
                  {hasChanges && `(${Object.keys(pendingChanges).length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
