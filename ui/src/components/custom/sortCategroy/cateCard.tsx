import { Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Category } from "."
// import type { Category } from "@/components/shop-items-manager"

interface CategoryCardProps {
  category: Category
  onEdit: () => void
  onDelete: () => void
  onPreview: () => void
}

export function CategoryCard({ category, onEdit, onDelete, onPreview }: CategoryCardProps) {
  // Only show up to 4 items as preview
  const previewItems = category.items.slice(0, 4)

  return (
    <Card className="overflow-hidden">
      <div onClick={onPreview} className="relative h-40 bg-muted">
        <img src={category.imageUrl || "/"} alt={category.name}  className="object-cover" />
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-lg">{category.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{category.description}</p>
        </div>

        {previewItems.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Contains {category.items.length} items:</p>
            <div className="grid grid-cols-4 gap-1">
              {previewItems.map((item) => (
                <div key={item.id} className="relative h-12 w-12 bg-muted rounded-md overflow-hidden">
                  <img src={item.imageUrl || "/"} alt={item.name}  className="object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium px-1">{item.name}</span>
                  </div>
                </div>
              ))}
              {category.items.length > 4 && (
                <div className="relative h-12 w-12 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                  <span className="text-xs font-medium">+{category.items.length - 4}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between gap-2">
        <Button variant="outline" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4 mr-1" />
          View All
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

