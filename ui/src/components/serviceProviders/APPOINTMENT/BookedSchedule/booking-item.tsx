import { Check, Clock, LoaderCircle, RefreshCwOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppointmentBooking } from "./types";
import { formatTime } from "./date-utils";
import { useQuery } from "@apollo/client";
import { GET_CONFIRMED_BOOKINGS } from ".";

//
interface BookingItemProps {
  booking: AppointmentBooking;
  status: "pending" | "confirmed" | "new";
  isFullDay: boolean;
  onClick: () => void;
}

export function BookingItem({
  booking,
  status,
  isFullDay,
  onClick,
}: BookingItemProps) {
  const { data, loading, error } = useQuery(GET_CONFIRMED_BOOKINGS, {
    variables: { id: booking.book.id },
  });
  return (
    <div
      className={cn(
        "text-xs rounded p-1.5 mb-1.5 cursor-pointer hover:opacity-80 transition",
        {
          "bg-secondary/20 text-secondary-foreground": status === "pending",
          "bg-primary/20 text-primary-foreground": status === "confirmed",
          "bg-muted text-muted-foreground": status === "new",
        }
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-1 mb-0.5">
        <Clock className="h-3 w-3" />
        {isFullDay ? "Full Day" : formatTime(booking.book.startTime)}
      </div>
      <div className="flex items-center gap-1 font-medium truncate">
        {loading ? (
          <LoaderCircle className="animate-spin" />
        ) : error ? (
          <X />
        ) : data?.getConfirmedBookings ? (
          <span className="text-green-500">
            <Check className="w-3 h-3" />
          </span>
        ) : (
          <span className="text-red-500">
            <RefreshCwOff className="w-3 h-3"/>
          </span>
        )}
        {booking.usersData?.[0]?.name || "Unnamed"}
      </div>
    </div>
  );
}
