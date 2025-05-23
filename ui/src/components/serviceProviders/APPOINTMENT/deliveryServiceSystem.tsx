import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
// import { useAuth } from '../context/AuthContext';
// useAuth
import { format, addDays, startOfDay, isBefore, isSameDay } from 'date-fns';
// import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CalendarIcon,
  AlertCircleIcon,
  MinusIcon,
  PlusIcon,
} from 'lucide-react';

// import { convertTo24Hour, convertTo12Hour, parseTimeString, timeToISOString } from '../utils/timeHelpers';
import { defaultTimeSlots } from '../constants/timeSlots';
import CompleteDeliveryOrder from './CompleteDeliveryOrder';
import { useAuth } from '@/middleware/context/authContext';
import { cn } from '@/lib/utils';

// Types
type UserData = {
  notes: string;
};

type UnavailablePeriod = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
};

type DeliverySegment = {
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  formattedDate: string;
};

const DeliveryServiceSystem = ({
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
  
  // States for the delivery system
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [deliveryWaitTime, setDeliveryWaitTime] = useState<number>(1); // in hours, until rider arrives
  const [deliverySegments, setDeliverySegments] = useState<DeliverySegment[]>([]);

  const [orderSize, setOrderSize] = useState<number>(1); // Number of items/packages
  const [timeSlots] = useState<string[]>(defaultTimeSlots);
  const [userData, setUserData] = useState<UserData>({
    notes: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [datesPerPage] = useState(7);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Tracking which dates are included in the delivery
  const [deliveryDates, setDeliveryDates] = useState<Date[]>([]);
  const [unavailableMessage, setUnavailableMessage] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>([]);
  
  const { data } = useQuery(GET_ALL_UNAVAILABLE_PERIODS);

  // Process unavailable periods from API
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

      // Update state with combined data
      setUnavailablePeriods(allUnavailablePeriods);
    }
  }, [data]);
  
  // Create delivery orders mutation
  const [createMultipleBookings, { loading: orderLoading }] = useMutation(
    CREATE_MULTIPLE_BOOKINGS,
    {
      onCompleted: () => {
        toast.success("Delivery order created successfully!");

        setSuccessMessage("Delivery order created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
        setDeliverySegments([]);
        setSelectedStartTime(null);
        setDeliveryDates([]);
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

  // Update delivery dates whenever segments change
  useEffect(() => {
    const dates = deliverySegments.map((segment) => segment.startDate);
    setDeliveryDates(dates);
  }, [deliverySegments]);

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
  
  const maxDeliveryWaitTime = 12;

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

  // Calculate delivery time segments based on order time and rider arrival time
  const calculateDeliverySegments = (
    day: Date,
    startTimeStr: string,
    waitTimeHours: number
  ): DeliverySegment[] => {
    const segments: DeliverySegment[] = [];
    const startHour = convertTo24Hour(startTimeStr);
    
    // Calculate rider arrival time
    const endHour = startHour + waitTimeHours;

    // Clone the date to avoid modifying the original
    const dayClone = new Date(day);

    // Create new Date objects for start and end times
    const segmentStartDate = new Date(dayClone);
    segmentStartDate.setHours(startHour, 0, 0, 0);

    const segmentEndDate = new Date(dayClone);
    segmentEndDate.setHours(endHour, 0, 0, 0);

    // Create the delivery segment
    segments.push({
      startTime: convertTo12Hour(startHour),
      endTime: convertTo12Hour(endHour),
      startDate: segmentStartDate,
      endDate: segmentEndDate,
      formattedDate: format(dayClone, "EEE, MMM d"),
    });

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

  // Check if a date is included in a delivery
  const isDateBooked = (date: Date): boolean => {
    return deliveryDates.some((deliveryDate) => isSameDay(deliveryDate, date));
  };

  // Handle time slot selection (for order time)
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
          `Sorry, the delivery service is not available at ${time} on ${format(
            selectedDate,
            "MMMM d"
          )}.`
        );
        return;
      }

      if (selectedStartTime === time) {
        // Deselect if already selected
        setSelectedStartTime(null);
        setDeliverySegments([]);
        setDeliveryDates([]);
      } else {
        // Set as new start time
        setSelectedStartTime(time);
        // Calculate delivery segments based on wait time
        const segments = calculateDeliverySegments(
          new Date(selectedDate),
          time,
          deliveryWaitTime
        );
        setDeliverySegments(segments);
      }
    }
  };

  // Handle wait time change with plus and minus buttons
  const increaseWaitTime = (): void => {
    if (deliveryWaitTime < maxDeliveryWaitTime) {
      const newWaitTime = deliveryWaitTime + 1;
      setDeliveryWaitTime(newWaitTime);
      if (selectedStartTime && selectedDate) {
        // Recalculate delivery segments with new wait time
        const segments = calculateDeliverySegments(
          new Date(selectedDate),
          selectedStartTime,
          newWaitTime
        );
        setDeliverySegments(segments);
      }
    }
  };

  const decreaseWaitTime = (): void => {
    if (deliveryWaitTime > 1) {
      const newWaitTime = deliveryWaitTime - 1;
      setDeliveryWaitTime(newWaitTime);
      if (selectedStartTime && selectedDate) {
        // Recalculate delivery segments with new wait time
        const segments = calculateDeliverySegments(
          new Date(selectedDate),
          selectedStartTime,
          newWaitTime
        );
        setDeliverySegments(segments);
      }
    }
  };

  const handleDateSelect = (date: Date): void => {
    if (!isDateInPast(date)) {
      setSelectedDate(date);
      // Reset selections when date changes
      setSelectedStartTime(null);
      setDeliverySegments([]);
      setDeliveryDates([]);
    }
  };

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const proceedToDeliveryDetails = (): void => {
    if (deliverySegments.length === 0) {
      setErrorMessage("Please select an order time");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setIsDialogOpen(true);
  };

  const confirmDelivery = (): void => {
    if (deliverySegments.length === 0) {
      setErrorMessage("Please select an order time");
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

    // Prepare delivery inputs
    const deliveryInputs = deliverySegments.map((segment) => ({
      startTime: timeToISOString(segment.startDate, segment.startTime),
      endTime: timeToISOString(segment.endDate, segment.endTime),
      notes: userData.notes,
      tableSize: orderSize, // Repurposed for order size
      userId: userId,
      userType: user.type,
      item: userData.notes, // Item property contains the item type/description
    }));
    
    console.log("variables", {
      input: deliveryInputs,
      serviceId: serviceId,
    });
    
    // Call the mutation to create the delivery order
    createMultipleBookings({
      variables: {
        input: deliveryInputs,
        serviceId: serviceId,
      },
    });

    setIsDialogOpen(false);
  };

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
            <DialogTitle>Schedule Delivery Service</DialogTitle>
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
                    {/* Order Time Selection */}
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Select order time for {format(selectedDate, "MMMM d")}
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
                              <DialogTitle>Unavailable Time</DialogTitle>
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

                    {/* Rider Arrival Time Estimate with Plus/Minus Buttons */}
                    {selectedStartTime && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium mb-3">
                          Estimated Rider Arrival Time (hours after order)
                        </h3>
                        <div className="flex items-center justify-center space-x-4">
                          <Button
                            onClick={decreaseWaitTime}
                            variant="outline"
                            size="icon"
                            disabled={deliveryWaitTime <= 1}
                            className="h-10 w-10"
                          >
                            <MinusIcon className="h-5 w-5" />
                          </Button>

                          <div className="text-center font-medium w-16">
                            {deliveryWaitTime}{" "}
                            {deliveryWaitTime === 1 ? "hour" : "hours"}
                          </div>

                          <Button
                            onClick={increaseWaitTime}
                            variant="outline"
                            size="icon"
                            disabled={deliveryWaitTime >= maxDeliveryWaitTime}
                            className="h-10 w-10"
                          >
                            <PlusIcon className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Delivery Time Display */}
                {deliverySegments.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">
                      Your Delivery Time
                    </h3>
                    <div className="space-y-2">
                      {deliverySegments.map((segment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-primary/10 p-3 rounded-lg border border-primary/20"
                        >
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            <span>
                              {segment.formattedDate}: 
                              <br />
                              Order Time: {segment.startTime}
                              <br />
                              Estimated Rider Arrival: {segment.endTime}
                            </span>
                          </div>
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
              onClick={proceedToDeliveryDetails}
              disabled={deliverySegments.length === 0}
            >
              Continue with Delivery Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CompleteDeliveryOrder
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        deliverySegments={deliverySegments}
        userData={userData}
        orderSize={orderSize}
        confirmDelivery={confirmDelivery}
        orderLoading={orderLoading}
        handleUserChange={handleUserChange}
        setOrderSize={setOrderSize}
      />
    </div>
  );
}