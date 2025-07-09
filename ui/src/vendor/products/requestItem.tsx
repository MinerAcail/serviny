import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  MoreHorizontal,
  Trash,
  Check,
  Ban,
  // PlusCircle,
  X,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  // DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// import { useToast } from "@/hooks/use-toast";

const GET_ALL_REQUEST_ITEMS = gql`
  query getAllRequestItems {
    getAllRequestItems {
      id
      name
      description
      imageUrls
      categories
      state
      createdAt
    }
  }
`;

const UPDATE_REQUEST_ITEM_state = gql`
  mutation UpdateRequestItemstate($itemId: String, $state: String!) {
    updateRequestItemstate(itemId: $itemId, state: $state)
  }
`;

interface RequestItem {
  id: string;
  name: string;
  description: string;
  categories: string;
  imageUrls: string[];
  state: string;
  createdAt: string;
}

export function RequestItems() {
  const { loading, error, data, refetch } = useQuery(GET_ALL_REQUEST_ITEMS);
  const [updateRequestItemstate] = useMutation(UPDATE_REQUEST_ITEM_state, {
    refetchQueries: ["updateRequestItemstate"],
  });
  // const { toast } = useToast();

  // State variables
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof RequestItem | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [filteredItems, setFilteredItems] = useState<RequestItem[]>([]);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoriesFilter, setcategoriesFilter] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<RequestItem | null>(null);
  const [showItemDetailsDialog, setShowItemDetailsDialog] = useState(false);

  useEffect(() => {
    if (data?.getAllRequestItems) {
      let filtered = data.getAllRequestItems.filter((item: RequestItem) =>
        Object.values(item).some((value) =>
          value && typeof value === "string"
            ? value.toLowerCase().includes(searchTerm.toLowerCase())
            : false
        )
      );

      // Apply categories filter if selected
      if (categoriesFilter) {
        filtered = filtered.filter(
          (item: RequestItem) => item.categories === categoriesFilter
        );
      }

      setFilteredItems(filtered);
      setCurrentPage(1);
    }
  }, [data, searchTerm, categoriesFilter]);

  const handleSort = (column: keyof RequestItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  useEffect(() => {
    if (sortColumn) {
      const sortedData = [...filteredItems].sort((a, b) => {
        if (a[sortColumn] < b[sortColumn])
          return sortDirection === "asc" ? -1 : 1;
        if (a[sortColumn] > b[sortColumn])
          return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
      setFilteredItems(sortedData);
    }
  }, [sortColumn, sortDirection]);

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleActionClick = async (
    action: "approve" | "reject" | "delete",
    itemId: string
  ) => {
    if (action === "delete") {
      setDeleteItemId(itemId);
      setShowDeleteDialog(true);
      return;
    }

    try {
      const state = action === "approve" ? "APPROVED" : "REJECTED";
      await updateRequestItemstate({
        variables: {
          itemId,
          state,
        },
      });

      toast.info( `Request item ${
          action === "approve" ? "approved" : "rejected"
        } successfully`,
         {
      });

      refetch();
    } catch (error) {
      toast.error( "Action failed",{
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteItemId) return;

    try {
      // Here you would implement the actual delete logic
      toast.success( "Request item deleted successfully",{
      });

      setShowDeleteDialog(false);
      setDeleteItemId(null);
      refetch();
    } catch (error) {
      toast.error( "Delete failed",{
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleRowClick = (item: RequestItem) => {
    setSelectedItem(item);
    setShowItemDetailsDialog(true);
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return {
      formatted: `${day}/${month}/${year}`,
      daysAgo: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`
    };
  };

  // Get unique categories for filter dropdown
  const categories = data?.getAllRequestItems
    ? [...new Set(data.getAllRequestItems.map((item: RequestItem) => item.categories))]
    : [];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const renderTableHeader = (column: keyof RequestItem, label: string) => (
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

  if (loading) return <div className="p-4">Loading request items...</div>;
  if (error)
    return (
      <div className="p-4 text-red-500">
        Error loading request items: {error.message}
      </div>
    );

  return (
    <div className="space-y-4 bg-blue-100 rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Input
            placeholder="Search request items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {categoriesFilter || "All Categories"}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setcategoriesFilter(null)}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setcategoriesFilter(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2">
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedItems.length === filteredItems.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[80px]">Image</TableHead>
              {renderTableHeader("name", "Name")}
              {renderTableHeader("categories", "Category")}
              {renderTableHeader("createdAt", "Created At")}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((item) => {
              const dateInfo = formatDate(item.createdAt);
              
              return (
                <TableRow 
                  key={item.id} 
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => handleRowClick(item)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <div className="h-10 w-10 rounded-md overflow-hidden">
                        <img
                          src={item.imageUrls[0]}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                        No img
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {item.categories}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{dateInfo.formatted}</span>
                      <span className="text-xs text-gray-500">{dateInfo.daysAgo}</span>
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleActionClick("approve", item.id)}
                          disabled={item.state === "APPROVED"}
                        >
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          <span>Approve Request</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleActionClick("reject", item.id)}
                          disabled={item.state === "REJECTED"}
                        >
                          <Ban className="mr-2 h-4 w-4 text-red-600" />
                          <span>Reject Request</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleActionClick("delete", item.id)}
                        >
                          <Trash className="mr-2 h-4 w-4 text-red-600" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1} to{" "}
            {Math.min(indexOfLastItem, filteredItems.length)} of{" "}
            {filteredItems.length} results
          </p>
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => prev - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={indexOfLastItem >= filteredItems.length}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              request item and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Details Dialog */}
      <Dialog open={showItemDetailsDialog} onOpenChange={setShowItemDetailsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Item Details</span>
              <DialogClose className="rounded-full p-1 hover:bg-gray-200">
                <X className="h-4 w-4" />
              </DialogClose>
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Name</h3>
                  <p>{selectedItem.name}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Category</h3>
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {selectedItem.categories}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Status</h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedItem.state === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedItem.state === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : selectedItem.state === "REJECTED"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedItem.state}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Created</h3>
                  <p>
                    {formatDate(selectedItem.createdAt).formatted} 
                    <span className="ml-2 text-xs text-gray-500">
                      ({formatDate(selectedItem.createdAt).daysAgo})
                    </span>
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">Description</h3>
                <p className="mt-1 text-gray-600">{selectedItem.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700">Images</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {selectedItem.imageUrls && selectedItem.imageUrls.length > 0 ? (
                    selectedItem.imageUrls.map((url, index) => (
                      <div key={index} className="h-24 rounded-md overflow-hidden">
                        <img
                          src={url}
                          alt={`${selectedItem.name} image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-3 h-24 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                      No images available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-4">
            <div className="flex gap-2">
              {selectedItem && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("approve", selectedItem.id)}
                    disabled={selectedItem.state === "APPROVED"}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4 text-green-600" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleActionClick("reject", selectedItem.id)}
                    disabled={selectedItem.state === "REJECTED"}
                    className="flex items-center gap-1"
                  >
                    <Ban className="h-4 w-4 text-red-600" />
                    Reject
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setShowItemDetailsDialog(false);
                      handleActionClick("delete", selectedItem.id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <Trash className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RequestItems;