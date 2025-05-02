import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import type { AppointmentBooking } from "@/types/appointment"
import { Calendar } from "lucide-react"
import { BookingDetail } from "./booking-detail"
import type { AppointmentBooking, UserData } from "./types"

interface BookingDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date | null
  selectedDayBookings: AppointmentBooking[]
  getUserData: (usersData: UserData[]) => UserData

  getBookingStatus: (booking: AppointmentBooking) => "pending" | "confirmed" | "new"
  getStatusBadgeVariant: (status: "pending" | "confirmed" | "new") => "default" | "secondary" | "outline" | "destructive" | null | undefined
  onCopyNumber: (number: string) => void
  onContactClick: (booking: AppointmentBooking) => void
  onConfirmClick: (booking: AppointmentBooking) => void
  onDeleteClick: (booking: AppointmentBooking) => void
}

export function BookingDialog({
  isOpen,
  onOpenChange,
  selectedDate,
  selectedDayBookings,
  getUserData,
  getBookingStatus,
  getStatusBadgeVariant,
  onCopyNumber,
  onContactClick,
  onConfirmClick,
  onDeleteClick,
}: BookingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
              const userData = getUserData(booking.usersData)
              if (!booking.book) return null

              const status = getBookingStatus(booking)
              const badgeVariant = getStatusBadgeVariant(status)

              return (
                <BookingDetail
                  key={booking.book.id}
                  booking={booking}
                  userData={userData}
                  status={status}
                  badgeVariant={badgeVariant}
                  onCopyNumber={onCopyNumber}
                  onContactClick={() => onContactClick(booking)}
                  onConfirmClick={() => onConfirmClick(booking)}
                  onDeleteClick={() => onDeleteClick(booking)}
                />
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
  )
}
