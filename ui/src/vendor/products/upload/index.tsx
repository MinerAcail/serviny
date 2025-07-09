import { useState } from "react";
import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import type { Product } from "./types";

export default function UploadProduct() {
  const [products, setProducts] = useState<Product[]>([]);

  const handleAddProduct = (product: Product) => {
    setProducts([...products, product]);
  };

  return (
    <div>
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
         
          <ProductForm onAddProduct={handleAddProduct} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <ProductList />
        </div>
      </div>
    </div>
  );
}

  {/* <h1 className="text-3xl font-bold mb-8 text-center text-gray-800"> */}
    {/* Product Management */}
  {/* </h1> */}