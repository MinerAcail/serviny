import { useState } from "react";
import { ExternalLink, Search, Filter, Eye, X, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { useQuery } from "@apollo/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice } from "../global/formatPrice";
import { gql } from "@apollo/client";

const GET_ALL_REQUEST_ITEMS = gql`
  query GetAllRequestItems {
    getAllRequestItems {
      id
      name
      price
      state
      description
      quantity
      itemType
      webLink
      imageUrls
      createdAt
    }
  }
`;

interface RequestItem {
  id: string;
  name: string;
  price: string | number;
  state: string;
  description: string;
  quantity: number;
  itemType: string;
  webLink: string;
  imageUrls?: string[];
  createdAt: string;
}

const getStatusColor = (state: string) => {
  switch (state.toLowerCase()) {
    case "available":
    case "instock":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "preorder":
    case "low-stock":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "out-of-stock":
    case "outofstock":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "discontinued":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
  }
};

const getStatusText = (state: string) => {
  switch (state.toLowerCase()) {
    case "preorder":
      return "Pre-order";
    case "instock":
      return "In Stock";
    case "outofstock":
      return "Out of Stock";
    case "low-stock":
      return "Low Stock";
    default:
      return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  }
};

const parseWebLink = (webLink: string) => {
  try {
    const parsed = JSON.parse(webLink);
    return {
      url: parsed.link || webLink,
      name: parsed.name || "View Link"
    };
  } catch {
    return {
      url: webLink,
      name: "View Link"
    };
  }
};

const formatPriceValue = (price: string | number) => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? price : formatPrice(numPrice.toFixed(2));
};

const ItemDetailsDialog = ({ item, children }: { item: RequestItem, children: React.ReactNode }) => {
  const webLinkData = parseWebLink(item.webLink);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{item.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">PRICE</h4>
              <p className="text-2xl font-bold">{formatPriceValue(item.price)}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">QUANTITY</h4>
              <p className="text-2xl font-bold">{item.quantity}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">STATUS</h4>
              <Badge className={getStatusColor(item.state)}>
                {getStatusText(item.state)}
              </Badge>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-1">TYPE</h4>
              <p className="font-medium">{item.itemType}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">DESCRIPTION</h4>
            <p className="text-sm leading-relaxed text-gray-700">{item.description}</p>
          </div>
          
          {item.imageUrls && item.imageUrls.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-3">IMAGES</h4>
              <div className="grid grid-cols-3 gap-3">
                {item.imageUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${item.name} ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border"
                  />
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">CREATED</h4>
            <p className="text-sm">{new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1" asChild>
              <a
                href={webLinkData.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {webLinkData.name}
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function InventoryManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showStats, setShowStats] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  const { data, loading, error } = useQuery(GET_ALL_REQUEST_ITEMS, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network"
  });

  if (loading) {
    return (
      <div className="container mx-auto p-4 space-y-6 mt-5">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 space-y-6 mt-5">
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <X className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-medium">Error loading inventory</h3>
            <p className="text-sm text-gray-600 mt-2">{error.message}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const inventoryData: RequestItem[] = data?.getAllRequestItems || [];

  const filteredData = inventoryData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.state.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory =
      categoryFilter === "all" || item.itemType === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [...new Set(inventoryData.map((item) => item.itemType))].sort();
  const statuses = [...new Set(inventoryData.map((item) => item.state))].sort();

  const statsData = {
    total: inventoryData.length,
    available: inventoryData.filter((item) => 
      ["instock", "available"].includes(item.state.toLowerCase())
    ).length,
    preorder: inventoryData.filter((item) => 
      ["preorder", "low-stock"].includes(item.state.toLowerCase())
    ).length,
    outOfStock: inventoryData.filter((item) => 
      ["outofstock", "out-of-stock"].includes(item.state.toLowerCase())
    ).length
  };

  return (
    <div className="container mx-auto p-4 space-y-6 mt-10">
      {/* Header */}
     

      {/* Summary Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 animate-in slide-in-from-top duration-300">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{statsData.total}</div>
              <div className="text-sm text-gray-600">Total Products</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{statsData.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{statsData.preorder}</div>
              <div className="text-sm text-gray-600">Pre-order / Low Stock</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{statsData.outOfStock}</div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-top duration-300">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status.toLowerCase()}>
                  {getStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
           {filteredData.length} of {inventoryData.length} products
        </p>
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
            {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium w-20">Image</th>
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Price</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-left font-medium">Quantity</th>
                <th className="p-3 text-left font-medium">Type</th>
                <th className="p-3 text-left font-medium max-w-[200px]">Description</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => {
                const webLinkData = parseWebLink(item.webLink);
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <img
                        src={item.imageUrls?.[0] || "/placeholder.svg"}
                        alt={item.name}
                        className="w-15 h-15 rounded-md object-cover border"
                      />
                    </td>
                    <td className="p-3 font-medium max-w-[200px]">
                      <div className="truncate" title={item.name}>
                        {item.name}
                      </div>
                    </td>
                    <td className="p-3 font-semibold">
                      {formatPriceValue(item.price)}
                    </td>
                    <td className="p-3">
                      <Badge className={getStatusColor(item.state)}>
                        {getStatusText(item.state)}
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-medium">{item.quantity}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {item.itemType}
                      </span>
                    </td>
                    <td className="p-3 max-w-[200px]">
                      <div className="truncate text-sm text-gray-600" title={item.description}>
                        {item.description}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <ItemDetailsDialog item={item}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </ItemDetailsDialog>
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={webLinkData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden grid gap-4">
        {filteredData.map((item) => {
          const webLinkData = parseWebLink(item.webLink);
          return (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <img
                    src={item.imageUrls?.[0] || "/placeholder.svg"}
                    alt={item.name}
                    className="w-20 h-20 rounded-md object-cover flex-shrink-0 border"
                  />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg leading-tight">
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(item.state)}>
                        {getStatusText(item.state)}
                      </Badge>
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {item.itemType}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Price:</span>
                    <div className="text-lg font-bold">
                      {formatPriceValue(item.price)}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Quantity:</span>
                    <div className="text-lg font-bold">{item.quantity}</div>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-sm text-gray-600">Description:</span>
                  <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <ItemDetailsDialog item={item}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </ItemDetailsDialog>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    asChild
                  >
                    <a
                      href={webLinkData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {webLinkData.name}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p>Try adjusting your search or filter criteria</p>
            {(searchTerm || statusFilter !== "all" || categoryFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCategoryFilter("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}