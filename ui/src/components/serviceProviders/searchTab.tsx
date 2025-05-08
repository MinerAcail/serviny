import { useState, useRef, useEffect } from "react";
import { Search, Check, Info } from "lucide-react";
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

// Fix: Corrected GET_POLICY query to match PolicyCardItem prop structure
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

interface SearchDropdownProps {
  serviceId: string;
}

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

// Individual Policy Card Component
const PolicyCardItem: React.FC<{
  fullPolicy: FullPolicy;
  onEdit: (policy: FullPolicy) => void;
}> = ({ fullPolicy, onEdit }) => {
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Parse list items for each policy detail
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

                  {/* List items if available */}
                  {policyItems.length > 0 && (
                    <ul className="ml-5 list-disc text-sm space-y-1">
                      {policyItems.map((item, index) => (
                        <li key={index} className="text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Display the last update time */}
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
  const [selectedPriceCardId, setSelectedPriceCardId] = useState<string | null>(
    null
  );
  const [priceCardDialogOpen, setPriceCardDialogOpen] =
    useState<boolean>(false);

  // State for policy dialog
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [policyDialogOpen, setPolicyDialogOpen] = useState<boolean>(false);

  // Query for selected gallery details
  const { data: galleryData, refetch: refetchGallery } = useQuery(GET_GALLERY, {
    variables: { galleryId: selectedGallery?.id || "" },
    skip: !selectedGallery?.id,
    fetchPolicy: "network-only",
  });

  // Query for selected price card details
  const { data: priceCardData } = useQuery(GET_PRICE_CARD_BY_ID, {
    variables: {
      priceCardId: selectedPriceCardId || "",
    },
    skip: !selectedPriceCardId,
    fetchPolicy: "network-only",
  });

  // Query for selected policy details
  const { data: policyData } = useQuery(GET_POLICY, {
    variables: {
      policyId: selectedPolicyId || "",
    },
    skip: !selectedPolicyId,
    fetchPolicy: "network-only",
  });

  // Debounce search input to avoid too many queries
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
      fetchPolicy: "network-only", // Ensures we always get fresh data
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

  // Handle editing price card
  const handleEditPriceCard = (fullCard: FullCard) => {
    // Implement edit functionality
    console.log("Editing price card:", fullCard);
    // Close dialog after editing
    setPriceCardDialogOpen(false);
    setSelectedPriceCardId(null);
  };

  // Handle editing policy
  const handleEditPolicy = (fullPolicy: FullPolicy) => {
    // Implement edit functionality
    console.log("Editing policy:", fullPolicy);
    // Close dialog after editing
    setPolicyDialogOpen(false);
    setSelectedPolicyId(null);
  };

  // Handle item click based on model type
  const handleItemClick = (item: SearchResult, event: React.MouseEvent) => {
    event.preventDefault();

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
      // The dialog will open when galleryData is fetched
    } else if (item.modelType === "PriceCard") {
      // Direct PriceCard - use its own ID
      setSelectedPriceCardId(item.id);
      setPriceCardDialogOpen(true);
    } else if (["Price", "Amenity"].includes(item.modelType)) {
      // Price and Amenity - use their relationshipId (which contains priceCardId)
      if (item.relationshipId) {
        setSelectedPriceCardId(item.relationshipId);
        setPriceCardDialogOpen(true);
      } else {
        console.error(
          `No relationshipId found for ${item.modelType} with id ${item.id}`
        );
      }
    } else if (item.modelType === "Policy") {
      // Handle Policy - show the policy dialog instead of navigating
      setSelectedPolicyId(item.id);
      setPolicyDialogOpen(true);
    } else if (item.modelType === "PolicyDetail") {
      // PolicyDetail - use relationshipId to open parent policy dialog
      if (item.relationshipId) {
        setSelectedPolicyId(item.relationshipId);
        setPolicyDialogOpen(true);
      } else {
        console.error(
          `No relationshipId found for PolicyDetail with id ${item.id}`
        );
      }
    } else {
      // For other types, just close the search dropdown
      setIsOpen(false);
    }
  };

  // Get URL for non-gallery types
  const getUrlForModelType = (modelType: string, id: string): string => {
    switch (modelType) {
      case "GalleryProfession":
        return `#gallery-${id}`; // We'll prevent navigation and show dialog instead
      case "Policy":
        return `#policy-${id}`; // We'll prevent navigation and show dialog instead
      case "PolicyDetail":
        return `#policy-detail-${id}`; // We'll prevent navigation and show dialog instead
      case "PriceCard":
        return `#price-${id}`; // We'll prevent navigation and show dialog instead
      case "Price":
        return `#price-item-${id}`; // We'll prevent navigation and show dialog instead
      case "Amenity":
        return `#amenity-${id}`; // We'll prevent navigation and show dialog instead
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
                <ul className="space-y-2 ">
                  {results.map((item) => (
                    <li key={item.id}>
                      <a
                        href={getUrlForModelType(item.modelType, item.id)}
                        className="flex items-start gap-3 rounded-md p-2 hover:bg-muted"
                        onClick={(e) => handleItemClick(item, e)}
                      >
                        {item.imageurl ? (
                          <img
                            src={item.imageurl}
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
                          <h4 className="text-sm font-medium">{item.title}</h4>
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
    </>
  );
}
