import { useRef, useState, useEffect } from "react";
import {  useQuery } from "@apollo/client";
import { Check } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
// import { Button } from "../ui/button";
import { GET_PRICE_CARDS } from "../HOME/pandp/Price";
import { useScreenSize } from "@/components/GLOBAL/format";
import { Button } from "@/components/ui/button";
interface Price {
  id: string;
  label: string;
  value: string;
}

interface Amenity {
  id: string;
  text: string;
}

interface PriceCard {
  id: string;
  title: string;
  description: string;
}

export interface FullCard {
  card: PriceCard;
  prices: Price[];
  amenities: Amenity[];
}
export interface FullCards {
  getpriceCardsinformation: {
    card: PriceCard;
    prices: Price[];
    amenities: Amenity[];
  };
}
interface AnimatedFeatureSectionProps {
  delay?: number;
  serviceId: string;

}

const AnimatedFeatureSection = ({
    delay = 0,
    serviceId,
 
  }: AnimatedFeatureSectionProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const ref = useRef(null);
    const { isMobile, isTablet } = useScreenSize();
  
    // Setup our own Apollo query that we'll refetch on visibility
    const { loading, error, data, refetch } = useQuery(GET_PRICE_CARDS, {
      variables: { serviceId },
      skip: !isVisible, // Don't fetch until visible
      notifyOnNetworkStatusChange: true,
    });
  
    // Use either our fetched data or the provided props
    // const isLoading = loading || (!hasLoaded && LoadPrice);
    // const hasError = error || (!hasLoaded && PriceError);
    const priceCards = (data?.getpriceCardsinformation || []) as FullCard[];
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // If we already loaded once, trigger a refetch when coming into view again
            if (hasLoaded) {
              refetch();
            }
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
    }, [refetch, hasLoaded]);
  
    // Update hasLoaded state when data changes
    useEffect(() => {
      if (data && isVisible) {
        setHasLoaded(true);
      }
    }, [data, isVisible]);
  
    // Loading state
    if (loading) {
      return (
        <div ref={ref} className="flex items-center justify-center p-8 border rounded-lg bg-gray-50">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-64 bg-gray-200 rounded mb-6 mx-auto"></div>
            <div className="grid grid-cols-1 gap-4 w-full max-w-md mx-auto">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      );
    }
  
    // Error state
    if (error) {
      return (
        <div ref={ref} className="p-8 border rounded-lg bg-red-50">
          <div className="text-center text-red-600">
            <p className="font-medium mb-2">Error loading price data</p>
            <p className="text-sm">{error?.message || "Failed to fetch pricing information"}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }
  
    return (
      <div className="space-y-6" ref={ref}>
        {/* Display each price card individually */}
        {priceCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {priceCards.map((fullCard, index) => (
              <Card
                key={fullCard.card.id || index}
                className={`flex pb-10 flex-col h-full transition-all duration-1000 transform backdrop-blur-sm rounded-2xl shadow-sm ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                }`}
                style={{ transitionDelay: `${delay + index * 100}ms` }}
              >
                <CardHeader
                  className={`${isMobile ? "p-4" : isTablet ? "p-5" : "p-6"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-cyan-300/10 dark:bg-emerald-950/30">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle
                      className={`${
                        isMobile ? "text-base" : isTablet ? "text-lg" : "text-xl"
                      } font-medium`}
                    >
                      {fullCard.card.title}
                    </CardTitle>
                  </div>
                  <CardDescription className={isMobile ? "text-xs" : "text-sm"}>
                    {fullCard.card.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent
                  className={`flex-1  ${
                    isMobile ? "p-4 pt-0" : isTablet ? "p-5 pt-0" : "p-6 pt-0"
                  }`}
                >
                  {/* Prices */}
                  {fullCard.prices && fullCard.prices.length > 0 && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Price Options</h3>
                      <ul className="space-y-2">
                        {fullCard.prices.map((price) => (
                          <li
                            key={price.id}
                            className="text-sm flex justify-between p-2 border rounded-lg"
                          >
                            <span>{price.label || "Standard"}</span>
                            <span className="font-medium">${price.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
  
                  {/* Amenities */}
                  {fullCard.amenities && fullCard.amenities.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Includes</h3>
                      <ul className="space-y-2">
                        {fullCard.amenities.map((amenity) => (
                          <li
                            key={amenity.id}
                            className="text-sm flex items-start"
                          >
                            <div className="mr-2 mt-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600">
                              <Check className="h-2 w-2 text-white" />
                            </div>
                            <span>{amenity.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
                
               
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-lg">
            No pricing information available
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4 mx-auto block"
            >
              Refresh Pricing
            </Button>
          </div>
        )}
        
        {priceCards.length > 0 && isVisible && (
          <div className="text-center mt-6">
            <Button 
              variant="outline"
              onClick={() => refetch()}
              className="bg-emerald-50 hover:bg-emerald-100"
              size="sm"
            >
              Refresh Pricing
            </Button>
          </div>
        )}
      </div>
    );
  };
  

export default AnimatedFeatureSection;