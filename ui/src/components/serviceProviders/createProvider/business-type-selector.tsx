"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Store,
  Truck,
  Package,
  Building2,
  Info,
  Sparkles,
  Crown,
  Zap,
  Star,
} from "lucide-react";
import { formatPrice } from "@/components/global/formatPrice";

interface Profession {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  category: "ecommerce" | "delivery" | "specialized";
  features?: string[];
  detailedFeatures?: {
    title: string;
    items: string[];
  }[];
  popular?: boolean;
  recommended?: boolean;
  tier: "basic" | "standard" | "enterprise";
}

export default function BusinessTypeSelector() {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [expandedFeatures, setExpandedFeatures] = useState<string | null>(null);

  const professions: Profession[] = [
    
    {
      value: "ecommerce-standard",
      label: "Standard E-commerce",
      description: "Complete solution for growing businesses",
      icon: <Store className="h-5 w-5" />,
      price: 70,
      category: "ecommerce",
      tier: "standard",
      popular: true,
      features: [
        "Full system to manage all products and inventory",
        "Custom website for customers to browse and place orders",
        "Tools and features similar to those used by major e-commerce platforms",
        "Fully integrated buying and selling system",
        "Built-in payment processing for smooth transactions",
        "Personalized shopping experience using machine learning",
        "Automatic connection with existing delivery riders or companies",
        "Smart rider-matching system finds the nearest available rider",
        "Automatic delivery fee calculation and processing",
      ],
    },
    {
      value: "ecommerce-enterprise",
      label: "Enterprise E-commerce",
      description: "Advanced features for large-scale operations",
      icon: <Building2 className="h-5 w-5" />,
      price: 200,
      category: "ecommerce",
      tier: "enterprise",
      features: [
        "Designed for large businesses that operate at scale or handle bulk orders",
        "Includes everything in Standard E-commerce",
        "Advanced logistics and delivery system tailored for enterprise needs",
        "Tools to manage fleets, riders, and delivery schedules",
        "Real-time map tracking for both riders and customers",
        "Live location sharing so customers can see where their orders are",
        "Rider dashboard to manage assigned deliveries and routes",
        "Full visibility and control over the entire delivery process",
        "Supports transport of goods, raw materials, or products between companies",
        "Scalable infrastructure to handle high-volume operations",
      ],
    },
    {
      value: "drop-shipping",
      label: "Drop-Shipping / Pre-Order",
      description: "Perfect for starting your online business",
      icon: <Package className="h-5 w-5" />,
      price: 40,
      category: "ecommerce",
      tier: "basic",
      features: [
        "Ideal for vendors using dropshipping or pre-order business models",
        "Provides a custom website for showcasing and selling products",
        "Full dashboard to manage products, inventory, and orders",
        "Supports secure online payment collection",
        "Generates a unique delivery link for each order",
        "Vendors can share these links with any rider or delivery person",
        "The custom link includes product details and delivery information",
        "No built-in delivery or logistics system provided",
        "Lightweight and flexible, designed for independent fulfillment",
      ],
    },
    {
      value: "delivery-standard",
      label: "Standard Delivery",
      description: "Professional delivery service platform",
      icon: <Truck className="h-5 w-5" />,
      price: 130,
      category: "delivery",
      tier: "standard",
      recommended: true,
      features: [
        "Custom-branded website where users can book delivery services",
        "Dashboard to manage bookings from vendors and customers",
        "Tools to partner and coordinate with multiple vendors",
        "Rider management system (up to 7 riders per delivery company)",
        "Order tracking and assignment for both vendors and riders",
        "Simple interface tailored for small-scale delivery startups",
        "Earnings and payout tracking for riders and the delivery company",
        "Basic analytics dashboard (delivery count, delays, ratings, etc.)",
        "Customer feedback system for rating deliveries and sharing suggestions",
        "Service area mapping to define operational zones",
      ],
    },
    {
      value: "delivery-enterprise",
      label: "Enterprise Delivery",
      description: "Complete logistics management solution",
      icon: <Truck className="h-5 w-5" />,
      price: 450,
      category: "delivery",
      tier: "enterprise",
      detailedFeatures: [
        {
          title: "🚚 Enterprise Delivery Model Features",
          items: [
            "Everything in Standard Delivery, plus:",
            "Advanced logistics system for complete delivery workflow management",
            "Custom branded delivery platform (website + dashboard)",
            "Real-time map tracking for both riders and customers",
            "Automated rider assignment for incoming delivery orders",
            "Bulk rider management — support for unlimited riders",
            "Vendor partnership management tools",
            "Bulk delivery handling for high-volume or inter-company logistics",
            "Comprehensive analytics and reporting (deliveries, performance, vendors, income)",
            "Custom delivery rules — e.g., delivery zones, time-based scheduling, and pricing",
            "Label generation and QR code support for package handling",
            "Multiple admin roles — assign supervisors, dispatchers, and accountants",
            "Enterprise-grade security with detailed access control and monitoring",
          ],
        },
      ],
    },
  ];

  const handleSelect = (value: string, label: string) => {
    setSelectedType(value);
    setSelectedLabel(label);
  };

  const handleDone = () => {
    console.log("Selected business type:", selectedType);
    setOpen(false);
  };

  const toggleFeatures = (value: string) => {
    setExpandedFeatures(expandedFeatures === value ? null : value);
  };

  const renderFeatures = (profession: Profession) => {
    if (profession.detailedFeatures) {
      return (
        <div className="mt-4 space-y-4">
          {profession.detailedFeatures.map((section, index) => (
            <div
              key={index}
              className="backdrop-blur-xl bg-white/30 rounded-2xl p-4 border border-white/20 shadow-lg"
            >
              <h4 className="font-semibold text-sm text-gray-800 mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-gray-600" />
                {section.title}
              </h4>
              <div className="grid gap-2">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-base text-gray-700 leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (profession.features) {
      return (
        <div className="mt-4 backdrop-blur-xl bg-white/30 rounded-2xl p-4 border border-white/20 shadow-lg">
          <div className="grid gap-2">
            {profession.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <Check className="h-3 w-3 mt-0.5 flex-shrink-0 text-gray-600" />
                <p className="text-xs leading-relaxed text-gray-700">
                  {feature}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="backdrop-blur-xl bg-white/70 border-white/30 hover:bg-white/80 transition-all duration-200 shadow-lg"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedLabel ? selectedLabel : "Business Type"}
        </span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-4xl h-[95vh] max-h-[800px] p-0 gap-0 rounded-3xl overflow-hidden backdrop-blur-3xl bg-white/95 border border-white/20 shadow-2xl flex flex-col">
          {/* Fixed Header */}
          <DialogHeader className="px-6 sm:px-8 pt-3 sm:pt-8 pb-4 sm:pb-6 backdrop-blur-xl bg-white/60 border-b border-white/20 flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900 flex items-center justify-center gap-1">
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full backdrop-blur-xl bg-white/40 flex items-center justify-center">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              </div>
              Choose Your Business Model
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 text-xs sm:text-sm mt-1">
              Select the perfect solution tailored to your business needs and
              scale
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs
              defaultValue="ecommerce"
              className="w-full h-full flex flex-col"
            >
              {/* Fixed Tabs */}
              <div className="px-6 sm:px-8 pt-4 sm:pt-6 flex-shrink-0">
                <TabsList className="grid grid-cols-2 mb-4 sm:mb-6 rounded-2xl h-10 sm:h-12 p-1  bg-white/20 border border-white/20 shadow-inner">
                  <TabsTrigger
                    value="ecommerce"
                    className="rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:backdrop-blur-xl data-[state=active]:bg-white/90 data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-white/40 text-gray-600 hover:text-gray-800"
                  >
                    🛍️ E-commerce Solutions
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivery"
                    className="rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:backdrop-blur-xl data-[state=active]:bg-white/90 data-[state=active]:shadow-md data-[state=active]:text-gray-900 data-[state=active]:border data-[state=active]:border-white/40 text-gray-600 hover:text-gray-800"
                  >
                    🚚 Delivery Services
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Scrollable Tab Content */}
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full px-6 sm:px-8">
                  <div className="pb-6">
                    <TabsContent
                      value="ecommerce"
                      className="mt-0 space-y-4 sm:space-y-6"
                    >
                      {professions
                        .filter((p) => p.category === "ecommerce")
                        .map((profession) => (
                          <div key={profession.value} className="space-y-3">
                            <div
                              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-lg ${
                                selectedType === profession.value
                                  ? "border-blue-300/50 bg-blue-50/30 shadow-xl shadow-blue-100/50 scale-[1.02]"
                                  : "border-white/30 bg-white/40 hover:border-white/50 hover:bg-white/50 hover:shadow-xl"
                              }`}
                            >
                              {/* Popular/Recommended Badge */}
                              {profession.popular && (
                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                                  <Badge className="backdrop-blur-xl bg-orange-500/20 text-orange-800 border-orange-200/50 shadow-lg text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Most Popular
                                  </Badge>
                                </div>
                              )}
                              {profession.recommended && (
                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                                  <Badge className="backdrop-blur-xl bg-green-500/20 text-green-800 border-green-200/50 shadow-lg text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Recommended
                                  </Badge>
                                </div>
                              )}

                              <button
                                onClick={() =>
                                  handleSelect(
                                    profession.value,
                                    profession.label
                                  )
                                }
                                className="w-full p-4 sm:p-6 text-left hover:bg-white/20 transition-colors duration-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                                    <div className="p-2 sm:p-3 rounded-2xl backdrop-blur-xl bg-white/50 border border-white/30 shadow-lg">
                                      <div className="text-gray-700">
                                        {profession.icon}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                        <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                                          {profession.label}
                                        </h3>
                                        <Badge className="backdrop-blur-xl bg-gray-500/20 text-gray-700 border-gray-200/50 text-xs flex-shrink-0">
                                          {profession.tier === "basic" &&
                                            "Starter"}
                                          {profession.tier === "standard" &&
                                            "Professional"}
                                          {profession.tier === "enterprise" &&
                                            "Enterprise"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                                        {profession.description}
                                      </p>
                                      <div className="flex items-center gap-4">
                                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                          {formatPrice(profession.price)}
                                          <span className="text-xs sm:text-sm font-normal text-gray-500">
                                            /month
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    {selectedType === profession.value && (
                                      <div className="w-6 h-6 sm:w-8 sm:h-8 backdrop-blur-xl bg-blue-500/80 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Features Section */}
                              {(profession.features ||
                                profession.detailedFeatures) && (
                                <Collapsible
                                  open={expandedFeatures === profession.value}
                                  onOpenChange={() =>
                                    toggleFeatures(profession.value)
                                  }
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-between text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-6 border-t border-white/20 rounded-none hover:bg-white/20 backdrop-blur-xl"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                        <span className="font-medium text-gray-700">
                                          View All Features
                                        </span>
                                      </div>
                                      {expandedFeatures === profession.value ? (
                                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                    {renderFeatures(profession)}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          </div>
                        ))}
                    </TabsContent>

                    <TabsContent
                      value="delivery"
                      className="mt-0 space-y-4 sm:space-y-6"
                    >
                      {professions
                        .filter((p) => p.category === "delivery")
                        .map((profession) => (
                          <div key={profession.value} className="space-y-3">
                            <div
                              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-xl shadow-lg ${
                                selectedType === profession.value
                                  ? "border-blue-300/50 bg-blue-50/30 shadow-xl shadow-blue-100/50 scale-[1.02]"
                                  : "border-white/30 bg-white/40 hover:border-white/50 hover:bg-white/50 hover:shadow-xl"
                              }`}
                            >
                              {/* Popular/Recommended Badge */}
                              {profession.popular && (
                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                                  <Badge className="backdrop-blur-xl bg-orange-500/20 text-orange-800 border-orange-200/50 shadow-lg text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Most Popular
                                  </Badge>
                                </div>
                              )}
                              {profession.recommended && (
                                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 z-10">
                                  <Badge className="backdrop-blur-xl bg-green-500/20 text-green-800 border-green-200/50 shadow-lg text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Recommended
                                  </Badge>
                                </div>
                              )}

                              <button
                                onClick={() =>
                                  handleSelect(
                                    profession.value,
                                    profession.label
                                  )
                                }
                                className="w-full p-4 sm:p-6 text-left hover:bg-white/20 transition-colors duration-200"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                                    <div className="p-2 sm:p-3 rounded-2xl backdrop-blur-xl bg-white/50 border border-white/30 shadow-lg">
                                      <div className="text-gray-700">
                                        {profession.icon}
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 sm:gap-3 mb-2">
                                        <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                                          {profession.label}
                                        </h3>
                                        <Badge className="backdrop-blur-xl bg-gray-500/20 text-gray-700 border-gray-200/50 text-xs flex-shrink-0">
                                          {profession.tier === "basic" &&
                                            "Starter"}
                                          {profession.tier === "standard" &&
                                            "Professional"}
                                          {profession.tier === "enterprise" &&
                                            "Enterprise"}
                                        </Badge>
                                      </div>
                                      <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                                        {profession.description}
                                      </p>
                                      <div className="flex items-center gap-4">
                                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                                          {formatPrice(profession.price)}
                                          <span className="text-xs sm:text-sm font-normal text-gray-500">
                                            /month
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                    {selectedType === profession.value && (
                                      <div className="w-6 h-6 sm:w-8 sm:h-8 backdrop-blur-xl bg-blue-500/80 rounded-full flex items-center justify-center shadow-lg">
                                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </button>

                              {/* Features Section */}
                              {(profession.features ||
                                profession.detailedFeatures) && (
                                <Collapsible
                                  open={expandedFeatures === profession.value}
                                  onOpenChange={() =>
                                    toggleFeatures(profession.value)
                                  }
                                >
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-between text-xs sm:text-sm h-10 sm:h-12 px-4 sm:px-6 border-t border-white/20 rounded-none hover:bg-white/20 backdrop-blur-xl"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                        <span className="font-medium text-gray-700">
                                          View All Features
                                        </span>
                                      </div>
                                      {expandedFeatures === profession.value ? (
                                        <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                      ) : (
                                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                                      )}
                                    </Button>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                                    {renderFeatures(profession)}
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  </div>
                </ScrollArea>
              </div>
            </Tabs>
          </div>

          {/* Fixed Footer */}
          <DialogFooter className="flex justify-between p-4 sm:p-8 border-t border-white/20 backdrop-blur-xl bg-white/60 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-2xl px-6 sm:px-8 py-2 sm:py-3 backdrop-blur-xl bg-white/50 border-white/30 hover:bg-white/70 text-gray-700 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={!selectedType}
              className="rounded-2xl px-6 sm:px-8 py-2 sm:py-3 backdrop-blur-xl bg-blue-500/80 hover:bg-blue-600/80 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border-0 text-sm"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
