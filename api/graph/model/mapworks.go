package model

import "encoding/json"

type IsochroneResult struct {
	GeoJSON json.RawMessage `json:"geojson"`
}
