"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Product } from "./types"
import { X, Upload } from "lucide-react"
import { gql, useMutation, useQuery } from "@apollo/client"
import { GET_ALL_VENDORS, type ListVendorsResponse } from ".."
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ProductFormProps = {
  onAddProduct: (product: Product) => void
}

const ADD_PRODUCT = gql`
  mutation VendorUpload($input: ProductInput!, $files: [Upload!]) {
    VendorUpload(input: $input, files: $files) {
      id
      name
      price
      state
      categories
      imageUrls
    }
  }
`

export default function ProductForm({ onAddProduct }: ProductFormProps) {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [state, setState] = useState("")
  const [categories, setCategories] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")
  const [vendorId, setVendorId] = useState<string>(() => {
    // Initialize vendorId from localStorage, or empty string if not set
    return localStorage.getItem("selectedVendorId") || ""
  })
  const [VendorUpload, { loading, error }] = useMutation(ADD_PRODUCT, {
    refetchQueries: ["getNewAddedProducts"], // Refresh product list after adding
  })
  const {
    loading: loadingVendors,
    error: vendorsError,
    data: vendorsData,
  } = useQuery<ListVendorsResponse>(GET_ALL_VENDORS)
  const vendors = vendorsData?.listVendors || []

  // Effect to update localStorage when vendorId changes
  useEffect(() => {
    if (vendorId) {
      localStorage.setItem("selectedVendorId", vendorId)
    } else {
      localStorage.removeItem("selectedVendorId")
    }
  }, [vendorId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const formData = new FormData()
    images.forEach((file) => formData.append("files", file))

    await VendorUpload({
      variables: {
        input: {
          name,
          price,
          state,
          categories: categories
            .split(",")
            .map((cat) => cat.trim())
            .filter((cat) => cat !== ""),
          VendorId: vendorId,
        },
        files: images, // Pass the images
      },
    })

    resetForm()
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setState("")
    setCategories("")
    setImages([])
    setPreviews([])
    setActiveTab("basic")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setImages((prevImages) => [...prevImages, ...filesArray])

      const previewsArray = filesArray.map((file) => URL.createObjectURL(file))
      setPreviews((prevPreviews) => [...prevPreviews, ...previewsArray])
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const goToNextTab = () => {
    if (activeTab === "basic") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("images")
  }

  const goToPreviousTab = () => {
    if (activeTab === "images") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("basic")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Name & Price</TabsTrigger>
          <TabsTrigger value="details">State & Categories</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        {/* Tab 1: Name & Price */}
        <TabsContent value="basic" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="Enter price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="VendorId" className="text-right">
              Vendor
            </Label>
            {loadingVendors ? (
              <div className="col-span-3">Loading vendors...</div>
            ) : vendorsError ? (
              <div className="col-span-3 text-red-500">Error loading vendors</div>
            ) : (
              <Select value={vendorId} onValueChange={(value) => setVendorId(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex justify-end">
            <Button type="button" onClick={goToNextTab}>
              Next
            </Button>
          </div>
        </TabsContent>

        {/* Tab 2: State & Categories */}
        <TabsContent value="details" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="Enter product state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categories">Categories</Label>
            <Input
              id="categories"
              placeholder="Enter categories (comma-separated)"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPreviousTab}>
              Previous
            </Button>
            <Button type="button" onClick={goToNextTab}>
              Next
            </Button>
          </div>
        </TabsContent>

        {/* Tab 3: Images */}
        <TabsContent value="images" className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="images">Product Images</Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="images"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview || "/placeholder.svg"}
                    alt={`preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={goToPreviousTab}>
              Previous
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Product"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {error && <p className="text-red-500 mt-4">{error.message}</p>}
    </form>
  )
}
