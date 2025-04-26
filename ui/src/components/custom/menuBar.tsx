import React, { useState } from "react";
import { ShoppingBasket, ShoppingBag, LucideHome } from "lucide-react";
// import SelectCategoryFilter from "./SelectCategoryFilter";
import { SheetSide } from "./sideBar";
import { useDeviceType } from "@/hooks/useDeviceType";
import { CartSidebarProps } from "./CartSidebar";
import { Button } from "../ui/button";
import { Link, useLocation } from "react-router";
import { useSidebar } from "../ui/sidebar";
import logo from "../../assets/ww.png";
import Search from "../../../icons/input-with-button.tsx";

import ResponsiveNavigation from "./bignav.tsx";
interface SelectCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  CartSidebarProps: CartSidebarProps;
  onSearch?: (value: string) => void;
}

const MenuBar: React.FC<SelectCategoryFilterProps> = ({
  CartSidebarProps: {
    cart,
    hostelDetails,
    setHostelDetails,
    removeFromCart,
    placeOrder,
  },
  onSearch,
}) => {
  const location = useLocation();
  const isShopPage = location.pathname === "/shop";
  const { isDesktop } = useDeviceType();
  const { toggleSidebar } = useSidebar();
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  // const onSearch = (value: string) => {
  //   console.log(value);
  // };
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#76a683] shadow-md py-2 px-4 flex justify-between items-center">
      {/* Logo */}
      <Link to={"/"} className="flex items-center">
        <img src={logo} alt="serviny Logo" className="w-12 pr-[5px]" />

        {(isDesktop || !isSearchExpanded) && (
          <>
            {(isDesktop || !isSearchExpanded) &&
              window.innerWidth !== 320 &&
              window.innerHeight !== 480 && (
                <>
                  <span className="text-lg font-extrabold text-white tracking-wider font-mono">
                    winne
                  </span>
                  <span className="text-lg font-extrabold text-black tracking-wider pl-[2px] font-mono">
                    mart
                  </span>
                </>
              )}
          </>
        )}
      </Link>

      <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            {/* <Link to={isShopPage ? "/" : "/shop"}>
              {isShopPage ? (
                <LucideHome className="w-6 h-6 text-slate-700" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-slate-700" />
              )}
            </Link> */}
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              className="flex items-center  p transition-colors bg-slate-100 rounded-md"
            >
              <span className="font-medium text-slate-700">Menu</span>
            </Button>
            <Link to={"/services"}>
              <Button
                // onClick={toggleSidebar}
                variant="ghost"
                size="sm"
                className="flex items-center  p transition-colors bg-slate-100 rounded-md"
              >
                <span className="font-medium text-slate-700">Service</span>
              </Button>
            </Link>
          </div>
        )}

        {/* <Search
          isExpanded={isSearchExpanded}
          setIsExpanded={setIsSearchExpanded}
          onSearch={onSearch}
        /> */}

        {isDesktop && (
          <div className="flex items-center space-x-4">
            <ResponsiveNavigation />
          </div>
        )}
      </div>
    </nav>
  );
};

export default MenuBar;
