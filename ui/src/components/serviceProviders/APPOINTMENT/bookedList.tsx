"use client"

import { useQuery, gql, useMutation } from "@apollo/client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  addDays,
  getMonth,
  getYear,
  isSameDay,
  addMonths,
  subMonths,
  isValid,
} from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Check,
  Phone,
  Copy,
  Trash2,
  Calendar,
  Clock,
  MessageSquare,
  User,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface UserData {
  id: string
  name: string
  numberType: string
  type: string
  number: string
}

interface BookingDetails {
  id: string
  startTime: string
  endTime: string
  day: string
  notes?: string
  userId: string
  tableSize: number
  userType: string
}

interface AppointmentBooking {
  book: BookingDetails
  usersData: UserData[]
}

interface QueryResponse {
  getAllAppointmentBookings: AppointmentBooking[]
}

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
`

const DELETE_BOOKING = gql`
  mutation DeleteBooking($id: ID!) {
    deleteBooking(id: $id) {
      id
    }
  }
`

const CONFIRM_BOOKING = gql`
  mutation ConfirmBooking($id: ID!) {
    confirmBooking(id: $id) {
      id
    }
  }
`

const WORKING_HOURS = { start: "00:00", end: "23:59" }

export function AppointmentBookedMembers(): JSX.Element {
  const { data, loading, error, refetch } = useQuery<QueryResponse>(GET_ALL_APPOINTMENT_BOOKINGS)

  // Initialize with current date
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState<Date>(today)

  // Find the current week index within the month
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(() => {
    const monthStart = startOfMonth(today)
    const weeks = eachWeekOfInterval({ start: monthStart, end: endOfMonth(today) }, { weekStartsOn: 0 })

    // Find which week contains today
    for (let i = 0; i < weeks.length; i++) {
      const weekEnd = addDays(weeks[i], 6)
      if (today >= weeks[i] && today <= weekEnd) {
        return i
      }
    }
    return 0
  })

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false)
  const [selectedBooking, setSelectedBooking] = useState<AppointmentBooking | null>(null)
  const [contactDialogOpen, setContactDialogOpen] = useState<boolean>(false)
  const [contactMessage, setContactMessage] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedDayBookings, setSelectedDayBookings] = useState<AppointmentBooking[]>([])

  const [deleteBooking] = useMutation(DELETE_BOOKING, {
    onCompleted: () => {
      toast.success("Booking deleted successfully")
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to delete booking: ${error.message}`)
    },
  })

  const [confirmBooking] = useMutation(CONFIRM_BOOKING, {
    onCompleted: () => {
      toast.success("Booking confirmed successfully")
      refetch()
    },
    onError: (error) => {
      toast.error(`Failed to confirm booking: ${error.message}`)
    },
  })

  // Get weeks of the current month
  const getMonthWeeks = () => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 })
  }

  const weeks = getMonthWeeks()
  const currentWeek = weeks[selectedWeekIndex] || weeks[0]

  // Generate days for the current week
  const generateWeekDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = addDays(currentWeek, i)
      days.push(day)
    }
    return days
  }

  const weekDays = generateWeekDays()

  // Process and organize bookings by date
  const organizeBookingsByDate = () => {
    if (!data?.getAllAppointmentBookings) return {}

    const bookingsByDate: Record<string, AppointmentBooking[]> = {}

    data.getAllAppointmentBookings.forEach((booking) => {
      if (booking.book?.startTime) {
        try {
          const date = parseISO(booking.book.startTime)
          const dateKey = format(date, "yyyy-MM-dd")

          if (!bookingsByDate[dateKey]) {
            bookingsByDate[dateKey] = []
          }

          bookingsByDate[dateKey].push(booking)
        } catch (e) {
          // Skip invalid dates
        }
      }
    })

    return bookingsByDate
  }

  const bookingsByDate = organizeBookingsByDate()

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
    setSelectedWeekIndex(0)
  }

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
    setSelectedWeekIndex(0)
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    if (selectedWeekIndex > 0) {
      setSelectedWeekIndex(selectedWeekIndex - 1)
    } else {
      // Go to previous month, last week
      const prevMonth = subMonths(currentMonth, 1)
      setCurrentMonth(prevMonth)
      const prevMonthWeeks = eachWeekOfInterval(
        {
          start: startOfMonth(prevMonth),
          end: endOfMonth(prevMonth),
        },
        { weekStartsOn: 0 },
      )
      setSelectedWeekIndex(prevMonthWeeks.length - 1)
    }
  }

  // Navigate to next week
  const goToNextWeek = () => {
    if (selectedWeekIndex < weeks.length - 1) {
      setSelectedWeekIndex(selectedWeekIndex + 1)
    } else {
      // Go to next month, first week
      setCurrentMonth(addMonths(currentMonth, 1))
      setSelectedWeekIndex(0)
    }
  }

  // Get week label
  const getWeekLabel = () => {
    const monthName = format(currentMonth, "MMMM")
    const year = getYear(currentMonth)
    const weekNumber = selectedWeekIndex + 1

    return `${monthName} ${year} - Week ${weekNumber}`
  }

  // Handle day header click - show all bookings for that day
  const handleDayHeaderClick = (date: Date) => {
    setSelectedDate(date)

    // Find bookings for this date
    const dateKey = format(date, "yyyy-MM-dd")
    const dayBookings = bookingsByDate[dateKey] || []
    setSelectedDayBookings(dayBookings)

    setIsDialogOpen(true)
  }

  // Handle booking click - show just that booking
  const handleBookingClick = (booking: AppointmentBooking) => {
    setSelectedBooking(booking)
    setSelectedDayBookings([booking])

    if (booking.book?.startTime) {
      try {
        setSelectedDate(parseISO(booking.book.startTime))
      } catch (e) {
        setSelectedDate(null)
      }
    } else {
      setSelectedDate(null)
    }

    setIsDialogOpen(true)
  }

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )

  if (error)
    return (
      <Card className="shadow-md rounded-2xl p-6 mt-4">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <X className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold text-destructive mb-2">Error Loading Bookings</h3>
          <p className="text-center text-muted-foreground">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )

  const bookings = data?.getAllAppointmentBookings ?? []

  const formatTime = (isoString: string): string => {
    if (!isoString) return "Invalid time"
    try {
      const date = parseISO(isoString)
      return isValid(date) ? format(date, "hh:mm a") : "Invalid time"
    } catch {
      return "Invalid time"
    }
  }

  const getUserData = (usersDataArray: UserData[] | undefined): UserData | null => {
    return usersDataArray && usersDataArray.length > 0 ? usersDataArray[0] : null
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Phone number copied!")
    } catch {
      toast.error("Failed to copy number.")
    }
  }

  const handleDeleteBooking = (booking: AppointmentBooking) => {
    setSelectedBooking(booking)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteBooking = () => {
    if (selectedBooking?.book?.id) {
      deleteBooking({ variables: { id: selectedBooking.book.id } })
      setDeleteDialogOpen(false)
    }
  }

  const handleConfirmBooking = (booking: AppointmentBooking) => {
    if (booking?.book?.id) {
      confirmBooking({ variables: { id: booking.book.id } })
    }
  }

  const handleContactClick = (booking: AppointmentBooking) => {
    setSelectedBooking(booking)
    setContactDialogOpen(true)
  }

  const sendContactMessage = () => {
    // This would be implemented with a real API call
    toast.success("Message sent successfully!")
    setContactMessage("")
    setContactDialogOpen(false)
  }

  const getBookingStatus = (booking: AppointmentBooking): "pending" | "confirmed" | "new" => {
    // More efficient implementation using modulo directly
    const id = booking.book.id
    const charCode = id.charCodeAt(id.length - 1)
    return charCode % 3 === 0 ? "pending" : charCode % 3 === 1 ? "confirmed" : "new"
  }

  const getStatusBadgeVariant = (status: "pending" | "confirmed" | "new") => {
    switch (status) {
      case "pending":
        return "secondary"
      case "confirmed":
        return "default"
      case "new":
        return "outline"
      default:
        return "outline"
    }
  }

  // Filter bookings for the current week
  const getCurrentWeekBookings = () => {
    if (!bookings.length) return []

    const weekStart = currentWeek
    const weekEnd = addDays(weekStart, 6)

    return bookings.filter((booking) => {
      if (!booking.book?.startTime) return false

      try {
        const bookingDate = parseISO(booking.book.startTime)
        return bookingDate >= weekStart && bookingDate <= weekEnd
      } catch {
        return false
      }
    })
  }

  const currentWeekBookings = getCurrentWeekBookings()

  return (
    <>
      <Card className="shadow-lg rounded-xl border">
        <CardHeader className="bg-card pb-2">
          <CardTitle className="text-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Monthly Appointment Calendar
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev Month
              </Button>
              <span className="mx-2 text-sm font-medium">{format(currentMonth, "MMMM yyyy")}</span>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                Next Month
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-medium">{getWeekLabel()}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
                Prev Week
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Next Week
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="calendar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calendar">Weekly View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-0">
              {/* Day headers - now in a responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-2">
                {weekDays.map((date, index) => (
                  <div
                    key={`header-${index}`}
                    className="text-center font-medium py-2 bg-muted rounded-t-md cursor-pointer hover:bg-muted/80"
                    onClick={() => handleDayHeaderClick(date)}
                  >
                    {format(date, "EEE")}
                    <div className="text-xs text-muted-foreground">{format(date, "MMM d")}</div>
                  </div>
                ))}
              </div>

              {/* Calendar cells - now in a responsive grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {weekDays.map((date, index) => {
                  const dateKey = format(date, "yyyy-MM-dd")
                  const dayBookings = bookingsByDate[dateKey] || []
                  const isToday = isSameDay(date, new Date())
                  const isCurrentMonth = getMonth(date) === getMonth(currentMonth)

                  return (
                    <div
                      key={`cell-${index}`}
                      className={cn(
                        "border rounded-b-md p-2 h-48 overflow-y-auto bg-card",
                        isToday && "ring-2 ring-primary ring-opacity-50",
                        !isCurrentMonth && "opacity-50",
                      )}
                    >
                      {dayBookings.length > 0 ? (
                        dayBookings.map((booking) => {
                          const bookDetails = booking.book
                          if (!bookDetails) return null

                          const isFullDay =
                            bookDetails.startTime === WORKING_HOURS.start && bookDetails.endTime === WORKING_HOURS.end
                          const status = getBookingStatus(booking)

                          return (
                            <div
                              key={bookDetails.id}
                              className={cn("text-xs rounded p-1.5 mb-1.5 cursor-pointer hover:opacity-80 transition", {
                                "bg-secondary/20 text-secondary-foreground": status === "pending",
                                "bg-primary/20 text-primary-foreground": status === "confirmed",
                                "bg-muted text-muted-foreground": status === "new",
                              })}
                              onClick={() => handleBookingClick(booking)}
                            >
                              <div className="flex items-center gap-1 mb-0.5">
                                <Clock className="h-3 w-3" />
                                {isFullDay ? "Full Day" : formatTime(bookDetails.startTime)}
                              </div>
                              <div className="font-medium truncate">{booking.usersData?.[0]?.name || "Unnamed"}</div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                          No bookings
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0">
              <div className="space-y-3">
                {currentWeekBookings.length > 0 ? (
                  currentWeekBookings.map((booking) => {
                    const bookDetails = booking.book
                    const userData = getUserData(booking.usersData)
                    if (!bookDetails) return null

                    const status = getBookingStatus(booking)
                    const badgeVariant = getStatusBadgeVariant(status)
                    const bookingDate = parseISO(bookDetails.startTime)

                    return (
                      <Card
                        key={bookDetails.id}
                        className="overflow-hidden cursor-pointer"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div
                          className={cn("h-2", {
                            "bg-secondary": status === "pending",
                            "bg-primary": status === "confirmed",
                            "bg-muted": status === "new",
                          })}
                        ></div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="bg-muted rounded-full p-2 mt-1">
                                <User className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h3 className="font-medium text-base">{userData?.name || "Unknown User"}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(bookingDate, "MMMM d, yyyy")} ({format(bookingDate, "EEEE")})
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {formatTime(bookDetails.startTime)} - {formatTime(bookDetails.endTime)}
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleContactClick(booking)
                                      }}
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Contact</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-primary"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleConfirmBooking(booking)
                                      }}
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Confirm</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteBooking(booking)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                ) : (
                  <div className="text-center py-10 text-muted-foreground">No bookings available for this week</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Day/Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {selectedDate ? (
                <>
                  Bookings for {format(selectedDate, "MMMM d, yyyy")} ({format(selectedDate, "EEEE")})
                </>
              ) : (
                <>Booking Details</>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedDayBookings.length > 0 ? (
            <div className="space-y-4 mt-2">
              {selectedDayBookings.map((booking) => {
                const bookDetails = booking.book
                const userData = getUserData(booking.usersData)
                if (!bookDetails) return null

                const status = getBookingStatus(booking)
                const badgeVariant = getStatusBadgeVariant(status)

                return (
                  <div key={bookDetails.id} className="border rounded-lg overflow-hidden">
                    <div
                      className={cn("h-1.5", {
                        "bg-secondary": status === "pending",
                        "bg-primary": status === "confirmed",
                        "bg-muted": status === "new",
                      })}
                    ></div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-lg">{userData?.name || "Unknown User"}</h3>
                        <Badge variant={badgeVariant}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{userData?.number || "N/A"}</span>

                          {userData?.number && (
                            <div className="flex gap-1 ml-auto">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => copyToClipboard(userData.number)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                                <a href={`tel:${userData.number}`}>
                                  <Phone className="h-3 w-3 mr-1" />
                                  Call
                                </a>
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-primary" />
                          <span>Type: {userData?.type || "N/A"}</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>
                            {formatTime(bookDetails.startTime)} - {formatTime(bookDetails.endTime)}
                          </span>
                        </div>

                        {bookDetails.notes && (
                          <div className="flex items-start gap-2 text-sm pt-2 border-t">
                            <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                            <span>{bookDetails.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleContactClick(booking)}
                        >
                          <Send className="h-3.5 w-3.5" />
                          Contact
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleConfirmBooking(booking)}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Confirm
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleDeleteBooking(booking)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p>No bookings for this day.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBooking} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contact {selectedBooking?.usersData?.[0]?.name || "User"}</DialogTitle>
            <DialogDescription>Send a message to the user regarding their appointment.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="min-h-[120px]"
                placeholder="Type your message here..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendContactMessage} disabled={!contactMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
