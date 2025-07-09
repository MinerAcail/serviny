// helper/push.go
package helper

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/google/uuid"
	"github.com/lehxees/serviny/graph/model"

	"gorm.io/gorm"
	// "yourapp/graph/model"
)

type NotificationPayload struct {
	Title     string
	Body      string
	Tag       string
	URL       string
	BookingID *string
	OrderID   *string
	FormID   *string

}
func DerefString(ptr *string) string {
    if ptr != nil {
        return *ptr
    }
    return ""
}

func SendPushNotification(db *gorm.DB, userID string, payload NotificationPayload) error {
	publicKey := os.Getenv("VAPID_PUBLIC_KEY")
	privateKey := os.Getenv("VAPID_PRIVATE_KEY")
	minioURL := "https://files.winnemart.com"

	if publicKey == "" || privateKey == "" {
		return fmt.Errorf("[SW] ❌ Missing VAPID keys")
	}
	log.Printf("[SW] 🔎 Sending push to userID: %s", userID)

	// Fetch subscriptions
	var subscriptions []model.PushSubscription
	if err := db.Where("user_id = ?", userID).Find(&subscriptions).Error; err != nil {
		return fmt.Errorf("[SW] failed to fetch subscriptions: %w", err)
	}
	log.Printf("[SW] 🧾 Found %d subscriptions for userID: %s", len(subscriptions), userID)

	// Fetch service info
	var service model.Service
	if err := db.Where("id = ?", userID).First(&service).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("[SW] Service not found with ID %s", userID)
		}
		return fmt.Errorf("[SW] Failed to fetch service: %w", err)
	}

	// Convert "/minio/" paths to public URL
	getImageURL := func(path string) string {
		if path == "" {
			return ""
		}
		if strings.Contains(path, "/minio/") {
			return strings.Replace(path, "/minio/", minioURL+"/", 1)
		}
		return path
	}

	// Determine icon
	resolvedIcon := "/winnemartWallpaper.png"
	if service.Dpfile != nil && *service.Dpfile != "" {
		resolvedIcon = getImageURL(*service.Dpfile)
	}

	// Use default badge
	resolvedBadge := "/logo.png"

	// Construct notification body
	data := map[string]interface{}{
		"url": payload.URL,
	}
	if payload.BookingID != nil {
		data["bookingId"] = *payload.BookingID
	}
	if payload.OrderID != nil {
		data["orderId"] = *payload.OrderID
	}
if payload.FormID != nil {
		data["FormID"] = *payload.FormID
	}
	notif := map[string]interface{}{
		"title":              payload.Title,
		"body":               payload.Body,
		"icon":               resolvedIcon,
		"badge":              resolvedBadge,
		"image":              resolvedIcon,
		"requireInteraction": true,
		"renotify":           true,
		"tag":                payload.Tag + "-" + uuid.NewString(),
		"data":               data,
	}

	bytes, err := json.Marshal(notif)
	if err != nil {
		return fmt.Errorf("[SW] Failed to marshal notification payload: %w", err)
	}

	// Send notification to each subscription
	for _, sub := range subscriptions {
		if sub.Endpoint == nil || sub.P256dh == nil || sub.Auth == nil {
			log.Printf("[SW] ⚠️ Skipping incomplete subscription: %+v", sub)
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
			log.Printf("[SW] ❌ Push failed to %s: %v", *sub.Endpoint, err)
			if resp != nil && resp.Body != nil {
				body, _ := io.ReadAll(resp.Body)
				log.Printf("[SW] 📭 Response body: %s", string(body))
				resp.Body.Close()
			}
			continue
		}

		log.Printf("[SW] ✅ Push sent to: %s (status: %s)", *sub.Endpoint, resp.Status)
		resp.Body.Close()

		// Remove invalid subscriptions
		if resp.StatusCode == 404 || resp.StatusCode == 410 {
			if err := db.Delete(&sub).Error; err != nil {
				log.Printf("[SW] ⚠️ Failed to delete expired subscription: %v", err)
			} else {
				log.Printf("[SW] 🧹 Removed expired subscription: %s", *sub.Endpoint)
			}
		}
	}

	return nil
}
