"use client";

import React, { useState, useEffect } from "react";
import moment from 'moment';
import {
  CalendarIcon,
  ClockIcon,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Settings,
  MapPin,
  Truck,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useAuth } from "@/middleware/context/authContext";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { DeliveryTimeDialog } from "./delivery-time-dialog";

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

// Updated mutation to include cargo parameters
const CREATE_MULTIPLE_BOOKINGS = gql`
  mutation CreateMultipleBookings(
    $input: [BookerInput!]!
    $isMulti: Boolean
    $isCargo: Boolean
    $serviceId: String!
  ) {
    createMultipleBookings(
      input: $input
      isMulti: $isMulti
      isCargo: $isCargo
      serviceId: $serviceId
    ) {
      id
      startTime
      endTime
      multiGroupId
      cargoId
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
  customCargoType?: string; // New field for individual cargo vehicle selection
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

interface CompleteDeliveryOrderProps {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deliverySegments: DeliverySegment[];
  userData: UserData;
  orderSize: number;
  confirmDelivery: () => void;
  orderLoading: boolean;
  handleUserChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setOrderSize: React.Dispatch<React.SetStateAction<number>>;
  isMultiLocation: boolean;
  setIsMultiLocation: React.Dispatch<React.SetStateAction<boolean>>;
  deliveryItems: DeliveryItem[];
  handleDeliveryItemChange: (itemId: string, field: string, value: string | number | boolean) => void;
  deliveryWaitTime: number;
  increaseWaitTime: () => void;
  decreaseWaitTime: () => void;
  maxDeliveryWaitTime: number;
  // New cargo-related props
  isCargo: boolean;
  setIsCargo: React.Dispatch<React.SetStateAction<boolean>>;
  cargoType: string;
  setCargoType: React.Dispatch<React.SetStateAction<string>>;
  splitCargo: boolean;
  setSplitCargo: React.Dispatch<React.SetStateAction<boolean>>;
}

interface DeliveryServiceSystemProps {
  isDialogOpenMain: boolean;
  setDialogOpenMain: React.Dispatch<React.SetStateAction<boolean>>;
  serviceId?: string;
  withDialog?: boolean;
}

// Cargo vehicle types
const CARGO_TYPES = [
  { value: "pickup", label: "Pickup Truck", description: "Small to medium items" },
  { value: "van", label: "Delivery Van", description: "Medium to large items" },
  { value: "truck", label: "Small Truck", description: "Large items & furniture" },
  { value: "large_truck", label: "Large Truck", description: "Heavy cargo & bulk items" },
];

const defaultTimeSlots: string[] = [
  "1 am", "2 am", "3 am", "4 am", "5 am", "6 am",
  "7 am", "8 am", "9 am", "10 am", "11 am", "12 pm",
  "1 pm", "2 pm", "3 pm", "4 pm", "5 pm", "6 pm",
  "7 pm", "8 pm", "9 pm", "10 pm", "11 pm", "12 am",
];

// Generate a simple UUID
export const GenerateUUID = (): string => {
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

export const DeliveryServiceSystem: React.FC<DeliveryServiceSystemProps> = ({
  isDialogOpenMain,
  setDialogOpenMain,
  serviceId,
  withDialog = true,
}) => {
  const today = moment().startOf('day').toDate();
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const { user } = useAuth();
  const userId = user?.id;
  const navigate = useNavigate();

  // States for the delivery system
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null);
  const [deliveryWaitTime, setDeliveryWaitTime] = useState<number>(1);
  const [deliverySegments, setDeliverySegments] = useState<DeliverySegment[]>([]);

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
      id: GenerateUUID(),
      itemDescription: "",
      deliveryAddress: "",
      dropoffLocation: [0, 0],
      notes: "",
    },
  ]);

  // Cargo delivery states
  const [isCargo, setIsCargo] = useState<boolean>(false);
  const [cargoType, setCargoType] = useState<string>("");
  const [splitCargo, setSplitCargo] = useState<boolean>(false);

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [visibleDates, setVisibleDates] = useState<Date[]>([]);
  const [datesPerPage] = useState(7);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const [deliveryDates, setDeliveryDates] = useState<Date[]>([]);
  const [unavailableMessage, setUnavailableMessage] = useState<string>("");
  const [unavailablePeriods, setUnavailablePeriods] = useState<UnavailablePeriod[]>([]);

  const [isDialogOpenDeliverySetting, setDeliverySettingDialog] = useState(false);
  const { data } = useQuery(GET_ALL_UNAVAILABLE_PERIODS);

  // Process unavailable periods from API
  useEffect(() => {
    if (data) {
      const manualUnavailablePeriods = data.getUnavailablePeriods || [];
      const bookingUnavailablePeriods: UnavailablePeriod[] = (
        data.getConfirmedBookingsAsUnavailable || []
      ).map((booking: {
        id: string;
        day: string;
        startTime: string;
        endTime: string;
      }): UnavailablePeriod => {
        const startDate = new Date(booking.startTime);
        const endDate = new Date(booking.endTime);

        const startTime = startDate.getHours().toString().padStart(2, "0") +
          ":" + startDate.getMinutes().toString().padStart(2, "0");
        const endTime = endDate.getHours().toString().padStart(2, "0") +
          ":" + endDate.getMinutes().toString().padStart(2, "0");

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
      const newItems: DeliveryItem[] = [];
      for (let i = deliveryItems.length; i < orderSize; i++) {
        newItems.push({
          id: GenerateUUID(),
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

  // Reset cargo split when not multi-location or not cargo
  useEffect(() => {
    if (!isMultiLocation || !isCargo) {
      setSplitCargo(false);
    }
  }, [isMultiLocation, isCargo]);

  // Create delivery orders mutation
  const [createMultipleBookings, { loading: orderLoading }] = useMutation(
    CREATE_MULTIPLE_BOOKINGS,
    {
      onCompleted: (data) => {
        toast.success("Delivery order created successfully!");
        setSuccessMessage("Delivery order created successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);

        const createdBookings = data.createMultipleBookings || [];
        const firstBookingId = createdBookings.length > 0 ? createdBookings[0].id : null;

        // Reset form state
        setDeliverySegments([]);
        setSelectedStartTime(null);
        setDeliveryDates([]);
        setIsCargo(false);
        setCargoType("");
        setSplitCargo(false);
        
        if (withDialog) {
          setDialogOpenMain(false);
        }

        if (firstBookingId) {
          // Build URL with conditional parameters
          let navigationUrl: string;
          if (createdBookings.length === 1) {
            navigationUrl = `/delivery/${serviceId}/${firstBookingId}`;
          } else {
            navigationUrl = `/multidelivery/${serviceId}/${firstBookingId}`;
          }
          
          // Add URL parameters for special delivery types
          const params = new URLSearchParams();
          if (isMultiLocation) {
            params.append('isMultiLocation', 'true');
          }
          if (isCargo) {
            params.append('cargo', 'true');
            if (cargoType) {
              params.append('cargoType', cargoType);
            }
            if (isMultiLocation && splitCargo) {
              params.append('splitCargo', 'true');
            }
          }
          
          if (params.toString()) {
            navigationUrl += `?${params.toString()}`;
          }
          
          navigate(navigationUrl, { replace: true });
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
      newDates.push(moment(currentDate).add(i, 'days').toDate());
    }
    setVisibleDates(newDates.slice(0, datesPerPage));
  }, [currentDate, datesPerPage]);

  // Update delivery dates whenever segments change
  useEffect(() => {
    const dates = deliverySegments.map((segment) => segment.startDate);
    setDeliveryDates(dates);
  }, [deliverySegments]);

  const handlePreviousWeek = (): void => {
    const newDate = moment(currentDate).add(-7, 'days').toDate();
    if (!moment(newDate).isBefore(today)) {
      setCurrentDate(newDate);
    }
  };

  const handleNextWeek = (): void => {
    setCurrentDate((prevDate) => moment(prevDate).add(7, 'days').toDate());
  };

  const maxDeliveryWaitTime = 12;

  // Check if a slot falls within unavailable periods
  const isSlotUnavailable = (day: Date, time: string): boolean => {
    const dayOfWeek = moment(day).format("dddd");
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
      formattedDate: moment(dayClone).format("ddd, MMM D"),
    });

    return segments;
  };

  const isDateInPast = (date: Date): boolean => {
    return moment(date).isBefore(today);
  };

  const isSlotInPast = (day: Date, time: string): boolean => {
    if (!moment(day).isSame(today, 'day')) return false;

    const currentHour = new Date().getHours();
    const slotHour = parseInt(time.replace(/[^0-9]/g, ""));
    const isPM = time.toLowerCase().includes("pm");
    const slot24Hour = slotHour === 12 ? (isPM ? 12 : 0) : isPM ? slotHour + 12 : slotHour;

    return slot24Hour <= currentHour;
  };

  const isDateBooked = (date: Date): boolean => {
    return deliveryDates.some((deliveryDate) => moment(deliveryDate).isSame(date, 'day'));
  };

  const handleTimeSlotClick = (time: string): void => {
    if (selectedDate) {
      setUnavailableMessage("");

      if (isSlotInPast(selectedDate, time)) {
        return;
      }

      if (isSlotUnavailable(selectedDate, time)) {
        setUnavailableMessage(
          `Sorry, the delivery service is not available at ${time} on ${moment(
            selectedDate
          ).format("MMMM D")}.`
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
    value: string | number | boolean
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

    // Validate cargo settings if enabled
    if (isCargo && !cargoType) {
      setErrorMessage("Please select a cargo vehicle type");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    let deliveryInputs;

    if (isMultiLocation && orderSize > 1) {
      // Multi-location: Create separate booking for each item
      deliveryInputs = deliveryItems.slice(0, orderSize).map((item) => ({
        startTime: timeToISOString(deliverySegments[0].startDate, deliverySegments[0].startTime),
        endTime: timeToISOString(deliverySegments[0].endDate, deliverySegments[0].endTime),
        notes: item.notes || userData.notes,
        tableSize: 1,
        userId: userId,
        userType: user.type,
        item: item.itemDescription || userData.itemType,
        transportType: isCargo ? (item.customCargoType || cargoType) : undefined,
      }));
    } else if (orderSize > 1) {
      // Multiple items, same location
      deliveryInputs = Array.from({ length: orderSize }, () => ({
        startTime: timeToISOString(deliverySegments[0].startDate, deliverySegments[0].startTime),
        endTime: timeToISOString(deliverySegments[0].endDate, deliverySegments[0].endTime),
        notes: userData.notes,
        tableSize: 1,
        userId: userId,
        userType: user.type,
        item: userData.itemType,
        transportType: isCargo ? cargoType : undefined,
      }));
    } else {
      // Single item
      deliveryInputs = [{
        startTime: timeToISOString(deliverySegments[0].startDate, deliverySegments[0].startTime),
        endTime: timeToISOString(deliverySegments[0].endDate, deliverySegments[0].endTime),
        notes: userData.notes,
        tableSize: orderSize,
        userId: userId,
        userType: user.type,
        item: userData.itemType,
        transportType: isCargo ? cargoType : undefined,
      }];
    }

    // Call the mutation with cargo parameters
    createMultipleBookings({
      variables: {
        input: deliveryInputs,
        isMulti: isMultiLocation,
        isCargo: isCargo,
        serviceId: serviceId,
      },
    });

    setIsDialogOpen(false);
  };

  // Render the main content
  const renderContent = () => (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
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
                disabled={moment(currentDate).isSame(today, 'day')}
                className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-base font-medium text-gray-900">
                {moment(currentDate).format("MMMM YYYY")}
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
                const isSelected = selectedDate && moment(selectedDate).isSame(date, 'day');

                return (
                  <div
                    key={date.toString()}
                    onClick={() => !isPastDate && handleDateSelect(date)}
                    className={cn(
                      "p-2 text-center rounded-full transition-all duration-200 ease-in-out",
                      {
                        "text-gray-400 cursor-not-allowed": isPastDate,
                        "bg-gray-100 border border-gray-200 text-gray-900 cursor-pointer": isBooked,
                        "bg-blue-500 text-white shadow-sm cursor-pointer": isSelected,
                        "hover:bg-gray-100 cursor-pointer text-gray-900": !isPastDate && !isSelected && !isBooked,
                      }
                    )}
                  >
                    <div className="text-xs font-medium">
                      {moment(date).format("ddd")}
                    </div>
                    <div className="text-sm font-semibold">
                      {moment(date).format("D")}
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
                    Select order time for {moment(selectedDate).format("MMMM D")}
                  </h3>
                  {deliverySegments.length > 0 && (
                    <Button
                      onClick={() => setDeliverySettingDialog(!isDialogOpenDeliverySetting)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="sr-only">Settings</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((time) => {
                    const isPast = isSlotInPast(selectedDate, time);
                    const isUnavailable = isSlotUnavailable(selectedDate, time);
                    const isSelected = selectedStartTime === time;

                    return (
                      <div
                        key={time}
                        onClick={() => !isPast && !isUnavailable && handleTimeSlotClick(time)}
                        className={cn(
                          "py-2 px-1 text-center rounded-xl text-sm transition-all duration-200 ease-in-out",
                          {
                            "text-gray-400 bg-gray-50 cursor-not-allowed": isPast,
                            "text-red-500 bg-red-50 cursor-not-allowed": isUnavailable,
                            "bg-blue-500 text-white shadow-sm font-medium": isSelected,
                            "text-gray-900 hover:bg-gray-100 cursor-pointer border border-gray-200": !isPast && !isUnavailable && !isSelected,
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
                  <Dialog open onOpenChange={() => setUnavailableMessage("")}>
                    <DialogContent className="sm:max-w-md rounded-2xl bg-white/95 backdrop-blur-sm">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                          Unavailable Time
                        </DialogTitle>
                      </DialogHeader>
                      <div className="py-4 flex items-center">
                        <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
                        <p className="text-gray-700">{unavailableMessage}</p>
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

      {/* Action buttons for non-dialog mode */}
      {!withDialog && (
        <div className="flex gap-3 mt-6">
          <Button
            onClick={proceedToDeliveryDetails}
            disabled={deliverySegments.length === 0}
            className="flex-1 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );

  // Return with or without dialog based on withDialog prop
  if (withDialog) {
    return (
      <>
        <Dialog open={isDialogOpenMain} onOpenChange={setDialogOpenMain}>
          <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Schedule Delivery
              </DialogTitle>
            </DialogHeader>
            {renderContent()}
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
          // New cargo-related props
          isCargo={isCargo}
          setIsCargo={setIsCargo}
          cargoType={cargoType}
          setCargoType={setCargoType}
          splitCargo={splitCargo}
          setSplitCargo={setSplitCargo}
        />
      </>
    );
  }

  // Return without dialog wrapper
  return (
    <div className="w-full max-w-lg mx-auto">
      {renderContent()}

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
        // New cargo-related props
        isCargo={isCargo}
        setIsCargo={setIsCargo}
        cargoType={cargoType}
        setCargoType={setCargoType}
        splitCargo={splitCargo}
        setSplitCargo={setSplitCargo}
      />
    </div>
  );
};

const CompleteDeliveryOrder: React.FC<CompleteDeliveryOrderProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  deliverySegments,
  userData,
  orderSize,
  confirmDelivery,
  orderLoading,
  handleUserChange,
  setOrderSize,
  isMultiLocation,
  setIsMultiLocation,
  deliveryItems,
  handleDeliveryItemChange,
 
  isCargo,
  setIsCargo,
  cargoType,
  setCargoType,
  splitCargo,
  setSplitCargo,
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Complete Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 px-6">
          {/* Delivery Time Summary */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-3 flex items-center text-gray-900">
              <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
              Delivery Schedule
            </h3>

            <div className="space-y-2">
              {deliverySegments.map((segment, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-medium">{segment.formattedDate}</span>
                    <span className="text-gray-500">•</span>
                    <span>
                      {segment.startTime} - {segment.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Size */}
          <div>
            <Label
              htmlFor="orderSize"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Number of Items
            </Label>
            <Select
              value={orderSize.toString()}
              onValueChange={(value) => setOrderSize(parseInt(value))}
            >
              <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} {size === 1 ? "item" : "items"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cargo toggle */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <Truck className="h-5 w-5 text-blue-600" />
              <div>
                <Label className="text-sm font-medium text-blue-900">
                  Need a cargo vehicle?
                </Label>
                <p className="text-xs text-blue-700">
                  For large items, furniture, or heavy cargo
                </p>
              </div>
            </div>
            <Switch
              checked={isCargo}
              onCheckedChange={setIsCargo}
            />
          </div>

          {/* Cargo Type Selection */}
          {isCargo && (
            <div>
              <Label className="block mb-2 text-sm font-medium text-gray-900">
                Select Vehicle Type
              </Label>
              <Select value={cargoType} onValueChange={setCargoType}>
                <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                  <SelectValue placeholder="Choose cargo vehicle" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {CARGO_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-gray-500">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Multi-location toggle (only show if more than 1 item) */}
          {orderSize > 1 && (
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-amber-600" />
                <div>
                  <Label className="text-sm font-medium text-amber-900">
                    Are these going to different locations?
                  </Label>
                  <p className="text-xs text-amber-700">
                    Enable if items need to be delivered to separate addresses
                  </p>
                </div>
              </div>
              <Switch
                checked={isMultiLocation}
                onCheckedChange={setIsMultiLocation}
              />
            </div>
          )}

          {/* Split Cargo toggle (only show if cargo + multi-location) */}
          {isCargo && isMultiLocation && orderSize > 1 && (
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-purple-600" />
                <div>
                  <Label className="text-sm font-medium text-purple-900">
                    Different vehicles for each location?
                  </Label>
                  <p className="text-xs text-purple-700">
                    Each delivery can use a different cargo vehicle type
                  </p>
                </div>
              </div>
              <Switch
                checked={splitCargo}
                onCheckedChange={setSplitCargo}
              />
            </div>
          )}

          {/* Delivery Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              {isMultiLocation ? "Delivery Details (Per Item)" : "Delivery Details"}
            </h3>

            {isMultiLocation ? (
              // Multi-location: Show form for each item
              <div className="space-y-4">
                {deliveryItems.slice(0, orderSize).map((item, index) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Item {index + 1}
                        </h4>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-700">
                            Item Description
                          </Label>
                          <Input
                            placeholder="Describe this item..."
                            value={item.itemDescription}
                            onChange={(e) =>
                              handleDeliveryItemChange(
                                item.id,
                                "itemDescription",
                                e.target.value
                              )
                            }
                            className="mt-1"
                          />
                        </div>

                        {/* Individual cargo type selection when split cargo is enabled */}
                        {isCargo && splitCargo && (
                          <div>
                            <Label className="text-xs font-medium text-gray-700">
                              Vehicle Type for this Item
                            </Label>
                            <Select
                              value={item.customCargoType || cargoType}
                              onValueChange={(value) =>
                                handleDeliveryItemChange(item.id, "customCargoType", value)
                              }
                            >
                              <SelectTrigger className="w-full rounded-xl border-gray-200 mt-1">
                                <SelectValue placeholder="Choose vehicle" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-200">
                                {CARGO_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex flex-col">
                                      <span className="font-medium">{type.label}</span>
                                      <span className="text-xs text-gray-500">{type.description}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        <div>
                          <Label className="text-xs font-medium text-gray-700">
                            Special Instructions
                          </Label>
                          <Textarea
                            placeholder="Any special delivery instructions for this item..."
                            value={item.notes}
                            onChange={(e) =>
                              handleDeliveryItemChange(
                                item.id,
                                "notes",
                                e.target.value
                              )
                            }
                            className="mt-1 min-h-[60px] resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Single location: Show unified form
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="itemType"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Item Description
                  </Label>
                  <Textarea
                    id="itemType"
                    name="itemType"
                    placeholder="Please describe your items..."
                    value={userData.itemType || ""}
                    onChange={handleUserChange}
                    className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[50px] resize-none"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="notes"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Special Instructions
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={userData.notes}
                    onChange={handleUserChange}
                    placeholder="Any special delivery instructions..."
                    className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[100px] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
          <Button
            className="w-full sm:w-auto rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={confirmDelivery}
            disabled={orderLoading}
          >
            {orderLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Confirm Delivery"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDialogOpen(false)}
          >
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};