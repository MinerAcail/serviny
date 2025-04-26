import ProductForm from "./ProductForm";
import ProductList from "./ProductList";
import WorksNav from "@/components/custom/nav";

export default function UploadProduct() {
 

  return (
    <div className="w-full">
     <div className="pb-20">
     <WorksNav />
     </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
         
          <ProductForm />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <ProductList />
        </div>
      </div>
    </div>
  );
}

