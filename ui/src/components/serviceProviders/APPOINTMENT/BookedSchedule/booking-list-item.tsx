import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AppointmentBooking, UserData } from "./types";
import { Calendar, Check,  Clock, LoaderCircle, RefreshCwOff, Send, Trash2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "./date-utils";
import { useQuery } from "@apollo/client";
import { GET_CONFIRMED_BOOKINGS } from ".";
// import { GET_CONFIRMED_BOOKINGS } from "./booking-item";
// import { formatTime } from "@/lib/date-utils"

interface BookingListItemProps {
  booking: AppointmentBooking;
  status: "pending" | "confirmed" | "new";
  userData: UserData | null;
  onClick: () => void;
  onContactClick: (e: React.MouseEvent) => void;
  onConfirmClick: (e: React.MouseEvent) => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

export function BookingListItem({
  booking,
  status,
  userData,
  onClick,
  onContactClick,
  onConfirmClick,
  onDeleteClick,
}: BookingListItemProps) {
  const { data, loading, error } = useQuery(GET_CONFIRMED_BOOKINGS, {
    variables: { id: booking.book.id },
  });
  const checkedBookings = data?.getConfirmedBookings;

  const bookDetails = booking.book;
  const bookingDate = parseISO(bookDetails.startTime);

  return (
    <Card className="overflow-hidden cursor-pointer" onClick={onClick}>
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
              <h3 className="font-medium text-base">
                {userData?.name || "Unknown User"}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(bookingDate, "MMMM d, yyyy")} (
                {format(bookingDate, "EEEE")})
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Clock className="h-3.5 w-3.5" />
                {formatTime(bookDetails.startTime)} -{" "}
                {formatTime(bookDetails.endTime)}
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
                    onClick={onContactClick}
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
            {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : error ? (
            <X />
          ) : checkedBookings ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={onConfirmClick}
                    >
                      <RefreshCwOff className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cancel</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-primary"
                      onClick={onConfirmClick}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Confirm</p>
                  </TooltipContent>
                </Tooltip>
              )}
            
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive"
                    onClick={onDeleteClick}
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
  );
}
