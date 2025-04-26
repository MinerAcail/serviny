package helper

import (
	"fmt"
	"strconv"
)

// isValidTimeFormat validates the HH:MM time format
func IsValidTimeFormat(timeStr string) bool {
	if len(timeStr) != 5 {
		return false
	}

	hour, err := strconv.Atoi(timeStr[:2])
	if err != nil || hour < 0 || hour > 23 {
		return false
	}

	if timeStr[2] != ':' {
		return false
	}

	minute, err := strconv.Atoi(timeStr[3:])
	if err != nil || minute < 0 || minute > 59 {
		return false
	}

	return true
}

// calculateEndTime returns the end hour and minute based on start time and duration in minutes
func CalculateEndTime(startTime string, durationMinutes int) (int, int) {
	startHour, startMinute := 0, 0
	fmt.Sscanf(startTime, "%d:%d", &startHour, &startMinute)

	totalMinutes := startHour*60 + startMinute + durationMinutes
	endHour := totalMinutes / 60
	endMinute := totalMinutes % 60

	return endHour, endMinute
}
