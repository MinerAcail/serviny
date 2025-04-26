import { Loader2} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
                {gallery.imageUrls.map((image, index) => (
                  <CarouselItem
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <div className="relative w-full h-72 md:h-96">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${gallery.title} - Image ${index + 1}`}
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
                  {gallery.title}
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
                <p className="text-sm">{gallery.description}</p>
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
import { gql, useQuery } from "@apollo/client";
import { Camera } from "lucide-react";
import { Gallery, GET_ALL_GALLERY } from "./data/typesAndGql";
import { GalleryCard } from "./view";
import { Button } from "../ui/button";

export function WorkGallery() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [filter, setFilter] = useState("all");
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);

  const { loading, error, data } = useQuery(GET_ALL_GALLERY, {
    variables: { serviceId },
  });

  const handleGalleryClick = (gallery: Gallery) => {
    setSelectedGallery(gallery);
  };

  const handleDialogClose = () => {
    setSelectedGallery(null);
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

      {filteredGallery.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No gallery items found. Try changing the filter or add new items.
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx-2">
            {filteredGallery.map((gallery: Gallery) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                onClick={handleGalleryClick}
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
    </div>
  );
}
