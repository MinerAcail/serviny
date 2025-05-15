import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle } from "lucide-react"
import { VendorLocationSelector } from "./components/vendor-location-selector"
import { IsochroneMap } from "./components/isochrone-map"

// Added for better logging
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function VendorFlowPage() {
  const [vendorLocation, setVendorLocation] = useState<{
    address: string
    lat: number
    lng: number
    placeId?: string
  } | null>(null)

  const [isochrones, setIsochrones] = useState<{
    features: any[]
    loading: boolean
    error: string | null
    rawResponse: any | null // Added to store the raw API response
  }>({
    features: [],
    loading: false,
    error: null,
    rawResponse: null
  })

  // Added for debugging
  const [apiLogs, setApiLogs] = useState<{
    request: any | null
    response: any | null
    error: any | null
    timestamp: string | null
  }>({
    request: null,
    response: null,
    error: null,
    timestamp: null
  })

  const handleLocationSelect = async (location: {
    address: string
    lat: number
    lng: number
    placeId?: string
  }) => {
    setVendorLocation(location)

    setIsochrones({
      features: [],
      loading: false,
      error: null,
      rawResponse: null
    })

    // Clear previous logs when a new location is selected
    setApiLogs({
      request: null,
      response: null,
      error: null,
      timestamp: null
    })
  }

  const generateIsochrones = async () => {
    if (!vendorLocation) return

    setIsochrones({
      features: [],
      loading: true,
      error: null,
      rawResponse: null
    })

    // Create request payload
    const requestPayload = {
      locations: [[vendorLocation.lng, vendorLocation.lat]], // OpenRouteService expects [longitude, latitude]
      range: [600, 1200, 1800], // 10, 20, 30 minutes in seconds
      range_type: "time",
      attributes: ["total_pop"],
      location_type: "start",
      area_units: "km"
    }

    // Update log with request information
    setApiLogs(prev => ({
      ...prev,
      request: requestPayload,
      timestamp: new Date().toISOString()
    }))

    try {
    //   console.log("OpenRouteService API Request:", requestPayload)

      const response = await fetch("https://api.openrouteservice.org/v2/isochrones/driving-car", {
        method: "POST",
        headers: {
          "Authorization": import.meta.env.VITE_OPENROUTE_SERVICE_API_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json, application/geo+json"
        },
        body: JSON.stringify(requestPayload)
      })

      // Log raw response status
    //   console.log("OpenRouteService API Response Status:", response.status)
      
      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenRouteService API Error:", errorData)
        
        // Update log with error information
        setApiLogs(prev => ({
          ...prev,
          error: errorData,
          response: null
        }))
        
        throw new Error(errorData.error?.message || "Failed to generate isochrones")
      }

      // Parse successful response
      const data = await response.json()
    //   console.log("OpenRouteService API Response Data:", data)
      
      // Update logs with successful response
      setApiLogs(prev => ({
        ...prev,
        response: data,
        error: null
      }))
      
      setIsochrones({
        features: data.features,
        loading: false,
        error: null,
        rawResponse: data
      })
    } catch (error) {
      console.error("Error generating isochrones:", error)
      
      setIsochrones({
        features: [],
        loading: false,
        error: error instanceof Error ? error.message : "Failed to generate isochrones",
        rawResponse: null
      })
    }
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <Tabs defaultValue="location" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="location">1. Select Location</TabsTrigger>
          <TabsTrigger value="zones" disabled={!vendorLocation}>
            2. Define Delivery Zones
          </TabsTrigger>
       
        </TabsList>

        <TabsContent value="location">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Location</CardTitle>
              <CardDescription>
                Search for your business location or click on the map to select a specific point.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorLocationSelector onLocationSelect={handleLocationSelect} />
            </CardContent>
            {vendorLocation && (
              <CardFooter className="flex justify-end">
                <Button onClick={generateIsochrones}>Generate Delivery Zones</Button>
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Zones</CardTitle>
              <CardDescription>Your delivery zones based on travel time from your location.</CardDescription>
            </CardHeader>
            <CardContent>
              {isochrones.loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mr-2" />
                  <p>Generating delivery zones...</p>
                </div>
              ) : isochrones.error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Error generating delivery zones</p>
                    <p className="mt-1">{isochrones.error}</p>
                    <Button variant="outline" className="mt-4" onClick={generateIsochrones}>
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : isochrones.features.length > 0 ? (
                <div className="space-y-6">
                  <IsochroneMap vendorLocation={vendorLocation} isochrones={isochrones.features} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <PricingCard
                      title="Zone 1 (0-10 min)"
                      color="#4ade80"
                      description="Closest to your location"
                      price="Base Price"
                    />
                    <PricingCard
                      title="Zone 2 (10-20 min)"
                      color="#facc15"
                      description="Medium distance"
                      price="Base Price + $2.00"
                    />
                    <PricingCard
                      title="Zone 3 (20-30 min)"
                      color="#f87171"
                      description="Furthest delivery range"
                      price="Base Price + $5.00"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="mb-4">No delivery zones generated yet.</p>
                  <Button onClick={generateIsochrones}>Generate Delivery Zones</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

       
      </Tabs>
    </div>
  )
}

function PricingCard({
  title,
  color,
  description,
  price,
}: {
  title: string
  color: string
  description: string
  price: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <p className="text-xl font-bold">{price}</p>
      </CardContent>
    </Card>
  )
}