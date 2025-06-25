"use client"

import type React from "react"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Type Definitions
interface PriceCard {
  card: {
    id: string
    title: string
    description: string
  }
  prices: Array<{
    id: string
    label: string
    value: string
  }>
  amenities: Array<{
    id: string
    text: string
  }>
}

interface Policy {
  policy: {
    id: string
    name: string
    description: string
  }
  policyDetails: Array<{
    id: string
    title: string
    content: string
    listItems: string[]
  }>
}

// Price Card Selection Component
export const PriceCardSelection: React.FC<{
  priceCard: PriceCard
  isSelected: boolean
  onSelect: () => void
}> = ({ priceCard, isSelected, onSelect }) => (
  <Card
    className={`
      cursor-pointer transition-all duration-300 ease-out
      backdrop-blur-xl bg-white/70 border-white/20 
      hover:bg-white/80 hover:shadow-lg hover:shadow-blue-500/10
      hover:-translate-y-1 hover:scale-[1.02]
      ${
        isSelected
          ? "ring-2 ring-blue-500/50 bg-gradient-to-br from-blue-50/90 to-cyan-50/90 shadow-lg shadow-blue-500/20"
          : "shadow-sm"
      }
      rounded-2xl overflow-hidden
    `}
    onClick={onSelect}
  >
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <CardTitle className="text-base font-semibold text-gray-900 mb-1">{priceCard.card.title}</CardTitle>
          <p className="text-sm text-gray-600 leading-relaxed">{priceCard.card.description}</p>
        </div>
        {isSelected && (
          <div className="ml-3 p-1 rounded-full bg-blue-500/10">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2">
        {priceCard.prices.slice(0, 2).map((price) => (
          <div key={price.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-700 font-medium">{price.label}</span>
            <span className="font-bold text-gray-900 bg-gray-100/60 px-2 py-1 rounded-lg">GH₵{price.value}</span>
          </div>
        ))}
        {priceCard.prices.length > 2 && (
          <div className="pt-2 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">+{priceCard.prices.length - 2} more prices</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)

// Policy Selection Component
export const PolicyCardSelection: React.FC<{
  policy: Policy
  isSelected: boolean
  onSelect: () => void
}> = ({ policy, isSelected, onSelect }) => (
  <Card
    className={`
      cursor-pointer transition-all duration-300 ease-out
      backdrop-blur-xl bg-white/70 border-white/20 
      hover:bg-white/80 hover:shadow-lg hover:shadow-purple-500/10
      hover:-translate-y-1 hover:scale-[1.02]
      ${
        isSelected
          ? "ring-2 ring-purple-500/50 bg-gradient-to-br from-purple-50/90 to-pink-50/90 shadow-lg shadow-purple-500/20"
          : "shadow-sm"
      }
      rounded-2xl overflow-hidden
    `}
    onClick={onSelect}
  >
    <CardHeader className="pb-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <CardTitle className="text-base font-semibold text-gray-900 mb-1">{policy.policy.name}</CardTitle>
          <p className="text-sm text-gray-600 leading-relaxed">{policy.policy.description}</p>
        </div>
        {isSelected && (
          <div className="ml-3 p-1 rounded-full bg-purple-500/10">
            <CheckCircle className="h-5 w-5 text-purple-600" />
          </div>
        )}
      </div>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="space-y-2">
        {policy.policyDetails.slice(0, 2).map((detail) => (
          <div key={detail.id} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-800 min-w-fit">{detail.title}:</span>
              <span className="text-gray-600 line-clamp-2">{detail.content.substring(0, 50)}...</span>
            </div>
          </div>
        ))}
        {policy.policyDetails.length > 2 && (
          <div className="pt-2 border-t border-gray-200/50">
            <p className="text-xs text-gray-500 font-medium">+{policy.policyDetails.length - 2} more details</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
)
