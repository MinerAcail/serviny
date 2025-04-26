package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Service struct {
	ID         uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name       string         `json:"name"`
	Type       string         `json:"type"`
	Number     string         `json:"number"`
	Email      string         `json:"email"`
	Profession pq.StringArray `gorm:"type:text[]" json:"profession,omitempty"`
	Password   *string        `json:"password,omitempty"`
	Location   *string        `json:"location,omitempty"`
	AboutMe    *string        `json:"about_me,omitempty"`
	Dpfile     *string        `json:"dpfile,omitempty"`
	BookType   *BookingType        `json:"book_type,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}
type GalleryProfession struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Title       *string        `json:"title,omitempty"`
	Categories  pq.StringArray `gorm:"type:text[]" json:"categories,omitempty"`
	ServiceID   *string        `json:"ServiceId,omitempty"`
	ImageUrls   pq.StringArray `gorm:"type:text[]" json:"imageUrls,omitempty"`
	Description *string        `json:"description,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type Policy struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name        string         `json:"name"`
	ServiceID   *string        `json:"ServiceId,omitempty"`
	Description string         `json:"description"`
	DetailsIds  pq.StringArray `gorm:"type:text[]" json:"detailsIds,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type PolicyDetail struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Title     string         `json:"title"`
	Content   string         `json:"content"`
	ListItems pq.StringArray `gorm:"type:text[]" json:"listItems,omitempty"`
	PolicyID  *string        `json:"PolicyId,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type Price struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Label       string     `json:"label"`
	Value       string     `json:"value"`
	PriceCardID *string    `json:"priceCardId,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type PriceCard struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Title       string     `json:"title"`
	Description string     `json:"description"`
	ServiceID   *string    `json:"ServiceId,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type Amenity struct {
	ID          uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Text        string     `json:"text"`
	PriceCardID *string    `json:"priceCardId,omitempty"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type Booker struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name      string     `json:"name"`
	Number    string     `json:"number"`
	ServiceID string     `json:"ServiceId"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}

type TimeSlot struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID string     `json:"ServiceId"`
	StartTime time.Time  `json:"startTime"`
	EndTime   time.Time  `json:"endTime"`
	BookerID  *string    `json:"bookerId,omitempty"`
	Notes     *string    `json:"notes,omitempty"`
	IsBooked  bool       `json:"isBooked"`
	TableSize int32      `json:"tableSize"`
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
}
