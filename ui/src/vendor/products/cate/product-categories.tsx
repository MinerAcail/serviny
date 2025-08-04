import { Link } from "react-router";
import { gql, useQuery } from "@apollo/client";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router";
import { getImageUrl } from "@/components/global/formatPrice";

// GraphQL query for fetching category boxes
const GET_ALL_CATEGORY_BOX = gql`
  query GetAllCategoryBox($query: String,$vendorId:String!) {
    getAllCategoryBox(query: $query,vendorId:$vendorId) {
      categoryBox {
        id
        name
        itemsIds
        imageUrl
        state
        vendorId
        createdAt
        updatedAt
      }
    
    }
  }
`;

// Define types based on your Go structs
export interface CategoryBox {
  id: string;
  name: string;
  imageUrl: string;
  state: string;
  itemsIds: string[];
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  state: string;
  categories: string[];
  imageUrls: string[];
  itemsType: string[];
  description?: string;
  VendorId: string;
  createdAt: string;
  updatedAt: string;
}
export interface Products {
  id: string;
  name: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  itemsType: string[];
  createdAt: string;
  updatedAt: string;
  price: number;
  state: string;
}
export interface ViewCategoryBox {
  categoryBox: CategoryBox;
  products: Product[];
}

export default function ProductCategories() {
  let { serviceId } = useParams<{ serviceId: string }>();
    const localServiceId = localStorage.getItem("serviceId");
  serviceId = serviceId ?? localServiceId ?? "";
  // Fetch category boxes from GraphQL API
  const { loading, error, data } = useQuery(GET_ALL_CATEGORY_BOX, {
        variables: { query: null, vendorId:serviceId },

  });

  // Extract category boxes from the GraphQL response
  const categoryBoxes: ViewCategoryBox[] = data?.getAllCategoryBox || [];

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading categories...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="text-center py-12 text-red-500">
          Error loading categories: {error.message}
        </div>
      </div>
    );
  }

  if (categoryBoxes.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="text-center py-12 text-muted-foreground">
          No categories found.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-4">
        {categoryBoxes.map((categoryBox) => (
          <Link
            key={categoryBox.categoryBox.id}
            to={`/category/${categoryBox.categoryBox.id}?serviceId=${serviceId}`}
            className="group flex flex-col items-center p-4 bg-gray-300 rounded-2xl hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="w-16 h-16 mb-3 flex items-center justify-center">
              {categoryBox.categoryBox.imageUrl ? (
                <img
                  src={getImageUrl(categoryBox.categoryBox.imageUrl)}
                  alt={categoryBox.categoryBox.name}
                  width={60}
                  height={60}
                  className="object-contain rounded-lg"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 text-center leading-tight group-hover:text-gray-900">
              {categoryBox.categoryBox.name}
            </span>
            {/* Optional: Show product count
            <span className="text-xs text-gray-500 mt-1">
              {categoryBox.products.length} item{categoryBox.products.length !== 1 ? 's' : ''}
            </span> */}
          </Link>
        ))}
      </div>
    </div>
  );
}