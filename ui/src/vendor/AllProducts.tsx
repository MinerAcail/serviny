import { Loader2, MoveRight, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { gql, useMutation, useQuery } from "@apollo/client";
import { Camera } from "lucide-react";
import { DialogClose } from "@radix-ui/react-dialog";
import { useCheckAuthId } from "@/middleware/context/checkID";

// Define the Product interface
export interface Product {
  id: string;
  name: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  itemsType: string[];
  createdAt: string;
  updatedAt: string;
  price: number;
  state: string;
}

// Define the GraphQL query for fetching products
export const GET_ALL_PRODUCTS = gql`
  query GetAllProducts(
    $vendorId: String!
    $query: String
    $limit: Int
    $offset: Int
  ) {
    getAllProducts(
      vendorId: $vendorId
      query: $query
      limit: $limit
      offset: $offset
    ) {
      id
      name
      state
      description
      categories
      imageUrls
      itemsType
      createdAt
      updatedAt
      price
    }
  }
`;

// Define the GraphQL mutation for deleting a product
export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;

// ProductDetailDialog Component
export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  refetch,
  vendorId,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetch: () => void;
  vendorId: string;
}) {
  // State for shuffling badge animation
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if there are valid item types (non-empty array and not just "Uncategorized")
  const hasValidItemTypes =
    product?.itemsType &&
    product?.itemsType.length > 0 &&
    !(
      product?.itemsType.length === 1 &&
      (product?.itemsType[0] === "Uncategorized" ||
        product?.itemsType[0] === null)
    );

  const validItemTypes = hasValidItemTypes ? product?.itemsType : [];

  // Cycle through item types
  useEffect(() => {
    if (!hasValidItemTypes || validItemTypes.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTypeIndex((prevIndex) =>
          prevIndex >= validItemTypes.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => {
          setIsAnimating(false);
        }, 150);
      }, 150);
    }, 3000);

    return () => clearInterval(interval);
  }, [validItemTypes.length, hasValidItemTypes]);
  const { isMatch } = useCheckAuthId(vendorId);

  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onError: (error) => {
      console.error("Error deleting product:", error);
    },
  });

  if (!product) return null;

  const handleDeleteProduct = (productId: string) => {
    deleteProduct({
      variables: { id: productId },
    });
  };

  const handleAddToCart = () => {
    // Add to cart logic here
    console.log("Adding to cart from dialog:", product.id);
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
                {product.imageUrls.map((image, index) => (
                  <CarouselItem
                    key={index}
                    className="flex items-center justify-center"
                  >
                    <div className="relative w-full h-64 sm:h-72 md:h-80 lg:h-96">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`${product.name} - Image ${index + 1}`}
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
                  {product.name}
                </DialogTitle>
                <DialogClose className="lg:hidden">
                  <X className="h-4 w-4" />
                </DialogClose>
              </div>

              <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                {product?.categories?.map((category: string, index: number) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs sm:text-sm"
                  >
                    {category}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs sm:text-sm">
                  {product.state}
                </Badge>
              </div>

              <div className="mt-3 text-lg font-semibold text-primary">
                {formatPrice(product.price)}
              </div>
            </DialogHeader>

            <div className="flex-grow mb-4">
              <div className="space-y-4 bg-secondary p-3 sm:p-4 rounded-lg">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Description
                  </h4>
                  <p className="text-xs sm:text-sm overflow-y-auto">
                    {product.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <Button
                variant="default"
                size="sm"
                className="gap-2"
                onClick={handleAddToCart}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 20a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
                  <path d="M20 20a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Add to Cart
              </Button>
            </div>

            {isMatch && (
              <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 mt-auto pt-4 border-t">
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-initial"
                    onClick={() => {
                      handleDeleteProduct(product.id);
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
                  <UpdateProductDialog
                    product={product}
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
                      Edit Product
                    </Button>
                  </UpdateProductDialog>
                </div>
              </DialogFooter>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ProductCard Component
export function ProductCard({
  product,
  onClick,
}: {
  product: Product;
  onClick: (product: Product) => void;
}) {
  const { addItem, items } = useCart();
  // Check if product is already in cart
  const isInCart = items.some((item) => item.id === product.id);
  const productCount =
    items.find((item) => item.id === product.id)?.quantity || 0;
  // State for shuffling badge animation
  const [currentTypeIndex, setCurrentTypeIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if there are valid item types (non-empty array and not just "Uncategorized")
  const hasValidItemTypes =
    product.itemsType &&
    product.itemsType.length > 0 &&
    !(
      product.itemsType.length === 1 &&
      (product.itemsType[0] === "Uncategorized" ||
        product.itemsType[0] === null)
    );

  const validItemTypes = hasValidItemTypes ? product.itemsType : [];

  // Cycle through item types
  useEffect(() => {
    if (!hasValidItemTypes || validItemTypes.length <= 1) return;

    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentTypeIndex((prevIndex) =>
          prevIndex >= validItemTypes.length - 1 ? 0 : prevIndex + 1
        );
        setTimeout(() => {
          setIsAnimating(false);
        }, 150);
      }, 150);
    }, 3000);

    return () => clearInterval(interval);
  }, [validItemTypes.length, hasValidItemTypes]);

  // formatPrice

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    // Add to cart logic here
    addItem(product, 1);
    toast.success(
      <div className="flex items-center gap-2">
        <span>{product.name} added to cart!</span>
        {/* <MoveRight className="h-4 w-4 animate-pulse" /> */}
      </div>,

      { position: "top-center" }
    );
  };

  return (
    <div
      className="group relative overflow-hidden rounded-md shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer bg-primary-foreground"
      onClick={() => onClick(product)}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.imageUrls[0] || "/placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Add to Cart Button at top right */}
        <div className="absolute top-2 right-2 z-10">
          <Button
            size="sm"
            variant="secondary"
            className="relative rounded-full p-2 bg-primary hover:bg-primary/90 shadow-md"
            onClick={handleAddToCart}
          >
            <span className="text-[12px] text-primary-foreground">
              {isInCart ? "Add More" : "Buy"}
            </span>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary-foreground ml-1"
            >
              <path d="M9 20a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
              <path d="M20 20a1 1 0 1 0 0 2 1 1 0 1 0 0-2z" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              <circle cx="9" cy="9" r="2" />
              <path d="M12 7v4" />
              <path d="M10 9h4" />
            </svg>

            {productCount > 0 && (
              <span className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                {productCount}
              </span>
            )}
          </Button>
        </div>

        <div className="absolute  bottom-0 left-0 right-0 bg-gradient-to-tr from-background/100 to-transparent p-3">
          <div className="flex items-center justify-between my-1">
            <h3 className="font-semibold text-sm sm:text-base truncate">
              {product.name}
            </h3>

            {hasValidItemTypes && (
              <div className="relative h-6 w-24 flex items-center justify-end overflow-hidden">
                <Badge
                  variant="outline"
                  className={`text-xs absolute transition-all duration-300 ${
                    isAnimating
                      ? "transform translate-y-full opacity-0"
                      : "transform translate-y-0 opacity-100"
                  }`}
                >
                  {validItemTypes[currentTypeIndex]}
                </Badge>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm font-medium text-primary">
              {formatPrice(product.price)}
            </p>
            <Badge variant="outline" className="text-xs">
              {product.state}
            </Badge>
          </div>
        </div>
      </div>
    </div>
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
import { useCart } from "@/components/custom/cart/cart-context";
import { formatPrice } from "@/components/global/formatPrice";
import { toast } from "sonner";

// Define the GraphQL query for fetching categories
const GET_ALL_CATEGORIES = gql`
  query getAllCategories($vendorId: String!) {
    getAllCategories(vendorId: $vendorId)
  }
`;

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  vendorId: string;
}

export function CategoryFilter({
  value,
  onChange,
  vendorId,
}: CategoryFilterProps) {
  // Fetch categories from GraphQL API
  const { loading, error, data } = useQuery(GET_ALL_CATEGORIES, {
    variables: { vendorId },
  });

  // Extract categories from the GraphQL response
  const categories = data?.getAllCategories || [];

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

// Main WorkProducts Component
export function AllProducts() {
  const { serviceId: vendorId } = useParams<{
    serviceId: string;
  }>();

  // Sync vendorId to localStorage on mount or when vendorId changes
  useEffect(() => {
    if (!vendorId) return;
    const storedId = localStorage.getItem("currentVendorId");
    if (storedId !== vendorId) {
      localStorage.setItem("currentVendorId", vendorId);
    }
  }, [vendorId]);
  const [filter, setFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [offset, setOffset] = useState(0);
  const limit = 12;

  const [productItems, setProductItems] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { loading, error, fetchMore, refetch } = useQuery(GET_ALL_PRODUCTS, {
    variables: {
      vendorId,
      query: filter === "all" ? "" : filter.toLowerCase(),
      limit,
      offset: 0,
    },
    onCompleted: (data) => {
      setProductItems(data.getAllProducts);
      setHasMore(data.getAllProducts.length === limit);
    },
  });

  const handleViewMore = async () => {
    const newOffset = offset + limit;

    const { data: moreData } = await fetchMore({
      variables: {
        vendorId,
        query: filter === "all" ? "" : filter.toLowerCase(),
        limit,
        offset: newOffset,
      },
    });

    const newItems = moreData?.getAllProducts || [];
    setProductItems((prev) => [...prev, ...newItems]);
    setOffset(newOffset);
    setHasMore(newItems.length === limit);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
  };

  if (loading && productItems.length === 0)
    return <div className="text-center py-12">Loading products...</div>;

  if (error)
    return (
      <div className="text-center py-12 text-red-500">
        Error loading products: {error.message}
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
              vendorId,
              query: value === "all" ? "" : normalizedFilter,
              limit,
              offset: 0,
            }).then(({ data }) => {
              setProductItems(data.getAllProducts);
              setHasMore(data.getAllProducts.length === limit);
            });
          }}
          vendorId={vendorId ?? ""}
        />
      </div>

      {productItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found. Try changing the filter or add new items.
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mx2">
            {productItems.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
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
                View More Products
              </Button>
            </div>
          )}
        </>
      )}

      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open: boolean) => !open && handleDialogClose()}
        vendorId={vendorId}
        refetch={() => refetch()}
      />
    </div>
  );
}

// For demo/placeholder purposes - replace with actual implementation
function UpdateProductDialog({ product, onSuccess, children }) {
  return <div onClick={onSuccess}>{children}</div>;
}
