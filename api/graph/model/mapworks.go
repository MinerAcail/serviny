package model

import (
	"encoding/json"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type IsochroneResult struct {
	ID uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	GeoJSON json.RawMessage `json:"geojson"`
	Locations pq.Float64Array `gorm:"type:float[]" json:"locations,omitempty"`
	Range         pq.Int32Array `gorm:"type:int[]" json:"range,omitempty"`
	TransportMode *string       `json:"transportMode,omitempty"`
	Address       *string       `json:"address,omitempty"`
	CreatedAt     string        `json:"createdAt,omitempty"`
	UpdatedAt     string        `json:"updatedAt,omitempty"`
	Status        string        `json:"status,omitempty"`
	RiderID       string        `json:"rider_id,omitempty"`
	VendorID      string        `json:"vendor_id"`
	Error         string        `json:"error,omitempty"`
	ErrorCode     string        `json:"errorCode,omitempty"`
}
