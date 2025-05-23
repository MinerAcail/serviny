package model

import (
	"time"

	"github.com/google/uuid"
)

type UnavailablePeriod struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID string    `json:"service_id"`
	Day       string    `json:"day"`
	StartTime string    `json:"startTime"`
	EndTime   string    `json:"endTime"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
//
type AppointmentBooking struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	StartTime string    `json:"startTime"`
	EndTime   string    `json:"endTime"`
	Day       string    `json:"day"`
	Notes     *string   `json:"notes,omitempty"`
	Item     *string   `json:"item,omitempty"`
	TableSize int32     `json:"tableSize"`
	ServiceID string    `json:"service_Id"`
	RiderID string    `json:"riderId"`
	UserID    string    `json:"userId"`
	IsConfirmed *bool      `json:"isConfirmed,omitempty"`
	UserType  UserType  `json:"userType"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}



func (User) IsReturns()    {}
func (Service) IsReturns() {}
func (Rider) IsReturns() {}
func (Admin) IsReturns() {}
