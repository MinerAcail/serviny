package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Form struct {
	ID              uuid.UUID    `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	Title           string       `json:"title"`
	Description     *string      `json:"description,omitempty"`
	Type            FormType     `json:"type"`
	Fields          []*FormField `json:"fields"`
	IsActive        bool         `json:"isActive"`
	SubmissionCount int32        `json:"submissionCount"`
	CreatedAt       time.Time    `json:"createdAt"`
	UpdatedAt       time.Time    `json:"updatedAt"`
}
type FormField struct {
	ID uuid.UUID `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`

	Type        FieldType      `json:"type"`
	Label       string         `json:"label"`
	Placeholder *string        `json:"placeholder,omitempty"`
	Required    bool           `json:"required"`
	Options     pq.StringArray `gorm:"type:text[]" json:"options,omitempty"`
	FormId       *string         `json:"form_id,omitempty"`

	Validation *string   `json:"validation,omitempty"`
	Order      *int32    `json:"order,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}
type FormSubmission struct {
	ID           uuid.UUID        `gorm:"type:uuid;default:uuid_generate_v4();primary_key" json:"id"`
	FormID       string           `json:"formId"`
	SubmissionID string           `json:"submissionId"`
	FormTitle    string           `json:"formTitle"`
	Data         string           `json:"data"`
	Status       SubmissionStatus `json:"status"`
	Message      *string          `json:"message,omitempty"`
	IPAddress    *string          `json:"ipAddress,omitempty"`
	UserAgent    *string          `json:"userAgent,omitempty"`
	CreatedAt    time.Time        `json:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt"`
}
// Helper function to validate orderBy parameter
func IsValidOrderBy(orderBy string) bool {
	validColumns := []string{"created_at", "updated_at", "title", "type", "is_active", "submission_count"}
	for _, col := range validColumns {
		if col == orderBy {
			return true
		}
	}
	return false
}
