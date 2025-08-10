import { useState, RefObject, Dispatch, SetStateAction } from "react";
import {
  Package2,
  Building,
  Users,
  Bike,
  File,
  Info,
  ChevronDown,
  ChevronRight,
  X,
  LucideIcon,
  LogOut,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import Logout from "@/app/LogOut";
import { useAuth } from "@/middleware/context/authContext";
import { AdminLoginDialog } from "../AUTH/login";

// Type definitions
interface DocusItem {
  key: string;
  label: string;
  path: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  count?: number;
  nested?: DocusItem[];
}

interface AdminSidebarProps {
  sidebarRef: RefObject<HTMLDivElement>;
  isMobileOpen: boolean;
  setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
}

export function AdminSidebar({
  sidebarRef,
  isMobileOpen,
  setIsMobileOpen,
}: AdminSidebarProps) {
  const [openDocus, setOpenDocus] = useState(false);
  const { isAuthenticated } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(true);
    const [message, setMessage] = useState<string>("");
  
  const handleLoginSuccess = () => {
    setMessage("Admin logged in successfully!");
    console.log("Admin authentication successful");
    // Handle successful login (redirect, store auth token, etc.)
  };

  const handleLoginError = (error: string) => {
    setMessage(`Login error: ${error}`);
    console.error("Admin login error:", error);
  };
  const docusItems: DocusItem[] = [
    { key: "delivery", label: "Delivery Solutions", path: "delivery" },
    { key: "ecom", label: "E-commerce Platform", path: "ecom" },
    { key: "ship", label: "Global Import", path: "ship" },
  ];

  const navItems: NavItem[] = [
    {
      name: "Service Providers",
      href: "",
      icon: Building,
      count: 6,
    },
    {
      name: "Riders",
      href: "riders",
      icon: Bike,
      count: 12,
    },
    {
      name: "Users (Customers)",
      href: "users",
      icon: Users,
      count: 25,
    },
    {
      name: "Upload",
      href: "upload",
      icon: File,
      count: 25,
    },
    {
      name: "Upload List",
      href: "list",
      icon: Info,
      count: 25,
    },
    {
      name: "Documentation",
      icon: File,
      nested: docusItems,
    },
  ];

  const handleLinkClick = (): void => {
    // Close mobile sidebar when a link is clicked
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:z-auto",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          {/* Header with close button for mobile */}
          <div className="flex h-[60px] items-center justify-between border-b px-6">
            <Link to="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span>Admin Panel</span>
            </Link>

            {/* Mobile close button */}
            <button
              className="lg:hidden p-1 rounded-md hover:bg-muted"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto py-2">
            <nav className="grid items-start px-4 text-sm font-medium">
              {navItems.map((item) => (
                <div key={item.name}>
                  {item.nested ? (
                    <>
                      <button
                        onClick={() => setOpenDocus(!openDocus)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-muted/50",
                          openDocus
                            ? "bg-muted text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                        {openDocus ? (
                          <ChevronDown className="ml-auto h-4 w-4" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </button>
                      {openDocus && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.nested.map((sub) => (
                            <Link
                              key={sub.key}
                              to={sub.path}
                              onClick={handleLinkClick}
                              className="block rounded-lg px-3 py-1 text-muted-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href ?? ""}
                      onClick={handleLinkClick}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted/50"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.name}
                      {item.count && (
                        <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                          {item.count}
                        </Badge>
                      )}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Support card */}
          <div className="mt-auto p-4">
            {isAuthenticated ? (
              <Logout>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </Logout>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-sm px-3 py-1 md:px-4 md:py-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
     {!isAuthenticated && !isLoginOpen &&(
       <AdminLoginDialog
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onError={handleLoginError}
      />
     )}
    </>
  );
}
