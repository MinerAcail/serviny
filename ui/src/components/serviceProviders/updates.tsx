import { useState, useRef } from "react";
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
  X,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Types
export interface Gallery {
  id: string;
  title: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

// GraphQL Queries and Mutations
export const GET_ALL_GALLERY = gql`
  query GetAllGallery($serviceId: String!) {
    getAllGallery(ServiceId: $serviceId) {
      id
      title
      description
      categories
      imageUrls
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_POLICY = gql`
  mutation CreatePolicy($input: CreatePolicyInput!) {
    createPolicy(input: $input) {
      id
      name
      description
    }
  }
`;

export const UPDATE_GALLERY = gql`
  mutation UpdateGallery(
    $galleryID: String!
    $files: [Upload]
    $input: GalleryProfessionInput!
    $removeUrl: [String]
  ) {
    updateGallery(
      galleryID: $galleryID
      files: $files
      input: $input
      removeUrl: $removeUrl
    ) {
      id
      title
      description
      categories
      imageUrls
    }
  }
`;

export const DELETE_GALLERY = gql`
  mutation DeleteGallery($id: String!) {
    deleteGallery(id: $id)
  }
`;

interface GalleryCardProps {
  gallery: Gallery;
  onClick?: (gallery: Gallery) => void;

}

export function UpdateGalleryDialog({
    gallery,
    onSuccess,
    children,
  }: {
    gallery: Gallery | null;
    onSuccess?: () => void;
    children: React.ReactNode;
  }) {
    // Form state
    const [title, setTitle] = useState(gallery?.title || "");
    const [description, setDescription] = useState(gallery?.description || "");
    const [newCategory, setNewCategory] = useState("");
    const [categories, setCategories] = useState<string[]>(
      gallery?.categories || []
    );
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
  
    // Track which images to remove
    const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  
    // File upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
    // Mutations
    const [updateGallery, { loading }] = useMutation(UPDATE_GALLERY);
    const [deleteGallery, { loading: deleteLoading }] = useMutation(DELETE_GALLERY, {
      refetchQueries: [GET_ALL_GALLERY],
      onError: (error) => {
        console.error("Error deleting gallery:", error);
        setIsDeleting(false);
      },
      onCompleted: () => {
        setIsOpen(false);
        setIsDeleting(false);
        if (onSuccess) onSuccess();
      }
    });
  
    // Reset form when gallery changes or dialog opens
    const resetForm = () => {
      if (gallery) {
        setTitle(gallery.title);
        setDescription(gallery.description);
        setCategories(gallery.categories || []);
        setImagesToRemove([]);
        setSelectedFiles([]);
        setPreviewUrls([]);
        setIsDeleting(false);
      }
    };
  
    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (open) {
        resetForm();
      }
    };
  
    const handleAddCategory = () => {
      if (newCategory.trim() && !categories.includes(newCategory.trim())) {
        setCategories([...categories, newCategory.trim()]);
        setNewCategory("");
      }
    };
  
    const handleRemoveCategory = (categoryToRemove: string) => {
      setCategories(
        categories.filter((category) => category !== categoryToRemove)
      );
    };
  
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        const newFiles = Array.from(files);
        setSelectedFiles((prev) => [...prev, ...newFiles]);
  
        // Generate preview URLs
        newFiles.forEach((file) => {
          const reader = new FileReader();
          reader.onload = () => {
            setPreviewUrls((prev) => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        });
      }
    };
  
    const handleRemoveFile = (index: number) => {
      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    };
  
    const toggleImageRemoval = (url: string) => {
      if (imagesToRemove.includes(url)) {
        setImagesToRemove((prev) => prev.filter((item) => item !== url));
      } else {
        setImagesToRemove((prev) => [...prev, url]);
      }
    };
  
    const handleSubmit = async () => {
      if (!gallery?.id) return;
  
      try {
        const result = await updateGallery({
          variables: {
            galleryID: gallery.id,
            files: selectedFiles,
            input: {
              title,
              description,
              categories: categories.map((cat) => cat),
            },
            removeUrl: imagesToRemove,
          },
        });
  
        if (result.data.updateGallery) {
          setIsOpen(false);
          if (onSuccess) onSuccess();
        }
      } catch (error) {
        console.error("Error updating gallery:", error);
      }
    };
  
    const handleDelete = async () => {
      if (!gallery?.id) return;
      
      // Confirm before deleting
      if (window.confirm(`Are you sure you want to delete "${gallery.title}"? This action cannot be undone.`)) {
        setIsDeleting(true);
        
        try {
          await deleteGallery({
            variables: { id: gallery.id }
          });
        } catch (error) {
          console.error("Error deleting gallery:", error);
          setIsDeleting(false);
        }
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md md:max-w-xl">
          <DialogHeader>
            <DialogTitle>Update Gallery</DialogTitle>
          </DialogHeader>
  
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Gallery Title"
              />
            </div>
  
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Gallery Description"
                rows={3}
              />
            </div>
  
            <div className="grid gap-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {categories.map((category, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {category}
                    <button
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add category"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCategory}
                >
                  Add
                </Button>
              </div>
            </div>
  
            {/* Existing Images */}
            {gallery?.imageUrls && gallery.imageUrls.length > 0 && (
              <div className="grid gap-2">
                <Label>Current Images</Label>
                <div className="grid grid-cols-3 gap-2">
                  {gallery.imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Gallery image ${index + 1}`}
                        className={`object-cover aspect-square rounded ${
                          imagesToRemove.includes(url) ? "opacity-30" : ""
                        }`}
                      />
                      <Button
                        size="icon"
                        variant={
                          imagesToRemove.includes(url) ? "outline" : "destructive"
                        }
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleImageRemoval(url)}
                      >
                        {imagesToRemove.includes(url) ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                      {imagesToRemove.includes(url) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-medium text-destructive">
                            Will be removed
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
  
            {/* File Upload */}
            <div className="grid gap-2">
              <Label>Upload New Images</Label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`New image ${index + 1}`}
                      className="object-cover aspect-square rounded"
                    />
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
                  className="aspect-square flex flex-col items-center justify-center border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8 mb-2 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add Image</span>
                </Button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
  
          <DialogFooter className="flex justify-between sm:justify-between">
            <div>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={deleteLoading || loading}
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
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || deleteLoading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Gallery"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

export function GalleryCard({
  gallery,
  onClick,
  
}: GalleryCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(gallery);
    }
  };




  return (
    <Card
      key={gallery.id}
      className="group relative overflow-hidden border-none bg-background/60 shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={gallery.imageUrls?.[0] || "/placeholder.svg"}
          alt={gallery.title}
          className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* External link button */}
        {onClick && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onClick(gallery);
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}

      
      </div>

      <CardContent className="p-5">
        <div className="mb-2 flex flex-wrap gap-1">
          {gallery.categories && gallery.categories.length > 0 ? (
            <>
              {gallery.categories.slice(0, 3).map((category, index) => (
                <span
                  key={index}
                  className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {category}
                </span>
              ))}
              {gallery.categories.length > 3 && (
                <span className="inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  +{gallery.categories.length - 3} more
                </span>
              )}
            </>
          ) : (
            <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Uncategorized
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold">{gallery.title}</h3>
        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {gallery.description}
        </p>
      </CardContent>
    </Card>
  );
}
