import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { CardPreview } from "./Preview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NavBar from "@/app/navBar";
import { useDeviceType } from "@/hooks/useDeviceType";
import CartSidebar from "../../CartSidebar";
import { useCart } from "@/hooks/CartContext";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ghSim } from "../../ItemGrid";
import { NoItemsFound } from "../../Empty";
import Loading from "../../../ui/loading";
const GET_ALL_CATEGORY_BOX = gql`
  query getAllCategoryBox($query:String) {
    getAllCategoryBox(query:$query) {
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

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrls: string[];
  categories?: string[];
  commission?: string;
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
  const { isDesktop } = useDeviceType();
  const [searchTerm, setSearchTerm] = useState<string>("");

  const { loading, error, data, refetch } = useQuery<{ getAllCategoryBox: Category[] }>(
    GET_ALL_CATEGORY_BOX,
    { variables: { query: searchTerm } } // Initial query with the search term
  );

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const {
    cart,
    hostelDetails,
    setHostelDetails,
    removeFromCart,
    addToCart,
    placeOrder,
  } = useCart();

  // Function to handle add to cart for a product
  const handleAddToCart = (event: React.MouseEvent, product: Product) => {
    // Stop event propagation to prevent opening the CardPreview
    event.stopPropagation();

    // Convert string price to number and prepare product for cart
    const cartItem = {
      id: product.id,
      name: product.name,
      price: parseFloat(product?.commission ?? "0"),
      categories: product.categories || [],
      imageUrls: product.imageUrls,
    };

    // Add the product to cart
    addToCart(cartItem);

    // Show toast notification
    toast.success(`${product.name} added to cart`);
  };
  // Add this function within the ViewCate component
  const handleAddAllToCart = (event: React.MouseEvent, products: Product[]) => {
    // Stop event propagation to prevent opening the CardPreview
    event.stopPropagation();

    // Loop through all products in the category and add each to cart
    products.forEach((product) => {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: parseFloat(product.commission ?? "0"),
        categories: product.categories || [],
        imageUrls: product.imageUrls,
      };

      // Add the product to cart
      addToCart(cartItem);
    });

    // Show toast notification
    toast.success(
      `Added all ${products.length} items from this category to cart`
    );
  };
const handleSearch = (value: string) => {
    setSearchTerm(value);
    refetch({ query: value || "" }); // Ensure the query variable is passed correctly

}

  if (loading)
    return (
     
        <Loading />
    
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

  if (data?.getAllCategoryBox.length === 0) {
    return <NoItemsFound />;
  }

  return (
    <div className="maincontainer mx-auto p-[1px]">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="w-full">
         <div className="mb-5">
         <NavBar onSearch={handleSearch} />
         </div>

          <div className="grid grid-cols-2 pt-14 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {data?.getAllCategoryBox.map(({ categoryBox, products }) => (
              <Card
                key={categoryBox.id}
                className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer mx-1 border-2"
                onClick={() => setSelectedCategory({ categoryBox, products })}
              >
                {/* Food image */}
                <div className="w-full h-48 relative">
                  <img
                    src={
                      categoryBox.imageUrl ||
                      "/placeholder.svg?height=300&width=400"
                    }
                    alt={`${categoryBox.name} category`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-primary text-white px-3 py-1">
                      {products.length} items
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg">
                      {categoryBox.name}
                    </h3>

                    {/* // Then replace the Button element with: */}
                    {products.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 bg-green-200 hover:bg-green-300 rounded-full"
                        onClick={(e) => handleAddAllToCart(e, products)}
                        title={`Add all ${products.length} items to cart`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Product thumbnails */}
                  <div className="flex ml-1 mt-3">
                    {products
                      .filter((product) => product.imageUrls.length > 0)
                      .slice(0, 4)
                      .map((product, index) => (
                        <div key={product.id} className="relative group">
                          <div
                            className="w-8 h-8 rounded-full overflow-hidden border-2 border-white -ml-2 shadow-md relative"
                            style={{ zIndex: 10 - index }}
                          >
                            <img
                              src={
                                product.imageUrls[0] ||
                                "/placeholder.svg?height=40&width=40"
                              }
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Quick add button that appears on hover */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute -bottom-2 -right-2 h-6 w-6 p-0 bg-green-200 hover:bg-green-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            onClick={(e) => handleAddToCart(e, product)}
                            title={`Add ${product.name} to cart`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                    {products.length > 4 && (
                      <div
                        className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white -ml-2 flex items-center justify-center shadow-md"
                        style={{ zIndex: 5 }}
                      >
                        <span className="text-xs font-medium text-gray-600">
                          +{products.length - 4}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Show quick stats */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {cart.filter((item) =>
                        products.some((p) => p.id === item.id)
                      ).length > 0 ? (
                        <span className="flex items-center text-green-600">
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {
                            cart.filter((item) =>
                              products.some((p) => p.id === item.id)
                            ).length
                          }{" "}
                          in cart
                        </span>
                      ) : (
                        "Browse items"
                      )}
                    </span>
                    <span className="text-xs text-gray-500">
                      {products.length > 0
                        ? ` ${ghSim}${products
                            .reduce(
                              (total, product) =>
                                total + parseFloat(product.commission ?? "0"),
                              0
                            )
                            .toLocaleString()}`
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart sidebar */}
        {isDesktop && (
          <div className="w-full h-full lg:w-1/4">
            <div className="sticky h-full top-4">
              <CartSidebar
                cart={cart}
                hostelDetails={hostelDetails}
                setHostelDetails={setHostelDetails}
                removeFromCart={removeFromCart}
                placeOrder={placeOrder}
              />
            </div>
          </div>
        )}

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
            onDeleteItem={(categoryId, itemId) => {
              const updatedProducts = selectedCategory.products.filter(
                (product) => product.id !== itemId
              );
              setSelectedCategory({
                ...selectedCategory,
                products: updatedProducts,
              });
              toast.warning(
                `Deleted item ${itemId} from category ${categoryId}`
              );
              // console.log(`Deleted item ${itemId} from category ${categoryId}`);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ViewCate;
