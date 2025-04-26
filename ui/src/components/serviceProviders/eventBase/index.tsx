import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Filter, Loader2, MapPin, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@radix-ui/react-separator";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router";
import { toast } from "sonner";
import UserAuthCard from "@/components/custom/users/create";
import { useAuth } from "@/middleware/context/authContext";
export const ghSim = "GH¢ ";

// GraphQL Query
const GET_EVENTS = gql`
  query GetEvents($filter: EventFilter) {
    events(filter: $filter) {
      id
      name
      date
      startTime
      duration
      maxAttendees
      location
      price
      description
      instructor
    }
  }
`;

// Event type definition
export interface Event {
  id: string;
  name: string;
  date: Date;
  startTime?: string;
  duration: number;
  maxAttendees: number;
  location: string;
  price: number;
  description: string;
  instructor: string;
}

// Filter type definition
export interface EventFilter {
  fromDate?: Date | null;
  toDate?: Date | null;
  instructor?: string | null;
  location?: string | null;
}
const DELETE_EVENT = gql`
  mutation DeleteEvent($eventId: String!) {
    deleteEvent(id: $eventId)
  }
`;
// Event card component
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const [deleteEvent] = useMutation(DELETE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS }], // Refetch events after deletion
    // awaitRefetchQueries: true,
  });
  const handleDelete = async () => {
    try {
      await deleteEvent({ variables: { eventId: event.id } });
      // use Sonner from shadcn to show a success message
      toast.success("Event deleted successfully!");

      // Optionally, you can show a success message or refresh the list of events
    } catch {
      // console.error("Error deleting event:", error);
      // Show an error message using Sonner
      toast.error("Failed to delete event. Please try again.");
    }
  };
  const availabilityColor = "bg-amber-500"; // Default to amber

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className={`h-2 w-full ${availabilityColor}`} aria-hidden="true" />
        <div className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{event.name}</h3>
              <Badge variant="outline">
                {ghSim}
                {event.price}
              </Badge>
            </div>

            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {format(new Date(event.date), "h:mm a")} •{" "}
                {event.duration < 60
                  ? `${event.duration} mins`
                  : event.duration < 1440
                  ? `${Math.floor(event.duration / 60)} hours`
                  : `${Math.floor(event.duration / 1440)} day${
                      Math.floor(event.duration / 1440) > 1 ? "s" : ""
                    }`}
              </span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>

            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Users className="h-4 w-4" />
              <span>{event.maxAttendees} max capacity</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t p-3 gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={onClick}
        >
          View Details
        </Button>
        <Link to={`/event/${event.id}`}>
          <Button
            size="sm"
            variant="destructive"
            // className="w-full"
            // onClick={onClick}
          >
            Edit
          </Button>
        </Link>
        <Button size="sm" variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
const BOOK_EVENT = gql`
  mutation BookEvent($eventId: String!, $userId: String!) {
    bookEvent(eventId: $eventId, userId: $userId) {
      id
      eventId
    }
  }
`;

const GET_BOOK_EVENT = gql`
  query GetBookEvent($eventId: String!, $userId: String!) {
    getBookEvent(eventId: $eventId, userId: $userId) {
      id
      eventId
      userId
    }
  }
`;

const CANCEL_BOOKINGS = gql`
  mutation CancelBookings($bookingsId: String!) {
    cancelBookings(bookingsId: $bookingsId)
  }
`;

