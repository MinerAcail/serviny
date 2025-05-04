"use client"

import { useState, useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from "lucide-react"
import { format, addDays, isSameDay, isBefore, startOfDay, eachDayOfInterval, subDays, parseISO } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// GraphQL client
import { useMutation, useQuery } from "@apollo/client"
import { gql } from "@apollo/client"
import { toast } from "sonner"
import { useParams } from "react-router"

// Define the query to fetch event details
const GET_EVENT = gql`
  query Event($eventId: String!) {
    event(id: $eventId) {
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
      recurring
    }
  }
`

// Define the mutation
const UPDATE_EVENT = gql`
  mutation updateEvent($input: UpdateEventInput!, $eventId: String!) {
    updateEvent(input: $input, eventId: $eventId) {
      id
      name
      date
      startTime
      duration
      location
      instructor
      maxAttendees
      price
      description
      recurring
    }
  }
`

export function EventUpdateForm() {
  // Get eventId from URL params
  const { eventId } = useParams<{ eventId: string }>()
  console.log("Event ID:", eventId) // Log the eventId to the console;
  
  const today = startOfDay(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(today)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [visibleDates, setVisibleDates] = useState<Date[]>([])
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  console.log(setBookedDates);
  
  // Form state
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [instructor, setInstructor] = useState("")
  const [maxAttendees, setMaxAttendees] = useState<number | undefined>(undefined)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [description, setDescription] = useState("")
  const [recurring, setRecurring] = useState("none")
  
  // Duration state variables (in minutes)
  const [bookingDuration, setBookingDuration] = useState<number>(30)
  const minDuration = 30 // Minimum duration in minutes
  const maxDuration = 1440 // Maximum duration in minutes (24 hours)
  const durationStep = 30 // Increment in minutes

  // Query to fetch existing event data
  const { loading: queryLoading } = useQuery(GET_EVENT, {
    variables: { eventId },
    onCompleted: (data) => {
      console.log("Raw event data:", data.event);
      const event = data.event;
      if (event) {
        setName(event.name || "");
        setLocation(event.location || "");
        setInstructor(event.instructor || "");
        setMaxAttendees(event.maxAttendees || undefined);
        setPrice(event.price || undefined);
        setDescription(event.description || "");
        setRecurring((event.recurring?.toLowerCase() || "none"));
        
        // Handle date
        const eventDate = parseISO(event.date);
        setSelectedDate(eventDate);
        setCurrentDate(eventDate);
        
        // Handle start time - need to ensure it's in the correct format for the Select component
        if (event.startTime) {
          // Extract hours and minutes
          const timeMatch = event.startTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            // Format time as "H:MM" or "HH:MM" based on hours
            const formattedTime = `${hours}:${minutes}`;
            console.log("Setting startTime to:", formattedTime);
            setStartTime(formattedTime);
          }
        }
        
        // Handle duration
        setBookingDuration(event.duration || 30);
      }
    },
    onError: (error) => {
      toast.error("Failed to load event data", {
        description: error.message,
      });
    }
  });

  // Update event mutation
  const [updateEvent, { loading: mutationLoading }] = useMutation(UPDATE_EVENT, {
    onCompleted: (data) => {
      toast.success(`${data.updateEvent.name} has been successfully updated.`);
    },
    onError: (error) => {
      toast.error("An error occurred while updating the event.", {
        description: error.message,
      });
    }
  });

  // Update visible dates whenever currentDate changes
  useEffect(() => {
    // Generate an array of 7 days, centered around the currentDate
    const startOfWeek = subDays(currentDate, 3)
    const endOfWeek = addDays(currentDate, 3)
    
    const dates = eachDayOfInterval({
      start: startOfWeek,
      end: endOfWeek
    })
    
    setVisibleDates(dates)
  }, [currentDate])

  // Log when startTime changes
  useEffect(() => {
    console.log("startTime state updated:", startTime);
  }, [startTime]);

  // Duration functions
  const increaseDuration = () => {
    if (bookingDuration < maxDuration) {
      setBookingDuration(bookingDuration + durationStep)
    }
  }

  const decreaseDuration = () => {
    if (bookingDuration > minDuration) {
      setBookingDuration(bookingDuration - durationStep)
    }
  }

  // Format duration display
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`
    } else if (minutes === 60) {
      return "1 hour"
    } else if (minutes % 60 === 0) {
      return `${minutes / 60} hours`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`
    }
  }

  // Check if a date is included in a booking segment
  const isDateBooked = (date: Date): boolean => {
    return bookedDates.some((bookedDate) => isSameDay(bookedDate, date))
  }

  const isDateInPast = (date: Date): boolean => {
    return isBefore(date, today)
  }

  const handleDateSelect = (date: Date): void => {
    if (!isDateInPast(date)) {
      setSelectedDate(date)
    }
  }

  const handlePreviousWeek = (): void => {
    const newDate = addDays(currentDate, -7)
    // Don't allow navigating to dates before today
    if (!isBefore(newDate, today)) {
      setCurrentDate(newDate)
    }
  }

  const handleNextWeek = (): void => {
    setCurrentDate((prevDate) => addDays(prevDate, 7))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name) {
      toast.error("Missing Information", {
        description: "Please provide an event name.",
      })
      return
    }
    
    if (!selectedDate) {
      toast.error("Missing Information", {
        description: "Please select a date for the event.",
      })
      return
    }
    
    if (!startTime) {
      toast.error("Missing Information", {
        description: "Please select a start time for the event.",
      })
      return
    }
    
    // Format startTime to HH:MM format (backend expects 24-hour format)
    const [hour, minute] = startTime.split(":")
    const formattedStartTime = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
    
    // Convert string inputs to appropriate types
    const eventInput = {
      name,
      date: selectedDate.toISOString(),
      startTime: formattedStartTime,
      duration: bookingDuration,
      location: location || null,
      instructor: instructor || null,
      maxAttendees: maxAttendees || null,
      price: price || null,
      description: description || null,
      recurring: recurring !== "none" ? recurring.toUpperCase() : "NONE",
    }
    
    // Call mutation
    updateEvent({
      variables: {
        input: eventInput,
        eventId: eventId
      }
    })
  }

  // Generate time options for the select
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      // Create options for both :00 and :30 minute intervals
      options.push({
        value: `${hour}:00`,
        label: hour === 0
          ? "12:00 AM"
          : hour < 12
            ? `${hour}:00 AM`
            : hour === 12
              ? "12:00 PM"
              : `${hour - 12}:00 PM`
      });
      
      options.push({
        value: `${hour}:30`,
        label: hour === 0
          ? "12:30 AM"
          : hour < 12
            ? `${hour}:30 AM`
            : hour === 12
              ? "12:30 PM"
              : `${hour - 12}:30 PM`
      });
    }
    return options;
  };

  // Time options for the select
  const timeOptions = generateTimeOptions();

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
            type="button"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-medium">
            {format(currentDate, "MMMM d, yyyy")}
          </h3>
          <Button onClick={handleNextWeek} variant="outline" size="icon" type="button">
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {visibleDates.map((date) => {
            const isPastDate = isDateInPast(date)
            const isBooked = isDateBooked(date)
            return (
              <div
                key={date.toString()}
                onClick={() => !isPastDate && handleDateSelect(date)}
                className={`p-2 text-center rounded-md ${
                  isPastDate
                    ? "text-gray-300 cursor-not-allowed"
                    : isBooked
                    ? "bg-blue-100 border-2 border-blue-500 cursor-pointer"
                    : selectedDate && isSameDay(selectedDate, date)
                    ? "bg-blue-500 text-white cursor-pointer"
                    : "hover:bg-blue-50 cursor-pointer"
                }`}
              >
                <div className="text-xs">{format(date, "EEE")}</div>
                <div className="font-medium">{format(date, "d")}</div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    
    <Card className="bg-gradient-to-b from-primary/10 to-primary/5 rounded-lg shadow-md lg:px-60 p-7 mb-8">
      {queryLoading ? (
        <div className="text-center py-8">Loading event data...</div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Event Name</Label>
              <Input 
                id="name" 
                placeholder="Yoga Class" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Date</Label>
              <div className="border rounded-md p-3">
                <CompactDateSelector />
                {selectedDate && (
                  <div className="mt-2 text-sm font-medium text-center text-blue-500">
                    Selected: {format(selectedDate, "MMMM d, yyyy")}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="time">Start Time</Label>
              <div className="flex items-center gap-2">
                <Select 
                  value={startTime} 
                  onValueChange={(value) => {
                    console.log("Select changed to:", value);
                    setStartTime(value);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Debug display for development */}
              <div className="text-xs text-gray-500">
                Current time value: {startTime}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Duration</Label>
              <div className="border rounded-md p-3">
                <div className="mt-2">
                  <h3 className="text-sm font-medium mb-3">
                    Select Duration (minutes)
                  </h3>
                  <div className="flex items-center justify-center space-x-4">
                    <Button
                      onClick={decreaseDuration}
                      variant="outline"
                      size="icon"
                      disabled={bookingDuration <= minDuration}
                      className="h-10 w-10"
                      type="button"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </Button>

                    <div className="text-center font-medium w-32">
                      {formatDuration(bookingDuration)}
                    </div>

                    <Button
                      onClick={increaseDuration}
                      variant="outline"
                      size="icon"
                      disabled={bookingDuration >= maxDuration}
                      className="h-10 w-10"
                      type="button"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                placeholder="Studio A" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input 
                id="instructor" 
                placeholder="Sarah Johnson" 
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxAttendees">Maximum Attendees</Label>
              <Input 
                id="maxAttendees" 
                type="number" 
                min="1" 
                placeholder="20" 
                value={maxAttendees || ''}
                onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input 
                id="price" 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="15.00" 
                value={price || ''}
                onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Provide details about this event..." 
                rows={4} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="recurring">Recurring</Label>
              <Select value={recurring} onValueChange={setRecurring}>
                <SelectTrigger>
                  <SelectValue placeholder="Not recurring" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not recurring</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={mutationLoading}>
            {mutationLoading ? "Updating..." : "Update Event"}
          </Button>
        </form>
      )}
    </Card>
  )
}