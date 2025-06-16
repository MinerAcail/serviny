package Paystack

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/lehxees/serviny/graph/model"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

// PaystackHandler handles Paystack webhook events
type PaystackHandler struct {
	db              *gorm.DB
	redisClient     *redis.Client
	graphqlEndpoint string // GraphQL endpoint for making booking requests
}

// NewPaystackHandler creates a new PaystackHandler instance
func NewPaystackHandler(db *gorm.DB, redisClient *redis.Client, graphqlEndpoint string) *PaystackHandler {
	return &PaystackHandler{
		db:              db,
		redisClient:     redisClient,
		graphqlEndpoint: graphqlEndpoint,
	}
}

// PaystackEvent represents the structure of a Paystack webhook event
type PaystackEvent struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

// PaystackTransactionData represents transaction data from Paystack
type PaystackTransactionData struct {
	ID              json.Number `json:"id"`
	Domain          string      `json:"domain"`
	Status          string      `json:"status"`
	Reference       string      `json:"reference"`
	Amount          int32       `json:"amount"`
	Message         string      `json:"message"`
	GatewayResponse string      `json:"gateway_response"`
	PaidAt          string      `json:"paid_at"`
	CreatedAt       string      `json:"created_at"`
	Channel         string      `json:"channel"`
	Currency        string      `json:"currency"`
	Customer        struct {
		ID           json.Number `json:"id"`
		FirstName    string      `json:"first_name"`
		LastName     string      `json:"last_name"`
		Email        string      `json:"email"`
		CustomerCode string      `json:"customer_code"`
		Phone        string      `json:"phone"`
	} `json:"customer"`
	Authorization struct {
		AuthorizationCode string `json:"authorization_code"`
		Bin               string `json:"bin"`
		Last4             string `json:"last4"`
		ExpMonth          string `json:"exp_month"`
		ExpYear           string `json:"exp_year"`
		Channel           string `json:"channel"`
		CardType          string `json:"card_type"`
		Bank              string `json:"bank"`
		CountryCode       string `json:"country_code"`
		Brand             string `json:"brand"`
	} `json:"authorization"`
	Metadata json.RawMessage `json:"metadata"`
}

// BookingMetadata structure for parsing from payment metadata
type BookingMetadata struct {
	BookingID       string        `json:"booking_id"`
	RiderID         string        `json:"rider_id"`
	PickupAddress   string        `json:"pickup_address"`
	DropoffAddress  string        `json:"dropoff_address"`
	Distance        float64       `json:"distance"`
	CustomerName    string        `json:"customer_name"`
	OrderType       string        `json:"order_type"`
	CustomFields    []CustomField `json:"custom_fields"`
}

type CustomField struct {
	DisplayName  string `json:"display_name"`
	VariableName string `json:"variable_name"`
	Value        string `json:"value"`
}

// FIXED: GraphQL request structures with proper field names
type AddBookCoordinateInput struct {
	BookID          string    `json:"bookId"`
	DeliveryAddress *string   `json:"deliveryAddress,omitempty"`
	DropoffLocation []float64 `json:"dropoffLocation,omitempty"`    // FIXED: Removed pointer from slice
	PickupLocation  []float64 `json:"pickupLocation,omitempty"`     // FIXED: Removed pointer from slice
	RangeMetaID     *string   `json:"rangeMetaId,omitempty"`        // FIXED: Changed to rangeMetaId
	RidersID        *string   `json:"ridersId,omitempty"`
}

type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables"`
}

type GraphQLResponse struct {
	Data   interface{} `json:"data"`
	Errors []struct {
		Message string        `json:"message"`
		Path    []interface{} `json:"path"`
	} `json:"errors"`
}

