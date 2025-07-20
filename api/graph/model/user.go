package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type User struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Name       string    `json:"name"`
	Number     string    `json:"number"`
	NumberType string    `json:"number_type"`
	Type       string    `json:"type"`
	Password   *string   `json:"password,omitempty"`
	Email      *string   `json:"email,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
type Profiles struct {
	ID         uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Type       string         `json:"type"`
	UserId     string         `json:"userId"`
	ProfileIds pq.StringArray `gorm:"type:text[]" json:"profile_Ids,omitempty"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
}
type UserManager struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Type       string    `json:"type"`
	UserID     string    `json:"userId"`
	Password   *string   `json:"password,omitempty"`
	ServiceID  *string   `json:"serviceId,omitempty"`
	EntityID   *string   `json:"entityId,omitempty"`
	EntityType *string   `json:"entityType,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
