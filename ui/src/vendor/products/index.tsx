"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, ChevronsUpDown, Edit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Define the structure of our product based on the GraphQL response
interface Product {
  id: string;
  name: string;
  price: number;
  itemsBought: number;
  VendorId: string;
}

// Define the GraphQL response structure
interface ProductResponse {
  product: {
    id: string;
    name: string;
    price: number;
    VendorId: string;
  };
  ItemSoldCount: number;
}

interface GetAllProductsResponse {
  getAllProductsByAdmin: ProductResponse[];
}

// Define the product state enum
enum ProductState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
  DELETED = "DELETED",
}

// Define the update product input

interface Vendor {
  id: string;
  name: string;
  type: string;
  number: string;
}

export interface  ListVendorsResponse {
  listVendors: Vendor[];
}
const UPDATE_PRODUCT = gql`
  mutation UpdateProductByAdmin(
    $productId: String!
    $input: ProductInputUpdate!
  ) {
    updateProductByAdmin(productId: $productId, input: $input) {
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

// Define the GraphQL query
const GET_ALL_PRODUCTS = gql`
  query GetAllProductsByAdmin {
    getAllProductsByAdmin {
      product {
        id
        name
        price
        VendorId
      }
      ItemSoldCount
    }
  }
`;
export const GET_ALL_VENDORS = gql`
  query listVendors {
    listVendors {
      id
      name
      type
      number
    }
  }
`;
export function Products() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof Product | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // State for product editing
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{
    id: string;
    name: string;
    price: string;
    state: ProductState;
    categories: string[];
    VendorId?: string;
  } | null>(null);

  // Fetch products data using GraphQL with Apollo Client
  const { loading, error, data, refetch } =
    useQuery<GetAllProductsResponse>(GET_ALL_PRODUCTS);
  // Fetch vendors data
  const {
    loading: loadingVendors,
    error: vendorsError,
    data: vendorsData,
  } = useQuery<ListVendorsResponse>(GET_ALL_VENDORS);

  // Setup mutation
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT, {
    onCompleted: () => {
      refetch();
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      console.error("Error updating product:", error);
    },
  });

  // Transform the data to match our Product interface
  const transformedData: Product[] =
    data?.getAllProductsByAdmin.map((item: ProductResponse) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      itemsBought: item.ItemSoldCount || 0, // Default to 0 if null
      VendorId: item.product.VendorId,
    })) || [];

  // Search functionality
  const filteredData = transformedData.filter((product) =>
    Object.values(product).some(
      (value) =>
        value !== null &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sorting functionality
  const handleSort = (column: keyof Product) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply sorting to filtered data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        if (a[sortColumn] < b[sortColumn])
          return sortDirection === "asc" ? -1 : 1;
        if (a[sortColumn] > b[sortColumn])
          return sortDirection === "asc" ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);

  // Selection functionality
  const toggleSelectAll = () => {
    if (selectedProducts.length === currentItems.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(currentItems.map((product) => product.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((productId) => productId !== id)
        : [...prev, id]
    );
  };

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Handle opening the edit dialog
  const handleEditProduct = (product: Product) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      price: product.price.toString(),
      state: ProductState.ACTIVE, // Default state, you may want to fetch the actual state
      categories: [], // Default empty array, you may want to fetch the actual categories
    });
    setIsEditDialogOpen(true);
  };

  // Handle updating a product
  const handleUpdateProduct = () => {
    if (editingProduct) {
      updateProduct({
        variables: {
          productId: editingProduct.id,
          input: {
            name: editingProduct.name,
            price: editingProduct.price,
            state: editingProduct.state,
            categories: editingProduct.categories,
            VendorId: editingProduct.VendorId,
          },
        },
      });
    }
  };
  // Get vendors list
  const vendors = vendorsData?.listVendors || [];
  // Render table header with sort functionality
  const renderTableHeader = (column: keyof Product, label: string) => (
    <TableHead>
      <button
        className="flex items-center space-x-1"
        onClick={() => handleSort(column)}
      >
        <span>{label}</span>
        {sortColumn === column ? (
          sortDirection === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ChevronsUpDown className="h-4 w-4" />
        )}
      </button>
    </TableHead>
  );

  if (loading) {
    return <div className="text-center p-4">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">Error: {error.message}</div>
    );
  }

  return (
    <div className="space-y-4 bg-blue-400 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Rows per page: {itemsPerPage}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[5, 10, 20].map((number) => (
              <DropdownMenuCheckboxItem
                key={number}
                checked={number === itemsPerPage}
                onCheckedChange={() => setItemsPerPage(number)}
              >
                {number} rows
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedProducts.length === currentItems.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              {renderTableHeader("id", "ID")}
              {renderTableHeader("name", "Name")}
              {renderTableHeader("price", "Price")}
              {renderTableHeader("itemsBought", "Items Bought")}
              {renderTableHeader("VendorId", "Vendor")}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>{product.id.slice(0, 5)}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>${product.price}</TableCell>
                  <TableCell>{product.itemsBought}</TableCell>
                  <TableCell>
                    <Badge
                      variant={product.VendorId ? "default" : "secondary"}
                      className="h-6"
                    >
                      {product.VendorId
                        ? product.VendorId.slice(0, 5)
                        : "NOT ADDED"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No products found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Showing {sortedData.length > 0 ? indexOfFirstItem + 1 : 0} to{" "}
            {Math.min(indexOfLastItem, sortedData.length)} of{" "}
            {sortedData.length} results
          </p>
          <p className="text-sm text-gray-500">
            {selectedProducts.length} product(s) selected
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastItem >= sortedData.length}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editingProduct?.name || ""}
                onChange={(e) =>
                  setEditingProduct((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                value={editingProduct?.price || ""}
                onChange={(e) =>
                  setEditingProduct((prev) =>
                    prev ? { ...prev, price: e.target.value } : null
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">
                State
              </Label>
              <Select
                value={editingProduct?.state}
                onValueChange={(value) =>
                  setEditingProduct((prev) =>
                    prev ? { ...prev, state: value as ProductState } : null
                  )
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ProductState).map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="categories" className="text-right">
                Categories
              </Label>
              <Input
                id="categories"
                placeholder="Enter comma-separated categories"
                value={editingProduct?.categories?.join(", ") || ""}
                onChange={(e) =>
                  setEditingProduct((prev) =>
                    prev
                      ? {
                          ...prev,
                          categories: e.target.value
                            .split(",")
                            .map((c) => c.trim()),
                        }
                      : null
                  )
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="VendorId" className="text-right">
                Vendor
              </Label>
              {loadingVendors ? (
                <div className="col-span-3">Loading vendors...</div>
              ) : vendorsError ? (
                <div className="col-span-3 text-red-500">
                  Error loading vendors
                </div>
              ) : (
                <Select
                  value={editingProduct?.VendorId}
                  onValueChange={(value) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, VendorId: value } : null
                    )
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={updating}>
              {updating ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
