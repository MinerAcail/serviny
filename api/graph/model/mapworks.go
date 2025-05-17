package model

import "encoding/json"
// IsochroneResult represents the result of an isochrone generation
// IsochroneResult represents the result of an isochrone generation
type IsochroneResult struct {
    GeoJSON       json.RawMessage `json:"geojson"`
    UUID          string          `json:"uuid,omitempty"`
    Locations     [][]float64     `json:"locations,omitempty"`
    Range         []int32         `json:"range,omitempty"`
    TransportMode *string         `json:"transportMode,omitempty"`
    Address       *string         `json:"address,omitempty"`
}