import { useEffect, useState, useRef, useCallback } from "react";
import { CheckCircle,  Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOrderTracking } from "@/hooks/orderTrackingContext";
import { useCart } from "@/hooks/CartContext";
import { useMutation, gql } from "@apollo/client";
import { useIsMobile } from "@/hooks/use-mobile";

// Types updated to match API structure
interface APIProduct {
  name: string;
  price: string;
  id: string;
  // Other properties from your API
}

interface ProductInfo {
  product: APIProduct[];
  quantity?: number;
  // Other properties from your API
}

interface OrderTimer {
  id: string;
  initialTime: number;
  timeLeft: number;
  itemName: string;
  orderItems: ProductInfo[];
}

const UPDATEORDER = gql`
  mutation UpdateOrderbyUser($orderID: String) {
    updateOrderbyUser(orderID: $orderID)
  }
`;

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

// Static timer display component (no internal countdown logic)
const TimerDisplay = ({
  config,
  timeLeft,
  onEditOrder,
}: {
  config: {
    id: string;
    initialTime: number;
    itemName: string;
    orderItems: ProductInfo[];
  };
  timeLeft: number;
  onEditOrder: (orderId: string, orderItems: ProductInfo[]) => void;
}) => {
  const { id, initialTime, orderItems } = config;
  const isComplete = timeLeft <= 0;
  const progress = (timeLeft / initialTime) * 100;

  return (
    <Card
      className={`w-full rounded-lg shadow-md border-l-4 ${
        isComplete
          ? "border-l-green-500 bg-white"
          : "border-l-amber-500 bg-white"
      }`}
    >
      <div className="p-4">
        {/* Header section with Order ID and status */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-500">
            Order #{id.slice(0, 5) || "Order"}
          </span>
          <div
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              isComplete
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isComplete ? "Completed" : "In Progress"}
          </div>
        </div>

        {/* Main content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center rounded-full w-10 h-10 ${
                isComplete ? "bg-green-100" : "bg-amber-50"
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                  onClick={() => onEditOrder(id, orderItems)}
                >
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex flex-col">
              <span
                className={`font-bold text-sm ${
                  isComplete ? "text-green-600" : "text-gray-800"
                }`}
              >
                {isComplete ? "Order Complete!" : formatTime(timeLeft)}
              </span>
              {!isComplete && (
                <span className="text-xs text-gray-500">
                  {Math.round(progress)}% complete
                </span>
              )}
            </div>
          </div>

          {/* Action buttons for in-progress orders */}
          {!isComplete && (
            <div className="flex items-center gap-3">
              <Progress
                value={progress}
                className="h-2 w-24 bg-gray-100"
                // indicatorClassName="bg-amber-500"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const MultipleCountdown = () => {
  const { addToCart } = useCart();
  const { data } = useOrderTracking();
  const [updateOrder] = useMutation(UPDATEORDER);
  const [timers, setTimers] = useState<OrderTimer[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
const isMobile = useIsMobile();
  useEffect(() => {
    if (!data?.useGetordertracking) return;

    const now = Date.now();
    setTimers(
      data.useGetordertracking.map((order) => {
        const createdAt = new Date(order.createdAt).getTime();
        const timePassed = Math.floor((now - createdAt) / 1000);
        const timeRemaining = Math.max(300 - timePassed, 0);
        
        return {
          id: order.orderId,
          initialTime: 300, // Always 5 minutes (300 seconds)
          timeLeft: timeRemaining, // Initial time left
          itemName: order.productInfor?.[0]?.product[0]?.name || "Order",
          orderItems: order.productInfor || [],
        };
      })
    );
  }, [data]);

  // Global countdown logic that runs regardless of dropdown state
  useEffect(() => {
    if (timers.length === 0) return;

    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((timer) => ({
          ...timer,
          timeLeft: timer.timeLeft > 0 ? timer.timeLeft - 1 : 0,
        }))
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [timers.length]);

  const handleEditOrder = async (
    orderId: string,
    orderItems: ProductInfo[]
  ) => {
    orderItems.forEach((item) => {
      const cartItem = {
        id: item.product[0].id,
        name: item.product[0].name,
        price: parseFloat(item.product[0].price),
        categories: [], // Add appropriate categories if available
        imageUrls: [], // Add appropriate image URLs if available
      };
      addToCart(cartItem);
    });

    setTimers((prevTimers) =>
      prevTimers.filter((order) => order.id !== orderId)
    );

    await updateOrder({ variables: { orderID: orderId } });
  };

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsExpanded(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);
  const position = isMobile ? "left-2 top-2" : "right-18 top-20";
  return (
    <div className={`fixed  ${position} z-50`} ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-10 h-10 rounded-full bg-emerald-100 border-green-200"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <Timer className="h-4 w-4 text-green-600" />
      </Button>
      {isExpanded && (
        <div className="absolute top-12 left-0 w-80 bg-white rounded-lg shadow-lg border border-green-100 p-2 max-h-64 overflow-y-auto">
          {timers.length > 0 ? (
            timers.map((timer) => (
              <TimerDisplay
                key={timer.id}
                config={{
                  id: timer.id,
                  initialTime: timer.initialTime,
                  itemName: timer.itemName,
                  orderItems: timer.orderItems,
                }}
                timeLeft={timer.timeLeft}
                onEditOrder={handleEditOrder}
              />
            ))
          ) : (
            <p className="text-center text-gray-500">
              No active orders to track.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MultipleCountdown;
