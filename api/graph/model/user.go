package model

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Name       string    `json:"name"`
	Number     string    `json:"number"`
	NumberType string    `json:"number_type"`
	Type       string    `json:"type"`
	Password   *string   `json:"password,omitempty"`
	Email   *string   `json:"email,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
