import React, { useState, useEffect } from "react";
import { format, addDays, isSameDay, isBefore, startOfDay } from "date-fns";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  XIcon,
  PlusIcon,
  MinusIcon,
  AlertCircleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import { gql, useQuery, useMutation } from "@apollo/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useAuth } from "@/middleware/context/authContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
const GET_ALL_UNAVAILABLE_PERIODS = gql`
  query GetAllUnavailablePeriods {
    getUnavailablePeriods {
      id
      day
      endTime
      startTime
    }
    getConfirmedBookingsAsUnavailable {
      id
      day
      endTime
      startTime
    }
  }
`;

// GraphQL queries and mutations
// const GET_UNAVAILABLE_PERIODS = gql`
//   query GetUnavailablePeriods {
//     getUnavailablePeriods {
//       id
//       day
//       endTime
//       startTime
//     }
//   }
// `;

// const GET_CONFIRMED_BOOKINGS_AS_UNAVAILABLE_PERIODS = gql`
//       query GetConfirmedBookingsAsUnavailable {
//     getConfirmedBookingsAsUnavailable {
//       id
//       day
//       endTime
//       startTime
//     }
//   }

// `;

const CREATE_MULTIPLE_BOOKINGS = gql`
  mutation CreateMultipleBookings(
    $input: [BookerInput!]!
    $serviceId: String!
  ) {
    createMultipleBookings(input: $input, serviceId: $serviceId) {
      id
      startTime
      endTime
    }
  }
`;

interface UserData {
  notes: string;
}

interface UnavailablePeriod {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface BookingSegment {
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  formattedDate?: string;
}

const defaultTimeSlots: string[] = [
  "1 am",
  "2 am",
  "3 am",
  "4 am",
  "5 am",
  "6 am",
  "7 am",
  "8 am",
  "9 am",
  "10 am",
  "11 am",
  "12 pm",
  "1 pm",
  "2 pm",
  "3 pm",
  "4 pm",
  "5 pm",
  "6 pm",
  "7 pm",
  "8 pm",
  "9 pm",
  "10 pm",
  "11 pm",
  "12 am",
];

// Convert 12-hour time format to 24-hour format
const convertTo24Hour = (time: string): number => {
  const [hourStr, period] = time.split(" ");
  let hour = parseInt(hourStr);

  if (period.toLowerCase() === "pm" && hour !== 12) {
    hour += 12;
  }
  if (period.toLowerCase() === "am" && hour === 12) {
    hour = 0;
  }

  return hour;
};

// Convert 24-hour format to 12-hour time string
const convertTo12Hour = (hour: number): string => {
  if (hour === 0) return "12 am";
  if (hour === 12) return "12 pm";
  if (hour < 12) return `${hour} am`;
  return `${hour - 12} pm`;
};

// Format time to ISO string format
const timeToISOString = (date: Date, timeStr: string): string => {
  const hour24 = convertTo24Hour(timeStr);
  const newDate = new Date(date);
  newDate.setHours(hour24, 0, 0, 0);
  return newDate.toISOString();
};

// Convert 24-hour time format (HH:MM) to a comparable number
const parseTimeString = (timeString: string): number => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 100 + minutes;
};

