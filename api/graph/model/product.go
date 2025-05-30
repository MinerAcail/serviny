package model

import (
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type CartItem struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Product   *Product  `json:"product"`
	ProductID string    `json:"productId"`
	Quantity  int32     `json:"quantity"`
	ItemType  string    `json:"itemType"`
	OrderID   *string   `json:"orderId,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
type CategoryBox struct {
	ID       uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name     string         `json:"name"`
	ImageUrl string         `json:"imageUrl"`
	State    *ProductState  `json:"state,omitempty"`
	ItemsIds pq.StringArray `gorm:"type:text[]" json:"itemsIds,omitempty"`

	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
	SearchVector string    `gorm:"type:tsvector" json:"-"`
}
type ItemFiles struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	BucketName string `json:"bucketName"`
	URL        string `json:"url"`
}

type File struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Name    string `json:"name"`
	Content string `json:"content"`
}

type FileURL struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	URL       string     `json:"url"`
	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}

type Order struct {
	ID              uuid.UUID       `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	DeliveryAddress string          `json:"deliveryAddress"`
	Coordinates     pq.Float64Array ` gorm:"type:float[]" json:"coordinates"` // [lng, lat]
	UserID          string          `json:"userId"`
	RiderID         *string         `json:"riderId,omitempty"`
	VendorID        *string         `json:"vendorId,omitempty"`
	IsochroneMetaID *string         `json:"isochroneMetaId,omitempty"`
	//   userType:String
	//
	DeliveryFee *string `json:"deliveryFee,omitempty"`
	Distance    *string `json:"distance,omitempty"`
	Duration    *string `json:"duration,omitempty"`

	Status                string      `json:"status"`
	Items                 []*CartItem `json:"items"`
	EstimatedDeliveryDate string      `json:"estimatedDeliveryDate"`
	CreatedAt             time.Time   `json:"createdAt"`
	UpdatedAt             time.Time   `json:"updatedAt"`
}
type Product struct {
	ID           uuid.UUID      `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Name         *string        `json:"name,omitempty"`
	Price        *string        `json:"price,omitempty"`
	State        *ProductState  `json:"state,omitempty"`
	Categories   pq.StringArray `gorm:"type:text[]" json:"categories,omitempty"`
	ImageUrls    pq.StringArray `gorm:"type:text[]" json:"imageUrls,omitempty"`
	ItemsType    pq.StringArray `gorm:"type:text[]" json:"itemsType,omitempty"`
	CreatedAt    *time.Time     `json:"createdAt,omitempty"`
	UpdatedAt    *time.Time     `json:"updatedAt,omitempty"`
	VendorID     *string        `json:"vendorId,omitempty"`
	Description  *string        `json:"description,omitempty"`
	SearchVector string         `gorm:"type:tsvector" json:"-"`
}
type PurchaseHistory struct {
	ID             uuid.UUID              `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Date           string                 `json:"date"`
	Items          []*PurchaseHistoryItem `json:"items"`
	Status         string                 `json:"status"`
	TrackingNumber *string                `json:"trackingNumber,omitempty"`
}

type PurchaseHistoryItem struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Name     string `json:"name"`
	Price    string `json:"price"`
	Quantity string `json:"quantity"`
	ImageURL string `json:"imageUrl"`
}
type UploadFile struct {
	File       graphql.Upload `json:"file"`
	BucketName string         `json:"bucketName"`
}
type ChatMessage struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	OrderID   string     `json:"orderId"`
	Sender    SenderType `json:"sender"`
	Content   string     `json:"content"`
	Read      bool       `json:"read" gorm:"not null;default:false"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}
type RequestItem struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Name        *string        `json:"name,omitempty"`
	Price       *string        `json:"price,omitempty"`
	State       *ProductState  `json:"state,omitempty"`
	Categories  *string        `json:"categories,omitempty"`
	ImageUrls   pq.StringArray `gorm:"type:text[]" json:"imageUrls,omitempty"`
	Description *string        `json:"description,omitempty"`

	CreatedAt *time.Time `json:"createdAt,omitempty"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}
