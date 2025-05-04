import React, { useState } from "react";

import { Button } from "../ui/button";
import { Link } from "react-router";
import Search from "../../../icons/input-with-button.tsx";
import Login from "@/app/Login.tsx";
import { LogIn } from "lucide-react";
import { useAuth } from "@/middleware/context/authContext.tsx";
import Logout from "@/app/LogOut.tsx";
import RegisterOptions from "@/app/checkUserCreateUI.tsx";
import SpectaclesLogo from "./logoicon.tsx";


interface SelectCategoryFilterProps {

  onSearch?: (value: string) => void;
}

const MainNaveBar: React.FC<SelectCategoryFilterProps> = ({ onSearch }) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);


  const {  isAuthenticated } = useAuth();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-primary shadow-md py-2 px-4 flex justify-between items-center">
      {/* Logo */}
      <Link to={"/"} className="flex items-center">
        <SpectaclesLogo size={"sm"} variant="secondary" />
      </Link>

      <div className="flex items-center gap-2">
        {!isSearchExpanded && (
          <>
            <RegisterOptions />

            {isAuthenticated ? (
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
            ) : (
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
            )}
          </>
        )}

        <Search
          isExpanded={isSearchExpanded}
          setIsExpanded={setIsSearchExpanded}
          onSearch={onSearch}
        />
      </div>
    </nav>
  );
};

export default MainNaveBar;
