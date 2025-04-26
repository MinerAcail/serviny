package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lehxees/serviny/graph/model"
	"gorm.io/gorm"
)

// SetOrderTrackingCookie sets an HTTP-only cookie containing the order tracking ID.
func SetOrderTrackingCookieold(w http.ResponseWriter, orderID string) error {
	cookie := &http.Cookie{
		Name:     "order_tracking",
		Value:    orderID,
		Path:     "/",
		Domain:   "serviny.com", // Ensure this matches your main domain
		Secure:   true,          // Must be true for HTTPS
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	}

	log.Println("4 Order ID:", orderID)

	http.SetCookie(w, cookie)
	return nil
}

// SetOrderTrackingCookie updates the cookie with a new order ID if it's not already present.
func SetOrderTrackingCookie(w http.ResponseWriter, ctx context.Context, orderID string, existsOrderIDs []string) error {
	const cookieName = "order_tracking"

	// Check if order ID already exists
	for _, id := range existsOrderIDs {
		if id == orderID {
			log.Println("Order ID already exists in cookie:", orderID)
			return nil
		}
	}

	// Append new order ID
	existsOrderIDs = append(existsOrderIDs, orderID)

	// Convert updated order IDs to JSON
	newValue, err := json.Marshal(existsOrderIDs)
	if err != nil {
		return err
	}

	// Determine if secure mode should be enabled (based on HTTPS)
	secureFlag := ctx.Value("isHTTPS") == true // Adjust based on actual implementation

	// Set the updated cookie
	newCookie := &http.Cookie{
		Name:     cookieName,
		Value:    string(newValue),
		Path:     "/",
		HttpOnly: true,
		Domain:   "serviny.com", // Ensure this matches your main domain
		Secure:   secureFlag,    // Secure should be true only if HTTPS is used
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	}

	http.SetCookie(w, newCookie)
	log.Println("Updated Order Tracking Cookie:", string(newValue))
	return nil
}
func SetPromocodeTrackingCookie(w http.ResponseWriter, ctx context.Context, promocodeID string, existspromocodeIDs []string) error {
	const cookieName = "promocode_tracking"

	// Check if promocode ID already exists
	for _, id := range existspromocodeIDs {
		if id == promocodeID {
			log.Println("promocode ID already exists in cookie:", promocodeID)
			return nil
		}
	}

	// Append new promocode ID
	existspromocodeIDs = append(existspromocodeIDs, promocodeID)

	// Convert updated promocode IDs to JSON
	newValue, err := json.Marshal(existspromocodeIDs)
	if err != nil {
		return err
	}

	// Determine if secure mode should be enabled (based on HTTPS)
	secureFlag := ctx.Value("isHTTPS") == true // Adjust based on actual implementation

	// Set the updated cookie
	newCookie := &http.Cookie{
		Name:     cookieName,
		Value:    string(newValue),
		Path:     "/",
		HttpOnly: true,
		Domain:   "serviny.com", // Ensure this matches your main domain
		Secure:   secureFlag,    // Secure should be true only if HTTPS is used
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	}

	http.SetCookie(w, newCookie)
	log.Println("Updated promocode Tracking Cookie:", string(newValue))
	return nil
}
func SetjobRequestCookie(w http.ResponseWriter, requestId string) error {
	cookie := &http.Cookie{
		Name:   "job_request",
		Value:  requestId,
		Domain: "serviny.com", // Ensure this matches your main domain
		//
		Path:     "/",
		HttpOnly: true, // Prevent access from JavaScript
		// Secure:   true, // Use Secure (enable in production)
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(3 * time.Hour),
	}

	http.SetCookie(w, cookie)
	return nil
}

