"use client";

import { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Box,
  Users,
  ArrowRight,
  Check,
  Star,
  Laptop,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router";

// Custom hook for detecting mobile viewport
const useMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if the screen is mobile-sized
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Clean up event listener
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};

// Custom hook for detecting screen size
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
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

// Animated Text Shuffling Component for Business Models
const AnimatedModelShuffle = () => {
  const models = ["Service", "Appointment", "Rental", "Event", "Subscription"];
  const [currentModel, setCurrentModel] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentModel((prev) => (prev + 1) % models.length);
        setIsAnimating(false);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-10 overflow-hidden inline-block">
      <span
        className={`absolute transition-all duration-500 font-medium text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70 ${
          isAnimating ? "opacity-0 -translate-y-8" : "opacity-100 translate-y-0"
        }`}
        aria-hidden={isAnimating}
      >
        {models[currentModel]}
      </span>
      <span className="opacity-0 invisible" aria-live="polite">
        {models[currentModel]}
      </span>
    </div>
  );
};

// Booking Types Component for Hero Section
const BookingTypesShowcase = () => {
  const bookingTypes = [
    {
      title: "Appointment-Based",
      icon: <Calendar className="h-10 w-10 text-primary" />,
      description: "Perfect for salons, consultants & therapists",
      color: "bg-muted/50 border-border",
    },
    {
      title: "Rental-Based",
      icon: <Box className="h-10 w-10 text-primary" />,
      description: "Ideal for equipment, space & vehicle rentals",
      color: "bg-muted/50 border-border",
    },
    {
      title: "Event-Based",
      icon: <Users className="h-10 w-10 text-primary" />,
      description: "Great for classes, workshops & group sessions",
      color: "bg-muted/50 border-border",
    },
  ];

  const [currentType, setCurrentType] = useState(0);
  const { isMobile } = useScreenSize();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentType((prev) => (prev + 1) % bookingTypes.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative mx-auto flex flex-col items-center justify-center w-full max-w-md">
        {bookingTypes.map((type, index) => (
          <div
            key={index}
            className={`w-full rounded-2xl p-4 sm:p-6 border shadow-sm border-border bg-primary/10
              transition-all duration-700 transform absolute
              ${
                currentType === index
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-95 z-0"
              }`}
            aria-hidden={currentType !== index}
          >
            <div className="flex flex-col items-center text-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 rounded-full bg-background/80 backdrop-blur-sm border">
                {type.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-medium">{type.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {type.description}
              </p>
              <Button
                variant="outline"
                className="mt-1 sm:mt-2 w-full transition-all rounded-full text-sm"
                size={isMobile ? "sm" : "default"}
              >
                Learn More
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Animated Feature Section
const AnimatedFeatureSection = ({
  title,
  description,
  items,
  icon,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const { isMobile } = useScreenSize();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <Card
      ref={ref}
      className={`flex flex-col h-full transition-all duration-1000 transform backdrop-blur-sm rounded-2xl shadow-sm ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <CardHeader className={isMobile ? "p-4" : ""}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">{icon}</div>
          <CardTitle
            className={`${isMobile ? "text-base" : "text-lg"} font-medium`}
          >
            {title}
          </CardTitle>
        </div>
        <CardDescription className={isMobile ? "text-xs" : ""}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className={`flex-1 ${isMobile ? "p-4 pt-0" : ""}`}>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <div className="mr-2 mt-1 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary">
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
              </div>
              <span className={`${isMobile ? "text-xs" : "text-sm"}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className={isMobile ? "p-4" : ""}>
        <Button
          variant="outline"
          className="w-full rounded-full"
          size={isMobile ? "sm" : "default"}
        >
          Learn More
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function LandingPage({ onClose }: { onClose: () => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const { isMobile: isSmallMobile, isTablet } = useScreenSize();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("isDialogOpen", JSON.stringify(isDialogOpen));
    if (!isDialogOpen) {
      onClose(); // Notify parent
    }
  }, [isDialogOpen, onClose]);

  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-[90vw] max-h-[95vh] p-0 rounded-2xl overflow-hidden">
          <ScrollArea className="max-h-[95vh]">
            <div className="sticky top-0 z-50 flex items-center justify-between p-3 sm:p-4 backdrop-blur-lg bg-background/80 border-b">
              <div className="flex items-center">
                <h3 className="text-base sm:text-lg font-semibold">SERVINY</h3>
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

            <div className="flex flex-col">
              {/* Hero Section */}
              <section className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-gradient-to-b from-background to-muted/50">
                <div className="container px-3 sm:px-4 md:px-6">
                  <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
                    <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                      <div className="space-y-3 sm:space-y-4">
                        {!isSmallMobile && (
                          <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                            <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-primary/10 text-primary hover:bg-primary/20 w-fit text-xs sm:text-sm">
                              All-in-one platform
                            </Badge>
                            <Button
                              variant="outline"
                              className="transition-all hover:bg-primary/10 rounded-full w-fit text-xs sm:text-sm"
                              size={isSmallMobile ? "sm" : "default"}
                            >
                              Watch a Demo
                            </Button>
                          </div>
                        )}

                        <h1
                          className={cn(
                            "font-medium tracking-tight",
                            isSmallMobile
                              ? "text-xl"
                              : isTablet
                              ? "text-2xl sm:text-3xl"
                              : "text-3xl sm:text-4xl xl:text-5xl/none"
                          )}
                        >
                          Empower Your <AnimatedModelShuffle /> Service Business
                          with SERVINY
                        </h1>

                        <p
                          className={cn(
                            "max-w-[600px] text-muted-foreground",
                            isSmallMobile
                              ? "text-sm"
                              : isTablet
                              ? "text-base"
                              : "md:text-lg"
                          )}
                        >
                          The complete platform for service providers,
                          freelancers, and businesses to showcase, book, and
                          manage services.
                        </p>

                        <Button
                          size={isSmallMobile ? "sm" : "lg"}
                          className="gap-1.5 transition transform hover:translate-x-1 rounded-full w-fit mt-1 sm:mt-2"
                                            onClick={() => setIsDialogOpen(false)}
                        >

                          Get Started{" "}
                          <ArrowRight
                            className={`h-${isSmallMobile ? "3" : "4"} w-${
                              isSmallMobile ? "3" : "4"
                            }`}
                          />
                        </Button>
                      </div>
                    </div>

                    <div className="w-full h-full min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] flex items-center justify-center">
                      <BookingTypesShowcase />
                    </div>
                  </div>
                </div>
              </section>

              {/* Features Section */}
              <section
                id="models"
                className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-muted/30 overflow-hidden"
              >
                <div className="container px-3 sm:px-4 md:px-6">
                  <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-6 sm:mb-8 md:mb-12">
                    <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs sm:text-sm">
                      Features & Integration Models
                    </Badge>
                    <h2
                      className={cn(
                        "font-medium tracking-tight",
                        isSmallMobile
                          ? "text-xl"
                          : isTablet
                          ? "text-2xl"
                          : "text-3xl sm:text-4xl"
                      )}
                    >
                      Everything You Need To Succeed
                    </h2>
                    <p
                      className={cn(
                        "max-w-[900px] text-muted-foreground",
                        isSmallMobile
                          ? "text-sm"
                          : isTablet
                          ? "text-base"
                          : "md:text-lg"
                      )}
                    >
                      SERVINY combines powerful features with flexible
                      integration options.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
                    <AnimatedFeatureSection
                      title="Personalized Portfolio"
                      description="Showcase your services and build client trust"
                      items={[
                        "Customizable service listings",
                        "Portfolio gallery for your work",
                        "Professional bio and team profiles",
                        "Client testimonials and reviews",
                      ]}
                      icon={
                        <Star
                          className={`h-${isSmallMobile ? "4" : "5"} w-${
                            isSmallMobile ? "4" : "5"
                          } text-primary`}
                        />
                      }
                      delay={0}
                    />

                    <AnimatedFeatureSection
                      title="Standard Version"
                      description="Register on our platform and make it your own"
                      items={[
                        "Quick setup with no technical knowledge",
                        "Fully hosted and maintained by SERVINY",
                        "Customizable to match your brand",
                        "Access to all platform features",
                      ]}
                      icon={
                        <Box
                          className={`h-${isSmallMobile ? "4" : "5"} w-${
                            isSmallMobile ? "4" : "5"
                          } text-primary`}
                        />
                      }
                      delay={200}
                    />

                    <AnimatedFeatureSection
                      title="Integrated Version"
                      description="Embed our system into your existing website"
                      items={[
                        "Seamless integration with your website",
                        "Fully personalized for your business",
                        "Simple iframe implementation",
                        "Maintain your brand identity",
                      ]}
                      icon={
                        <Laptop
                          className={`h-${isSmallMobile ? "4" : "5"} w-${
                            isSmallMobile ? "4" : "5"
                          } text-primary`}
                        />
                      }
                      delay={400}
                    />
                  </div>

                  <div className="mt-6 sm:mt-8 md:mt-12 flex justify-center">
                    <Button
                      size={isSmallMobile ? "default" : "lg"}
                      className="gap-1.5 transition transform hover:translate-y-1 rounded-full"
                      onClick={() => navigate("/booktypes")}
                    >
                      Explore All Features{" "}
                      <ArrowRight
                        className={`h-${isSmallMobile ? "3.5" : "4"} w-${
                          isSmallMobile ? "3.5" : "4"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <footer className="border-t py-4 sm:py-6 bg-background">
                <div className="container px-3 sm:px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  <p className="text-center text-xs sm:text-sm leading-loose text-muted-foreground sm:text-left">
                    © {new Date().getFullYear()} SERVINY. All rights reserved.
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

          <AlertDialogFooter className="sticky bottom-0 border-t bg-background/80 backdrop-blur-lg p-3 sm:p-4">
            <AlertDialogCancel className="rounded-full text-xs sm:text-sm h-8 sm:h-10">
              Close Preview
            </AlertDialogCancel>
            <AlertDialogAction className="rounded-full text-xs sm:text-sm h-8 sm:h-10">
              Get Started
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