// HandleWebhook processes incoming Paystack webhook events
func (ph *PaystackHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	// Get Paystack secret key from environment
	secret := os.Getenv("PAYSTACK_SECRET_KEY")
	if secret == "" {
		log.Println("PAYSTACK_SECRET_KEY not set")
		http.Error(w, "Server configuration error", http.StatusInternalServerError)
		return
	}

	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// Verify the webhook signature
	signature := r.Header.Get("X-Paystack-Signature")
	if !ph.verifySignature(body, signature, secret) {
		log.Println("Invalid webhook signature")
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the webhook event
	var event PaystackEvent
	if err := json.Unmarshal(body, &event); err != nil {
		log.Printf("Error parsing webhook event: %v", err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	log.Printf("Received Paystack webhook event: %s", event.Event)

	// Handle different event types
	switch event.Event {
	case "charge.success":
		err = ph.handleChargeSuccess(event.Data)
	case "charge.failed":
		err = ph.handleChargeFailed(event.Data)
	case "transfer.success":
		err = ph.handleTransferSuccess(event.Data)
	case "transfer.failed":
		err = ph.handleTransferFailed(event.Data)
	case "customer.identification.success":
		err = ph.handleCustomerIdentificationSuccess(event.Data)
	case "customer.identification.failed":
		err = ph.handleCustomerIdentificationFailed(event.Data)
	default:
		log.Printf("Unhandled event type: %s", event.Event)
		w.WriteHeader(http.StatusOK)
		return
	}

	if err != nil {
		log.Printf("Error handling webhook event %s: %v", event.Event, err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Return success response
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

// verifySignature verifies the Paystack webhook signature
func (ph *PaystackHandler) verifySignature(body []byte, signature, secret string) bool {
	mac := hmac.New(sha512.New, []byte(secret))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

// handleChargeSuccess processes successful charge events
func (ph *PaystackHandler) handleChargeSuccess(data json.RawMessage) error {
	var transactionData PaystackTransactionData
	if err := json.Unmarshal(data, &transactionData); err != nil {
		return fmt.Errorf("error unmarshaling transaction data: %w", err)
	}

	log.Printf("Processing successful charge for reference: %s, amount: %d",
		transactionData.Reference, transactionData.Amount)

	// Extract order ID from reference
	orderID, err := ph.extractOrderIDFromReference(transactionData.Reference)
	if err != nil {
		return fmt.Errorf("error extracting order ID from reference %s: %w", transactionData.Reference, err)
	}

	// Parse paid_at timestamp
	var paidAt *time.Time
	if transactionData.PaidAt != "" {
		if parsedTime, err := time.Parse(time.RFC3339, transactionData.PaidAt); err == nil {
			paidAt = &parsedTime
		}
	}

	// Convert metadata to string pointer
	var metadataStr *string
	if len(transactionData.Metadata) > 0 {
		str := string(transactionData.Metadata)
		metadataStr = &str
	}

	// Parse booking metadata from payment metadata
	bookingMetadata, err := ph.parseBookingMetadata(transactionData.Metadata)
	if err != nil {
		log.Printf("⚠️ Warning: Could not parse booking metadata: %v", err)
		// Continue with payment record creation even if metadata parsing fails
	}

	// Create new payment record (IMMUTABLE - only CREATE, never UPDATE)
	payment := &model.Payment{
		OrderID:           orderID,
		PaystackID:        transactionData.ID.String(),
		PaystackReference: transactionData.Reference,
		Amount:            transactionData.Amount,
		Currency:          transactionData.Currency,
		Method:            ph.mapChannelToPaymentMethod(transactionData.Channel),
		Status:            model.PaymentStatusSuccess,
		PaidAt:            paidAt,
		GatewayResponse:   &transactionData.GatewayResponse,
		
		// Customer information
		CustomerEmail: transactionData.Customer.Email,
		CustomerName:  fmt.Sprintf("%s %s", transactionData.Customer.FirstName, transactionData.Customer.LastName),
		CustomerPhone: &transactionData.Customer.Phone,
		CustomerCode:  &transactionData.Customer.CustomerCode,
		
		// Authorization details (for card payments)
		AuthorizationCode: &transactionData.Authorization.AuthorizationCode,
		CardLast4:         &transactionData.Authorization.Last4,
		CardBin:           &transactionData.Authorization.Bin,
		CardType:          &transactionData.Authorization.CardType,
		CardBank:          &transactionData.Authorization.Bank,
		CardBrand:         &transactionData.Authorization.Brand,
		CardExpMonth:      &transactionData.Authorization.ExpMonth,
		CardExpYear:       &transactionData.Authorization.ExpYear,
		
		Metadata:        metadataStr,
		WebhookVerified: true,
	}

	// Save the payment record
	if err := ph.db.Create(payment).Error; err != nil {
		return fmt.Errorf("error creating payment record: %w", err)
	}

	log.Printf("Successfully created payment record ID: %d for order: %s", payment.ID, orderID)

	// Trigger booking completion via GraphQL
	go ph.completeBookingAfterPayment(orderID, bookingMetadata)
	return nil
}

// Parse booking metadata from payment metadata
func (ph *PaystackHandler) parseBookingMetadata(metadataRaw json.RawMessage) (*BookingMetadata, error) {
	if len(metadataRaw) == 0 {
		return nil, fmt.Errorf("empty metadata")
	}

	var metadata BookingMetadata
	if err := json.Unmarshal(metadataRaw, &metadata); err != nil {
		return nil, fmt.Errorf("error unmarshaling metadata: %w", err)
	}

	return &metadata, nil
}

// Extract coordinates from metadata custom fields
func (ph *PaystackHandler) extractCoordinatesFromMetadataold(metadata *BookingMetadata) (pickup []float64, dropoff []float64) {
	// Look for coordinates in custom fields
	var pickupLat, pickupLng, dropoffLat, dropoffLng float64
	var hasPickup, hasDropoff bool

	for _, field := range metadata.CustomFields {
		switch field.VariableName {
		case "pickup_location":
			// Try to parse as JSON array first
			var coords []float64
			if err := json.Unmarshal([]byte(field.Value), &coords); err == nil && len(coords) >= 2 {
				pickupLng = coords[0]
				pickupLat = coords[1]
				hasPickup = true
			}
		case "dropoff_location":
			// Try to parse as JSON array first
			var coords []float64
			if err := json.Unmarshal([]byte(field.Value), &coords); err == nil && len(coords) >= 2 {
				dropoffLng = coords[0]
				dropoffLat = coords[1]
				hasDropoff = true
			}
		case "pickup_lat":
			if lat, err := json.Number(field.Value).Float64(); err == nil {
				pickupLat = lat
				hasPickup = true
			}
		case "pickup_lng":
			if lng, err := json.Number(field.Value).Float64(); err == nil {
				pickupLng = lng
			}
		case "dropoff_lat":
			if lat, err := json.Number(field.Value).Float64(); err == nil {
				dropoffLat = lat
				hasDropoff = true
			}
		case "dropoff_lng":
			if lng, err := json.Number(field.Value).Float64(); err == nil {
				dropoffLng = lng
			}
		}
	}

	if hasPickup {
		pickup = []float64{pickupLng, pickupLat}
	}
	if hasDropoff {
		dropoff = []float64{dropoffLng, dropoffLat}
	}

	return pickup, dropoff
}
// Enhanced coordinate extraction with better parsing and validation
func (ph *PaystackHandler) extractCoordinatesFromMetadata(metadata *BookingMetadata) (pickup []float64, dropoff []float64) {
	if metadata == nil {
		log.Println("⚠️ No metadata provided for coordinate extraction")
		return nil, nil
	}

	// Look for coordinates in custom fields
	var pickupLat, pickupLng, dropoffLat, dropoffLng float64
	var hasPickupLat, hasPickupLng, hasDropoffLat, hasDropoffLng bool

	log.Printf("🔍 Extracting coordinates from %d custom fields", len(metadata.CustomFields))

	for _, field := range metadata.CustomFields {
		log.Printf("📍 Processing field: %s = %s", field.VariableName, field.Value)
		
		switch field.VariableName {
		case "pickup_location":
			// Try to parse as JSON array first
			var coords []float64
			if err := json.Unmarshal([]byte(field.Value), &coords); err == nil && len(coords) >= 2 {
				pickupLng = coords[0]
				pickupLat = coords[1]
				hasPickupLat = true
				hasPickupLng = true
				log.Printf("✅ Parsed pickup_location array: [%.6f, %.6f]", pickupLng, pickupLat)
			} else {
				log.Printf("❌ Failed to parse pickup_location as array: %v", err)
			}
		case "dropoff_location":
			// Try to parse as JSON array first
			var coords []float64
			if err := json.Unmarshal([]byte(field.Value), &coords); err == nil && len(coords) >= 2 {
				dropoffLng = coords[0]
				dropoffLat = coords[1]
				hasDropoffLat = true
				hasDropoffLng = true
				log.Printf("✅ Parsed dropoff_location array: [%.6f, %.6f]", dropoffLng, dropoffLat)
			} else {
				log.Printf("❌ Failed to parse dropoff_location as array: %v", err)
			}
		case "pickup_lat":
			if lat, err := json.Number(field.Value).Float64(); err == nil {
				pickupLat = lat
				hasPickupLat = true
				log.Printf("✅ Parsed pickup_lat: %.6f", pickupLat)
			} else {
				log.Printf("❌ Failed to parse pickup_lat: %v", err)
			}
		case "pickup_lng", "pickup_lon":
			if lng, err := json.Number(field.Value).Float64(); err == nil {
				pickupLng = lng
				hasPickupLng = true
				log.Printf("✅ Parsed pickup_lng: %.6f", pickupLng)
			} else {
				log.Printf("❌ Failed to parse pickup_lng: %v", err)
			}
		case "dropoff_lat":
			if lat, err := json.Number(field.Value).Float64(); err == nil {
				dropoffLat = lat
				hasDropoffLat = true
				log.Printf("✅ Parsed dropoff_lat: %.6f", dropoffLat)
			} else {
				log.Printf("❌ Failed to parse dropoff_lat: %v", err)
			}
		case "dropoff_lng", "dropoff_lon":
			if lng, err := json.Number(field.Value).Float64(); err == nil {
				dropoffLng = lng
				hasDropoffLng = true
				log.Printf("✅ Parsed dropoff_lng: %.6f", dropoffLng)
			} else {
				log.Printf("❌ Failed to parse dropoff_lng: %v", err)
			}
		}
	}

	// Validate pickup coordinates
	if hasPickupLat && hasPickupLng {
		// Basic coordinate validation
		if pickupLat >= -90 && pickupLat <= 90 && pickupLng >= -180 && pickupLng <= 180 {
			pickup = []float64{pickupLng, pickupLat}
			log.Printf("✅ Valid pickup coordinates: [%.6f, %.6f]", pickupLng, pickupLat)
		} else {
			log.Printf("❌ Invalid pickup coordinates: lat=%.6f, lng=%.6f", pickupLat, pickupLng)
		}
	} else {
		log.Printf("⚠️ Incomplete pickup coordinates: hasLat=%v, hasLng=%v", hasPickupLat, hasPickupLng)
	}

	// Validate dropoff coordinates
	if hasDropoffLat && hasDropoffLng {
		// Basic coordinate validation
		if dropoffLat >= -90 && dropoffLat <= 90 && dropoffLng >= -180 && dropoffLng <= 180 {
			dropoff = []float64{dropoffLng, dropoffLat}
			log.Printf("✅ Valid dropoff coordinates: [%.6f, %.6f]", dropoffLng, dropoffLat)
		} else {
			log.Printf("❌ Invalid dropoff coordinates: lat=%.6f, lng=%.6f", dropoffLat, dropoffLng)
		}
	} else {
		log.Printf("⚠️ Incomplete dropoff coordinates: hasLat=%v, hasLng=%v", hasDropoffLat, hasDropoffLng)
	}

	// Check if pickup and dropoff are the same (problematic case from your logs)
	if pickup != nil && dropoff != nil {
		if pickup[0] == dropoff[0] && pickup[1] == dropoff[1] {
			log.Printf("⚠️ WARNING: Pickup and dropoff coordinates are identical! This will create a trivial route.")
			log.Printf("🔍 Consider using fallback addresses: pickup='%s', dropoff='%s'", metadata.PickupAddress, metadata.DropoffAddress)
		}
	}

	return pickup, dropoff
}
// FIXED: Enhanced GraphQL request function with better error handling
func (ph *PaystackHandler) sendGraphQLRequest(ctx context.Context, query string, variables map[string]interface{}) error {
	// Validate GraphQL endpoint
	if ph.graphqlEndpoint == "" {
		return fmt.Errorf("GraphQL endpoint not configured")
	}

	request := GraphQLRequest{
		Query:     query,
		Variables: variables,
	}

	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("error marshaling GraphQL request: %w", err)
	}

	log.Printf("🔄 Sending GraphQL request to %s", ph.graphqlEndpoint)
	log.Printf("📦 GraphQL variables: %+v", variables)

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", ph.graphqlEndpoint, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("error creating HTTP request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	
	// ADDED: Optional authentication header if needed
	// if authToken := os.Getenv("GRAPHQL_AUTH_TOKEN"); authToken != "" {
	// 	req.Header.Set("Authorization", "Bearer " + authToken)
	// }

	// Send request
	client := &http.Client{Timeout: 30 * time.Second} // Increased timeout
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("error sending GraphQL request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("error reading GraphQL response: %w", err)
	}

	log.Printf("📄 GraphQL response status: %d", resp.StatusCode)
	log.Printf("📄 GraphQL response headers: %+v", resp.Header)
	log.Printf("📄 GraphQL response body (first 500 chars): %.500s", string(body))

	// Check HTTP status
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("GraphQL request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Check if response is JSON
	if !strings.Contains(resp.Header.Get("Content-Type"), "application/json") {
		return fmt.Errorf("GraphQL endpoint returned non-JSON response (Content-Type: %s): %s", 
			resp.Header.Get("Content-Type"), string(body))
	}

	// Parse GraphQL response
	var graphqlResp GraphQLResponse
	if err := json.Unmarshal(body, &graphqlResp); err != nil {
		return fmt.Errorf("error parsing GraphQL response: %w (response: %s)", err, string(body))
	}

	// Check for GraphQL errors
	if len(graphqlResp.Errors) > 0 {
		return fmt.Errorf("GraphQL errors: %v", graphqlResp.Errors)
	}

	log.Printf("✅ GraphQL request completed successfully")
	return nil
}

// FIXED: Enhanced booking completion function with better metadata handling
func (ph *PaystackHandler) completeBookingAfterPaymentold(bookingID string, metadata *BookingMetadata) {
	// Add a small delay to ensure payment record is fully committed
	time.Sleep(1 * time.Second)

	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second) // Increased timeout
	defer cancel()

	log.Printf("🔄 Starting booking completion for booking ID: %s after payment success", bookingID)

	// FIXED: Extract coordinates and other data from metadata
	var deliveryAddress string
	var ridersID string
	var rangeMetaID string
	var pickupLocation, dropoffLocation []float64

	if metadata != nil {
		deliveryAddress = metadata.DropoffAddress
		ridersID = metadata.RiderID

		// Extract coordinates from custom fields
		pickupLocation, dropoffLocation = ph.extractCoordinatesFromMetadata(metadata)

		// Extract range_meta_id from custom fields
		for _, field := range metadata.CustomFields {
			if field.VariableName == "range_meta_id" && field.Value != "" {
				rangeMetaID = field.Value
				break
			}
		}

		log.Printf("📍 Extracted metadata - Rider: %s, Pickup: %v, Dropoff: %v, DeliveryAddr: %s, RangeMetaID: %s", 
			ridersID, pickupLocation, dropoffLocation, deliveryAddress, rangeMetaID)
	}

	// FIXED: Prepare GraphQL mutation variables with corrected structure
	input := AddBookCoordinateInput{
		BookID: bookingID,
	}

	// Add optional fields only if they have values
	if deliveryAddress != "" {
		input.DeliveryAddress = &deliveryAddress
	}
	if ridersID != "" {
		input.RidersID = &ridersID
	}
	if rangeMetaID != "" {
		input.RangeMetaID = &rangeMetaID
	}
	if len(pickupLocation) >= 2 {
		input.PickupLocation = pickupLocation
	}
	if len(dropoffLocation) >= 2 {
		input.DropoffLocation = dropoffLocation
	}

	variables := map[string]interface{}{
		"input": input,
	}

	// FIXED: GraphQL mutation with correct field names
	mutation := `
		mutation UpdateMultipleBookingsWithLocation($input: addBookCoordinateInput!) {
			updateMultipleBookingsWithLocation(input: $input) {
				id
				deliveryAddress
				dropoffLocation
				pickupLocation
				riderId
				isConfirmed
				updatedAt
			}
		}
	`

	// Send GraphQL request
	err := ph.sendGraphQLRequest(ctx, mutation, variables)
	if err != nil {
		log.Printf("❌ Failed to complete booking %s via GraphQL: %v", bookingID, err)
		
		// Store failure for retry/manual review
		ph.handleBookingCompletionFailure(bookingID, metadata, err)
		return
	}

	log.Printf("🎉 Successfully completed booking %s after payment confirmation", bookingID)
}
// ENHANCED: Improved booking completion function with better metadata handling and validation
func (ph *PaystackHandler) completeBookingAfterPayment(bookingID string, metadata *BookingMetadata) {
	// Add a delay to ensure payment record is fully committed
	time.Sleep(2 * time.Second) // Increased delay

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second) // Increased timeout
	defer cancel()

	log.Printf("🔄 Starting booking completion for booking ID: %s after payment success", bookingID)

	// ENHANCED: Extract coordinates and other data from metadata with better validation
	var deliveryAddress string
	var ridersID string
	var rangeMetaID string
	var pickupLocation, dropoffLocation []float64

	if metadata != nil {
		deliveryAddress = metadata.DropoffAddress
		ridersID = metadata.RiderID

		// Extract coordinates from custom fields with enhanced logging
		pickupLocation, dropoffLocation = ph.extractCoordinatesFromMetadata(metadata)

		// Extract range_meta_id from custom fields
		for _, field := range metadata.CustomFields {
			if field.VariableName == "range_meta_id" && field.Value != "" {
				rangeMetaID = field.Value
				break
			}
		}

		log.Printf("📍 Extracted metadata - Rider: %s, Pickup: %v, Dropoff: %v, DeliveryAddr: %s, RangeMetaID: %s", 
			ridersID, pickupLocation, dropoffLocation, deliveryAddress, rangeMetaID)

		// ADDED: Validate extracted coordinates
		if pickupLocation != nil && dropoffLocation != nil {
			if pickupLocation[0] == dropoffLocation[0] && pickupLocation[1] == dropoffLocation[1] {
				log.Printf("⚠️ WARNING: Extracted coordinates are identical! This may cause route generation issues.")
				log.Printf("🔍 Consider checking the source data in custom fields")
			}
		}
	} else {
		log.Printf("⚠️ WARNING: No metadata provided for booking completion")
	}

	// ENHANCED: More robust input preparation
	input := AddBookCoordinateInput{
		BookID: bookingID,
	}

	// Add optional fields only if they have valid values
	if deliveryAddress != "" {
		input.DeliveryAddress = &deliveryAddress
		log.Printf("✅ Added delivery address: %s", deliveryAddress)
	}
	if ridersID != "" {
		input.RidersID = &ridersID
		log.Printf("✅ Added rider ID: %s", ridersID)
	}
	if rangeMetaID != "" {
		input.RangeMetaID = &rangeMetaID
		log.Printf("✅ Added range meta ID: %s", rangeMetaID)
	}
	if len(pickupLocation) >= 2 {
		input.PickupLocation = pickupLocation
		log.Printf("✅ Added pickup location: [%.6f, %.6f]", pickupLocation[0], pickupLocation[1])
	}
	if len(dropoffLocation) >= 2 {
		input.DropoffLocation = dropoffLocation
		log.Printf("✅ Added dropoff location: [%.6f, %.6f]", dropoffLocation[0], dropoffLocation[1])
	}

	variables := map[string]interface{}{
		"input": input,
	}

	// ENHANCED: GraphQL mutation with better error context
	mutation := `
		mutation UpdateMultipleBookingsWithLocation($input: addBookCoordinateInput!) {
			updateMultipleBookingsWithLocation(input: $input) {
				id
				deliveryAddress
				dropoffLocation
				pickupLocation
				riderId
				isConfirmed
				updatedAt
				distance
				duration
			}
		}
	`

	log.Printf("🚀 Sending GraphQL mutation with variables: %+v", variables)

	// Send GraphQL request with enhanced error handling
	err := ph.sendGraphQLRequest(ctx, mutation, variables)
	if err != nil {
		log.Printf("❌ Failed to complete booking %s via GraphQL: %v", bookingID, err)
		
		// ENHANCED: Better failure handling with more context
		ph.handleBookingCompletionFailure(bookingID, metadata, err)
		
		// ADDED: Attempt to store partial booking data for manual review
		if ph.redisClient != nil {
			partialData := map[string]interface{}{
				"booking_id":        bookingID,
				"pickup_location":   pickupLocation,
				"dropoff_location":  dropoffLocation,
				"delivery_address":  deliveryAddress,
				"rider_id":          ridersID,
				"range_meta_id":     rangeMetaID,
				"error":             err.Error(),
				"timestamp":         time.Now().Unix(),
			}
			
			jsonData, _ := json.Marshal(partialData)
			key := fmt.Sprintf("booking_partial_data:%s", bookingID)
			
			ctx := context.Background()
			ph.redisClient.Set(ctx, key, jsonData, 48*time.Hour) // Store for 48 hours
			
			log.Printf("🔴 Stored partial booking data in Redis for manual review: %s", key)
		}
		
		return
	}

	log.Printf("🎉 Successfully completed booking %s after payment confirmation", bookingID)
}
// Handle booking completion failures
func (ph *PaystackHandler) handleBookingCompletionFailure(bookingID string, metadata *BookingMetadata, err error) {
	// Log the failure
	log.Printf("💔 Booking completion failed for booking %s: %v", bookingID, err)

	// Store failure data for retry/manual review
	if ph.redisClient != nil {
		failureData := map[string]interface{}{
			"booking_id": bookingID,
			"error":      err.Error(),
			"timestamp":  time.Now().Unix(),
			"metadata":   metadata,
		}

		jsonData, _ := json.Marshal(failureData)
		key := fmt.Sprintf("booking_completion_failure:%s:%d", bookingID, time.Now().Unix())
		
		ctx := context.Background()
		ph.redisClient.Set(ctx, key, jsonData, 24*time.Hour) // Store for 24 hours
		
		log.Printf("🔴 Stored booking completion failure in Redis: %s", key)
	}
}

// extractOrderIDFromReference extracts order ID from Paystack reference
func (ph *PaystackHandler) extractOrderIDFromReference(reference string) (string, error) {
	// Split by underscore
	parts := strings.Split(reference, "_")
	
	// Expected format: ["PAY", "BOOKINGID", "TIMESTAMP", "RANDOM"]
	if len(parts) < 3 {
		return "", fmt.Errorf("invalid reference format: expected PAY_BOOKINGID_TIMESTAMP_RANDOM, got %s", reference)
	}
	
	// Check prefix
	if parts[0] != "PAY" {
		return "", fmt.Errorf("invalid reference prefix: expected PAY, got %s", parts[0])
	}
	
	// Extract booking ID (second part)
	bookingID := parts[1]
	if bookingID == "" {
		return "", fmt.Errorf("empty ID in reference: %s", reference)
	}
	
	return bookingID, nil
}

// handleChargeFailed processes failed charge events
func (ph *PaystackHandler) handleChargeFailed(data json.RawMessage) error {
	var transactionData PaystackTransactionData
	if err := json.Unmarshal(data, &transactionData); err != nil {
		return fmt.Errorf("error unmarshaling transaction data: %w", err)
	}

	log.Printf("Processing failed charge for reference: %s, message: %s",
		transactionData.Reference, transactionData.Message)

	// Extract order ID from reference
	orderID, err := ph.extractOrderIDFromReference(transactionData.Reference)
	if err != nil {
		return fmt.Errorf("error extracting order ID from reference %s: %w", transactionData.Reference, err)
	}

	// Parse failed timestamp
	failedAt := time.Now()

	// Convert metadata to string pointer
	var metadataStr *string
	if len(transactionData.Metadata) > 0 {
		str := string(transactionData.Metadata)
		metadataStr = &str
	}

	// Create new payment record for the failed attempt
	payment := &model.Payment{
		OrderID:           orderID,
		PaystackID:        transactionData.ID.String(),
		PaystackReference: transactionData.Reference,
		Amount:            transactionData.Amount,
		Currency:          transactionData.Currency,
		Method:            ph.mapChannelToPaymentMethod(transactionData.Channel),
		Status:            model.PaymentStatusFailed,
		FailedAt:          &failedAt,
		GatewayResponse:   &transactionData.GatewayResponse,
		FailureReason:     &transactionData.Message,
		
		// Customer information
		CustomerEmail: transactionData.Customer.Email,
		CustomerName:  fmt.Sprintf("%s %s", transactionData.Customer.FirstName, transactionData.Customer.LastName),
		CustomerPhone: &transactionData.Customer.Phone,
		CustomerCode:  &transactionData.Customer.CustomerCode,
		
		Metadata:        metadataStr,
		WebhookVerified: true,
	}

	// Save the failed payment record
	if err := ph.db.Create(payment).Error; err != nil {
		return fmt.Errorf("error creating failed payment record: %w", err)
	}

	log.Printf("Successfully created failed payment record ID: %d for order: %s", payment.ID, orderID)
	return nil
}

// mapChannelToPaymentMethod maps Paystack channel to our PaymentMethod enum
func (ph *PaystackHandler) mapChannelToPaymentMethod(channel string) model.PaymentMethod {
	switch channel {
	case "card":
		return model.PaymentMethodCard
	case "mobile_money":
		return model.PaymentMethodMobileMoney
	case "bank":
		return model.PaymentMethodBankTransfer
	case "ussd":
		return model.PaymentMethodUssd
	case "qr":
		return model.PaymentMethodQR
	default:
		return model.PaymentMethodCard // Default fallback
	}
}

// handleTransferSuccess processes successful transfer events
func (ph *PaystackHandler) handleTransferSuccess(data json.RawMessage) error {
	log.Println("Processing successful transfer event")
	return nil
}

// handleTransferFailed processes failed transfer events
func (ph *PaystackHandler) handleTransferFailed(data json.RawMessage) error {
	log.Println("Processing failed transfer event")
	return nil
}

// handleCustomerIdentificationSuccess processes successful customer identification
func (ph *PaystackHandler) handleCustomerIdentificationSuccess(data json.RawMessage) error {
	log.Println("Processing successful customer identification event")
	return nil
}

// handleCustomerIdentificationFailed processes failed customer identification
func (ph *PaystackHandler) handleCustomerIdentificationFailed(data json.RawMessage) error {
	log.Println("Processing failed customer identification event")
	return nil
}