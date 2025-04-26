import React, { useState } from "react";
import { ShoppingBasket, MenuSquare, ShoppingBag } from "lucide-react";
// import SelectCategoryFilter from "./SelectCategoryFilter";
import { SheetSide } from "./sideBar";
import { useDeviceType } from "@/hooks/useDeviceType";
import { CartSidebarProps } from "./CartSidebar";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { useSidebar } from "../ui/sidebar";
import logo from "../../assets/ww.png";
import Search from "../../../icons/input-with-button.tsx";
interface SelectCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  CartSidebarProps: CartSidebarProps;
}

const MenuBar: React.FC<SelectCategoryFilterProps> = ({
  CartSidebarProps: {
    cart,
    hostelDetails,
    setHostelDetails,
    removeFromCart,
    placeOrder,
  },
}) => {
  const { isDesktop } = useDeviceType();
  const { toggleSidebar } = useSidebar();
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#76a683] shadow-md py-3 px-4 flex justify-between items-center">
      {/* Logo */}
      <Link to={"/"} className="flex items-center">
        <img src={logo} alt="serviny Logo" className="w-12 pr-[5px]" />

        {(isDesktop || !isSearchExpanded) && (
          <>
            <span className="text-lg font-extrabold text-white tracking-wider font-mono">
              winne
            </span>
            <span className="text-lg font-extrabold text-black tracking-wider pl-[2px] font-mono">
              mart
            </span>
          </>
        )}
      </Link>

      <div className="flex items-center space-x-4">
        {/* Show the shopping basket icon on mobile */}
        {!isDesktop && (
          <SheetSide
        CartSidebarProps={{
          cart,
          hostelDetails,
          setHostelDetails,
          removeFromCart,
          placeOrder,
        }}
          >
        {/* Shopping Basket Icon with Cart Badge */}
        {!isSearchExpanded && (
          <div className="relative ">
            <ShoppingBasket className="w-6 h-6 text-slate-700" />
            {/* Conditionally render the badge if there are items in the cart */}
            {cart.length > 0 && (
          <div className="absolute top-[-8px] right-[-8px] bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-50">
            {cart.length}
          </div>
            )}
          </div>
        )}
          </SheetSide>
        )}

        {!isSearchExpanded && !isDesktop && (
          <div className="flex items-center space-x-4">
        <ShoppingBag className="w-6 h-6 text-slate-700" />
        <MenuSquare onClick={toggleSidebar} className="w-6 h-6 text-slate-700" />
          </div>
        )}

        <Search
          isExpanded={isSearchExpanded}
          setIsExpanded={setIsSearchExpanded}
        />

        {isDesktop && (
          <div className="flex items-center space-x-4">
        <Link to={"/shop"}>
          <Button variant="outline" className="flex items-center gap-1 p-3">
            Shop
          </Button>
        </Link>
        <Link to={"/request"}>
          <Button variant="outline" className="flex items-center gap-1 p-3">
            Request Item
          </Button>
        </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MenuBar;
