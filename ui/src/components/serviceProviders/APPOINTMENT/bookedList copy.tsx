import { useQuery, gql } from "@apollo/client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";

// GraphQL query
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

// Define types
interface Booking {
  book: {
    id: string;
    startTime: string;
    endTime: string;
    day: string;
    notes: string | null;
    userId: string;
    tableSize: number;
    userType: string;
  };
  usersData: {
    id: string;
    name: string;
    numberType: string;
    type: string;
    number: string;
  };
}

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WORKING_HOURS = {
  start: "00:00",
  end: "23:59",
};

export function AppointmentBookedMembers() {
  const { data, loading, error } = useQuery<{ getAllAppointmentBookings: Booking[] }>(GET_ALL_APPOINTMENT_BOOKINGS);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Something went wrong!</p>;

  const bookings = data?.getAllAppointmentBookings ?? [];

  const formatTime = (isoString: string) => {
    const date = parseISO(isoString);
    return format(date, "hh:mm a");
  };

  const handleDayClick = (day: string) => {
    setSelectedDay(day);
  };

  const usersForSelectedDay = bookings.filter((booking) => booking.book.day === selectedDay);

  return (
    <>
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <Card className="bg-white/95 shadow-md rounded-2xl p-6 mt-4">
          <CardContent>
            <div className="grid grid-cols-3 mt-3 gap-2 md:grid-cols-4 lg:grid-cols-3">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex flex-col">
                  <div
                    className="text-center font-medium py-2 bg-muted rounded-t-md cursor-pointer hover:bg-muted/70 transition"
                    onClick={() => handleDayClick(day)}
                  >
                    {day.substring(0, 3)}
                  </div>
                  <div className="border rounded-b-md p-2 h-32 overflow-y-auto">
                    {bookings
                      .filter((booking) => booking.book.day === day)
                      .map((booking) => {
                        const isFullDay =
                          booking.book.startTime === WORKING_HOURS.start &&
                          booking.book.endTime === WORKING_HOURS.end;
                        return (
                          <div
                            key={booking.book.id}
                            className="text-xs bg-destructive/10 text-destructive rounded p-1 mb-1"
                          >
                            {isFullDay
                              ? "Full Day"
                              : `${formatTime(booking.book.startTime)} - ${formatTime(booking.book.endTime)}`}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dialog Content when clicking on a day */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bookings for {selectedDay}</DialogTitle>
            <DialogDescription>
              {usersForSelectedDay.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {usersForSelectedDay.map((booking) => {
                    const user = booking.usersData;
                    return (
                      <div key={booking.book.id} className="text-sm border-b pb-2">
                        <div><strong>Name:</strong> {user.name ?? "Not provided"}</div>
                        <div><strong>Number:</strong> {user.number ?? "Not provided"}</div>
                        <div><strong>Number Type:</strong> {user.numberType ?? "Not provided"}</div>
                        <div><strong>Type:</strong> {user.type ?? "Not provided"}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Booking: {formatTime(booking.book.startTime)} - {formatTime(booking.book.endTime)}
                        </div>
                      </div>
            );        
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground mt-6">No bookings for this day.</p>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
