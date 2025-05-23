"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, Navigation, X, Compass, Map } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface IsochroneProps {
  id: string
  address?: string
  locations?: number[][]
  createdAt: string
  transportMode?: string
}

interface ZoneDetailsProps {
  color: string
  deliveryFee: number
  area: number
}

interface DeliveryZoneVisualizerProps {
  riderIsochrones: IsochroneProps[]
  zoneDetails: ZoneDetailsProps[]
  selectedIsochroneIndex: number
  setSelectedIsochroneIndex: (index: number) => void
  activeZoneIndex: number | null
  setActiveZoneIndex: (index: number | null) => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  // Add new prop for showing all isochrones
  // Add these props
  showAllRiderIsochrones: () => void
  setOpenDeliveryZoneVisualizerMenu?: (isOpen: boolean) => void
}

export function DeliveryZoneVisualizerMenu({
  riderIsochrones,
  zoneDetails,
  selectedIsochroneIndex,
  setSelectedIsochroneIndex,
  activeZoneIndex,
  setActiveZoneIndex,
  isOpen,
   setIsOpen,
  showAllRiderIsochrones,
  setOpenDeliveryZoneVisualizerMenu,
   
}: DeliveryZoneVisualizerProps) {
  // const [isOpen, setIsOpen] = useState(true)
  const [view, setView] = useState<"isochrones" | "zones">("isochrones")
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
  }, [isOpen])

  return (
    <div className="relative w-full h-full">
      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            // className="absolute bottom-16 left-29 z-10"
         className="absolute bottom-[75.#
         bf,z1#
        '0d, px] right-3 z-10"

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
                <div className="flex space-x-2">
                  <Button
                    variant={view === "isochrones" ? "default" : "ghost"}
                    size="sm"
                    onClick={() =>
                       setView("isochrones")
                      
                      }
                    className={view === "isochrones" ? "bg-[#0071E3] text-white" : ""}
                  >
                    Area
                  </Button>
                  <Button
                    variant={view === "zones" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView("zones")}
                    className={view === "zones" ? "bg-[#0071E3] text-white" : ""}
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
                  {view === "isochrones" && (
                    <motion.div
                      key="isochrones"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <IsochroneSelector
                      isochrones={riderIsochrones}
                      selectedIndex={selectedIsochroneIndex}
                      onSelect={(index) => {
                        setSelectedIsochroneIndex(index)
                        setActiveZoneIndex(null)
                        // setView("zones")
                        // Show all rider isochrones on the map
                          showAllRiderIsochrones();
                          
                          // Optionally close the menu after selection
                          if (setOpenDeliveryZoneVisualizerMenu) {
                            setOpenDeliveryZoneVisualizerMenu(false);
                          }
                      }}
                      />
                    </motion.div>
                  )}

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
                        showAllRiderIsochrones={showAllRiderIsochrones} // Pass the function as a prop
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

function IsochroneSelector({
  isochrones,
  selectedIndex,
  onSelect,
}: {
  isochrones: IsochroneProps[]
  selectedIndex: number
  onSelect: (index: number) => void
}) {
  if (!isochrones.length) return null

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-[#1D1D1F]">Select Your Closest Area </h3>
      <div className="space-y-2">
        {isochrones.map((isochrone, index) => {
          // Format date
          const createdDate = new Date(isochrone.createdAt)
          const dateString = createdDate.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })

          // Get location name
          const locationName =
            isochrone.address ||
            (isochrone.locations && isochrone.locations.length > 0
              ? `Location (${isochrone.locations[0][1].toFixed(4)}, ${isochrone.locations[0][0].toFixed(4)})`
              : `Zone ${index + 1}`)

          const isSelected = selectedIndex === index

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

              <div className="flex items-center text-xs text-[#86868B] mt-1.5">
                <Calendar className="h-3 w-3 mr-1.5" />
                <span>{dateString}</span>
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
   showAllRiderIsochrones: () => void // Add this prop type
}) {
  if (!zones.length) return null

  return (
    <div className="space-y-3">
       <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#1D1D1F]">Zone Details</h3>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={() => {
            // Call the function directly from props
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
          "overflow-hidden transition-all duration-200 border-0 rounded-xl",
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
              <span>{zone.area.toFixed(1)} km²</span>
            </div>
          </div>

          {/* Delivery fee */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#86868B]">Delivery Fee</span>
            <span className={cn("text-lg font-semibold", zone.deliveryFee === 0 ? "text-[#34C759]" : "text-[#1D1D1F]")}>
              {zone.deliveryFee === 0 ? "Free" : `$${zone.deliveryFee.toFixed(2)}`}
            </span>
          </div>

          {/* Progress indicator for active state */}
          {isActive && (
            <div className="w-full h-1 bg-[#F2F2F7] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[#0071E3]"
                style={{ width: `${Math.min(100, zone.area * 10)}%` }}
              />
            </div>
          )}
        </div>
      </Card>

      {/* SF Symbol-like decorative element */}
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
