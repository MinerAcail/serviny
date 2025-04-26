import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Item } from "."
// import type { Item } from "@/components/shop-items-manager"

interface ItemPreviewProps {
  item: Item
  onClose: () => void
}

export function ItemPreview({ item, onClose }: ItemPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <Badge variant="outline">{item.name}</Badge>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative h-48 bg-muted rounded-md overflow-hidden">
        <img src={item.imageUrl || "/placeholder.svg"} alt={item.name}  className="object-cover" />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <p className="font-medium text-lg">${item.price.toFixed(2)}</p>
      </div>

      <div className="pt-2">
        <p className="text-xs text-muted-foreground">Item ID: {item.id}</p>
      </div>
    </div>
  )
}

