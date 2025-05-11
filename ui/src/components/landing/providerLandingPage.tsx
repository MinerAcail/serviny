import { useState, useEffect } from "react";
import { ArrowRight, X, ImageIcon, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { GET_PROVIDER } from "../serviceProviders/profile";
import { useQuery } from "@apollo/client";
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
const AnimatedFeatureShuffle = ({ profession }: { profession: string[] }) => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentFeature((prev) => (prev + 1) % profession.length);
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
        {profession[currentFeature]}
      </span>
      <span className="opacity-0 invisible" aria-live="polite">
        {profession[currentFeature]}
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

// Gallery Showcase Component
const ServiceProviderToolsShowcase = ({
  serviceId,
}: {
  serviceId?: string;
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
///
export type provider = {
  getProvider: {
    id: string;
    dpfile: string;
    name: string;
    number: string;
    email: string;
    profession: string[];

    aboutMe: string;
    location: string;
    createdAt: string;
  };
};

export default function ServiceLandingPage({
  onClose,
  serviceId,
}: {
  onClose: () => void;
  serviceId: string;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [isDialogAbout, setDialogAbout] = useState(false);
  const { isMobile, isTablet } = useScreenSize();

  const { data, loading, error } = useQuery<provider>(GET_PROVIDER, {
    variables: { serviceId },
  });
  const { isMatch } = useCheckAuthId(serviceId);

  useEffect(() => {
    localStorage.setItem("isDialogOpen", JSON.stringify(isDialogOpen));
    if (!isDialogOpen) {
      onClose(); // Notify parent
    }
  }, [isDialogOpen, onClose]);

  const provider = data?.getProvider;

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[80vw] max-h-[95vh] p-0 rounded-2xl overflow-hidden">
        {loading && !data?.getProvider ? (
          <SpectaclesLoading />
        ) : (
          <>
            {error ? (
              <SpectaclesError />
            ) : (
              <ScrollArea className="max-h-[95vh]">
             

                <div className="sticky top-0 z-50 flex items-center justify-between p-3 sm:p-4 backdrop-blur-lg bg-background/80 border-b">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-1/3 sm:h-9 sm:w-9 rounded-full overflow-hidden border border-emerald-200">
                      <img
                        src={provider?.dpfile || "/default-profile.png"}
                        alt={`${provider?.name || "Provider"} Profile`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-accent-foreground truncate max-w-[150px] sm:max-w-none">
                      {provider?.name}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-full h-7 w-7 sm:h-8 sm:w-8"
                  >
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </div>

                <div className="flex flex-col relative z-10">
                  {/* Hero Section */}
                  <section className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-b from-background  dark:from-background dark:to-emerald-950/10">
                    <div className="container px-3 sm:px-4 md:px-6">
                      <div className="grid gap-6 sm:gap-8 md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px] lg:gap-12">
                        <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                          <div className="space-y-3 sm:space-y-4">
                            <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                              <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-primary/20 text-primary w-fit text-sm sm:text-sm">
                                {Array.isArray(provider?.profession)
                                  ? provider?.profession[0]
                                  : provider?.profession}
                              </Badge>
                            </div>

                            <h1
                              className={cn(
                                "font-medium tracking-tight",
                                isMobile
                                  ? "text-xl"
                                  : isTablet
                                  ? "text-2xl sm:text-3xl"
                                  : "text-3xl sm:text-4xl xl:text-5xl/none"
                              )}
                            >
                              {provider?.name} Expert In{" "}
                              {Array.isArray(provider?.profession) ? (
                                <AnimatedFeatureShuffle
                                  profession={provider?.profession}
                                />
                              ) : (
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-400">
                                  {provider?.profession}
                                </span>
                              )}
                            </h1>

                            <p
                              onClick={() => setDialogAbout(true)}
                              className={cn(
                                "max-w-[600px] text-accent-foreground/85 cursor-pointer",
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
                                className="mt-2 text-muted-foreground"
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
                                  <DialogContent
                                    className={`  rounded-md p-7 w-full text-secondary backdrop-blur-lg 
                                                `}
                                  >
                                    <DialogHeader>
                                      <DialogTitle className="text-black">About Me</DialogTitle>
                                    </DialogHeader>

                                    <DialogDescription   className={cn(
                                " text-accent-foreground/85 cursor-pointer max-h-96 overflow-y-auto",
                                isMobile
                                  ? "text-sm"
                                  : isTablet
                                  ? "text-base"
                                  : "md:text-lg"
                              )}>
                                      {provider?.aboutMe}
                                    </DialogDescription>
                                    <DialogFooter>
                                      <Button
                                        variant="default"
                                        onClick={() => setDialogAbout(false)}
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
                                className="gap-1.5 transition transform hover:translate-x-1 rounded-full w-fit mt-1 sm:mt-2 from-cyan-400 to-teal-500"
                                onClick={() => setIsDialogOpen(false)}
                              >
                                View All
                                <ArrowRight
                                  className={`h-${isMobile ? "3" : "4"} w-${
                                    isMobile ? "3" : "4"
                                  }`}
                                />
                              </Button>
                              {isMatch && (
                                <Link to={`/dbp`}>
                                  <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
                                    <LayoutDashboard className="h-4 w-4" />
                                    Dashboards
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                        <div 
                        
                        className="w-full h-full min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] flex items-center justify-center">
                          <ServiceProviderToolsShowcase serviceId={serviceId} />
                        </div>
                      </div>

                      {/* Appointment Booking System - Moved outside the grid for better responsiveness */}
                      <div className="mt-8 sm:mt-10 md:mt-12">
                        <LandingAppointmentBookingSystem
                          serviceId={serviceId}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Features Section */}
                  <section
                    id="features"
                    className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-cyan-300/20 rounded-md dark:bg-emerald-950/5 overflow-hidden"
                  >
                    <div className="container px-3 sm:px-4 md:px-6">
                      <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-6 sm:mb-8 md:mb-12">
                        <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-cyan-950 text-white dark:bg-emerald-950/30 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-950/50 text-xs sm:text-sm">
                          Comprehensive Services
                        </Badge>
                        <h2
                          className={cn(
                            "font-medium tracking-tight",
                            isMobile
                              ? "text-xl"
                              : isTablet
                              ? "text-2xl"
                              : "text-3xl sm:text-4xl"
                          )}
                        >
                          Expert Care For All Your Needs
                        </h2>
                        <p
                          className={cn(
                            "max-w-[900px] text-muted-foreground",
                            isMobile
                              ? "text-sm"
                              : isTablet
                              ? "text-base"
                              : "md:text-lg"
                          )}
                        >
                          From routine check-ups to advanced procedures, we
                          provide comprehensive care with a gentle touch.
                        </p>
                      </div>

                      <AnimatedFeatureSection serviceId={serviceId} delay={0} />
                    </div>
                  </section>

                  {/* Footer */}
                  <footer className="border-t py-4 sm:py-6 bg-background">
                    <div className="container px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                      <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground sm:text-left">
                        © {new Date().getFullYear()} {provider?.name}. All
                        rights reserved.
                      </p>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Button
                          variant="link"
                          className="text-xs sm:text-sm font-medium h-8 px-2 sm:px-4"
                        >
                          Terms
                        </Button>
                        <Button
                          variant="link"
                          className="text-xs sm:text-sm font-medium h-8 px-2 sm:px-4"
                        >
                          Privacy
                        </Button>
                        <Button
                          variant="link"
                          className="text-xs sm:text-sm font-medium h-8 px-2 sm:px-4"
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
