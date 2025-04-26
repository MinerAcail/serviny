import { Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type  { Item } from "."
// import type { Item } from "@/components/shop-items-manager"

interface ItemCardProps {
  item: Item
  onEdit: () => void
  onDelete: () => void
  onPreview: () => void
}

export function ItemCard({ item, onEdit, onDelete, onPreview }: ItemCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-40 bg-muted">
        <img src={item.imageUrl || "/placeholder.svg"} alt={item.name}  className="object-cover" />
      </div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold truncate">{item.name}</h3>
          <Badge variant="outline">{item.name}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
        <p className="font-medium">${item.price.toFixed(2)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

