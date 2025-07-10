"use client"

import type * as React from "react"
import { useState } from "react"
import { Bell, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePushNotifications } from "./usePushNotifications"

interface NotificationDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationDialog: React.FC<NotificationDialogProps> = ({ isOpen, onClose }) => {
  const { subscribe, isLoading } = usePushNotifications()
  const [error, setError] = useState<string | null>(null)

  const handleEnable = async () => {
    try {
      console.log("🚀 Starting handleEnable...")
      setError(null)
      
      const result = await subscribe()
      console.log("✅ Subscribe result:", result)
      
      if (result) {
        console.log("🎉 Subscription successful, closing dialog")
        onClose()
      }
    } catch (error) {
      console.error("❌ Failed to enable notifications:", error)
      
      let errorMessage = "Failed to enable notifications. Please try again."
      
      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes("denied")) {
          errorMessage = "Notification permission was denied. Please enable notifications in your browser settings."
        } else if (error.message.includes("VAPID")) {
          errorMessage = "Configuration error. Please contact support."
        } else if (error.message.includes("not supported")) {
          errorMessage = "Push notifications are not supported in this browser."
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again."
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      setError(errorMessage)
    }
  }

  const handleDismiss = () => {
    console.log("📝 Dismissing dialog...")
    localStorage.setItem("pushNotificationStatus", "dismissed")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader className="flex flex-row items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <DialogTitle id="notification-dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
              Stay Updated 
            </DialogTitle>
            <DialogDescription id="notification-dialog-description" className="text-sm text-muted-foreground mb-4">
              Get instant notifications for your service, even when the app is closed. Never miss an opportunity!
            </DialogDescription>
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

       

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button onClick={handleEnable} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enabling...
              </span>
            ) : (
              "Enable Notifications"
            )}
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="w-full sm:w-auto bg-transparent">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}