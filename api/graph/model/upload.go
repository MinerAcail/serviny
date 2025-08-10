package model

import (
	"time"

	"github.com/google/uuid"
)
type VideoImage struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name          string    `json:"name"`
	Description   *string   `json:"description,omitempty"`
	URL           string    `json:"url"`
	Type          *FileType `json:"type,omitempty"`
	CoverImageURL *string   `json:"coverImageUrl,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
}