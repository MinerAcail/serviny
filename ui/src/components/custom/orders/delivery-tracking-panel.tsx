"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Route, Target, Play, Navigation, TrendingUp, Package, Clock } from "lucide-react"

interface DeliveryStop {
  id: string
  customerName: string
  address: string
  coordinates: [number, number]
  priority: "low" | "medium" | "high" | "urgent"
  status: "pending" | "delivered" | "failed"
  deliveryWindow: string
  distance?: number
}

interface Rider {
  id: string
  name: string
  coordinates: [number, number]
}

interface DeliveryMetrics {
  completed: number
  pending: number
  urgentRemaining: number
  completionRate: number
  totalDistance: number
  estimatedTimeRemaining: number
  efficiencyScore: number
}

interface DeliveryTrackingPanelProps {
  isTracking: boolean
  deliveryStops: DeliveryStop[]
  rider: Rider | null
  metrics: DeliveryMetrics
  nextStop: DeliveryStop | null
  selectedStop: DeliveryStop | null
  showAllRoutes: boolean
  showOptimizedRoute: boolean
  autoFollow: boolean
  onStartTracking: () => void
  onStopTracking: () => void
  onShowAllRoutesChange: (show: boolean) => void
  onShowOptimizedRouteChange: (show: boolean) => void
  onAutoFollowChange: (follow: boolean) => void
  onNavigateToNext: () => void
  onCenterOnRider: () => void
  onStopSelect: (stop: DeliveryStop) => void
  onPriorityFilter?: (priority: string) => void
  onStatusFilter?: (status: string) => void
  isExpanded: boolean
  onToggleExpanded: () => void
}

