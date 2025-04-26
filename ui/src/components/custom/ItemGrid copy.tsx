import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Item } from "@/hooks/CartContext.tsx";
import { useQuery, gql } from "@apollo/client";
import { Product } from "@/app/vendors/upload/types";
import { Badge } from "../ui/badge";
import { Plus } from "lucide-react";

// Currency symbol for Ghana Cedis
export const ghSim = "GH¢";

// GraphQL query for unavailable periods
const GET_UNAVAILABLE_PERIODS = gql`
  query GetAllUnavailablePeriods {
    getAllUnavailablePeriods {
      id
      day
      endTime
      startTime
      VendorId
    }
  }
`;

interface UnavailablePeriod {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  VendorId: string;
}

interface ItemGridProps {
  filteredItems: Item[];
  addToCart: (item: Item) => void;
  onItemSelect: (item: Item) => void;
  className?: string;
}

// Helper function to check if current time is within a time range
const isTimeInRange = (startTime: string, endTime: string): boolean => {
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const currentTimeInMinutes = currentHours * 60 + currentMinutes;
  const startTimeInMinutes = startHours * 60 + startMinutes;
  const endTimeInMinutes = endHours * 60 + endMinutes;

  return (
    currentTimeInMinutes >= startTimeInMinutes &&
    currentTimeInMinutes <= endTimeInMinutes
  );
};

// Helper function to get current day name
const getCurrentDayName = (): string => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date().getDay()];
};

const ItemCard = memo(
  ({
    item,
    onAddToCart,
    onItemSelect,
    isAvailable,
  }: {
    item: Item;
    onAddToCart: () => void;
    onItemSelect: (e: React.MouseEvent) => void;
    isAvailable: boolean;
  }) => (
    <Card className="hover:shadow-xl transition-all duration-300">
      <CardContent
        onClick={isAvailable ? onItemSelect : undefined}
        className="p-4 text-center cursor-pointer"
      >
        <div className=" overflow-hidden rounded-lg mb-4">
          <img
            src={
              Array.isArray(item?.imageUrls) && item.imageUrls.length > 0
                ? item.imageUrls[0]
                : "/placeholder-image.jpg"
            }
            alt={item.name}
            className={`w-full h-40 object-cover transition-transform hover:scale-105 duration-300 ${
              !isAvailable ? "opacity-60" : ""
            }`}
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder-image.jpg";
            }}
          />
        </div>

        <h3 className="font-bold text-lg truncate" title={item.name}>
          {item.name}
        </h3>
        <p className="text-muted-foreground mb-2 font-medium">
          {ghSim} {Number(item.commission).toFixed(2)}
        </p>
      </CardContent>
      <CardContent className="text-center p-4 pt-0">
        {isAvailable ? (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            className="w-full"
            variant="secondary"
          >
            Add to Cart
          </Button>
        ) : (
          <Button
            disabled
            className="w-full opacity-100 cursor-not-allowed"
            variant="outline"
          >
            Not available
          </Button>
        )}
      </CardContent>
    </Card>
  )
);

interface CategoryBox {
  id: string;
  name: string;
  imageUrl: string;
}

interface Category {
  categoryBox: CategoryBox;
  products: Product[];
}
const GET_ALL_CATEGORY_BOX = gql`
  query getAllCategoryBox($query: String) {
    getAllCategoryBox(query: $query) {
      categoryBox {
        id
        name
        imageUrl
      }
      products {
        id
        name
        price
        imageUrls
        categories
        commission
      }
    }
  }
`;

const ItemGrid: React.FC<ItemGridProps> = ({
  filteredItems,
  addToCart,
  className,
  onItemSelect,
}) => {
  const { data, loading, error } = useQuery(GET_UNAVAILABLE_PERIODS);
  const { data: categoryData } = useQuery<{ getAllCategoryBox: Category[] }>(
    GET_ALL_CATEGORY_BOX
  );
  const [unavailablePeriods, setUnavailablePeriods] = useState<
    UnavailablePeriod[]
  >([]);

  useEffect(() => {
    if (data?.getAllUnavailablePeriods) {
      setUnavailablePeriods(data.getAllUnavailablePeriods);
    }
  }, [data]);

  const vendorUnavailablePeriodsMap = useMemo(() => {
    return unavailablePeriods.reduce((acc, period) => {
      if (!acc[period.VendorId]) acc[period.VendorId] = [];
      acc[period.VendorId].push(period);
      return acc;
    }, {} as Record<string, UnavailablePeriod[]>);
  }, [unavailablePeriods]);

  const isItemAvailable = useCallback(
    (item: Item): boolean => {
      const currentDay = getCurrentDayName();
      const vendorUnavailablePeriods = item.VendorId
        ? vendorUnavailablePeriodsMap[item.VendorId] || []
        : [];
      return !vendorUnavailablePeriods.some(
        (period) =>
          period.day === currentDay &&
          isTimeInRange(period.startTime, period.endTime)
      );
    },
    [vendorUnavailablePeriodsMap]
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        Loading availability information...
      </div>
    );
  }

  if (error) {
    console.error("Error loading availability data:", error);
  }

  const categoriesForInsertion = categoryData?.getAllCategoryBox || [];
  const categoryInsertionInterval = 6; // Insert category after every 6 items

  const renderItemsWithCategories = () => {
    const itemsAndCategories: React.ReactNode[] = [];
    let categoryIndex = 0;

    filteredItems.forEach((item, index) => {
      // Add item card
      itemsAndCategories.push(
        <ItemCard
          key={`item-${item.id || "no-id"}-${index}`}
          item={item}
          onAddToCart={() => addToCart(item)}
          onItemSelect={(e) => {
            e.stopPropagation();
            onItemSelect(item);
          }}
          isAvailable={isItemAvailable(item)}
        />
      );

      // Insert category section
      if (
        (index + 1) % categoryInsertionInterval === 0 &&
        categoryIndex < categoriesForInsertion.length
      ) {
        const isSmallScreen = window.innerWidth < 768; // Check screen size
        const categoriesToShow = isSmallScreen
          ? [categoriesForInsertion[categoryIndex]]
          : categoriesForInsertion.slice(categoryIndex, categoryIndex + 3);

        itemsAndCategories.push(
          <div
            key={`category-section-${categoryIndex}`}
            className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 my-4"
          >
            {categoriesToShow.map((category, colIndex) => (
              <Card
                key={`category-${category.categoryBox.id}-col-${colIndex}`}
                className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer border-2"
              >
                <div className="w-full h-36 md:h-72 relative">
                  <img
                    src={
                      category.categoryBox.imageUrl ||
                      "/placeholder.svg?height=300&width=400"
                    }
                    alt={`${category.categoryBox.name} category`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-white px-3 py-1">
                      {category.products.length} items
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg">
                    {category.categoryBox.name}
                  </h3>
                  {category.products.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 bg-green-200 hover:bg-green-300 rounded-full"
                      title={`Add all ${category.products.length} items to cart`}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        );

        categoryIndex += isSmallScreen ? 1 : 3; // Move index accordingly
      }
    });

    return itemsAndCategories;
  };

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 ${
        className || ""
      }`}
    >
      {filteredItems.length > 0 ? (
        renderItemsWithCategories()
      ) : (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">No items found</p>
        </div>
      )}
    </div>
  );
};

export default ItemGrid;
