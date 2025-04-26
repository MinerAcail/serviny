"use client"

import type React from "react"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Category } from "."
// import type { Category } from "@/components/shop-items-manager"

interface CategoryFormProps {
  onSubmit: (category: Category) => void
  onCancel: () => void
  initialData?: Category | null
}

export function CategoryForm({ onSubmit, onCancel, initialData }: CategoryFormProps) {
  const [formData, setFormData] = useState<Partial<Category>>(
    initialData || {
      name: "",
      description: "",
      imageUrl: "/placeholder.svg?height=100&width=100",
      items: [],
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // In a real app, you would handle file upload here
    // For this demo, we'll just use the placeholder or the provided URL
    setFormData((prev) => ({
      ...prev,
      imageUrl: e.target.value || "/placeholder.svg?height=100&width=100",
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const category: Category = {
      id: initialData?.id || Date.now().toString(),
      name: formData.name || "Untitled Category",
      description: formData.description || "",
      imageUrl: formData.imageUrl || "/placeholder.svg?height=100&width=100",
      items: formData.items || initialData?.items || [],
    }

    onSubmit(category)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background border rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{initialData ? "Edit Category" : "Add New Category"}</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl || ""}
              onChange={handleImageChange}
              placeholder="Enter image URL or upload"
            />
            <p className="text-xs text-muted-foreground">
              For demo purposes, you can enter any URL or leave as default
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">{initialData ? "Update" : "Add"} Category</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

