import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  closestCenter,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { GalleryHorizontal, Plus, Upload, View, X, Edit3, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation, gql, useQuery } from "@apollo/client";
import { Box, Product } from "./types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ProductItem, ProductsContainer } from "./ProductCard";
import DroppableBox from "./drag";
import { GET_PRODUCTS } from "./gql";
import InputWithButton from "./input-with-button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router";
import { toast } from "sonner";
import { useAuth } from "@/middleware/context/authContext";
import { getImageUrl } from "@/components/global/formatPrice";

const ADD_PRODUCT_TO_CATEGORY_BOX = gql`
  mutation AddProductToCategoryBox($input: [CategoryBoxInput!]!) {
    addProductToCategoryBox(input: $input) {
      id
      name
      itemsIds
      imageUrl
    }
  }
`;

const DELETE_CATEGORY_BOX = gql`
  mutation DeleteCategoryBox($categoryId: String!) {
    deleteCategoryBox(categoryId: $categoryId)
  }
`;

const REMOVE_PRODUCT_FROM_CATEGORY_BOX = gql`
  mutation RemoveProductFromCategoryBox($categoryId: String!, $productId: String!) {
    removeProductFromCategoryBox(categoryId: $categoryId, productId: $productId) {
      id
      name
      itemsIds
    }
  }
`;

const GET_ALL_CATEGORY_BOXES = gql`
  query GetAllCategoryBox($query: String) {
    getAllCategoryBox(query: $query) {
      categoryBox {
        id
        name
        itemsIds
        imageUrl
        state
        vendorId
        createdAt
        updatedAt
      }
      products {
        id
        name
        price
        imageUrls
        description
      }
    }
  }
`;

interface CategoryBoxData {
  categoryBox: {
    id: string;
    name: string;
    itemsIds: string[];
    imageUrl?: string;
    state: string;
    vendorId: string;
    createdAt: string;
    updatedAt: string;
  };
  products: Product[];
}

