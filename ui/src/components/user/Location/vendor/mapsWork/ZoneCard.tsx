import { Card, CardContent } from "@/components/ui/card";
import { Compass } from "lucide-react";

interface ZoneCardProps {
  index: number;
  zone: {
    color: string;
    deliveryFee: number;
    area: number;
  };
  activeZoneIndex: number | null;
  onClick?: () => void;
}

export function ZoneCard({
  index,
  zone,
  activeZoneIndex,
  onClick,
}: ZoneCardProps) {
  return (
    <Card
      className={`rounded-xl overflow-hidden transition-all duration-200 border-0 shadow-sm hover:shadow-md ${
        activeZoneIndex === index ? "ring-2 ring-[#0071E3] shadow-md" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <div className="h-3" style={{ backgroundColor: zone.color }} />
        <CardContent className="p-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-[#1D1D1F] text-sm">
              Zone {index + 1}
            </h3>
            <div className="flex items-center text-xs text-[#86868B]">
              <Compass className="h-3.5 w-3.5 mr-1" />
              <span>{zone.area.toFixed(1)} km²</span>
            </div>
          </div>

          <p
            className={`text-lg font-semibold ${
              zone.deliveryFee === 0 ? "text-green-600" : "text-[#1D1D1F]"
            }`}
          >
            {zone.deliveryFee === 0
              ? "Free Delivery"
              : `$${zone.deliveryFee.toFixed(2)}`}
          </p>
        </CardContent>
      </div>
    </Card>
  );
}