// Event details modal component
function EventDetailsModal({
  event,
  isOpen,
  onClose,
}: {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const [bookEvent, { loading: booking }] = useMutation(BOOK_EVENT, {
    refetchQueries: [
      { query: GET_EVENTS },
      { 
        query: GET_BOOK_EVENT, 
        variables: { eventId: event.id, userId: user?.id } 
      }
    ], // Refetch events after booking
  });

  // GET_BOOK_EVENT
  const { data: bookingData, loading: loadingBookingData } = useQuery(GET_BOOK_EVENT, {
    variables: { eventId: event.id, userId: user?.id },
    skip: !isAuthenticated || !user?.id,
    fetchPolicy: "network-only"
  });

  const bookingId = bookingData?.getBookEvent?.id || null; // Extract booking ID from the query result
  const isBooked = !!bookingId;

  const [cancelBookings, { loading: cancelling }] = useMutation(
    CANCEL_BOOKINGS,
    {
      refetchQueries: [
        { query: GET_EVENTS },
        { 
          query: GET_BOOK_EVENT, 
          variables: { eventId: event.id, userId: user?.id } 
        }
      ],
    }
  );

  const handleCancelBooking = async () => {
    if (!bookingId) return;
    
    try {
      await cancelBookings({
        variables: { bookingsId: bookingId },
      });
      toast.success("Booking cancelled successfully!");
      onClose(); // Close the modal after booking

    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    }
  };

  const handleBookEvent = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to book an event.");
      return;
    }
    
    try {
      await bookEvent({
        variables: { eventId: event.id, userId: user?.id },
      });
      toast.success("Event booked successfully!");
      onClose(); // Close the modal after booking
    } catch (error) {
      console.error("Error booking event:", error);
      toast.error("Failed to book event. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Date & Time</span>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(event.date), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(event.date), "h:mm a")} • {event.duration}{" "}
                  mins
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Location</span>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Instructor</span>
            <span className="text-sm text-muted-foreground">
              {event.instructor}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Description</span>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Capacity</span>
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <Users className="h-4 w-4" />
              <span>Maximum capacity: {event.maxAttendees}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="font-medium text-lg">
            {event.price}
          </div>
          {isAuthenticated ? (
            loadingBookingData ? (
              <Button disabled>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </Button>
            ) : isBooked ? (
              <Button 
                variant="destructive" 
                onClick={handleCancelBooking} 
                disabled={cancelling}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  "Cancel Booking"
                )}
              </Button>
            ) : (
              <Button 
                onClick={handleBookEvent}
                disabled={booking}
              >
                {booking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  "Book Now"
                )}
              </Button>
            )
          ) : (
            <UserAuthCard>
              <Button>Book Now</Button>
            </UserAuthCard>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
// Function to parse events from GraphQL
function parseEvents(data: {
  events?: Array<Omit<Event, "date"> & { date: string }>;
}): Event[] {
  if (!data || !data.events) return [];

  return data.events.map((event: Omit<Event, "date"> & { date: string }) => ({
    ...event,
    // Ensure date is handled properly
    date: new Date(event.date),
  }));
}

// Main event calendar component
export function EventCalendarDialog({
  isDialogOpenMain,
  setDialogOpenMain,
  serviceId
}: {
  isDialogOpenMain: boolean;
  setDialogOpenMain: (open: boolean) => void;
  serviceId: string | undefined;
}) {
  const [filter, setFilter] = useState<EventFilter>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeDate, setActiveDate] = useState<string>("");

  // For date filters
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // For additional filters
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");

  // Query events with filter
  const { loading, error, data } = useQuery(GET_EVENTS, {
    variables: { filter },
    fetchPolicy: "network-only",
  });

  // Parse events from GraphQL response
  const events = parseEvents(data);

  // Extract unique locations and instructors for filters
  const locations = Array.from(new Set(events.map((event) => event.location)));
  const instructors = Array.from(
    new Set(events.map((event) => event.instructor))
  );

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateStr = format(new Date(event.date), "yyyy-MM-dd");
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const dates = Object.keys(eventsByDate).sort();

  // Set active date when dates change
  useEffect(() => {
    if (dates.length > 0 && (!activeDate || !dates.includes(activeDate))) {
      setActiveDate(dates[0]);
    }
  }, [dates, activeDate]);

  // Handle filter application
  const applyFilters = () => {
    setFilter({
      fromDate: fromDate ? new Date(fromDate) : null,
      toDate: toDate ? new Date(toDate) : null,
      location: selectedLocation || null,
      instructor: selectedInstructor || null,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setSelectedLocation("");
    setSelectedInstructor("");
    setFilter({});
  };

  if (loading) return <div>Loading events...</div>;
  if (error) return <div>Error loading events: {error.message}</div>;

  return (
    <Dialog open={isDialogOpenMain} onOpenChange={setDialogOpenMain}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Event Calendar</DialogTitle>
        </DialogHeader>

        {/* Navigation Menu for Filters */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid gap-3 p-4 w-96">
                  <div className="space-y-2">
                    <h4 className="font-medium">Date Range</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm">From</label>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                          className="px-2 py-1 rounded border text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm">To</label>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                          className="px-2 py-1 rounded border text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Location</h4>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-2 py-1 rounded border text-sm"
                    >
                      <option value="">All Locations</option>
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Instructor</h4>
                    <select
                      value={selectedInstructor}
                      onChange={(e) => setSelectedInstructor(e.target.value)}
                      className="w-full px-2 py-1 rounded border text-sm"
                    >
                      <option value="">All Instructors</option>
                      {instructors.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-between mt-2">
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear
                    </Button>
                    <Button size="sm" onClick={applyFilters}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {dates.length > 0 ? (
          <Tabs
            value={activeDate}
            onValueChange={setActiveDate}
            className="w-full mt-4"
          >
            <TabsList className="w-full flex-wrap justify-start">
              {dates.map((dateStr) => (
                <TabsTrigger key={dateStr} value={dateStr}>
                  {format(new Date(dateStr), "EEE, MMM d")}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4">
              {dates.map((dateStr) => (
                <TabsContent key={dateStr} value={dateStr} className="mt-0">
                  <h3 className="text-lg font-medium mb-4">
                    {format(new Date(dateStr), "EEEE, MMMM d, yyyy")}
                  </h3>

                  <ScrollArea className="h-[50vh]">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 pb-4">
                      {eventsByDate[dateStr].map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          onClick={() => setSelectedEvent(event)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        ) : (
          <div className="py-12 text-center">
            <h3 className="font-medium text-lg">No events found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}

        {selectedEvent && (
          <EventDetailsModal
            event={selectedEvent}
            isOpen={!!selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
