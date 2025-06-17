"use client";

import React, { useState, useEffect } from "react";
import { format, addDays, isSameDay, isBefore, startOfDay } from "date-fns";
import {
  CalendarIcon,
  ClockIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@/middleware/context/authContext";
import { toast } from "sonner";
import { CompleteDeliveryOrder } from "./CompleteDeliveryOrder";
import { useNavigate } from "react-router";
import { DeliveryTimeDialog } from "../delivery-time-dialog";

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

const CREATE_MULTIPLE_BOOKINGS = gql`
  mutation CreateMultipleBookings(
    $input: [BookerInput!]!
    $isMulti: Boolean
    $serviceId: String!
  ) {
    createMultipleBookings(
      input: $input
      isMulti: $isMulti
      serviceId: $serviceId
    ) {
      id
      startTime
      endTime
      multiGroupId
    }
  }
`;

interface UserData {
  notes: string;
  itemType?: string;
}

interface DeliveryItem {
  id: string;
  itemDescription: string;
  deliveryAddress: string;
  dropoffLocation: [number, number]; // [lat, lng]
  notes: string;
}

interface UnavailablePeriod {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

export type DeliverySegment = {
  startTime: string;
  endTime: string;
  startDate: Date;
  endDate: Date;
  formattedDate: string;
};

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

// Generate a simple UUID
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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

export const DeliveryServiceSystem = ({
  isDialogOpenMain,
  setDialogOpenMain,
  serviceId,
}: {
  isDialogOpenMain: boolean;
  setDialogOpenMain: React.Dispatch<React.SetStateAction<boolean>>;
  serviceId?: string;
}) => {
  const today = startOfDay(new Date());
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  // States for the delivery system
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(
    null
  );
  const [deliveryWaitTime, setDeliveryWaitTime] = useState<number>(1);
  const [deliverySegments, setDeliverySegments] = useState<DeliverySegment[]>(
    []
  );

  const [orderSize, setOrderSize] = useState<number>(1);
  const [timeSlots] = useState<string[]>(defaultTimeSlots);
  const [userData, setUserData] = useState<UserData>({
    notes: "",
    itemType: "",
  });

  // Multi-location delivery states
  const [isMultiLocation, setIsMultiLocation] = useState<boolean>(false);
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([
    {
      id: generateUUID(),
      itemDescription: "",
      deliveryAddress: "",
      dropoffLocation: [0, 0],
      notes: "",
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [datesPerPage] = useState(7);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Tracking which dates are included in the delivery
  const [deliveryDates, setDeliveryDates] = useState<Date[]>([]);
  const [unavailableMessage, setUnavailableMessage] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<
    UnavailablePeriod[]
  >([]);

  // Dialog for delivery settings
  const [isDialogOpenDeliverySetting, setDeliverySettingDialog] =
    useState(false);
  const { data } = useQuery(GET_ALL_UNAVAILABLE_PERIODS);

  // Process unavailable periods from API
  useEffect(() => {
    if (data) {
      const manualUnavailablePeriods = data.getUnavailablePeriods || [];
      const bookingUnavailablePeriods: UnavailablePeriod[] = (
        data.getConfirmedBookingsAsUnavailable || []
      ).map((booking: any): UnavailablePeriod => {
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);

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
          day: booking.day,
          startTime,
          endTime,
        };
      });

      const allUnavailablePeriods = [
        ...manualUnavailablePeriods,
        ...bookingUnavailablePeriods,
      ];
      setUnavailablePeriods(allUnavailablePeriods);
    }
  }, [data]);

  // Update delivery items when order size changes
  useEffect(() => {
    if (orderSize > deliveryItems.length) {
      const newItems = [];
      for (let i = deliveryItems.length; i < orderSize; i++) {
        newItems.push({
          id: generateUUID(),
          itemDescription: "",
          deliveryAddress: "",
          dropoffLocation: [0, 0] as [number, number],
          notes: "",
        });
      }
      setDeliveryItems((prev) => [...prev, ...newItems]);
    } else if (orderSize < deliveryItems.length) {
      setDeliveryItems((prev) => prev.slice(0, orderSize));
    }
  }, [orderSize, deliveryItems.length]);

  // Reset multi-location when order size is 1
  useEffect(() => {
    if (orderSize === 1) {
      setIsMultiLocation(false);
    }
  }, [orderSize]);

  // Create delivery orders mutation
// Create delivery orders mutation
const [createMultipleBookings, { loading: orderLoading }] = useMutation(
  CREATE_MULTIPLE_BOOKINGS,
  {
    onCompleted: (data) => {
      toast.success("Delivery order created successfully!");
      setSuccessMessage("Delivery order created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      const createdBookings = data.createMultipleBookings || [];
      const firstBookingId =
        createdBookings.length > 0 ? createdBookings[0].id : null;

      setDeliverySegments([]);
      setSelectedStartTime(null);
      setDeliveryDates([]);
      setDialogOpenMain(false);

      if (firstBookingId) {
        // Build URL with conditional isMultiLocation parameter
        let navigationUrl;
        if (createdBookings.length === 1) {
          navigationUrl = `/delivery/${serviceId}/${firstBookingId}`;
        } else {
          navigationUrl = `/multidelivery/${serviceId}/${firstBookingId}`;
        }
        
        // Add isMultiLocation parameter only if it's true
        if (isMultiLocation) {
          navigationUrl += `?isMultiLocation=true`;
        }
        
        navigate(navigationUrl, {
          replace: true,
        });
      } else {
        navigate(`/zonex/${serviceId}`);
      }
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setErrorMessage(`Error: ${error.message}`);
      setTimeout(() => setErrorMessage(""), 5000);
    },
  }
);

  // Generate dates for the current view
  useEffect(() => {
    const newDates = [];
    for (let i = 0; i < 14; i++) {
      newDates.push(addDays(currentDate, i));
    }
    setVisibleDates(newDates.slice(0, datesPerPage));
  }, [currentDate, datesPerPage]);

  // Update delivery dates whenever segments change
  useEffect(() => {
    const dates = deliverySegments.map((segment) => segment.startDate);
    setDeliveryDates(dates);
  }, [deliverySegments]);

  const handlePreviousWeek = (): void => {
    const newDate = addDays(currentDate, -7);
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
    const dayOfWeek = format(day, "EEEE");
    const hour24 = convertTo24Hour(time);

    return unavailablePeriods.some((period) => {
      if (period.day !== dayOfWeek) return false;

      const periodStart = parseTimeString(period.startTime);
      const periodEnd = parseTimeString(period.endTime);
      const slotTime = hour24 * 100;

      return slotTime >= periodStart && slotTime < periodEnd;
    });
  };

  // Calculate delivery time segments
  const calculateDeliverySegments = (
    day: Date,
    startTimeStr: string,
    waitTimeHours: number
  ): DeliverySegment[] => {
    const segments: DeliverySegment[] = [];
    const startHour = convertTo24Hour(startTimeStr);
    const endHour = startHour + waitTimeHours;

    const dayClone = new Date(day);
    const segmentStartDate = new Date(dayClone);
    segmentStartDate.setHours(startHour, 0, 0, 0);

    const segmentEndDate = new Date(dayClone);
    segmentEndDate.setHours(endHour, 0, 0, 0);

    segments.push({
      startTime: convertTo12Hour(startHour),
      endTime: convertTo12Hour(endHour),
      startDate: segmentStartDate,
      endDate: segmentEndDate,
      formattedDate: format(dayClone, "EEE, MMM d"),
    });

    return segments;
  };

  const isDateInPast = (date: Date): boolean => {
    return isBefore(date, today);
  };

  const isSlotInPast = (day: Date, time: string): boolean => {
    if (!isSameDay(day, today)) return false;

    const currentHour = new Date().getHours();
    const slotHour = parseInt(time.replace(/[^0-9]/g, ""));
    const isPM = time.toLowerCase().includes("pm");
    const slot24Hour =
      slotHour === 12 ? (isPM ? 12 : 0) : isPM ? slotHour + 12 : slotHour;

    return slot24Hour <= currentHour;
  };

  const isDateBooked = (date: Date): boolean => {
    return deliveryDates.some((deliveryDate) => isSameDay(deliveryDate, date));
  };

  const handleTimeSlotClick = (time: string): void => {
    if (selectedDate) {
      setUnavailableMessage("");

      if (isSlotInPast(selectedDate, time)) {
        return;
      }

      if (isSlotUnavailable(selectedDate, time)) {
        setUnavailableMessage(
          `Sorry, the delivery service is not available at ${time} on ${format(
            selectedDate,
            "MMMM d"
          )}.`
        );
        return;
      }

      if (selectedStartTime === time) {
        setSelectedStartTime(null);
        setDeliverySegments([]);
        setDeliveryDates([]);
      } else {
        setSelectedStartTime(time);
        const segments = calculateDeliverySegments(
          new Date(selectedDate),
          time,
          deliveryWaitTime
        );
        setDeliverySegments(segments);
      }
    }
  };

  const increaseWaitTime = (): void => {
    if (deliveryWaitTime < maxDeliveryWaitTime) {
      const newWaitTime = deliveryWaitTime + 1;
      setDeliveryWaitTime(newWaitTime);
      if (selectedStartTime && selectedDate) {
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
      setSelectedStartTime(null);
      setDeliverySegments([]);
      setDeliveryDates([]);
    }
  };

  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliveryItemChange = (
    itemId: string,
    field: string,
    value: any
  ): void => {
    setDeliveryItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
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

  // Validate multi-location items if enabled
  if (isMultiLocation) {
    const invalidItems = deliveryItems.some(
      (item) => !item.itemDescription.trim()
    );

    if (invalidItems) {
      setErrorMessage("Please fill in all item descriptions");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
  }

  // Generate UUID ONLY for multi-location deliveries (different addresses)

  let deliveryInputs;

  if (isMultiLocation && orderSize > 1) {
    // Multi-location: Create separate booking for each item with different addresses
    deliveryInputs = deliveryItems.slice(0, orderSize).map((item) => ({
      startTime: timeToISOString(deliverySegments[0].startDate, deliverySegments[0].startTime),
      endTime: timeToISOString(deliverySegments[0].endDate, deliverySegments[0].endTime),
      notes: item.notes || userData.notes,
      tableSize: 1, // Each item is individual
      userId: userId,
      userType: user.type,
      item: item.itemDescription || userData.itemType,
    //   multiGroupId: multiGroupId, // Same group ID for different locations
    }));
  } else if (orderSize > 1) {
    // Multiple items, same location: Create multiple bookings with same details, NO multiGroupId
    deliveryInputs = Array.from({ length: orderSize }, (_, index) => ({
      startTime: timeToISOString(deliverySegments[0].startDate, deliverySegments[0].startTime),
      endTime: timeToISOString(deliverySegments[0].endDate, deliverySegments[0].endTime),
      notes: userData.notes,
      tableSize: 1, // Each booking represents 1 item
      userId: userId,
      userType: user.type,
      item: userData.itemType,
    //   multiGroupId: null, // No grouping needed - same location
    }));
  } else {
    // Single item: One booking
    deliveryInputs = [{
      startTime: timeToISOString(deliverySegments[0].startDate, deliverySegments[0].startTime),
      endTime: timeToISOString(deliverySegments[0].endDate, deliverySegments[0].endTime),
      notes: userData.notes,
      tableSize: orderSize, // Total quantity in single booking
      userId: userId,
      userType: user.type,
      item: userData.itemType,
    //   multiGroupId: null, // No grouping needed for single item
    }];
  }

//   console.log("variables", {
//     input: deliveryInputs,
//     isMulti: isMultiLocation,
//     serviceId: serviceId,
//     multiGroupId: multiGroupId, // Will be null unless multi-location
//   });

  // Uncomment when ready to call the mutation
  createMultipleBookings({
    variables: {
      input: deliveryInputs,
      isMulti: isMultiLocation,
      serviceId: serviceId,
    },
  });

  setIsDialogOpen(false);
};

  return (
    <>
      <Dialog open={isDialogOpenMain} onOpenChange={setDialogOpenMain}>
        <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Schedule Delivery
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {errorMessage && (
              <Alert
                variant="destructive"
                className="rounded-xl border-red-200 bg-red-50"
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-600">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="rounded-xl border-green-200 bg-green-50">
                <Check className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-600">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <Card className="shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <CardContent className="p-5">
                {/* Date Selector */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <Button
                      onClick={handlePreviousWeek}
                      variant="ghost"
                      size="icon"
                      disabled={isSameDay(currentDate, today)}
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="text-base font-medium text-gray-900">
                      {format(currentDate, "MMMM yyyy")}
                    </h3>
                    <Button
                      onClick={handleNextWeek}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {visibleDates.map((date) => {
                      const isPastDate = isDateInPast(date);
                      const isBooked = isDateBooked(date);
                      const isSelected =
                        selectedDate && isSameDay(selectedDate, date);

                      return (
                        <div
                          key={date.toString()}
                          onClick={() => !isPastDate && handleDateSelect(date)}
                          className={cn(
                            "p-2 text-center rounded-full transition-all duration-200 ease-in-out",
                            {
                              "text-gray-400 cursor-not-allowed": isPastDate,
                              "bg-gray-100 border border-gray-200 text-gray-900 cursor-pointer":
                                isBooked,
                              "bg-blue-500 text-white shadow-sm cursor-pointer":
                                isSelected,
                              "hover:bg-gray-100 cursor-pointer text-gray-900":
                                !isPastDate && !isSelected && !isBooked,
                            }
                          )}
                        >
                          <div className="text-xs font-medium">
                            {format(date, "EEE")}
                          </div>
                          <div className="text-sm font-semibold">
                            {format(date, "d")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selection Section */}
                {selectedDate && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-medium mb-3 flex items-center text-gray-900">
                          <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
                          Select order time for {format(selectedDate, "MMMM d")}
                        </h3>
                        {deliverySegments.length > 0 && (
                          <Button
                            onClick={() =>
                              setDeliverySettingDialog(
                                !isDialogOpenDeliverySetting
                              )
                            }
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                          >
                            <Settings className="h-5 w-5" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
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
                                "py-2 px-1 text-center rounded-xl text-sm transition-all duration-200 ease-in-out",
                                {
                                  "text-gray-400 bg-gray-50 cursor-not-allowed":
                                    isPast,
                                  "text-red-500 bg-red-50 cursor-not-allowed":
                                    isUnavailable,
                                  "bg-blue-500 text-white shadow-sm font-medium":
                                    isSelected,
                                  "text-gray-900 hover:bg-gray-100 cursor-pointer border border-gray-200":
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
                          <DialogContent className="sm:max-w-md rounded-2xl bg-white/95 backdrop-blur-sm">
                            <DialogHeader>
                              <DialogTitle className="text-lg font-semibold text-gray-900">
                                Unavailable Time
                              </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 flex items-center">
                              <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                              <p className="text-gray-700">
                                {unavailableMessage}
                              </p>
                            </div>
                            <DialogFooter>
                              <Button
                                onClick={() => setUnavailableMessage("")}
                                className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="flex-row gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpenMain(false)}
              className="flex-1 rounded-full border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={proceedToDeliveryDetails}
              disabled={deliverySegments.length === 0}
              className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeliveryTimeDialog
        decreaseWaitTime={decreaseWaitTime}
        increaseWaitTime={increaseWaitTime}
        deliveryWaitTime={deliveryWaitTime}
        maxDeliveryWaitTime={maxDeliveryWaitTime}
        selectedStartTime={selectedStartTime}
        deliverySegments={deliverySegments}
        onClose={() => setDeliverySettingDialog(!isDialogOpenDeliverySetting)}
        isOpen={isDialogOpenDeliverySetting}
        onContinue={proceedToDeliveryDetails}
      />

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
        isMultiLocation={isMultiLocation}
        setIsMultiLocation={setIsMultiLocation}
        deliveryItems={deliveryItems}
        handleDeliveryItemChange={handleDeliveryItemChange}
        deliveryWaitTime={deliveryWaitTime}
        increaseWaitTime={increaseWaitTime}
        decreaseWaitTime={decreaseWaitTime}
        maxDeliveryWaitTime={maxDeliveryWaitTime}
      />
    </>
  );
};
