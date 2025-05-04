"use client"

import { useState, useEffect } from "react"
import { ChevronLeftIcon, ChevronRightIcon, MinusIcon, PlusIcon } from "lucide-react"
import { format, addDays, isSameDay, isBefore, startOfDay, eachDayOfInterval, subDays } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// GraphQL client
import { useMutation } from "@apollo/client"
import { gql } from "@apollo/client"
import { toast } from "sonner"

// Define the mutation
const CREATE_EVENT = gql`
  mutation CreateEvent($input: EventInput!) {
    createEvent(input: $input) {
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

export function EventCreationForm() {
  const today = startOfDay(new Date())
  const [currentDate, setCurrentDate] = useState<Date>(today)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [visibleDates, setVisibleDates] = useState<Date[]>([])
  const [bookedDates, setBookedDates] = useState<Date[]>([])
  // const { toast } = useToast()
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

  // Create event mutation
  const [createEvent, { loading }] = useMutation(CREATE_EVENT, {
    onCompleted: (data) => {
      toast.success(`${data.createEvent.name} has been successfully created.`)
      resetForm()
    },
    onError: (error) => {
      toast.error("An error occurred while creating the event.", {
        description: error.message,
      })
    }
  })

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

  // Reset form after submission
  const resetForm = () => {
    setName("")
    setSelectedDate(undefined)
    setStartTime("")
    setBookingDuration(30)
    setLocation("")
    setInstructor("")
    setMaxAttendees(undefined)
    setPrice(undefined)
    setDescription("")
    setRecurring("none")
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
    createEvent({
      variables: {
        input: eventInput
      }
    })
  }

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
    <Card className="p-6">
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
              <Select onValueChange={setStartTime} value={startTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <>
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {hour === 0
                          ? "12:00 AM"
                          : hour < 12
                            ? `${hour}:00 AM`
                            : hour === 12
                              ? "12:00 PM"
                              : `${hour - 12}:00 PM`}
                      </SelectItem>
                      <SelectItem key={`${hour}:30`} value={`${hour}:30`}>
                        {hour === 0
                          ? "12:30 AM"
                          : hour < 12
                            ? `${hour}:30 AM`
                            : hour === 12
                              ? "12:30 PM"
                              : `${hour - 12}:30 PM`}
                      </SelectItem>
                    </>
                  ))}
                </SelectContent>
              </Select>
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Event"}
        </Button>
      </form>
    </Card>
  )
}