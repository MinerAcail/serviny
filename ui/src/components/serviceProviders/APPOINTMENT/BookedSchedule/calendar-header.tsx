import { Button } from "@/components/ui/button";
import {  ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface CalendarHeaderProps {
  currentMonth: Date;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  weekLabel: string;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
}

export function CalendarHeader({
  currentMonth,
  goToPreviousMonth,
  goToNextMonth,
  weekLabel,
  goToPreviousWeek,
  goToNextWeek,
}: CalendarHeaderProps) {
  return (
    <div className="flex-row items-center justify-center">
      <div className="flex items-center  justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev Month
          </Button>
          <span className="mx-2 text-sm font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            Next Month
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center  mt-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
            Prev Week
          </Button>
          <div className="text-sm font-medium">{weekLabel}</div>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            Next Week
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
