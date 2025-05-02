import { isSameDay, getMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { AppointmentBooking } from "./types"
import { BookingItem } from "./booking-item"

interface CalendarDayProps {
  date: Date
  currentMonth: Date
  bookings: AppointmentBooking[]
  onBookingClick: (booking: AppointmentBooking) => void
  workingHours: { start: string; end: string }
  getBookingStatus: (booking: AppointmentBooking) => "pending" | "confirmed" | "new"
}

export function CalendarDay({
  date,
  currentMonth,
  bookings,
  onBookingClick,
  workingHours,
  getBookingStatus,
}: CalendarDayProps) {
  const isToday = isSameDay(date, new Date())
  const isCurrentMonth = getMonth(date) === getMonth(currentMonth)

  return (
    <div
      className={cn(
        "border rounded-b-md p-2 h-48 overflow-y-auto bg-card",
        isToday && "ring-2 ring-primary ring-opacity-50",
        !isCurrentMonth && "opacity-50"
      )}
    >
        
      {bookings.length > 0 ? (
        bookings.map((booking) => {
          const bookDetails = booking.book
          if (!bookDetails) return null

          const isFullDay = bookDetails.startTime === workingHours.start && bookDetails.endTime === workingHours.end
          const status = getBookingStatus(booking)

          return (
            <BookingItem
              key={bookDetails.id}
              booking={booking}
              status={status}
              isFullDay={isFullDay}
              onClick={() => onBookingClick(booking)}
            />
          )
        })
      ) : (
        <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No bookings</div>
      )}
    </div>
  )
}
