import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { gql, useQuery } from "@apollo/client";

const GET_ALL_PROMO_CODE = gql`
query GetAllPromoCode {
  getAllPromoCode {
    id
    vendorId
    promoCode
    discountApplied
  }
}
`;

const GET_VENDOR = gql`
  query getSharedVendor($Vendor: String!) {
    getSharedVendor(VendorId: $Vendor) {
      id
      name
      dpfile
    }
  }
`;

// Define the PromoCode type
type PromoCode = {
  id: string;
  vendorId: string;
  promoCode: string;
  discountApplied: string;
};

export function Overview() {
  const { loading: promoLoading, error: promoError, data: promoData } = useQuery(GET_ALL_PROMO_CODE);



  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Quick Actions Card */}
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Badge variant="default">+12% from last month</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">268</div>
                <p className="text-xs text-muted-foreground">
                  Across all student advertisers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Badge variant="default">+18% from last month</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$13,750</div>
                <p className="text-xs text-muted-foreground">
                  Generated through promo codes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Badge variant="outline">8 total</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">75%</div>
                <p className="text-xs text-muted-foreground">
                  6 active in the last 7 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Badge variant="secondary">Trending up</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$51.30</div>
                <p className="text-xs text-muted-foreground">
                  Per successful referral
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Promo Codes Card */}
      <Card className="col-span-full">
        <CardHeader className="pb-2">
          <CardTitle>Your Promo Codes</CardTitle>
          <CardDescription className="hidden sm:block">
            Quick access to your most used promo codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {promoLoading ? (
            <p>Loading promo codes...</p>
          ) : promoError ? (
            <p>Error loading promo codes: {promoError.message}</p>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {promoData?.getAllPromoCode.map((promo: PromoCode) => (
              <PromocodeCard 
                key={promo.id} 
                promoCode={promo.promoCode} 
                discountApplied={promo.discountApplied}
                vendorId={promo.vendorId}
              />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PromocodeCard({ 
  promoCode, 
  discountApplied, 
  vendorId 
}: { 
  promoCode: string, 
  discountApplied: string, 
  vendorId: string 
}) {
  const { loading, error, data } = useQuery(GET_VENDOR, {
    variables: { Vendor: vendorId },
  });

  const copyToClipboard = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          toast.success("Copied to clipboard", {
            description: `Promo code ${code} has been copied.`,
          });
        })
        .catch(() => {
          toast.error("Failed to copy", {
            description: "Could not copy the promo code.",
          });
        });
    } else {
      toast.error("Clipboard not supported");
    }
  };

  if (loading) return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <p>Loading vendor details...</p>
    </Card>
  );

  if (error) return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <p>Error loading vendor: {error.message}</p>
    </Card>
  );

  const vendor = data?.getSharedVendor;

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="p-3 pb-0 flex flex-row items-center space-x-3">
        <Avatar>
          <AvatarImage 
            src={vendor?.dpfile || "/default-avatar.png"} 
            alt={vendor?.name || "Vendor Avatar"} 
          />
          <AvatarFallback>
            {vendor?.name ? vendor.name.charAt(0) : '?'}
          </AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-sm">{discountApplied}</CardTitle>
          <p className="text-xs text-muted-foreground">{vendor?.name || 'Unknown Vendor'}</p>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex items-center justify-between">
          <code className="relative rounded bg-muted px-2 py-1 font-mono text-xs font-semibold">
            {promoCode}
          </code>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => copyToClipboard(promoCode)}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}