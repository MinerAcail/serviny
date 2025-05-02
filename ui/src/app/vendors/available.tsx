import { useState, useEffect } from "react";
import { Calendar, Clock, Library, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { gql, useMutation, useQuery } from "@apollo/client";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/middleware/context/authContext";
import { Link } from "react-router";
import { BookType } from "@/components/serviceProviders/bookingType";
import { EventCreationForm } from "@/components/serviceProviders/eventBase/event-creation-form";
import EventBookedMembers from "./eventBookedList";
import { InventoryList } from "./rentalBasedBooking/inventory-list";
// import { BookingForm } from "./rentalBasedBooking/booking-form";
import InventoryItemForm from "./rentalBasedBooking/createRentals";
import { AppointmentBookedMembers } from "@/components/serviceProviders/APPOINTMENT/BookedSchedule";
const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// Working hours - Updated to start at 1am
const WORKING_HOURS = {
  start: "1:00am", // 1am
  end: "10:00pm", // 10pm
};

// Available start times within working hours - Updated to include earlier hours
const availableStartTimes = [
  "1:00am",
  "2:00am",
  "3:00am",
  "4:00am",
  "5:00am",
  "6:00am",
  "7:00am",
  "8:00am",
  "9:00am",
  "10:00am",
  "11:00am",
  "12:00pm",
  "1:00pm",
  "2:00pm",
  "3:00pm",
  "4:00pm",
  "5:00pm",
  "6:00pm",
  "7:00pm",
  "8:00pm",
  "9:00pm",
];

// Available durations - Updated the "Full day" label
const durations = [
  { value: "0.5", label: "30 minutes" },
  { value: "1", label: "1 hour" },
  { value: "1.5", label: "1.5 hours" },
  { value: "2", label: "2 hours" },
  { value: "3", label: "3 hours" },
  { value: "4", label: "4 hours" },
  { value: "8", label: "8 hours" },
  { value: "9", label: "9 hours" },
  { value: "10", label: "10 hours" },
  { value: "11", label: "11 hours" },
  { value: "12", label: "12 hours" },
  { value: "13", label: "13 hours" },
  { value: "14", label: "14 hours" },
  { value: "16", label: "Full day (1am-10pm)" }, // Updated label to reflect new working hours
  { value: "21", label: "Full day (1am-10pm)" }, // Updated value to reflect the actual hours (21 hours)
];

type UnavailablePeriod = {
  id: string;
  serviceId?: string;
  day: string;
  startTime: string;
  endTime: string;
};

const CREATE_UNAVAILABLE_PERIOD = gql`
  mutation CreateUnavailablePeriod($input: CreateUnavailablePeriodInput!) {
    createUnavailablePeriod(input: $input) {
      id
      serviceId
      day
      startTime
      endTime
    }
  }
`;

const GET_UNAVAILABLE_PERIODS = gql`
  query GetUnavailablePeriods {
    getUnavailablePeriods {
      id
      day
      endTime
      startTime
    }
  }
`;

export const GET_BOOK_TYPES = gql`
  query getBookingType($serviceId: String!) {
    getBookingType(serviceId: $serviceId)
  }
`;

const DELETE_UNAVAILABLE_PERIOD = gql`
  mutation DeleteUnavailablePeriod($id: String!) {
    deleteUnavailablePeriod(id: $id)
  }
`;

// Helper function to convert 24-hour format to AM/PM
const convertTo12Hour = (time24: string): string => {
  if (!time24) return "";

  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;

  return `${hours12}:${minutes.toString().padStart(2, "0")}${period}`;
};

// Helper function to convert AM/PM format to 24-hour for backend
const convertTo24Hour = (time12: string): string => {
  if (!time12) return "";

  const [timePart, period] = time12.split(/([ap]m)$/i);
  const [hoursRaw, minutes] = timePart.split(":").map(Number);

  let hours = hoursRaw;
  if (period.toLowerCase() === "pm" && hours < 12) {
    hours += 12;
  } else if (period.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export default function AvailabilityPage() {
  const [unavailablePeriods, setUnavailablePeriods] = useState<
    UnavailablePeriod[]
  >([]);
  const { user } = useAuth();
  const serviceId = user?.id;
  const [newPeriod, setNewPeriod] = useState({
    day: "",
    startTime: "1:00am", // Default start time updated to 1am
    endTime: "2:00am", // Default end time updated to 2am
    duration: "1", // Default duration (1 hour)
  });

  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch periods from GraphQL
  const {
    loading: queryLoading,
    error: queryError,
    data,
    refetch,
  } = useQuery(GET_UNAVAILABLE_PERIODS);

  useEffect(() => {
    if (data && data.getUnavailablePeriods) {
      // Convert times to AM/PM format for display
      const formattedPeriods = data.getUnavailablePeriods.map(
        (period: UnavailablePeriod) => ({
          ...period,
          startTime:
            period.startTime.includes("am") || period.startTime.includes("pm")
              ? period.startTime
              : convertTo12Hour(period.startTime),
          endTime:
            period.endTime.includes("am") || period.endTime.includes("pm")
              ? period.endTime
              : convertTo12Hour(period.endTime),
        })
      );
      setUnavailablePeriods(formattedPeriods);
    }
  }, [data]);

  // Create mutation
  const [createUnavailablePeriod, { loading: createLoading }] = useMutation(
    CREATE_UNAVAILABLE_PERIOD,
    {
      onCompleted: () => {
        refetch(); // Refetch the periods after creating a new one
        setDialogOpen(false);
        toast("Unavailable time added successfully");
      },
      onError: (error) => {
        setError(error.message);
      },
    }
  );

  // Delete mutation
  const [deleteUnavailablePeriod] = useMutation(DELETE_UNAVAILABLE_PERIOD, {
    onCompleted: () => {
      refetch(); // Refetch the periods after deleting one
      toast("Unavailable period removed successfully!");
    },
    onError: () => {
      toast("Failed to delete period");
    },
  });

  //check for booking type
  const { data: bookingTypeData } = useQuery(GET_BOOK_TYPES, {
    variables: { serviceId: serviceId }, // Replace with actual serviceId
  });
  const bookingType: BookType[] = Array.isArray(bookingTypeData?.getBookingType)
    ? (bookingTypeData.getBookingType as BookType[])
    : [];

    console.log("Booking Type", bookingTypeData?.getBookingType);
  console.log("Booking Type1111", bookingType);
    
  // Parse hours and minutes from AM/PM time format
  const parseTime = (time12: string): { hours: number; minutes: number } => {
    const [timePart, period] = time12.split(/([ap]m)$/i);
    const [hoursRaw, minutes] = timePart.split(":").map(Number);

    let hours = hoursRaw;
    if (period.toLowerCase() === "pm" && hours < 12) {
      hours += 12;
    } else if (period.toLowerCase() === "am" && hours === 12) {
      hours = 0;
    }

    return { hours, minutes };
  };

  // Calculate end time based on start time and duration
  const calculateEndTime = (
    startTime: string,
    durationHours: number
  ): string => {
    // If full day is selected (either value 16 or 21)
    if (durationHours >= 16) {
      return WORKING_HOURS.end;
    }

    const { hours, minutes } = parseTime(startTime);

    // Calculate hours and minutes after adding duration
    const totalMinutes = hours * 60 + minutes + durationHours * 60;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;

    // Cap at end of working hours if needed
    const endTime = parseTime(WORKING_HOURS.end);
    const endTotalMinutes = endTime.hours * 60 + endTime.minutes;

    if (totalMinutes > endTotalMinutes) {
      return WORKING_HOURS.end;
    }

    // Convert back to 12-hour format
    return convertTo12Hour(`${newHours}:${newMinutes}`);
  };

  // Get appropriate duration options based on selected start time
  const getAvailableDurations = (startTime: string) => {
    if (!startTime) return durations;

    const start = parseTime(startTime);
    const startTotalMinutes = start.hours * 60 + start.minutes;

    const end = parseTime(WORKING_HOURS.end);
    const endTotalMinutes = end.hours * 60 + end.minutes;

    // Calculate maximum duration in hours from start time to end of working hours
    const maxDurationHours = (endTotalMinutes - startTotalMinutes) / 60;

    return durations.filter(
      (d) =>
        parseFloat(d.value) <= maxDurationHours ||
        d.value === "21" ||
        d.value === "16"
    );
  };

  // Update end time whenever start time or duration changes
  useEffect(() => {
    if (newPeriod.startTime && newPeriod.duration) {
      const endTime = calculateEndTime(
        newPeriod.startTime,
        parseFloat(newPeriod.duration)
      );
      setNewPeriod((prev) => ({ ...prev, endTime }));
    }
  }, [newPeriod.startTime, newPeriod.duration]);

  // Handle the add period action
  const handleAddPeriod = () => {
    setError(null);

    if (!newPeriod.day) {
      setError("Please select a day");
      return;
    }

    if (!newPeriod.startTime || !newPeriod.endTime) {
      setError("Start time and end time are required");
      return;
    }

    // For full day, use the entire working hours range
    let { startTime, endTime } = newPeriod;
    if (newPeriod.duration === "16" || newPeriod.duration === "21") {
      startTime = WORKING_HOURS.start;
      endTime = WORKING_HOURS.end;
    }

    // Convert times to 24-hour format for backend if needed
    const start24 =
      startTime.includes("am") || startTime.includes("pm")
        ? convertTo24Hour(startTime)
        : startTime;

    const end24 =
      endTime.includes("am") || endTime.includes("pm")
        ? convertTo24Hour(endTime)
        : endTime;

    createUnavailablePeriod({
      variables: {
        input: {
          day: newPeriod.day,
          startTime: start24,
          endTime: end24,
        },
      },
    });

    // Reset form (dialog will close on successful mutation)
    setNewPeriod({
      day: "",
      startTime: "1:00am", // Reset to new default start time (1am)
      endTime: "2:00am", // Reset to new default end time (2am)
      duration: "1",
    });
  };

  const handleDeletePeriod = (id: string) => {
    deleteUnavailablePeriod({
      variables: { id },
    });
  };

  // Get current day of week
  const getCurrentDay = (): string => {
    const dayIndex = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to our array index (which starts with Monday at index 0)
    const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return daysOfWeek[adjustedIndex];
  };

  // Set current day when opening dialog
  const handleOpenDialog = () => {
    setNewPeriod((prev) => ({
      ...prev,
      day: getCurrentDay(),
    }));
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="booked" className="container mx-auto py-6">
        {/* Tabs for switching between booked schedule and unavailable times */}
        {bookingType && bookingType.length > 0 ? (
          <>
            <TabsList className="flex justify-center items-center">
                {bookingType.includes(BookType.RENTAL) && (
                <>
                  <TabsTrigger value="rental">Rental Booking</TabsTrigger>
                  <TabsTrigger value="rentalform">Rental Forms</TabsTrigger>
                </>
              )}
              {bookingType.includes(BookType.APPOINTMENT) && (
               <>
                <TabsTrigger value="unavailable">Unavailable Times</TabsTrigger>
                <TabsTrigger value="booked">Booked Schedule</TabsTrigger>
               </>
              )}
              {bookingType.includes(BookType.EVENT) && (
                <TabsTrigger value="event">Event Schedule</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="booked">
              {bookingType.includes(BookType.EVENT) && <EventBookedMembers />}
              {bookingType.includes(BookType.APPOINTMENT) && (
                <AppointmentBookedMembers />
              )}
            </TabsContent>
            <TabsContent value="unavailable">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Your Unavailable Hours</CardTitle>
                  <CardDescription>
                    Set the times when you are not available to provide services
                    during your working hours (1am - 10pm).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-6">
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={handleOpenDialog}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Unavailable Period
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Unavailable Period</DialogTitle>
                          <DialogDescription>
                            Select when you are not available during your
                            working hours (1am - 10pm).
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {error && (
                            <Alert variant="destructive">
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}

                          <div className="grid gap-2">
                            <Label htmlFor="day">Day</Label>
                            <Select
                              value={newPeriod.day}
                              onValueChange={(value) =>
                                setNewPeriod({ ...newPeriod, day: value })
                              }
                            >
                              <SelectTrigger id="day">
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                              <SelectContent>
                                {daysOfWeek.map((day) => (
                                  <SelectItem key={day} value={day}>
                                    {day}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                              <Label htmlFor="startTime">Start Time</Label>
                              <Select
                                value={newPeriod.startTime}
                                onValueChange={(value) => {
                                  const endTime = calculateEndTime(
                                    value,
                                    parseFloat(newPeriod.duration)
                                  );
                                  setNewPeriod({
                                    ...newPeriod,
                                    startTime: value,
                                    endTime,
                                  });
                                }}
                              >
                                <SelectTrigger id="startTime">
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="max-h-48 overflow-y-auto">
                                    {availableStartTimes.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid gap-2">
                              <Label htmlFor="duration">Duration</Label>
                              <Select
                                value={newPeriod.duration}
                                onValueChange={(value) => {
                                  const endTime = calculateEndTime(
                                    newPeriod.startTime,
                                    parseFloat(value)
                                  );
                                  setNewPeriod({
                                    ...newPeriod,
                                    duration: value,
                                    endTime,
                                  });
                                }}
                              >
                                <SelectTrigger id="duration">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                  <div className="max-h-48 overflow-y-auto">
                                    {getAvailableDurations(
                                      newPeriod.startTime
                                    ).map((duration) => (
                                      <SelectItem
                                        key={duration.value}
                                        value={duration.value}
                                      >
                                        {duration.label}
                                      </SelectItem>
                                    ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="border p-3 rounded-md bg-muted/50">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              {newPeriod.duration === "16" ||
                              newPeriod.duration === "21" ? (
                                <span className="text-sm">
                                  You will be marked unavailable for the entire
                                  day (1am - 10pm).
                                </span>
                              ) : (
                                <span className="text-sm">
                                  You will be marked unavailable from{" "}
                                  <strong>{newPeriod.startTime}</strong> to{" "}
                                  <strong>{newPeriod.endTime}</strong>.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleAddPeriod}
                            disabled={createLoading}
                          >
                            {createLoading ? "Adding..." : "Add Period"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {queryLoading && (
                    <div className="flex justify-center py-8">
                      <p>Loading periods...</p>
                    </div>
                  )}

                  {queryError && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertDescription>
                        Error loading periods: {queryError.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!queryLoading &&
                  !queryError &&
                  unavailablePeriods.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time Period</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unavailablePeriods.map((period) => (
                          <TableRow key={period.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                {period.day}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                {period.startTime === WORKING_HOURS.start &&
                                period.endTime === WORKING_HOURS.end
                                  ? "Full Day (1am - 10pm)"
                                  : `${period.startTime} - ${period.endTime}`}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePeriod(period.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    !queryLoading &&
                    !queryError && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">
                          No unavailable periods set
                        </h3>
                        <p className="text-muted-foreground mt-1 mb-4">
                          You haven't set any unavailable periods yet. Add one
                          to let customers know when you're not available.
                        </p>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="event">
              <EventCreationForm />
            </TabsContent>

            {bookingType.includes(BookType.RENTAL) && (
              <>
                <TabsContent value="rental">
                  <InventoryList />
                </TabsContent>

                <TabsContent value="rentalform">
                  <InventoryItemForm />
                </TabsContent>
              </>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pb-20 pt-10 px-4 text-center bg-white rounded-2xl shadow-md">
            <Library className="h-14 w-14 text-muted-foreground mb-6" />

            <h3 className="text-xl font-semibold">
              No Booking Types Available
            </h3>

            <p className="text-muted-foreground mt-2 mb-8 max-w-md">
              You haven’t set any booking types yet. Add one to manage your
              availability and let clients book with ease.
            </p>

            <Link to={`/booktypes`}>
              <Button className="flex items-center gap-2 px-4 py-2 rounded-md">
                <Library className="w-4 h-4" />
                <span>Set Book Type</span>
              </Button>
            </Link>

            <div className="text-center max-w-3xl mx-auto mt-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Choose Your Booking Type
              </h1>

              <p className="text-muted-foreground text-lg">
                Pick the booking type that suits your workflow. Whether it’s
                consultations, sessions, or services—each option is tailored to
                help you stay organized.
              </p>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}

// function BookedMembers({
//   unavailablePeriods,
// }: {
//   unavailablePeriods: UnavailablePeriod[];
// }) {
//   return (
//     <Card className="bg-white/95 shadow-md rounded-2xl p-6 mt-4">
//       <CardContent>
//         <div className="grid grid-cols-3  mt-3 gap-2 md:grid-cols-4 lg:grid-cols-3">
//           {daysOfWeek.map((day) => (
//             <div key={day} className="flex flex-col">
//               <div className="text-center font-medium py-2 bg-muted rounded-t-md">
//                 {day.substring(0, 3)}
//               </div>
//               <div className="border rounded-b-md p-2 h-32 overflow-y-auto">
//                 {unavailablePeriods
//                   .filter((period) => period.day === day)
//                   .map((period) => (
//                     <div
//                       key={period.id}
//                       className="text-xs bg-destructive/10 text-destructive rounded p-1 mb-1"
//                     >
//                       {period.startTime === WORKING_HOURS.start &&
//                       period.endTime === WORKING_HOURS.end
//                         ? "Full Day"
//                         : `${period.startTime} - ${period.endTime}`}
//                     </div>
//                   ))}
//               </div>
//             </div>
//           ))}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