// GetOrderTrackingCookie retrieves the order tracking ID from the cookie.
// GetOrderTrackingCookie retrieves the existing order tracking IDs from a cookie.
func GetOrderTrackingCooki(r *http.Request) ([]string, error) {
	cookie, err := r.Cookie("order_tracking")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			// Return an empty slice instead of an error
			return []string{}, nil
		}
		return nil, err
	}

	var orderIDs []string
	if err := json.Unmarshal([]byte(cookie.Value), &orderIDs); err != nil {
		return nil, err
	}
	return orderIDs, nil
}
func GetOrderTrackingCookie1(r *http.Request) ([]string, error) {
	cookie, err := r.Cookie("order_tracking")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return []string{}, nil
		}
		return nil, err
	}

	// Try standard JSON unmarshal first
	var orderIDs []string
	if err := json.Unmarshal([]byte(cookie.Value), &orderIDs); err != nil {
		log.Println("Error unmarshaling cookie:", err, "Value:", cookie.Value)

		// Handle malformed data by doing custom parsing
		// Strip any extra brackets and split by commas
		value := cookie.Value
		value = strings.Trim(value, "[]\"")
		value = strings.ReplaceAll(value, "[", "")
		value = strings.ReplaceAll(value, "]", "")

		// Split by comma and clean up each UUID
		parts := strings.Split(value, ",")
		for i, part := range parts {
			parts[i] = strings.Trim(part, "\"[] ")
		}

		// Filter out empty strings
		var cleaned []string
		for _, part := range parts {
			if part != "" {
				cleaned = append(cleaned, part)
			}
		}

		return cleaned, nil
	}

	return orderIDs, nil
}
func GetOrderTrackingCookie(r *http.Request) ([]string, error) {
	cookie, err := r.Cookie("order_tracking")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return []string{}, nil
		}
		return nil, err
	}

	var orderIDs []string
	rawValue := cookie.Value

	// First, attempt to unmarshal as JSON array
	if json.Valid([]byte(rawValue)) {
		if err := json.Unmarshal([]byte(rawValue), &orderIDs); err == nil {
			return orderIDs, nil
		}
	}

	log.Println("Malformed JSON detected in cookie:", rawValue)

	// Remove outer brackets
	rawValue = strings.Trim(rawValue, "[]\"")

	// Handle cases where IDs are inside inner brackets
	rawValue = strings.ReplaceAll(rawValue, "[", "")
	rawValue = strings.ReplaceAll(rawValue, "]", "")
	rawValue = strings.ReplaceAll(rawValue, "\"", "")

	// Split by comma
	if rawValue != "" {
		orderIDs = strings.Split(rawValue, ",")
	}

	return orderIDs, nil
}
func GetPromocodeTrackingCookie(r *http.Request) ([]string, error) {
	cookie, err := r.Cookie("promocode_tracking")
	if err != nil {
		if errors.Is(err, http.ErrNoCookie) {
			return []string{}, nil
		}
		return nil, err
	}

	var promocodeIDs []string
	rawValue := cookie.Value

	// First, attempt to unmarshal as JSON array
	if json.Valid([]byte(rawValue)) {
		if err := json.Unmarshal([]byte(rawValue), &promocodeIDs); err == nil {
			return promocodeIDs, nil
		}
	}

	log.Println("Malformed JSON detected in cookie:", rawValue)

	// Remove outer brackets
	rawValue = strings.Trim(rawValue, "[]\"")

	// Handle cases where IDs are inside inner brackets
	rawValue = strings.ReplaceAll(rawValue, "[", "")
	rawValue = strings.ReplaceAll(rawValue, "]", "")
	rawValue = strings.ReplaceAll(rawValue, "\"", "")

	// Split by comma
	if rawValue != "" {
		promocodeIDs = strings.Split(rawValue, ",")
	}

	return promocodeIDs, nil
}
func RemoveOrderFromTrackingCookie(w http.ResponseWriter, ctx context.Context, orderID string, existsOrderIDs []string) error {
	const cookieName = "order_tracking"

	// Filter out the order ID to be removed
	updatedOrders := []string{}
	for _, id := range existsOrderIDs {
		if id != orderID {
			updatedOrders = append(updatedOrders, id)
		}
	}

	// Convert updated orders back to JSON
	newValue, err := json.Marshal(updatedOrders)
	if err != nil {
		return err
	}

	// Determine if secure mode should be enabled (based on HTTPS)
	secureFlag := ctx.Value("isHTTPS") == true // Adjust based on actual implementation

	// Set the updated cookie
	newCookie := &http.Cookie{
		Name:   cookieName,
		Value:  string(newValue),
		Path:   "/",
		Domain: "serviny.com", // Ensure this matches your main domain
		//
		HttpOnly: true,
		Secure:   secureFlag,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(24 * time.Hour),
	}

	http.SetCookie(w, newCookie)
	log.Println("Updated Order Tracking Cookie after removal:", string(newValue))
	return nil
}

