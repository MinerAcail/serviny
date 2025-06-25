package helper

import (
	"context"
	"errors"
	"fmt"
	"log"

	"github.com/google/uuid"
	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"
)

// ReassignRiderData holds the dependencies needed for rider reassignment
type ReassignRiderData struct {
	DB          *gorm.DB
	GetUserInfo func(ctx context.Context, userID string) (*model.UsersInfor, error)
}

// ReassignRiderResponse contains the assigned rider information
type ReassignRiderResponse struct {
	Rider           *model.UsersInfor `json:"rider"`
	EntityID        string            `json:"entityId"`
	EntityType      string            `json:"entityType"`
	PreviousRiderID *string           `json:"previousRiderId,omitempty"`
}

// Helper function to reassign rider for an order
func ReassignOrderRider(ctx context.Context, tx *gorm.DB, orderID uuid.UUID, riderID string, deps *ReassignRiderData) (*ReassignRiderResponse, error) {
	// Validate that the rider exists and get rider info
	rider, err := deps.GetUserInfo(ctx, riderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rider info: %w", err)
	}
	if rider == nil {
		return nil, fmt.Errorf("rider not found with ID: %s", riderID)
	}

	// Find the order
	var order model.Order
	if err := tx.Where("id = ?", orderID).First(&order).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("order not found with ID: %s", orderID)
		}
		return nil, fmt.Errorf("failed to fetch order: %w", err)
	}

	// Store previous rider ID for response
	var previousRiderID *string
	if order.RiderID != nil {
		previousRiderID = order.RiderID
	}

	// Find the order payment status
	var orderSta model.BookingOrderPaymentStatus
	if err := tx.Where("entity_id = ?", orderID).First(&orderSta).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// If not found, just continue without error
		} else {
			return nil, fmt.Errorf("failed to fetch order payment status: %w", err)
		}
	}
	
	// Check if the new rider is the same as current rider
	if order.RiderID != nil && *order.RiderID == riderID {
		log.Printf("Order %s is already assigned to rider %s", orderID, riderID)
		return &ReassignRiderResponse{
			Rider:           rider,
			EntityID:        orderID.String(),
			EntityType:      "order",
			PreviousRiderID: previousRiderID,
		}, nil
	}

	// Update the order with new rider
	order.RiderID = &riderID

	if err := tx.Save(&order).Error; err != nil {
		return nil, fmt.Errorf("failed to update order with new rider: %w", err)
	}

	// Update payment status with new rider
	orderSta.RiderID = &riderID
	if err := tx.Save(&orderSta).Error; err != nil {
		return nil, fmt.Errorf("failed to update order payment status with new rider: %w", err)
	}

	log.Printf("Successfully reassigned order %s from rider %v to rider %s", 
		orderID, previousRiderID, riderID)

	return &ReassignRiderResponse{
		Rider:           rider,
		EntityID:        orderID.String(),
		EntityType:      "order",
		PreviousRiderID: previousRiderID,
	}, nil
}

// Helper function to reassign rider for a booking
func ReassignBookingRider(ctx context.Context, tx *gorm.DB, bookingID uuid.UUID, riderID string, deps *ReassignRiderData) (*ReassignRiderResponse, error) {
	// Validate that the rider exists and get rider info
	rider, err := deps.GetUserInfo(ctx, riderID)
	if err != nil {
		return nil, fmt.Errorf("failed to get rider info: %w", err)
	}
	if rider == nil {
		return nil, fmt.Errorf("rider not found with ID: %s", riderID)
	}

	// Find the booking
	var booking model.AppointmentBooking
	if err := tx.Where("id = ?", bookingID).First(&booking).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("booking not found with ID: %s", bookingID)
		}
		return nil, fmt.Errorf("failed to fetch booking: %w", err)
	}

	// Store previous rider ID for response
	var previousRiderID *string
	if booking.RiderID != "" {
		previousRiderID = &booking.RiderID
	}

	// Find the booking payment status
	var bookingSta model.BookingOrderPaymentStatus
	if err := tx.Where("entity_id = ?", bookingID).First(&bookingSta).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// If not found, just continue without error
		} else {
			return nil, fmt.Errorf("failed to fetch booking payment status: %w", err)
		}
	}
	
	// If not found, just continue without error

	var cargo model.BookingCargo
	if booking.CargoID != nil && *booking.CargoID != "" {
		if err := tx.Where("id = ?", *booking.CargoID).First(&cargo).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("Warning: cargo not found with ID: %v for booking %s", *booking.CargoID, bookingID)
			} else {
				return nil, fmt.Errorf("failed to fetch cargo: %w", err)
			}
		} else {
			// Update cargo with new rider only if cargo was found
			cargo.RiderID = &riderID
			if err := tx.Save(&cargo).Error; err != nil {
				return nil, fmt.Errorf("failed to update cargo with new rider: %w", err)
			}
		}
	}

	// Check if the new rider is the same as current rider
	if booking.RiderID == riderID {
		log.Printf("Booking %s is already assigned to rider %s", bookingID, riderID)
		return &ReassignRiderResponse{
			Rider:           rider,
			EntityID:        bookingID.String(),
			EntityType:      "booking",
			PreviousRiderID: previousRiderID,
		}, nil
	}

	// Update the booking with new rider
	booking.RiderID = riderID

	if err := tx.Save(&booking).Error; err != nil {
		return nil, fmt.Errorf("failed to update booking with new rider: %w", err)
	}

	// Update payment status with new rider
	bookingSta.RiderID = &riderID
	if err := tx.Save(&bookingSta).Error; err != nil {
		return nil, fmt.Errorf("failed to update booking payment status with new rider: %w", err)
	}

	log.Printf("Successfully reassigned booking %s from rider %s to rider %s", 
		bookingID, *previousRiderID, riderID)

	return &ReassignRiderResponse{
		Rider:           rider,
		EntityID:        bookingID.String(),
		EntityType:      "booking",
		PreviousRiderID: previousRiderID,
	}, nil
}

