"use client"

import { useState, useRef } from "react"
import { Loader2, Trash2, X, ImagePlus } from "lucide-react"
import { gql, useMutation } from "@apollo/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getImageUrl } from "@/components/global/formatPrice"
import { GET_ALL_PRODUCTS, Product } from "./AllProducts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $productID: String!
    $files: [Upload]
    $input: ProductInputUpdate!
    $removeUrl: [String]
    $removeCategories: [String]
    $removeItemsType: [String]
  ) {
    updateProduct(
      productId: $productID
      files: $files
      input: $input
      removeUrl: $removeUrl
      removeCategories: $removeCategories
      removeItemsType: $removeItemsType
    ) {
      id
      name
      price
      description
      state
      imageUrls
      categories
      itemsType
    }
  }
`

export function UpdateProductDialog({
  product,
  onSuccess,
  children,
}: {
  product: Product
  onSuccess?: () => void
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState(product?.name || "")
  const [price, setPrice] = useState(product?.price || "")
  const [description, setDescription] = useState(product?.description || "")
  const [state, setState] = useState(product?.state || "")
  const [categories, setCategories] = useState<string[]>(product?.categories || [])
  const [itemsType, setItemsType] = useState<string[]>(product?.itemsType || [])
  const [newCategory, setNewCategory] = useState("")
  const [newItemType, setNewItemType] = useState("")
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([])
  const [categoriesToRemove, setCategoriesToRemove] = useState<string[]>([])
  const [itemsTypeToRemove, setItemsTypeToRemove] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [updateProduct, { loading }] = useMutation(UPDATE_PRODUCT, {
    refetchQueries: [GET_ALL_PRODUCTS],
    onCompleted: () => {
      setIsOpen(false)
      if (onSuccess) onSuccess()
    },
    onError: (err) => console.error("Error updating product:", err),
  })

  const resetForm = () => {
    setName(product?.name || "")
    setPrice(product?.price || "")
    setDescription(product?.description || "")
    setState(product?.state || "")
    setCategories(product?.categories || [])
    setItemsType(product?.itemsType || [])
    setImagesToRemove([])
    setCategoriesToRemove([])
    setItemsTypeToRemove([])
    setSelectedFiles([])
    setPreviewUrls([])
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) resetForm()
  }

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory])
      setNewCategory("")
    }
  }

  const handleAddItemType = () => {
    if (newItemType.trim() && !itemsType.includes(newItemType)) {
      setItemsType([...itemsType, newItemType])
      setNewItemType("")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleImageRemoval = (url: string) => {
    setImagesToRemove((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  const toggleCategoryRemoval = (cat: string) => {
    setCategoriesToRemove((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const toggleItemTypeRemoval = (it: string) => {
    setItemsTypeToRemove((prev) =>
      prev.includes(it) ? prev.filter((i) => i !== it) : [...prev, it]
    )
  }

  const handleSubmit = () => {
    updateProduct({
      variables: {
        productID: product.id,
        files: selectedFiles,
        input: {
          name,
          price: parseFloat(String(price)),
          description,
          state,
          categories: categories.map((c) => (!categoriesToRemove.includes(c) ? c : null)),
          itemsType: itemsType.map((i) => (!itemsTypeToRemove.includes(i) ? i : null)),
        },
        removeUrl: imagesToRemove,
        removeCategories: categoriesToRemove,
        removeItemsType: itemsTypeToRemove,
      },
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Product</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Label>Price</Label>
          <Input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            step="0.01"
          />
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            // rows={Math.max(3, description.split('\n').length)}
              rows={Math.max(3, Math.min(13, description?.split('\n').length || 3))}

          />
          <Label
            htmlFor="state"
            className="text-sm font-medium text-gray-700"
          >
            State
          </Label>
          <Select
            value={state || product.state || ""}
            onValueChange={setState}
            defaultValue={product.state}
          >
            <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all">
              <SelectValue placeholder="Select product state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">ACTIVE</SelectItem>
              <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              <SelectItem value="PREORDER">PREORDER</SelectItem>
            </SelectContent>
          </Select>

          {/* Categories */}
          <div>
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={categoriesToRemove.includes(cat) ? "destructive" : "secondary"}
                  onClick={() => toggleCategoryRemoval(cat)}
                  className="cursor-pointer"
                >
                  {cat}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                placeholder="Add category"
              />
              <Button variant="outline" onClick={handleAddCategory}>
                Add
              </Button>
            </div>
          </div>

          {/* Items Type */}
          <div>
            <Label>Items Type</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {itemsType.map((it) => (
                <Badge
                  key={it}
                  variant={itemsTypeToRemove.includes(it) ? "destructive" : "secondary"}
                  onClick={() => toggleItemTypeRemoval(it)}
                  className="cursor-pointer"
                >
                  {it}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newItemType}
                onChange={(e) => setNewItemType(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddItemType()}
                placeholder="Add item type"
              />
              <Button variant="outline" onClick={handleAddItemType}>
                Add
              </Button>
            </div>
          </div>

          {/* Existing Images */}
          <div>
            <Label>Current Images</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {product.imageUrls.map((url: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={getImageUrl(url) ?? undefined}
                    className={`aspect-square object-cover rounded ${
                      imagesToRemove.includes(url) ? "opacity-30" : ""
                    }`}
                  />
                  <Button
                    size="icon"
                    variant={imagesToRemove.includes(url) ? "outline" : "destructive"}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => toggleImageRemoval(url)}
                  >
                    {imagesToRemove.includes(url) ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Upload New Images */}
          <div>
            <Label>Upload New Images</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} className="aspect-square object-cover rounded" />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="aspect-square flex flex-col justify-center items-center border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-6 h-6 mb-1" />
                <span className="text-xs">Add</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <DialogFooter className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Updating...
              </>
            ) : (
              "Update Product"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
