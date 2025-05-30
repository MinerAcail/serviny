"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Star, Calendar, Download, Filter } from "lucide-react"

export default function Analytics() {
  const performanceMetrics = [
    {
      title: "Average Delivery Time",
      value: "28 min",
      change: "-3 min",
      trend: "down",
      percentage: "12%",
    },
    {
      title: "Customer Satisfaction",
      value: "4.8/5.0",
      change: "+0.2",
      trend: "up",
      percentage: "8%",
    },
    {
      title: "Order Success Rate",
      value: "96.8%",
      change: "+1.2%",
      trend: "up",
      percentage: "5%",
    },
    {
      title: "Rider Efficiency",
      value: "85%",
      change: "+3%",
      trend: "up",
      percentage: "7%",
    },
  ]

  const topRiders = [
    {
      name: "Emma Davis",
      orders: 45,
      rating: 4.9,
      efficiency: 92,
    },
    {
      name: "Mike Johnson",
      orders: 42,
      rating: 4.8,
      efficiency: 89,
    },
    {
      name: "Sarah Chen",
      orders: 38,
      rating: 4.9,
      efficiency: 87,
    },
    {
      name: "Tom Wilson",
      orders: 35,
      rating: 4.7,
      efficiency: 85,
    },
  ]

  const hourlyData = [
    { hour: "6 AM", orders: 5 },
    { hour: "7 AM", orders: 12 },
    { hour: "8 AM", orders: 18 },
    { hour: "9 AM", orders: 25 },
    { hour: "10 AM", orders: 32 },
    { hour: "11 AM", orders: 28 },
    { hour: "12 PM", orders: 45 },
    { hour: "1 PM", orders: 52 },
    { hour: "2 PM", orders: 38 },
    { hour: "3 PM", orders: 42 },
    { hour: "4 PM", orders: 48 },
    { hour: "5 PM", orders: 55 },
    { hour: "6 PM", orders: 62 },
    { hour: "7 PM", orders: 58 },
    { hour: "8 PM", orders: 35 },
    { hour: "9 PM", orders: 22 },
    { hour: "10 PM", orders: 15 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Performance insights and delivery metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              {metric.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="flex items-center gap-1 text-xs">
                <span className={metric.trend === "up" ? "text-green-600" : "text-red-600"}>{metric.change}</span>
                <span className="text-muted-foreground">({metric.percentage} from last week)</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Hourly Orders Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Orders by Hour</CardTitle>
            <CardDescription>Today's order distribution throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hourlyData.map((data, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium">{data.hour}</div>
                  <div className="flex-1">
                    <Progress value={(data.orders / 62) * 100} className="h-2" />
                  </div>
                  <div className="w-12 text-sm text-right">{data.orders}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Best riders this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRiders.map((rider, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{rider.name}</div>
                    <div className="text-sm text-muted-foreground">{rider.orders} orders</div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-sm">{rider.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{rider.efficiency}% efficiency</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Zones Performance</CardTitle>
            <CardDescription>Performance by geographic area</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Downtown</span>
                <span>156 orders</span>
              </div>
              <Progress value={85} className="h-2" />
              <div className="text-xs text-muted-foreground">Avg time: 25 min</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uptown</span>
                <span>134 orders</span>
              </div>
              <Progress value={72} className="h-2" />
              <div className="text-xs text-muted-foreground">Avg time: 32 min</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Midtown</span>
                <span>98 orders</span>
              </div>
              <Progress value={53} className="h-2" />
              <div className="text-xs text-muted-foreground">Avg time: 28 min</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Eastside</span>
                <span>87 orders</span>
              </div>
              <Progress value={47} className="h-2" />
              <div className="text-xs text-muted-foreground">Avg time: 35 min</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Auto-Assignment Analytics</CardTitle>
            <CardDescription>Automated system performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Success Rate</span>
                <Badge className="bg-green-100 text-green-800">98.5%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Assignment Time</span>
                <span className="text-sm font-medium">1.2 seconds</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Manual Overrides</span>
                <span className="text-sm">4.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Optimization Score</span>
                <span className="text-sm font-medium">94/100</span>
              </div>
              <div className="pt-2">
                <div className="text-sm font-medium mb-2">Distance Optimization</div>
                <Progress value={94} className="h-2" />
                <div className="text-xs text-muted-foreground mt-1">Average 15% reduction in travel distance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Orders</div>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-xs text-green-600">+12% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Active Riders</div>
            <p className="text-2xl font-bold">24</p>
            <p className="text-xs text-blue-600">2 new this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Revenue</div>
            <p className="text-2xl font-bold">$18,450</p>
            <p className="text-xs text-green-600">+8% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Avg Rating</div>
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-xs text-green-600">+0.1 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm font-medium text-muted-foreground">Peak Hour</div>
            <p className="text-2xl font-bold">6 PM</p>
            <p className="text-xs text-muted-foreground">62 orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
