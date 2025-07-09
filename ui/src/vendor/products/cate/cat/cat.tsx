import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { CardPreview } from "./Preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const GET_ALL_CATEGORY_BOX = gql`
  query getAllCategoryBox {
    getAllCategoryBox {
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
      }
    }
  }
`;

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrls: string[];
}

interface CategoryBox {
  id: string;
  name: string;
  imageUrl: string;
}

interface Category {
  categoryBox: CategoryBox;
  products: Product[];
}

const ViewCate = () => {
  const { loading, error, data } = useQuery<{ getAllCategoryBox: Category[] }>(
    GET_ALL_CATEGORY_BOX
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">
          <p className="font-semibold">Error loading categories</p>
          <p className="mt-1 text-sm">{error.message}</p>
        </div>
      </div>
    );

  return (
    <div className="container mx-auto py-4 px-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data?.getAllCategoryBox.map(({ categoryBox, products }) => (
          <Card
            key={categoryBox.id}
            className="overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-102 cursor-pointer"
            onClick={() => setSelectedCategory({ categoryBox, products })}
          >
            {/* Food image - smaller height but still prominent */}
            <div className="w-full h-32 relative">
              <img
                src={
                  categoryBox.imageUrl ||
                  "/placeholder.svg?height=200&width=300"
                }
                alt={`Food prepared with ${categoryBox.name}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary text-white text-xs">
                  {products.length}
                </Badge>
              </div>
            </div>

            <div className="p-2">
              <h3 className="font-medium text-sm mb-2">{categoryBox.name}</h3>

              <div className="flex ml-1">
                {products
                  .filter((product) => product.imageUrls.length > 0)
                  .slice(0, 5)
                  .map((product, index) => (
                    <div
                      key={product.id}
                      className="w-6 h-6 rounded-full overflow-hidden border border-white -ml-1 shadow-sm relative"
                      style={{ zIndex: 10 - index }}
                    >
                      <img
                        src={
                          product.imageUrls[0] ||
                          "/placeholder.svg?height=30&width=30"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {/* <div className="absolute inset-0 bg-white bg-opacity-20 backdrop-blur-sm"></div> */}
                    </div>
                  ))}

                {products.length > 5 && (
                  <div
                    className="w-6 h-6 rounded-full bg-gray-100 border border-white -ml-1 flex items-center justify-center shadow-sm"
                    style={{ zIndex: 5 }}
                  >
                    <span className="text-xs font-medium text-gray-500">
                      +{products.length - 5}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedCategory && (
        <CardPreview
          isOpen
          category={{
            id: selectedCategory.categoryBox.id,
            name: selectedCategory.categoryBox.name,
            description: "",
            imageUrl: selectedCategory.categoryBox.imageUrl,
            items: selectedCategory.products.map((p) => ({
              ...p,
              imageUrl: p.imageUrls[0] || "",
              description: "",
            })),
          }}
          onClose={() => setSelectedCategory(null)}
          onDeleteItem={(categoryId, itemId) =>
            console.log(`Delete item ${itemId} from category ${categoryId}`)
          }
        />
      )}
    </div>
  );
};

export default ViewCate;
