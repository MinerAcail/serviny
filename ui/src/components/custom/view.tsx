import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "../ui/badge";
import {   Item } from "@/hooks/CartContext.tsx";

interface ItemCarouselProps {
  selectedProduct: Item | null;
  setSelectedProduct: (item: Item | null) => void;
  addToCart: (item: Item) => void;
}

const ItemCarousel: React.FC<ItemCarouselProps> = ({
  selectedProduct,
  setSelectedProduct,
  addToCart,
}) => {
  return (
    <Dialog
      open={!!selectedProduct}
      onOpenChange={() => setSelectedProduct(null)}
    >
      <DialogContent className="bgcontainer sm:max-w-[600px]">
        {selectedProduct && (
          <>
            <DialogHeader>
              <DialogTitle>{selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <Carousel className="w-full max-w-xs mx-auto">
              <CarouselContent>
                {selectedProduct.imageUrls.map((image, index) => (
                  <CarouselItem key={index}>
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`${selectedProduct.name} - Image ${index + 1}`}
                      width={400}
                      height={400}
                      className="w-full h-64 object-cover rounded-md"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
            <DialogDescription>
              <p className="text-primary font-bold text-xl my-2">
                GH¢{selectedProduct.commission}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedProduct.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            </DialogDescription>
            <div className="mt-4">
              <Button
                className="w-full"
                onClick={() => {
                  addToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
              >
                Add to Cart
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ItemCarousel;
