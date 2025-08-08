package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
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

type AppointmentBooking struct {
	ID                    uuid.UUID       `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	StartTime             string          `json:"startTime"`
	EndTime               string          `json:"endTime"`
	Day                   string          `json:"day"`
	Notes                 *string         `json:"notes,omitempty"`
	Item                  *string         `json:"item,omitempty"`
	TableSize             int32           `json:"tableSize"`
	ServiceID             string          `json:"service_Id"`
	RiderID               string          `json:"riderId"`
	DeliveryFee           *string         `json:"deliveryFee,omitempty"`
	Distance              *string         `json:"distance,omitempty"`
	Duration              *string         `json:"duration,omitempty"`
	DropoffLocation       pq.Float64Array ` gorm:"type:float[]" json:"dropoff_Location"` // [lng, lat]
	PickupLocation        pq.Float64Array ` gorm:"type:float[]" json:"pickup_Location"`  // [lng, lat]
	EstimatedDeliveryDate *string         `json:"estimatedDeliveryDate,omitempty"`
	DeliveryAddress       string          `json:"deliveryAddress"`
	PickUpAddress         *string         `json:"pickUpAddress,omitempty"`
	UserID                string          `json:"userId"`
	IsConfirmed           *bool           `json:"isConfirmed,omitempty"`
	UserType              UserType        `json:"userType"`
	MultiGroupID          *string         `json:"multiGroupId,omitempty"`
	CargoID               *string         `json:"cargoId,omitempty"`
	RangeMetaID               *string         `json:"rangeMetaId,omitempty"`
	RouteInfoID         *string         `json:"routeInfoId,omitempty"`

	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type BookingCargo struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID     *string   `json:"serviceId,omitempty"`
	UserID        *string   `json:"userId,omitempty"`
	RiderID       *string   `json:"riderId,omitempty"`
	TransportType string    `json:"transportType"`
	BookingID     *string   `json:"bookingId,omitempty"`
	MultiGroupID  *string   `json:"multiGroupId,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (User) IsReturns()    {}
func (Service) IsReturns() {}
func (Rider) IsReturns()   {}
func (Admin) IsReturns()   {}
