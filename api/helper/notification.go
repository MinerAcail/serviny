// helper/push.go
package helper

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/google/uuid"
	"github.com/lehxees/serviny/graph/model"

	"gorm.io/gorm"
	// "yourapp/graph/model"
)

type NotificationPayload struct {
	Title   string
	Body    string
	Tag     string
	URL     string
	BookingID *string
	OrderID   *string
}

func SendPushNotification(db *gorm.DB, userID string, payload NotificationPayload) error {
	publicKey := os.Getenv("VAPID_PUBLIC_KEY")
	privateKey := os.Getenv("VAPID_PRIVATE_KEY")

	if publicKey == "" || privateKey == "" {
		return fmt.Errorf("missing VAPID keys")
	}

	var subscriptions []model.PushSubscription
	if err := db.Where("user_id = ?", userID).Find(&subscriptions).Error; err != nil {
		return fmt.Errorf("failed to fetch subscriptions: %w", err)
	}

	data := map[string]interface{}{
		"url": payload.URL,
	}
	if payload.BookingID != nil {
		data["bookingId"] = *payload.BookingID
	}
	if payload.OrderID != nil {
		data["orderId"] = *payload.OrderID
	}

	notif := map[string]interface{}{
		"title":             payload.Title,
		"body":              payload.Body,
		"icon":              "/pwa-192x192.png",
		"badge":             "/pwa-64x64.png",
		"requireInteraction": true,
		"renotify":           true,
		"tag":                payload.Tag + "-" + uuid.NewString(),
		"data":               data,
	}

	bytes, err := json.Marshal(notif)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	for _, sub := range subscriptions {
		if sub.Endpoint == nil || sub.P256dh == nil || sub.Auth == nil {
			continue
		}

		subscription := &webpush.Subscription{
			Endpoint: *sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: *sub.P256dh,
				Auth:   *sub.Auth,
			},
		}

		resp, err := webpush.SendNotification(bytes, subscription, &webpush.Options{
			TTL:             60,
			VAPIDPublicKey:  publicKey,
			VAPIDPrivateKey: privateKey,
			Subscriber:      "mailto:admin@winnemart.com",
		})

		if err != nil {
			log.Printf("[SW] ❌ Push failed: %v", err)
			if resp != nil && resp.Body != nil {
				body, _ := io.ReadAll(resp.Body)
				log.Printf("[SW] 📭 Response body: %s", string(body))
				resp.Body.Close()
			}
			continue
		}

		log.Printf("[SW] ✅ Push sent to: %s", *sub.Endpoint)
		resp.Body.Close()

		if resp.StatusCode == 404 || resp.StatusCode == 410 {
			db.Delete(&sub)
		}
	}

	return nil
}
