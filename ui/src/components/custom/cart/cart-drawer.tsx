"use client";

import { X, Minus, Plus, ShoppingCart } from "lucide-react";
import { Order, OrderItemInput, useCart } from "./cart-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatPrice, getImageUrl } from "@/components/global/formatPrice";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { useProfileUpdate } from "@/middleware/context/authContext";

export const CREATE_ORDER_ITEMS = gql`
  mutation CreateOrderItems($input: [OrderInput!]!) {
    createOrderItems(input: $input) {
      id
      userId
      status
      estimatedDeliveryDate
      createdAt
      items {
        id
        productId
        quantity
        itemType
        product {
          id
          name
          price
          imageUrls
        }
      }
    }
  }
`;

export function CartDrawer() {
  let { serviceId: vendorId } = useParams<{
    serviceId: string;
  }>();
  const { firstProfileId } = useProfileUpdate(null);

  vendorId = firstProfileId ?? vendorId;
    const localServiceId = localStorage.getItem("serviceId");
  vendorId = vendorId ?? localServiceId ?? "";

  console.log("Vendor ID in CartDrawer:", vendorId);
  

  const {
    items,
    removeItem,
    updateQuantity,
    total,
    itemCount,
    isOpen,
    setIsOpen,
    clearCart,
  } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const [createOrderItems, { loading }] = useMutation<
    { createOrderItems: Order },
    { input: OrderItemInput[] }
  >(CREATE_ORDER_ITEMS, {
    onError: (error) => {
      console.error("Order creation failed:", error);
      toast.error(`Order failed: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setIsProcessing(true);

    try {
      const orderInputs: OrderItemInput[] = items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        itemType: item.selectedItemType || "",
      }));

      console.log("Sending order inputs:", orderInputs);

      const result = await createOrderItems({
        variables: {
          input: orderInputs,
        },
      });

      // Now you can access the result here
      console.log(
        "Order created successfully:",
        result?.data?.createOrderItems
      );
      toast.success(
        `Order created successfully! Order ID: ${result?.data?.createOrderItems.id}`
      );

      clearCart();
      setIsProcessing(false);
      setIsOpen(false);


      window.location.href = `/dd/${vendorId}/${result?.data?.createOrderItems.id}?order=true`;

    } catch (err) {
      console.error("Error creating order:", err);
      toast.error("Failed to create order. Please try again.");
      setIsProcessing(false);
    }
  };
  const handleClearCart = () => {
    clearCart();
    toast.success("Cart cleared");
  };

  const handleRemoveItem = (itemId: string, itemName: string) => {
    removeItem(itemId);
    toast.success(`${itemName} removed from cart`);
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader className="px-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? "item" : "items"})
              </span>
            </SheetTitle>
            <SheetClose className="rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-1">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add items to your cart to see them here
            </p>
            <SheetClose asChild>
              <Button variant="outline">Continue Shopping</Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-1 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 py-2 border-b">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                      <img
                        src={getImageUrl(item.imageUrl) || "/placeholder.svg"}
                        alt={item.name}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                          <h4 className="font-medium text-sm truncate">
                            {/* Display the base product name without the item type suffix */}
                            {item.name.includes(" (")
                              ? item.name.split(" (")[0]
                              : item.name}
                          </h4>
                          {/* Display the selected item type as a badge if it exists */}
                          {item.selectedItemType && (
                            <Badge
                              variant="secondary"
                              className="text-xs w-fit mt-1"
                            >
                              {item.selectedItemType}
                            </Badge>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id, item.name)}
                          className="text-muted-foreground hover:text-foreground flex-shrink-0"
                          aria-label="Remove item"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-sm text-primary font-medium mt-1">
                        {formatPrice(item.price)}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                            <span className="sr-only">Decrease quantity</span>
                          </Button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-none"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <Plus className="h-3 w-3" />
                            <span className="sr-only">Increase quantity</span>
                          </Button>
                        </div>
                        <div className="text-sm font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-lg font-semibold">
                  {formatPrice(total)}
                </span>
              </div>

              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  disabled={loading || isProcessing || items.length === 0}
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                >
                  {loading || isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </div>
                  ) : (
                    "Checkout"
                  )}
                </Button>
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClearCart}
                    disabled={loading || isProcessing}
                  >
                    Clear Cart
                  </Button>
                  <SheetClose asChild>
                    <Button variant="outline" className="flex-1">
                      Continue Shopping
                    </Button>
                  </SheetClose>
                </div>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
