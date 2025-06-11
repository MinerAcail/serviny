import React, { useState } from "react";

import { Button } from "../ui/button";
import { Link, useLocation } from "react-router";
import Search from "../../../icons/input-with-button.tsx";
import Login from "@/app/Login.tsx";
import { ArrowBigDownDash, Library, LogIn } from "lucide-react";
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
        <img src="/winnefull.png" alt="Logo" className="h-4 w-auto" style={{ filter: "invert(1)" }} />
      </Link>

      <div className="flex   items-center gap-2">
        {!isSearchExpanded && (
          <>
            {!Servicetabs && <RegisterOptions />}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
            >
              <Link to="/install" className="flex items-center gap-2 p-2">
                <ArrowBigDownDash className="w-4 h-4" />

                <span className="hidden sm:inline">Download</span>
              </Link>
            </Button>

            {isAuthenticated ? (
              <>
                {Servicetabs && (
                  <NavigationMenu>
                    <NavigationMenuList>
                      {!isBookTypes ? (
                        <Button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                          <Link
                            to="/booktypes"
                            className="flex items-center gap-2 p-2"
                          >
                            <Library className="w-4 h-4" />
                            <span>Types</span>
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                            <Link
                              to={`/providers/${user?.id}`}
                              className="flex items-center gap-2 p-2"
                            >
                              <Library className="w-4 h-4" />
                              <span>Profile</span>
                            </Link>
                          </Button>
                          <Button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                            <Link
                              to={`/time/${user?.id}`}
                              className="flex items-center gap-2 p-2"
                            >
                              <Library className="w-4 h-4" />
                              <span>Booked</span>
                            </Link>
                          </Button>
                        </>
                      )}
                    </NavigationMenuList>
                  </NavigationMenu>
                )}

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
        {home && (
          <Search
            isExpanded={isSearchExpanded}
            setIsExpanded={setIsSearchExpanded}
            onSearch={onSearch}
          />
        )}
        {search && <SearchDropdown serviceId={serviceId ?? ""} />}
      </div>
    </nav>
  );
};

export default MainNaveBar;
