import { format, parseISO, isValid } from "date-fns"

export function formatTime(isoString: string): string {
  if (!isoString) return "Invalid time"
  try {
    const date = parseISO(isoString)
    return isValid(date) ? format(date, "hh:mm a") : "Invalid time"
  } catch {
    return "Invalid time"
  }
}
