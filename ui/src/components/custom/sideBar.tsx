import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CartSidebar, { CartSidebarProps } from "./CartSidebar";
import MultipleCountdown from "./timer";


export function SheetSide({
  children,
  CartSidebarProps: {
    cart,
    hostelDetails,
    setHostelDetails,
    removeFromCart,
    placeOrder,
    
  },
}: {
  children: React.ReactNode;
  CartSidebarProps: CartSidebarProps;
  
}) {
  return (
    <Sheet key="top">
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>
            <MultipleCountdown />
          </SheetTitle>
          <SheetTitle>Cart profile</SheetTitle>
          <SheetDescription>
            Add Your Hostel Information and Your Number Here. Click save when
            you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="w-full lg:w-1/4">
          <div className="sticky top-4">
            <CartSidebar
              cart={cart}
              hostelDetails={hostelDetails}
              setHostelDetails={setHostelDetails}
              removeFromCart={removeFromCart}
              placeOrder={placeOrder}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
