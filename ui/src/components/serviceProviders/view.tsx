import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { gql } from "@apollo/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UpdateGalleryDialog } from "./updates";

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

interface GalleryCardProps {
  gallery: Gallery;
  onClick?: (gallery: Gallery) => void;
  onEdit?: (galleryId: string) => void;
  onDelete?: (galleryId: string) => void;
  isDeleting?: boolean;
  showActions?: boolean;
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
  onEdit?: (galleryId: string) => void;
  onDelete?: (galleryId: string) => void;
  isDeleting?: boolean;
  showActions?: boolean;
}

export function GalleryCard({
  gallery,
  onClick,
  onEdit,
  onDelete,
  isDeleting = false,
  showActions = false,
}: GalleryCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(gallery);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(gallery.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(gallery.id);
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
          className="object-cover transition-transform duration-500 group-hover:scale-105"
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

        {/* Actions dropdown (Edit/Delete) */}
        {showActions && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 bg-white/80 rounded-full"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <UpdateGalleryDialog>
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update
                  </DropdownMenuItem>
                </UpdateGalleryDialog>
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
                <span className="inline-block rounded-full bg-[#3e3939] px-2.5 py-0.5 text-xs font-medium text-muted">
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
