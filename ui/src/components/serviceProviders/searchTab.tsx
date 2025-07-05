import { useState, useRef, useEffect } from "react";
import { Search, Check, Info, Package, Eye, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, gql } from "@apollo/client";
import { GalleryDetailDialog } from "./gallery";
import { Gallery } from "./updates";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getImageUrl } from "../global/formatPrice";
import { Badge } from "../ui/badge";
import { ProductDetailDialog } from "@/vendor/AllProducts";

// Define TypeScript interfaces
interface SearchResult {
  id: string;
  title: string;
  description?: string | null;
  modelType: string;
  additionalInfo?: string | null;
  relationshipId?: string | null;
  imageurl?: string | null;
  score?: number | null;
  createdAt: string;
  updatedAt: string;
}

interface SearchResults {
  total: number;
  results: SearchResult[];
}

interface GlobalSearchData {
  globalSearch: SearchResults;
}

interface GlobalSearchVars {
  query: string;
  limit: number;
  offset: number;
  serviceId: string;
}

// Define the GraphQL query
const GLOBAL_SEARCH_QUERY = gql`
  query GlobalSearch(
    $query: String!
    $limit: Int
    $offset: Int
    $serviceId: String!
  ) {
    globalSearch(
      query: $query
      limit: $limit
      offset: $offset
      ServiceID: $serviceId
    ) {
      total
      results {
        id
        title
        description
        modelType
        additionalInfo
        imageurl
        score
        relationshipId
        createdAt
        updatedAt
      }
    }
  }
`;

// Gallery details query
export const GET_GALLERY = gql`
  query GetGallery($galleryId: String!) {
    getGallery(galleryID: $galleryId) {
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

export const GET_PRICE_CARD_BY_ID = gql`
  query GetPriceCardByID($priceCardId: String!) {
    getPriceCardById(id: $priceCardId) {
      card {
        id
        title
        description
        createdAt
        updatedAt
      }
      prices {
        id
        label
        value
        createdAt
        updatedAt
        priceCardId
      }
      amenities {
        id
        text
        createdAt
        updatedAt
        priceCardId
      }
    }
  }
`;

const GET_POLICY = gql`
  query GetPolicy($policyId: String!) {
    getPolicy(policyId: $policyId) {
      policy {
        id
        name
        description
        createdAt
      }
      policyDetails {
        id
        title
        content
        listItems
        createdAt
        updatedAt
      }
    }
  }
`;

// Add this GraphQL query for products
export const GET_PRODUCT_BY_ID = gql`
  query getProduct($productId: String!) {
    getProduct(id: $productId) {
      id
      name
      price
      state
      categories
      imageUrls
      itemsType
      description
      VendorId
      createdAt
      updatedAt
    }
  }
