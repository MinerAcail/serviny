"use client"

import { useState } from "react"
import { Search, Play, Clock, Users, Truck, Package, Bike } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Tutorial {
  id: string
  title: string
  description: string
  duration: string
  videoId: string
  thumbnail: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
}

const tutorials = {
  users: [
    {
      id: "user-1",
      title: "Getting Started: Creating Your First Order",
      description: "Learn how to place your first order and navigate the platform basics.",
      duration: "5:32",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["basics", "ordering", "getting-started"],
    },
    {
      id: "user-2",
      title: "Managing Your Profile and Preferences",
      description: "Customize your account settings and delivery preferences for the best experience.",
      duration: "3:45",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["profile", "settings", "preferences"],
    },
    {
      id: "user-3",
      title: "Advanced Search and Filtering",
      description: "Master the search functionality to find exactly what you're looking for.",
      duration: "7:21",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Intermediate" as const,
      tags: ["search", "filters", "advanced"],
    },
    {
      id: "user-4",
      title: "Payment Methods and Security",
      description: "Set up secure payment methods and understand our security features.",
      duration: "4:18",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["payment", "security", "setup"],
    },
  ],
  vendors: [
    {
      id: "vendor-1",
      title: "Vendor Onboarding: Setting Up Your Store",
      description: "Complete guide to setting up your vendor account and store profile.",
      duration: "12:45",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["onboarding", "setup", "store"],
    },
    {
      id: "vendor-2",
      title: "Product Management and Inventory",
      description: "Learn how to add products, manage inventory, and update pricing.",
      duration: "9:33",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Intermediate" as const,
      tags: ["products", "inventory", "pricing"],
    },
    {
      id: "vendor-3",
      title: "Order Processing and Fulfillment",
      description: "Efficiently process orders and manage fulfillment workflows.",
      duration: "8:27",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Intermediate" as const,
      tags: ["orders", "fulfillment", "processing"],
    },
    {
      id: "vendor-4",
      title: "Analytics and Performance Tracking",
      description: "Use analytics tools to track performance and optimize your store.",
      duration: "11:12",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Advanced" as const,
      tags: ["analytics", "performance", "optimization"],
    },
  ],
  logistics: [
    {
      id: "logistics-1",
      title: "Warehouse Management System Overview",
      description: "Navigate the warehouse management interface and key features.",
      duration: "15:20",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["warehouse", "management", "overview"],
    },
    {
      id: "logistics-2",
      title: "Route Optimization and Planning",
      description: "Optimize delivery routes for maximum efficiency and cost savings.",
      duration: "13:45",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Advanced" as const,
      tags: ["routes", "optimization", "planning"],
    },
    {
      id: "logistics-3",
      title: "Inventory Tracking and Management",
      description: "Track inventory levels and manage stock across multiple locations.",
      duration: "10:18",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Intermediate" as const,
      tags: ["inventory", "tracking", "stock"],
    },
    {
      id: "logistics-4",
      title: "Reporting and KPI Dashboard",
      description: "Generate reports and monitor key performance indicators.",
      duration: "8:55",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Intermediate" as const,
      tags: ["reporting", "kpi", "dashboard"],
    },
  ],
  riders: [
    {
      id: "rider-1",
      title: "Rider App Setup and Getting Started",
      description: "Download the app, complete registration, and start your first delivery.",
      duration: "6:42",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["setup", "registration", "getting-started"],
    },
    {
      id: "rider-2",
      title: "Navigation and GPS Features",
      description: "Use built-in navigation tools and GPS features for efficient deliveries.",
      duration: "7:15",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["navigation", "gps", "delivery"],
    },
    {
      id: "rider-3",
      title: "Earnings and Payment System",
      description: "Understand how earnings are calculated and how to get paid.",
      duration: "5:28",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Beginner" as const,
      tags: ["earnings", "payment", "money"],
    },
    {
      id: "rider-4",
      title: "Safety Guidelines and Best Practices",
      description: "Important safety tips and best practices for delivery riders.",
      duration: "9:33",
      videoId: "dQw4w9WgXcQ",
      thumbnail: "/placeholder.svg?height=180&width=320",
      difficulty: "Intermediate" as const,
      tags: ["safety", "guidelines", "best-practices"],
    },
  ],
}

const roleIcons = {
  users: Users,
  vendors: Package,
  logistics: Truck,
  riders: Bike,
}

const difficultyColors = {
  Beginner: "bg-green-100 text-green-800",
  Intermediate: "bg-yellow-100 text-yellow-800",
  Advanced: "bg-red-100 text-red-800",
}

export default function TutorialsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("users")

  const filterTutorials = (tutorials: Tutorial[]) => {
    if (!searchTerm) return tutorials
    return tutorials.filter(
      (tutorial) =>
        tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tutorial.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }

  const VideoCard = ({ tutorial }: { tutorial: Tutorial }) => {
    const IconComponent = roleIcons[activeTab as keyof typeof roleIcons]

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow group">
            <div className="relative">
              <img
                src={tutorial.thumbnail || "/placeholder.svg"}
                alt={tutorial.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors rounded-t-lg flex items-center justify-center">
                <div className="bg-white/90 rounded-full p-3 group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 text-gray-800 ml-1" />
                </div>
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {tutorial.duration}
              </div>
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight">{tutorial.title}</CardTitle>
                <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
              <CardDescription className="text-sm">{tutorial.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge className={difficultyColors[tutorial.difficulty]}>{tutorial.difficulty}</Badge>
                <div className="flex gap-1">
                  {tutorial.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{tutorial.title}</DialogTitle>
            <DialogDescription>{tutorial.description}</DialogDescription>
          </DialogHeader>
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${tutorial.videoId}`}
              title={tutorial.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
    

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="logistics" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Logistics
            </TabsTrigger>
            <TabsTrigger value="riders" className="flex items-center gap-2">
              <Bike className="h-4 w-4" />
              Riders
            </TabsTrigger>
          </TabsList>

          {/* Search Bar */}
          <div className="relative mb-8 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tutorials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tutorial Content */}
          <TabsContent value="users">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterTutorials(tutorials.users).map((tutorial) => (
                <VideoCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterTutorials(tutorials.vendors).map((tutorial) => (
                <VideoCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logistics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterTutorials(tutorials.logistics).map((tutorial) => (
                <VideoCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="riders">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterTutorials(tutorials.riders).map((tutorial) => (
                <VideoCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {Object.values(tutorials).every((roleVideos) => filterTutorials(roleVideos).length === 0) && searchTerm && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tutorials found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms or browse all tutorials</p>
            <Button variant="outline" onClick={() => setSearchTerm("")} className="mt-4">
              Clear Search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
