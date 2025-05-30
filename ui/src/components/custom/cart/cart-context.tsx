import { Product } from "@/vendor/types"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useSearchParams } from "react-router"
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string"

export interface OrderItemInput {
  productId: string;
  quantity: number;
  itemType?: string;
}

export interface CartItem {
  id: string
  productId: string // Store the actual product ID separately
  name: string
  price: number
  imageUrl: string
  quantity: number
  selectedItemType?: string
}

export interface Order {
  id: string;
  userId: string;
  status: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  itemType: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrls: string[];
  };
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product & { selectedItemType?: string }, quantity?: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  total: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  getProductCount: (productId: string) => number
  isProductInCart: (productId: string) => boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpenState] = useState(false) // Use local state instead of URL
  const [searchParams, setSearchParams] = useSearchParams()

  // Remove cart=open URL logic - only handle cartData
  const setIsOpen = (open: boolean) => {
    setIsOpenState(open)
  }

  // Load cart from URL
  useEffect(() => {
    const encoded = searchParams.get("cartData")
    if (encoded) {
      try {
        const json = decompressFromEncodedURIComponent(encoded)
        if (json) {
          const parsed = JSON.parse(json)
          if (Array.isArray(parsed)) {
            setItems(parsed)
          }
        }
      } catch (e) {
        console.error("Failed to decode cart from URL", e)
      }
    }
  }, [searchParams])

  // Save cart to URL - only cartData, no cart=open
  useEffect(() => {
    if (items.length === 0) {
      const newParams = new URLSearchParams(searchParams)
      newParams.delete("cartData")
      setSearchParams(newParams, { replace: true })
      return
    }

    const compressed = compressToEncodedURIComponent(JSON.stringify(items))
    const newParams = new URLSearchParams(searchParams)
    newParams.set("cartData", compressed)
    setSearchParams(newParams, { replace: true })
  }, [items, searchParams, setSearchParams])

  const itemCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items],
  )

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const addItem = (
    product: Product & { selectedItemType?: string },
    quantity = 1,
  ) => {
    setItems((prevItems) => {
      // Create unique cart item ID based on product ID and item type
      const itemId = product.selectedItemType
        ? `${product.id}-${product.selectedItemType}`
        : product.id

      const existingItem = prevItems.find((item) => item.id === itemId)

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        )
      }

      return [
        ...prevItems,
        {
          id: itemId, // Unique cart item identifier
          productId: product.id, // Store the full product UUID
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrls?.[0] || "/placeholder.svg",
          quantity,
          selectedItemType: product.selectedItemType,
        },
      ]
    })

    setIsOpen(true)
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
    } else {
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, quantity } : item,
        ),
      )
    }
  }

  const clearCart = () => {
    setItems([])
    // Clean up cartData from URL when clearing cart
    // const newParams = new URLSearchParams(searchParams)
    // newParams.delete("cartData")
    // setSearchParams(newParams, { replace: true })
  }

  const getProductCount = (productId: string) => {
    return items
      .filter((item) => item.productId === productId)
      .reduce((count, item) => count + item.quantity, 0)
  }

  const isProductInCart = (productId: string) => {
    return items.some((item) => item.productId === productId)
  }

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        total,
        isOpen,
        setIsOpen,
        getProductCount,
        isProductInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}