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

	Categories pq.StringArray `gorm:"type:text[]" json:"categories,omitempty"`

	Password     *string        `json:"password,omitempty"`
	Location     *string        `json:"location,omitempty"`
	AboutMe      *string        `json:"about_me,omitempty"`
	Dpfile       *string        `json:"dpfile,omitempty"`
	NumberType   *string        `json:"number_type,omitempty"`
	BookTypes    pq.StringArray `gorm:"type:text[]" json:"book_types,omitempty"`
	BusinessType *string        `json:"business_type,omitempty"`
	BusinessTypeId *string        `json:"business_type_Id,omitempty"`
	IsVerified   *bool          `json:"is_verified,omitempty"`
	IsAuth       *IsAuth        `json:"is_auth,omitempty"`
	SubDomain    *string        `gorm:"unique" json:"sub_domain,omitempty"`
	UseTheme     *string        `json:"use_theme,omitempty"`
	State        *string        `json:"state,omitempty"`
	// Coordinates []float64 `json:"coordinates" gorm:"type:float[]"`  // [lng, lat]
	//   H3Indexes   []string  `json:"h3Indexes" gorm:"type:text[]"` // Multiple resolutions
	Coordinates pq.Float64Array ` gorm:"type:float[]" json:"coordinates"` // [lng, lat]

	// H3Indexes    []*string  `json:"h3Indexes,omitempty"`
	H3Indexes pq.StringArray `gorm:"type:text[]" json:"h3Indexes,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
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
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name      string    `json:"name"`
	ServiceID *string   `gorm:"column:service_id" json:"ServiceId,omitempty"`
	CargoID   *string   `json:"cargoId,omitempty"`
	IsPublic  *bool     `json:"isPublic,omitempty"`

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
	ID          uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	CargoID     *string   `json:"cargoId,omitempty"`
	IsPublic    *bool     `json:"isPublic,omitempty"`
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
	ID         uuid.UUID        `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	ServiceID  string           `json:"ServiceId"`
	SocialData *json.RawMessage `gorm:"type:jsonb" json:"socialData,omitempty"`

	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type BusinessType struct {
	ID            uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Status        *string   `json:"status,omitempty"`
	ServiceID     string    `json:"serviceId"`
	PaymentStatus *string   `json:"paymentStatus,omitempty"`
	PaymentMethod *string   `json:"paymentMethod,omitempty"`
	BusinessType  *string   `json:"businessType,omitempty"`
	DurationAt    *string   `json:"durationAt,omitempty"`
	DurationEnd   *string   `json:"durationEnd,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}


type CancelManager struct {
	ID              uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	CancelPersonID  string    `json:"cancelPersonId"`
	CancelPersonType string    `json:"cancelPersonType"` // e.g., "user", "rider", "vendor"
	EntityID        *string   `json:"entityId,omitempty"`// e.g., "order", "appointment"
	EntityType      *string   `json:"entityType,omitempty"` // e.g., "order", "appointment""
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}