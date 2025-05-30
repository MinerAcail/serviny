"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import CheckoutDialog from "./checkout-dialog"

export default function Checkout() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Sample data
  const sampleCheckoutData = {
    items: [
      {
        id: "1",
        name: "Margherita Pizza",
        description: "Fresh tomatoes, mozzarella, basil",
        price: 18.99,
        quantity: 2,
        image: "/placeholder.svg?height=64&width=64",
        category: "Pizza",
      },
      {
        id: "2",
        name: "Caesar Salad",
        description: "Romaine lettuce, parmesan, croutons",
        price: 12.5,
        quantity: 1,
        image: "/placeholder.svg?height=64&width=64",
        category: "Salad",
      },
      {
        id: "3",
        name: "Garlic Bread",
        description: "Toasted bread with garlic butter",
        price: 6.99,
        quantity: 1,
        image: "/placeholder.svg?height=64&width=64",
        category: "Appetizer",
      },
    ],
    deliveryLocation: {
      address: "123 Main Street, Apt 4B",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      instructions: "Ring doorbell twice. Leave at door if no answer.",
    },
    rider: {
      id: "rider-1",
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=48&width=48",
      rating: 4.8,
      phone: "(555) 123-4567",
      vehicleType: "Motorcycle",
      estimatedArrival: "15-20 min",
      isOnline: true,
    },
    deliveryFee: 3.99,
    serviceFee: 2.5,
    tax: 4.12,
    discount: 5.0,
    estimatedDeliveryTime: "25-35 minutes",
    orderNumber: "ORD-2024-001",
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    console.log(`Update item ${itemId} to quantity ${quantity}`)
  }

  const handleRemoveItem = (itemId: string) => {
    console.log(`Remove item ${itemId}`)
  }

  const handleEditLocation = () => {
    console.log("Edit delivery location")
  }

  const handlePlaceOrder = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsProcessing(false)
    setIsCheckoutOpen(false)
    console.log("Order placed successfully!")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout Dialog Demo</h1>
          <p className="text-gray-600">Click the button below to open the checkout dialog</p>
        </div>

        <Button
          onClick={() => setIsCheckoutOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-lg font-semibold"
        >
          Open Checkout
        </Button>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Features Included:</h3>
          <ul className="text-left space-y-2 text-sm text-gray-600">
            <li>• Order items with quantity controls</li>
            <li>• Delivery location and instructions</li>
            <li>• Assigned rider information</li>
            <li>• Payment method selection</li>
            <li>• Detailed pricing breakdown</li>
            <li>• iOS-style design</li>
            <li>• Responsive layout</li>
          </ul>
        </div>
      </div>

      <CheckoutDialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        checkoutData={sampleCheckoutData}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onEditLocation={handleEditLocation}
        onPlaceOrder={handlePlaceOrder}
        isProcessing={isProcessing}
      />
    </div>
  )
}
