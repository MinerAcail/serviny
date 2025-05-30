// OrderManagementSystem.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  MapPin,
  Phone,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Search,
  ArrowLeft,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  GET_ALL_ORDER_ITEMS_BY_PRODUCT_ID_DELIVERY,
  getStatusColor,
  getStatusIcon,
  calculateTotalAmount,
  getTotalItemsCount,
  formatDate,
  formatTime,
  getEstimatedDeliveryTime,
  type OrderData,

} from "./types";
import { RiderTrackingMap } from "./RiderTrackingMap";

// Mutation for updating order status
const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $status: String!) {
    updateOrderStatus(orderId: $orderId, status: $status) {
      success
      message
    }
  }
`;

// Mutation for assigning rider
const ASSIGN_RIDER = gql`
  mutation AssignRider($orderId: String!, $riderId: String!) {
    assignRider(orderId: $orderId, riderId: $riderId) {
      success
      message
    }
  }
`;
const maptilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;

export default function OrderManagementSystem() {
  const { loading, error, data, refetch } = useQuery(
    GET_ALL_ORDER_ITEMS_BY_PRODUCT_ID_DELIVERY,
    {
      pollInterval: 30000, // Poll every 30 seconds for real-time updates
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    }
  );

  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, {
    refetchQueries: [GET_ALL_ORDER_ITEMS_BY_PRODUCT_ID_DELIVERY],
    awaitRefetchQueries: true,
  });

  const [assignRider] = useMutation(ASSIGN_RIDER, {
    refetchQueries: [GET_ALL_ORDER_ITEMS_BY_PRODUCT_ID_DELIVERY],
    awaitRefetchQueries: true,
  });

  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState(false);

  const orders: OrderData[] = data?.getAllOrderItemsByProductIdDelivery || [];

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      setUpdating(true);
      const result = await updateOrderStatus({
        variables: { orderId, status: newStatus.toUpperCase() },
      });

      if (result.data?.updateOrderStatus?.success) {
        // Optimistically update the selected order
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder({
            ...selectedOrder,
            status: newStatus.toUpperCase(),
          });
        }
      } else {
        console.error(
          "Failed to update order status:",
          result.data?.updateOrderStatus?.message
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      setUpdating(true);
      const result = await assignRider({
        variables: { orderId, riderId },
      });

      if (!result.data?.assignRider?.success) {
        console.error(
          "Failed to assign rider:",
          result.data?.assignRider?.message
        );
      }
    } catch (error) {
      console.error("Error assigning rider:", error);
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" ||
      order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendor.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusStats = () => {
    const stats = orders.reduce((acc, order) => {
      const status = order.status.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: orders.length,
      pending: stats.pending || 0,
      preparing: stats.preparing || 0,
      out_for_delivery: stats.out_for_delivery || 0,
      delivered: stats.delivered || 0,
    };
  };

  const statusStats = getStatusStats();

  // Render status icon component
  const renderStatusIcon = (status: string) => {
    const iconName = getStatusIcon(status);
    const iconProps = { className: "w-4 h-4" };

    switch (iconName) {
      case "Clock":
        return <Clock {...iconProps} />;
      case "CheckCircle":
        return <CheckCircle {...iconProps} />;
      case "Package":
        return <Package {...iconProps} />;
      case "Truck":
        return <Truck {...iconProps} />;
      case "XCircle":
        return <XCircle {...iconProps} />;
      default:
        return <AlertCircle {...iconProps} />;
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Failed to load orders
          </h3>
          <p className="text-gray-600 mb-4 text-sm">{error.message}</p>
          <Button onClick={() => refetch()} className="rounded-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-20">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-500">
                {statusStats.total} total • {statusStats.pending} pending •{" "}
                {statusStats.delivered} delivered
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="rounded-full"
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders, customers, or vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-0 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Status Pills - Horizontal Scroll */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <ScrollArea className="w-full">
          <div className="flex space-x-2 pb-1">
            {[
              { key: "all", label: "All", count: statusStats.total },
              { key: "pending", label: "Pending", count: statusStats.pending },
              {
                key: "preparing",
                label: "Preparing",
                count: statusStats.preparing,
              },
              {
                key: "out_for_delivery",
                label: "Out for Delivery",
                count: statusStats.out_for_delivery,
              },
              {
                key: "delivered",
                label: "Delivered",
                count: statusStats.delivered,
              },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center space-x-1 ${
                  statusFilter === status.key
                    ? "bg-blue-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{status.label}</span>
                {status.count > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      statusFilter === status.key
                        ? "bg-white/20"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {status.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Orders List */}
      <div className="px-4 py-4 space-y-4 ">
        {filteredOrders.map((order) => (
          <Card
            key={order.orderId}
            className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md"
            onClick={() => {
              setSelectedOrder(order);
              setShowOrderDetails(true);
            }}
          >
            <CardContent className="p-0">
              {/* Order Header */}
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{order.orderId.slice(-6)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`px-3 py-1 rounded-full ${getStatusColor(
                        order.status
                      )} text-white flex items-center space-x-1`}
                    >
                      {renderStatusIcon(order.status)}
                      <span className="text-xs font-medium capitalize">
                        {order.status.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                      {order.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {order.customer.name}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {order.order.deliveryAddress.split(",")[0]}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="bg-gray-50 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Items</p>
                          <p className="text-sm font-medium">
                            {getTotalItemsCount(order.productInfor)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="text-sm font-semibold">
                            GH₵
                            {calculateTotalAmount(
                              order.productInfor,
                              order.deliveryMetaData
                            ).toFixed(2)}
                          </p>
                          {order.deliveryMetaData && (
                            <p className="text-xs text-gray-400">
                              +GH₵{order.deliveryMetaData.price.toFixed(2)}{" "}
                              delivery
                            </p>
                          )}
                        </div>
                        {order.rider && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Rider</p>
                            <p className="text-sm font-medium">
                              {order.rider.name.split(" ")[0]}
                            </p>
                          </div>
                        )}
                        {order.deliveryMetaData && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Zone</p>
                            <p className="text-sm font-medium">
                              {order.deliveryMetaData.zone}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">ETA</p>
                        <p className="text-sm font-medium">
                          {order.deliveryMetaData
                            ? formatTime(
                                getEstimatedDeliveryTime(
                                  order.createdAt,
                                  order.deliveryMetaData
                                ).toISOString()
                              )
                            : formatTime(
                                getEstimatedDeliveryTime(
                                  order.createdAt
                                ).toISOString()
                              )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Details Sheet */}
      <Sheet open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <SheetHeader className="text-left">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Order Details</h2>
                {selectedOrder && (
                  <p className="text-sm text-gray-500">
                    #{selectedOrder.orderId.slice(-6)}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOrderDetails(false)}
                className="h-8 w-8 p-0 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          {selectedOrder && (
            <ScrollArea className="h-full mt-6">
              <div className="space-y-6 pb-20">
                {/* Order Header */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-lg font-semibold">
                        #{selectedOrder.orderId.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedOrder.createdAt)}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full ${getStatusColor(
                        selectedOrder.status
                      )} text-white flex items-center space-x-1`}
                    >
                      {renderStatusIcon(selectedOrder.status)}
                      <span className="text-sm font-medium capitalize">
                        {selectedOrder.status.toLowerCase().replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Customer</h3>
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                          {selectedOrder.customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedOrder.customer.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedOrder.customer.number}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">
                          {selectedOrder.customer.number}
                        </span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-sm">
                          {selectedOrder.order.deliveryAddress}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                    {selectedOrder.productInfor.map((productInfo, index) => (
                      <div
                        key={`${productInfo.product[0]?.id}-${index}`}
                        className={`p-4 flex items-center justify-between ${
                          index < selectedOrder.productInfor.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {productInfo.product[0]?.name ||
                                "Unknown Product"}
                            </p>
                            <p className="text-sm text-gray-500">
                              Qty: {productInfo.quantity}
                            </p>
                            <p className="text-xs text-gray-400">
                              GH₵{productInfo.product[0]?.price || "0"} each
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900">
                          GH₵
                          {(
                            parseFloat(productInfo.product[0]?.price || "0") *
                            productInfo.quantity
                          ).toFixed(2)}
                        </p>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50 flex items-center justify-between">
                      <p className="font-semibold text-gray-900">Total</p>
                      <p className="text-xl font-bold text-gray-900">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              Zone {selectedOrder?.deliveryMetaData?.zone}{" "}
                              Delivery Fee
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              GH₵
                              {selectedOrder?.deliveryMetaData?.price.toFixed(
                                2
                              )}
                            </p>
                          </div>
                        </div>
                        GH₵
                        {calculateTotalAmount(
                          selectedOrder.productInfor
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rider Section */}
                {selectedOrder.rider && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">Assigned Rider</h3>
                      <Dialog
                        open={showMapDialog}
                        onOpenChange={setShowMapDialog}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" className="rounded-full">
                            <MapPin className="w-4 h-4 mr-2" />
                            Track
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[95vw] max-h-[90vh] rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Live Tracking</DialogTitle>
                          </DialogHeader>
                          <RiderTrackingMap
                            order={selectedOrder}
                            maptilerApiKey={maptilerApiKey}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-purple-100 text-purple-600 font-medium">
                            {selectedOrder.rider.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {selectedOrder.rider.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {selectedOrder.rider.location}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">
                            {selectedOrder.rider.number}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions Section */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Update Status
                    </label>
                    <Select
                      value={selectedOrder.status.toLowerCase()}
                      onValueChange={(value) =>
                        handleUpdateOrderStatus(selectedOrder.orderId, value)
                      }
                      disabled={updating}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="preparing">Preparing</SelectItem>
                        <SelectItem value="out_for_delivery">
                          Out for Delivery
                        </SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Note: Uncomment this section if you have a list of available riders */}
                  {/*
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Assign Rider</label>
                    <Select
                      value={selectedOrder.rider?.id || ""}
                      onValueChange={(value) => handleAssignRider(selectedOrder.orderId, value)}
                      disabled={updating}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-gray-50">
                        <SelectValue placeholder="Select a rider" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {availableRiders.map((rider) => (
                          <SelectItem key={rider.id} value={rider.id}>
                            <div className="flex items-center space-x-2">
                              <span>{rider.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  */}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {/* Empty State */}
      {filteredOrders.length === 0 && !loading && (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No orders found
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Orders will appear here when they are placed"}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="rounded-full"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Loading indicator for polling updates */}
      {loading && orders.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-2 border">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}
