import { useState, useMemo, ReactNode, useEffect } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, Package, Clock, Check } from "lucide-react";
import { Link } from "react-router";
// import { useAuth } from "@/middleware/context/authContext";

const GET_ALL_ORDER_ITEMS = gql`
  query GetAllOrderItemsByProductIDDelivery {
    getAllOrderItemsByProductIdDelivery {
      orderId
      productInfor {
        product {
          id
          name
          price
          imageUrls
        }
        quantity
      }
      customerNumber
      deliveryAddress
      status
      estimatedDeliveryDate
    }
  }
`;
const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String, $status: String!) {
    updateOrderStatus(orderID: $orderId, status: $status)
  }
`;
interface Product {
  id: string;
  name: string;
  price: number;
  imageUrls: string[];
}

interface ProductInfo {
  product: Product[];
  quantity: number;
  isVerified?: boolean;
}

interface OrderData {
  orderId: string;
  productInfor: ProductInfo[];
  customerNumber: string;
  deliveryAddress: string;
  status: string;
  estimatedDeliveryDate: string;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  BLOCKED: "bg-red-100 text-red-800",
};

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: Package,
  COMPLETED: Check,
  BLOCKED: X,
};

function OrderItemCard({
  item,
  onVerify,
  isVerified,
}: {
  item: ProductInfo;
  onVerify: () => void;
  isVerified: boolean;
}) {
  return (
    <div
      onClick={onVerify}
      className={`${
        isVerified
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      } rounded-lg p-4 flex items-center justify-between gap-4 border-2 cursor-pointer transition-all hover:shadow-sm`}
    >
      <div className="flex items-center gap-3">
        <img
          src={item.product[0].imageUrls[0] || "/api/placeholder/80/80"}
          //   src={ "/api/placeholder/80/80"}
          alt={item.product[0].name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div
          className={`${
            isVerified ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
          } w-6 h-6 rounded-full flex items-center justify-center transition-colors`}
        >
          <Check className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span
            className={`font-medium ${
              isVerified ? "text-green-700" : "text-gray-700"
            }`}
          >
            {item.product[0].name}
          </span>
          <span className="text-sm text-gray-500">
            Quantity: {item.quantity}
          </span>
        </div>
      </div>
      <div className="text-right">
        <div className="font-medium">${item.product[0].price}</div>
        <div className="text-sm text-gray-500">
          Total: ${(item.product[0].price * item.quantity).toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function OrderDetailsDialog({
  order,
  onVerifyItem,
  children,
}: {
  order: OrderData;
  children: ReactNode;
  onVerifyItem: (orderId: string, itemIndex: number) => void;
}) {
  const StatusIcon =
    statusIcons[order.status as keyof typeof statusIcons] || Package;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className="w-5 h-5" />
            Order #{order.orderId.slice(0, 5)}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[order.status as keyof typeof statusColors]
              }`}
            >
              {order.status}
            </div>
            <p className="text-gray-600">
              <span className="font-medium">Customer:</span>{" "}
              {order.customerNumber}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Delivery Address:</span>{" "}
              {order.deliveryAddress}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Estimated Delivery:</span>{" "}
              {order.estimatedDeliveryDate}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-lg">
                Order Items ({order.productInfor.length})
              </h3>
              <div className="text-sm text-gray-500">
                {order.productInfor.filter((item) => item.isVerified).length} of{" "}
                {order.productInfor.length} verified
              </div>
            </div>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {order.productInfor.map((item, index) => (
                  <OrderItemCard
                    key={item.product[0].id}
                    item={item}
                    isVerified={item.isVerified || false}
                    onVerify={() => onVerifyItem(order.orderId, index)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({
  order,
  onVerifyItem,
}: {
  order: OrderData;
  onVerifyItem: (orderId: string, itemIndex: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const StatusIcon =
    statusIcons[order.status as keyof typeof statusIcons] || Package;
  const displayItems = expanded
    ? order.productInfor
    : order.productInfor.slice(0, 3);
  const hasMoreItems = order.productInfor.length > 3;
  const verifiedCount = order.productInfor.filter(
    (item) => item.isVerified
  ).length;

  return (
    <OrderDetailsDialog order={order} onVerifyItem={onVerifyItem}>
      <div className="bg-white shadow-sm hover:shadow-md rounded-lg p-6 transition-all cursor-pointer border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <StatusIcon className="w-5 h-5" />
              Order #{order.orderId.slice(0, 5)}
            </h2>
            <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[order.status as keyof typeof statusColors]
              }`}
            >
              {order.status}
            </div>
            <div className="text-sm text-gray-500">
              {verifiedCount} of {order.productInfor.length} verified
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">
            Items ({order.productInfor.length})
          </h3>
          <ul className="space-y-1">
            {displayItems.map((item) => (
              <li
                key={item.product[0].id}
                className="text-sm text-gray-600 flex items-center gap-2"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.isVerified ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                {item.product[0].name} (x{item.quantity})
              </li>
            ))}
          </ul>
          {hasMoreItems && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {expanded
                ? "Show less"
                : `Show ${order.productInfor.length - 3} more items`}
            </button>
          )}
        </div>
      </div>
    </OrderDetailsDialog>
  );
}

export default function DeliveryList() {
  const { loading, error, data } = useQuery(GET_ALL_ORDER_ITEMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderData, setOrderData] = useState<OrderData[]>([]);
  // const { isAuthenticated } = useAuth();


  // Update orderData when query data is received
  useEffect(() => {
    if (data?.getAllOrderItemsByProductIdDelivery) {
      setOrderData(data.getAllOrderItemsByProductIdDelivery);
    }
  }, [data]);
  const [updateOrderStatus] = useMutation(UPDATE_ORDER_STATUS, {
    refetchQueries: ["getAllOrderItemsByProductIdDelivery"],
  }); 
  const handleVerifyItem = async (orderId: string, itemIndex: number) => {
    setOrderData((prevOrders) =>
      prevOrders.map((order) => {
        if (order.orderId === orderId) {
          const newProductInfo = [...order.productInfor];
          newProductInfo[itemIndex] = {
            ...newProductInfo[itemIndex],
            isVerified: !newProductInfo[itemIndex].isVerified,
          };

          // Get the updated order with new verification status
          const updatedOrder = { ...order, productInfor: newProductInfo };
          
          // Check if all items are verified
          const allItemsVerified = updatedOrder.productInfor.every(
            (item) => item.isVerified
          );

          // If all items are verified and status isn't already COMPLETED,
          // update the order status
          if (allItemsVerified && order.status !== "COMPLETED") {
            updateOrderStatus({
              variables: {
                orderId: order.orderId,
                status: "COMPLETED"
              }
            });
          }

          return updatedOrder;
        }
        return order;
      })
    );
  };

  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orderData;
    const lowercaseQuery = searchQuery.toLowerCase();
    return orderData.filter(
      (order) =>
        order.orderId.toLowerCase().includes(lowercaseQuery) ||
        order.deliveryAddress.toLowerCase().includes(lowercaseQuery) ||
        order.customerNumber.toLowerCase().includes(lowercaseQuery) ||
        order.productInfor.some((item) =>
          item.product[0].name.toLowerCase().includes(lowercaseQuery)
        )
    );
  }, [searchQuery, orderData]);

  if (loading) return <div className="p-4">Loading orders...</div>;
  if (error)
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  // console.log("isAuthenticated",isAuthenticated);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link
            to="/"
            className="text-xl font-bold bgcontainer bg-clip-text text-transparent"
          >
            serviny
          </Link>
        </div>

        <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-4 -mx-4 px-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by order ID, address, or item name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No orders found
            </h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your search terms
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                onVerifyItem={handleVerifyItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