const AppointmentBookingSystem = ({
  isDialogOpenMain,
  setDialogOpenMain,
  serviceId, // Default service ID
}: {
  isDialogOpenMain: boolean;
  setDialogOpenMain: React.Dispatch<React.SetStateAction<boolean>>;
  serviceId?: string;
}) => {
  const today = startOfDay(new Date()); // Use startOfDay to remove time component
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { user } = useAuth();
  const userId = user?.id;
  // New states for the duration-based booking
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null
  );
  const [bookingDuration, setBookingDuration] = useState<number>(1); // in hours
  const [bookingSegments, setBookingSegments] = useState<BookingSegment[]>([]);

  const [tableSize, setTableSize] = useState<number>(1);
  const [timeSlots] = useState<string[]>(defaultTimeSlots);
  const [userData, setUserData] = useState<UserData>({
    notes: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [datesPerPage] = useState(7);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // New state to track which dates are included in the booking
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  // Add this to your state declarations at the top
  const [unavailableMessage, setUnavailableMessage] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<
    UnavailablePeriod[]
  >([]);
  //
  // Fetch unavailable periods from the GraphQL API
  // const { data } = useQuery(GET_UNAVAILABLE_PERIODS);
  // const unavailablePeriods: UnavailablePeriod[] =
  //   data?.getUnavailablePeriods || [];
  const { data } = useQuery(GET_ALL_UNAVAILABLE_PERIODS);

  // Then in your component:
  useEffect(() => {
    if (data) {
      // Manual unavailable periods are already in HH:MM format
      const manualUnavailablePeriods = data.getUnavailablePeriods || [];

      // Convert booking times from ISO to HH:MM format
      const bookingUnavailablePeriods: UnavailablePeriod[] = (
        data.getConfirmedBookingsAsUnavailable || []
      ).map((booking: {
        id: string;
        day: string;
        startTime: string;
        endTime: string;
      }): UnavailablePeriod => {
        // Parse ISO strings to Date objects
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);

        // Convert to HH:MM format
        const startTime =
          startDate.getHours().toString().padStart(2, "0") +
          ":" +
          startDate.getMinutes().toString().padStart(2, "0");
        const endTime =
          endDate.getHours().toString().padStart(2, "0") +
          ":" +
          endDate.getMinutes().toString().padStart(2, "0");

        return {
          id: booking.id,
          day: booking.day, // Using the day string from the API
          startTime,
          endTime,
        };
      });

      // Combine both arrays
      const allUnavailablePeriods = [
        ...manualUnavailablePeriods,
        ...bookingUnavailablePeriods,
      ];

      // Update your state with combined data
      setUnavailablePeriods(allUnavailablePeriods);
    }
  }, [data]);
  // Create bookings mutation
  const [createMultipleBookings, { loading: bookingLoading }] = useMutation(
    CREATE_MULTIPLE_BOOKINGS,
    {
      onCompleted: () => {
        toast.success("Bookings created successfully!");

        setSuccessMessage("Bookings created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setBookingSegments([]);
        setSelectedStartTime(null);
        setBookedDates([]);
        setDialogOpenMain(false);
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);

        setErrorMessage(`Error: ${error.message}`);
        setTimeout(() => setErrorMessage(""), 5000);
      },
    }
  );

  // Generate dates for the current view, starting from today
  useEffect(() => {
    const newDates = [];
    for (let i = 0; i < 14; i++) {
      newDates.push(addDays(currentDate, i));
    }

    // Set visible dates (first page)
    setVisibleDates(newDates.slice(0, datesPerPage));
  }, [currentDate, datesPerPage]);

  // Update booked dates whenever booking segments change
  useEffect(() => {
    const dates = bookingSegments.map((segment) => segment.startDate);
    setBookedDates(dates);
  }, [bookingSegments]);

  const handlePreviousWeek = (): void => {
    const newDate = addDays(currentDate, -7);
    // Don't allow navigating to dates before today
    if (!isBefore(newDate, today)) {
      setCurrentDate(newDate);
    }
  };

  const handleNextWeek = (): void => {
    setCurrentDate((prevDate) => addDays(prevDate, 7));
  };
  const EnddurationTimer = 12;
  // Check if a slot falls within unavailable periods
  const isSlotUnavailable = (day: Date, time: string): boolean => {
    // Check if the day matches any unavailable period
    const dayOfWeek = format(day, "EEEE"); // Get full day name (Monday, Tuesday, etc.)

    // Convert the time slot to 24-hour format
    const hour24 = convertTo24Hour(time);

    // Check if this time slot falls within any unavailable period
    return unavailablePeriods.some((period) => {
      // Check if day matches
      if (period.day !== dayOfWeek) return false;

      // Parse start and end times
      const periodStart = parseTimeString(period.startTime);
      const periodEnd = parseTimeString(period.endTime);

      // Convert the time slot's hour to a comparable format
      const slotTime = hour24 * 100;

      // Check if the slot falls within the unavailable period
      return slotTime >= periodStart && slotTime < periodEnd;
    });
  };

  // Find the next unavailable period after a given time
  const findNextUnavailablePeriod = (
    day: Date,
    startTimeStr: string
  ): { startHour: number; endHour: number } | null => {
    const dayOfWeek = format(day, "EEEE");
    const startHour = convertTo24Hour(startTimeStr);

    // Find unavailable periods on this day that start after the given time
    const relevantPeriods = unavailablePeriods
      .filter((period) => period.day === dayOfWeek)
      .map((period) => {
        const [startHourStr, startMinStr] = period.startTime.split(":");
        const [endHourStr, endMinStr] = period.endTime.split(":");
        return {
          startHour: parseInt(startHourStr),
          startMin: parseInt(startMinStr),
          endHour: parseInt(endHourStr),
          endMin: parseInt(endMinStr),
        };
      })
      .filter(
        (period) =>
          period.startHour > startHour ||
          (period.startHour === startHour && period.startMin > 0)
      );

    if (relevantPeriods.length === 0) return null;

    // Find the earliest unavailable period
    relevantPeriods.sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      return a.startMin - b.startMin;
    });

    const nextPeriod = relevantPeriods[0];
    return {
      startHour: nextPeriod.startHour,
      endHour: nextPeriod.endHour,
    };
  };

  // Calculate booking segments based on start time and duration
  const calculateBookingSegments = (
    day: Date,
    startTimeStr: string,
    durationHours: number
  ): BookingSegment[] => {
    const segments: BookingSegment[] = [];
    const startHour = convertTo24Hour(startTimeStr);
    let remainingHours = durationHours;
    let currentStartHour = startHour;

    // Clone the date to avoid modifying the original
    const dayClone = new Date(day);

    while (remainingHours > 0) {
      // Find the next unavailable period
      const nextUnavailable = findNextUnavailablePeriod(
        dayClone,
        convertTo12Hour(currentStartHour)
      );

      // If no unavailable period or it's beyond our remaining duration, we can book the full remaining time
      if (
        !nextUnavailable ||
        currentStartHour + remainingHours <= nextUnavailable.startHour
      ) {
        const endHour = currentStartHour + remainingHours;

        // Create new Date objects to avoid reference issues
        const segmentStartDate = new Date(dayClone);
        segmentStartDate.setHours(currentStartHour, 0, 0, 0);

        const segmentEndDate = new Date(dayClone);
        segmentEndDate.setHours(endHour, 0, 0, 0);

        segments.push({
          startTime: convertTo12Hour(currentStartHour),
          endTime: convertTo12Hour(endHour),
          startDate: segmentStartDate,
          endDate: segmentEndDate,
          formattedDate: format(dayClone, "EEE, MMM d"),
        });
        remainingHours = 0;
      } else {
        // We need to split the booking
        const segmentDuration = nextUnavailable.startHour - currentStartHour;
        if (segmentDuration > 0) {
          // Create new Date objects to avoid reference issues
          const segmentStartDate = new Date(dayClone);
          segmentStartDate.setHours(currentStartHour, 0, 0, 0);

          const segmentEndDate = new Date(dayClone);
          segmentEndDate.setHours(nextUnavailable.startHour, 0, 0, 0);

          // Add segment until unavailable period starts
          segments.push({
            startTime: convertTo12Hour(currentStartHour),
            endTime: convertTo12Hour(nextUnavailable.startHour),
            startDate: segmentStartDate,
            endDate: segmentEndDate,
            formattedDate: format(dayClone, "EEE, MMM d"),
          });
          remainingHours -= segmentDuration;
        }

        // Update start time to after the unavailable period
        currentStartHour = nextUnavailable.endHour;
      }
    }

    return segments;
  };

  // Check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    return isBefore(date, today);
  };

  // Check if the slot time is in the past for today's date
  const isSlotInPast = (day: Date, time: string): boolean => {
    if (!isSameDay(day, today)) return false;

    // For today, check if the time has already passed
    const currentHour = new Date().getHours();
    const slotHour = parseInt(time.replace(/[^0-9]/g, ""));
    const isPM = time.toLowerCase().includes("pm");
    const slot24Hour =
      slotHour === 12 ? (isPM ? 12 : 0) : isPM ? slotHour + 12 : slotHour;

    return slot24Hour <= currentHour;
  };

  // Check if a date is included in a booking segment
  const isDateBooked = (date: Date): boolean => {
    return bookedDates.some((bookedDate) => isSameDay(bookedDate, date));
  };

  // Handle time slot selection (now for start time only)
  const handleTimeSlotClick = (time: string): void => {
    if (selectedDate) {
      // Clear any previous unavailable message first
      setUnavailableMessage("");

      // Check if time is in past
      if (isSlotInPast(selectedDate, time)) {
        return; // Don't do anything for past times
      }

      // Check if time is unavailable
      if (isSlotUnavailable(selectedDate, time)) {
        // Show message that the service provider is not available
        setUnavailableMessage(
          `Sorry, the service provider is not available at ${time} on ${format(
            selectedDate,
            "MMMM d"
          )}.`
        );

        return;
      }

      if (selectedStartTime === time) {
        // Deselect if already selected
        setSelectedStartTime(null);
        setBookingSegments([]);
        setBookedDates([]);
      } else {
        // Set as new start time
        setSelectedStartTime(time);
        // Calculate booking segments based on duration
        const segments = calculateBookingSegments(
          new Date(selectedDate),
          time,
          bookingDuration
        );
        setBookingSegments(segments);
      }
    }
  };

  // Handle duration change with plus and minus buttons
  const increaseDuration = (): void => {
    if (bookingDuration < EnddurationTimer) {
      const newDuration = bookingDuration + 1;
      setBookingDuration(newDuration);
      if (selectedStartTime && selectedDate) {
        // Recalculate booking segments with new duration
        const segments = calculateBookingSegments(
          new Date(selectedDate),
          selectedStartTime,
          newDuration
        );
        setBookingSegments(segments);
      }
    }
  };

  const decreaseDuration = (): void => {
    if (bookingDuration > 1) {
      const newDuration = bookingDuration - 1;
      setBookingDuration(newDuration);
      if (selectedStartTime && selectedDate) {
        // Recalculate booking segments with new duration
        const segments = calculateBookingSegments(
          new Date(selectedDate),
          selectedStartTime,
          newDuration
        );
        setBookingSegments(segments);
      }
    }
  };

  // Remove a specific booking segment
  const removeBookingSegment = (index: number): void => {
    setBookingSegments((prevSegments) => {
      const newSegments = [...prevSegments];
      newSegments.splice(index, 1);
      return newSegments;
    });
  };

  const handleDateSelect = (date: Date): void => {
    if (!isDateInPast(date)) {
      setSelectedDate(date);
      // Reset selections when date changes
      setSelectedStartTime(null);
      setBookingSegments([]);
      setBookedDates([]);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const proceedToBookingDetails = (): void => {
    if (bookingSegments.length === 0) {
      setErrorMessage("Please select a start time and duration");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsDialogOpen(true);
  };

  const confirmBooking = (): void => {
    if (bookingSegments.length === 0) {
      setErrorMessage("Please select a start time and duration");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (!userId || !user?.type) {
      setErrorMessage("User information is missing. Please log in again.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (!serviceId) {
      setErrorMessage("Service ID is missing. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Prepare booking inputs
    const bookingInputs = bookingSegments.map((segment) => ({
      startTime: timeToISOString(segment.startDate, segment.startTime),
      endTime: timeToISOString(segment.endDate, segment.endTime),
      notes: userData.notes,
      tableSize: tableSize,
      userId: userId,
      userType: user.type,
    }));
    console.log("variables", {
      input: bookingInputs,
      serviceId: serviceId,
    });
    // Call the mutation - uncomment this to actually make the booking
    createMultipleBookings({
      variables: {
        input: bookingInputs,
        serviceId: serviceId,
      },
    });

    setIsDialogOpen(false);
  };
  //
  // Compact date selector component
  const CompactDateSelector = () => {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Button
            onClick={handlePreviousWeek}
            variant="outline"
            size="icon"
            disabled={isSameDay(currentDate, today)}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium">
            {format(currentDate, "MMMM d, yyyy")}
          </h3>
          <Button onClick={handleNextWeek} variant="outline" size="icon">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {visibleDates.map((date) => {
            const isPastDate = isDateInPast(date);
            const isBooked = isDateBooked(date);
            const isSelected = selectedDate && isSameDay(selectedDate, date);

            return (
              <div
                key={date.toString()}
                onClick={() => !isPastDate && handleDateSelect(date)}
                className={cn(
                  "p-2 text-center rounded-md text-xs font-medium transition-colors",
                  {
                    "text-muted-foreground cursor-not-allowed": isPastDate,
                    "bg-muted border border-primary cursor-pointer": isBooked,
                    "bg-primary text-primary-foreground cursor-pointer":
                      isSelected,
                    "hover:bg-muted cursor-pointer":
                      !isPastDate && !isSelected && !isBooked,
                  }
                )}
              >
                <div>{format(date, "EEE")}</div>
                <div>{format(date, "d")}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Dialog open={isDialogOpenMain} onOpenChange={setDialogOpenMain}>
        <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Date & Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <Card className="shadow-sm pt-3">
              <CardContent>
                {/* Compact Date Selector */}
                <CompactDateSelector />

                {/* Time Selection Section */}
                {selectedDate && (
                  <div className="space-y-4">
                    {/* Start Time Selection */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Select a start time for {format(selectedDate, "MMMM d")}
                      </h3>

                      <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {timeSlots.map((time) => {
                          const isPast = isSlotInPast(selectedDate, time);
                          const isUnavailable = isSlotUnavailable(
                            selectedDate,
                            time
                          );
                          const isSelected = selectedStartTime === time;

                          return (
                            <div
                              key={time}
                              onClick={() =>
                                !isPast &&
                                !isUnavailable &&
                                handleTimeSlotClick(time)
                              }
                              className={cn(
                                "p-2 text-center rounded-lg border text-sm transition-colors",
                                {
                                  "text-muted-foreground border-border bg-muted cursor-not-allowed":
                                    isPast,
                                  "text-accent border-destructive bg-destructive/20 cursor-not-allowed":
                                    isUnavailable,
                                  "text-primary-foreground bg-primary border-primary cursor-pointer":
                                    isSelected,
                                  "text-primary hover:bg-muted border-border cursor-pointer":
                                    !isPast && !isUnavailable && !isSelected,
                                }
                              )}
                            >
                              {time}
                            </div>
                          );
                        })}
                      </div>

                      {/* Display unavailability message */}
                      {unavailableMessage && (
                        <Dialog
                          open
                          onOpenChange={() => setUnavailableMessage("")}
                        >
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Unavailable Slot</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 flex items-center">
                              <AlertCircleIcon className="h-6 w-6 text-destructive mr-2" />
                              <p className="text-sm">{unavailableMessage}</p>
                            </div>
                            <DialogFooter>
                              <Button onClick={() => setUnavailableMessage("")}>
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Duration Selection with Plus/Minus Buttons */}
                    {selectedStartTime && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-3">
                          Select Duration (hours)
                        </h3>
                        <div className="flex items-center justify-center space-x-4">
                          <Button
                            onClick={decreaseDuration}
                            variant="outline"
                            size="icon"
                            disabled={bookingDuration <= 1}
                            className="h-10 w-10"
                          >
                            <MinusIcon className="h-5 w-5" />
                          </Button>

                          <div className="text-center font-medium w-16">
                            {bookingDuration}{" "}
                            {bookingDuration === 1 ? "hour" : "hours"}
                          </div>

                          <Button
                            onClick={increaseDuration}
                            variant="outline"
                            size="icon"
                            disabled={bookingDuration >= EnddurationTimer}
                            className="h-10 w-10"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Booking Segments Display */}
                {bookingSegments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">
                      Your Booking Segments
                    </h3>
                    <div className="space-y-2">
                      {bookingSegments.map((segment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-primary/10 p-3 rounded-lg border border-primary/20"
                        >
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span>
                              {segment.formattedDate}: {segment.startTime} -{" "}
                              {segment.endTime}
                            </span>
                          </div>
                          {index > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBookingSegment(index)}
                              className="h-8 w-8 p-0"
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setDialogOpenMain(false)}>
              Cancel
            </Button>
            <Button
              onClick={proceedToBookingDetails}
              disabled={bookingSegments.length === 0}
            >
              Continue with {bookingSegments.length}{" "}
              {bookingSegments.length === 1 ? "segment" : "segments"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CompleteBooking
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        bookingSegments={bookingSegments}
        userData={userData}
        tableSize={tableSize}
        confirmBooking={confirmBooking}
        bookingLoading={bookingLoading}
        handleUserChange={handleUserChange}
        setTableSize={setTableSize}
      />
    </div>
  );
};

export default AppointmentBookingSystem;

export const LandingAppointmentBookingSystem = ({
 
  serviceId, 
}: {

  serviceId?: string;
}) => {
  const today = startOfDay(new Date()); // Use startOfDay to remove time component
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { user } = useAuth();
  const userId = user?.id;
  // New states for the duration-based booking
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null
  );
  const [bookingDuration, setBookingDuration] = useState<number>(1); // in hours
  const [bookingSegments, setBookingSegments] = useState<BookingSegment[]>([]);

  const [tableSize, setTableSize] = useState<number>(1);
  const [timeSlots] = useState<string[]>(defaultTimeSlots);
  const [userData, setUserData] = useState<UserData>({
    notes: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [datesPerPage] = useState(7);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // New state to track which dates are included in the booking
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  // Add this to your state declarations at the top
  const [unavailableMessage, setUnavailableMessage] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<
    UnavailablePeriod[]
  >([]);
  //
  // Fetch unavailable periods from the GraphQL API
  // const { data } = useQuery(GET_UNAVAILABLE_PERIODS);
  // const unavailablePeriods: UnavailablePeriod[] =
  //   data?.getUnavailablePeriods || [];
  const { data } = useQuery(GET_ALL_UNAVAILABLE_PERIODS);

  // Then in your component:
  useEffect(() => {
    if (data) {
      // Manual unavailable periods are already in HH:MM format
      const manualUnavailablePeriods = data.getUnavailablePeriods || [];

      // Convert booking times from ISO to HH:MM format
      const bookingUnavailablePeriods: UnavailablePeriod[] = (
        data.getConfirmedBookingsAsUnavailable || []
      ).map((booking: {
        id: string;
        day: string;
        startTime: string;
        endTime: string;
      }): UnavailablePeriod => {
        // Parse ISO strings to Date objects
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);

        // Convert to HH:MM format
        const startTime =
          startDate.getHours().toString().padStart(2, "0") +
          ":" +
          startDate.getMinutes().toString().padStart(2, "0");
        const endTime =
          endDate.getHours().toString().padStart(2, "0") +
          ":" +
          endDate.getMinutes().toString().padStart(2, "0");

        return {
          id: booking.id,
          day: booking.day, // Using the day string from the API
          startTime,
          endTime,
        };
      });

      // Combine both arrays
      const allUnavailablePeriods = [
        ...manualUnavailablePeriods,
        ...bookingUnavailablePeriods,
      ];

      // Update your state with combined data
      setUnavailablePeriods(allUnavailablePeriods);
    }
  }, [data]);
  // Create bookings mutation
  const [createMultipleBookings, { loading: bookingLoading }] = useMutation(
    CREATE_MULTIPLE_BOOKINGS,
    {
      onCompleted: () => {
        toast.success("Bookings created successfully!");

        setSuccessMessage("Bookings created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setBookingSegments([]);
        setSelectedStartTime(null);
        setBookedDates([]);
        // setDialogOpenMain(false);
      },
      onError: (error) => {
        toast.error(`Error: ${error.message}`);

        setErrorMessage(`Error: ${error.message}`);
        setTimeout(() => setErrorMessage(""), 5000);
      },
    }
  );

  // Generate dates for the current view, starting from today
  useEffect(() => {
    const newDates = [];
    for (let i = 0; i < 14; i++) {
      newDates.push(addDays(currentDate, i));
    }

    // Set visible dates (first page)
    setVisibleDates(newDates.slice(0, datesPerPage));
  }, [currentDate, datesPerPage]);

  // Update booked dates whenever booking segments change
  useEffect(() => {
    const dates = bookingSegments.map((segment) => segment.startDate);
    setBookedDates(dates);
  }, [bookingSegments]);

  const handlePreviousWeek = (): void => {
    const newDate = addDays(currentDate, -7);
    // Don't allow navigating to dates before today
    if (!isBefore(newDate, today)) {
      setCurrentDate(newDate);
    }
  };

  const handleNextWeek = (): void => {
    setCurrentDate((prevDate) => addDays(prevDate, 7));
  };
  const EnddurationTimer = 12;
  // Check if a slot falls within unavailable periods
  const isSlotUnavailable = (day: Date, time: string): boolean => {
    // Check if the day matches any unavailable period
    const dayOfWeek = format(day, "EEEE"); // Get full day name (Monday, Tuesday, etc.)

    // Convert the time slot to 24-hour format
    const hour24 = convertTo24Hour(time);

    // Check if this time slot falls within any unavailable period
    return unavailablePeriods.some((period) => {
      // Check if day matches
      if (period.day !== dayOfWeek) return false;

      // Parse start and end times
      const periodStart = parseTimeString(period.startTime);
      const periodEnd = parseTimeString(period.endTime);

      // Convert the time slot's hour to a comparable format
      const slotTime = hour24 * 100;

      // Check if the slot falls within the unavailable period
      return slotTime >= periodStart && slotTime < periodEnd;
    });
  };

  // Find the next unavailable period after a given time
  const findNextUnavailablePeriod = (
    day: Date,
    startTimeStr: string
  ): { startHour: number; endHour: number } | null => {
    const dayOfWeek = format(day, "EEEE");
    const startHour = convertTo24Hour(startTimeStr);

    // Find unavailable periods on this day that start after the given time
    const relevantPeriods = unavailablePeriods
      .filter((period) => period.day === dayOfWeek)
      .map((period) => {
        const [startHourStr, startMinStr] = period.startTime.split(":");
        const [endHourStr, endMinStr] = period.endTime.split(":");
        return {
          startHour: parseInt(startHourStr),
          startMin: parseInt(startMinStr),
          endHour: parseInt(endHourStr),
          endMin: parseInt(endMinStr),
        };
      })
      .filter(
        (period) =>
          period.startHour > startHour ||
          (period.startHour === startHour && period.startMin > 0)
      );

    if (relevantPeriods.length === 0) return null;

    // Find the earliest unavailable period
    relevantPeriods.sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      return a.startMin - b.startMin;
    });

    const nextPeriod = relevantPeriods[0];
    return {
      startHour: nextPeriod.startHour,
      endHour: nextPeriod.endHour,
    };
  };

  // Calculate booking segments based on start time and duration
  const calculateBookingSegments = (
    day: Date,
    startTimeStr: string,
    durationHours: number
  ): BookingSegment[] => {
    const segments: BookingSegment[] = [];
    const startHour = convertTo24Hour(startTimeStr);
    let remainingHours = durationHours;
    let currentStartHour = startHour;

    // Clone the date to avoid modifying the original
    const dayClone = new Date(day);

    while (remainingHours > 0) {
      // Find the next unavailable period
      const nextUnavailable = findNextUnavailablePeriod(
        dayClone,
        convertTo12Hour(currentStartHour)
      );

      // If no unavailable period or it's beyond our remaining duration, we can book the full remaining time
      if (
        !nextUnavailable ||
        currentStartHour + remainingHours <= nextUnavailable.startHour
      ) {
        const endHour = currentStartHour + remainingHours;

        // Create new Date objects to avoid reference issues
        const segmentStartDate = new Date(dayClone);
        segmentStartDate.setHours(currentStartHour, 0, 0, 0);

        const segmentEndDate = new Date(dayClone);
        segmentEndDate.setHours(endHour, 0, 0, 0);

        segments.push({
          startTime: convertTo12Hour(currentStartHour),
          endTime: convertTo12Hour(endHour),
          startDate: segmentStartDate,
          endDate: segmentEndDate,
          formattedDate: format(dayClone, "EEE, MMM d"),
        });
        remainingHours = 0;
      } else {
        // We need to split the booking
        const segmentDuration = nextUnavailable.startHour - currentStartHour;
        if (segmentDuration > 0) {
          // Create new Date objects to avoid reference issues
          const segmentStartDate = new Date(dayClone);
          segmentStartDate.setHours(currentStartHour, 0, 0, 0);

          const segmentEndDate = new Date(dayClone);
          segmentEndDate.setHours(nextUnavailable.startHour, 0, 0, 0);

          // Add segment until unavailable period starts
          segments.push({
            startTime: convertTo12Hour(currentStartHour),
            endTime: convertTo12Hour(nextUnavailable.startHour),
            startDate: segmentStartDate,
            endDate: segmentEndDate,
            formattedDate: format(dayClone, "EEE, MMM d"),
          });
          remainingHours -= segmentDuration;
        }

        // Update start time to after the unavailable period
        currentStartHour = nextUnavailable.endHour;
      }
    }

    return segments;
  };

  // Check if a date is in the past
  const isDateInPast = (date: Date): boolean => {
    return isBefore(date, today);
  };

  // Check if the slot time is in the past for today's date
  const isSlotInPast = (day: Date, time: string): boolean => {
    if (!isSameDay(day, today)) return false;

    // For today, check if the time has already passed
    const currentHour = new Date().getHours();
    const slotHour = parseInt(time.replace(/[^0-9]/g, ""));
    const isPM = time.toLowerCase().includes("pm");
    const slot24Hour =
      slotHour === 12 ? (isPM ? 12 : 0) : isPM ? slotHour + 12 : slotHour;

    return slot24Hour <= currentHour;
  };

  // Check if a date is included in a booking segment
  const isDateBooked = (date: Date): boolean => {
    return bookedDates.some((bookedDate) => isSameDay(bookedDate, date));
  };

  // Handle time slot selection (now for start time only)
  const handleTimeSlotClick = (time: string): void => {
    if (selectedDate) {
      // Clear any previous unavailable message first
      setUnavailableMessage("");

      // Check if time is in past
      if (isSlotInPast(selectedDate, time)) {
        return; // Don't do anything for past times
      }

      // Check if time is unavailable
      if (isSlotUnavailable(selectedDate, time)) {
        // Show message that the service provider is not available
        setUnavailableMessage(
          `Sorry, the service provider is not available at ${time} on ${format(
            selectedDate,
            "MMMM d"
          )}.`
        );

        return;
      }

      if (selectedStartTime === time) {
        // Deselect if already selected
        setSelectedStartTime(null);
        setBookingSegments([]);
        setBookedDates([]);
      } else {
        // Set as new start time
        setSelectedStartTime(time);
        // Calculate booking segments based on duration
        const segments = calculateBookingSegments(
          new Date(selectedDate),
          time,
          bookingDuration
        );
        setBookingSegments(segments);
      }
    }
  };

  // Handle duration change with plus and minus buttons
  const increaseDuration = (): void => {
    if (bookingDuration < EnddurationTimer) {
      const newDuration = bookingDuration + 1;
      setBookingDuration(newDuration);
      if (selectedStartTime && selectedDate) {
        // Recalculate booking segments with new duration
        const segments = calculateBookingSegments(
          new Date(selectedDate),
          selectedStartTime,
          newDuration
        );
        setBookingSegments(segments);
      }
    }
  };

  const decreaseDuration = (): void => {
    if (bookingDuration > 1) {
      const newDuration = bookingDuration - 1;
      setBookingDuration(newDuration);
      if (selectedStartTime && selectedDate) {
        // Recalculate booking segments with new duration
        const segments = calculateBookingSegments(
          new Date(selectedDate),
          selectedStartTime,
          newDuration
        );
        setBookingSegments(segments);
      }
    }
  };

  // Remove a specific booking segment
  const removeBookingSegment = (index: number): void => {
    setBookingSegments((prevSegments) => {
      const newSegments = [...prevSegments];
      newSegments.splice(index, 1);
      return newSegments;
    });
  };

  const handleDateSelect = (date: Date): void => {
    if (!isDateInPast(date)) {
      setSelectedDate(date);
      // Reset selections when date changes
      setSelectedStartTime(null);
      setBookingSegments([]);
      setBookedDates([]);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const proceedToBookingDetails = (): void => {
    if (bookingSegments.length === 0) {
      setErrorMessage("Please select a start time and duration");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsDialogOpen(true);
  };

  const confirmBooking = (): void => {
    if (bookingSegments.length === 0) {
      setErrorMessage("Please select a start time and duration");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (!userId || !user?.type) {
      setErrorMessage("User information is missing. Please log in again.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (!serviceId) {
      setErrorMessage("Service ID is missing. Please try again.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    // Prepare booking inputs
    const bookingInputs = bookingSegments.map((segment) => ({
      startTime: timeToISOString(segment.startDate, segment.startTime),
      endTime: timeToISOString(segment.endDate, segment.endTime),
      notes: userData.notes,
      tableSize: tableSize,
      userId: userId,
      userType: user.type,
    }));
    console.log("variables", {
      input: bookingInputs,
      serviceId: serviceId,
    });
    // Call the mutation - uncomment this to actually make the booking
    createMultipleBookings({
      variables: {
        input: bookingInputs,
        serviceId: serviceId,
      },
    });

    setIsDialogOpen(false);
  };
  //
  // Compact date selector component
  const CompactDateSelector = () => {
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Button
            onClick={handlePreviousWeek}
            variant="outline"
            size="icon"
            disabled={isSameDay(currentDate, today)}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium">
            {format(currentDate, "MMMM d, yyyy")}
          </h3>
          <Button onClick={handleNextWeek} variant="outline" size="icon">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {visibleDates.map((date) => {
            const isPastDate = isDateInPast(date);
            const isBooked = isDateBooked(date);
            const isSelected = selectedDate && isSameDay(selectedDate, date);

            return (
              <div
                key={date.toString()}
                onClick={() => !isPastDate && handleDateSelect(date)}
                className={cn(
                  "p-2 text-center rounded-md text-xs font-medium transition-colors",
                  {
                    "text-muted-foreground cursor-not-allowed": isPastDate,
                    "bg-muted border border-primary cursor-pointer": isBooked,
                    "bg-primary text-primary-foreground cursor-pointer":
                      isSelected,
                    "hover:bg-muted cursor-pointer":
                      !isPastDate && !isSelected && !isBooked,
                  }
                )}
              >
                <div>{format(date, "EEE")}</div>
                <div>{format(date, "d")}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <Card className="sm:max-w-lg mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Select Date & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
  
          {successMessage && (
            <Alert>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
  
          {/* Compact Date Selector */}
          <CompactDateSelector />
  
          {/* Time Selection Section */}
          {selectedDate && (
            <div className="space-y-4">
              {/* Start Time Selection */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2" />
                  Select a start time for {format(selectedDate, "MMMM d")}
                </h3>
  
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {timeSlots.map((time) => {
                    const isPast = isSlotInPast(selectedDate, time);
                    const isUnavailable = isSlotUnavailable(
                      selectedDate,
                      time
                    );
                    const isSelected = selectedStartTime === time;
  
                    return (
                      <div
                        key={time}
                        onClick={() =>
                          !isPast &&
                          !isUnavailable &&
                          handleTimeSlotClick(time)
                        }
                        className={cn(
                          "p-2 text-center rounded-lg border text-sm transition-colors",
                          {
                            "text-muted-foreground border-border bg-muted cursor-not-allowed":
                              isPast,
                            "text-accent border-destructive bg-destructive/20 cursor-not-allowed":
                              isUnavailable,
                            "text-primary-foreground bg-primary border-primary cursor-pointer":
                              isSelected,
                            "text-primary hover:bg-muted border-border cursor-pointer":
                              !isPast && !isUnavailable && !isSelected,
                          }
                        )}
                      >
                        {time}
                      </div>
                    );
                  })}
                </div>
  
                {/* Display unavailability message */}
                {unavailableMessage && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircleIcon className="h-4 w-4 mr-2" />
                    <AlertDescription>{unavailableMessage}</AlertDescription>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto" 
                      onClick={() => setUnavailableMessage("")}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </Alert>
                )}
              </div>
  
              {/* Duration Selection with Plus/Minus Buttons */}
              {selectedStartTime && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-3">
                    Select Duration (hours)
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={decreaseDuration}
                      variant="outline"
                      size="icon"
                      disabled={bookingDuration <= 1}
                      className="h-10 w-10"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </Button>
  
                    <div className="text-center font-medium w-16">
                      {bookingDuration}{" "}
                      {bookingDuration === 1 ? "hour" : "hours"}
                    </div>
  
                    <Button
                      onClick={increaseDuration}
                      variant="outline"
                      size="icon"
                      disabled={bookingDuration >= EnddurationTimer}
                      className="h-10 w-10"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
  
          {/* Booking Segments Display */}
          {bookingSegments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">
                Your Booking Segments
              </h3>
              <div className="space-y-2">
                {bookingSegments.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-primary/10 p-3 rounded-lg border border-primary/20"
                  >
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-primary" />
                      <span>
                        {segment.formattedDate}: {segment.startTime} -{" "}
                        {segment.endTime}
                      </span>
                    </div>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBookingSegment(index)}
                        className="h-8 w-8 p-0"
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            onClick={proceedToBookingDetails}
            disabled={bookingSegments.length === 0}
          >
            Continue with {bookingSegments.length}{" "}
            {bookingSegments.length === 1 ? "segment" : "segments"}
          </Button>
        </CardFooter>
      </Card>
      <CompleteBooking
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        bookingSegments={bookingSegments}
        userData={userData}
        tableSize={tableSize}
        confirmBooking={confirmBooking}
        bookingLoading={bookingLoading}
        handleUserChange={handleUserChange}
        setTableSize={setTableSize}
      />
    </div>
  );
};
function CompleteBooking({
  isDialogOpen,
  setIsDialogOpen,
  bookingSegments,
  userData,
  tableSize,
  confirmBooking,
  bookingLoading,
  handleUserChange,
  setTableSize,
}: {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  bookingSegments: BookingSegment[];
  userData: UserData;
  tableSize: number;
  confirmBooking: () => void;
  bookingLoading: boolean;
  handleUserChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setTableSize: React.Dispatch<React.SetStateAction<number>>;
}) {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Booking</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="bg-secondary-foreground/20 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm">Your Booking Times:</h4>
            {bookingSegments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm">
                  {segment.formattedDate}: {segment.startTime} -{" "}
                  {segment.endTime}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="tableSize" className="text-sm">
                Table Size (People)
              </Label>
              <select
                id="tableSize"
                className="flex h-10 w-full rounded-md border border-secondary-foreground/40 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={tableSize}
                onChange={(e) => setTableSize(parseInt(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                  <option key={size} value={size}>
                    {size} {size === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-sm">
                Special Requests (optional)
              </Label>
              <Textarea
                id="notes"
                name="notes"
                value={userData.notes}
                onChange={()=>handleUserChange}
                // onChange={handleUserChange}
                className="h-10 w-full rounded-md border border-secondary-foreground/40 bg-background px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            className="w-full sm:w-auto"
            onClick={confirmBooking}
            disabled={bookingLoading}
          >
            {bookingLoading ? "Processing..." : "Confirm Booking"}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setIsDialogOpen(false)}
          >
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
