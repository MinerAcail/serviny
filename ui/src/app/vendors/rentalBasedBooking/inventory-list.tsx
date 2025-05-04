import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Star } from "lucide-react";
import * as lucideIcons from "lucide-react";
import { useAuth } from "@/middleware/context/authContext";
import { useQuery, gql } from "@apollo/client";

// Define the GraphQL query properly
export const GET_RENTAL_ITEMS = gql`
  query getRentalItems($serviceId: String) {
    getRentalItems(serviceId: $serviceId) {
      category {
        id
        name
        icon
        updatedAt
      }
      inventories {
        id
        name
        description
        price
        available
        imageUrl
        rating
        reviewCount
        updatedAt
      }
    }
  }
`;

// Type definitions
export interface Category {
  id: string;
  name: string;
  icon: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  updatedAt: string;
}

export interface RentalItemData {
  category: Category;
  inventories: InventoryItem[];
}

export function InventoryList() {
  const { user } = useAuth();
  const serviceId = user?.id;
  const [activeTab, setActiveTab] = useState("");
  const [categoryGroups, setCategoryGroups] = useState<Record<string, RentalItemData[]>>({});
  
  // Use the GraphQL query
  const { loading, error, data } = useQuery(GET_RENTAL_ITEMS, {
    variables: { serviceId },
    skip: !serviceId,
  });

  // Process data when it loads
  useEffect(() => {
    if (data?.getRentalItems) {
      // Group items by category ID
      const groups: Record<string, RentalItemData[]> = {};
      
      data.getRentalItems.forEach((item: RentalItemData) => {
        const categoryId = item.category.id;
        if (!groups[categoryId]) {
          groups[categoryId] = [];
        }
        groups[categoryId].push(item);
      });
      
      setCategoryGroups(groups);
      
      // Set active tab to first category if not already set
      if (!activeTab && Object.keys(groups).length > 0) {
        setActiveTab(Object.keys(groups)[0]);
      }
    }
  }, [data, activeTab]);

  // If there's no data yet, show loading state
  if (loading) return <div>Loading inventory items...</div>;
  if (error) return <div>Error loading inventory: {error.message}</div>;
  
  // Get unique categories to render tabs
  const categories = Object.values(categoryGroups).map(group => group[0].category);

  const renderInventoryItems = (categoryId: string) => {
    const items = categoryGroups[categoryId]?.flatMap(group => group.inventories) || [];
    
    return items.map((item) => (
      <Card key={item.id} className="overflow-hidden">
        <div className="relative h-48 w-full">
          <img 
            src={item.imageUrl || "/placeholder.svg?height=200&width=300"} 
            alt={item.name} 
            className="w-full h-full object-cover" 
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg py-1.5">
                Currently Unavailable
              </Badge>
            </div>
          )}
        </div>
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <Badge variant="outline" className="flex items-center">
              <Star className="h-3 w-3 mr-1 fill-current" />
              {item.rating?.toFixed(1) || "N/A"}
            </Badge>
          </div>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="font-bold text-lg">${item.price} / day</p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button className="w-full" disabled={!item.available}>
            {item.available ? "Select" : "Unavailable"}
          </Button>
        </CardFooter>
      </Card>
    ));
  };

  // Return fallback UI if no categories exist
  if (categories.length === 0) {
    return (
      <div className="text-center p-8">
        <h3 className="text-xl font-medium mb-2">No inventory items found</h3>
        <p className="text-muted-foreground">Add items to your inventory to see them here.</p>
      </div>
    );
  }

  // Get the icon component for a category
  const getCategoryIcon = (iconName: string) => {
    const IconComponent = lucideIcons[iconName as keyof typeof lucideIcons] || Package;
          /* @ts-expect-error: IconComponent is dynamically imported and may not have proper type inference */

    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid grid-cols-${Math.min(categories.length, 4)} mb-4`}>
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
              {getCategoryIcon(category.icon)}
              <span className="hidden sm:inline">{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {renderInventoryItems(category.id)}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}