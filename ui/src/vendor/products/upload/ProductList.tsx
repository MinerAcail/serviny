// import type { Product } from "./types";
import { Badge } from "@/components/ui/badge";
import type { Product } from "./types";
import { gql, useMutation, useQuery } from "@apollo/client";
import { X } from "lucide-react";
import { toast } from "sonner";
import { getImageUrl } from "@/components/global/formatPrice";

const GET_NEW_ADDED_PRODUCTS = gql`
  query getNewAddedProducts {
    getNewAddedProducts {
      id
      name
      price
      state
      categories
      imageUrls
    }
  }
`;
const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;
export default function ProductList() {
  const { loading, error, data, refetch } = useQuery<{
    getNewAddedProducts: Product[];
  }>(GET_NEW_ADDED_PRODUCTS);
  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onCompleted: () => refetch(), // Refresh product list after deletion
  });
  const handleDelete = async (id: string) => {
    try {
      await deleteProduct({ variables: { id } });
      toast.success("Product deleted successfully!");
    } catch (error) {
      toast.error("Cannot delete product");
      console.error("Error deleting product:", error);
    }
  };

  // console.log(data);

  if (loading)
    return (
      <p className="text-gray-500 text-center py-8">Loading products...</p>
    );
  if (error)
    return (
      <p className="text-red-500 text-center py-8">Error: {error.message}</p>
    );

  return (
    <div className="h-screen flex flex-col">
      <h2 className="text-2xl font-semibold mb-2 text-gray-700">
        Product List
      </h2>
      <div className="flex-1 overflow-y-auto">
        {data?.getNewAddedProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No products added yet.
          </p>
        ) : (
          <ul className="space-y-6">
            {data?.getNewAddedProducts.map((product) => (
              <li
                key={product.id}
                className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1  transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 p-4">
                    {product.imageUrls?.length > 0 ? (
                      <img
                        src={getImageUrl(product.imageUrls[0])}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3 p-4">
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                    <p className="text-gray-600 mb-2">
                      Price: ${product.price}
                    </p>
                    <p className="text-gray-600 mb-2">State: {product.state}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {product.categories.map((category, index) => (
                        <Badge key={index} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    {product?.imageUrls?.length > 1 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {product.imageUrls.slice(1).map((image, index) => (
                          <img
                            key={index}
                            src={getImageUrl(image) || "/placeholder.svg"}
                            alt={`${product.name} - ${index + 2}`}
                            width={80}
                            height={80}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
