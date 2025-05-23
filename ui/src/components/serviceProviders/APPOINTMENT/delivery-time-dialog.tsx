"use client"

import { useState } from "react"
// import { format } from "date-fns"
import { CalendarIcon, ClockIcon, Minus, Plus, Settings, X, Check, ChevronRight } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent,  DialogTitle } from "@/components/ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type DeliverySegment = {
  startTime: string
  endTime: string
  startDate: Date
  endDate: Date
  formattedDate: string
}

interface DeliveryTimeDialogProps {
  isOpen: boolean
  onClose: () => void
  deliverySegments: DeliverySegment[]
  deliveryWaitTime: number
  maxDeliveryWaitTime: number
  decreaseWaitTime: () => void
  increaseWaitTime: () => void
  selectedStartTime: string | null
  onContinue: () => void
}

export function DeliveryTimeDialog({
  isOpen,
  onClose,
  deliverySegments,
  deliveryWaitTime,
  maxDeliveryWaitTime,
  decreaseWaitTime,
  increaseWaitTime,
  selectedStartTime,
  onContinue,
  
}: DeliveryTimeDialogProps) {
//   const [showSettings, setShowSettings] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [priorityDelivery, setPriorityDelivery] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl p-0 overflow-hidden">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between p-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">Delivery Time</DialogTitle>
            <div className="flex items-center gap-2">
              <DropdownMenu>
              
                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-900">Delivery Options</div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notifications" className="text-sm text-gray-700">Notifications</Label>
                      <Switch 
                        id="notifications" 
                        checked={notificationsEnabled}
                        onCheckedChange={setNotificationsEnabled}
                      />
                    </div>
                  </div>
                  <div className="px-2 py-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="priority" className="text-sm text-gray-700">Priority Delivery</Label>
                      <Switch 
                        id="priority" 
                        checked={priorityDelivery}
                        onCheckedChange={setPriorityDelivery}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer rounded-lg">
                    <span className="text-sm">Saved Addresses</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg">
                    <span className="text-sm">Delivery Preferences</span>
                    <ChevronRight className="ml-auto h-4 w-4" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Rider Arrival Time Selector */}
          {selectedStartTime && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Estimated Rider Arrival Time
                </h3>
              </div>
              
              <div className="p-6 bg-gradient-to-b from-blue-50 to-white">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-3xl font-semibold text-blue-600 mb-2">
                    {deliveryWaitTime} <span className="text-lg font-normal">{deliveryWaitTime === 1 ? "hour" : "hours"}</span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mb-4">after your order time</div>
                  
                  <div className="flex items-center space-x-6">
                    <Button
                      onClick={decreaseWaitTime}
                      variant="outline"
                      size="icon"
                      disabled={deliveryWaitTime <= 1}
                      className="h-10 w-10 rounded-full border-gray-300 shadow-sm hover:bg-gray-100 transition-all"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Button
                      onClick={increaseWaitTime}
                      variant="outline"
                      size="icon"
                      disabled={deliveryWaitTime >= maxDeliveryWaitTime}
                      className="h-10 w-10 rounded-full border-gray-300 shadow-sm hover:bg-gray-100 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Time Display */}
          {deliverySegments.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Your Delivery Schedule
                </h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {deliverySegments.map((segment, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start">
                      <div className="bg-blue-100 rounded-full p-2 mr-3">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">{segment.formattedDate}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-500">Order Time</div>
                            <div className="text-sm font-medium text-gray-900">{segment.startTime}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-xs text-gray-500">Estimated Arrival</div>
                            <div className="text-sm font-medium text-gray-900">{segment.endTime}</div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-2">
                        <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {priorityDelivery && (
                <div className="p-3 bg-amber-50 border-t border-amber-100">
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-xs font-medium text-amber-700">Priority delivery enabled</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white/90 backdrop-blur-sm border-t border-gray-100 p-4">
          <Button 
            onClick={onContinue}
            disabled={deliverySegments.length === 0}
            className="w-full rounded-full bg-blue-500 hover:bg-blue-600 text-white py-6 font-medium transition-all"
          >
            Continue with Delivery
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
