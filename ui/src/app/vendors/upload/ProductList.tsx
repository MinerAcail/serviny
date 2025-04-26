import { ghSim } from "@/components/custom/ItemGrid";
import type { Product } from "./types";
import { gql, useMutation, useQuery } from "@apollo/client";
import { X } from "lucide-react";
import { toast } from "sonner";

const GET_NEW_ADDED_PRODUCTS = gql`
  query getNewAddedProducts {
    getNewAddedProducts {
      id
      name
      price
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
    onCompleted: () => refetch(),
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

  if (loading)
    return <p className="text-gray-500 text-center py-8">Loading products...</p>;
  if (error)
    return <p className="text-red-500 text-center py-8">Error: {error.message}</p>;

  return (
    <div className="h-screen flex flex-col">
      <h2 className="text-2xl font-semibold mb-2 text-gray-700">Product List</h2>
      <div className="flex-1 overflow-y-auto">
        {data?.getNewAddedProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No products added yet.</p>
        ) : (
          <ul className="space-y-6">
            {data?.getNewAddedProducts.map((product) => (
              <li
                key={product.id}
                className="relative bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-4"
              >
                <button
                  type="button"
                  onClick={() => handleDelete(product.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600">Price: {ghSim}{product.price}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}