// ValidateRiderExists checks if a rider exists and is available for assignment
func ValidateRiderExists(ctx context.Context, deps *ReassignRiderData, riderID string) (*model.UsersInfor, error) {
	// Get rider info
	rider, err := deps.GetUserInfo(ctx, riderID)
	if err != nil {
		return nil, fmt.Errorf("failed to validate rider: %w", err)
	}
	if rider == nil {
		return nil, fmt.Errorf("rider not found with ID: %s", riderID)
	}

	// Optional: Add additional validation logic here
	// For example, check if rider is active, approved, etc.
	// You can query the riders table or rider_requests table for status
	
	return rider, nil
}

// GetRiderAssignmentHistory gets the assignment history for a rider (optional utility)
func GetRiderAssignmentHistory(ctx context.Context, db *gorm.DB, riderID string, limit int) ([]map[string]interface{}, error) {
	var history []map[string]interface{}
	
	// Query orders assigned to this rider
	var orders []model.Order
	if err := db.Where("rider_id = ?", riderID).
		Order("created_at DESC").
		Limit(limit).
		Find(&orders).Error; err != nil {
		return nil, fmt.Errorf("failed to get order history: %w", err)
	}
	
	for _, order := range orders {
		history = append(history, map[string]interface{}{
			"type":       "order",
			"id":         order.ID.String(),
			"status":     order.Status,
			"created_at": order.CreatedAt,
		})
	}
	
	// Query bookings assigned to this rider
	var bookings []model.AppointmentBooking
	if err := db.Where("rider_id = ?", riderID).
		Order("created_at DESC").
		Limit(limit).
		Find(&bookings).Error; err != nil {
		return nil, fmt.Errorf("failed to get booking history: %w", err)
	}
	
	for _, booking := range bookings {
		history = append(history, map[string]interface{}{
			"type":       "booking",
			"id":         booking.ID.String(),
			"status":     booking.Status,
			"created_at": booking.CreatedAt,
		})
	}
	
	return history, nil
}

// CheckRiderAvailability checks if a rider is available for new assignments (optional utility)
func CheckRiderAvailability(ctx context.Context, db *gorm.DB, riderID string) (bool, error) {
	// Count active orders assigned to this rider
	var activeOrderCount int64
	if err := db.Model(&model.Order{}).
		Where("rider_id = ? AND status NOT IN (?)", riderID, []string{"completed", "cancelled", "delivered"}).
		Count(&activeOrderCount).Error; err != nil {
		return false, fmt.Errorf("failed to count active orders: %w", err)
	}
	
	// Count active bookings assigned to this rider
	var activeBookingCount int64
	if err := db.Model(&model.AppointmentBooking{}).
		Where("rider_id = ? AND status NOT IN (?)", riderID, []string{"completed", "cancelled"}).
		Count(&activeBookingCount).Error; err != nil {
		return false, fmt.Errorf("failed to count active bookings: %w", err)
	}
	
	// Define your business logic for availability
	// For example, a rider might be available if they have less than 5 active assignments
	totalActiveAssignments := activeOrderCount + activeBookingCount
	maxAllowedAssignments := int64(5) // Configure this based on your business rules
	
	return totalActiveAssignments < maxAllowedAssignments, nil
}

// LogRiderReassignment logs the reassignment for audit purposes (optional utility)
func LogRiderReassignment(ctx context.Context, db *gorm.DB, entityType, entityID, oldRiderID, newRiderID, reason string) error {
	// Create an audit log entry - you might have an audit_logs table
	auditLog := map[string]interface{}{
		"action":        "rider_reassignment",
		"entity_type":   entityType,
		"entity_id":     entityID,
		"old_rider_id":  oldRiderID,
		"new_rider_id":  newRiderID,
		"reason":        reason,
		"timestamp":     "NOW()",
	}
	
	// Insert into audit logs table (if you have one)
	if err := db.Table("audit_logs").Create(auditLog).Error; err != nil {
		log.Printf("Warning: failed to create audit log: %v", err)
		// Don't return error as this is just logging
	}
	
	return nil
}