export default function DeliveryTrackingPanel({
  isTracking,
  deliveryStops,
  rider,
  metrics,
  nextStop,
  selectedStop,
  showAllRoutes,
  showOptimizedRoute,
  autoFollow,
  onStartTracking,
  onStopTracking,
  onShowAllRoutesChange,
  onShowOptimizedRouteChange,
  onAutoFollowChange,
  onNavigateToNext,
  onCenterOnRider,
  onStopSelect,
  onPriorityFilter,
  onStatusFilter,
  isExpanded,
  onToggleExpanded,
}: DeliveryTrackingPanelProps) {
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showStopsList, setShowStopsList] = useState(false)
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onToggleExpanded()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded, onToggleExpanded])

  const calculateETA = (from: [number, number], to: [number, number]) => {
    // Simple distance calculation for demo
    const distance = Math.sqrt(Math.pow(to[0] - from[0], 2) + Math.pow(to[1] - from[1], 2))
    const estimatedMinutes = Math.round(distance * 100) // Simplified calculation
    return `${estimatedMinutes} min`
  }

  const filteredStops = deliveryStops.filter((stop) => {
    const priorityMatch = priorityFilter === "all" || stop.priority === priorityFilter
    const statusMatch = statusFilter === "all" || stop.status === statusFilter
    return priorityMatch && statusMatch
  })

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value)
    onPriorityFilter?.(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    onStatusFilter?.(value)
  }

  return (
    <div ref={panelRef}>
      {!isExpanded ? (
        // Collapsed state - just show toggle button
        <Button
          onClick={onToggleExpanded}
          className="absolute top-4 left-4 z-10 rounded-full shadow-xl backdrop-blur-xl bg-white/95 border-0 hover:bg-white/100"
          size="lg"
        >
          <Package className="w-5 h-5 mr-2" />
          Delivery Panel
        </Button>
      ) : (
        // Expanded state - show full card
        <Card className="absolute top-4 left-4 z-10 w-80 max-w-[calc(100vw-2rem)] backdrop-blur-xl bg-white/95 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isTracking ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                <CardTitle className="text-lg">{isTracking ? "Live Tracking" : "Tracking Off"}</CardTitle>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  onClick={isTracking ? onStopTracking : onStartTracking}
                  variant={isTracking ? "destructive" : "default"}
                  size="sm"
                  className="rounded-full"
                >
                  {isTracking ? "Stop" : "Start"}
                </Button>
                <Button onClick={onToggleExpanded} variant="ghost" size="sm" className="rounded-full">
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          {/* Rest of the existing CardContent remains the same */}
          <CardContent className="space-y-4">
            {/* Quick Stats */}
            {isTracking && deliveryStops.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
                  <div className="text-xs text-green-700">Completed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">{metrics.pending}</div>
                  <div className="text-xs text-blue-700">Pending</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-xl">
                  <div className="text-2xl font-bold text-red-600">{metrics.urgentRemaining}</div>
                  <div className="text-xs text-red-700">Urgent</div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {isTracking && deliveryStops.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-medium">{metrics.completionRate.toFixed(0)}%</span>
                </div>
                <Progress value={metrics.completionRate} className="h-2" />
              </div>
            )}

            {/* Control Switches */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Show Stops</span>
                </div>
                <Switch checked={showAllRoutes} onCheckedChange={onShowAllRoutesChange} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Route className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Show Route</span>
                </div>
                <Switch checked={showOptimizedRoute} onCheckedChange={onShowOptimizedRouteChange} />
              </div>
              {isTracking && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Auto-follow</span>
                  </div>
                  <Switch checked={autoFollow} onCheckedChange={onAutoFollowChange} />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {nextStop && (
                <Button onClick={onNavigateToNext} size="sm" className="rounded-full" variant="default">
                  <Play className="w-4 h-4 mr-2" />
                  Next Stop
                </Button>
              )}
              {rider && (
                <Button onClick={onCenterOnRider} size="sm" variant="outline" className="rounded-full">
                  <Navigation className="w-4 h-4 mr-2" />
                  Center
                </Button>
              )}
            </div>

            {/* Sheet Triggers */}
            <div className="grid grid-cols-2 gap-2">
              <Sheet open={showAnalytics} onOpenChange={setShowAnalytics}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Delivery Analytics</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-green-600">{metrics.totalDistance}km</div>
                          <p className="text-sm text-gray-600">Total Distance</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-blue-600">{metrics.estimatedTimeRemaining}min</div>
                          <p className="text-sm text-gray-600">Time Remaining</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-2xl font-bold text-purple-600">{metrics.efficiencyScore}/hr</div>
                        <p className="text-sm text-gray-600">Efficiency Score</p>
                      </CardContent>
                    </Card>

                    {nextStop && rider && (
                      <Card>
                        <CardContent className="pt-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Next ETA:</span>
                              <span className="font-medium">
                                {calculateETA(rider.coordinates, nextStop.coordinates)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Window:</span>
                              <span className="font-medium">{nextStop.deliveryWindow}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Sheet open={showStopsList} onOpenChange={setShowStopsList}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="rounded-full">
                    <Package className="w-4 h-4 mr-2" />
                    Stops ({deliveryStops.length})
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Delivery Stops</SheetTitle>
                  </SheetHeader>

                  {/* Filters */}
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Priority</label>
                        <Select value={priorityFilter} onValueChange={handlePriorityFilterChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1 block">Status</label>
                        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(100vh-12rem)] mt-6">
                    <div className="space-y-3">
                      {filteredStops.map((stop, index) => (
                        <Card
                          key={stop.id}
                          className={`cursor-pointer transition-colors ${
                            selectedStop?.id === stop.id ? "ring-2 ring-blue-500" : ""
                          }`}
                          onClick={() => onStopSelect(stop)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium">{stop.customerName}</span>
                                  <Badge
                                    variant={
                                      stop.priority === "urgent"
                                        ? "destructive"
                                        : stop.priority === "high"
                                          ? "default"
                                          : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {stop.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{stop.address}</p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {stop.deliveryWindow}
                                  </span>
                                  {stop.distance && (
                                    <span>
                                      {stop.distance < 1000
                                        ? `${Math.round(stop.distance)}m`
                                        : `${(stop.distance / 1000).toFixed(1)}km`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-2">
                                <Badge
                                  variant={
                                    stop.status === "delivered"
                                      ? "default"
                                      : stop.status === "failed"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {stop.status}
                                </Badge>
                                {nextStop?.id === stop.id && (
                                  <Badge variant="secondary" className="text-xs">
                                    Next
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



