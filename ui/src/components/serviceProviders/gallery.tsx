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
}: {
  gallery: Gallery | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch: () => void;
}) {
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
          <div className="lg:w-1/2 bg-slate-100 relative">
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
          <div className="lg:w-1/2 bg-white p-4 sm:p-6 flex flex-col overflow-y-auto max-h-[50vh] lg:max-h-[90vh]">
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
                {gallery?.categories?.map((category :string, index:number) => (
                  <Badge key={index} variant="secondary" className="text-xs sm:text-sm">
                    {category}
                  </Badge>
                ))}
              </div>
            </DialogHeader>

            <div className="flex-grow mb-4">
              <div className="space-y-4 bg-slate-50 p-3 sm:p-4 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Description
                  </h4>
                  <p className="text-xs sm:text-sm overflow-y-auto">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, nostrum quae iure cum perferendis voluptate omnis aliquid mollitia explicabo dignissimos eaque voluptatibus consectetur laborum nemo ipsam tempora magnam vitae, provident ut. Animi hic, commodi, dignissimos eligendi architecto eos debitis possimus deleniti illum necessitatibus dolor reprehenderit officiis accusantium molestias illo exercitationem enim expedita assumenda veniam voluptate consectetur? Ab atque blanditiis error recusandae sunt explicabo ullam iste expedita laudantium aperiam illum animi dolor incidunt cupiditate tempora veritatis enim consequuntur, repellat perferendis ea nihil. Magni nisi labore sequi vel, numquam iste. Aliquam, eos corrupti cupiditate culpa velit quis consequatur. Dolorum necessitatibus quia, aliquid unde, consequatur at, voluptate amet vel libero ipsam debitis eum veniam officia? Corrupti facilis delectus cupiditate molestiae cumque saepe similique rem excepturi a ex alias quis architecto, est adipisci quaerat in. Voluptatem placeat at rem, ipsam eligendi recusandae delectus vel quidem quibusdam veniam nemo fuga. Dicta aspernatur eligendi vero. Neque labore sint rerum omnis quasi explicabo reprehenderit accusamus placeat nesciunt, vitae cumque dolorem animi nihil ducimus velit, modi quos dignissimos commodi iusto. Vel dolorem aspernatur, officia quis in commodi voluptatem mollitia omnis ullam. Ut sit hic sed quibusdam ad libero voluptates! Illum autem eligendi, officiis assumenda cumque enim quos exercitationem, id a ea, quasi praesentium. Facere blanditiis fugiat nesciunt voluptatem recusandae dolores ipsam magni, ut sapiente excepturi delectus culpa laudantium. Eligendi rerum voluptatibus veritatis provident iure. Ex hic necessitatibus ipsum quo quibusdam, dolore facere velit aliquam saepe, minima aut qui ea totam nam. Aperiam, nobis libero. Tenetur, consequuntur perferendis. Ab consequatur ex, quo rem voluptatum quaerat saepe ratione sint inventore a, ducimus consectetur incidunt debitis molestiae numquam? Repudiandae a porro nemo qui rem maxime, laborum quia velit officia dolorum numquam sapiente dolor quod dignissimos, quasi possimus quisquam aspernatur voluptatibus. Impedit enim consectetur voluptatum quo labore illum alias ullam, consequuntur at.
                  </p>
                </div>
              </div>
            </div>

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
                <Button variant="default" size="sm" className="w-full sm:w-auto">
                  Edit Gallery
                </Button>
              </UpdateGalleryDialog>
              </div>
            </DialogFooter>
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
//
export function WorkGallery() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [filter, setFilter] = useState("all");
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const { loading, error, data, refetch } = useQuery(GET_ALL_GALLERY, {
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
        onOpenChange={(open: boolean) => !open && handleDialogClose()}

        refetch={() => {
          // Refetch the gallery data after closing the dialog
          refetch();
        }}
      />
    </div>
  );
}
