"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Clock, Loader2 } from "lucide-react"

type TransportMode = "walking" | "bike" | "motorbike" | "car"

interface TimeStepProps {
  transportMode: TransportMode
  timeRanges: number[]
  onTimeSelect: (ranges: number[]) => void
  onGenerate: () => void
  onBack: () => void
  isLoading: boolean
}

export function TimeStep({ transportMode, timeRanges, onTimeSelect, onGenerate, onBack, isLoading }: TimeStepProps) {
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [customRange, setCustomRange] = useState<number[]>([timeRanges[0], timeRanges[1], timeRanges[2]])

  const handleAutoGenerateToggle = (checked: boolean) => {
    setAutoGenerate(checked)

    if (checked) {
      // Reset to default ranges based on transport mode
      const defaultRanges = transportMode === "walking" || transportMode === "bike" ? [10, 20, 30] : [20, 30, 60]

      setCustomRange(defaultRanges)
      onTimeSelect(defaultRanges)
    }
  }

  const handleRangeChange = (index: number, value: number[]) => {
    const newRanges = [...customRange]
    newRanges[index] = value[0]

    // Sort ranges to ensure they're in ascending order
    const sortedRanges = [...newRanges].sort((a, b) => a - b)

    setCustomRange(sortedRanges)
    onTimeSelect(sortedRanges)
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">Define Time Ranges</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set the delivery time ranges for your zones</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="auto-generate" checked={autoGenerate} onCheckedChange={handleAutoGenerateToggle} />
            <Label htmlFor="auto-generate" className="text-[#1D1D1F] dark:text-white font-medium">
              Auto-generate time zones
            </Label>
          </div>
        </div>

        <Card className="bg-[#F5F5F7] dark:bg-[#2C2C2E] border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-[#0071E3] mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-[#1D1D1F] dark:text-white">Time Ranges</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {autoGenerate
                  ? `Default ranges for ${transportMode}: ${timeRanges.join(", ")} minutes`
                  : "Customize your delivery time ranges"}
              </p>

              {!autoGenerate && (
                <div className="space-y-6 mt-4">
                  {customRange.map((value, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <Label className="text-sm text-gray-600 dark:text-gray-300">Zone {index + 1}</Label>
                        <span className="text-sm font-medium text-[#0071E3]">{value} minutes</span>
                      </div>
                      <Slider
                        value={[value]}
                        min={5}
                        max={120}
                        step={5}
                        onValueChange={(value) => handleRangeChange(index, value)}
                        className="[&>span]:bg-[#0071E3]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

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
            onClick={onGenerate}
            disabled={isLoading}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-full px-6 py-2 font-medium"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Delivery Zones"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