// Enhanced ProductItem component with click-to-add functionality
const EnhancedProductItem: React.FC<{
  product: Product;
  onAddToBox: (productId: string, boxId: string) => void;
  boxes: Box[];
  existingBoxes: CategoryBoxData[];
  selectedBoxType: string;
}> = ({ product, onAddToBox, boxes, existingBoxes, selectedBoxType }) => {
  const availableBoxes = selectedBoxType === "existing" ? existingBoxes : boxes;
  
  const handleAddToBox = (boxId: string) => {
    onAddToBox(product.id, boxId);
  };

  return (
    <div className="relative group">
      <ProductItem product={product} />
      
      {/* Add to Box Dropdown */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {availableBoxes.length === 0 ? (
              <div className="px-2 py-1 text-sm text-muted-foreground">
                No boxes available
              </div>
            ) : (
              availableBoxes.map((box) => {
                const boxId = 'categoryBox' in box ? box.categoryBox.id : box.id;
                const boxName = 'categoryBox' in box ? box.categoryBox.name : box.name;
                const isAlreadyAdded = 'categoryBox' in box 
                  ? box.categoryBox.itemsIds.includes(product.id)
                  : box.items.some(item => item.id === product.id);
                
                return (
                  <DropdownMenuItem
                    key={boxId}
                    onClick={() => handleAddToBox(boxId)}
                    disabled={isAlreadyAdded}
                    className="flex items-center justify-between"
                  >
                    <span className="truncate">{boxName}</span>
                    {isAlreadyAdded && (
                      <span className="text-xs text-muted-foreground ml-2">Added</span>
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

// ExistingBoxCard component with drop functionality
const ExistingBoxCard: React.FC<{
  boxData: CategoryBoxData;
  onEdit: () => void;
  onDelete: () => void;
  onRemoveProduct: (categoryId: string, productId: string) => void;
}> = ({ boxData, onEdit, onDelete, onRemoveProduct }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: boxData.categoryBox.id,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`p-4 min-h-[200px] transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold truncate">{boxData.categoryBox.name}</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>
      
      {boxData.categoryBox.imageUrl && (
        <div className="mb-2">
          <img
            src={getImageUrl(boxData.categoryBox.imageUrl)}
            alt={boxData.categoryBox.name}
            className="w-full h-24 object-cover rounded"
          />
        </div>
      )}
      
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {boxData.products.map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
          >
            <div className="flex items-center gap-2">
              <img
                src={getImageUrl(product.imageUrls[0])}
                alt={product.name}
                className="w-6 h-6 object-cover rounded"
              />
              <span className="truncate">{product.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveProduct(boxData.categoryBox.id, product.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
      
      {isOver && (
        <div className="mt-2 text-center text-blue-600 text-sm font-medium">
          Drop here to add product
        </div>
      )}
      
      <div className="mt-2 text-xs text-gray-500">
        {boxData.products.length} product{boxData.products.length !== 1 ? 's' : ''}
      </div>
    </Card>
  );
};

const DragDropBoxes: React.FC = () => {
  const { user } = useAuth();
  const vendorId = user?.id;
  
  // State
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [existingBoxes, setExistingBoxes] = useState<CategoryBoxData[]>([]);
  const [nextBoxId, setNextBoxId] = useState(1);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [newBoxName, setNewBoxName] = useState<string>("");
  const [boxImage, setBoxImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editingBox, setEditingBox] = useState<Box | CategoryBoxData | null>(null);
  const [deletingBox, setDeletingBox] = useState<Box | CategoryBoxData | null>(null);
  const [selectedBoxType, setSelectedBoxType] = useState<string>("existing");

  // Mutations
  const [addProductToCategoryBox] = useMutation(ADD_PRODUCT_TO_CATEGORY_BOX);
  const [deleteCategoryBox] = useMutation(DELETE_CATEGORY_BOX);
  const [removeProductFromCategoryBox] = useMutation(REMOVE_PRODUCT_FROM_CATEGORY_BOX);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Fetch products
  const { data: productsData, loading: productsLoading, error: productsError, refetch: refetchProducts } = useQuery(GET_PRODUCTS, {
    variables: { query: searchTerm, vendorId },
  });
  const products: Product[] = productsData?.getAllProducts || [];

  // Fetch existing category boxes
  const { data: categoryBoxesData, loading: categoryBoxesLoading, refetch: refetchCategoryBoxes } = useQuery(GET_ALL_CATEGORY_BOXES, {
    variables: { query: "" },
  });

  useEffect(() => {
    if (categoryBoxesData?.getAllCategoryBox) {
      setExistingBoxes(categoryBoxesData.getAllCategoryBox);
    }
  }, [categoryBoxesData]);

  // Handle click to add product to box
  const handleClickAddToBox = (productId: string, boxId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Check if it's an existing box or new box
    const existingBox = existingBoxes.find(eb => eb.categoryBox.id === boxId);
    
    if (existingBox) {
      // Add to existing box via mutation
      if (!existingBox.categoryBox.itemsIds.includes(productId)) {
        addProductToExistingBox(existingBox.categoryBox.id, existingBox.categoryBox.name, [productId]);
      } else {
        toast.info("Product already in box");
      }
    } else {
      // Add to new box locally
      const targetBox = boxes.find((b) => b.id === boxId);
      if (targetBox) {
        if (!targetBox.items.some((item) => item.id === productId)) {
          setBoxes((prevBoxes) =>
            prevBoxes.map((box) => {
              if (box.id === boxId) {
                return {
                  ...box,
                  items: [...box.items, product],
                };
              }
              return box;
            })
          );
          toast.success("Product added to box!");
        } else {
          toast.info("Product already in box");
        }
      }
    }
  };

  // Open the name input dialog for new box
  const openAddBoxDialog = () => {
    setNewBoxName("");
    setBoxImage(null);
    setImagePreview(null);
    setEditingBox(null);
    setIsNameDialogOpen(true);
  };

  // Open edit dialog for existing box
  const openEditDialog = (box: Box | CategoryBoxData) => {
    setEditingBox(box);
    
    if ('categoryBox' in box) {
      // It's a CategoryBoxData
      setNewBoxName(box.categoryBox.name);
      setImagePreview(box.categoryBox.imageUrl || null);
    } else {
      // It's a Box
      setNewBoxName(box.name);
      setImagePreview(box.imageFile ? URL.createObjectURL(box.imageFile) : null);
    }
    
    setBoxImage(null);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (box: Box | CategoryBoxData) => {
    setDeletingBox(box);
    setIsDeleteDialogOpen(true);
  };

  // Add a box with the name from the dialog
  const addBoxWithName = () => {
    if (editingBox) {
      // Update existing box
      updateBox();
    } else {
      // Create new box
      const newBoxId = nextBoxId.toString();
      const name = newBoxName.trim() || `Box ${newBoxId}`;
      setBoxes((prevBoxes) => [
        ...prevBoxes,
        {
          id: newBoxId,
          name,
          items: [],
          imageFile: boxImage,
        },
      ]);
      setNextBoxId((prevId) => prevId + 1);
      // Auto-switch to new boxes view when creating a new box
      setSelectedBoxType("new");
    }
    setIsNameDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  // Update box
  const updateBox = async () => {
    if (!editingBox) return;

    if ('categoryBox' in editingBox) {
      // Update existing saved box
      try {
        setIsSubmitting(true);
        const input = [{
          categoryName: newBoxName.trim(),
          productId: editingBox.categoryBox.itemsIds,
          ...(boxImage ? { files: boxImage } : {}),
        }];

        await addProductToCategoryBox({
          variables: { input },
        });

        toast.success("Box updated successfully!");
        refetchCategoryBoxes();
      } catch (error) {
        console.error("Error updating box:", error);
        toast.error("Failed to update box");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Update local box
      setBoxes((prevBoxes) =>
        prevBoxes.map((box) => {
          if (box.id === editingBox.id) {
            return {
              ...box,
              name: newBoxName.trim(),
              imageFile: boxImage || box.imageFile,
            };
          }
          return box;
        })
      );
    }
  };

  // Remove a box
  const removeBox = (boxId: string) => {
    setBoxes((prevBoxes) => prevBoxes.filter((box) => box.id !== boxId));
  };

  // Delete existing category box
  const deleteExistingBox = async (categoryId: string) => {
    try {
      setIsSubmitting(true);
      await deleteCategoryBox({
        variables: { categoryId },
      });
      
      toast.success("Box deleted successfully!");
      refetchCategoryBoxes();
    } catch (error) {
      console.error("Error deleting box:", error);
      toast.error("Failed to delete box");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!deletingBox) return;

    if ('categoryBox' in deletingBox) {
      deleteExistingBox(deletingBox.categoryBox.id);
    } else {
      removeBox(deletingBox.id);
    }
    
    setIsDeleteDialogOpen(false);
    setDeletingBox(null);
  };

  // Remove item from a box
  const removeItemFromBox = (boxId: string, productId: string) => {
    setBoxes((prevBoxes) =>
      prevBoxes.map((box) => {
        if (box.id === boxId) {
          return {
            ...box,
            items: box.items.filter((item) => item.id !== productId),
          };
        }
        return box;
      })
    );
  };

  // Remove product from existing category box
  const removeProductFromExistingBox = async (categoryId: string, productId: string) => {
    try {
      await removeProductFromCategoryBox({
        variables: { categoryId, productId },
      });
      
      toast.success("Product removed from box!");
      refetchCategoryBoxes();
    } catch (error) {
      console.error("Error removing product:", error);
      toast.error("Failed to remove product");
    }
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    const product = products.find((p) => p.id === active.id);
    if (product) {
      setActiveProduct(product);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveProduct(null);

    if (!over) return;

    const productId = active.id as string;
    const boxId = over.id as string;

    if (boxId === "products") return;

    handleClickAddToBox(productId, boxId);
  };

  // Add product to existing box
  const addProductToExistingBox = async (categoryId: string, categoryName: string, productIds: string[]) => {
    try {
      const input = [{
        categoryName,
        productId: productIds,
      }];

      await addProductToCategoryBox({
        variables: { input },
      });

      toast.success("Product added to box!");
      refetchCategoryBoxes();
    } catch (error) {
      console.error("Error adding product to box:", error);
      toast.error("Failed to add product to box");
    }
  };

  // Handle image upload for box
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setBoxImage(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  // Handle Done button click
  const handleDoneClick = async () => {
    if (boxes.length === 0) {
      toast.warning("No boxes to save", {
        description: "Please create at least one box with products.",
      });
      return;
    }

    const nonEmptyBoxes = boxes.filter((box) => box.items.length > 0);

    if (nonEmptyBoxes.length === 0) {
      toast.warning("Empty boxes", {
        description: "Please add at least one product to a box.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const input = nonEmptyBoxes.map((box) => ({
        categoryName: box.name,
        productId: box.items.map((item) => item.id),
        ...(box.imageFile ? { files: box.imageFile } : {}),
      }));

      await addProductToCategoryBox({
        variables: { input },
      });

      toast.success("Success!", {
        description: `Saved ${nonEmptyBoxes.length} box${
          nonEmptyBoxes.length !== 1 ? "es" : ""
        }.`,
      });

      setBoxes([]);
      setNextBoxId(1);
      refetchCategoryBoxes();
      // Switch to existing boxes view after saving
      setSelectedBoxType("existing");
    } catch (err) {
      console.error("Error saving boxes:", err);
      toast.error("Error", {
        description: "Failed to save boxes. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  function handleSearch(value: string): void {
    setSearchTerm(value);
    refetchProducts({ query: value });
  }

  if (productsLoading || categoryBoxesLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (productsError) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading products: {productsError.message}
      </div>
    );
  }

  return (
    <div className="lg:flex gap-4 py-14 mx-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white p-6 w-full h-full rounded-lg shadow-lg mx-auto space-y-8">
          {/* Header Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Select value={selectedBoxType} onValueChange={setSelectedBoxType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select box type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">
                    Existing Boxes ({existingBoxes.length})
                  </SelectItem>
                  <SelectItem value="new">
                    New Boxes ({boxes.length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedBoxType === "new" && (
                <Button
                  onClick={handleDoneClick}
                  className="flex items-center gap-1"
                  disabled={
                    isSubmitting ||
                    boxes.length === 0 ||
                    boxes.every((box) => box.items.length === 0)
                  }
                >
                  <GalleryHorizontal className="h-4 w-4" />
                  {isSubmitting ? "Saving..." : "Save New Boxes"}
                </Button>
              )}
              <Button
                onClick={openAddBoxDialog}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Box
              </Button>
            </div>
          </div>

          {/* Boxes Section */}
          <div className="space-y-4">
            {selectedBoxType === "existing" && (
              <>
                {existingBoxes.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    No existing boxes found. Create your first box!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingBoxes.map((boxData) => (
                      <ExistingBoxCard
                        key={boxData.categoryBox.id}
                        boxData={boxData}
                        onEdit={() => openEditDialog(boxData)}
                        onDelete={() => openDeleteDialog(boxData)}
                        onRemoveProduct={removeProductFromExistingBox}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {selectedBoxType === "new" && (
              <>
                {boxes.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
                    Click the "Add Box" button to create your first box
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {boxes.map((box) => (
                      <div key={box.id} className="relative">
                        <DroppableBox
                          box={box}
                          removeBox={removeBox}
                          removeItem={removeItemFromBox}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(box)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(box)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Products</h2>
              <InputWithButton
                isExpanded={isSearchExpanded}
                setIsExpanded={setIsSearchExpanded}
                onSearch={handleSearch}
              />
            </div>

            <SortableContext
              items={products.map((p) => p.id)}
              strategy={rectSortingStrategy}
            >
              <ProductsContainer>
                {products.map((product) => (
                  <EnhancedProductItem
                    key={product.id}
                    product={product}
                    onAddToBox={handleClickAddToBox}
                    boxes={boxes}
                    existingBoxes={existingBoxes}
                    selectedBoxType={selectedBoxType}
                  />
                ))}
              </ProductsContainer>
            </SortableContext>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeProduct ? (
            <Card className="p-4 shadow-lg bg-white opacity-90">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 p-[3px] rounded-md">
                  <img
                    src={getImageUrl(activeProduct.imageUrls[0])}
                    alt={activeProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium">{activeProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    ${activeProduct.price}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add/Edit Box Dialog */}
      <Dialog open={isNameDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsNameDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingBox(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBox ? "Edit Box" : "Enter Box Name"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter a name for the box"
              value={newBoxName}
              onChange={(e) => setNewBoxName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addBoxWithName();
                }
              }}
              autoFocus
            />
            <div className="space-y-2">
              <Label htmlFor="images">Box Image</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="images"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={getImageUrl(imagePreview)}
                        alt="Box preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 hover:bg-opacity-60 transition-all rounded-lg">
                        <p className="text-white text-sm font-medium">
                          Change image
                        </p>
                      </div>
                    </div>
                  ) : (
                   <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsNameDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingBox(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={addBoxWithName} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingBox ? "Update Box" : "Create Box"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the box
              {deletingBox && (
                <span className="font-medium">
                  {' "'}{('categoryBox' in deletingBox) ? deletingBox.categoryBox.name : deletingBox.name}"{' '}
                </span>
              )}
              and all its contents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DragDropBoxes;