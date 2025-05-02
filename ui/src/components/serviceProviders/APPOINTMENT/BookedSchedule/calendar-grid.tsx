import { format } from "date-fns";
import { AppointmentBooking } from "./types";
import { CalendarDay } from "./calendar-day";

interface CalendarGridProps {
  weekDays: Date[];
  currentMonth: Date;
  bookingsByDate: Record<string, AppointmentBooking[]>;
  onDayHeaderClick: (date: Date) => void;
  onBookingClick: (booking: AppointmentBooking) => void;
  workingHours: { start: string; end: string };
  getBookingStatus: (
    booking: AppointmentBooking
  ) => "pending" | "confirmed" | "new";
}

export function CalendarGrid({
  weekDays,
  currentMonth,
  bookingsByDate,
  onDayHeaderClick,
  onBookingClick,
  workingHours,
  getBookingStatus,
}: CalendarGridProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {weekDays.map((date, index) => {
          const dateKey = format(date, "yyyy-MM-dd");
          const dayBookings = bookingsByDate[dateKey] || [];

          return (
            <div>
              <div
                key={`header-${index}`}
                className="text-center font-medium py-2 bg-muted rounded-t-md cursor-pointer hover:bg-muted/80"
                onClick={() => onDayHeaderClick(date)}
              >
                {format(date, "EEE")}
                <div className="text-xs text-muted-foreground">
                  {format(date, "MMM d")}
                </div>
              </div>
              <CalendarDay
                key={`day-${index}`}
                date={date}
                currentMonth={currentMonth}
                bookings={dayBookings}
                onBookingClick={onBookingClick}
                workingHours={workingHours}
                getBookingStatus={getBookingStatus}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
