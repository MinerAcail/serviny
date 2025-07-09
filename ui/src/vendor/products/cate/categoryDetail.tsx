import { useNavigate, useParams, useSearchParams } from "react-router";
import { gql, useQuery } from "@apollo/client";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ProductCard, ProductDetailDialog } from "@/vendor/AllProducts";
import { Product } from "./product-categories";
import { getImageUrl } from "@/components/global/formatPrice";

const GET_PRODUCTS_BY_CATEGORY = gql`
  query GetProductsByCategory($categoryID: String!) {
    getProductsByCategory(categoryId: $categoryID) {
      categoryBox {
        id
        name
        imageUrl
        state
        itemsIds
        vendorId
        createdAt
        updatedAt
      }
      products {
        id
        name
        price
        state
        categories
        imageUrls
        itemsType
        description
        VendorId
        createdAt
        updatedAt
      }
    }
  }
`;

export default function CategoryDetailPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  const { loading, error, data, refetch } = useQuery(GET_PRODUCTS_BY_CATEGORY, {
    variables: { categoryID: categoryId },
    skip: !categoryId,
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading category...</span>
        </div>
      </div>
    );
  }

  if (error || !data?.getProductsByCategory) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12 text-red-500">
          Error loading category: {error?.message || "Data not found"}
        </div>
      </div>
    );
  }

  const { categoryBox, products } = data.getProductsByCategory;

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-14">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button onClick={() => navigate(-1)} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Categories
        </Button>

        <div className="flex items-center gap-4">
          {categoryBox.imageUrl && (
            <img
              src={getImageUrl(categoryBox.imageUrl)}
              alt={categoryBox.name}
              width={60}
              height={60}
              className="object-contain rounded-lg"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{categoryBox.name}</h1>
            <p className="text-muted-foreground">
              {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found in this category.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product: Product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleProductClick}
            />
          ))}
        </div>
      )}

      {/* Product Detail Dialog */}
      {selectedProduct && (
        <ProductDetailDialog
          product={selectedProduct}
          open={!!selectedProduct}
          onOpenChange={(open: boolean) => !open && handleDialogClose()}
          vendorId={serviceId || ""}
          refetch={() => refetch()}
        />
      )}
    </div>
  );
}
