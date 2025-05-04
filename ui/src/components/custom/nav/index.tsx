import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { gql, useMutation } from "@apollo/client";
import {
  Library,
  LogIn,

} from "lucide-react";
import { Button } from "@/components/ui/button";
import Login from "@/app/Login";
import { useDeviceType } from "@/hooks/useDeviceType";
import { useAuth } from "@/middleware/context/authContext";

import logo from "../../../assets/ww.png";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export const LOGOUT = gql`
  mutation logOut {
    logOut
  }
`;

function WorksNav() {
  // const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL

  const { logout, isAuthenticated ,user} = useAuth();

  const [logoutMutation] = useMutation(LOGOUT);
  const navigate = useNavigate();
  const { isDesktop } = useDeviceType();
  const [isSearchExpanded] = useState<boolean>(false);
  //check url booktypes
  const isBookTypes = window.location.pathname === "/booktypes";
  const handleLogout = async () => {
    try {
      await logoutMutation();
      logout();
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#76a683] shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to={"/"} className="flex items-center">
          <img src={logo} alt="serviny Logo" className="w-12 pr-[5px]" />
          {(isDesktop || !isSearchExpanded) && <></>}
        </Link>

        {isAuthenticated ? (
          <NavigationMenu>
            <NavigationMenuList>
            
              {!isBookTypes ? (
                <Button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                  <Link  to="/booktypes" className="flex items-center gap-2 p-2">
                    <Library className="w-4 h-4" />
                    <span>Types</span>
                  </Link>
                </Button>
              ):(
            <>
                <Button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
                <Link to={`/providers/${user?.id}`} className="flex items-center gap-2 p-2">
                  <Library className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
              </Button>
               <Button className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-md">
               <Link to={`/time/${user?.id}`} className="flex items-center gap-2 p-2">
                 <Library className="w-4 h-4" />
                 <span>Booked</span>
               </Link>
             </Button>
            
            </>
              )}

              <NavigationMenuItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign Out
                </Button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
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
      </div>
    </nav>
  );
}

export default WorksNav;
