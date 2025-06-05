"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CollapsibleInfoCardProps {
  icon: ReactNode
  title: string
  content: string
  variant?: "blue" | "green" | "gray"
}

export function CollapsibleInfoCard({ icon, title, content, variant = "blue" }: CollapsibleInfoCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const bgColor = {
    blue: "bg-blue-50/90 border-blue-200",
    green: "bg-green-50/90 border-green-200",
    gray: "bg-gray-50/90 border-gray-200",
  }[variant]

  const titleColor = {
    blue: "text-blue-900",
    green: "text-green-900",
    gray: "text-gray-900",
  }[variant]

  const contentColor = {
    blue: "text-blue-700",
    green: "text-green-700",
    gray: "text-gray-700",
  }[variant]

  return (
    <div className={`backdrop-blur-sm border rounded-xl shadow-sm overflow-hidden transition-all ${bgColor}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center space-x-2">
          {icon}
          <span className={`font-medium text-sm ${titleColor}`}>{title}</span>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <p className={`text-xs ${contentColor}`}>{content}</p>
        </div>
      )}
    </div>
  )
}
