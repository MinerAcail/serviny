"use client"

// import Link from "next/link"
// import { usePathname } from "next/navigation"
import { Package2, Building, Users, Bike } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Link, useLocation } from "react-router"

export function AdminSidebar() {
  const location = useLocation();
  const pathname = location.pathname;

  const navItems = [
    {
      name: "Service Providers",
      href: "",
      icon: Building,
      count: 6, // Placeholder count
    },
    {
      name: "Riders",
      href: "riders",
      icon: Bike,
      count: 12, // Placeholder count
    },
    {
      name: "Users (Customers)",
      href: "users",
      icon: Users,
      count: 25, // Placeholder count
    },
  ]

  return (
    <div className="hidden border-r bg-muted/40 lg:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-[60px] items-center border-b px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="">Admin Panel</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  pathname === item.href ? "bg-muted text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {item.count && (
                  <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    {item.count}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>Contact support for assistance.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="sm" className="w-full">
                Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
