import React, { useState } from "react";

import { Link } from "react-router";

import { LogIn } from "lucide-react";
import { useAuth } from "@/middleware/context/authContext.tsx";
import Login from "../../PROTECTION/Login.tsx";
import { Button } from "@/components/ui/button.tsx";
import SearchMenu from "./searchMenu.tsx";
import Logout from "../../PROTECTION/LogOut.tsx";

interface SelectCategoryFilterProps {
  onSearch?: (value: string) => void;
  serviceId?: string;
}

const MainNaveBar: React.FC<SelectCategoryFilterProps> = ({ onSearch }) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);

  // const location = useLocation();

  const { isAuthenticated } = useAuth();

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
        <SearchMenu
          isExpanded={isSearchExpanded}
          setIsExpanded={setIsSearchExpanded}
          onSearch={onSearch}
        />
      </div>
    </nav>
  );
};

export default MainNaveBar;
