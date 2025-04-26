import { useState, useCallback } from "react";
import { Store, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { gql, useQuery, useMutation, useLazyQuery } from "@apollo/client";
import { ghSim } from "@/components/custom/ItemGrid";

// GraphQL Queries and Mutations
const GET_ALL_VENDORS = gql`
  query GetAllVendors {
    getAllVendors {
      Vendor {
        id
        name
        dpfile
      }
      items {
        id
        name
        price
        imageUrls
        commission
      }
    }
  }
`;

const GET_PROMO_CODES = gql`
  query getPromoCode($vendorId: String!) {
    getPromoCode(vendorId: $vendorId) {
      id
      vendorId
      promoCode
      discountApplied
    }
  }
`;

const GENERATE_PROMO_CODE = gql`
  mutation GeneratePromoCode($vendorId: String!) {
    generatePromoCode(vendorId: $vendorId) {
      id
      advertiserID
      promoCode
    }
  }
`;

// TypeScript Interfaces
interface VendorItem {
  id: string | null;
  name: string;
  price: string;
  image: string;
  commission: string;
}

interface Vendor {
  id: string | null;
  name: string;
  logo: string;
  items: VendorItem[];
  promoCode?: string;
}

interface VendorData {
  Vendor: {
    id: string | null;
    name: string;
    dpfile?: string;
  };
  items: {
    id: string | null;
    name: string;
    price: string;
    imageUrls?: string[];
    commission: string;
  }[];
}



export function Vendors() {
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorsWithPromoCodes, setVendorsWithPromoCodes] = useState<{
    [key: string]: string;
  }>({});

  // Lazy query for fetching promo codes
  const [fetchPromoCode] = useLazyQuery(GET_PROMO_CODES, {
    onCompleted: (data) => {
      if (data?.getPromoCode && data.getPromoCode.length > 0) {
        const promoCode = data.getPromoCode[0].promoCode;
        setVendorsWithPromoCodes((prev) => ({
          ...prev,
          [data.getPromoCode[0].vendorId]: promoCode,
        }));
      }
    },
    onError: (error) => {
      console.error("Error fetching promo code:", error);
    }
  });

  // Fetch vendors using GraphQL query
  const { 
    loading: vendorsLoading, 
    error: vendorsError, 
    data: vendorsData 
  } = useQuery<{ getAllVendors: VendorData[] }>(GET_ALL_VENDORS, {
    onCompleted: (data) => {
      // Fetch promo codes for each vendor when vendors are loaded
      data.getAllVendors.forEach((vendorData) => {
        const vendorId = vendorData.Vendor?.id;
        if (vendorId) {
          fetchPromoCode({ variables: { vendorId } });
        }
      });
    }
  });

  // Mutation for generating promo codes
  const [generatePromoCodeMutation] = useMutation(GENERATE_PROMO_CODE);

  // Convert GraphQL data to Vendor type
  const allVendors: Vendor[] = vendorsData?.getAllVendors?.map((vendorData) => ({
    id: vendorData.Vendor?.id ?? null,
    name: vendorData.Vendor?.name ?? "",
    logo: vendorData.Vendor?.dpfile ?? "/placeholder.svg",
    items: vendorData.items?.map((item) => ({
      id: item.id ?? null,
      name: item.name ?? "",
      price: item.price ?? "0",
      image: item.imageUrls?.[0] ?? "/placeholder.svg",
      commission: item.commission ?? "",
    })) ?? [],
  })) ?? [];

  // Generate or regenerate promo code for a vendor
  const generateVendorPromoCode = useCallback(
    async (vendorId: string) => {
      try {
        const response = await generatePromoCodeMutation({
          variables: { vendorId },
        });
        
        const newPromoCode = response.data?.generatePromoCode?.promoCode;
        
        if (newPromoCode) {
          setVendorsWithPromoCodes((prev) => ({
            ...prev,
            [vendorId]: newPromoCode,
          }));
          
          toast.success("Promo Code Generated", {
            description: `New promo code created for the vendor`,
          });
        } else {
          // Fallback to fetching existing promo codes
          fetchPromoCode({ variables: { vendorId } });
          
          toast.info("Existing Promo Code", {
            description: "Retrieved an existing promo code",
          });
        }
      } catch  {
        // console.error("Error generating promo code:", error);
        
        toast.error("Promo Code Generation Failed", {
          description: "Unable to generate a new promo code or already exists for this vendor",
        });
        
        // Try fetching existing promo codes if generation fails
        fetchPromoCode({ variables: { vendorId } });
      }
    },
    [generatePromoCodeMutation, fetchPromoCode]
  );

  // Filter vendors based on search term
  const filteredVendors = allVendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle vendor selection
  const handleVendorClick = (vendorId: string) => {
    setSelectedVendor(vendorId);
  };

  // Handle loading and error states
  if (vendorsLoading) return <div>Loading vendors...</div>;
  if (vendorsError) return <div>Error loading vendors: {vendorsError.message}</div>;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredVendors.map((vendor) => (
          <Card
            key={vendor.id}
            className="cursor-pointer transition-all hover:border-primary"
            onClick={() => handleVendorClick(vendor?.id ?? "")}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <img
                  src={vendor.logo || "/placeholder.svg"}
                  alt={vendor.name}
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="flex-grow">
                  <CardTitle className="text-lg">{vendor.name}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    generateVendorPromoCode(vendor.id ?? "");
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {vendorsWithPromoCodes[vendor.id ?? ""] 
                    ? "Regenerate Code" 
                    : "Generate Code"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {vendor.items.length} items
                </span>
                {vendorsWithPromoCodes[vendor.id ?? ""] && (
                  <Badge variant="secondary" className="text-xs">
                    {vendorsWithPromoCodes[vendor.id ?? ""]}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredVendors.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-muted-foreground">
              No vendors found matching your search
            </p>
          </div>
        )}
      </div>

      {/* Items Dialog */}
      <Dialog
        open={selectedVendor !== null}
        onOpenChange={(open) => !open && setSelectedVendor(null)}
      >
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          {selectedVendor && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>
                    {allVendors.find((v) => v.id === selectedVendor)?.name}{" "}
                    Items
                  </DialogTitle>
                </div>
                {vendorsWithPromoCodes[selectedVendor] && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Promo Code:
                    </span>
                    <Badge variant="secondary">
                      {vendorsWithPromoCodes[selectedVendor]}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const vendor = allVendors.find(
                          (v) => v.id === selectedVendor
                        );
                        if (vendor) {
                          generateVendorPromoCode(selectedVendor);
                        }
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                )}
              </DialogHeader>
              <ScrollArea className="h-[60vh] mt-2">
                <div className="grid gap-4">
                  {allVendors
                    .find((v) => v.id === selectedVendor)
                    ?.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b pb-3"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || "/placeholder.svg"}
                            alt={item.name}
                            width={60}
                            height={60}
                            className="rounded-md"
                          />
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                             {ghSim} {item.commission}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}