import { useState, useRef } from "react";
import { useParams } from "react-router";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Camera, MoreVertical, Pencil, Trash2, Loader2, Upload, X } from "lucide-react";
import { Gallery, GET_ALL_GALLERY } from "./data/typesAndGql";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";




// Gallery Detail Dialog Component
interface GalleryDetailDialogProps {
  gallery: Gallery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GalleryDetailDialog({
  gallery,
  open,
  onOpenChange,
}: GalleryDetailDialogProps) {
  if (!gallery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-lg">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left side - Carousel */}
          <div className="md:w-1/2 bg-gray-50 relative">
            <Carousel className="w-full h-full">
              <CarouselContent>
                {gallery?.imageUrls.map((image, index) => (
                  <CarouselItem
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <div className="relative w-full h-72 md:h-96">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${gallery?.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          {/* Right side - Content */}
          <div className="md:w-1/2 p-6 max-h-[500px] overflow-y-auto">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-2xl font-bold">
                  {gallery?.title}
                </DialogTitle>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {gallery?.categories?.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </DialogHeader>

            <DialogDescription className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Description
                </h4>
                <p className="text-sm">{gallery?.description}</p>
              </div>

              <div className="pt-4">
                <Button className="w-full" variant="default">
                  BOOK
                </Button>
              </div>
            </DialogDescription>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Edit Gallery Dialog Component
interface EditGalleryDialogProps {
  gallery: Gallery | null;
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (galleryId: string, files: File[], data: any) => Promise<void>;
  isLoading: boolean;
}

export function EditGalleryDialog({
  gallery,
  categories,
  open,
  onOpenChange,
  onSave,
  isLoading,
}: EditGalleryDialogProps) {
  const [title, setTitle] = useState(gallery?.title || "");
  const [description, setDescription] = useState(gallery?.description || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(gallery?.categories || []);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(gallery?.imageUrls || []);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
      
      // Create preview URLs
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    // If it's an existing image (from gallery?.imageUrls)
    const updatedPreviews = [...previews];
    updatedPreviews.splice(index, 1);
    setPreviews(updatedPreviews);
    
    // If it's a new file
    if (index < files.length) {
      const updatedFiles = [...files];
      updatedFiles.splice(index, 1);
      setFiles(updatedFiles);
    }
  };

  const handleSave = async () => {
    if (!gallery) return;
    
    const formData = {
      title,
      description,
      categories: selectedCategories,
      imageUrls: previews.filter(url => url.startsWith('http')), // Only keep URLs that are from server
    };
    
    await onSave(gallery?.id, files, formData);
    
    // Clean up preview URLs
    previews.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };

  // Reset form when gallery changes
  useState(() => {
    if (gallery) {
      setTitle(gallery?.title || "");
      setDescription(gallery?.description || "");
      setSelectedCategories(gallery?.categories || []);
      setPreviews(gallery?.imageUrls || []);
      setFiles([]);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Gallery</DialogTitle>
          <DialogDescription>
            Update the gallery information and images.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Gallery title"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this gallery"
              rows={4}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge 
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedCategories.includes(category)) {
                      setSelectedCategories(selectedCategories.filter(c => c !== category));
                    } else {
                      setSelectedCategories([...selectedCategories, category]);
                    }
                  }}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Images</Label>
            <div className="grid grid-cols-3 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-md overflow-hidden border">
                  <img 
                    src={preview} 
                    alt={`Preview ${index}`} 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <div
                className="aspect-square rounded-md border border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-gray-400" />
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Updated GalleryCard component to include dropdown menu
interface GalleryCardProps {
  gallery: Gallery;
  onClick: (gallery: Gallery) => void;
  onEdit: (gallery: Gallery) => void;
  onDelete: (galleryId: string) => void;
  isDeleting: boolean;
}

export function EnhancedGalleryCard({
  gallery,
  onClick,
  onEdit,
  onDelete,
  isDeleting,
}: GalleryCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(gallery?.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(gallery);
  };

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border bg-background shadow-sm transition-all hover:shadow-md"
      onClick={() => onClick(gallery)}
    >
      <div className="relative aspect-square">
        <img
          src={(gallery?.imageUrls && gallery.imageUrls.length > 0) ? gallery.imageUrls[0] : "/placeholder.svg"}
          alt={gallery?.title || "Gallery Image"}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-8 w-8 bg-white/80 rounded-full">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-lg">{gallery?.title || "Untitled Gallery"}</h3>
        <div className="mt-2 flex flex-wrap gap-1">
          {gallery?.categories?.slice(0, 2).map((category, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
          {gallery?.categories && gallery.categories.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{gallery.categories.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// CategoryFilter Component
const GET_ALL_CATEGORIES = gql`
  query GetAllCategoriesFromGallery($serviceId: String!) {
    getAllCategoriesFromGallery(ServiceId: $serviceId)
  }
`;

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  serviceId: string;
}

export function CategoryFilter({
  value,
  onChange,
  serviceId,
}: CategoryFilterProps) {
  // Fetch categories from GraphQL API
  const { loading, error, data } = useQuery(GET_ALL_CATEGORIES, {
    variables: { serviceId },
  });

  // Extract categories from the GraphQL response
  const categories = data?.getAllCategoriesFromGallery || [];

  return (
    <div className="relative">
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="w-[180px] rounded-full">
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <SelectValue placeholder="Filter by category" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>

          {/* Dynamically render categories from API */}
          {categories?.map((category: string) => (
            <SelectItem key={category} value={category.toLowerCase()}>
              {category}
            </SelectItem>
          ))}

          {/* Show message if no categories found */}
          {!loading && categories?.length === 0 && !error && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No categories found
            </div>
          )}

          {/* Show error message if API call failed */}
          {error && (
            <div className="px-2 py-1.5 text-sm text-red-500">
              Failed to load categories
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

// Main WorkGallery Component
export function WorkGallery() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [filter, setFilter] = useState("all");
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [galleryToEdit, setGalleryToEdit] = useState<Gallery | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deletingGalleryIds, setDeletingGalleryIds] = useState<string[]>([]);

  // Fetch galleries
  const { loading, error, data, refetch } = useQuery(GET_ALL_GALLERY, {
    variables: { serviceId },
  });

  // Fetch categories for edit form
  const { data: categoriesData } = useQuery(GET_ALL_CATEGORIES, {
    variables: { serviceId },
  });
  const availableCategories = categoriesData?.getAllCategoriesFromGallery || [];

  // Set up mutations
  const [updateGallery, { loading: isUpdating }] = useMutation(UPDATE_GALLERY, {
    onCompleted: () => {
      setIsEditDialogOpen(false);
      refetch();
    },
  });
  
  const [deleteGallery] = useMutation(DELETE_GALLERY, {
    onCompleted: (data, { variables }) => {
      if (data.deleteGallery) {
        setDeletingGalleryIds(prev => prev.filter(id => id !== variables.id));
        refetch();
      }
    },
  });

  const handleGalleryClick = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handleDialogClose = () => {
    setSelectedGallery(null);
  };

  const handleEditGallery = (gallery: Gallery) => {
    setGalleryToEdit(gallery);
    setIsEditDialogOpen(true);
  };

  const handleDeleteGallery = async (galleryId: string) => {
    try {
      setDeletingGalleryIds(prev => [...prev, galleryId]);
      await deleteGallery({
        variables: { id: galleryId },
      });
    } catch (error) {
      console.error("Error deleting gallery:", error);
      setDeletingGalleryIds(prev => prev.filter(id => id !== galleryId));
    }
  };

  const handleUpdateGallery = async (galleryId: string, files: File[], formData: any) => {
    try {
      await updateGallery({
        variables: {
          galleryID: galleryId,
          files,
          input: {
            title: formData.title,
            description: formData.description,
            categories: formData.categories,
            imageUrls: formData.imageUrls,
          },
        },
      });
    } catch (error) {
      console.error("Error updating gallery:", error);
    }
  };

  if (loading)
    return <div className="text-center py-12">Loading gallery...</div>;
  if (error)
    return (
      <div className="text-center py-12 text-red-500">
        Error loading gallery: {error.message}
      </div>
    );

  const galleryItems = data?.getAllGallery || [];

  const filteredGallery = galleryItems?.filter((item: Gallery) =>
    filter === "all" ? true : item?.categories?.includes(filter.toLowerCase())
  );

  return (
    <div>
      <div className="mb-3 flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-center">
        <CategoryFilter
          value={filter}
          onChange={setFilter}
          serviceId={serviceId ?? ""}
        />
      </div>

      {filteredGallery?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No gallery items found. Try changing the filter or add new items.
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-2">
            {filteredGallery?.map((gallery: Gallery) => (
              <EnhancedGalleryCard
                key={gallery?.id}
                gallery={gallery}
                onClick={handleGalleryClick}
                onEdit={handleEditGallery}
                onDelete={handleDeleteGallery}
                isDeleting={deletingGalleryIds.includes(gallery?.id)}
              />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Button variant="outline" className="gap-2 rounded-full px-6">
              <Camera className="h-4 w-4" />
              View More Projects
            </Button>
          </div>
        </>
      )}

      <GalleryDetailDialog
        gallery={selectedGallery}
        open={!!selectedGallery}
        onOpenChange={(open) => !open && handleDialogClose()}
      />

      <EditGalleryDialog
        gallery={galleryToEdit}
        categories={availableCategories}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleUpdateGallery}
        isLoading={isUpdating}
      />
    </div>
  );
}