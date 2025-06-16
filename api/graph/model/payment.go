package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Payment represents a payment record in the system
// This table is IMMUTABLE - no updates or deletes allowed
type Payment struct {
	ID        uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	CreatedAt time.Time `json:"createdAt"`

	// Link to Order or Booking - multiple payments can exist for one order
	OrderID string `json:"orderID" gorm:"not null;index"`

	// Paystack specific fields
	PaystackID string `json:"paystackID" gorm:"uniqueIndex"` // Paystack transaction ID as string
	PaystackReference string `json:"paystackReference" gorm:"uniqueIndex;not null"` // Our generated reference

	// Payment details
	Amount   int32         `json:"amount" gorm:"not null"`                 // Amount in Ghana pesewa (cents)
	Currency string        `json:"currency" gorm:"not null;default:'GHS'"` // Ghana Cedis
	Method   PaymentMethod `json:"method" gorm:"not null"`
	Status   PaymentStatus `json:"status" gorm:"not null;default:'PENDING'"`

	// Timestamps
	PaidAt      *time.Time `json:"paidAt,omitempty"`
	FailedAt    *time.Time `json:"failedAt,omitempty"`
	CancelledAt *time.Time `json:"cancelledAt,omitempty"`
	RefundedAt  *time.Time `json:"refundedAt,omitempty"`

	// Transaction details
	GatewayResponse *string `json:"gatewayResponse,omitempty"`
	FailureReason   *string `json:"failureReason,omitempty"`

	// Customer information from Paystack
	CustomerEmail string  `json:"customerEmail" gorm:"not null"`
	CustomerName  string  `json:"customerName" gorm:"not null"`
	CustomerPhone *string `json:"customerPhone,omitempty"`
	CustomerCode  *string `json:"customerCode,omitempty"`

	// Authorization details (for card payments)
	AuthorizationCode *string `json:"authorizationCode,omitempty"`
	CardLast4         *string `json:"cardLast4,omitempty"`
	CardBin           *string `json:"cardBin,omitempty"`
	CardType          *string `json:"cardType,omitempty"`
	CardBank          *string `json:"cardBank,omitempty"`
	CardBrand         *string `json:"cardBrand,omitempty"`
	CardExpMonth      *string `json:"cardExpMonth,omitempty"`
	CardExpYear       *string `json:"cardExpYear,omitempty"`

	// Metadata from Paystack (stored as JSON string)
	Metadata *string `json:"metadata,omitempty"`

	// Webhook verification
	WebhookVerified bool `json:"webhookVerified" gorm:"default:false"`
}

// BeforeCreate hook to prevent any modifications to existing records
func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	// Set creation timestamp if not already set
	if p.CreatedAt.IsZero() {
		p.CreatedAt = time.Now()
	}
	return nil
}

// BeforeUpdate hook to prevent updates (makes table immutable)
func (p *Payment) BeforeUpdate(tx *gorm.DB) error {
	return gorm.ErrInvalidTransaction // Prevent all updates
}

// BeforeDelete hook to prevent deletions (makes table immutable)
func (p *Payment) BeforeDelete(tx *gorm.DB) error {
	return gorm.ErrInvalidTransaction // Prevent all deletions
}

// TableName returns the table name for the Payment model
func (Payment) TableName() string {
	return "payments"
}

// IsSuccessful returns true if the payment was successful
func (p *Payment) IsSuccessful() bool {
	return p.Status == PaymentStatusSuccess
}

// IsPending returns true if the payment is still pending
func (p *Payment) IsPending() bool {
	return p.Status == PaymentStatusPending
}

// IsFailed returns true if the payment failed
func (p *Payment) IsFailed() bool {
	return p.Status == PaymentStatusFailed
}

// IsRefunded returns true if the payment was refunded
func (p *Payment) IsRefunded() bool {
	return p.Status == PaymentStatusRefunded
}

// GetAmountInCedis returns the amount in Ghana Cedis (divides pesewa by 100)
func (p *Payment) GetAmountInCedis() float64 {
	return float64(p.Amount) / 100.0
}
