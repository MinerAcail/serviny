import React, { useState, useMemo } from "react";
import * as lucideIcons from "lucide-react";
import { Package, Upload, Star, Check, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, gql } from "@apollo/client";
import { toast } from "sonner";

// Type definitions
interface Category {
  id: string;
  name: string;
  icon: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
  iconName: string;
  image: File | null;
  imagePreview: string;
}

interface CategoryInput {
  name: string;
  icon: string;
}

interface InventoryItemInput {
  name: string;
  description?: string;
  price: number;
  available: boolean;
  file: File;
}

interface RentalInput {
  category: CategoryInput;
  inventories: InventoryItemInput;
}

// Define the GraphQL mutation properly
const CREATE_RENTAL_ITEM = gql`
  mutation CreateRentalItem($input: rentalInput!) {
    createRentalItem(input: $input) {
      category {
        id
        name
      }
      inventories {
        id
        name
        description
        price
      }
    }
  }
`;

export default function InventoryItemForm(): React.ReactElement {
  // Default categories
  const [categories, setCategories] = useState<Category[]>([
    { id: "equipment", name: "Equipment", icon: "Package" },
    { id: "space", name: "Spaces", icon: "Home" },
    { id: "vehicle", name: "Vehicles", icon: "Car" },
    { id: "studio", name: "Studios", icon: "Video" },
  ]);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    category: "equipment", // Default category
    available: true,
    iconName: "Package", // Default icon
    image: null, // New field for image
    imagePreview: "/placeholder.svg?height=200&width=300", // Default placeholder
  });

  // New category state
  const [newCategory, setNewCategory] = useState<string>("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState<boolean>(false);
  const [categoryPopoverOpen, setCategoryPopoverOpen] =
    useState<boolean>(false);

  // Icon picker state
  const [iconSearch, setIconSearch] = useState<string>("");
  const [iconDialogOpen, setIconDialogOpen] = useState<boolean>(false);

  // Setup mutation hook
  const [createRentalItem, { loading }] = useMutation(CREATE_RENTAL_ITEM);

  // Get all Lucide icon names and components
  const iconEntries = useMemo(() => {
    return Object.entries(lucideIcons).filter(
      ([name]) =>
        name !== "default" &&
        name.toLowerCase().includes(iconSearch.toLowerCase())
    );
  }, [iconSearch]);

  // Only show a limited number of icons in the list
  const displayedIcons = iconEntries.slice(0, 30);

  // Get current selected icon component
  const SelectedIcon = (lucideIcons[
    formData.iconName as keyof typeof lucideIcons
  ] || Package) as React.ElementType;

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: file,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle icon selection
  const selectIcon = (iconName: string) => {
    setFormData({
      ...formData,
      iconName,
    });
    setIconDialogOpen(false);
  };

  // Handle category selection
  const selectCategory = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    setFormData({
      ...formData,
      category: categoryId,
      iconName: category?.icon || formData.iconName,
    });
    setCategoryPopoverOpen(false);
  };

  // Add new category
  const addNewCategory = () => {
    if (newCategory.trim()) {
      const newCategoryId = newCategory.toLowerCase().replace(/\s+/g, "-");
      const newCategoryItem: Category = {
        id: newCategoryId,
        name: newCategory,
        icon: formData.iconName,
      };

      setCategories([...categories, newCategoryItem]);
      setFormData({
        ...formData,
        category: newCategoryId,
      });
      setNewCategory("");
      setCategoryDialogOpen(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent
  ) => {
    e.preventDefault();

    try {
      // Check if form has all required data
      if (!formData.name || !formData.price || !formData.image) {
        alert("Please fill in all required fields and add an image");
        return;
      }

      // Create input for the GraphQL mutation
      const mutationInput: RentalInput = {
        category: {
          name:
            categories.find((cat) => cat.id === formData.category)?.name || "",
          icon: formData.iconName,
        },
        inventories: {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          available: formData.available,
          file: formData.image,
        },
      };

      // Execute the mutation
      const response = await createRentalItem({
        variables: { input: mutationInput },
      });

      console.log("Item created:", response.data.createRentalItem);

      // Reset form or redirect user
      toast.success("Success!", {
        description: "Inventory item created successfully!",
      });

      // Clear inputs
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "equipment",
        available: true,
        iconName: "Package",
        image: null,
        imagePreview: "/placeholder.svg?height=200&width=300",
      });

      // Reset form or redirect as needed
      // resetForm() or router.push('/inventory')
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Error", {
        description: "Error creating inventory item. Please try again.",
      });
    }
  };

  return (
    <div className="container max-w-5xl mx-auto p-4">
      <Tabs defaultValue="edit" className="w-full">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-[1fr_300px] gap-8 ">
              {/* Right column - Form fields */}
              <ItemDetails
                addNewCategory={addNewCategory}
                categories={categories}
                categoryDialogOpen={categoryDialogOpen}
                categoryPopoverOpen={categoryPopoverOpen}
                formData={formData}
                setFormData={setFormData}
                handleChange={handleChange}
                loading={loading}
                newCategory={newCategory}
                selectCategory={selectCategory}
                setCategoryDialogOpen={setCategoryDialogOpen}
                setCategoryPopoverOpen={setCategoryPopoverOpen}
                setNewCategory={setNewCategory}
              />

              {/* Left column - Image and Icon */}
              <ImageAndIcons
                SelectedIcon={SelectedIcon}
                displayedIcons={displayedIcons}
                formData={formData}
                handleImageChange={handleImageChange}
                iconDialogOpen={iconDialogOpen}
                iconSearch={iconSearch}
                selectIcon={selectIcon}
                setIconDialogOpen={setIconDialogOpen}
                setIconSearch={setIconSearch}
              />
            </div>
          </form>
        </TabsContent>

        <TabsContent value="preview">
          <PreView
            formData={formData}
            categories={categories}
            handleSubmit={handleSubmit}
            loading={loading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ImageAndIcons({
  formData,
  selectIcon,
  displayedIcons,
  setIconSearch,
  iconSearch,
  SelectedIcon,
  setIconDialogOpen,
  iconDialogOpen,
  handleImageChange,
}: {
  formData: FormData;
  selectIcon: (iconName: string) => void;
  displayedIcons: [string, React.ElementType][];
  setIconSearch: (value: string) => void;
  iconSearch: string;
  SelectedIcon: React.ElementType;
  setIconDialogOpen: (open: boolean) => void;
  iconDialogOpen: boolean;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Item Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative group">
            <div className="aspect-[3/2] overflow-hidden rounded-md border border-dashed flex items-center justify-center bg-muted/20">
              {formData.imagePreview ? (
                <img
                  src={formData.imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="p-4 text-center">
                  <Upload className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload image</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  Change Image
                </Button>
              </div>
            </div>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="sr-only"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Upload an image (recommended ratio 3:2)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Item Icon</CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={iconDialogOpen} onOpenChange={setIconDialogOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-20 flex flex-col items-center justify-center gap-2"
              >
                {SelectedIcon && <SelectedIcon className="h-8 w-8" />}
                <span className="text-xs">Change Icon</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Select an Icon</DialogTitle>
              </DialogHeader>
              <div className="p-4 space-y-4">
                <Input
                  placeholder="Search Lucide icons..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full"
                />

                <ScrollArea className="h-96 rounded-md border p-2">
                  <div className="grid grid-cols-5 gap-4">
                    {displayedIcons.map(([name, Icon]) => (
                      <div
                        key={name}
                        className="flex flex-col items-center text-xs hover:bg-muted p-2 rounded-md cursor-pointer"
                        onClick={() => selectIcon(name)}
                      >
                        <Icon className="w-6 h-6 mb-1" />
                        <span className="text-center break-words">{name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function ItemDetails({
  formData,
  setFormData,
  categories,
  // handleSubmit,
  loading,
  handleChange,
  categoryDialogOpen,
  setCategoryDialogOpen,
  categoryPopoverOpen,
  setCategoryPopoverOpen,
  selectCategory,
  addNewCategory,
  newCategory,
  setNewCategory,
}: {
  formData: FormData;
  setFormData: (value: FormData) => void;

  categories: Category[];
  // handleSubmit: (e: React.MouseEvent) => void;
  loading: boolean;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  categoryDialogOpen: boolean;
  setCategoryDialogOpen: (open: boolean) => void;
  categoryPopoverOpen: boolean;
  setCategoryPopoverOpen: (open: boolean) => void;
  selectCategory: (categoryId: string) => void;
  addNewCategory: () => void;
  newCategory: string;
  setNewCategory: (category: string) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Professional Camera Kit"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Canon EOS R5 with lenses and accessories"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price per Day ($)</Label>
              <Input
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                type="number"
                min="0"
                step="0.01"
                placeholder="75.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="flex gap-2">
                <Popover
                  open={categoryPopoverOpen}
                  onOpenChange={setCategoryPopoverOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={categoryPopoverOpen}
                      className="w-full justify-between"
                    >
                      {formData.category
                        ? categories.find((cat) => cat.id === formData.category)
                            ?.name
                        : "Select category"}
                      <span className="sr-only">Toggle popover</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0">
                    <Command>
                      <CommandInput placeholder="Search categories..." />
                      <CommandList>
                        <CommandEmpty>No categories found.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem
                              key={category.id}
                              onSelect={() => selectCategory(category.id)}
                              className="flex items-center gap-2"
                            >
                              {React.createElement(
                                lucideIcons[
                                  category.icon as keyof typeof lucideIcons
                                ] || Package,
                                { className: "h-4 w-4" }
                              )}
                              <span>{category.name}</span>
                              {formData.category === category.id && (
                                <Check className="h-4 w-4 ml-auto" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Dialog
                  open={categoryDialogOpen}
                  onOpenChange={setCategoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" type="button">
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Add new category</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Category</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newCategory">Category Name</Label>
                        <Input
                          id="newCategory"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Enter new category name"
                        />
                      </div>
                      <Button
                        onClick={addNewCategory}
                        disabled={!newCategory.trim()}
                        className="w-full"
                        type="button"
                      >
                        Add Category
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center space-x-2">
            <Switch
              id="available"
              name="available"
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, available: checked })
              }
            />
            <Label htmlFor="available">Available for Rental</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Inventory Item"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function PreView({
  formData,
  categories,
  handleSubmit,
  loading,
}: {
  formData: FormData;
  categories: Category[];
  handleSubmit: (e: React.MouseEvent) => void;
  loading: boolean;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>How it will appear in listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div className="relative h-40 w-full">
                <img
                  src={formData.imagePreview || "/placeholder.svg"}
                  alt={formData.name || "Item preview"}
                  className="w-full h-full object-cover"
                />
                {!formData.available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive">Currently Unavailable</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">
                    {formData.name || "Item Name"}
                  </h3>
                  <div className="flex items-center gap-1 text-sm bg-muted px-2 py-0.5 rounded-full">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span>4.8</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.description || "Item description"}
                </p>
                <div className="mt-4 flex justify-between items-center">
                  {formData.price ? (
                    <p className="font-bold">${formData.price}/day</p>
                  ) : (
                    <p className="font-bold text-muted-foreground">$0.00/day</p>
                  )}
                  <Button size="sm" disabled={!formData.available}>
                    {formData.available ? "Select" : "Unavailable"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Item Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Category
                </h4>
                <p className="flex items-center gap-2">
                  {React.createElement(
                    lucideIcons[
                      formData.iconName as keyof typeof lucideIcons
                    ] || Package,
                    { className: "h-4 w-4" }
                  )}
                  <span>
                    {categories.find((cat) => cat.id === formData.category)
                      ?.name || "Category"}
                  </span>
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Price
                </h4>
                <p className="font-semibold">${formData.price || "0.00"}/day</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Status
                </h4>
                <Badge
                  variant={formData.available ? "success" : "destructive"}
                  className="mt-1"
                >
                  {formData.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  ID
                </h4>
                <p className="text-sm text-muted-foreground">{`${
                  formData.category
                }-${Date.now()}`}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Description
              </h4>
              <p>{formData.description || "No description provided."}</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => document.getElementById("image-upload")?.click()}
            >
              Change Image
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e)}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Item"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
