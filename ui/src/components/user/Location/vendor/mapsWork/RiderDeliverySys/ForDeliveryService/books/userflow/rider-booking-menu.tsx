"use client"

import { useRef, useEffect } from "react"
import { Navigation, X, MapPin, CheckCircle, Package, Star, Phone, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { RiderProfile, PricingZone, DeliveryCalculation } from "../../riderBookingHooks"
import { ZONE_COLORS } from "@/components/config/map"

interface RiderBookingMenuProps {
  // Rider data
  riderProfile: RiderProfile | undefined
  riderZones: PricingZone[]

  // Booking flow
  currentStep: "locations" | "review" | "complete"
  calculation: DeliveryCalculation | null
  isBooking: boolean
  bookingComplete: boolean
  bookingReference: string | null

  // Handlers
  onBooking: () => void
  onReset: () => void
  setCurrentStep: (step: "locations" | "review" | "complete") => void

  // UI state
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function RiderBookingMenu({
  riderProfile,
  riderZones,
  currentStep,
  calculation,
  isBooking,
  bookingComplete,
  bookingReference,
  onBooking,
  onReset,
  setCurrentStep,
  isOpen,
  setIsOpen,
}: RiderBookingMenuProps) {
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

  const getStepTitle = () => {
    switch (currentStep) {
      case "locations":
        return "Select Locations"
      case "review":
        return "Review Delivery"
      case "complete":
        return "Booking Complete"
      default:
        return "Book Delivery"
    }
  }

  const getButtonText = () => {
    if (!riderProfile) return "Select Area"
    if (currentStep === "locations") return "Select Locations"
    if (currentStep === "review") return "Review Booking"
    if (currentStep === "complete") return "Booking Complete"
    return "Book Delivery"
  }

  return (
    <div className="relative w-full h-full">
      {/* Floating toggle button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <motion.div
            key="toggle-button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-[75px] right-3 z-10"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="rounded-full h-10 px-6 bg-white text-black hover:bg-white/90 shadow-lg border-0 ring-1 ring-black/5"
            >
              <Package className="h-4 w-4 mr-2" />
              <span>{getButtonText()}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-in drawer */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="booking-drawer"
            ref={drawerRef}
            initial={{ x: -350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -350, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute left-4 bottom-4 z-20 w-[350px] max-w-[90vw] max-h-[85vh] overflow-hidden rounded-2xl shadow-xl bg-white/95 backdrop-blur-md border-0 ring-1 ring-black/5"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">{getStepTitle()}</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content area with scrolling */}
              <div className="overflow-y-auto p-4 flex-grow">
                {/* Rider Profile Section - Always visible */}
                {riderProfile && (
                  <div className="mb-6">
                    <RiderProfileCard riderProfile={riderProfile} />
                  </div>
                )}

                {/* Pricing Zones - Always visible */}
                {riderZones.length > 0 && (
                  <div className="mb-6">
                    <PricingZonesCard zones={riderZones} />
                  </div>
                )}

                {/* Step content with animations */}
                <AnimatePresence mode="wait">
                  {currentStep === "locations" && (
                    <motion.div
                      key="step-locations"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <LocationsStep />
                    </motion.div>
                  )}

                  {currentStep === "review" && calculation && (
                    <motion.div
                      key="step-review"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ReviewStep
                        calculation={calculation}
                        isBooking={isBooking}
                        onBooking={onBooking}
                        onBack={() => setCurrentStep("locations")}
                      />
                    </motion.div>
                  )}

                  {currentStep === "complete" && (
                    <motion.div
                      key="step-complete"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CompleteStep
                        bookingReference={bookingReference}
                        calculation={calculation}
                        riderProfile={riderProfile}
                        onReset={onReset}
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

function RiderProfileCard({ riderProfile }: { riderProfile: RiderProfile }) {
  return (
    <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
            <AvatarImage src={riderProfile.dpfile || "/placeholder.svg"} alt={riderProfile.name} />
            <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
              {riderProfile.name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{riderProfile.name}</h3>
              <Badge variant="default" className="text-xs px-2 py-0 bg-green-100 text-green-800 border-green-200">
                Available
              </Badge>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                <span>4.8</span>
              </div>
              <span>Motorcycle</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">3+ years experience</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PricingZonesCard({ zones }: { zones: PricingZone[] }) {
  // const ZONE_COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa", "#a78bfa", "#f472b6"]
  return (
    <Card className="border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-900">Pricing Zones</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {zones.map((zone, index) => (
            <div
              key={`pricing-zone-${zone.id}-${index}`}
              className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ZONE_COLORS[index % ZONE_COLORS.length] }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {zone.startKm}km - {zone.endKm}km
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">${zone.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LocationsStep() {
  return (
    <Card className="border-0">
      <CardContent className="p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Select Your Locations</h3>
            <p className="text-sm text-gray-600">
              Choose your pickup and drop-off locations to see the delivery price.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReviewStep({
  calculation,
  isBooking,
  onBooking,
  onBack,
}: {
  calculation: DeliveryCalculation
  isBooking: boolean
  onBooking: () => void
  onBack: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Route Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-gray-900">Delivery Details</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Route */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">PICKUP</p>
                <p className="text-sm text-gray-900 truncate">{calculation.pickupLocation.address}</p>
              </div>
            </div>

            <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />

            <div className="flex items-start space-x-3">
              <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500">DROP-OFF</p>
                <p className="text-sm text-gray-900 truncate">{calculation.dropoffLocation.address}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-semibold text-gray-900">{calculation.distance}km</div>
              <div className="text-xs text-gray-500">Distance</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">{calculation.duration}</div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">${calculation.totalPrice.toFixed(2)}</div>
              <div className="text-xs text-gray-500">Total Price</div>
            </div>
          </div>

          {/* Matched Zone */}
          {calculation.matchedZone && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs font-medium text-blue-900">Pricing Zone</span>
              </div>
              <p className="text-xs text-blue-800">
                {calculation.matchedZone.startKm}km - {calculation.matchedZone.endKm}km zone
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={isBooking}>
          Back
        </Button>
        <Button onClick={onBooking} disabled={isBooking} className="flex-1">
          {isBooking ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Booking...
            </>
          ) : (
            <>
              <Package className="w-4 h-4 mr-2" />
              Confirm Booking
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function CompleteStep({
  bookingReference,
  calculation,
  riderProfile,
  onReset,
}: {
  bookingReference: string | null
  calculation: DeliveryCalculation | null
  riderProfile: RiderProfile | undefined
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      {/* Success Message */}
      <Card className="border-0 bg-green-50">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-900 mb-1">Booking Confirmed!</h3>
          <p className="text-sm text-green-700">Your delivery request has been sent to {riderProfile?.name}.</p>
        </CardContent>
      </Card>

      {/* Booking Reference */}
      {bookingReference && (
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Booking Reference</p>
              <p className="font-mono text-lg font-semibold text-gray-900">{bookingReference}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Summary */}
      {calculation && (
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-900">Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Distance</span>
              <span className="font-medium">{calculation.distance}km</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Duration</span>
              <span className="font-medium">{calculation.duration}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Zone</span>
              <span className="font-medium">
                {calculation.matchedZone?.startKm}km - {calculation.matchedZone?.endKm}km
              </span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium text-gray-900">Total Price</span>
              <span className="font-semibold text-lg text-blue-600">${calculation.totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {riderProfile && (
        <Card className="border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={riderProfile.dpfile || "/placeholder.svg"} alt={riderProfile.name} />
                  <AvatarFallback className="bg-blue-600 text-white text-xs">
                    {riderProfile.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{riderProfile.name}</p>
                  <p className="text-xs text-gray-500">Your delivery rider</p>
                </div>
              </div>
              {riderProfile.phone && (
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button onClick={onReset} className="w-full">
          <Package className="w-4 h-4 mr-2" />
          Book Another Delivery
        </Button>
        <Button variant="outline" className="w-full">
          <Navigation className="w-4 h-4 mr-2" />
          Track This Delivery
        </Button>
      </div>
    </div>
  )
}
