
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { gql, useMutation } from "@apollo/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ADD_PRODUCT = gql`
  mutation VendorUpload($input: ProductInput!, $files: [Upload!]) {
    VendorUpload(input: $input, files: $files) {
      id
      name
      price
      state
      categories
      imageUrls
      description
      itemsType
    }
  }
`;

export default function ProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [state, setState] = useState("ACTIVE");
  const [categories, setCategories] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [itemType, setItemType] = useState("");
  const [itemTypes, setItemTypes] = useState<string[]>([]);
  
  const [VendorUpload, { loading, error }] = useMutation(ADD_PRODUCT, {
    refetchQueries: ["getNewAddedProducts"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    images.forEach((file) => formData.append("files", file));

    await VendorUpload({
      variables: {
        input: {
          name,
          price,
          state,
          description,
          categories: categories
            .split(",")
            .map((cat) => cat.trim())
            .filter((cat) => cat !== ""),
          itemsType: itemTypes,
        },
        files: images,
      },
    });

    resetForm();
  };

  const resetForm = () => {
    setName("");
    setPrice("");
    setState("ACTIVE");
    setCategories("");
    setDescription("");
    setImages([]);
    setPreviews([]);
    setItemType("");
    setItemTypes([]);
    setActiveTab("basic");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages((prevImages) => [...prevImages, ...filesArray]);

      const previewsArray = filesArray.map((file) => URL.createObjectURL(file));
      setPreviews((prevPreviews) => [...prevPreviews, ...previewsArray]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addItemType = () => {
    if (itemType.trim() !== "" && !itemTypes.includes(itemType.trim())) {
      setItemTypes([...itemTypes, itemType.trim()]);
      setItemType("");
    }
  };

  const removeItemType = (index: number) => {
    setItemTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemTypeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItemType();
    }
  };

  const goToNextTab = () => {
    if (activeTab === "basic") setActiveTab("details");
    else if (activeTab === "details") setActiveTab("images");
  };

  const goToPreviousTab = () => {
    if (activeTab === "images") setActiveTab("details");
    else if (activeTab === "details") setActiveTab("basic");
  };

  return (
    <div className="max-w-2xl h-fit my-14 mx-auto p-6 rounded-xl bg-gradient-to-b from-white/80 to-white/60 backdrop-blur-lg border border-white/20 shadow-lg">
      <h2 className="text-2xl font-medium text-gray-800 mb-6 text-center">
        Add New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 p-1 rounded-xl bg-gray-100/80 backdrop-blur-sm">
            <TabsTrigger
              value="basic"
              className={cn(
                "rounded-lg py-2.5 text-sm font-medium transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              )}
            >
              Name & Price
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className={cn(
                "rounded-lg py-2.5 text-sm font-medium transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              )}
            >
              Details
            </TabsTrigger>
            <TabsTrigger
              value="images"
              className={cn(
                "rounded-lg py-2.5 text-sm font-medium transition-all",
                "data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
              )}
            >
              Images
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Name & Price */}
          <TabsContent value="basic" className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Product Name
              </Label>
              <Input
                id="name"
                placeholder="Enter product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="price"
                className="text-sm font-medium text-gray-700"
              >
                Price
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {/* <span className="text-gray-500 sm:text-sm">$</span> */}
                </div>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full pl-7 rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="button"
                onClick={goToNextTab}
                className="rounded-full px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white transition-all"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: State & Categories */}
          <TabsContent value="details" className="mt-6 space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="state"
                className="text-sm font-medium text-gray-700"
              >
                State
              </Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all">
                  <SelectValue placeholder="Select product state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  <SelectItem value="PREORDER">PREORDER</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="categories"
                className="text-sm font-medium text-gray-700"
              >
                Categories
              </Label>
              <Input
                id="categories"
                placeholder="Enter categories (comma-separated)"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                required
                className="w-full rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all"
              />
            </div>

            {/* Item Types Section */}
            <div className="space-y-2">
              <Label
                htmlFor="itemType"
                className="text-sm font-medium text-gray-700"
              >
                Item Types
              </Label>
              <div className="flex gap-2">
                <Input
                  id="itemType"
                  placeholder="Add an item type"
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  onKeyDown={handleItemTypeKeyDown}
                  className="flex-1 rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all"
                />
                <Button
                  type="button"
                  onClick={addItemType}
                  className="rounded-xl px-3 bg-gray-900 hover:bg-gray-800 text-white transition-all"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {itemTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {itemTypes.map((type, index) => (
                    <div
                      key={index}
                      className="flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800"
                    >
                      <span className="text-sm">{type}</span>
                      <button
                        type="button"
                        onClick={() => removeItemType(index)}
                        className="ml-2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Remove item type"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Enter product description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full min-h-32 rounded-xl border-gray-200 bg-white/70 backdrop-blur-sm focus:border-gray-300 focus:ring focus:ring-gray-200 focus:ring-opacity-50 transition-all"
              />
            </div>
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                className="rounded-full px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                type="button"
                onClick={goToNextTab}
                className="rounded-full px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white transition-all"
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Images */}
          <TabsContent value="images" className="mt-6 space-y-6">
            <div className="space-y-3">
              <Label
                htmlFor="images"
                className="text-sm font-medium text-gray-700"
              >
                Product Images
              </Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-white/50 hover:bg-white/70 transition-all duration-300"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-3 mb-3 rounded-full bg-gray-100">
                      <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="mb-2 text-sm text-gray-700">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
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
                  <div
                    key={index}
                    className="relative group overflow-hidden rounded-xl shadow-sm transition-all duration-300 hover:shadow-md"
                  >
                    <img
                      src={preview || "/placeholder.svg"}
                      alt={`preview ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                className="rounded-full px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-full px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white transition-all disabled:opacity-70"
              >
                {loading ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}