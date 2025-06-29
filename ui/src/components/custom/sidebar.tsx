import { useEffect, useRef, useState } from "react";
import {
  Home,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft,
  HardDriveUpload,
  Library,
  Edit,
  CalendarSync,
  AlignVerticalJustifyStart,
  ArrowBigDownDash,
  LogIn,
  BookUser,
  Waypoints,
  LayoutDashboard,
  LucideProps,
  LogOut,
  ShoppingCart,
  BaggageClaim,
  MessageCircle,
  MessagesSquare,
  MessageSquare,
  MapPlus,
  Merge,
  GitPullRequest,
  Map,
  ChartLine,
  History,
  Building2,
  LayoutList,
  BookCopy,
  PackageOpen,
  PackageCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Link, useLocation } from "react-router";
import { SearchDropdown } from "../serviceProviders/searchTab";
import { useAuth } from "@/middleware/context/authContext";
import Logout from "@/app/LogOut";
import Login from "@/app/Login";
import SpectaclesLogo from "../serviceProviders/logoicon";
import RegisterOptions from "@/app/checkUserCreateUI";
import { useCheckAuthId } from "@/middleware/context/checkID";
import NotificationCenter from "../user/notification-center";
import { CartButton } from "./cart/cart-button";
import ProfileDialog, { ProfileProviderDialog } from "./profile-dialog";
import RiderRequest from "../serviceProviders/Riders/request";
import { BusinessTypeEnum, useProvider } from "@/middleware/context/businessType";

