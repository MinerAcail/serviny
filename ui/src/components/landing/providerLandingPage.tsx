import { useState, useEffect } from "react";
import { ArrowRight, X, ImageIcon, LayoutDashboard, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GET_PROVIDER } from "../serviceProviders/profile";
import { gql, useQuery } from "@apollo/client";
import { SpectaclesError, SpectaclesLoading } from "../custom/loading";
import { LandingAppointmentBookingSystem } from "../serviceProviders/APPOINTMENT/book";
import { GET_ALL_GALLERY } from "../serviceProviders/updates";
import AnimatedFeatureSection from "./price";
import SocialMediaManager from "../custom/Socials/forms";
import { Link } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useCheckAuthId } from "@/middleware/context/checkID";
import { DeliveryServiceSystemNew } from "../serviceProviders/APPOINTMENT/completeDeliveryOrder";
import { BusinessTypeEnum } from "@/middleware/context/businessType";
import moment from "moment";
// import { GET_PRICE_CARDS } from "../serviceProviders/pandp/Price";

// Custom hook for detecting screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    // Function to update screen size
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({
        width,
        height,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Initial update
    updateScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", updateScreenSize);

    // Clean up event listener
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
};

// Animated Text Shuffling Component for Service Provider Features
const AnimatedFeatureShuffle = ({ categories }: { categories: string[] }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentFeature((prev) => (prev + 1) % categories.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-10 overflow-hidden inline-block">
      <span
        className={`absolute transition-all duration-500 font-medium text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-400 ${
          isAnimating ? "opacity-0 -translate-y-8" : "opacity-100 translate-y-0"
        }`}
        aria-hidden={isAnimating}
      >
        {categories[currentFeature]}
      </span>
      <span className="opacity-0 invisible" aria-live="polite">
        {categories[currentFeature]}
      </span>
    </div>
  );
};

export interface Gallery {
  id: string;
  title: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}
export const GET_ALL_PRODUCT = gql`
   query getAllProducts($vendorId:String){
    getAllProducts(vendorId:$vendorId){
      id
      name
      description
      categories
      imageUrls
      createdAt
      updatedAt
    }
  }
`;
// Gallery Showcase Component
const ServiceProviderToolsShowcase = ({
  serviceId,
  businessType
}: {
  serviceId?: string;
  businessType?: string;

}) => {
  const [galleryItems, setGalleryItems] = useState<Gallery[]>([]);
  const [currentItem, setCurrentItem] = useState(0);
  const { isMobile } = useScreenSize();

  const { loading, error } = useQuery(GET_ALL_GALLERY, {
    variables: {
      serviceId,
    },
    onCompleted: (data) => {
      setGalleryItems(data.getAllGallery);
    },
  });
 

  useEffect(() => {
    if (galleryItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentItem((prev) => (prev + 1) % galleryItems.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [galleryItems]);

  // Display loading state while fetching gallery items
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading gallery...</p>
        </div>
      </div>
    );
  }

  // Display error message if query failed
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Failed to load gallery items</p>
        </div>
      </div>
    );
  }

  // Display empty state if no gallery items
  if (galleryItems.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No gallery items available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center  justify-center">
      <div className="relative mx-auto flex flex-col items-center justify-center w-full max-w-md h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
        {galleryItems.map((item, index) => (
          <div
            key={item.id}
            className={`w-full rounded-2xl p-4 sm:p-6 border shadow-sm border-border bg-emerald-300/20  dark:bg-emerald-950/10
              transition-all duration-700 transform absolute
              ${
                currentItem === index
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-95 z-0"
              }`}
            aria-hidden={currentItem !== index}
          >
            <div className="flex flex-col  items-center text-center gap-3 sm:gap-4">
              {/* Image Preview */}
              <div className="relative w-full h-32 sm:h-40 rounded-lg overflow-hidden">
                <img
                  src={item.imageUrls[0] || "/api/placeholder/400/320"}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h3 className="text-lg sm:text-xl font-medium line-clamp-1">
                {item.title}
              </h3>

              {/* Categories */}
              {item?.categories && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {item?.categories
                    .slice(0, isMobile ? 2 : 3)
                    .map((category, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                      >
                        {category}
                      </span>
                    ))}
                </div>
              )}

              <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                {item.description}
              </p>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute -bottom-7 flex gap-1">
          {galleryItems.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                currentItem === idx
                  ? "bg-emerald-600 w-4"
                  : "bg-muted-foreground/40"
              }`}
              onClick={() => setCurrentItem(idx)}
              aria-label={`View gallery item ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
// VendorProductsToolsShowcase Component for E-commerce
// Define the Product type
type Product = {
  id: string;
  name: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
};

const VendorProductsToolsShowcase = ({
  serviceId,
  businessType
}: {
  serviceId?: string;
  businessType?: string;
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentItem, setCurrentItem] = useState(0);
  const { isMobile } = useScreenSize();

  const { loading, error } = useQuery(GET_ALL_PRODUCT, {
    variables: {
      vendorId: serviceId,
    },
    onCompleted: (data) => {
      setProducts(data.getAllProducts);
    },
  });

  useEffect(() => {
    if (products.length > 0) {
      const interval = setInterval(() => {
        setCurrentItem((prev) => (prev + 1) % products.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [products]);

  // Display loading state while fetching products
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  // Display error message if query failed
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>Failed to load products</p>
        </div>
      </div>
    );
  }

  // Display empty state if no products
  if (products.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No products available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative mx-auto flex flex-col items-center justify-center w-full max-w-md h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
        {products.map((product, index) => (
          <div
            key={product.id}
            className={`w-full rounded-2xl p-4 sm:p-6 border shadow-sm border-border bg-blue-300/20 dark:bg-blue-950/10
              transition-all duration-700 transform absolute
              ${
                currentItem === index
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-95 z-0"
              }`}
            aria-hidden={currentItem !== index}
          >
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
              {/* Product Image */}
              <div className="relative w-full h-32 sm:h-40 rounded-lg overflow-hidden">
                <img
                  src={product.imageUrls?.[0] || "/api/placeholder/400/320"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Product Badge */}
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-500 text-white shadow-lg">
                    Product
                  </span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-medium line-clamp-1">
                {product.name}
              </h3>

              {/* Categories */}
              {product?.categories && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {product?.categories
                    .slice(0, isMobile ? 2 : 3)
                    .map((category, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {category}
                      </span>
                    ))}
                </div>
              )}

              <p className="text-muted-foreground text-xs sm:text-sm line-clamp-2">
                {product.description}
              </p>

              {/* Product Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>Updated {moment(product.updatedAt).fromNow()}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Dots */}
        <div className="absolute -bottom-7 flex gap-1">
          {products.map((_, idx) => (
            <button
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                currentItem === idx
                  ? "bg-blue-600 w-4"
                  : "bg-muted-foreground/40"
              }`}
              onClick={() => setCurrentItem(idx)}
              aria-label={`View product ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
///
export type provider = {
  getProvider: {
    id: string;
    dpfile: string;
    name: string;
    number: string;
    email: string;
    categories: string[];

    aboutMe: string;
    location: string;
    createdAt: string;
  };
};
// Helper function to check if business type is e-commerce
const isEcommerceBusinessType = (businessType: string) => {
  const ecommerceTypes = [
    BusinessTypeEnum.PRE_ORDER,
    BusinessTypeEnum.DROP_SHIPPING,
    BusinessTypeEnum.ECOMMERCE_STANDARD,
    BusinessTypeEnum.ECOMMERCE_ENTERPRISE
  ];
  return ecommerceTypes.includes(businessType);
};
export default function ServiceLandingPage({
  onClose,
  serviceId,
  businessType
}: {
  onClose: () => void;
  serviceId: string;
  businessType: string;

}) {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [isDialogAbout, setDialogAbout] = useState(false);
  const { isMobile, isTablet } = useScreenSize();
  const localServiceId = localStorage.getItem("serviceId");
  serviceId = serviceId || localServiceId || "";
// console.log("Service ID:", serviceId, "Local Service ID:", localServiceId);

  const { data, loading, error } = useQuery<provider>(GET_PROVIDER, {
    variables: { serviceId  },
  });
  const { isMatch } = useCheckAuthId(serviceId);
  //when mount save serviceId in localStorage
  useEffect(() => {
    // Only update localStorage if the URL contains "providers/" (case-insensitive)
    if (window.location.pathname.toLowerCase().includes("providers")) {
      // console.log("Setting serviceId in localStorage:", serviceId);
      localStorage.setItem("serviceId", serviceId);
    }
  }, [serviceId]);

  useEffect(() => {
    localStorage.setItem("isDialogOpen", JSON.stringify(isDialogOpen));
    if (!isDialogOpen) {
      onClose(); // Notify parent
    }
  }, [isDialogOpen, onClose]);

  const provider = data?.getProvider;

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent
        className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[95vh] p-0 rounded-2xl overflow-hidden"
        //  className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[95vh] p-0 rounded-2xl overflow-hidden relative"
      >
        {/* Wallpaper Background with Glass Blur - Properly contained */}
        {provider?.dpfile && (
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat scale-110"
              style={{
                backgroundImage: `url(${provider.dpfile})`,
              }}
            />
            {/* Glass blur overlay */}
            <div className="absolute inset-0 backdrop-blur-xl bg-background/40 dark:bg-background/60" />
            {/* Additional gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background/60 dark:from-background/40 dark:via-background/60 dark:to-background/80" />
          </div>
        )}

        {loading && !data?.getProvider ? (
          <SpectaclesLoading />
        ) : (
          <>
            {error ? (
              <SpectaclesError />
            ) : (
              <ScrollArea className="max-h-[95vh] relative z-10">
                <div className="sticky top-0 z-50 flex items-center justify-between p-3 sm:p-4 backdrop-blur-xl bg-background/60 dark:bg-background/70 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 sm:h-9 sm:w-9 rounded-full overflow-hidden border-2 border-white/20 shadow-lg backdrop-blur-sm bg-white/10">
                      <img
                        src={provider?.dpfile || "/default-profile.png"}
                        alt={`${provider?.name || "Provider"} Profile`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-foreground drop-shadow-sm truncate max-w-[150px] sm:max-w-none">
                      {provider?.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-full h-7 w-7 sm:h-8 sm:w-8 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>

                <div className="flex flex-col relative z-10">
                  {/* Hero Section */}
                  <section className="w-full py-6 sm:py-8 md:py-12 lg:py-16">
                    <div className="container px-3 sm:px-4 md:px-6">
                      <div className="grid gap-6 sm:gap-8 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px] lg:gap-12">
                        <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                              <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm text-foreground border border-white/30 w-fit text-sm sm:text-sm shadow-lg">
                                {Array.isArray(provider?.categories)
                                  ? provider?.categories[0]
                                  : provider?.categories}
                              </Badge>
                            </div>

                            <h1
                              className={cn(
                                "font-medium tracking-tight text-foreground drop-shadow-lg",
                                isMobile
                                  ? "text-xl"
                                  : isTablet
                                  ? "text-2xl sm:text-3xl"
                                  : "text-3xl sm:text-4xl xl:text-5xl/none"
                              )}
                            >
                              {provider?.name} Expert In{" "}
                              {Array.isArray(provider?.categories) ? (
                                <AnimatedFeatureShuffle
                                  categories={provider?.categories}
                                />
                              ) : (
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-400 drop-shadow-sm">
                                  {provider?.categories}
                                </span>
                              )}
                            </h1>

                            <p
                              onClick={() => setDialogAbout(true)}
                              className={cn(
                                "max-w-[600px] text-foreground/90 cursor-pointer drop-shadow-sm",
                                isMobile
                                  ? "text-sm"
                                  : isTablet
                                  ? "text-base"
                                  : "md:text-lg"
                              )}
                            >
                              {provider?.aboutMe?.substring(0, 200)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="link"
                                className="mt-2 text-foreground/80 hover:text-foreground backdrop-blur-sm"
                                onClick={() => setDialogAbout(true)}
                              >
                                Read More
                              </Button>

                              {provider && (
                                <SocialMediaManager
                                  provider={provider}
                                  serviceId={serviceId ?? ""}
                                />
                              )}

                              {/* About Me Dialog */}
                              {isDialogAbout && (
                                <Dialog
                                  open={isDialogAbout}
                                  onOpenChange={setDialogAbout}
                                >
                                  <DialogContent className="rounded-md p-7 w-full backdrop-blur-xl bg-background/90 border border-white/20">
                                    <DialogHeader>
                                      <DialogTitle className="text-foreground">
                                        About Me
                                      </DialogTitle>
                                    </DialogHeader>

                                    <DialogDescription
                                      className={cn(
                                        "text-foreground/85 cursor-pointer max-h-96 overflow-y-auto",
                                        isMobile
                                          ? "text-sm"
                                          : isTablet
                                          ? "text-base"
                                          : "md:text-lg"
                                      )}
                                    >
                                      {provider?.aboutMe}
                                    </DialogDescription>
                                    <DialogFooter>
                                      <Button
                                        variant="default"
                                        onClick={() => setDialogAbout(false)}
                                        className="backdrop-blur-sm bg-primary/80 hover:bg-primary/90"
                                      >
                                        Close
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>

                            <div className="flex justify-between items-center">
                              <Button
                                size={isMobile ? "sm" : "lg"}
                                className="gap-1.5 transition transform hover:translate-x-1 rounded-full w-fit mt-1 sm:mt-2 bg-gradient-to-r from-cyan-400/80 to-teal-500/80 backdrop-blur-sm hover:from-cyan-400/90 hover:to-teal-500/90 shadow-lg border border-white/20"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                Get Started
                                <ArrowRight
                                  className={`h-${isMobile ? "3" : "4"} w-${
                                    isMobile ? "3" : "4"
                                  }`}
                                />
                              </Button>
                              {isMatch && (
                                <Link to={`/dbp`}>
                                  <Button className="gap-2 rounded-full bg-primary/80 hover:bg-primary/90 backdrop-blur-sm border border-white/20 shadow-lg">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboards
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                         {/* Conditional Showcase Component */}
                        <div className="w-full h-full min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] flex items-center justify-center">
                          {isEcommerceBusinessType(businessType) ? (
                            <VendorProductsToolsShowcase 
                              businessType={businessType} 
                              serviceId={serviceId} 
                            />
                          ) : (
                            <ServiceProviderToolsShowcase 
                              businessType={businessType} 
                              serviceId={serviceId} 
                            />
                          )}
                        </div>
                        {/* <div className="w-full h-full min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] flex items-center justify-center">
                          <ServiceProviderToolsShowcase businessType={businessType} serviceId={serviceId} />
                        </div> */}
                      </div>

                      {/* Appointment Booking System - Moved outside the grid for better responsiveness */}
                      <div className="mt-8 sm:mt-10 md:mt-12">
                        <DeliveryServiceSystemNew
                          isDialogOpenMain={false} // This won't be used in non-dialog mode
                          setDialogOpenMain={() => {}} // This won't be used in non-dialog mode
                          withDialog={false}
                          serviceId={serviceId}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Features Section */}
                  <section
                    id="features"
                    className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-white/10 backdrop-blur-sm rounded-md border border-white/20 shadow-lg overflow-hidden"
                  >
                    <div className="container px-3 sm:px-4 md:px-6">
                      <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-6 sm:mb-8 md:mb-12">
                        <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-white/20 backdrop-blur-sm text-foreground border border-white/30 shadow-lg text-xs sm:text-sm">
                          Comprehensive Services
                        </Badge>
                        <h2
                          className={cn(
                            "font-medium tracking-tight text-foreground drop-shadow-lg",
                            isMobile
                              ? "text-xl"
                              : isTablet
                              ? "text-2xl"
                              : "text-3xl sm:text-4xl"
                          )}
                        >
                          Expert For All Your Delivery Needs
                        </h2>
                        
                      </div>

                      <AnimatedFeatureSection serviceId={serviceId} delay={0} />
                    </div>
                  </section>

                  {/* Footer */}
                  <footer className="border-t border-white/20 py-4 sm:py-6 bg-white/5 backdrop-blur-sm">
                    <div className="container px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                      <p className="text-center text-xs sm:text-sm leading-loose text-foreground/70 sm:text-left drop-shadow-sm">
                        © {new Date().getFullYear()} {provider?.name}. All
                        rights reserved.
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                          variant="link"
                          className="text-xs sm:text-sm font-medium h-8 px-2 sm:px-4 text-foreground/80 hover:text-foreground"
                        >
                          Terms
                        </Button>
                        <Button
                          variant="link"
                          className="text-xs sm:text-sm font-medium h-8 px-2 sm:px-4 text-foreground/80 hover:text-foreground"
                        >
                          Privacy
                        </Button>
                        <Button
                          variant="link"
                          className="text-xs sm:text-sm font-medium h-8 px-2 sm:px-4 text-foreground/80 hover:text-foreground"
                        >
                          Contact
                        </Button>
                      </div>
                    </div>
                  </footer>
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
