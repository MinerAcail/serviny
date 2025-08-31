import React, { useState } from "react";

import { Button } from "../ui/button";
import { Link, useLocation, useNavigate } from "react-router";
import Search from "../../../icons/input-with-button.tsx";
import Login from "@/app/Login.tsx";
import { ArrowBigDownDash, FileText, Library, LogIn } from "lucide-react";
import { useAuth } from "@/middleware/context/authContext.tsx";
import Logout from "@/app/LogOut.tsx";
import RegisterOptions from "@/app/checkUserCreateUI.tsx";
import SpectaclesLogo from "./logoicon.tsx";
import { NavigationMenu, NavigationMenuList } from "../ui/navigation-menu.tsx";
import { SearchDropdown } from "./searchTab.tsx";

interface SelectCategoryFilterProps {
  onSearch?: (value: string) => void;
  serviceId?: string;
}

const MainNaveBar: React.FC<SelectCategoryFilterProps> = ({
  onSearch,
  serviceId,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const navigate = useNavigate();

  const location = useLocation();
  const home = location.pathname === "/";
  const isBookTypes = location.pathname === "/booktypes";
  const search = location.pathname.startsWith("/providers/");
  const Servicetabs =
    location.pathname.startsWith("/time/") ||
    location.pathname.startsWith("/booktypes");
  const { isAuthenticated, user } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-primary shadow-md py-2 px-4 flex justify-between items-center">
      {/* Logo */}
      <Link to={"/"} className="flex w-[30%] items-center">
        <img
          src="/winnefull.png"
          alt="Logo"
          className="h-4 w-auto"
          style={{ filter: "invert(1)" }}
        />
      </Link>

      <div className="flex   items-center gap-2">
        {!isSearchExpanded && (
          <>
            {!Servicetabs && <RegisterOptions />}

            <Button
             onClick={() => {
                  navigate("/docs/delivery");
                }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Documentation</span>
            </Button>
            {isAuthenticated ? (
              <>
                <Logout>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </Logout>
              </>
            ) : (
              <>
                <Login>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                  >
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Login>
              </>
            )}
          </>
        )}
        <Search
          isExpanded={isSearchExpanded}
          setIsExpanded={setIsSearchExpanded}
          onSearch={onSearch}
        />
        {search && <SearchDropdown serviceId={serviceId ?? ""} />}
      </div>
    </nav>
  );
};

export default MainNaveBar;
