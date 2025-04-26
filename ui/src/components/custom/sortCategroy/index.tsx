"use client"

import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryPreview } from "./catePreview"
import { CategoryForm } from "./cateform"
import { CategoryCard } from "./cateCard"
import { Link } from "react-router"
export type Item = {
  id: string
  name: string
  description: string
  price: number
  imageUrl: string
}

export type Category = {
  id: string
  name: string
  description: string
  imageUrl: string
  items: Item[]
}

const defaultCategories: Category[] = [
  {
    id: "1",
    name: "Soup",
    description: "Delicious homemade soups",
    imageUrl: "/placeholder.svg?height=100&width=100",
    items: [
      {
        id: "101",
        name: "Chicken Stock",
        description: "Base for chicken soup",
        price: 3.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "102",
        name: "Carrots",
        description: "Fresh organic carrots",
        price: 1.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "103",
        name: "Celery",
        description: "Crisp green celery",
        price: 2.49,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "104",
        name: "Onions",
        description: "Sweet yellow onions",
        price: 1.49,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "105",
        name: "Bay Leaves",
        description: "Aromatic bay leaves",
        price: 3.29,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
    ],
  },
  {
    id: "2",
    name: "Pasta",
    description: "Italian pasta dishes",
    imageUrl: "/placeholder.svg?height=100&width=100",
    items: [
      {
        id: "201",
        name: "Spaghetti",
        description: "Dried spaghetti pasta",
        price: 2.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "202",
        name: "Tomato Sauce",
        description: "Homemade tomato sauce",
        price: 4.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "203",
        name: "Parmesan",
        description: "Aged parmesan cheese",
        price: 6.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
    ],
  },
  {
    id: "3",
    name: "Salad",
    description: "Fresh garden salads",
    imageUrl: "/placeholder.svg?height=100&width=100",
    items: [
      {
        id: "301",
        name: "Lettuce",
        description: "Crisp romaine lettuce",
        price: 2.49,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "302",
        name: "Tomatoes",
        description: "Ripe cherry tomatoes",
        price: 3.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "303",
        name: "Cucumber",
        description: "Fresh cucumber",
        price: 1.79,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
      {
        id: "304",
        name: "Vinaigrette",
        description: "Balsamic vinaigrette",
        price: 4.99,
        imageUrl: "/placeholder.svg?height=80&width=80",
      },
    ],
  },
]

export function ShopItemsManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    // In a real app, you would fetch categories from an API
    setCategories(defaultCategories)
  }, [])

  const handleAddCategory = (newCategory: Category) => {
    setCategories((prevCategories) => [...prevCategories, newCategory])
    setIsFormOpen(false)
  }

  const handleUpdateCategory = (updatedCategory: Category) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) => (category.id === updatedCategory.id ? updatedCategory : category)),
    )
    setEditingCategory(null)
    setIsFormOpen(false)
  }

  const handleDeleteCategory = (id: string) => {
    setCategories((prevCategories) => prevCategories.filter((category) => category.id !== id))
    if (selectedCategory?.id === id) {
      setSelectedCategory(null)
      setIsPreviewOpen(false)
    }
  }

  const handleEditClick = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handlePreviewClick = (category: Category) => {
    setSelectedCategory(category)
    setIsPreviewOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingCategory(null)
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
  }

  const handleUpdateItems = (categoryId: string, updatedItems: Item[]) => {
    setCategories((prevCategories) =>
      prevCategories.map((category) => (category.id === categoryId ? { ...category, items: updatedItems } : category)),
    )

    // Update the selected category if it's the one being modified
    if (selectedCategory?.id === categoryId) {
      setSelectedCategory((prev) => (prev ? { ...prev, items: updatedItems } : null))
    }
  }

  return (
    <main className="maincontainer  ">


    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to={"/"} className="text-2xl cursor-pointer font-semibold">Categories</Link>
        
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <p className="text-muted-foreground">No categories found. Add your first category!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => handleEditClick(category)}
              onDelete={() => handleDeleteCategory(category.id)}
              onPreview={() => handlePreviewClick(category)}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <CategoryForm
          onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
          onCancel={handleCloseForm}
          initialData={editingCategory}
        />
      )}

      {selectedCategory && (
        <CategoryPreview
          category={selectedCategory}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          onUpdateItems={(updatedItems) => handleUpdateItems(selectedCategory.id, updatedItems)}
        />
      )}
    </div>
  </main>
  )
}

