import { useQuery, gql, useMutation } from "@apollo/client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addDays,
  addMonths,
  subMonths,
} from "date-fns";

import type { AppointmentBooking, QueryResponse, UserData } from "./types";
import { CalendarHeader } from "./calendar-header";
import { CalendarGrid } from "./calendar-grid";
import { BookingList } from "./booking-list";
import { BookingDialog } from "./booking-dialog";
import { ContactDialog } from "./contact-dialog";
import { DeleteDialog } from "./delete-dialog";
// import { GET_CONFIRMED_BOOKINGS } from "./booking-item";
export const GET_CONFIRMED_BOOKINGS = gql`
  query GetConfirmedBookings($id: String!) {
    getConfirmedBookings(id: $id)
  }
`;
const GET_ALL_APPOINTMENT_BOOKINGS = gql`
  query GetAllAppointmentBookings {
    getAllAppointmentBookings {
      book {
        id
        startTime
        endTime
        day
        notes
        userId
        tableSize
        userType
      }
      usersData {
        id
        name
        numberType
        type
        number
      }
    }
  }
`;

const DELETE_BOOKING = gql`
    mutation DeleteBooking($id: String!) {
    deleteBooking(id: $id)
  }
`;

const CONFIRM_BOOKING = gql`
  mutation ConfirmBooking($id: String!) {
    confirmBooking(id: $id) {
      id
    }
  }
`;

const WORKING_HOURS = { start: "00:00", end: "23:59" };

// Helper: get all week-start dates (Sundays) for a given month
const getWeeksOfMonth = (month: Date): Date[] => {
  return eachWeekOfInterval(
    { start: startOfMonth(month), end: endOfMonth(month) },
    { weekStartsOn: 0 }
  );
};

export function AppointmentBookedMembers(): JSX.Element {
  const { data, loading, error, refetch } = useQuery<QueryResponse>(
    GET_ALL_APPOINTMENT_BOOKINGS
  );

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState<Date>(today);

  // Initialize selected week to the one containing today
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(() => {
    const weeks = getWeeksOfMonth(today);
    for (let i = 0; i < weeks.length; i++) {
      const weekEnd = addDays(weeks[i], 6);
      if (today >= weeks[i] && today <= weekEnd) {
        return i;
      }
    }
    return 0;
  });

  // Dialog & state handlers
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<AppointmentBooking | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayBookings, setSelectedDayBookings] = useState<
    AppointmentBooking[]
  >([]);

  const [deleteBooking] = useMutation(DELETE_BOOKING, {
    onCompleted: () => {
      toast.success("Booking deleted successfully");
      refetch();
    },
    onError: (err) => toast.error(`Failed to delete booking: ${err.message}`),
  });

const [confirmBooking] = useMutation(CONFIRM_BOOKING, {
    onCompleted: () => {
        toast.success("Booking confirmed successfully");
        refetch();
        // reloadConfirmedBookings();
    },
    onError: (err) => toast.error(`Failed to confirm booking: ${err.message}`),
    refetchQueries: [
        { query: GET_CONFIRMED_BOOKINGS, variables: { id: selectedBooking?.book?.id } },
    ],
    awaitRefetchQueries: true,
});

