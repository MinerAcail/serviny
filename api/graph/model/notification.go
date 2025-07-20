package model

import (
	"time"

	"github.com/google/uuid"
)

type PushSubscription struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	UserID    *string   `json:"userID,omitempty"`
	Endpoint  *string   `json:"endpoint,omitempty"`
	P256dh    *string   `json:"p256dh,omitempty"`
	Auth      *string   `json:"auth,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type SmsRecord struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Number      string    `json:"number"`
	Message     string    `json:"message"`
	EntityID    *string   `json:"entityId,omitempty"`
	EntityType  *string   `json:"entityType,omitempty"`
	MessageType string    `json:"messageType"`
	Status      string    `json:"status"`
	ServiceID   *string   `json:"serviceId,omitempty"`
	UserID      *string   `json:"userId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