`;

// Product State enum
enum ProductState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DRAFT = "DRAFT",
  ARCHIVED = "ARCHIVED",
}

// Product interface
interface Product {
  id: string;
  name?: string | null;
  price?: string | null;
  state?: ProductState | null;
  categories?: string[] | null;
  imageUrls?: string[] | null;
  itemsType?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  VendorId?: string | null;
  description?: string | null;
}

// Other interfaces
interface Price {
  id: string;
  label: string;
  value: string;
  createdAt: string;
  updatedAt: string;
  priceCardId: string;
}

interface Amenity {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  priceCardId: string;
}

interface Card {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface FullCard {
  card: Card;
  prices: Price[];
  amenities: Amenity[];
}

interface Policy {
  id: string;
  name: string;
  description: string;
  createdAt: string | null;
}

interface PolicyDetail {
  id: string;
  title: string;
  content: string;
  listItems: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface FullPolicy {
  policy: Policy;
  policyDetails: PolicyDetail[];
}

interface SearchDropdownProps {
  serviceId: string;
}

// Product Search Result Item (for dropdown)
interface ProductSearchItemProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductSearchItem: React.FC<ProductSearchItemProps> = ({
  product,
  onClick,
}) => {
  const primaryImage =
    product.imageUrls && product.imageUrls.length > 0
      ? getImageUrl(product.imageUrls[0])
      : null;

  const formatPrice = (price?: string | null) => {
    if (!price) return "Price not set";
    return `$${price}`;
  };

  return (
    <div
      className="flex items-start gap-3 rounded-md p-2 hover:bg-muted cursor-pointer"
      onClick={() => onClick(product)}
    >
      {primaryImage ? (
        <img
          src={primaryImage}
          alt={product.name || "Product"}
          className="h-10 w-10 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium line-clamp-1">
          {product.name || "Unnamed Product"}
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.state && (
            <Badge className="text-xs" variant="secondary">
              {product.state}
            </Badge>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {product.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-muted-foreground">Product</span>
          {product.categories && product.categories.length > 0 && (
            <span className="text-xs text-muted-foreground">
              • {product.categories.slice(0, 2).join(", ")}
              {product.categories.length > 2 &&
                ` +${product.categories.length - 2}`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// PriceCard component
const PriceCardItem: React.FC<{
  fullCard: FullCard;
  onEdit: (card: FullCard) => void;
}> = ({ fullCard, onEdit }) => (
  <Card className="h-full flex flex-col">
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <CardTitle>{fullCard.card.title}</CardTitle>
          <CardDescription>{fullCard.card.description}</CardDescription>
        </div>
      </div>
    </CardHeader>

    <CardContent className="space-y-4 flex-grow">
      {/* Prices */}
      <div className="space-y-2">
        {fullCard.prices.map((price) => (
          <div key={price.id} className="flex justify-between items-center">
            <span className="text-sm">{price.label}</span>
            <span className="font-medium">${price.value}</span>
          </div>
        ))}
      </div>

      {/* Amenities */}
      <div className="pt-2 border-t">
        <Label className="mb-2 block">Amenities</Label>
        <ul className="text-sm space-y-2">
          {fullCard.amenities.map((amenity) => (
            <li key={amenity.id} className="flex items-start space-x-2">
              <div className="pt-[2px]">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              </div>
              <span className="break-words">{amenity.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </CardContent>

    <CardFooter className="mt-auto">
      <Button
        onClick={() => onEdit(fullCard)}
        className="w-full flex items-center justify-center gap-1"
      >
        Close Price
      </Button>
    </CardFooter>
  </Card>
);

// Individual Policy Card Component
const PolicyCardItem: React.FC<{
  fullPolicy: FullPolicy;
  onEdit: (policy: FullPolicy) => void;
}> = ({ fullPolicy, onEdit }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPolicyListItems = (detail: PolicyDetail): string[] => {
    if (!detail.listItems) return [];

    try {
      return Array.isArray(detail.listItems)
        ? detail.listItems
        : typeof detail.listItems === "string"
        ? JSON.parse(detail.listItems)
        : [];
    } catch (e) {
      console.error("Error parsing policy list items:", e);
      return [];
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div className="mt-1 p-1.5 rounded-full bg-primary/10">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{fullPolicy.policy.name}</CardTitle>
            <CardDescription>
              {fullPolicy.policy.description || "No description available."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {fullPolicy.policyDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No details found for this policy.
          </p>
        ) : (
          <div className="space-y-6">
            {fullPolicy.policyDetails.map((detail) => {
              const policyItems = getPolicyListItems(detail);

              return (
                <div key={detail.id} className="space-y-2">
                  <h3 className="text-md font-semibold">{detail.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {detail.content}
                  </p>

                  {policyItems.length > 0 && (
                    <ul className="ml-5 list-disc text-sm space-y-1">
                      {policyItems.map((item, index) => (
                        <li key={index} className="text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {detail.updatedAt && (
                    <div className="text-xs text-muted-foreground">
                      Last updated: {formatDate(detail.updatedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto">
        <Button
          onClick={() => onEdit(fullPolicy)}
          className="w-full flex items-center justify-center gap-1"
        >
          Close Policy
        </Button>
      </CardFooter>
    </Card>
  );
};

export function SearchDropdown({ serviceId }: SearchDropdownProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // State for gallery dialog
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState<boolean>(false);

  // State for price card
  const [selectedPriceCardId, setSelectedPriceCardId] = useState<string | null>(null);
  const [priceCardDialogOpen, setPriceCardDialogOpen] = useState<boolean>(false);

  // State for policy dialog
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [policyDialogOpen, setPolicyDialogOpen] = useState<boolean>(false);

  // State for product dialog - FIXED: Properly manage product dialog state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState<boolean>(false);

  // Query for selected gallery details
  const { data: galleryData, refetch: refetchGallery } = useQuery(GET_GALLERY, {
    variables: { galleryId: selectedGallery?.id || "" },
    skip: !selectedGallery?.id,
    fetchPolicy: "network-only",
  });

  // Query for selected price card details
  const { data: priceCardData } = useQuery(GET_PRICE_CARD_BY_ID, {
    variables: { priceCardId: selectedPriceCardId || "" },
    skip: !selectedPriceCardId,
    fetchPolicy: "network-only",
  });

  // Query for selected policy details
  const { data: policyData } = useQuery(GET_POLICY, {
    variables: { policyId: selectedPolicyId || "" },
    skip: !selectedPolicyId,
    fetchPolicy: "network-only",
  });

  // Query for selected product details - FIXED: Properly query product data
  const { data: productData, refetch: refetchProduct } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { productId: selectedProduct?.id || "" },
    skip: !selectedProduct?.id,
    fetchPolicy: "network-only",
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() !== "") {
        setDebouncedQuery(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apollo query hook for search
  const { loading, error, data } = useQuery<GlobalSearchData, GlobalSearchVars>(
    GLOBAL_SEARCH_QUERY,
    {
      variables: {
        query: debouncedQuery,
        limit: 10,
        offset: 0,
        serviceId: serviceId,
      },
      skip: debouncedQuery.trim() === "",
      fetchPolicy: "network-only",
    }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Process the results from the GraphQL query
  const results = data?.globalSearch?.results || [];

  // Update gallery when gallery data is fetched
  useEffect(() => {
    if (galleryData?.getGallery && selectedGallery) {
      setSelectedGallery(galleryData.getGallery);
      setGalleryDialogOpen(true);
    }
  }, [galleryData, selectedGallery]);

  // FIXED: Update product when product data is fetched
  useEffect(() => {
    if (productData?.getProduct && selectedProduct) {
      setSelectedProduct(productData.getProduct);
      setProductDialogOpen(true);
    }
  }, [productData, selectedProduct]);

  // Handle editing price card
  const handleEditPriceCard = (fullCard: FullCard) => {
    console.log("Editing price card:", fullCard);
    setPriceCardDialogOpen(false);
    setSelectedPriceCardId(null);
  };

  // Handle editing policy
  const handleEditPolicy = (fullPolicy: FullPolicy) => {
    console.log("Editing policy:", fullPolicy);
    setPolicyDialogOpen(false);
    setSelectedPolicyId(null);
  };

  // Handle item click based on model type
  const handleItemClick = (item: SearchResult, event: React.MouseEvent) => {
    event.preventDefault();
    setIsOpen(false); // Close the dropdown

    if (item.modelType === "GalleryProfession") {
      setSelectedGallery({
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        categories: item.additionalInfo ? item.additionalInfo.split(", ") : [],
        imageUrls: item.imageurl ? [item.imageurl] : [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    } else if (item.modelType === "PriceCard") {
      setSelectedPriceCardId(item.id);
      setPriceCardDialogOpen(true);
    } else if (["Price", "Amenity"].includes(item.modelType)) {
      if (item.relationshipId) {
        setSelectedPriceCardId(item.relationshipId);
        setPriceCardDialogOpen(true);
      } else {
        console.error(`No relationshipId found for ${item.modelType} with id ${item.id}`);
      }
    } else if (item.modelType === "Policy") {
      setSelectedPolicyId(item.id);
      setPolicyDialogOpen(true);
    } else if (item.modelType === "PolicyDetail") {
      if (item.relationshipId) {
        setSelectedPolicyId(item.relationshipId);
        setPolicyDialogOpen(true);
      } else {
        console.error(`No relationshipId found for PolicyDetail with id ${item.id}`);
      }
    } else if (item.modelType === "Product") {
      // FIXED: Properly handle product selection
      setSelectedProduct({
        id: item.id,
        name: item.title,
        description: item.description,
        price: item.additionalInfo,
        imageUrls: item.imageurl ? [item.imageurl] : [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
    }
  };

  // FIXED: Handle product click from ProductSearchItem
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsOpen(false);
  };

  // Get URL for non-gallery types
  const getUrlForModelType = (modelType: string, id: string): string => {
    switch (modelType) {
      case "GalleryProfession":
        return `#gallery-${id}`;
      case "Policy":
        return `#policy-${id}`;
      case "PolicyDetail":
        return `#policy-detail-${id}`;
      case "PriceCard":
        return `#price-${id}`;
      case "Price":
        return `#price-item-${id}`;
      case "Amenity":
        return `#amenity-${id}`;
      case "Product":
        return `#product-${id}`;
      default:
        return "#";
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Search className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-md border bg-background shadow-lg animate-in fade-in zoom-in z-50">
            <div className="p-2">
              <Input
                type="search"
                placeholder="Type to search..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div className="max-h-[350px] overflow-y-auto p-2">
              {loading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : error ? (
                <div className="px-3 py-2 text-sm text-red-500">
                  Error loading results
                </div>
              ) : results.length > 0 ? (
                <ul className="space-y-2">
                  {results.map((item) => (
                    <li key={item.id}>
                      {item.modelType === "Product" ? (
                        <ProductSearchItem
                          product={{
                            id: item.id,
                            name: item.title,
                            description: item.description,
                            price: item.additionalInfo,
                            imageUrls: item.imageurl ? [item.imageurl] : [],
                            createdAt: item.createdAt,
                            updatedAt: item.updatedAt,
                          }}
                          onClick={handleProductClick}
                        />
                      ) : (
                        <a
                          href={getUrlForModelType(item.modelType, item.id)}
                          className="flex items-start gap-3 rounded-md p-2 hover:bg-muted"
                          onClick={(e) => handleItemClick(item, e)}
                        >
                          {item.imageurl ? (
                            <img
                              src={getImageUrl(item.imageurl ?? undefined)}
                              alt=""
                              className="h-10 w-10 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                              <span className="text-xs font-medium">
                                {item.modelType?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.modelType}
                            </span>
                            {item.additionalInfo && (
                              <span className="text-xs text-muted-foreground ml-2">
                                {item.additionalInfo}
                              </span>
                            )}
                          </div>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : searchQuery.trim() !== "" && debouncedQuery !== "" ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No results found
                </div>
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Type to search
                </div>
              )}
            </div>

            {(data?.globalSearch?.total ?? 0) > results.length && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => {
                    /* Implement view more logic */
                  }}
                >
                  View all {data?.globalSearch.total ?? 0} results
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Gallery Detail Dialog */}
      {selectedGallery && (
        <GalleryDetailDialog
          gallery={selectedGallery}
          open={galleryDialogOpen}
          onOpenChange={(open) => {
            setGalleryDialogOpen(open);
            if (!open) {
              setSelectedGallery(null);
            }
          }}
          refetch={refetchGallery}
          serviceId={serviceId}
        />
      )}

      {/* Price Card Dialog */}
      {priceCardDialogOpen && priceCardData?.getPriceCardById && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <PriceCardItem
              fullCard={priceCardData.getPriceCardById}
              onEdit={handleEditPriceCard}
            />
          </div>
        </div>
      )}

      {/* Policy Dialog */}
      {policyDialogOpen && policyData?.getPolicy && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <PolicyCardItem
              fullPolicy={policyData.getPolicy}
              onEdit={handleEditPolicy}
            />
          </div>
        </div>
      )}

      {/* Product Dialog - FIXED: Properly pass product data and state */}
      <ProductDetailDialog
        product={productData?.getProduct || selectedProduct}
        open={productDialogOpen}
        onOpenChange={(open) => {
          setProductDialogOpen(open);
          if (!open) {
            setSelectedProduct(null);
          }
        }}
        vendorId={serviceId}
        refetch={refetchProduct}
      />
    </>
  );
}