
import { format } from "date-fns"
import { CalendarClock, MapPin, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Event } from "./listbooks"

interface EventModalProps {
  event: Event
  isOpen: boolean
  onClose: () => void
}

export function EventModal({ event, isOpen, onClose }: EventModalProps) {
  const spotsRemaining = event.maxAttendees - event.currentAttendees

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
          <DialogDescription>Instructor: {event.instructor}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Date & Time</div>
              <div className="text-sm text-muted-foreground">{format(event.date, "EEEE, MMMM d, yyyy")}</div>
              <div className="text-sm text-muted-foreground">
                {format(event.date, "h:mm a")} -{" "}
                {format(new Date(event.date.getTime() + event.duration * 60000), "h:mm a")}
                <span className="ml-1">({event.duration} minutes)</span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Location</div>
              <div className="text-sm text-muted-foreground">{event.location}</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <div className="font-medium">Attendance</div>
              <div className="text-sm text-muted-foreground">
                {spotsRemaining} {spotsRemaining === 1 ? "spot" : "spots"} remaining
                <span className="ml-1">
                  ({event.currentAttendees}/{event.maxAttendees} filled)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <div className="font-medium">Description</div>
            <p className="text-sm text-muted-foreground">{event.description}</p>
          </div>

          <div className="mt-2">
            <div className="font-medium">Price</div>
            <p className="text-2xl font-bold">${event.price}</p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={spotsRemaining === 0}>
            {spotsRemaining > 0 ? "Book Now" : "Sold Out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
