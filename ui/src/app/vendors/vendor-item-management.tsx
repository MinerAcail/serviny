import { useEffect, useState } from "react";
import { Edit, Save, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
// import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { gql, useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";
import { ghSim } from "@/components/custom/ItemGrid";

const GET_VENDOR_PRODUCTS = gql`
  query getVendorProducts {
    getVendorProducts{
      id
      name
      price
      imageUrls
      state
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation updateProductByVendor(
    $productId: String!
    $input: ProductInputUpdate!
  ) {
    updateProductByVendor(productId: $productId, input: $input) {
      id
      name
      price
      state
      categories
      imageUrls
      VendorId
      createdAt
      updatedAt
    }
  }
`;

export default function VendorItemManagement() {
  const [items, setItems] = useState<
    {
      id: string;
      name: string;
      price: number;
      image: string;
      isActive: boolean;
    }[]
  >([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    price: "",
  });
  const isMobile = useIsMobile();
//   const { toast } = useToast();
  const { data, loading, error } = useQuery(GET_VENDOR_PRODUCTS);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);

  useEffect(() => {
    if (data?.getVendorProducts) {
      setItems(
        data.getVendorProducts.map(
          (product: {
            id: string;
            name: string;
            price: string;
            imageUrls: string[];
            state: string;
          }) => ({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price),
            image: product.imageUrls?.[0] || "/placeholder.svg",
            isActive: product.state === "ACTIVE",
          })
        )
      );
    }
  }, [data]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const handleEdit = (item: (typeof items)[0]) => {
    setEditingId(item.id);
    setEditValues({
      name: item.name,
      price: item.price.toString(),
    });
  };

  const handleSave = async (id: string) => {
    try {
      await updateProduct({
        variables: {
          productId: id,
          input: {
            name: editValues.name,
            price: editValues.price,
          },
        },
      });

      setItems(
        items.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              name: editValues.name,
              price: parseFloat(editValues.price),
            };
          }
          return item;
        })
      );
      setEditingId(null);
      
      toast("Your product has been updated successfully.");
    } catch (err) {
      console.error("Error updating product:", err);
      toast.error("There was an error updating your product.")
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const toggleActive = async (id: string) => {
    const itemToUpdate = items.find(item => item.id === id);
    if (!itemToUpdate) return;
    
    const newState = !itemToUpdate.isActive;
    
    try {
      await updateProduct({
        variables: {
          productId: id,
          input: {
            state: newState ? "ACTIVE" : "INACTIVE"
          },
        },
      });
      
      setItems(
        items.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              isActive: newState,
            };
          }
          return item;
        })
      );
      
      toast( `Product ${newState ? "activated" : "deactivated"}`);
    } catch (err) {
      console.error("Error updating product state:", err);
      toast.error("There was an error updating your product status")
    }
  };

  if (isMobile) {
    return (
      <Card className="my-20">
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>Manage your inventory</CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <div className="flex-1">
                      {editingId === item.id ? (
                        <Input
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              name: e.target.value,
                            })
                          }
                          className="mb-2"
                        />
                      ) : (
                        <h3 className="font-medium">{item.name}</h3>
                      )}

                      {editingId === item.id ? (
                        <Input
                          type="number"
                          value={editValues.price}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              price: e.target.value,
                            })
                          }
                          className="mb-2"
                          step="0.01"
                        />
                      ) : (
                        <p className="text-lg font-bold">{ghSim}{item.price.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={() => toggleActive(item.id)}
                        className="data-[state=checked]:bg-primary"
                      />
                      <Badge
                        variant={item.isActive ? "default" : "secondary"}
                        className="h-6"
                      >
                        {item.isActive ? "ACTIVE" : "INACTIVE"}
                      </Badge>
                    </div>

                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(item.id)}>
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendor Item Management</CardTitle>
        <CardDescription>Manage your product inventory, prices, and availability status</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <img src={item.image} alt={item.name} className="h-12 w-12 rounded-md object-cover" />
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input 
                      value={editValues.name} 
                      onChange={(e) => setEditValues({ ...editValues, name: e.target.value })} 
                    />
                  ) : (
                    item.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === item.id ? (
                    <Input
                      type="number"
                      value={editValues.price}
                      onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                      step="0.01"
                    />
                  ) : (
                    `$${item.price.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch checked={item.isActive} onCheckedChange={() => toggleActive(item.id)} />
                    <Badge variant={item.isActive ? "default" : "secondary"}>{item.isActive ? "ACTIVE" : "INACTIVE"}</Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === item.id ? (
                    <div className="flex justify-end gap-2">
                      <Button size="sm" onClick={() => handleSave(item.id)}>
                        <Save className="h-4 w-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}