// const reloadConfirmedBookings = () => {
//     refetch({
//         query: GET_CONFIRMED_BOOKINGS,
//         variables: { id: selectedBooking?.book?.id },
//     });
// };

  // Weeks and current week start
  const weeks = getWeeksOfMonth(currentMonth);
  const currentWeekStart = weeks[selectedWeekIndex] || weeks[0];

  // Generate days for the displayed week, constrained to this month
  const weekDays = Array.from({ length: 7 }).reduce<Date[]>((arr, _, i) => {
    const day = addDays(currentWeekStart, i);
    if (day >= startOfMonth(currentMonth) && day <= endOfMonth(currentMonth)) {
      arr.push(day);
    }
    return arr;
  }, []);

  // Organize bookings by date string
  const bookingsByDate: Record<string, AppointmentBooking[]> = {};
  data?.getAllAppointmentBookings?.forEach((booking) => {
    const iso = booking.book?.startTime;
    if (!iso) return;
    try {
      const date = parseISO(iso);
      const key = format(date, "yyyy-MM-dd");
      bookingsByDate[key] = bookingsByDate[key] || [];
      bookingsByDate[key].push(booking);
    } catch {
      //use sonner to show error message
      toast.error("Invalid date format in booking data.");
      // Intentionally ignored
    }
  });

  // Navigation
  const goToPreviousMonth = () => {
    const prev = subMonths(currentMonth, 1);
    setCurrentMonth(prev);
    setSelectedWeekIndex(0);
  };
  const goToNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    setCurrentMonth(next);
    setSelectedWeekIndex(0);
  };
  const goToPreviousWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex(selectedWeekIndex - 1);
    } else {
      const prevMonth = subMonths(currentMonth, 1);
      const prevWeeks = getWeeksOfMonth(prevMonth);
      setCurrentMonth(prevMonth);
      setSelectedWeekIndex(prevWeeks.length - 1);
    }
  };
  const goToNextWeek = () => {
    if (selectedWeekIndex < weeks.length - 1) {
      setSelectedWeekIndex(selectedWeekIndex + 1);
    } else {
      const nextMonth = addMonths(currentMonth, 1);
      setCurrentMonth(nextMonth);
      setSelectedWeekIndex(0);
    }
  };

  // Label week starting at 1
  const getWeekLabel = () => `Week ${selectedWeekIndex + 1}`;

  // Handlers for days & bookings
  const handleDayHeaderClick = (date: Date) => {
    setSelectedDate(date);
    const key = format(date, "yyyy-MM-dd");
    setSelectedDayBookings(bookingsByDate[key] || []);
    setIsDialogOpen(true);
  };

  const handleBookingClick = (booking: AppointmentBooking) => {
    setSelectedBooking(booking);
    setSelectedDayBookings([booking]);
    if (booking.book?.startTime) {
      try {
        setSelectedDate(parseISO(booking.book.startTime));
      } catch {
        setSelectedDate(null);
      }
    } else setSelectedDate(null);
    setIsDialogOpen(true);
  };

  const handleDeleteBooking = (booking: AppointmentBooking) => {
    setSelectedBooking(booking);
    setDeleteDialogOpen(true);
  };
  const confirmDeleteBooking = () => {
    if (selectedBooking?.book?.id) {
      deleteBooking({ variables: { id: selectedBooking.book.id } });
      setDeleteDialogOpen(false);
    }
  };

  const handleConfirmBooking = (booking: AppointmentBooking) => {
    if (booking.book?.id)
      confirmBooking({ variables: { id: booking.book.id } });
  };

  const handleContactClick = (booking: AppointmentBooking) => {
    setSelectedBooking(booking);
    setContactDialogOpen(true);
  };
  const sendContactMessage = () => {
    toast.success("Message sent successfully!");
    setContactMessage("");
    setContactDialogOpen(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Phone number copied!");
    } catch {
      toast.error("Failed to copy number.");
    }
  };

  const getUserData = (arr?: UserData[]): UserData => {
    if (arr && arr.length > 0) {
      return arr[0];
    }
    throw new Error("No valid user data found");
  };

  const getBookingStatus = (booking: AppointmentBooking) => {
    const lastChar = booking.book.id.slice(-1);
    const code = lastChar.charCodeAt(0);
    return code % 3 === 0 ? "pending" : code % 3 === 1 ? "confirmed" : "new";
  };

  const getStatusBadgeVariant = (status: "pending" | "confirmed" | "new") =>
    status === "pending"
      ? "secondary"
      : status === "confirmed"
      ? "default"
      : "outline";

  const getCurrentWeekBookings = () => {
    const start = currentWeekStart;
    const end = addDays(start, 6);
    return (
      data?.getAllAppointmentBookings?.filter((booking) => {
        if (!booking.book?.startTime) return false;
        try {
          const d = parseISO(booking.book.startTime);
          return d >= start && d <= end;
        } catch {
          return false;
        }
      }) || []
    );
  };
  const currentWeekBookings = getCurrentWeekBookings();

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (error)
    return (
      <Card className="shadow-md rounded-2xl p-6 mt-4">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <X className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-destructive mb-2">
            Error Loading Bookings
          </h3>
          <p className="text-center text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );

  return (
    <>
      <Card className="shadow-lg rounded-xl border">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl">
            <CalendarHeader
              currentMonth={currentMonth}
              goToPreviousMonth={goToPreviousMonth}
              goToNextMonth={goToNextMonth}
              weekLabel={getWeekLabel()}
              goToPreviousWeek={goToPreviousWeek}
              goToNextWeek={goToNextWeek}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calendar">Weekly View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-0">
              <CalendarGrid
                weekDays={weekDays}
                currentMonth={currentMonth}
                bookingsByDate={bookingsByDate}
                onDayHeaderClick={handleDayHeaderClick}
                onBookingClick={handleBookingClick}
                workingHours={WORKING_HOURS}
                getBookingStatus={getBookingStatus}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <BookingList
                bookings={currentWeekBookings}
                getUserData={getUserData}
                getBookingStatus={getBookingStatus}
                onBookingClick={handleBookingClick}
                onContactClick={handleContactClick}
                onConfirmClick={handleConfirmBooking}
                onDeleteClick={handleDeleteBooking}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <BookingDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedDate={selectedDate}
        selectedDayBookings={selectedDayBookings}
        getUserData={getUserData}
        getBookingStatus={getBookingStatus}
        getStatusBadgeVariant={getStatusBadgeVariant}
        onCopyNumber={copyToClipboard}
        onContactClick={handleContactClick}
        onConfirmClick={handleConfirmBooking}
        onDeleteClick={handleDeleteBooking}
      />

      <ContactDialog
        isOpen={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        userName={selectedBooking?.usersData?.[0]?.name || "User"}
        message={contactMessage}
        onMessageChange={(e) => setContactMessage(e.target.value)}
        onSend={sendContactMessage}
      />

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteBooking}
      />
    </>
  );
}
