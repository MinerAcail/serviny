import { useState } from "react";
import { ChevronDown, ChevronRight, Package } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { gql, useQuery } from "@apollo/client";
import { ghSim } from "@/components/custom/ItemGrid";

// Process GraphQL data
interface Product {
  id: string;
  name: string;
  price: number;
  commission: number;
  imageUrls: string[];
}

interface Item {
  id: string;
  quantity: number;
  product: Product;
}

interface Order {
  id: string;
  customerNumber: string;
  status: string;
  estimatedDeliveryDate: string | null;
  deliveryAddress: string;

  items: Item[];
  createdAt: string;
  updatedAt: string;
}

interface ProcessedItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl: string | null;
}

interface ProcessedOrder {
  id: string;
  customer: string;
  date: string;
  estimatedDeliveryDate: string;
  deliveryAddress: string;

  total: number;
  status: string;
  items: ProcessedItem[];
}
const GET_VENDOR_ORDERS = gql`
  query GetAssignedOrders {
    getAssignedOrders {
      id
      customerNumber
      status
      estimatedDeliveryDate
      deliveryAddress
      items {
        id
        quantity
        product {
          id
          name
          price
          imageUrls
          commission
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export default function OrderManagement() {
  const { data, loading, error } = useQuery(GET_VENDOR_ORDERS, {
    pollInterval: 9000,
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const markAsDelivered = (orderId: string) => {
    // In a real application, you would call a mutation here to update the status on the server
    console.log(`Marking order ${orderId} as delivered`);
  };
  // Display loading state
  if (loading) {
    return (
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Loading orders data...</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display error state
  if (error) {
    return (
      <Card className="mt-10">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Error loading orders</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex justify-center">
            <p className="text-red-500">Error: {error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const orders: ProcessedOrder[] =
    data?.getAssignedOrders?.map((order: Order) => {
      // Calculate order total from items
      const total = order.items.reduce((sum, item) => {
        return sum + item.quantity * (item?.product?.commission ?? 0);
      }, 0);

      // Format date (from ISO string to readable format)
      const createdDate = new Date(order.createdAt).toLocaleDateString();
      const estimatedDeliveryDate = order.estimatedDeliveryDate
        ? order.estimatedDeliveryDate
        : "Not specified";

      return {
        id: order.id,
        customer: order.customerNumber,
        deliveryAddress: order.deliveryAddress,
        date: createdDate,
        estimatedDeliveryDate: estimatedDeliveryDate,
        total: total,
        status: order.status || "Pending",
        items: order.items.map((item) => ({
          id: item.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.commission,
          imageUrl: item.product.imageUrls?.[0] || null,
        })),
      };
    }) || [];

  // Mobile view
  if (isMobile) {
    return (
      <Card className="my-20">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Manage customer orders</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <Collapsible
                  open={expandedOrder === order.id}
                  onOpenChange={() => toggleOrderDetails(order.id)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{order.id.slice(0, 5)}</h3>
                        <p className="text-sm text-muted-foreground">
                          Customer: {order.customer}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Location: {order.deliveryAddress}
                        </p>
                      </div>
                      <Badge
                        variant={
                          order.status.toLowerCase() === "delivered"
                            ? "outline"
                            : "default"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>

                    <OrderCostSummary order={order} />
                    <div className="mt-3 flex items-center justify-between">
                      <CollapsibleTrigger asChild>
                        <Button size="sm" variant="outline" className="w-1/2">
                          {expandedOrder === order.id
                            ? "Hide Details"
                            : "View Items"}
                          {expandedOrder === order.id ? (
                            <ChevronDown className="h-4 w-4 ml-1" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-1" />
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      {order.status.toLowerCase() !== "delivered" && (
                        <Button
                          size="sm"
                          className="w-1/2 ml-2"
                          onClick={() => markAsDelivered(order.id)}
                        >
                          <Package className="h-4 w-4 mr-1" /> Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>

                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 bg-muted/30">
                      <h4 className="font-medium mb-2">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <div className="flex items-center">
                              {item.imageUrl && (
                                <div className="w-10 h-10 mr-2 rounded overflow-hidden">
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × {ghSim}
                                  {item.price}
                                </p>
                              </div>
                            </div>
                            <p className="font-bold">
                              {ghSim}
                              {item.quantity * item.price}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop view
  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
        <CardDescription>View and manage customer orders</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Est. Delivery</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <Collapsible
                key={order.id}
                open={expandedOrder === order.id}
                onOpenChange={() => toggleOrderDetails(order.id)}
              >
                <TableRow>
                  <TableCell>{order.id.slice(0, 5)}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>{order.estimatedDeliveryDate}</TableCell>
                  <TableCell>
                    {ghSim}
                    {order.total}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        order.status.toLowerCase() === "delivered"
                          ? "outline"
                          : "default"
                      }
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <CollapsibleTrigger asChild>
                        <Button size="sm" variant="outline">
                          Details <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </CollapsibleTrigger>
                      {order.status.toLowerCase() !== "delivered" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsDelivered(order.id)}
                        >
                          <Package className="h-4 w-4 mr-1" /> Mark Delivered
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <div className="p-4 bg-muted/50">
                        <h4 className="font-medium mb-2">Order Items</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead>Quantity</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {order.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div className="flex items-center">
                                    {item.imageUrl && (
                                      <div className="w-8 h-8 mr-2 rounded overflow-hidden">
                                        <img
                                          src={item.imageUrl}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                    {item.name}
                                  </div>
                                </TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  {ghSim}
                                  {item.price}
                                </TableCell>
                                <TableCell>
                                  {ghSim}
                                  {item.quantity * item.price}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}





import {  Truck, Receipt } from 'lucide-react';

const OrderCostSummary = ({ order }: { order: ProcessedOrder }) => {
  // Calculate delivery fee based on time of day
  const isDaytime = new Date().getHours() >= 6 && new Date().getHours() < 17;
  const deliveryFee = isDaytime ? 7 : 10;
  const totalCost = order.total + deliveryFee;
  
  return (
    <Card className="w-full mt-4 bg-white shadow-md">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Items Total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Items Total</span>
            </div>
            <span className="font-medium text-right">{ghSim} {order.total.toFixed(2)}</span>
          </div>
          
          {/* Delivery Cost */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-600" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">Delivery Fee</span>
                <span className="text-xs text-gray-500">
                  {isDaytime ? "Day Rate (6AM-5PM)" : "Night Rate (5PM-10PM)"}
                </span>
              </div>
            </div>
            <span className="font-medium text-right">{ghSim} {deliveryFee.toFixed(2)}</span>
          </div>
          
          {/* Estimated Delivery */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
            <span className="text-xs text-gray-600">Estimated Delivery:</span>
            <span className="text-xs font-medium">{order.estimatedDeliveryDate}</span>
          </div>
          
          <Separator className="my-2" />
          
          {/* Total Cost */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-gray-900">TOTAL COST</span>
            </div>
            <span className="text-lg font-bold text-emerald-700">{ghSim} {totalCost.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
