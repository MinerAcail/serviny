"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppointmentBooking, UserData } from "./types";
import {
  Check,
  Clock,
  Copy,
  LoaderCircle,
  MessageSquare,
  Phone,
  RefreshCwOff,
  Send,
  Trash2,
  User,
  X,
} from "lucide-react";
import { formatTime } from "./date-utils";
import { useQuery } from "@apollo/client";
import { GET_CONFIRMED_BOOKINGS } from ".";
// import { useQuery } from "@apollo/client"

interface BookingDetailProps {
  booking: AppointmentBooking;
  userData: UserData | null;
  status: "pending" | "confirmed" | "new";
  badgeVariant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | null
    | undefined;
  onCopyNumber: (number: string) => void;
  onContactClick: () => void;
  onConfirmClick: () => void;
  onDeleteClick: () => void;
}

export function BookingDetail({
  booking,
  userData,
  status,
  badgeVariant,
  onCopyNumber,
  onContactClick,
  onConfirmClick,
  onDeleteClick,
}: BookingDetailProps) {
  const { data, loading, error } = useQuery(GET_CONFIRMED_BOOKINGS, {
    variables: { id: booking.book.id },
  });
  //   console.log("Confirmed Bookings:", data?.getConfirmedBookings);
  const checkedBookings = data?.getConfirmedBookings;

  const bookDetails = booking.book;

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className={cn("h-1.5", {
          "bg-secondary": status === "pending",
          "bg-primary": status === "confirmed",
          "bg-muted": status === "new",
        })}
      ></div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-lg">
            {userData?.name || "Unknown User"}
          </h3>
          <Badge variant={badgeVariant}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
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
                  onClick={() => onCopyNumber(userData.number)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-xs"
                  asChild
                >
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
              {formatTime(bookDetails.startTime)} -{" "}
              {formatTime(bookDetails.endTime)}
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
            onClick={onContactClick}
          >
            <Send className="h-3.5 w-3.5" />
            Contact
          </Button>
          {loading ? (
            <LoaderCircle className="animate-spin" />
          ) : error ? (
            <X />
          ) : checkedBookings ? (
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={onConfirmClick}
            >
              <RefreshCwOff className="h-3.5 w-3.5" />
              Cancel
            </Button>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="gap-1"
              onClick={onConfirmClick}
            >
              <Check className="h-3.5 w-3.5" />
              Confirm
            </Button>
          )}
          {/* <Button
            variant="default"
            size="sm"
            className="gap-1"
            onClick={onConfirmClick}
          >
            <Check className="h-3.5 w-3.5" />
            Confirm
          </Button> */}
          <Button
            variant="destructive"
            size="sm"
            className="gap-1"
            onClick={onDeleteClick}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
