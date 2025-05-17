import { useState, useCallback, useEffect } from "react"
import { useQuery, gql } from "@apollo/client"
import { ZoneDetail, RangeType, TransportMode, Location } from "../types"
import { ZONE_COLORS, GET_ISOCHRONE_RESULT, SPEED_MAPPING } from "../constants"
import { calculateArea } from "../utils/geoCalculations"
import { addIsochrones } from "../utils/mapHelpers"

interface UseIsochronesProps {
  mapInstance: React.MutableRefObject<maplibregl.Map | null>
  mapLoaded: boolean
  isochroneUuid: string
  initialLocation: [number, number]
  rangeType: RangeType
  transportMode: TransportMode
}

interface UseIsochronesReturn {
  isochrones: any[]
  zoneDetails: ZoneDetail[]
  vendorLocation: Location | null
  activeZoneIndex: number | null
  loading: boolean
  error: string | null
  setActiveZoneIndex: React.Dispatch<React.SetStateAction<number | null>>
  handleZoneCardClick: (index: number) => void
  handleRefetch: () => void
}

export const useIsochrones = ({
  mapInstance,
  mapLoaded,
  isochroneUuid,
  initialLocation,
  rangeType,
  transportMode
}: UseIsochronesProps): UseIsochronesReturn => {
  // Isochrone and zones state
  const [isochrones, setIsochrones] = useState<any[]>([])
  const [zoneDetails, setZoneDetails] = useState<ZoneDetail[]>([])
  const [vendorLocation, setVendorLocation] = useState<Location | null>(null)
  const [activeZoneIndex, setActiveZoneIndex] = useState<number | null>(null)
  const [ranges, setRanges] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // GraphQL query for isochrones
  const {
    loading: isochroneLoading,
    error: isochroneError,
    data,
    refetch
  } = useQuery(GET_ISOCHRONE_RESULT, {
    variables: {
      uuid: isochroneUuid,
      location: initialLocation,
    },
    onError: (err) => {
      console.error("Error fetching isochrone:", err)
      setError("Failed to fetch isochrone data. Please try again.")
      setLoading(false)
    },
    onCompleted: (data) => {
      processIsochroneData(data)
    }
  })

  // Process isochrone data from API response
  const processIsochroneData = useCallback(
    (data: any) => {
      try {
        if (!data?.getIsochroneResult?.geojson) {
          setError("Failed to fetch isochrone data.")
          setLoading(false)
          return
        }

        // Parse the GeoJSON - handle potential double encoding
        let geojsonData
        const geojsonString = data.getIsochroneResult.geojson

        try {
          geojsonData = JSON.parse(geojsonString)
          // Check if it's a string (double-encoded)
          if (typeof geojsonData === "string") {
            geojsonData = JSON.parse(geojsonData)
          }
        } catch (err) {
          console.error("Failed to parse GeoJSON:", err)
          setError("Failed to parse GeoJSON data.")
          return
        }

        // Extract data from GraphQL response
        if (data.getIsochroneResult.range) {
          setRanges(data.getIsochroneResult.range)
        }

        // Extract vendor location
        if (data.getIsochroneResult.locations && data.getIsochroneResult.locations.length > 0) {
          const location = data.getIsochroneResult.locations[0]
          setVendorLocation({
            lng: location[0],
            lat: location[1],
            address: data.getIsochroneResult.address || "Vendor Location",
          })
        } else if (geojsonData.metadata?.query?.locations) {
          // Fallback to GeoJSON metadata
          const location = geojsonData.metadata.query.locations[0]
          setVendorLocation({
            lng: location[0],
            lat: location[1],
            address: data.getIsochroneResult.address || "Vendor Location",
          })
        }

        if (geojsonData.features && geojsonData.features.length > 0) {
          // Process the features
          const processedFeatures = geojsonData.features.map((feature: any, index: number) => {
            return {
              ...feature,
              properties: {
                ...feature.properties,
                group_index: index,
                range: ranges[index < ranges.length ? index : ranges.length - 1],
                color: ZONE_COLORS[index % ZONE_COLORS.length],
              },
            }
          })

          setIsochrones(processedFeatures)

          // Calculate zone details
          calculateZoneDetails(processedFeatures, ranges)

          // Update map if already loaded
          if (mapLoaded && mapInstance.current) {
            addIsochrones(mapInstance.current, processedFeatures, activeZoneIndex)
          }
        } else {
          setError("No isochrone data available for this location.")
        }
      } catch (err) {
        console.error("Error processing isochrones:", err)
        setError("An error occurred while processing delivery zones.")
      } finally {
        setLoading(false)
      }
    },
    [mapLoaded, mapInstance, ranges, activeZoneIndex]
  )

  // Calculate zone details based on isochrones
  const calculateZoneDetails = useCallback(
    (isoFeatures: any[], ranges: number[]) => {
      if (!isoFeatures.length) return

      const details = isoFeatures.map((feature, index) => {
        // Calculate area in square kilometers
        const area = calculateArea(feature)

        // Calculate delivery fee (first zone often free)
        const deliveryFee = index === 0 ? 0 : 3 + index * 2

        // Estimate delivery time
        let baseTime: number
        if (rangeType === "time") {
          baseTime = ranges[index < ranges.length ? index : ranges.length - 1] // Already in minutes
        } else {
          baseTime = Math.round(
            (ranges[index < ranges.length ? index : ranges.length - 1] / SPEED_MAPPING[transportMode]) * 60,
          )
        }

        const bufferTime = 5 + index * 5
        const estimatedDeliveryTime = `${baseTime}-${baseTime + bufferTime} min`

        // Zone description
        const description =
          index === 0
            ? "Prime delivery zone with fastest service and no additional fees"
            : index === 1
              ? "Standard delivery zone with moderate delivery times"
              : "Extended delivery zone with longer delivery times"

        // Minimum order
        const minimumOrder = 15 + index * 5

        return {
          deliveryFee,
          estimatedDeliveryTime,
          description,
          minimumOrder,
          color: ZONE_COLORS[index % ZONE_COLORS.length],
          area,
          rangeValue: ranges[index < ranges.length ? index : ranges.length - 1],
        }
      })

      setZoneDetails(details)
    },
    [rangeType, transportMode]
  )

  // Update isochrones when activeZoneIndex changes
  useEffect(() => {
    if (mapLoaded && mapInstance.current && isochrones.length > 0) {
      addIsochrones(mapInstance.current, isochrones, activeZoneIndex)
    }
  }, [activeZoneIndex, mapLoaded, mapInstance, isochrones])

  // Handle zone card click
  const handleZoneCardClick = useCallback(
    (index: number) => {
      // Toggle active zone index
      setActiveZoneIndex(activeZoneIndex === index ? null : index)
    },
    [activeZoneIndex]
  )

  // Reload isochrone data
  const handleRefetch = useCallback(() => {
    setLoading(true)
    setError(null)
    refetch().catch((err) => {
      console.error("Error refetching isochrone data:", err)
      setError("Failed to refresh isochrone data.")
      setLoading(false)
    })
  }, [refetch])

  return {
    isochrones,
    zoneDetails,
    vendorLocation,
    activeZoneIndex,
    loading: loading || isochroneLoading,
    error: error || (isochroneError ? isochroneError.message : null),
    setActiveZoneIndex,
    handleZoneCardClick,
    handleRefetch
  }
}