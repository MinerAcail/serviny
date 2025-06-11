// Dashboard.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery, gql } from "@apollo/client"
import {
  RefreshCw,
  AlertCircle,
} from "lucide-react"
import SearchDataDasBoard from "./searchDasBoard"

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    getDashboardData {
      totalUsers
      totalBookingsIds
      recentActivityIds
      categoriesServiceTypes
    }
  }
`

export default function Dashboard() {
  const [isStatsOpen, setIsStatsOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const { loading, error, data, refetch } = useQuery(GET_DASHBOARD_DATA, {
    errorPolicy: "all",
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Failed to Load Dashboard</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dashboardData = data?.getDashboardData || {
    totalUsers: [],
    totalBookingsIds: [],
    recentActivityIds: [],
    categoriesServiceTypes: []
  }

  return (
    <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6 max-w-7xl">
      {/* Compact Header */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600">Overview of your contact management</p>
      </div>

      {/* Search Component with dashboard data passed down */}
      <SearchDataDasBoard 
        isMenuOpen={isMenuOpen}
        isStatsOpen={isStatsOpen}
        setIsMenuOpen={setIsMenuOpen}
        setIsStatsOpen={setIsStatsOpen}
        dashboardData={dashboardData}
        refetchDashboard={refetch}
      />
    </div>
  )
}
