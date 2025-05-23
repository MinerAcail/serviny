"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, ChevronRight, Store, Truck, Package, Calendar, Building2, Globe, Map, Users, User } from "lucide-react"

interface BusinessTypeOption {
  id: string
  title: string
  description: string
  price: number
  icon: React.ReactNode
  secondaryIcon?: React.ReactNode
}

interface BusinessTypeDetailsProps {
  businessType: string | null
  onSelect: (subType: string, label: string) => void
}

export default function BusinessTypeDetails({ businessType, onSelect }: BusinessTypeDetailsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  // Define options based on the selected business type
  const getOptions = (): BusinessTypeOption[] => {
    switch (businessType) {
      case "ecommerce-standard":
        return [
          {
            id: "ecommerce-standard-basic",
            title: "Standard E-commerce Only",
            description: "Basic storefront without delivery integration",
            price: 499,
            icon: <Store className="h-5 w-5" />,
          },
          {
            id: "ecommerce-standard-single",
            title: "Standard + Single Rider",
            description: "Includes one delivery rider for local logistics",
            price: 799,
            icon: <Store className="h-5 w-5" />,
            secondaryIcon: <User className="h-5 w-5" />,
          },
          {
            id: "ecommerce-standard-multi",
            title: "Standard + Multi-Rider (2-4)",
            description: "Includes a small team of 2–4 riders",
            price: 1299,
            icon: <Store className="h-5 w-5" />,
            secondaryIcon: <Users className="h-5 w-5" />,
          },
        ]
      case "ecommerce-enterprise":
        return [
          {
            id: "ecommerce-enterprise-basic",
            title: "Enterprise E-commerce Only",
            description: "Advanced e-commerce platform",
            price: 1999,
            icon: <Building2 className="h-5 w-5" />,
          },
          {
            id: "ecommerce-enterprise-nationwide",
            title: "Enterprise + Nationwide",
            description: "Covers delivery across the country",
            price: 2499,
            icon: <Building2 className="h-5 w-5" />,
            secondaryIcon: <Map className="h-5 w-5" />,
          },
          {
            id: "ecommerce-enterprise-worldwide",
            title: "Enterprise + Worldwide",
            description: "Global fulfillment capabilities",
            price: 4999,
            icon: <Building2 className="h-5 w-5" />,
            secondaryIcon: <Globe className="h-5 w-5" />,
          },
        ]
      case "pre-order":
        return [
          {
            id: "pre-order-basic",
            title: "Pre-order Only",
            description: "Basic pre-order system",
            price: 599,
            icon: <Calendar className="h-5 w-5" />,
          },
          {
            id: "pre-order-standard",
            title: "Pre-order + Standard Delivery",
            description: "With standard delivery options",
            price: 899,
            icon: <Calendar className="h-5 w-5" />,
            secondaryIcon: <Truck className="h-5 w-5" />,
          },
          {
            id: "pre-order-enterprise",
            title: "Pre-order + Enterprise Delivery",
            description: "With enterprise delivery capabilities",
            price: 2499,
            icon: <Calendar className="h-5 w-5" />,
            secondaryIcon: <Building2 className="h-5 w-5" />,
          },
        ]
      case "drop-shipping":
        return [
          {
            id: "drop-shipping-basic",
            title: "Dropshipping Only",
            description: "Basic dropshipping system",
            price: 399,
            icon: <Package className="h-5 w-5" />,
          },
          {
            id: "drop-shipping-standard",
            title: "Dropshipping + Standard Delivery",
            description: "With standard delivery options",
            price: 699,
            icon: <Package className="h-5 w-5" />,
            secondaryIcon: <Truck className="h-5 w-5" />,
          },
          {
            id: "drop-shipping-enterprise",
            title: "Dropshipping + Enterprise Delivery",
            description: "With enterprise delivery capabilities",
            price: 1999,
            icon: <Package className="h-5 w-5" />,
            secondaryIcon: <Building2 className="h-5 w-5" />,
          },
        ]
      case "delivery-standard":
        return [
          {
            id: "delivery-standard-basic",
            title: "Standard Delivery",
            description: "Basic delivery service",
            price: 299,
            icon: <Truck className="h-5 w-5" />,
          },
          {
            id: "delivery-standard-single",
            title: "Standard - Single Rider",
            description: "One delivery person manages all orders",
            price: 399,
            icon: <Truck className="h-5 w-5" />,
            secondaryIcon: <User className="h-5 w-5" />,
          },
          {
            id: "delivery-standard-multi",
            title: "Standard - Multi-Rider (2-4)",
            description: "Small fleet for increased delivery speed",
            price: 899,
            icon: <Truck className="h-5 w-5" />,
            secondaryIcon: <Users className="h-5 w-5" />,
          },
        ]
      case "delivery-enterprise":
        return [
          {
            id: "delivery-enterprise-basic",
            title: "Enterprise Delivery",
            description: "Advanced delivery service",
            price: 1499,
            icon: <Truck className="h-5 w-5" />,
          },
          {
            id: "delivery-enterprise-nationwide",
            title: "Enterprise - Nationwide",
            description: "Countrywide shipping capabilities",
            price: 1999,
            icon: <Truck className="h-5 w-5" />,
            secondaryIcon: <Map className="h-5 w-5" />,
          },
          {
            id: "delivery-enterprise-worldwide",
            title: "Enterprise - Worldwide",
            description: "Global fulfillment with international reach",
            price: 3999,
            icon: <Truck className="h-5 w-5" />,
            secondaryIcon: <Globe className="h-5 w-5" />,
          },
        ]
      default:
        return []
    }
  }

  const options = getOptions()

  const handleSelect = (id: string) => {
    setSelectedOption(id)
  }

  const handleDone = () => {
    if (selectedOption) {
      const option = options.find((o) => o.id === selectedOption)
      if (option) {
        onSelect(selectedOption, option.title)
      }
    }
    setOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  // Don't render if no business type is selected
  if (!businessType) return null

  const businessTypeLabel = (() => {
    switch (businessType) {
      case "ecommerce-standard":
        return "Standard E-commerce"
      case "ecommerce-enterprise":
        return "Enterprise E-commerce"
      case "pre-order":
        return "Pre-order"
      case "drop-shipping":
        return "Drop-shipping"
      case "delivery-standard":
        return "Standard Delivery"
      case "delivery-enterprise":
        return "Enterprise Delivery"
      default:
        return "Select Option"
    }
  })()

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full max-w-md mx-auto h-12 px-4 rounded-full bg-white border border-gray-200 shadow-sm"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedOption ? options.find((o) => o.id === selectedOption)?.title : `Select ${businessTypeLabel} Option`}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-semibold text-center">{businessTypeLabel} Options</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Select the specific option that fits your needs
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] px-6 pb-2">
            <div className="space-y-2 py-4">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                    selectedOption === option.id
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-white border border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${selectedOption === option.id ? "bg-blue-100" : "bg-gray-100"}`}>
                      <div className="flex items-center">
                        {option.icon}
                        {option.secondaryIcon && (
                          <>
                            <ChevronRight className="h-3 w-3 mx-0.5" />
                            {option.secondaryIcon}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-sm">{option.title}</p>
                      <p className="text-xs text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{formatPrice(option.price)}</span>
                    {selectedOption === option.id && <Check className="h-5 w-5 text-blue-500" />}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="flex justify-between p-6 border-t border-gray-100">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={!selectedOption}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
