import { Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";



export function GalleryDetailDialog({
  gallery,
  open,
  onOpenChange,
  refetch,
  serviceId
}: {
  gallery: Gallery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch: () => void;
  serviceId:string ;
}) {
  const { isMatch } = useCheckAuthId(serviceId);

  const [deleteGallery] = useMutation(DELETE_GALLERY, {
    onError: (error) => {
      console.error("Error deleting gallery:", error);
    },
  });

  if (!gallery) return null;

  const handleDeleteGallery = (galleryId:string) => {
    deleteGallery({
      variables: { id: galleryId },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[1000px] p-0 overflow-hidden rounded-lg">
        {/* Main container with improved responsive layout */}
        <div className="flex flex-col lg:flex-row max-h-[90vh]">
          {/* Left side - Carousel */}
          <div className="lg:w-1/2 bg-primary-foreground relative">
            <Carousel className="w-full h-full">
              <CarouselContent>
                {gallery.imageUrls.map((image, index) => (
                  <CarouselItem
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${gallery.title} - Image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 hidden sm:flex" />
              <CarouselNext className="right-2 hidden sm:flex" />
            </Carousel>
          </div>

          {/* Right side - Scrollable Content */}
          <div className="lg:w-1/2 bg-primary-foreground p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between">
                <DialogTitle className="text-xl sm:text-2xl font-bold">
                  {gallery.title}
                </DialogTitle>
                <DialogClose className="lg:hidden">
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                {gallery?.categories?.map((category: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs sm:text-sm"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </DialogHeader>

            <div className="flex-grow mb-4">
              <div className="space-y-4 bg-secondary p-3 sm:p-4 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Description
                  </h4>
                  <p className="text-xs sm:text-sm overflow-y-auto">
                    {gallery.description}
                  </p>
                </div>
              </div>
            </div>
            {isMatch && (
              <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-auto pt-4 border-t">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => {
                      handleDeleteGallery(gallery.id);
                      onOpenChange(false);
                      refetch();
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <UpdateGalleryDialog
                    gallery={gallery}
                    onSuccess={() => {
                      onOpenChange(false);
                      refetch();
                    }}
                  >
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Edit Gallery
                    </Button>
                  </UpdateGalleryDialog>
                </div>
              </DialogFooter>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// CategoryFilter Component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the GraphQL query for fetching categories
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
import { useState } from "react";
import { useParams } from "react-router";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Camera } from "lucide-react";
import { Gallery, GET_ALL_GALLERY } from "./data/typesAndGql";
import { DELETE_GALLERY } from "./view";
import { Button } from "../ui/button";
import { GalleryCard, UpdateGalleryDialog } from "./updates";

import { DialogClose } from "@radix-ui/react-dialog";
import { useCheckAuthId } from "@/middleware/context/checkID";
//
export function WorkGallery() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [filter, setFilter] = useState("all");
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const [galleryItems, setGalleryItems] = useState<Gallery[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { loading, error, fetchMore, refetch } = useQuery(GET_ALL_GALLERY, {
    variables: {
      serviceId,
      query: filter === "all" ? null : filter.toLowerCase(),
      limit,
      offset: 0,
    },
    onCompleted: (data) => {
      setGalleryItems(data.getAllGallery);
      setHasMore(data.getAllGallery.length === limit);
    },
  });

  const handleViewMore = async () => {
    const newOffset = offset + limit;

    const { data: moreData } = await fetchMore({
      variables: {
        serviceId,
        query: filter === "all" ? null : filter.toLowerCase(),
        limit,
        offset: newOffset,
      },
    });

    const newItems = moreData?.getAllGallery || [];
    setGalleryItems((prev) => [...prev, ...newItems]);
    setOffset(newOffset);
    setHasMore(newItems.length === limit);
  };

  const handleGalleryClick = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handleDialogClose = () => {
    setSelectedGallery(null);
  };

  if (loading && galleryItems.length === 0)
    return <div className="text-center py-12">Loading gallery...</div>;

  if (error)
    return (
      <div className="text-center py-12 text-red-500">
        Error loading gallery: {error.message}
      </div>
    );

  return (
    <div>
      <div className="mb-3 flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-center">
        <CategoryFilter
          value={filter}
          onChange={(value) => {
            const normalizedFilter = value.toLowerCase();
            setFilter(value);
            setOffset(0);
            refetch({
              serviceId,
              query: value === "all" ? null : normalizedFilter,
              limit,
              offset: 0,
            }).then(({ data }) => {
              setGalleryItems(data.getAllGallery);
              setHasMore(data.getAllGallery.length === limit);
            });
          }}
          serviceId={serviceId ?? ""}
        />
      </div>

      {galleryItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No gallery items found. Try changing the filter or add new items.
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-2">
            {galleryItems.map((gallery: Gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                onClick={handleGalleryClick}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                className="gap-2 rounded-full px-6"
                onClick={handleViewMore}
                disabled={loading}
              >
                <Camera className="h-4 w-4" />
                View More Projects
              </Button>
            </div>
          )}
        </>
      )}

      <GalleryDetailDialog
        gallery={selectedGallery}
        open={!!selectedGallery}
        onOpenChange={(open: boolean) => !open && handleDialogClose()}
        serviceId={serviceId ?? ""}
        refetch={() => refetch()}
      />
    </div>
  );
}
