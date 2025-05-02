"use client";

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
import {
  Calendar,
  Mail,
  Phone,
  Star,
  UserRound,
  Clock,
  FileText,
  Loader2,
  AlertCircle,

  BookOpen,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { gql, useQuery } from "@apollo/client";
import { format, parseISO } from "date-fns";
import NavBar from "../navBar";

const GET_ALL_APPOINTMENT_BOOKINGS_BY_USER_ID = gql`
  query GetAllAppointmentBookingsByUserID($userId: String!) {
    getAllAppointmentBookingsByUserId(userId: $userId) {
      book {
        id
        notes
        startTime
        endTime
        day
        tableSize
        updatedAt
        isConfirmed
      }
      userData {
        id
        name
        number
        numberType
        type
      }
    }
  }
`;

// Update the interface to match the actual data structure
interface BookingData {
  book: {
    id: string;
    notes?: string;
    startTime: string;
    endTime: string;
    day: string;
    tableSize: number;
    updatedAt: string;
    isConfirmed: boolean | null;
  }[];
  userData: {
    id: string;
    name: string;
    number: string;
    numberType: string;
    type: string;
  };
}

interface QueryResponse {
  getAllAppointmentBookingsByUserId: BookingData[];
}

export default function ContactDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const { loading, error, data } = useQuery<QueryResponse>(
    GET_ALL_APPOINTMENT_BOOKINGS_BY_USER_ID,
    {
      variables: { userId },
    }
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "MMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "h:mm a");
    } catch {
      return "Invalid time";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading contact details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container py-10 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <h2 className="text-xl font-semibold">Error Loading Contact</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Button asChild className="mt-4">
            <Link to="/contacts">Back to Contacts</Link>
          </Button>
        </div>
      </div>
    );
  }

  // No data state
  if (
    !data ||
    !data.getAllAppointmentBookingsByUserId ||
    data.getAllAppointmentBookingsByUserId.length === 0
  ) {
    return (
      <div className="container py-10 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-2 max-w-md text-center">
          <UserRound className="h-8 w-8 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Contact Not Found</h2>
          <p className="text-muted-foreground">
            The contact you're looking for doesn't exist or has no bookings.
          </p>
          <Button asChild className="mt-4">
            <Link to="/contacts">Back to Contacts</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get user data and bookings from the response
  const contactData = data.getAllAppointmentBookingsByUserId[0];
  const userData = contactData.userData;
  const bookings = contactData.book;

  return (
    <div className="container py-10">
      <div className="pb-6">
        <NavBar />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle>{userData.name}</CardTitle>
                <CardDescription>{userData.type}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Star className="h-5 w-5" />
                <span className="sr-only">Toggle favorite</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userData.number}</span>
                {userData.numberType && (
                  <span className="text-xs text-muted-foreground">
                    ({userData.numberType})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-muted-foreground" />
                <span>{userData.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{bookings.length}</span>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex w-full gap-2">
                <Button className="flex-1" variant="outline" size="sm" asChild>
                  <a href={`tel:${userData.number}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
                <Button className="flex-1" variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline">Edit</Button>
                  <Button variant="destructive">Delete</Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="bookings">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>
            <TabsContent value="bookings" className="mt-4 h-[70vh] overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Booking History</CardTitle>
            
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex gap-4 rounded-lg border p-4"
                      >
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">
                              Appointment{" "}
                              {booking.isConfirmed === true
                                ? "(Confirmed)"
                                : booking.isConfirmed === false
                                ? "(Rejected)"
                                : "(Pending)"}
                            </h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(booking.startTime)}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {formatTime(booking.startTime)} -{" "}
                              {formatTime(booking.endTime)}
                            </span>
                          </div>
                          {booking.notes && (
                            <p className="mt-2 text-sm border-t pt-2">
                              {booking.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Add New Booking</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-4 h-[70vh] overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings
                      .filter((booking) => booking.notes)
                      .map((booking) => (
                        <div key={booking.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Booking Note</h4>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(booking.startTime)}
                            </span>
                          </div>
                          <p className="mt-2 text-sm">{booking.notes}</p>
                        </div>
                      ))}
                    {bookings.filter((booking) => booking.notes).length ===
                      0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground">
                          No notes available for this contact
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Add New Note</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
