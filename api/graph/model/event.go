package model

import (
	"time"

	"github.com/google/uuid"
)

//	type Event struct {
//		ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
type Event struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name         string         `json:"name"`
	Date         time.Time      `json:"date"`
	StartTime    string         `json:"startTime"`
	Duration     int32          `json:"duration"`
	Location     *string        `json:"location,omitempty"`
	Instructor   *string        `json:"instructor,omitempty"`
	MaxAttendees *int32         `json:"maxAttendees,omitempty"`
	Price        *float64       `json:"price,omitempty"`
	Description  *string        `json:"description,omitempty"`
	Recurring    *RecurringType `json:"recurring,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	ServiceID    string         `json:"service_id"`
}

type EventBookings struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	EventID   string    `json:"eventId"`
	ServiceID string    `json:"service_id"`

	UserID    string     `json:"userId"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type Category struct {
	ID   uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name string    `json:"name"`
	Icon string    `json:"icon"`

	ServiceID *string   `json:"serviceId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type InventoryItem struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description,omitempty"`
	Price       float64   `json:"price"`
	CategoryID  string    `json:"categoryId"`
	Available   bool      `json:"available"`
	ImageURL    *string   `json:"imageUrl,omitempty"`
	ServiceID   *string   `json:"serviceId,omitempty"`
	Rating      *float64  `json:"rating,omitempty"`
	ReviewCount *int32    `json:"reviewCount,omitempty"`
	CreatedAt   time.Time `json:"createdAt,omitempty"`
	UpdatedAt   time.Time `json:"updatedAt,omitempty"`
}

type UserBookings struct {
	ID         uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	BookTypeID string    `json:"bookTypeId"`
	BookType   string    `json:"bookType"`
	ServiceID  string    `json:"serviceId"`
	UserID     string    `json:"userId"`
	TableSize  *int32    `json:"tableSize,omitempty"`
	Notes      *string   `json:"notes,omitempty"`
	IsBooked   bool      `json:"isBooked"`

	CreatedAt time.Time `json:"createdAt,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
}
