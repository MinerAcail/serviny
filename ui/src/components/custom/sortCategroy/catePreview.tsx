"use client"

import { useState } from "react"
// import Image from "next/image"
import { Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ItemForm } from "./form"
import { Category, Item } from "."
// import type { Category, Item } from "@/components/shop-items-manager"
// import { ItemForm } from "@/components/item-form"
interface CategoryPreviewProps {
  category: Category
  isOpen: boolean
  onClose: () => void
  onUpdateItems: (items: Item[]) => void
}

export function CategoryPreview({ category, isOpen, onClose, onUpdateItems }: CategoryPreviewProps) {
  const [items, setItems] = useState<Item[]>(category.items)
  const [isItemFormOpen, setIsItemFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  const handleAddItem = (newItem: Item) => {
    const updatedItems = [...items, newItem]
    setItems(updatedItems)
    onUpdateItems(updatedItems)
    setIsItemFormOpen(false)
  }

  const handleUpdateItem = (updatedItem: Item) => {
    const updatedItems = items.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    setItems(updatedItems)
    onUpdateItems(updatedItems)
    setEditingItem(null)
    setIsItemFormOpen(false)
  }

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter((item) => item.id !== id)
    setItems(updatedItems)
    onUpdateItems(updatedItems)
  }

  const handleEditClick = (item: Item) => {
    setEditingItem(item)
    setIsItemFormOpen(true)
  }

  const handleCloseItemForm = () => {
    setIsItemFormOpen(false)
    setEditingItem(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <div className="relative h-8 w-8 rounded-md overflow-hidden">
                <img
                  src={category.imageUrl || "/placeholder.svg"}
                  alt={category.name}
                  
                  className="object-cover"
                />
              </div>
              {category.name}
            </DialogTitle>
            <DialogDescription>{category.description}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Items ({items.length})</h3>
              <Button size="sm" onClick={() => setIsItemFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <p className="text-muted-foreground">No items in this category. Add your first item!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded-md overflow-hidden">
                      <img src={item.imageUrl || "/placeholder.svg"} alt={item.name}  className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <p className="font-medium mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isItemFormOpen && (
        <ItemForm
          onSubmit={editingItem ? handleUpdateItem : handleAddItem}
          onCancel={handleCloseItemForm}
          initialData={editingItem}
        />
      )}
    </>
  )
}

