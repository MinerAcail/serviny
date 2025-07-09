import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Star } from "lucide-react";
import * as lucideIcons from "lucide-react";
import { useAuth } from "@/middleware/context/authContext";
import { useQuery, gql, useMutation } from "@apollo/client";
import UserAuthCard from "@/components/custom/users/create";
import { toast } from "sonner";
import { ghSim } from "@/components/serviceProviders/eventBase";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// GraphQL query
export const GET_RENTAL_ITEMS = gql`
  query getRentalItems($serviceId: String) {
    getRentalItems(serviceId: $serviceId) {
      category {
        id
        name
        icon
        updatedAt
      }
      inventories {
        id
        name
        description
        price
        available
        imageUrl
        rating
        reviewCount
        updatedAt
      }
    }
  }
`;

const USER_BOOKINGS = gql`
  mutation UserBookings(
    $bookTypeID: String!
    $userID: String!
    $bookType: String!
    $notes: String
  ) {
    UserBookings(
      bookTypeID: $bookTypeID
      userId: $userID
      bookType: $bookType
      notes: $notes
    ) {
      id
      bookTypeId
      bookType
      serviceId
      userId
      isBooked
    }
  }
`;

const GET_USER_BOOKING = gql`
  query GetUserBookings($bookTypeID: String!, $userID: String!) {
    getUserBookings(bookTypeId: $bookTypeID, userId: $userID) {
      id
      bookTypeId
      userId
      bookType
      serviceId
    }
  }
`;

const CANCEL_USER_BOOKINGS = gql`
  mutation CancelUserBookings($bookTypeID: String!, $userID: String!) {
    cancelUserBookings(bookTypeId: $bookTypeID, userId: $userID)
  }
`;

// Types
interface Category {
  id: string;
  name: string;
  icon: string;
  updatedAt: string;
}

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  updatedAt: string;
}

interface RentalItemData {
  category: Category;
  inventories: InventoryItem[];
}

interface InventoryListDialogProps {
  isDialogOpenMain: boolean;
  setDialogOpenMain: (open: boolean) => void;
  serviceId: string | undefined;
}

// Custom hook for checking booking status
function useInventoryBookingStatus(
  inventoryId: string | null,
  userId: string | undefined
) {
  const { data: bookingData, loading: loadingBookingData } = useQuery(
    GET_USER_BOOKING,
    {
      variables: { bookTypeID: inventoryId, userID: userId },
      skip: !userId || !inventoryId,
      fetchPolicy: "network-only",
    }
  );

  const isBooked = !!bookingData?.getUserBookings;
  const bookingId = bookingData?.getUserBookings?.id;

  return { isBooked, bookingId, loadingBookingData };
}

