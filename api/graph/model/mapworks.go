package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type IsochroneResult struct {
	ID            uuid.UUID       `gorm:"type:uuid;primary_key" json:"id"`
	GeoJSON       json.RawMessage `json:"geojson"`
	Locations     pq.Float64Array `gorm:"type:float[]" json:"locations,omitempty"`
	Range         pq.Int32Array   `gorm:"type:int[]" json:"range,omitempty"`
	TransportMode *string         `json:"transportMode,omitempty"`
	Address       *string         `json:"address,omitempty"`
	CreatedAt     string          `json:"createdAt,omitempty"`
	UpdatedAt     string          `json:"updatedAt,omitempty"`
	Status        string          `json:"status,omitempty"`
	RiderID       string          `json:"rider_id,omitempty"`
	VendorID      string          `json:"vendor_id"`
	Error         string          `json:"error,omitempty"`
	ErrorCode     string          `json:"errorCode,omitempty"`
	RiderRangeIDs pq.StringArray `gorm:"type:text[]" json:"riderRangeIds,omitempty"` // List of RiderRange IDs
}

type IsochroneRiderRangeLink struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	RiderRangeID string    `json:"riderRangeId"` // ID of the RiderRange
	IsochroneID  string    `json:"isochroneId"`  // ID
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}
type RouteInfo struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	OrderID   string    `json:"orderId"` //its the same as the bookingId
	UserID    string    `json:"user_id"`
	Geojson   *string   `json:"geojson,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type RiderRange struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	RiderID   string    `json:"riderId"`
	StartKm   float64   `json:"startKm"`
	EndKm     float64   `json:"endKm"`
	Price     float64   `json:"price"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
