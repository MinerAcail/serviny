"use client"

import { format } from "date-fns"
import { Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
// import type { Event } from "@/types/event"
export interface Event {
  id: string
  name: string
  date: Date
  duration: number // in minutes
  maxAttendees: number
  currentAttendees: number
  location: string
  price: number
  description: string
  instructor: string
}

interface EventListProps {
  events: Event[]
  onEventClick: (event: Event) => void
}

export function EventList({ events, onEventClick }: EventListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="h-3 w-full bg-primary" aria-hidden="true" />
            <div className="p-6">
              <div className="space-y-1.5">
                <h3 className="font-semibold">{event.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(event.date, "h:mm a")} • {event.duration} mins
                </p>
                <p className="text-sm text-muted-foreground">{event.location}</p>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Users className="mr-1 h-4 w-4" />
                <span>
                  {event.currentAttendees}/{event.maxAttendees} spots filled
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="font-medium">${event.price}</div>
            <Button size="sm" onClick={() => onEventClick(event)}>
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