// Component for inventory item
function InventoryItem({
  item,
  userId,
  isAuthenticated,
  onBook,
  onCancel,
  isBooking,
  isCancelling,
  selectedItemId,
  onOpenNotesDialog,
}: {
  item: InventoryItem;
  userId: string | undefined;
  isAuthenticated: boolean;
  onBook: (id: string) => void;
  onCancel: (id: string) => void;
  isBooking: boolean;
  isCancelling: boolean;
  selectedItemId: string | null;
  onOpenNotesDialog: (item: InventoryItem) => void;
}) {
  const { isBooked, loadingBookingData } = useInventoryBookingStatus(
    item.id,
    userId
  );

  return (
    <Card key={item.id} className="overflow-hidden">
      <div className="relative h-48 w-full">
        <img
          src={item.imageUrl || "/placeholder.svg?height=200&width=300"}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg py-1.5">
              Currently Unavailable
            </Badge>
          </div>
        )}
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{item.name}</CardTitle>
          <Badge variant="outline" className="flex items-center">
            <Star className="h-3 w-3 mr-1 fill-current" />
            {item.rating?.toFixed(1) || "N/A"}
          </Badge>
        </div>
        <Description item={item} />
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="font-bold text-lg">
          {ghSim}
          {item.price} / day
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {!item.available ? (
          <Button disabled>Unavailable</Button>
        ) : isAuthenticated ? (
          loadingBookingData ? (
            <Button disabled>
              <lucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </Button>
          ) : isBooked ? (
            <Button
              variant="destructive"
              onClick={() => onCancel(item.id)}
              disabled={isCancelling && selectedItemId === item.id}
            >
              {isCancelling && selectedItemId === item.id ? (
                <>
                  <lucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button
                className="flex-1"
                onClick={() => onBook(item.id)}
                disabled={isBooking && selectedItemId === item.id}
              >
                {isBooking && selectedItemId === item.id ? (
                  <>
                    <lucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Now"
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenNotesDialog(item)}
                disabled={isBooking && selectedItemId === item.id}
              >
                <lucideIcons.PencilLine className="h-4 w-4" />
              </Button>
            </div>
          )
        ) : (
          <UserAuthCard>
            <Button>Book Now</Button>
          </UserAuthCard>
        )}
      </CardFooter>
    </Card>
  );
}

function Description({ item }: { item: { id: string; description: string } }) {
  const [expanded, setExpanded] = useState(false);

  const isLong = item.description.length > 300;
  const previewText = item.description.slice(0, 300);

  return (
    <CardDescription className="text-muted-foreground text-sm leading-relaxed">
      {isLong ? (
        <>
          {expanded ? item.description : `${previewText}...`}
          <Button
            variant="link"
            size="sm"
            className="p-0 ml-1 text-blue-500 hover:underline"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Read more"}
          </Button>
        </>
      ) : (
        item.description
      )}
    </CardDescription>
  );
}

export function InventoryListDialog({
  isDialogOpenMain,
  setDialogOpenMain,
  serviceId,
}: InventoryListDialogProps) {
  const [activeTab, setActiveTab] = useState("");
  const [categoryGroups, setCategoryGroups] = useState<
    Record<string, RentalItemData[]>
  >({});
  const { user, isAuthenticated } = useAuth();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");

  // Track booked items locally to update UI immediately
  const [localBookedItems, setLocalBookedItems] = useState<Set<string>>(
    new Set()
  );
  console.log(localBookedItems);

  const { loading, error, data } = useQuery(GET_RENTAL_ITEMS, {
    variables: { serviceId },
    skip: !serviceId,
  });

  // Book inventory item
  const [bookInventory, { loading: booking }] = useMutation(USER_BOOKINGS, {
    refetchQueries: [
      {
        query: GET_USER_BOOKING,
        variables: { bookTypeID: selectedItemId, userID: user?.id },
      },
    ],
    onCompleted: () => {
      if (selectedItemId) {
        // Update local state immediately
        setLocalBookedItems((prev) => {
          const updated = new Set(prev);
          updated.add(selectedItemId);
          return updated;
        });
      }
      // Close notes dialog if open
      setNotesDialogOpen(false);
    },
  });

  // Cancel booking
  const [cancelBooking, { loading: cancelling }] = useMutation(
    CANCEL_USER_BOOKINGS,
    {
      refetchQueries: [
        {
          query: GET_USER_BOOKING,
          variables: { bookTypeID: selectedItemId, userID: user?.id },
        },
      ],
      onCompleted: () => {
        if (selectedItemId) {
          // Update local state immediately
          setLocalBookedItems((prev) => {
            const updated = new Set(prev);
            updated.delete(selectedItemId);
            return updated;
          });
        }
      },
    }
  );

  useEffect(() => {
    if (data?.getRentalItems) {
      const groups: Record<string, RentalItemData[]> = {};
      data.getRentalItems.forEach((item: RentalItemData) => {
        const categoryId = item.category.id;
        if (!groups[categoryId]) {
          groups[categoryId] = [];
        }
        groups[categoryId].push(item);
      });
      setCategoryGroups(groups);
      if (!activeTab && Object.keys(groups).length > 0) {
        setActiveTab(Object.keys(groups)[0]);
      }
    }
  }, [data, activeTab]);

  const categories = Object.values(categoryGroups).map(
    (group) => group[0].category
  );

  const handleBookInventory = async (inventoryId: string) => {
    setSelectedItemId(inventoryId);

    if (!isAuthenticated) {
      toast.error("Please log in to book this item.");
      return;
    }

    try {
      await bookInventory({
        variables: {
          bookTypeID: inventoryId,
          userID: user?.id,
          bookType: "RENTAL",
          notes: "",
        },
      });
      toast.success("Item booked successfully!");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error booking item:", error);
        toast.error(error.message || "Failed to book item. Please try again.");
      } else {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleCancelBooking = async (inventoryId: string) => {
    setSelectedItemId(inventoryId);

    try {
      await cancelBooking({
        variables: { bookTypeID: inventoryId, userID: user?.id },
      });
      toast.success("Booking cancelled successfully!");
    } catch (error: unknown) {
      console.error("Error cancelling booking:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "Failed to cancel booking. Please try again."
        );
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleOpenNotesDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setSelectedItemId(item.id);
    setBookingNotes("");
    setNotesDialogOpen(true);
  };

  const handleBookWithNotes = async () => {
    if (!selectedItemId || !user?.id) return;

    try {
      await bookInventory({
        variables: {
          bookTypeID: selectedItemId,
          userID: user.id,
          bookType: "RENTAL",
          notes: bookingNotes.trim(),
        },
      });
      toast.success("Item booked successfully with notes!");
      setNotesDialogOpen(false);
    } catch (error: unknown) {
      console.error("Error booking item:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to book item. Please try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  const renderInventoryItems = (categoryId: string) => {
    const items =
      categoryGroups[categoryId]?.flatMap((group) => group.inventories) || [];

    return items.map((item) => {
      // Override the query result with our local state for immediate UI updates

      return (
        <InventoryItem
          key={item.id}
          item={item}
          userId={user?.id}
          isAuthenticated={isAuthenticated}
          onBook={handleBookInventory}
          onCancel={handleCancelBooking}
          isBooking={booking}
          isCancelling={cancelling}
          selectedItemId={selectedItemId}
          onOpenNotesDialog={handleOpenNotesDialog}
        />
      );
    });
  };

  const getCategoryIcon = (iconName: string) => {
    const IconComponent =
      lucideIcons[iconName as keyof typeof lucideIcons] || Package;

    /* @ts-expect-error: IconComponent is dynamically imported and may not have proper type inference */

    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <>
      <Dialog open={isDialogOpenMain} onOpenChange={setDialogOpenMain}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Inventory</DialogTitle>
          </DialogHeader>

        <div className="space-y-4 mt-4">
              <Tabs
                defaultValue={activeTab}
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="flex items-center gap-1"
                    >
                      {getCategoryIcon(category.icon)}
                      <span className="hidden sm:inline">{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {categories.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    className="mt-0"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      {renderInventoryItems(category.id)}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Notes for {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special requirements or notes for this booking..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookWithNotes} disabled={booking}>
              {booking ? (
                <>
                  <lucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Book Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