func GetjobRequestCookie(r *http.Request) (string, error) {
	cookie, err := r.Cookie("job_request")
	if err != nil {
		return "", err
	}
	return cookie.Value, nil
}

// Key type to avoid context key collisions
type ctxKey struct{ name string }

var (
	responseWriterKey = &ctxKey{"responseWriter"}
	requestKey        = &ctxKey{"request"}
)

// AttachResponseWriter adds an HTTP response writer to the context.
func AttachResponseWriter(ctx context.Context, w http.ResponseWriter) context.Context {
	return context.WithValue(ctx, responseWriterKey, w)
}

// AttachRequest adds an HTTP request to the context.
func AttachRequest(ctx context.Context, r *http.Request) context.Context {
	return context.WithValue(ctx, requestKey, r)
}

// GetResponseWriter retrieves the response writer from the context.
func GetResponseWriter(ctx context.Context) (http.ResponseWriter, bool) {
	w, ok := ctx.Value(responseWriterKey).(http.ResponseWriter)
	return w, ok
}

// GetRequest retrieves the request from the context.
func GetRequest(ctx context.Context) *http.Request {
	r, _ := ctx.Value(requestKey).(*http.Request)
	return r
}

// Middleware injects request and response writer into context
func TrackingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		ctx = AttachResponseWriter(ctx, w)
		ctx = AttachRequest(ctx, r)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CleanupOrderTrackingCookie checks if an order tracking cookie exists,
// verifies if the associated order is completed, and clears the cookie if needed.

func CleanupRequestrackingCookie(ctx context.Context, db *gorm.DB) {
	req := GetRequest(ctx)
	if req == nil {
		return
	}

	requestId, err := GetjobRequestCookie(req)
	if err != nil || requestId == "" {
		return // No cookie or error reading cookie
	}

	// Check if order exists and is completed
	var request model.JobRequest
	if err := db.Where("id = ?", requestId).First(&request).Error; err != nil {
		if err != gorm.ErrRecordNotFound {
			log.Printf("Error checking request status: %v", err)
		}
		return
	}

	if err := db.Where("id = ?", requestId).First(&request).Error; err != nil {
		w, ok := GetResponseWriter(ctx)
		if !ok {
			return // Can't access response writer
		}

		// Clear the cookie
		cookie := &http.Cookie{
			Name:     "job_request",
			Value:    "",
			Path:     "/",
			HttpOnly: true,
			Domain:   "serviny.com", // Ensure this matches your main domain
			//
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			MaxAge:   -1, // Immediately expires the cookie
		}
		http.SetCookie(w, cookie)
		log.Println("Cleared request tracking cookie for completed request:", requestId)
	}
}

type ContextKey string

const (
	SessionKey ContextKey = "session"
	cookieName            = "session_uuid"
	secureFlag            = true // Set this to false if not using HTTPS
)

func SessionMiddleware(db *gorm.DB) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(cookieName)
			var sessionID uuid.UUID

			if err != nil || cookie.Value == "" {
				sessionID = uuid.New()

				newCookie := &http.Cookie{
					Name:     cookieName,
					Value:    sessionID.String(),
					Path:     "/",
					HttpOnly: true,
					Domain:   "serviny.com",
					Secure:   secureFlag,
					SameSite: http.SameSiteLaxMode,
					Expires:  time.Now().Add(24 * time.Hour),
				}

				http.SetCookie(w, newCookie)

				// Store session in database
				if r.RemoteAddr != "172.18.0.1" {
					session := model.Session{
						ID:        sessionID.String(),
						IPAddress: r.RemoteAddr,
						UserAgent: r.UserAgent(),
					}
					db.Create(&session)
				}
				// db.Create(&session)
			} else {
				sessionID, _ = uuid.Parse(cookie.Value)
			}

			// Store session ID in context for GraphQL resolvers
			ctx := context.WithValue(r.Context(), SessionKey, sessionID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
