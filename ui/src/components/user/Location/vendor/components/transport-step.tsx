"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, Bike, Car, FootprintsIcon as Walking } from "lucide-react"

type TransportMode = "walking" | "bike" | "motorbike" | "car"

interface TransportStepProps {
  selectedMode: TransportMode
  onTransportSelect: (mode: TransportMode) => void
  onNext: () => void
  onBack: () => void
}

export function TransportStep({ selectedMode, onTransportSelect, onNext, onBack }: TransportStepProps) {
  const transportOptions = [
    { id: "walking", label: "Walking", icon: Walking, description: "Slower but more precise coverage" },
    { id: "bike", label: "Bike", icon: Bike, description: "Good for urban deliveries" },
    { id: "motorbike", label: "Motorbike", icon: Bike, description: "Fast for medium distances" },
    { id: "car", label: "Car", icon: Car, description: "Best for longer distances" },
  ]

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Select Transport Mode</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Choose how your deliveries will be made</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transportOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedMode === option.id

            return (
              <Card
                key={option.id}
                className={`
                  cursor-pointer transition-all border-2 p-4
                  ${
                    isSelected
                      ? "border-[#0071E3] bg-[#F5F5F7] dark:bg-[#2C2C2E]"
                      : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
                  }
                `}
                onClick={() => onTransportSelect(option.id as TransportMode)}
              >
                <div className="flex items-center">
                  <div
                    className={`
                    p-3 rounded-full mr-4
                    ${
                      isSelected
                        ? "bg-[#0071E3]/10 text-[#0071E3]"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }
                  `}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[#1D1D1F] dark:text-white">{option.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            className="rounded-full px-5 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={onNext}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
