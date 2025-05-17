import React from "react"
import { Compass } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ZoneDetail } from "../types"

interface ZoneCardsProps {
  zoneDetails: ZoneDetail[]
  activeZoneIndex: number | null
  handleZoneCardClick: (index: number) => void
}

interface ZoneRangeProps {
  index: number
  zoneDetails: ZoneDetail[]
  rangeType: "time" | "distance"
}

export const formatRangeLabel = ({ index, zoneDetails, rangeType }: ZoneRangeProps): string => {
  if (!zoneDetails[index]) return ""

  if (index === 0) {
    // First zone: 0-X range
    return `0-${zoneDetails[index].rangeValue} ${rangeType === "distance" ? "km" : "min"}`
  } else {
    // Other zones: prevRange-currentRange
    const prevRange = zoneDetails[index - 1].rangeValue
    const currentRange = zoneDetails[index].rangeValue

    return `${prevRange}-${currentRange} ${rangeType === "distance" ? "km" : "min"}`
  }
}

export const ZoneCards: React.FC<ZoneCardsProps> = ({
  zoneDetails,
  activeZoneIndex,
  handleZoneCardClick
}) => {
  if (!zoneDetails.length) return null

  return (
    <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
      {zoneDetails.map((zone, index) => (
        <Card
          key={index}
          className={`rounded-xl overflow-hidden transition-all duration-200 border-0 shadow-sm hover:shadow-md ${
            activeZoneIndex === index
              ? "ring-2 ring-[#0071E3] shadow-md"
              : ""
          }`}
          onClick={() => handleZoneCardClick(index)}
        >
          <div
            className="h-2"
            style={{ backgroundColor: zone.color }}
          />
          <CardContent className="p-4">
            <h3 className="font-medium text-[#1D1D1F]">
              Zone {index + 1}
            </h3>

            <div className="flex justify-between items-center mt-3 mb-3">
              <div>
                <p className="text-lg font-semibold text-[#1D1D1F]">
                  {zone.deliveryFee === 0
                    ? "Free Delivery"
                    : `$${zone.deliveryFee.toFixed(2)}`}
                </p>
              </div>
              <div className="flex justify-between mt-2">
                <div className="flex items-center text-xs text-[#86868B]">
                  <Compass className="h-3.5 w-3.5 mr-1" />
                  {zone.area.toFixed(1)} km²
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}