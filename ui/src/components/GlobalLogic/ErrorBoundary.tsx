"use client"

import React from "react"
// import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
// import { NotificationAlertDialog } from "@/components/ui/notification-alert-dialog"
// "use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationAlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  type: "success" | "error" | "warning" | "info"
}

export function NotificationAlertDialog({ isOpen, onClose, title, description, type }: NotificationAlertDialogProps) {
  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertTriangle className="h-5 w-5 text-destructive" />,
    warning: <AlertTriangle className="h-5 w-5 text-orange-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  }

  const titleColorClass = {
    success: "text-green-700",
    error: "text-destructive",
    warning: "text-orange-700",
    info: "text-blue-700",
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className={cn("flex items-center gap-2", titleColorClass[type])}>
            {iconMap[type]}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error: string | null
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error.message || "An unexpected error occurred." }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Rider registration error:", error, errorInfo)
  }

  handleCloseErrorDialog = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.fallback || (
            <div className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          )}
          <NotificationAlertDialog
            isOpen={!!this.state.error}
            onClose={this.handleCloseErrorDialog}
            title="Application Error"
            description={this.state.error || "An unknown error occurred."}
            type="error"
          />
        </>
      )
    }
    return this.props.children
  }
}
