import React, { useState } from "react";

// import SelectCategoryFilter from "./SelectCategoryFilter";
import { useDeviceType } from "@/hooks/useDeviceType";
import { Button } from "../ui/button";
import { Link } from "react-router";
import { useSidebar } from "../ui/sidebar";
import logo from "../../assets/ww.png";
import Search from "../../../icons/input-with-button.tsx";
import Login from "@/app/Login.tsx";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/middleware/context/authContext.tsx";
import Logout from "@/app/LogOut.tsx";

interface SelectCategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  onSearch?: (value: string) => void;
}

const MenuBar: React.FC<SelectCategoryFilterProps> = ({ onSearch }) => {
  const { isDesktop } = useDeviceType();
  const { toggleSidebar } = useSidebar();
  const [isSearchExpanded] = useState<boolean>(false);
    const { login: Auth,isAuthenticated } = useAuth();
  

  // const onSearch = (value: string) => {
  //   console.log(value);
  // };
  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#76a683] shadow-md py-2 px-4 flex justify-between items-center">
      {/* Logo */}
      <Link to={"/services"} className="flex items-center">
        {/* <img src={logo} alt="serviny Logo" className="w-12 pr-[5px]" /> */}

        {(isDesktop || !isSearchExpanded) && (
          <>
            {(isDesktop || !isSearchExpanded) &&
              window.innerWidth !== 320 &&
              window.innerHeight !== 480 && (
                <>
                  <span className="text-lg font-extrabold text-white tracking-wider font-mono">
                    serviny
                  </span>
                </>
              )}
          </>
        )}
      </Link>

      <div className="flex items-center gap-2">
        {/* Show the shopping basket icon on mobile */}

        {/* <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="flex items-center  p transition-colors bg-slate-100 rounded-md"
        >
          <span className="font-medium text-slate-700">Sign In</span>
        </Button> */}
        <Link to={"/provider/new"}>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Create
            </Button>
          </Link>
            {isAuthenticated ? (
            <Logout>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign Out
            </Button>
          </Logout>
            ) : (
              <Login>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Login>
            )}
        {/* <Button
          onClick={toggleSidebar}
          variant="ghost"
          size="sm"
          className="flex items-center  p transition-colors bg-slate-100 rounded-md"
        >
          <span className="font-medium text-slate-700">Service</span>
        </Button> */}
        {/* <Search
          isExpanded={isSearchExpanded}
          // setIsExpanded={setIsSearchExpanded}
          onSearch={onSearch}
        /> */}
      </div>
    </nav>
  );
};

export default MenuBar;
