package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Service struct {
	ID         uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name       string         `gorm:"unique" json:"name"`
	Type       string         `json:"type"`
	Number     string         `json:"number"`
	Email      string         `gorm:"unique" json:"email"`
	Profession pq.StringArray `gorm:"type:text[]" json:"profession,omitempty"`
	Password   *string        `json:"password,omitempty"`
	Location   *string        `json:"location,omitempty"`
	AboutMe    *string        `json:"about_me,omitempty"`
	Dpfile     *string        `json:"dpfile,omitempty"`
	NumberType *string        `json:"number_type,omitempty"`
	BookTypes  pq.StringArray `gorm:"type:text[]" json:"book_types,omitempty"`
	IsAuth     *IsAuth        `json:"is_auth,omitempty"`
	SubDomain  *string        `gorm:"unique" json:"sub_domain,omitempty"`
	UseTheme     *string        `json:"use_theme,omitempty"`
	CreatedAt  time.Time      `json:"createdAt"`
	UpdatedAt  time.Time      `json:"updatedAt"`
}
type GalleryProfession struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Title       *string        `json:"title,omitempty"`
	Categories  pq.StringArray `gorm:"type:text[]" json:"categories,omitempty"`
	ServiceID   *string        `gorm:"column:service_id" json:"ServiceId,omitempty"`
	ImageUrls   pq.StringArray `gorm:"type:text[]" json:"imageUrls,omitempty"`
	Description *string        `json:"description,omitempty"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

type Policy struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name        string         `json:"name"`
	ServiceID   *string        `gorm:"column:service_id" json:"ServiceId,omitempty"`
	Description string         `json:"description"`
	DetailsIds  pq.StringArray `gorm:"type:text[]" json:"detailsIds,omitempty"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

type PolicyDetail struct {
	ID        uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Title     string         `json:"title"`
	Content   string         `json:"content"`
	ListItems pq.StringArray `gorm:"type:text[]" json:"listItems,omitempty"`
	PolicyID  *string        `json:"PolicyId,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

type Price struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Label       string    `json:"label"`
	Value       string    `json:"value"`
	PriceCardID *string   `json:"priceCardId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type PriceCard struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Title       string    `json:"title"`
	Description string    `json:"description"`
	ServiceID   *string   `json:"ServiceId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Amenity struct {
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Text        string    `json:"text"`
	PriceCardID *string   `json:"priceCardId,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type Booker struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name      string    `json:"name"`
	Number    string    `json:"number"`
	ServiceID string    `json:"ServiceId"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type TimeSlot struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID string    `json:"ServiceId"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	BookerID  *string   `json:"bookerId,omitempty"`
	Notes     *string   `json:"notes,omitempty"`
	IsBooked  bool      `json:"isBooked"`
	TableSize int32     `json:"tableSize"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Favorite struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	UserID      string         `json:"userId"`
	ServiceID   string         `json:"serviceId"`
	Address     *string        `json:"address,omitempty"`
	OtherNumber pq.StringArray `gorm:"type:text[]" json:"otherNumber,omitempty"`
	Note        *string        `json:"note,omitempty"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}

type SocialMedia struct {
	ID         uuid.UUID          `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID  string             `json:"ServiceId"`
		SocialData *json.RawMessage  `gorm:"type:jsonb" json:"socialData,omitempty"`
	
	CreatedAt  time.Time          `json:"createdAt"`
	UpdatedAt  time.Time          `json:"updatedAt"`
}
