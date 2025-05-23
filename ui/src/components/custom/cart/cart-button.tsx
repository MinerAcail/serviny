"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "./cart-context"
// import { useCart } from "@/context/cart-context"

export function CartButton() {
  const { setIsOpen, itemCount } = useCart()

  return (
    <Button variant="outline" size="icon" className="relative" onClick={() => setIsOpen(true)} aria-label="Open cart">
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Button>
  )
}
