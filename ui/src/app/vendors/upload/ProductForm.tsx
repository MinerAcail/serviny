import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { gql, useMutation } from "@apollo/client";


const ADD_PRODUCT = gql`
 mutation updateProductByVendor(
    $input: ProductInputUpdate!
  ) {
    craeteProductByVendor(input: $input) {
      id
      name
      price
      createdAt
      updatedAt
    }
  }
`;

export default function ProductForm() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const [VendorUpload, { loading, error }] = useMutation(ADD_PRODUCT, {
    refetchQueries: ["getNewAddedProducts"], // Refresh product list after adding
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await VendorUpload({
      variables: {
        input: {
          name,
          price,
        },
      },
    });

    resetForm();
  };

  const resetForm = () => {
    setName("");
    setPrice("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Product Name</Label>
        <Input
          id="name"
          placeholder="Enter product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          placeholder="Enter price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adding..." : "Add Product"}
      </Button>
      {error && <p className="text-red-500">{error.message}</p>}
    </form>
  );
}
