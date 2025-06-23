import { useState, useEffect, useRef } from "react";
import {
  Store,
  Truck,
  Users,
  ArrowRight,
  Check,
  Laptop,
  X,
  ShoppingCart,
  Package,
  MapPin,
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
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

const AnimatedRouteMap = () => {
  const [hoveredRegion, setHoveredRegion] = useState(null);

  // Animation variants for routes
  const routeVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: 1.5 + i * 0.3,
          duration: 2,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 3,
        },
        opacity: {
          delay: 1.5 + i * 0.3,
          duration: 0.5,
        },
      },
    }),
  };

  // City animation variants
  const cityVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: 0.5 + i * 0.1,
        duration: 0.5,
        type: "spring",
        stiffness: 200,
      },
    }),
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
    },
  };

  // Pulse animation for Accra
  const pulseVariants = {
    animate: {
      scale: [1, 1.5, 1],
      opacity: [0.3, 0.1, 0.3],
      transition: {
        duration: 2,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  };

  const routes = [
    { path: "M 965 865 Q 820 720 750 650 T 585 580", id: "route1" },
    { path: "M 965 865 Q 700 850 450 780 T 240 765", id: "route2" },
    { path: "M 965 865 Q 850 870 720 860 T 580 865", id: "route3" },
    { path: "M 965 865 Q 1150 780 1280 650 T 1360 515", id: "route4" },
    { path: "M 965 865 Q 980 700 970 550 T 960 365", id: "route5" },
    { path: "M 585 580 Q 480 500 380 420 T 235 365", id: "route6" },
    { path: "M 960 365 Q 820 362 680 368 T 580 365", id: "route7" },
  ];

  const cities = [
    { name: "ACCRA", subtitle: "CAPITAL", x: 965, y: 865, isCapital: true },
    { name: "KUMASI", x: 585, y: 580 },
    { name: "TAMALE", x: 960, y: 365 },
    { name: "CAPE COAST", x: 580, y: 865 },
    { name: "TAKORADI", x: 240, y: 765 },
    { name: "HO", x: 1360, y: 365 },
    { name: "KOFORIDUA", x: 960, y: 580 },
    { name: "BOLGATANGA", x: 580, y: 210 },
    { name: "WA", x: 235, y: 210 },
    { name: "SUNYANI", x: 235, y: 580 },
  ];

  return (
    <motion.svg
      viewBox="0 0 1600 1000"
      className="fixed inset-0 w-full h-full -z-10"
      style={{
        filter: "blur(0.8px)",
        minHeight: "100vh",
        minWidth: "100vw",
      }}
      preserveAspectRatio="xMidYMid slice"
      initial="hidden"
      animate="visible"
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#2a3f5f", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "#34495e", stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: "#2c3e50", stopOpacity: 1 }}
          />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <motion.polygon
            points="0 0, 10 3.5, 0 7"
            fill="#64b5f6"
            animate={{ fill: ["#64b5f6", "#00fff0", "#64b5f6"] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        </marker>
      </defs>

      {/* Background */}
      <rect width="1600" height="1000" fill="url(#bgGradient)" />

      {/* Animated Routes */}
      <g stroke="#64b5f6" strokeWidth="2.5" fill="none" filter="url(#glow)">
        {routes.map((route, i) => (
          <motion.path
            key={route.id}
            d={route.path}
            markerEnd="url(#arrowhead)"
            custom={i}
            initial="hidden"
            animate="visible"
            variants={routeVariants}
            strokeDasharray="10 5"
          />
        ))}
      </g>

      {/* Animated Cities */}
      <g fontFamily="Arial, sans-serif">
        {cities.map((city, i) => (
          <motion.g
            key={city.name}
            custom={i}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
            variants={cityVariants}
            style={{ cursor: "pointer" }}
          >
            {city.isCapital && (
              <motion.circle
                cx={city.x}
                cy={city.y}
                r="30"
                fill="#ffd54f"
                opacity="0.3"
                variants={pulseVariants}
                animate="animate"
              />
            )}
            <rect
              x={city.x - 80}
              y={city.y - 25}
              width="160"
              height="40"
              rx="20"
              fill={city.isCapital ? "#ffd54f" : "#ffa726"}
            />
            <text
              x={city.x}
              y={city.y - 5}
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill="#2c3e50"
            >
              {city.name}
            </text>
            {city.subtitle && (
              <text
                x={city.x}
                y={city.y + 5}
                textAnchor="middle"
                fontSize="11"
                fill="#2c3e50"
              >
                {city.subtitle}
              </text>
            )}
          </motion.g>
        ))}
      </g>

      {/* Moving particles along routes */}
      {routes.map((route, i) => (
        <motion.circle
          key={`particle-${i}`}
          r="4"
          fill="#00fff0"
          filter="url(#glow)"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 4,
            delay: i * 0.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          style={{
            offsetPath: `path('${route.path}')`,
          }}
        />
      ))}
    </motion.svg>
  );
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

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
};

// Animated Text Shuffling Component for Business Models
const AnimatedModelShuffle = () => {
  const models = ["Logistics", "Delivery", "Transportation", "E-commerce"];
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

// Business Solutions Showcase Component
const BusinessSolutionsShowcase = () => {
  const solutions = [
    {
      title: "Logistics Management",
      icon: <Truck className="h-10 w-10 text-primary" />,
      description:
        "Complete delivery and transportation solutions with route optimization",
      color: "bg-muted/50 border-border",
    },
    {
      title: "Delivery Services",
      icon: <MapPin className="h-10 w-10 text-primary" />,
      description: "Streamlined local and long-distance delivery management",
      color: "bg-muted/50 border-border",
    },
    {
      title: "Vendor Connections",
      icon: <Users className="h-10 w-10 text-primary" />,
      description:
        "Connect logistics providers with vendors and businesses efficiently",
      color: "bg-muted/50 border-border",
    },
    {
      title: "E-commerce Integration",
      icon: <Store className="h-10 w-10 text-primary" />,
      description:
        "Integrated online store capabilities for complete business solutions",
      color: "bg-muted/50 border-border",
    },
  ];

  const [currentType, setCurrentType] = useState(0);
  const { isMobile } = useScreenSize();
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentType((prev) => (prev + 1) % solutions.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative mx-auto flex flex-col items-center justify-center w-full max-w-md">
        {solutions.map((solution, index) => (
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
                {solution.icon}
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-white">
                {solution.title}
              </h3>
              <p className=" text-white/70 text-sm sm:text-sm">
                {solution.description}
              </p>
              <Button
                variant="outline"
                className="mt-1 sm:mt-2 w-full transition-all rounded-full text-sm"
                size={isMobile ? "sm" : "default"}
                onClick={() => {
                  // navigate to the respective solution page
                  // navigate(`/solutions/${solution.title.toLowerCase().replace(/ /g, '-')}`);
                  navigate(`/login`);
                }}
              >
                Create Account
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Animated Feature Section
interface AnimatedFeatureSectionProps {
  title: string;
  description: string;
  items: string[];
  icon: React.ReactNode;
  delay?: number;
}

const AnimatedFeatureSection = ({
  title,
  description,
  items,
  icon,
  delay = 0,
}: AnimatedFeatureSectionProps) => {
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
          {items.map((item: string, index: number) => (
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
    // localStorage.setItem("isServiceDialogOpen", JSON.stringify(isDialogOpen));
    if (!isDialogOpen) {
      onClose();
    }
  }, [isDialogOpen, onClose]);

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogContent className="max-w-[95vw] sm:max-w-[90vw] max-h-[95vh] p-0 rounded-2xl overflow-hidden">
        <AnimatedRouteMap />

        <ScrollArea className="max-h-[95vh]">
          <div className="sticky top-0 z-50 flex items-center justify-between p-3 sm:p-4 backdrop-blur-lg bg-background/20 border-b">
            <div className="flex items-center">
              <h3 className="text-base text-white sm:text-lg font-semibold">
                WinneMart
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

          <div className="flex flex-col">
            {/* Hero Section */}
            <section className="w-full py-6 sm:py-8 md:py-12 lg:py-10 bg-background/10 backdrop-blur-sm rounded-b-2xl shadow-lg">
              <div className="container px-3 sm:px-4 md:px-6">
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
                  <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      {!isSmallMobile && (
                        <div className="flex flex-col xs:flex-row sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                          <Badge className="inline-flex rounded-full px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-primary/10 text-white hover:bg-primary/20 w-fit text-xs sm:text-sm">
                            Logistics Solution Platform
                          </Badge>
                          <Button
                            variant="outline"
                            className="transition-all hover:bg-primary/10 rounded-full w-fit text-xs sm:text-sm"
                            size={isSmallMobile ? "sm" : "default"}
                            onClick={()=>navigate("tutorial")}
                          >
                            Watch Demo
                          </Button>
                        </div>
                      )}

                      <h1
                        className={cn(
                          "font-medium tracking-tight text-white/70",
                          isSmallMobile
                            ? "text-xl"
                            : isTablet
                            ? "text-2xl sm:text-3xl"
                            : "text-3xl sm:text-4xl xl:text-5xl/none"
                        )}
                      >
                        Power Your <AnimatedModelShuffle /> Business with
                        WinneMart
                      </h1>

                      <p
                        className={cn(
                          "max-w-[600px] text-white ",
                          isSmallMobile
                            ? "text-sm"
                            : isTablet
                            ? "text-base"
                            : "md:text-lg"
                        )}
                      >
                        We help businesses manage deliveries, plan routes,
                        connect with vendors, and sell online, making operations
                        smoother and more efficient.
                      </p>
                    </div>
                  </div>

                  <div className="w-full  h-full min-h-[250px] xs:min-h-[280px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px] flex flex-col items-center justify-center">
                    <div className="flex w-full   items-center justify-between lg:mt-20 mb-12">
                      <Button
                        variant="outline"
                        className="transition-all lg:hidden hover:bg-primary/10 bg-slate-400 rounded-full w-fit text-xs sm:text-sm"
                        size={isSmallMobile ? "sm" : "default"}
                            onClick={()=>navigate("tutorial")}

                      >
                        Watch Demo
                      </Button>
                        <div className="flex gap-2 w-full justify-end">
                        <Button
                          variant="outline"
                          className="transition-all  bg-slate-400  hover:bg-primary/10 rounded-full w-fit text-xs sm:text-sm"
                          size={isSmallMobile ? "sm" : "default"}
                          onClick={() => navigate("/all")}
                        >
                          Browse Services
                        </Button>
                        </div>
                    </div>
                    <BusinessSolutionsShowcase />
                  </div>
                </div>
              </div>
            </section>

            {/* Features Section */}
            <section
              id="solutions"
              className="w-full py-6 sm:py-8 md:py-12 lg:py-16 bg-muted/30 overflow-hidden"
            >
              <div className="container px-3 sm:px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center mb-6 sm:mb-8 md:mb-12">
                  <Badge className="inline-flex rounded-full text-white px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-primary/10  hover:bg-primary/20 text-xs sm:text-sm">
                    Logistics & Transportation Solutions
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
                    Everything You Need For Logistics Success
                  </h2>
                  <p
                    className={cn(
                      "max-w-[900px]  text-white/90",
                      isSmallMobile
                        ? "text-sm"
                        : isTablet
                        ? "text-base"
                        : "md:text-lg"
                    )}
                  >
                    WinneMart provides comprehensive logistics solutions with
                    integrated e-commerce capabilities.
                  </p>
                </div>

                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
                  <AnimatedFeatureSection
                    title="Logistics Management"
                    description="Complete delivery and transportation solutions"
                    items={[
                      "Route mapping and optimization",
                      "Job booking and scheduling",
                      "Real-time delivery tracking",
                      "Fleet management tools",
                    ]}
                    icon={
                      <Truck
                        className={`h-${isSmallMobile ? "4" : "5"} w-${
                          isSmallMobile ? "4" : "5"
                        } text-primary`}
                      />
                    }
                    delay={0}
                  />

                  <AnimatedFeatureSection
                    title="Delivery Services"
                    description="Streamlined local and long-distance deliveries"
                    items={[
                      "Local delivery management",
                      "Long-distance transportation",
                      "Vendor-rider connections",
                      "Efficient logistics operations",
                    ]}
                    icon={
                      <MapPin
                        className={`h-${isSmallMobile ? "4" : "5"} w-${
                          isSmallMobile ? "4" : "5"
                        } text-primary`}
                      />
                    }
                    delay={200}
                  />

                  <AnimatedFeatureSection
                    title="Vendor Connections"
                    description="Connect logistics providers with businesses"
                    items={[
                      "Seamless vendor integration",
                      "Business-rider matching",
                      "Logistics network expansion",
                      "Partnership management",
                    ]}
                    icon={
                      <Users
                        className={`h-${isSmallMobile ? "4" : "5"} w-${
                          isSmallMobile ? "4" : "5"
                        } text-primary`}
                      />
                    }
                    delay={400}
                  />

                  <AnimatedFeatureSection
                    title="E-commerce Integration"
                    description="Integrated online store capabilities"
                    items={[
                      "Online store setup",
                      "Product showcase platform",
                      "Order management system",
                      "Complete business solutions",
                    ]}
                    icon={
                      <Store
                        className={`h-${isSmallMobile ? "4" : "5"} w-${
                          isSmallMobile ? "4" : "5"
                        } text-primary`}
                      />
                    }
                    delay={600}
                  />
                </div>

                <div className="mt-6 sm:mt-8 md:mt-12 flex justify-center">
                  <Button
                    size={isSmallMobile ? "default" : "lg"}
                    className="gap-1.5 transition transform hover:translate-y-1 rounded-full"
                    onClick={() =>
                      navigate("all")
                    }
                  >
                    Explore Created Solutions{" "}
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
                  © {new Date().getFullYear()} WinneMart. All rights reserved.
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

        {/* <AlertDialogFooter className="sticky bottom-0 border-t bg-background/80 backdrop-blur-lg p-3 sm:p-4">
          <AlertDialogCancel className="rounded-full text-xs sm:text-sm h-8 sm:h-10">
            Close Preview
          </AlertDialogCancel>
          <AlertDialogAction className="rounded-full text-xs sm:text-sm h-8 sm:h-10">
            Get Started
          </AlertDialogAction>
        </AlertDialogFooter> */}
      </AlertDialogContent>
    </AlertDialog>
  );
}
