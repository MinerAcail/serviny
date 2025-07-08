package helper

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"
)

// After successfully creating bookings, send notification
func SendBookingNotification(r *gorm.DB, serviceID string, bookingDetails *model.AppointmentBooking) error {
	// Get all push subscriptions for this service provider
	var subscriptions []model.PushSubscription
	if err := r.Where("user_id = ?", serviceID).Find(&subscriptions).Error; err != nil {
		return fmt.Errorf("failed to get push subscriptions: %w", err)
	}

	// Create notification payload
	notification := map[string]interface{}{
		"title": "New Booking Received!",
		"body":  fmt.Sprintf("You have a new booking for %s", bookingDetails.StartTime),
		"icon":  "/pwa-192x192.png",
		"data": map[string]interface{}{
			"bookingId": bookingDetails.ID.String(),
			"url":       "/bookings",
		},
	}

	payload, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal notification: %w", err)
	}

	// Send to all subscriptions
	for _, sub := range subscriptions {
		subscription := &webpush.Subscription{
			Endpoint: *sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: *sub.P256dh,
				Auth:   *sub.Auth,
			},
		}

		// Send the notification
		resp, err := webpush.SendNotification(payload, subscription, &webpush.Options{
			Subscriber:      "",
			VAPIDPublicKey:  os.Getenv("VAPID_PUBLIC_KEY"),
			VAPIDPrivateKey: os.Getenv("VAPID_PRIVATE_KEY"),
		})

		if err != nil {
			log.Printf("Failed to send push notification: %v", err)
			continue
		}

		resp.Body.Close()
	}

	return nil
}
