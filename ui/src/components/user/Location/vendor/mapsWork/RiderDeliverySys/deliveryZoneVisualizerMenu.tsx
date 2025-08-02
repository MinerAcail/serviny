"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, Navigation, X, Compass, Map, User,  MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface IsochroneProps {
  id: string
  address?: string
  locations?: number[][]
  createdAt: string
  transportMode?: string
  metaData?: Array<{
    id: string
    price: number
    duration: number
    distance: number
    zone: number
  }>
}

interface ZoneDetailsProps {
  color: string
  deliveryFee: number
  area: number
  price?: number
  distance?: number
  zone?: number
}

interface RiderInfo {
  id: string
  name: string
  email: string
  dpfile?: string
  availability: boolean
  coordinates?: number[]
  experience: string
  minPrice: number
  maxPrice: number
  minDistance: number
  maxDistance: number
  totalZones: number
}

interface VendorMapData {
  riders: {
    rider: RiderInfo
    mapData: IsochroneProps[]
  }
}

interface DeliveryZoneVisualizerProps {
  // Vendor data
  vendorMapData: VendorMapData[]
  allRiders?: RiderInfo[]
  // Selected rider data
  selectedRiderMapData: IsochroneProps[]
  selectedRiderId: string | null
  selectedIsochroneIndex: number
  // Zone data
  zoneDetails: ZoneDetailsProps[]
  activeZoneIndex: number | null
  // Handlers
  setActiveZoneIndex: (index: number | null) => void
  setSelectedIsochroneIndex: (index: number) => void
  onRiderSelect: (riderId: string) => void
  // UI state
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  showAllRiderIsochrones: () => void
  setOpenDeliveryZoneVisualizerMenu?: (isOpen: boolean) => void
}

