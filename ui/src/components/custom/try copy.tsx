import {
  ArrowDownToDot,
  MessageCircleDashed,
  ShoppingBasket,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { gql, useQuery } from "@apollo/client";
import { ghSim } from "./ItemGrid";
import { useRef } from "react";

interface Product {
  id: string;
  name: string;
  price: string;
  commission?: string;
}

export interface ProductInfo {
  quantity: number;
  product: Product[];
}

export interface OrderTrackingData {
  useGetordertracking: {
    orderId: string;
    customerNumber: string;
    deliveryAddress: string;
    estimatedDeliveryDate: string;
    createdAt: string;
    status: string;
    productInfor: ProductInfo[];
  }[];
}

export interface OrderItem {
  id?: string;
  name: string;
  originalPrice: number;
  price: number;
  quantity: number;
  hasPromoDiscount: boolean;
}

export interface PromoPriceData {
  priceWithPromocode: {
    orderId: string;
    items: {
      id: string;
      newPrice: number;
    }[];
  }[];
}

const CHANGE_PRICE_WITH_PROMO_CODE = gql`
  query PriceWithPromocode($orderIDs:[String!]!){
    priceWithPromocode(orderIDs:$orderIDs){
      orderId
      items{
        id
        newPrice
      }
    }
  }
`;

export const GET_ORDER_TRACKING = gql`
  query useGetordertracking($orderId: [String]) {
    useGetordertracking(orderId: $orderId) {
      orderId
      customerNumber
      deliveryAddress
      status
      estimatedDeliveryDate
      createdAt
      productInfor {
        quantity
        product {
          id
          name
          price
          commission
        }
      }
    }
  }
`;

const bgColors = [
  "bg-red-100",
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-gray-100",
];

export default function CardReceipt({
  setNewOrderValue,
  newOrder,
  setActiveTab,
  setSelectedOrderId,
}: {
  setNewOrderValue: (value: boolean) => void;
  newOrder: boolean;
  setActiveTab: (value: string) => void;
  setSelectedOrderId: (id: string | null) => void;
}): JSX.Element {
  const receiptRef = useRef<HTMLDivElement>(null);

  const rawOrderId = localStorage.getItem("foodie_last_order_id");
  const ordId = rawOrderId ? rawOrderId.replace(/^"|"$/g, "").trim() : null;
  const sanitizedOrderId = ordId && ordId.length > 0 ? ordId : null;

  // Fetch order tracking data
  const { 
    data: orderTrackingData, 
    error: orderTrackingError, 
    loading: orderTrackingLoading 
  } = useQuery<OrderTrackingData>(
    GET_ORDER_TRACKING,
    {
      variables: { orderId: sanitizedOrderId },
      skip: !sanitizedOrderId,
    }
  );

  // Fetch promo price data
  const { 
    data: promoData, 
    error: promoError, 
    loading: promoLoading 
  } = useQuery<PromoPriceData>(
    CHANGE_PRICE_WITH_PROMO_CODE,
    {
      variables: { orderIDs: sanitizedOrderId ? [sanitizedOrderId] : [] },
      skip: !sanitizedOrderId,
    }
  );

  if (orderTrackingLoading || promoLoading) return <p>Loading...</p>;
  if (orderTrackingError) return <p>Error loading order details.</p>;
  if (promoError) return <p>Error loading promo prices.</p>;

  const orders = orderTrackingData?.useGetordertracking;
  if (!orders || orders.length === 0) return <p>No order details available.</p>;

  return (
    <div ref={receiptRef} className="w-full max-w-md mx-auto">
      <ScrollArea className="max-h-[400px] overflow-auto mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="w-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Order Receipt
              </h3>
              <h3
                onClick={() => setNewOrderValue(!newOrder)}
                className="text-lg cursor-pointer font-semibold flex items-center gap-[2px] bg-black text-cyan-50 rounded p-2 dark:text-zinc-100"
              >
                <div className="flex flex-col items-center gap-0">
                  <ArrowDownToDot className="w-2 text-white h-2" />
                  <ShoppingBasket className="w-4 h-4 text-white -mt-1" />
                </div>
                <div className="text-sm">New Order</div>
              </h3>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Thank you for your order
            </p>
          </div>

          {/* Loop Through Orders */}
          {orders.map((order, index) => {
            const orderIdShort = order.orderId.slice(0, 5);

            // Extract items and apply promo price changes
            const items: OrderItem[] = order.productInfor.flatMap((info) =>
              info.product.map((product) => {
                // Check if there's a promo price for this product
                const promoItem = promoData?.priceWithPromocode
                  ?.find(promo => promo.orderId === order.orderId)
                  ?.items.find(item => item.id === product.id);

                const originalPrice = parseFloat(product.commission ?? "0");
                const newPrice = promoItem ? promoItem.newPrice : originalPrice;

                return {
                  id: product.id,
                  name: product.name,
                  originalPrice: originalPrice,
                  price: newPrice,
                  quantity: info.quantity,
                  hasPromoDiscount: !!promoItem
                };
              })
            );

            // Calculate original subtotal (before promo)
            const originalSubtotal = items.reduce(
              (sum, item) => sum + item.originalPrice * item.quantity,
              0
            );

            // Calculate new subtotal (after promo)
            const subtotal = items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            );

            const currentHour = new Date().getHours();
            const originalDelivery = currentHour >= 6 && currentHour < 17 ? 7 : 10;
            const delivery = originalDelivery; // Assuming delivery fee doesn't change

            // Calculate totals
            const originalTotal = originalSubtotal + originalDelivery;
            const total = subtotal + delivery;

            // Check if any item has a promo discount
            const hasPromoDiscount = items.some(item => item.hasPromoDiscount);

            const bgColor = bgColors[index % bgColors.length];

            return (
              <div
                key={order.orderId}
                className={`p-6 space-y-6 border-b last:border-b-0 ${bgColor}`}
              >
                {/* Order Info Section */}
                <div className="space-y-4">
                  <div className="space-y-2 flex-col items-start flex">
                    <div className="flex justify-between w-full">
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Order ID: {orderIdShort}
                      </p>
                      <h3
                        onClick={() => {
                          setSelectedOrderId(order.orderId);
                          setActiveTab("message");
                        }}
                        className="text-lg cursor-pointer font-semibold flex items-center gap-[2px] bg-black text-cyan-50 rounded p-2 dark:text-zinc-100"
                      >
                        <div className="flex flex-col items-center gap-0">
                          <MessageCircleDashed
                            className={`w-4 text-white h-4 `}
                          />
                        </div>
                        <div className="text-sm">Message</div>
                      </h3>
                    </div>
                    {/* ... (previous order info remains the same) ... */}
                  </div>
                </div>

                {/* Items Section */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                    Order Items
                  </h4>
                  <div className="space-y-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-600 dark:text-zinc-400">
                            {item.quantity}x
                          </span>
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          {item.hasPromoDiscount && (
                            <span className="text-zinc-600 dark:text-zinc-400 line-through mr-2">
                              {ghSim}{(item.originalPrice * item.quantity).toFixed(2)}
                            </span>
                          )}
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {ghSim}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Section */}
                <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Subtotal
                    </span>
                    <div className="flex flex-col items-end">
                      {hasPromoDiscount && (
                        <span className="text-zinc-600 dark:text-zinc-400 line-through mr-2 text-sm">
                          {ghSim}{originalSubtotal.toFixed(2)}
                        </span>
                      )}
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {ghSim}{subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Delivery Fee
                    </span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {ghSim}{delivery.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-medium pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-900 dark:text-zinc-100">
                      Total
                    </span>
                    <div className="flex flex-col items-end">
                      {hasPromoDiscount && (
                        <span className="text-zinc-600 dark:text-zinc-400 line-through mr-2 text-sm">
                          {ghSim}{originalTotal.toFixed(2)}
                        </span>
                      )}
                      <span className="text-zinc-900 dark:text-zinc-100">
                        {ghSim}{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}