package model

import (
	"time"

	"github.com/google/uuid"
)

type UnavailablePeriod struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID  string     `json:"service_id"`
	Day       string     `json:"day"`
	StartTime string     `json:"startTime"`
	EndTime   string     `json:"endTime"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

func (User) IsReturns() {}
func (Service) IsReturns()    {}