const bottomNavigation = [
  // { name: "Settings", to: "/settings", icon: Settings },
  { name: "Tutorials", to: "/tutorial", icon: HelpCircle },
];
type NavItemProps = {
  item: {
    name: string;
    to: string;
    icon: React.ForwardRefExoticComponent<
      Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
    >;
    action?: () => void;
  };
};
export function Sidebar() {
  const { isAuthenticated, clearCache } = useAuth();

  const { isDeliveryStandardOrEnterprise, isEcommerceStandardOrEnterprise } =
    useProvider();
  
  useQuery(CLEAR_CLIENT_CACHE, {
    onCompleted: (data) => {
      // Always clear localStorage, regardless of server response
      if (data.clearClientCache === false) {
        clearCache();
      }
    },
    onError: (error) => {
      console.error("Error clearing client cache:", error);
      // Still clear localStorage even if server call fails
      clearCache();
    },
  });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const navigation = [
    { name: "Home", to: `/`, icon: Home }, // stays on /dbp/:serviceId
    { name: "Dashboard", to: ".", icon: LayoutDashboard }, // stays on /dbp/:serviceId
    ...(isEcommerceStandardOrEnterprise
      ? [
          { name: "Add Products", to: "new", icon: BaggageClaim }, // stays on /dbp/:serviceId
          { name: "Products", to: "products", icon: ShoppingCart }, // stays on /dbp/:serviceId
          { name: "Contacts", to: `contacts`, icon: BookUser },
          { name: "Orders", to: `orders`, icon: LayoutList },
        ]
      : []),

    ...(isDeliveryStandardOrEnterprise
      ? [
          {
            name: "Live Map",
            to: `livemap`,
            icon: Map,
          },
          // { name: "Analytics", to: `analytics`, icon: ChartLine },
          { name: "History", to: `history`, icon: History },
          { name: "Forms", to: "builder", icon: BookCopy },

          // { name: "Request", to: `request`, icon: GitPullRequest },
          { name: "Vendors", to: `vendors`, icon: Building2 },
          { name: "Delivery Zone And Pricing", to: "zone", icon: MapPlus }, // stays on /dbp/:serviceId
          { name: "Schedule", to: `time`, icon: CalendarSync },
          { name: "Upload", to: "upload", icon: HardDriveUpload },
        ]
      : []),

    { name: "Profile", to: "update", icon: Edit },
  ];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const NavItem = ({ item }: NavItemProps) => (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Link
          to={item.to}
          className={cn(
            "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",

            "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            isCollapsed && "justify-center px-2"
          )}
          onClick={() => {
            // setIsCollapsed(!isCollapsed);
            setIsMobileOpen(!isMobileOpen);
          }}
        >
          <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
          {!isCollapsed && <span>{item.name}</span>}
        </Link>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right" className="flex items-center gap-4">
          {item.name}
        </TooltipContent>
      )}
    </Tooltip>
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024 // Only close on mobile
      ) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <TooltipProvider>
      <div ref={sidebarRef} className="">
        <div className="lg:hidden fixed flex w-full justify-between sm:top-4 p-2  z-[40]">
          <Link to={"/"} className="flex  items-center">
            {/* <SpectaclesLogo size={"sm"} variant="primary" /> */}
          </Link>

          <button
            className="lg:hidden   p-2 bg-background rounded-md shadow-md"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          {/* <RegisterOptions isCollapsed={isCollapsed}/> */}
        </div>

        <div
          className={cn(
            "fixed inset-y-0 z-20 flex flex-col bg-background transition-all duration-300 ease-in-out lg:static",
            isCollapsed ? "w-[72px]" : "w-72",
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="border-b border-border">
            <div
              className={cn(
                "flex h-16 items-center gap-2 px-4",
                isCollapsed && "justify-center px-2"
              )}
            >
              {!isCollapsed && (
                // <Link to={"/"} className="flex  items-center">
                //   <SpectaclesLogo size={"sm"} variant="primary" />
                // </Link>

                <Link to={"/"} className="flex w-[50%] items-center">
                  <img src="/winnefull.png" alt="Logo" className="h-4 w-full" />
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn("ml-auto h-8 w-8", isCollapsed && "ml-0")}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isCollapsed && "rotate-180"
                  )}
                />
                <span className="sr-only">
                  {isCollapsed ? "Expand" : "Collapse"} Sidebar
                </span>
              </Button>
            </div>
          </div>
          <RegisterOptions isCollapsed={isCollapsed} />

          <div className="flex-1 overflow-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
          <div className="border-t border-border p-2">
            <nav className="space-y-1">
              {isAuthenticated ? (
                <Logout>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {!isCollapsed && <span>Sign Out</span>}
                  </Button>
                </Logout>
              ) : (
                <>
                  <Login>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                    >
                      <LogIn className="w-4 h-4" />
                      {!isCollapsed && <span>Sign In</span>}
                    </Button>
                  </Login>
                </>
              )}
            </nav>
          </div>
          <div className="border-t border-border p-2">
            <nav className="space-y-1">
              {bottomNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

import { gql, useQuery } from "@apollo/client";
import { ProfileSwitcherContainer } from "../ProfileSwitcher";
import { useCurrentUserHasAnyBusinessType, useCurrentUserProfileId } from "../GlobalLogic/checkBusinessType";
export const CLEAR_CLIENT_CACHE = gql`
  query ClearClientCache {
    clearClientCache
  }
`;

export function SidebarMain({ serviceId }: { serviceId?: string }) {
  console.log("serviceId", serviceId);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const localServiceId = localStorage.getItem("serviceId");
  serviceId = serviceId ?? localServiceId ?? "";
  // const { isMatch } = useCheckAuthId(serviceId);
  // const { userType } = useProvider();
  const { isAuthenticated, user, clearCache } = useAuth();
  // const { isDeliveryStandardOrEnterprise, isEcommerceStandardOrEnterprise } =
  //   useProvider();
    const hasEcommerceAccess = useCurrentUserHasAnyBusinessType([
    BusinessTypeEnum.ECOMMERCE_STANDARD,
    BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
    BusinessTypeEnum.PRE_ORDER,
    BusinessTypeEnum.DROP_SHIPPING
  ]);
// const profileId = useCurrentUserProfileId();
//      const hasDeliveryAccess = useCurrentUserHasAnyBusinessType([
//     BusinessTypeEnum.DELIVERY_STANDARD,
//     BusinessTypeEnum.DELIVERY_ENTERPRISE,
//   ]);
  const location = useLocation();
  const install = location.pathname === "/install";
  // const providers = location.pathname === "/providers";
  const { data } = useQuery(CLEAR_CLIENT_CACHE, {
    onCompleted: (data) => {
      // Always clear localStorage, regardless of server response
      if (data.clearClientCache === false) {
        clearCache();
      }
    },
    onError: (error) => {
      console.error("Error clearing client cache:", error);
      // Still clear localStorage even if server call fails
      clearCache();
    },
  });
  console.log("clearClientCache initialized", data);
  // const checkurl = location.pathname === "/install" || location.pathname === "/zonex";
  //id from localStorage
  const navigation = [
    {
      name: "Home",
      to: `/?lo`,
      icon: Home,
    },
    { name: "Delivery", to: `/vob`, icon: PackageCheck }, // stays on /dbp/:serviceId
    { name: "History", to: `history`, icon: History },
    ...(user?.type === "SERVICE" || user?.type === "DELIVERY"
      ? [
          {
            name: "Dashboard",
            to: install ? `/dbp/${user?.id}` : `/dbp`,
            icon: LayoutDashboard,
          },
          ...(hasEcommerceAccess
            ? [{ name: "Merge Maps", to: `/merge`, icon: Merge }]
            : []),
          { name: "Edit", to: `/dbp/update`, icon: Edit },
        ]
      : []),
    { name: "Download", to: "/install", icon: ArrowBigDownDash },
    // { name: "Message", to: "/sms", icon: MessageSquare },
    // { name: "Merge Maps", to: `/merge/${serviceId}`, icon: Merge },

    // Conditionally include items
  ];

  const [isCollapsed, setIsCollapsed] = useState(false);

  const NavItem = ({ item }: NavItemProps) => {
    const handleClick = () => {
      if (item.action) {
        item.action();
      }
      if (isMobileOpen) setIsMobileOpen(false);
    };

    const content = (
      <>
        <item.icon className={cn("h-4 w-4", !isCollapsed && "mr-3")} />
        {!isCollapsed && <span>{item.name}</span>}
      </>
    );

    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {item.action ? (
            <div
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                isCollapsed && "justify-center px-2"
              )}
              onClick={handleClick}
            >
              {content}
            </div>
          ) : (
            <Link
              to={item.to ?? "#"}
              className={cn(
                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                isCollapsed && "justify-center px-2"
              )}
              onClick={handleClick}
            >
              {content}
            </Link>
          )}
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="flex items-center gap-4">
            {item.name}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  const search = location.pathname.startsWith("/providers/");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024 // Only close on mobile
      ) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <TooltipProvider>
      <div ref={sidebarRef} className="h-screen flex">
        <div className="flex fixed top-4 right-4 z-50 gap-2 rounded-md shadow-md">
          <CartButton />
          {/* <NotificationCenter /> */}
          {search && <SearchDropdown serviceId={serviceId ?? ""} />}
          <button
            className="lg:hidden bg-background p-2 rounded-md shadow-md"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <ProfileProviderDialog userID={serviceId ?? ""} />
        </div>
        <div
          className={cn(
            "fixed inset-y-0 z-20 flex flex-col bg-background transition-all duration-300 ease-in-out lg:static",
            isCollapsed ? "w-[72px]" : "w-72",
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="border-b border-border">
            <div
              className={cn(
                "flex h-16 items-center gap-2 px-4",
                isCollapsed && "justify-center px-2"
              )}
            >
              {!isCollapsed && (
                // <Link to={"/"} className="flex  items-center">
                //   <SpectaclesLogo size={"sm"} variant="primary" />
                // </Link>

                <Link to={"/all"} className="flex w-[50%] items-center">
                  <img src="/winnefull.png" alt="Logo" className="h-4 w-full" />
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn("ml-auto h-8 w-8", isCollapsed && "ml-0")}
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isCollapsed && "rotate-180"
                  )}
                />
                <span className="sr-only">
                  {isCollapsed ? "Expand" : "Collapse"} Sidebar
                </span>
              </Button>
            </div>
          </div>
          <RegisterOptions isCollapsed={isCollapsed} />
          {!isCollapsed && <ProfileSwitcherContainer />}

          <div className="flex-1 overflow-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item, index) => (
                <NavItem key={index} item={item} />
              ))}
            </nav>
            {user?.type === "DELIVERY" && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <RiderRequest serviceId={serviceId ?? ""}>
                    <div
                      className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                        "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <GitPullRequest
                        className={cn("h-4 w-4", !isCollapsed && "mr-3")}
                      />

                      {/* <GitPullRequest className="w-4 h-4" /> */}
                      {!isCollapsed && <span>Rider Request</span>}
                    </div>
                  </RiderRequest>
                </TooltipTrigger>

                {isCollapsed && (
                  <TooltipContent
                    side="right"
                    className="flex items-center gap-4"
                  >
                    Rider Request
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </div>
          <div className="border-t  border-border p-2 grid grid-cols-2 gap-2 items-center">
            <nav className="space-y-1">
              {isAuthenticated ? (
                <Logout>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {!isCollapsed && <span>Sign Out</span>}
                  </Button>
                </Logout>
              ) : (
                <>
                  <Login>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                    >
                      <LogIn className="w-4 h-4" />
                      {!isCollapsed && <span>Sign In</span>}
                    </Button>
                  </Login>
                </>
              )}
            </nav>
            <ProfileDialog />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
