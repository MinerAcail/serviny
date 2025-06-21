package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Admin struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Number    string    `json:"number"`
	Password  *string   `json:"password,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type JobRequest struct {
	ID       uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name     string    `json:"name"`
	Email    string    `json:"email"`
	Type     string    `json:"type"`
	Number   string    `json:"number"`
	State    string    `json:"state"`
	Password *string   `json:"password,omitempty"`
	Dpfile   *string   `json:"dpfile,omitempty"`

	Availability *bool     `json:"availability,omitempty"`
	Location     *string   `json:"location,omitempty"`
	Experience   string    `json:"experience"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Session struct {
	ID        string    `json:"id"`
	UserID    *string   `json:"userId,omitempty"`
	IPAddress string    `json:"ipAddress"`
	UserAgent string    `json:"userAgent"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type UsersInfor struct {
	ID          string          `json:"id"`
	Name        string          `json:"name"`
	Type        string          `json:"type"`
	Number      string          `json:"number"`
	Email       string          `json:"email"`
	Location    *string         `json:"location,omitempty"`
	Coordinates pq.Float64Array ` gorm:"type:float[]" json:"coordinates"` // [lng, lat]

	Dpfile *string `json:"dpfile,omitempty"`
}




type BookingOrderPaymentStatus struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	ServiceID  *string   `json:"serviceId,omitempty"`
	UserID     *string   `json:"userId,omitempty"`
	RiderID    *string   `json:"riderId,omitempty"`
	Status     string    `json:"status"`
	Method     string    `json:"method"`
	EntityID   string    `json:"entityId"`
	EntityType string    `json:"entityType"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}