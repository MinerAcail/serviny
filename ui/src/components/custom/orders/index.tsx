"use client"

import { useState } from "react"
import DeliveryTrackingPanel from "./delivery-tracking-panel"
import OrderManagementSystem from "./order-management-system"

// Sample data for demonstration
const sampleStops = [
  {
    id: "1",
    customerName: "John Smith",
    address: "123 Main St, Downtown",
    coordinates: [40.7128, -74.006] as [number, number],
    priority: "urgent" as const,
    status: "pending" as const,
    deliveryWindow: "9:00-11:00 AM",
    distance: 1200,
  },
  {
    id: "2",
    customerName: "Sarah Johnson",
    address: "456 Oak Ave, Midtown",
    coordinates: [40.7589, -73.9851] as [number, number],
    priority: "high" as const,
    status: "delivered" as const,
    deliveryWindow: "11:00 AM-1:00 PM",
    distance: 800,
  },
  {
    id: "3",
    customerName: "Mike Wilson",
    address: "789 Pine St, Uptown",
    coordinates: [40.7831, -73.9712] as [number, number],
    priority: "medium" as const,
    status: "pending" as const,
    deliveryWindow: "1:00-3:00 PM",
    distance: 1500,
  },
]

const sampleRider = {
  id: "rider1",
  name: "Alex Driver",
  coordinates: [40.7505, -73.9934] as [number, number],
}

const sampleMetrics = {
  completed: 1,
  pending: 2,
  urgentRemaining: 1,
  completionRate: 33.3,
  totalDistance: 15.2,
  estimatedTimeRemaining: 45,
  efficiencyScore: 8.5,
}

export default function VendorOrder() {
  const [isTracking, setIsTracking] = useState(false)
  const [selectedStop, setSelectedStop] = useState(sampleStops[0])
  const [showAllRoutes, setShowAllRoutes] = useState(true)
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false)
  const [autoFollow, setAutoFollow] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  const nextStop = sampleStops.find((stop) => stop.status === "pending")

  return (
  <OrderManagementSystem/>
  )
}
