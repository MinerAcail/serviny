package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Rider struct {
	ID           uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	Type         string    `json:"type"`
	Number       string    `json:"number"`
	State        *string   `json:"state,omitempty"`
	Password     *string   `json:"password,omitempty"`
	Availability *bool     `json:"availability,omitempty"`
	Dpfile       *string   `json:"dpfile,omitempty"`

	IDCard      pq.StringArray `gorm:"type:text[]" json:"idCard,omitempty"`
	Location    *string        `json:"location,omitempty"`
	IsochroneID *string        `json:"IsochroneID,omitempty"`
	// Coordinates  []*float64 `json:"coordinates,omitempty"`
	Coordinates pq.Float64Array ` gorm:"type:float[]" json:"coordinates"` // [lng, lat]
// isTracking
	IsTracking  bool           `json:"isTracking,omitempty"` // Whether the rider is currently being tracked
	// H3Indexes    []*string  `json:"h3Indexes,omitempty"`
	H3Indexes  pq.StringArray `gorm:"type:text[]" json:"h3Indexes,omitempty"` // Multiple resolutions
	Experience string         `json:"experience"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
}

// BookTypes    pq.StringArray `gorm:"type:text[]" json:",omitempty"`

type RidersRequest struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	RiderID         string    `json:"riderId"`
	TermsConditions bool      `json:"termsConditions"`
	Message         *string   `json:"message,omitempty"`
	ServiceID       string    `json:"serviceId"`
	State           string    `json:"state"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}
// Redis keys for caching
const (
	RiderStatusKey    = "rider:status:%s"
	RiderLocationKey  = "rider:location:%s"
	OnlineRidersKey   = "riders:online"
	RiderLastSeenKey  = "rider:lastseen:%s"
)