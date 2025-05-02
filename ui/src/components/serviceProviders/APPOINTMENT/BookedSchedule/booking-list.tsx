// import { AppointmentBooking } from "@/types/appointment"
import { BookingListItem } from "./booking-list-item"
import { AppointmentBooking, UserData } from "./types"
// import { BookingListItem } from "./booking-list-item"

    interface BookingListProps {
    bookings: AppointmentBooking[]
    getUserData: (usersData: UserData[]) => UserData

    getBookingStatus: (booking: AppointmentBooking) => "pending" | "confirmed" | "new"
    onBookingClick: (booking: AppointmentBooking) => void
    onContactClick: (booking: AppointmentBooking) => void
    onConfirmClick: (booking: AppointmentBooking) => void
    onDeleteClick: (booking: AppointmentBooking) => void
    }

    export function BookingList({
    bookings,
    getUserData,
    getBookingStatus,
    onBookingClick,
    onContactClick,
    onConfirmClick,
    onDeleteClick,
    }: BookingListProps) {
    if (bookings.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">No bookings available for this week</div>
    }

    return (
        <div className="space-y-3">
        {bookings.map((booking) => {
            const userData = getUserData(booking.usersData)
            if (!booking.book) return null

            const status = getBookingStatus(booking)

            return (
            <BookingListItem
                key={booking.book.id}
                booking={booking}
                status={status}
                userData={userData}
                onClick={() => onBookingClick(booking)}
                onContactClick={(e) => {
                e.stopPropagation()
                onContactClick(booking)
                }}
                onConfirmClick={(e) => {
                e.stopPropagation()
                onConfirmClick(booking)
                }}
                onDeleteClick={(e) => {
                e.stopPropagation()
                onDeleteClick(booking)
                }}
            />
            )
        })}
        </div>
    )
    }
