import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "../ui/card";
import { ghSim } from "./ItemGrid";
import CardReceipt, { GET_ORDER_TRACKING } from "./try";
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import locations from "./sortCategroy/cat/data";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface HostelDetails {
  hostelName: string;
  phoneNumber: string;
}

export interface CartSidebarProps {
  cart: Item[];
  hostelDetails: HostelDetails;
  setHostelDetails: React.Dispatch<React.SetStateAction<HostelDetails>>;
  removeFromCart: (index: number) => void;
  placeOrder: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  hostelDetails,
  setHostelDetails,
  removeFromCart,
  placeOrder,
}) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const rawOrderId = localStorage.getItem("foodie_last_order_id");
  const orderId = rawOrderId ? rawOrderId.replace(/^"|"$/g, "").trim() : null;
  const sanitizedOrderId = orderId && orderId.length > 0 ? orderId : null;
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [newOrder, setNewOrder] = useState<boolean | null>(
    localStorage.getItem("new_order")
      ? JSON.parse(localStorage.getItem("new_order") as string)
      : null
  );

  // Function to update newOrder state when localStorage changes
  const updateNewOrderFromStorage = () => {
    const storedNewOrder = localStorage.getItem("new_order")
      ? JSON.parse(localStorage.getItem("new_order") as string)
      : null;
    setNewOrder(storedNewOrder);
  };

  // Listen for storage events (when localStorage changes in other tabs/windows)
  useEffect(() => {
    window.addEventListener("storage", updateNewOrderFromStorage);
    return () => {
      window.removeEventListener("storage", updateNewOrderFromStorage);
    };
  }, []);

  // Custom function to set new_order that updates both localStorage and state
  const setNewOrderValue = (value: boolean) => {
    localStorage.setItem("new_order", JSON.stringify(value));
    setNewOrder(value);
  };

  const onSuggestHandler = (text: string) => {
    setText(text);
    setSuggestions([]);
    setHostelDetails((prev) => ({ ...prev, hostelName: text }));
  };

  const onChangeHandler = (text: string) => {
    let matches: string[] = [];
    if (text.length > 0) {
      matches = locations.flatMap((location) =>
        location.areas.urban
          .map((item) => item.name)
          .filter((name) => name.toLowerCase().startsWith(text.toLowerCase()))
      );
    }
    setSuggestions(matches);
    setText(text);
    setHostelDetails((prev) => ({ ...prev, hostelName: text }));
  };

  const { data, error, loading } = useQuery(GET_ORDER_TRACKING, {
    variables: { orderId: sanitizedOrderId },
    skip: !sanitizedOrderId,
  });

  const OrderTimestamp = localStorage.getItem("lastOrderTimestamp");

  useEffect(() => {
    if (loading) return;

    if (error) {
      console.error("GraphQL Error:", error.message);
      if (error.message.includes("no tracking cookie found")) {
        setShowReceipt(false);
      }
    } else if (data) {
      const currentTime = new Date().getTime();
      const orderTime = OrderTimestamp ? new Date(OrderTimestamp).getTime() : 0;
      const timeDifference = currentTime - orderTime;
      const oneHour = 60 * 60 * 1000;

      if (timeDifference > oneHour) {
        setShowReceipt(false);
      } else {
        setShowReceipt(true);
      }
    }

    const timer = setTimeout(() => {
      if (!sanitizedOrderId) {
        setShowReceipt(false);
        return;
      }
      if (!error) {
        setShowReceipt(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [loading, error, data, OrderTimestamp]);

  // console.log("newOrder", newOrder);
  // console.log("data", data);
  return (
    <>
      {!showReceipt ? (
        <>
          {newOrder === false && (
            <CartComponent
              cart={cart}
              text={text}
              ghSim={ghSim}
              hostelDetails={hostelDetails}
              onChangeHandler={onChangeHandler}
              onSuggestHandler={onSuggestHandler}
              placeOrder={placeOrder}
              removeFromCart={removeFromCart}
              setHostelDetails={setHostelDetails}
              setSuggestions={setSuggestions}
              suggestions={suggestions}
              newOrder={newOrder}
              setNewOrderValue={setNewOrderValue}
              showReceipt={showReceipt}
            />
          )}
          {newOrder === null && (
            <>
              <CartComponent
                cart={cart}
                text={text}
                ghSim={ghSim}
                hostelDetails={hostelDetails}
                onChangeHandler={onChangeHandler}
                onSuggestHandler={onSuggestHandler}
                placeOrder={placeOrder}
                removeFromCart={removeFromCart}
                setHostelDetails={setHostelDetails}
                setSuggestions={setSuggestions}
                suggestions={suggestions}
                newOrder={newOrder}
                setNewOrderValue={setNewOrderValue}
                showReceipt={showReceipt}
              />
            </>
          )}
          {newOrder === true && (
            <CartComponent
              cart={cart}
              text={text}
              ghSim={ghSim}
              hostelDetails={hostelDetails}
              onChangeHandler={onChangeHandler}
              onSuggestHandler={onSuggestHandler}
              placeOrder={placeOrder}
              removeFromCart={removeFromCart}
              setHostelDetails={setHostelDetails}
              setSuggestions={setSuggestions}
              suggestions={suggestions}
              newOrder={newOrder}
              setNewOrderValue={setNewOrderValue}
              showReceipt={showReceipt}
            />
          )}
        </>
      ) : (
        <>
          {newOrder === false && (
            <>
              <SideTabs
                newOrder={newOrder}
                setNewOrderValue={setNewOrderValue}
              />
            </>
          )}

          {newOrder === null && (
            <>
              <SideTabs
                newOrder={newOrder}
                setNewOrderValue={setNewOrderValue}
              />
            </>
          )}
          {newOrder === true && (
            <>
              <CartComponent
                cart={cart}
                text={text}
                ghSim={ghSim}
                hostelDetails={hostelDetails}
                onChangeHandler={onChangeHandler}
                onSuggestHandler={onSuggestHandler}
                placeOrder={placeOrder}
                removeFromCart={removeFromCart}
                setHostelDetails={setHostelDetails}
                setSuggestions={setSuggestions}
                suggestions={suggestions}
                newOrder={newOrder}
                setNewOrderValue={setNewOrderValue}
                showReceipt={showReceipt}
              />
            </>
          )}
        </>
      )}
    </>
  );
};

export default CartSidebar;

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MinChat from "@/app/message";
import { Item } from "@/hooks/CartContext";
import { TermsConditions } from "../ui/term_and_condition_ui";
import { Switch } from "../ui/switch";
// import { Trigger } from "@radix-ui/react-tabs";

export function SideTabs({
  newOrder,
  setNewOrderValue,
}: {
  newOrder: boolean | null;
  setNewOrderValue: (value: boolean) => void;
}) {
  const [activeTab, setActiveTab] = useState("receipt");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full sticky lg:mt-32"
    >
      <TabsList className="grid w-full grid-cols-2">
        {/* <TabsTrigger value="add">Add</TabsTrigger> */}
        <TabsTrigger value="receipt">Receipt</TabsTrigger>
        <TabsTrigger value="message">Message</TabsTrigger>
      </TabsList>

      <TabsContent value="receipt">
        <CardReceipt
          // showReceipt={showReceipt}
          newOrder={!!newOrder}
          setNewOrderValue={setNewOrderValue}
          setActiveTab={setActiveTab} // Pass activeTab handler
          setSelectedOrderId={setSelectedOrderId} // Pass selected order handler
        />
      </TabsContent>
      <TabsContent value="message">
        <MinChat id={selectedOrderId} />
      </TabsContent>
    </Tabs>
  );
}

// Updated GraphQL query to match backend response
const CHECKPROMOCODE = gql`
  query CheckPromoCode($productsIds: [String!]!, $promocode: String!) {
    checkPromoCode(productIds: $productsIds, promoCode: $promocode) {
      id
      newPrice
    }
  }
`;
interface PromoCodeData {
  checkPromoCode: {
    id: string;
    newPrice: string;
  }[];
}

interface PromoCodeVariables {
  productsIds: string[];
  promocode: string;
}

const CartComponent = ({
  cart,
  text,
  suggestions,
  hostelDetails,
  ghSim,
  onChangeHandler,
  onSuggestHandler,
  setHostelDetails,
  removeFromCart,
  placeOrder,
  setSuggestions,
  setNewOrderValue,
  newOrder,
  showReceipt,
}: {
  cart: Item[];
  text: string;
  suggestions: string[];
  ghSim: string;
  onChangeHandler: (text: string) => void;
  onSuggestHandler: (text: string) => void;
  setHostelDetails: React.Dispatch<React.SetStateAction<HostelDetails>>;
  removeFromCart: (index: number) => void;
  placeOrder: () => void;
  setSuggestions: React.Dispatch<React.SetStateAction<string[]>>;
  newOrder: boolean | null;
  setNewOrderValue: (value: boolean) => void;
  hostelDetails: HostelDetails;
  showReceipt: boolean | null;
}) => {
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState(
    localStorage.getItem("appliedPromoCode") || ""
  );
  const [promoCodeError, setPromoCodeError] = useState("");
  const [discountedPrices, setDiscountedPrices] = useState<
    Record<string, number>
  >(() => {
    const storedPrices = localStorage.getItem("discountedPrices");
    return storedPrices ? JSON.parse(storedPrices) : {};
  });
  useEffect(() => {
    // Save cart and discounts to localStorage on updates
    localStorage.setItem("cart", JSON.stringify(cart));
    localStorage.setItem("discountedPrices", JSON.stringify(discountedPrices));
  }, [cart, discountedPrices]);

  const [checkPromoCode, { loading }] = useLazyQuery<
    PromoCodeData,
    PromoCodeVariables
  >(CHECKPROMOCODE, {
    onCompleted: (data) => {
      if (data.checkPromoCode && data.checkPromoCode.length > 0) {
        // Convert the array to a dictionary for easy lookup
        const newPrices = data.checkPromoCode.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: parseFloat(item.newPrice),
          }),
          {}
        );
        setDiscountedPrices(newPrices);
        setPromoCodeError(""); // Clear any previous errors
      }
    },
    onError: (error) => {
      // Handle specific error messages from the backend
      setPromoCodeError(
        error.message || "Invalid promo code. Please try again."
      );
      setDiscountedPrices({}); // Reset discounted prices
    },
  });

  // Handle promo code input
  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPromoCode(e.target.value);
    setPromoCodeError("");
  };

  // Apply promo code
  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoCodeError("Please enter a promo code");
      return;
    }

    const productIds = cart.map((item) => item.id);

    checkPromoCode({
      variables: {
        productsIds: productIds,
        promocode: promoCode,
      },
    });

    // Save the promo code in localStorage
    localStorage.setItem("appliedPromoCode", promoCode);
  };

  // Calculate total price, considering discounted prices if available
  const calculateTotal = () => {
    return cart.reduce(
      (totals, item) => {
        const originalPrice = parseFloat(item.commission?.toString() || "0");
        const discountedPrice = discountedPrices[item.id] || originalPrice;

        return {
          original: totals.original + originalPrice,
          discounted: totals.discounted + discountedPrice,
        };
      },
      { original: 0, discounted: 0 }
    );
  };
  const { original, discounted } = calculateTotal();

  return (
    <Card className="sticky mt-30 lg:mt-32 h-72 overflow-auto border p-1 m-4">
      <CardContent className="p-4">
        <div className="flex justify-between">
          <h3 className="font-bold mb-4 flex items-center">
            <ShoppingCart className="mr-2" />
            Your Cart ({cart.length})
          </h3>
          {showReceipt && (
            <h3
              onClick={() => setNewOrderValue(!newOrder)}
              className="font-bold mb-4 flex items-center cursor-pointer"
            >
              <ArrowRight className="mr-2" />
              {newOrder ? "Receipt" : "Reset"}
            </h3>
          )}
        </div>
        <div className="mb-2 space-y-2">
          <Input
            placeholder="Hostel Name / Location"
            value={text}
            onChange={(e) => onChangeHandler(e.target.value)}
            onBlur={() => setTimeout(() => setSuggestions([]), 300)}
          />
          <ScrollArea className="suggestions max-h-24 overflow-auto absolute w-[250px] shadow-md z-10">
            {suggestions.map((name) => (
              <div key={name} onClick={() => onSuggestHandler(name)}>
                {name}
              </div>
            ))}
          </ScrollArea>

          <Input
            placeholder="Phone Number"
            value={hostelDetails.phoneNumber}
            onChange={(e) =>
              setHostelDetails((prev) => ({
                ...prev,
                phoneNumber: e.target.value,
              }))
            }
          />
        </div>
        {cart.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center border-b pb-2 mb-2"
          >
            <div>
              <p className="font-bold">{item.name}</p>
              <p className="text-muted-foreground">
                {discountedPrices[item.id] ? (
                  <>
                    <span className="line-through text-red-500">
                      {ghSim}
                      {item.commission}
                    </span>{" "}
                    <span className="font-bold">
                      {ghSim}
                      {discountedPrices[item.id]}
                    </span>
                  </>
                ) : (
                  <span>
                    {ghSim}
                    {item.commission}
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removeFromCart(index)}
            >
              Remove
            </Button>
          </div>
        ))}

        {cart.length > 0 && (
          <div className="mt-4">
            <p className="font-bold text-right">
              {original !== discounted ? (
                <>
                  <span className="line-through text-red-500">
                    {ghSim}
                    {original.toFixed(2)}
                  </span>{" "}
                  <span className="font-bold">
                    {ghSim}
                    {discounted.toFixed(2)}
                  </span>
                </>
              ) : (
                <span>
                  {ghSim}
                  {original.toFixed(2)}
                </span>
              )}
            </p>
            <div className="mt-2 flex items-center space-x-2">
              <Switch
                checked={showPromoInput}
                onCheckedChange={(checked) => {
                  setShowPromoInput(checked);
                  // Reset promo code when toggling off
                  if (!checked) {
                    setPromoCode("");
                    setPromoCodeError("");
                    setDiscountedPrices({}); // Reset discounted prices
                  }
                }}
              />
              <span>Promo Code</span>
            </div>
            {showPromoInput && (
              <div className="mt-2">
                <Input
                  placeholder="Enter Promo Code"
                  value={promoCode}
                  onChange={handlePromoCodeChange}
                  className={promoCodeError ? "border-red-500" : ""}
                />
                {promoCodeError && (
                  <p className="text-red-500 text-sm mt-1">{promoCodeError}</p>
                )}
                <Button
                  onClick={applyPromoCode}
                  className="mt-2"
                  variant="secondary"
                  disabled={loading}
                >
                  {loading ? "Applying..." : "Apply"}
                </Button>
              </div>
            )}
            <TermsConditions
              onClick={() => {
                placeOrder();
                setNewOrderValue(!newOrder);
              }}
              className="w-full mt-2"
              disabled={!hostelDetails.hostelName || !hostelDetails.phoneNumber}
            >
              Place Order
            </TermsConditions>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
