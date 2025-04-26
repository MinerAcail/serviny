import React from "react";
import { Link, useLocation } from "react-router";
import { Home, ShoppingBag, Inbox, FileText } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

// Menu items with icons and conditional navigation
interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const createItems = (
  location: ReturnType<typeof useLocation>
): NavigationItem[] => [
  {
    title: location.pathname === "/shop" ? "Home" : "Combo",
    url: location.pathname === "/shop" ? "/" : "/shop", // Conditional URL based on current page
    icon: location.pathname === "/shop" ? Home : ShoppingBag,
    description: "Browse our product combinations",
  },
  {
    title: "Item Request",
    url: "/request",
    icon: FileText,
    description: "Submit requests for specific items",
  },
  {
    title: "Job Posting",
    url: "/job",
    icon: Inbox,
    description: "Explore available job opportunities",
  },
];

interface MainNavigationProps {
  className?: string;
}

const MainNavigation: React.FC<MainNavigationProps> = ({ className }) => {
  const location = useLocation();
  const items = createItems(location);
  const isActive = (path: string) => location.pathname === path;

  // Special handling for the Combo item
  const isShopActive =
    location.pathname === "/shop" ||
    (location.pathname === "/" && items[1].url === "/");

  return (
    <div className={cn("hidden md:flex", className)}>
      {/* PC and Tablet Navigation */}
      <NavigationMenu>
        <NavigationMenuList className="flex gap-1">
          {items.map((item, index) => (
            <NavigationMenuItem key={item.title}>
              <Link to={item.url}>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "px-4 py-2",
                    index === 0 && isActive("/")
                      ? "bg-slate-100 text-slate-900"
                      : "",
                    index === 1 && isShopActive
                      ? "bg-slate-100 text-slate-900"
                      : "",
                    index > 1 && isActive(item.url)
                      ? "bg-slate-100 text-slate-900"
                      : ""
                  )}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    <span>{item.title}</span>
                  </div>
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

// Alternative compact navigation menu with dropdown for smaller tablets
const CompactNavigation: React.FC = () => {
  const location = useLocation();
  const items = createItems(location);

  return (
    <div className="block md:hidden">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-white">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Navigation</span>
              </div>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] gap-3 p-4">
                {items.map((item) => (
                  <li key={item.title}>
                    <NavigationMenuLink asChild>
                      <Link
                        to={item.url}
                        className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-md"
                      >
                        <item.icon className="w-4 h-4 text-slate-600" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {item.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {item.description}
                          </span>
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

// Combined component that renders the appropriate navigation based on screen size
const ResponsiveNavigation: React.FC = () => {
  return (
    <div className="w-full">
      <MainNavigation />
      <CompactNavigation />
    </div>
  );
};

export default ResponsiveNavigation;