export function DeliveryZoneVisualizerMenu({
  vendorMapData,
  allRiders,
  selectedRiderMapData,
  selectedRiderId,
  selectedIsochroneIndex,
  zoneDetails,
  activeZoneIndex,
  setActiveZoneIndex,
  setSelectedIsochroneIndex,
  onRiderSelect,
  isOpen,
  setIsOpen,
  showAllRiderIsochrones,
  setOpenDeliveryZoneVisualizerMenu,
}: DeliveryZoneVisualizerProps) {
  const [view, setView] = useState<"riders" | "areas" | "zones">("riders")
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close drawer when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node) && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen])
// console.log('DeliveryZoneVisualizerMenu - vendorMapData:', vendorMapData);	

  return (
    <div className="relative w-full h-full">
      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-[75px] right-3 z-10"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full h-8 px-4 bg-white text-black hover:bg-white/90 shadow-lg border-0 ring-1 ring-black/5"
            >
              <Map className="h-5 w-5 mr-2" />
              <span>Select Area</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={drawerRef}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-4 bottom-4 z-20 w-[320px] max-w-[90vw] max-h-[80vh] overflow-hidden rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border-0 ring-1 ring-black/5"
          >
            <div className="flex flex-col h-full">
              {/* Header with tabs */}
              <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <div className="flex space-x-1">
                  <Button
                    variant={view === "riders" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("riders")}
                    className={cn(
                      "text-xs px-3",
                      view === "riders" ? "bg-[#0071E3] text-white" : ""
                    )}
                  >
                    <User className="h-3 w-3 mr-1" />
                    Riders
                  </Button>
                  {/* <Button
                    variant={view === "areas" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("areas")}
                    className={cn(
                      "text-xs px-3",
                      view === "areas" ? "bg-[#0071E3] text-white" : ""
                    )}
                    disabled={!selectedRiderId}
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    Areas
                  </Button> */}
                  <Button
                    variant={view === "zones" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("zones")}
                    className={cn(
                      "text-xs px-3",
                      view === "zones" ? "bg-[#0071E3] text-white" : ""
                    )}
                    disabled={!selectedRiderId || zoneDetails.length === 0}
                  >
                    Details
                  </Button>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content area with scrolling */}
              <div className="overflow-y-auto p-3 flex-grow">
                <AnimatePresence mode="wait">
                  {view === "riders" && (
                    <motion.div
                      key="riders"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <RidersList
                        vendorMapData={vendorMapData}
                        allRiders={allRiders}
                        selectedRiderId={selectedRiderId}
                        onRiderSelect={onRiderSelect}
                        onSelectComplete={() => {
                          // Show all isochrones for the selected rider immediately
                          showAllRiderIsochrones()
                          // Navigate to areas tab
                          setView("zones")
                        }}
                      />
                    </motion.div>
                  )}

                  {/* {view === "areas" && selectedRiderId && (
                    <motion.div
                      key="areas"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IsochroneSelector
                        isochrones={selectedRiderMapData}
                        selectedIndex={selectedIsochroneIndex}
                        onSelect={(index) => {
                          setSelectedIsochroneIndex(index)
                          setActiveZoneIndex(null)
                          showAllRiderIsochrones()
                          
                          if (setOpenDeliveryZoneVisualizerMenu) {
                            setOpenDeliveryZoneVisualizerMenu(false)
                          }
                        }}
                      />
                    </motion.div>
                  )} */}

                  {view === "zones" && (
                    <motion.div
                      key="zones"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ZoneList
                        zones={zoneDetails}
                        activeZoneIndex={activeZoneIndex}
                        setActiveZoneIndex={setActiveZoneIndex}
                        showAllRiderIsochrones={showAllRiderIsochrones}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RidersList({
  vendorMapData,
  allRiders,
  selectedRiderId,
  onRiderSelect,
  onSelectComplete,
}: {
  vendorMapData: VendorMapData[]
  allRiders?: RiderInfo[]
  selectedRiderId: string | null
  onRiderSelect: (riderId: string) => void
  onSelectComplete: () => void
}) {
  // Debug logging
  // console.log('RidersList - vendorMapData:', vendorMapData);
  // console.log('RidersList - allRiders:', allRiders);

  // Use allRiders if available, otherwise extract from vendorMapData
  const ridersToShow = allRiders && allRiders.length > 0 
    ? allRiders 
    : vendorMapData.map(({ riders }) => {
        const rider = riders.rider;
        const mapData = riders.mapData;
        
        // Process rider data directly if allRiders is not available
        let minPrice = Infinity;
        let maxPrice = 0;
        let minDistance = Infinity;
        let maxDistance = 0;
        let totalZones = 0;
        
        mapData.forEach((isochrone) => {
          if (isochrone.metaData && isochrone.metaData.length > 0) {
            isochrone.metaData.forEach((meta) => {
              if (meta.price !== undefined && meta.price !== null) {
                minPrice = Math.min(minPrice, meta.price);
                maxPrice = Math.max(maxPrice, meta.price);
              }
              
              if (meta.distance !== undefined && meta.distance !== null && meta.distance > 0) {
                minDistance = Math.min(minDistance, meta.distance);
                maxDistance = Math.max(maxDistance, meta.distance);
              }
            });
            totalZones += isochrone.metaData.length;
          }
        });
        
        return {
          ...rider,
          minPrice: minPrice === Infinity ? 0 : minPrice,
          maxPrice: maxPrice === 0 ? (minPrice === Infinity ? 0 : minPrice) : maxPrice,
          minDistance: minDistance === Infinity ? 0 : minDistance,
          maxDistance: maxDistance === 0 ? (minDistance === Infinity ? 0 : minDistance) : maxDistance,
          totalZones,
        };
      });

  console.log('RidersList - ridersToShow:', ridersToShow);

  if (!ridersToShow.length) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-500">No riders available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[#1D1D1F]">Available Riders</h3>
      <div className="space-y-2">
        {ridersToShow.map((rider, index) => {
          const isSelected = selectedRiderId === rider?.id
          
          // console.log(`Rendering rider ${rider?.name}:`, {
          //   minPrice: rider?.minPrice,
          //   maxPrice: rider?.maxPrice,
          //   minDistance: rider?.minDistance,
          //   maxDistance: rider?.maxDistance,
          //   totalZones: rider?.totalZones
          // });

          return (
            <motion.button
              key={rider?.id}
              onClick={() => {
                onRiderSelect(rider?.id)
                setTimeout(() => onSelectComplete(), 300) // Show isochrones and navigate to areas
              }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all duration-200 relative overflow-hidden",
                "border-0 ring-1",
                isSelected 
                  ? "bg-[#0071E3]/5 ring-[#0071E3]" 
                  : "bg-[#F5F5F7] ring-black/5 hover:bg-[#F5F5F7]/80"
              )}
            >
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                  <AvatarImage src={rider?.dpfile} alt={rider?.name} />
                  <AvatarFallback className="bg-[#0071E3] text-white text-sm font-medium">
                    {rider?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Name and availability */}
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm truncate text-[#1D1D1F]">
                      {rider?.name}
                    </h4>
                    <Badge 
                      variant={rider?.availability ? "default" : "secondary"}
                      className={cn(
                        "text-xs px-2 py-0",
                        rider?.availability 
                          ? "bg-green-100 text-green-800 border-green-200" 
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {rider?.availability ? "Available" : "Rider Service"}
                    </Badge>
                  </div>

                  {/* Experience */}
                  <p className="text-xs text-[#86868B] mb-2">{rider?.experience}</p>

                  {/* Pricing and coverage info from metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center text-[#86868B]">
                      {/* <DollarSign className="h-3 w-3 mr-1" /> */}
                      <span>
                        GH₵{(rider?.minPrice || 0).toFixed(2)}
                        {(rider?.maxPrice || 0) > (rider?.minPrice || 0) ? ` - ${(rider?.maxPrice || 0).toFixed(2)}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center text-[#86868B]">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>
                        {(rider?.minDistance || 0).toFixed(1)}
                        {(rider?.maxDistance || 0) > (rider?.minDistance || 0) ? ` - ${(rider?.maxDistance || 0).toFixed(1)}` : ''} km
                      </span>
                    </div>
                  </div>

                  {/* Total zones and transport mode */}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-[#0071E3] font-medium">
                      {rider?.totalZones || 0} delivery zone{(rider?.totalZones || 0) !== 1 ? 's' : ''}
                    </span>
                    {/* Show transport mode if available from rider's isochrones */}
                    {vendorMapData.find(v => v.riders.rider?.id === rider?.id)?.riders.mapData?.[0]?.transportMode && (
                      <div className="flex items-center text-xs text-[#86868B]">
                        <Navigation className="h-3 w-3 mr-1" />
                        <span className="capitalize">
                          {vendorMapData.find(v => v.riders.rider?.id === rider?.id)?.riders.mapData?.[0]?.transportMode}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isSelected && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#0071E3] flex items-center justify-center shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M5 12L10 17L20 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function IsochroneSelector({
  isochrones,
  selectedIndex,
  onSelect,
}: {
  isochrones: IsochroneProps[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (!isochrones.length) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-500">No delivery areas available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[#1D1D1F]">Select Your Closest Area</h3>
      <div className="space-y-2">
        {isochrones.map((isochrone, index) => {
          const createdDate = isochrone.createdAt ? new Date(isochrone.createdAt) : new Date()
          const dateString = createdDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })

          const locationName =
            isochrone.address ||
            (isochrone.locations && isochrone.locations.length > 0
              ? `Location (${isochrone.locations[0][1]?.toFixed(4)}, ${isochrone.locations[0][0]?.toFixed(4)})`
              : `Zone ${index + 1}`)

          const isSelected = selectedIndex === index

          // Calculate total zones from metadata
          const totalZones = isochrone.metaData?.length || 0

          return (
            <motion.button
              key={isochrone.id}
              onClick={() => onSelect(index)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full text-left p-3 rounded-xl transition-all duration-200 relative overflow-hidden",
                "border-0 ring-1",
                isSelected ? "bg-[#0071E3]/5 ring-[#0071E3]" : "bg-[#F5F5F7] ring-black/5 hover:bg-[#F5F5F7]/80",
              )}
            >
              <div className="font-medium text-sm truncate text-[#1D1D1F]">{locationName}</div>

              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center text-xs text-[#86868B]">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  <span>{dateString}</span>
                </div>
                <div className="text-xs text-[#0071E3] font-medium">
                  {totalZones} zone{totalZones !== 1 ? 's' : ''}
                </div>
              </div>

              {isochrone.transportMode && (
                <div className="flex items-center text-xs text-[#86868B] mt-1">
                  <Navigation className="h-3 w-3 mr-1.5" />
                  <span className="capitalize">{isochrone.transportMode}</span>
                </div>
              )}

              {isSelected && (
                <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#0071E3] flex items-center justify-center shadow-sm">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M5 12L10 17L20 7"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function ZoneList({
  zones,
  activeZoneIndex,
  setActiveZoneIndex,
  showAllRiderIsochrones,
}: {
  zones: ZoneDetailsProps[]
  activeZoneIndex: number | null
  setActiveZoneIndex: (index: number | null) => void
  showAllRiderIsochrones: () => void
}) {
  if (!zones.length) {
    return (
      <div className="text-center py-8">
        <Compass className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-sm text-gray-500">No zone details available</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1D1D1F]">Zone Details</h3>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => {
            showAllRiderIsochrones()
          }}
        >
          Show All
        </Button>
      </div>

      <div className="space-y-2">
        {zones.map((zone, index) => (
          <ZoneCard
            key={index}
            index={index}
            zone={zone}
            activeZoneIndex={activeZoneIndex}
            onClick={() => setActiveZoneIndex(index === activeZoneIndex ? null : index)}
          />
        ))}
      </div>
    </div>
  )
}

function ZoneCard({
  index,
  zone,
  activeZoneIndex,
  onClick,
}: {
  index: number
  zone: ZoneDetailsProps
  activeZoneIndex: number | null
  onClick?: () => void
}) {
  const isActive = activeZoneIndex === index

  return (
    <motion.div whileTap={{ scale: 0.98 }} className="relative">
      <Card
        className={cn(
          "overflow-hidden transition-all duration-200 border-0 rounded-xl cursor-pointer",
          "bg-white/80 backdrop-blur-md",
          isActive ? "ring-2 ring-[#0071E3]" : "ring-1 ring-black/5",
        )}
        onClick={onClick}
      >
        <div className="p-3 space-y-2">
          {/* Zone indicator pill */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: zone.color }} />
              <span className="text-sm font-medium text-[#1D1D1F]">Zone {index + 1}</span>
            </div>
            <div className="flex items-center text-xs text-[#86868B]">
              <Compass className="h-3.5 w-3.5 mr-1" />
              <span>{zone.area?.toFixed(1) || '0.0'} km²</span>
            </div>
          </div>

          {/* Delivery fee */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#86868B]">Delivery Fee</span>
            <span className={cn("text-lg font-semibold", zone.deliveryFee === 0 ? "text-[#34C759]" : "text-[#1D1D1F]")}>
              {zone.deliveryFee === 0 ? "Free" : `GH₵${zone.deliveryFee?.toFixed(2) || '0.00'}`}
            </span>
          </div>

          {/* Show distance if available from metadata */}
          {zone.distance && zone.distance > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#86868B]">Coverage</span>
              <span className="text-sm font-medium text-[#1D1D1F]">
                {zone.distance.toFixed(1)} km radius
              </span>
            </div>
          )}

          {/* Progress indicator for active state */}
          {isActive && (
            <div className="w-full h-1 bg-[#F2F2F7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0071E3]"
                style={{ width: `${Math.min(100, (zone.area || 0) * 10)}%` }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#0071E3] flex items-center justify-center shadow-sm">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12L10 17L20 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </motion.div>
  )
}