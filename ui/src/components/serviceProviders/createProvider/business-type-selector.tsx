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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, ChevronRight, Store, Truck, Package, Calendar, Building2 } from "lucide-react"

interface Profession {
  value: string
  label: string
  description: string
  icon: React.ReactNode
  price: number
  category: "ecommerce" | "delivery" | "specialized"
}

export default function BusinessTypeSelector() {
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null)

  const professions: Profession[] = [
    // E-commerce models
    {
      value: "ecommerce-standard",
      label: "Standard E-commerce",
      description: "Essential features for small businesses",
      icon: <Store className="h-5 w-5" />,
      price: 499,
      category: "ecommerce",
    },
    {
      value: "ecommerce-enterprise",
      label: "Enterprise E-commerce",
      description: "Advanced features for large businesses",
      icon: <Building2 className="h-5 w-5" />,
      price: 1999,
      category: "ecommerce",
    },
    {
      value: "pre-order",
      label: "Pre-order",
      description: "Accept orders before product availability",
      icon: <Calendar className="h-5 w-5" />,
      price: 599,
      category: "ecommerce",
    },
    {
      value: "drop-shipping",
      label: "Drop-shipping",
      description: "Ship directly from suppliers",
      icon: <Package className="h-5 w-5" />,
      price: 399,
      category: "ecommerce",
    },

    // Delivery models
    {
      value: "delivery-standard",
      label: "Standard Delivery",
      description: "For small to medium logistics needs",
      icon: <Truck className="h-5 w-5" />,
      price: 299,
      category: "delivery",
    },
    {
      value: "delivery-enterprise",
      label: "Enterprise Delivery",
      description: "For large-scale delivery operations",
      icon: <Truck className="h-5 w-5" />,
      price: 1499,
      category: "delivery",
    },
  ]

  const handleSelect = (value: string, label: string) => {
    setSelectedType(value)
    setSelectedLabel(label)
  }

  const handleDone = () => {
    // Here you would typically pass the selected value to a parent component
    console.log("Selected business type:", selectedType)
    setOpen(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full max-w-md mx-auto h-12 px-4 rounded-full bg-white border border-gray-200 shadow-sm"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedLabel ? selectedLabel : "Select Business Type"}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-semibold text-center">Choose Business Type</DialogTitle>
            <DialogDescription className="text-center text-sm">
              Select the type of business model that fits your needs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ecommerce" className="w-full">
            <div className="px-6">
              <TabsList className="grid grid-cols-2 mb-4 rounded-full h-10 p-1 bg-gray-100">
                <TabsTrigger value="ecommerce" className="rounded-full text-xs">
                  E-commerce
                </TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-full text-xs">
                  Delivery
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[400px] px-6 pb-2">
              <TabsContent value="ecommerce" className="mt-0 space-y-2">
                {professions
                  .filter((p) => p.category === "ecommerce")
                  .map((profession) => (
                    <button
                      key={profession.value}
                      onClick={() => handleSelect(profession.value, profession.label)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedType === profession.value
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-white border border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            selectedType === profession.value ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          {profession.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">{profession.label}</p>
                          <p className="text-xs text-gray-500">{profession.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{formatPrice(profession.price)}</span>
                        {selectedType === profession.value && <Check className="h-5 w-5 text-blue-500" />}
                      </div>
                    </button>
                  ))}
              </TabsContent>

              <TabsContent value="delivery" className="mt-0 space-y-2">
                {professions
                  .filter((p) => p.category === "delivery")
                  .map((profession) => (
                    <button
                      key={profession.value}
                      onClick={() => handleSelect(profession.value, profession.label)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedType === profession.value
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-white border border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            selectedType === profession.value ? "bg-blue-100" : "bg-gray-100"
                          }`}
                        >
                          {profession.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">{profession.label}</p>
                          <p className="text-xs text-gray-500">{profession.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{formatPrice(profession.price)}</span>
                        {selectedType === profession.value && <Check className="h-5 w-5 text-blue-500" />}
                      </div>
                    </button>
                  ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="flex justify-between p-6 border-t border-gray-100">
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={!selectedType}
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
